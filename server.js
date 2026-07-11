const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PLACES_FILE = path.join(DATA_DIR, "places.json");
const STATS_FILE = process.env.KTRAVEL_STATS_FILE
  ? path.resolve(process.env.KTRAVEL_STATS_FILE)
  : path.join(DATA_DIR, "game-stats.json");
const PORT = Number(process.env.PORT || process.argv[2] || 4174);
const MIN_PLACE_COUNT = 64;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

function emptyStats() {
  return {
    totalCompletedGames: 0,
    winners: {},
    recentResults: [],
    recordedGameIds: [],
    updatedAt: null
  };
}

function normalizeStats(input = {}) {
  return {
    totalCompletedGames: Number(input.totalCompletedGames || 0),
    winners: input.winners && typeof input.winners === "object" ? input.winners : {},
    recentResults: Array.isArray(input.recentResults) ? input.recentResults.slice(0, 20) : [],
    recordedGameIds: Array.isArray(input.recordedGameIds) ? input.recordedGameIds.slice(-500) : [],
    updatedAt: input.updatedAt || null
  };
}

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(STATS_FILE);
  } catch {
    await writeStats(emptyStats());
  }
}

async function readPlaces() {
  const raw = await fsp.readFile(PLACES_FILE, "utf8");
  const places = JSON.parse(raw);
  if (!Array.isArray(places) || places.length < MIN_PLACE_COUNT) {
    throw new Error(`places.json에는 최소 ${MIN_PLACE_COUNT}개의 후보가 필요합니다.`);
  }
  return places;
}

async function readStats() {
  await ensureStorage();
  try {
    return normalizeStats(JSON.parse(await fsp.readFile(STATS_FILE, "utf8")));
  } catch {
    const stats = emptyStats();
    await writeStats(stats);
    return stats;
  }
}

async function writeStats(stats) {
  await fsp.mkdir(path.dirname(STATS_FILE), { recursive: true });
  await fsp.writeFile(STATS_FILE, `${JSON.stringify(normalizeStats(stats), null, 2)}\n`, "utf8");
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

async function readJson(req, maxBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("요청 데이터가 너무 큽니다.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("JSON 형식이 올바르지 않습니다.");
    error.statusCode = 400;
    throw error;
  }
}

function getTopWinner(stats, places) {
  const placeMap = new Map(places.map((place) => [place.id, place]));
  const ranked = Object.entries(stats.winners)
    .map(([id, wins]) => ({ place: placeMap.get(id), wins: Number(wins || 0) }))
    .filter((entry) => entry.place)
    .sort((left, right) => right.wins - left.wins || left.place.name.localeCompare(right.place.name, "ko"));
  return ranked[0] || null;
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "korea-travel-worldcup" });
  }

  if (req.method === "GET" && pathname === "/api/places") {
    return sendJson(res, 200, { places: await readPlaces() });
  }

  if (req.method === "GET" && pathname === "/api/stats") {
    const [stats, places] = await Promise.all([readStats(), readPlaces()]);
    return sendJson(res, 200, { ...stats, topWinner: getTopWinner(stats, places) });
  }

  if (req.method === "POST" && pathname === "/api/results") {
    const body = await readJson(req);
    const gameId = String(body.gameId || "").trim();
    const winnerId = String(body.winnerId || "").trim();
    const places = await readPlaces();
    const winner = places.find((place) => place.id === winnerId);
    if (!gameId || gameId.length > 120) return sendError(res, 400, "게임 ID가 올바르지 않습니다.");
    if (!winner) return sendError(res, 400, "우승 후보를 찾을 수 없습니다.");

    const stats = await readStats();
    if (!stats.recordedGameIds.includes(gameId)) {
      stats.totalCompletedGames += 1;
      stats.winners[winnerId] = Number(stats.winners[winnerId] || 0) + 1;
      stats.recentResults.unshift({
        gameId,
        winnerId,
        winnerName: winner.name,
        completedAt: new Date().toISOString()
      });
      stats.recordedGameIds.push(gameId);
      stats.updatedAt = new Date().toISOString();
      await writeStats(stats);
    }
    return sendJson(res, 200, { ...stats, topWinner: getTopWinner(stats, places) });
  }

  return false;
}

function safeStaticPath(pathname) {
  const requested = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const resolved = path.resolve(ROOT, requested);
  if (resolved !== ROOT && !resolved.startsWith(`${ROOT}${path.sep}`)) return null;
  return resolved;
}

async function serveStatic(req, res, pathname) {
  const filePath = safeStaticPath(pathname);
  if (!filePath) return sendError(res, 403, "접근할 수 없는 경로입니다.");
  try {
    const stat = await fsp.stat(filePath);
    const target = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const extension = path.extname(target).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=300"
    });
    fs.createReadStream(target).pipe(res);
  } catch {
    sendError(res, 404, "파일을 찾을 수 없습니다.");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
    const handled = await handleApi(req, res, url.pathname);
    if (handled !== false) return;
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || "서버 오류가 발생했습니다.");
  }
});

async function startServer() {
  await ensureStorage();
  if (server.listening) return server;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "0.0.0.0", () => {
      server.removeListener("error", reject);
      console.log(`Korea Travel Worldcup: http://localhost:${PORT}`);
      resolve();
    });
  });
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { server, startServer };

import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });

const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

async function aggregate(store, date) {
  const { blobs } = await store.list({ prefix: `${date}/` });
  const games = (await Promise.all(blobs.slice(0, 2000).map(({ key }) => store.get(key, { type: "json", consistency: "strong" })))).filter(Boolean);
  const winnerCounts = {};
  const matchCounts = {};

  for (const game of games) {
    winnerCounts[game.winnerId] = (winnerCounts[game.winnerId] || 0) + 1;
    for (const choice of game.choices || []) {
      const pair = [choice.leftId, choice.rightId].sort();
      const key = `${choice.roundSize}:${pair[0]}:${pair[1]}`;
      const current = matchCounts[key] || { total: 0, picks: {} };
      current.total += 1;
      current.picks[choice.winnerId] = (current.picks[choice.winnerId] || 0) + 1;
      matchCounts[key] = current;
    }
  }

  return { date, totalGames: games.length, winnerCounts, matchCounts };
}

export default async (request) => {
  const store = getStore({ name: "daily-sixteen-results", consistency: "strong" });
  const url = new URL(request.url);

  if (request.method === "GET") {
    const date = url.searchParams.get("date");
    if (!validDate(date)) return json({ error: "올바른 날짜가 필요합니다." }, 400);
    return json(await aggregate(store, date));
  }

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !validDate(body.date) || typeof body.gameId !== "string" || typeof body.winnerId !== "string") {
      return json({ error: "올바른 게임 결과가 필요합니다." }, 400);
    }
    const choices = Array.isArray(body.choices) ? body.choices.slice(0, 15) : [];
    if (choices.length !== 15) return json({ error: "완료된 16강 선택 기록이 필요합니다." }, 400);

    const cleanChoices = choices.map(({ roundSize, leftId, rightId, winnerId }) => ({
      roundSize: Number(roundSize),
      leftId: String(leftId),
      rightId: String(rightId),
      winnerId: String(winnerId)
    }));
    const safeGameId = body.gameId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
    await store.setJSON(`${body.date}/${safeGameId}`, {
      winnerId: body.winnerId,
      choices: cleanChoices,
      completedAt: new Date().toISOString()
    }, { onlyIfNew: true });

    return json(await aggregate(store, body.date));
  }

  return json({ error: "지원하지 않는 요청입니다." }, 405);
};

export const config = { path: "/api/daily-sixteen" };


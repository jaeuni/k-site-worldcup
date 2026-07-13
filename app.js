const STORAGE_STATS_KEY = "korea-travel-worldcup:stats:v1";
const TOURNAMENT_SIZE = 64;
const TOURNAMENT_SIZES = [16, 32, 64];
const DOKDO_TRIGGER_WINNER_ID = "place_090";
const DOKDO_DISCOVERY_RATE = 0.1;
const DOKDO_HIDDEN_ITEM = {
  title: "숨겨진 비경: 독도",
  eyebrow: "HIDDEN DESTINATION",
  imagePath: "./images/hidden/dokdo.png",
  description: "울릉도 동쪽의 푸른 동해 위에 솟은 화산섬입니다. 거친 바위 절벽과 맑은 바다가 만드는 풍경을 히든 여행지로 만나보세요.",
  imageCredit: "OpenAI ChatGPT Images로 생성한 AI 이미지"
};
const MAP_ASSET = {
  width: 800,
  height: 759,
  referenceLatitude: 37.566,
  referenceLongitude: 126.978,
  referenceX: 259,
  referenceY: 146,
  longitudePixelsPerDegree: 111,
  latitudePixelsPerDegree: 137
};
const REGION_CONFIG = {
  서울: { color: "#D64D66" },
  인천: { color: "#257AA6" },
  경기: { color: "#7562AD" },
  강원: { color: "#4A8A63" },
  대전: { color: "#C76086" },
  세종: { color: "#A7693A" },
  충북: { color: "#687A85" },
  충남: { color: "#B37B25" },
  광주: { color: "#D45C52" },
  전북: { color: "#A9573D" },
  전남: { color: "#2F837D" },
  부산: { color: "#087FB8" },
  울산: { color: "#3F74A7" },
  경남: { color: "#558341" },
  대구: { color: "#A45070" },
  경북: { color: "#7A634A" },
  제주: { color: "#177E89" }
};
const MAP_REGION_FILLS = {
  서울: "#d8cce9",
  인천: "#a9d5f2",
  경기: "#f7d87b",
  강원: "#efb4c2",
  대전: "#86d8d8",
  세종: "#f6bd60",
  충북: "#b9d98b",
  충남: "#c9c3e6",
  광주: "#f2a4a4",
  전북: "#f5ba71",
  전남: "#8fc1e7",
  부산: "#c6b0df",
  울산: "#efa8b7",
  경남: "#f2d36e",
  대구: "#e3b5c4",
  경북: "#a9d8ee",
  제주: "#a8cd78"
};
const MAP_REGION_LABELS = [
  { region: "서울", label: "서울특별시", x: 32.4, y: 15.2, zoom: true, compact: true },
  { region: "인천", label: "인천광역시", x: 15.4, y: 20.4, compact: true },
  { region: "경기", label: "경기도", x: 37.5, y: 27.5 },
  { region: "강원", label: "강원도", x: 53, y: 10.8 },
  { region: "충남", label: "충청남도", x: 28, y: 41.5 },
  { region: "충북", label: "충청북도", x: 48.5, y: 40.5 },
  { region: "세종", label: "세종특별자치시", x: 35.5, y: 35.2, compact: true },
  { region: "대전", label: "대전광역시", x: 38.2, y: 44.3, compact: true },
  { region: "전북", label: "전라북도", x: 34, y: 54.5 },
  { region: "광주", label: "광주광역시", x: 30.2, y: 62.8, compact: true },
  { region: "전남", label: "전라남도", x: 27.5, y: 70.2 },
  { region: "경북", label: "경상북도", x: 65.5, y: 37.8 },
  { region: "대구", label: "대구광역시", x: 54, y: 51.5, compact: true },
  { region: "경남", label: "경상남도", x: 52.5, y: 63.8 },
  { region: "울산", label: "울산광역시", x: 66.5, y: 56.5, compact: true },
  { region: "부산", label: "부산광역시", x: 66.5, y: 67.2, zoom: true, compact: true },
  { region: "제주", label: "제주특별자치도", x: 26, y: 94.2, compact: true },
  { label: "울릉도", x: 86.5, y: 17.2, island: true },
  { label: "독도", x: 94, y: 23.3, island: true }
];
const METRO_ZOOM_MAPS = {
  서울: { viewBox: "210 100 105 105", x: 210, y: 100, width: 105, height: 105, spread: 1.6 },
  부산: { viewBox: "440 420 120 115", x: 440, y: 420, width: 120, height: 115, spread: 1.75 }
};
const state = {
  view: "game",
  screen: "loading",
  places: [],
  stats: emptyStats(),
  game: null,
  tournamentSize: 32,
  dailyStats: null,
  category: "전체",
  season: "전체",
  mapRegion: "전체",
  mapSeason: "전체",
  mapSelectedId: null,
  mapZoomRegion: null,
  search: "",
  apiAvailable: true,
  message: "",
  selecting: false,
  savingResult: false,
  hiddenItemOpen: false
};

let searchComposing = false;

function emptyStats() {
  return {
    totalCompletedGames: 0,
    winners: {},
    recentResults: [],
    recordedGameIds: [],
    topWinner: null,
    updatedAt: null
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readLocalStats() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_STATS_KEY) || "null");
    return value && typeof value === "object" ? { ...emptyStats(), ...value } : emptyStats();
  } catch {
    return emptyStats();
  }
}

function writeLocalStats(stats) {
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
  } catch {
    // The game still works when storage is blocked.
  }
}

async function apiRequest(pathname, options = {}) {
  const response = await fetch(pathname, {
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `요청 실패 (${response.status})`);
  return payload;
}

function getPlaceById(id) {
  return state.places.find((place) => place.id === id) || null;
}

function computeTopWinner(stats) {
  const ranked = Object.entries(stats.winners || {})
    .map(([id, wins]) => ({ place: getPlaceById(id), wins: Number(wins || 0) }))
    .filter((entry) => entry.place)
    .sort((left, right) => right.wins - left.wins || left.place.name.localeCompare(right.place.name, "ko"));
  return ranked[0] || null;
}

function normalizeStats(input = {}) {
  const stats = {
    ...emptyStats(),
    ...input,
    totalCompletedGames: Number(input.totalCompletedGames || 0),
    winners: input.winners && typeof input.winners === "object" ? input.winners : {},
    recentResults: Array.isArray(input.recentResults) ? input.recentResults : [],
    recordedGameIds: Array.isArray(input.recordedGameIds) ? input.recordedGameIds : []
  };
  stats.topWinner = input.topWinner?.place ? input.topWinner : computeTopWinner(stats);
  return stats;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function dailyDateKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function seededShuffle(items, seedText) {
  let seed = 2166136261;
  for (const character of seedText) { seed ^= character.charCodeAt(0); seed = Math.imul(seed, 16777619); }
  const random = () => { seed += 0x6d2b79f5; let value = seed; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const swapIndex = Math.floor(random() * (index + 1)); [result[index], result[swapIndex]] = [result[swapIndex], result[index]]; }
  return result;
}

function startDailyGame() {
  const date = dailyDateKey();
  const entrants = seededShuffle(state.places, `k-site:${date}`).slice(0, 16);
  state.dailyStats = null;
  state.game = { id: createGameId(), mode: "daily", date, initialSize: 16, roundSize: 16, currentRound: entrants, nextRound: [], matchCursor: 0, completedMatches: 0, totalMatches: 15, winner: null, choices: [], dokdoDiscovery: null };
  state.screen = "match";
  state.selecting = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

async function recordDailyResult(winner) {
  try {
    const response = await fetch("/api/daily-sixteen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: state.game.date, gameId: state.game.id, winnerId: winner.id, choices: state.game.choices }) });
    if (!response.ok) throw new Error();
    state.dailyStats = await response.json();
  } catch { state.dailyStats = { unavailable: true }; }
  render();
}

function renderDailyComparison(winner) {
  if (state.game?.mode !== "daily") return "";
  if (!state.dailyStats) return `<section class="daily-comparison"><p>오늘의 선택 통계를 집계하고 있습니다…</p></section>`;
  if (state.dailyStats.unavailable) return `<section class="daily-comparison"><p>게임은 정상 완료됐지만 통계 서비스에 잠시 연결할 수 없습니다.</p></section>`;
  const total = state.dailyStats.totalGames || 0;
  const winnerRate = total ? Math.round(((state.dailyStats.winnerCounts?.[winner.id] || 0) / total) * 100) : 0;
  let compared = 0;
  let agreed = 0;
  for (const choice of state.game.choices) { const pair = [choice.leftId, choice.rightId].sort(); const match = state.dailyStats.matchCounts?.[`${choice.roundSize}:${pair[0]}:${pair[1]}`]; if (!match?.total) continue; compared += 1; const majority = Object.entries(match.picks).sort((a, b) => b[1] - a[1])[0]?.[0]; if (majority === choice.winnerId) agreed += 1; }
  const agreement = compared ? Math.round((agreed / compared) * 100) : 0;
  return `<section class="daily-comparison"><span class="eyebrow">TODAY'S COMPARISON</span><h2>오늘의 취향 비교</h2><div class="daily-metrics"><div><strong>${total}</strong><span>오늘 완주</span></div><div><strong>${winnerRate}%</strong><span>${escapeHtml(winner.name)} 우승 선택</span></div><div><strong>${agreement}%</strong><span>전체 선택과 일치</span></div></div></section>`;
}

function createGameId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `place-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stableDiscoveryRoll(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function resolveDokdoDiscovery(game, winner) {
  if (winner.id === DOKDO_TRIGGER_WINNER_ID) {
    return { available: true, guaranteed: true };
  }
  return {
    available: stableDiscoveryRoll(game.id) < DOKDO_DISCOVERY_RATE,
    guaranteed: false
  };
}

function roundLabel(size) {
  if (size === 2) return "결승";
  if (size === 4) return "준결승";
  return `${size}강`;
}

function startGame(size = state.tournamentSize) {
  const tournamentSize = TOURNAMENT_SIZES.includes(Number(size)) ? Number(size) : 32;
  state.tournamentSize = tournamentSize;
  const entrants = shuffle(state.places).slice(0, tournamentSize);
  state.game = {
    id: createGameId(),
    initialSize: tournamentSize,
    roundSize: entrants.length,
    currentRound: entrants,
    nextRound: [],
    matchCursor: 0,
    completedMatches: 0,
    totalMatches: entrants.length - 1,
    winner: null,
    dokdoDiscovery: null
  };
  state.screen = "match";
  state.selecting = false;
  state.hiddenItemOpen = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function currentPair() {
  if (!state.game) return [];
  return state.game.currentRound.slice(state.game.matchCursor, state.game.matchCursor + 2);
}

async function choosePlace(placeId) {
  if (!state.game || state.selecting || state.screen !== "match") return;
  const pair = currentPair();
  const winner = pair.find((place) => place.id === placeId);
  if (!winner) return;

  state.selecting = true;
  if (state.game.mode === "daily") state.game.choices.push({ roundSize: state.game.roundSize, leftId: pair[0].id, rightId: pair[1].id, winnerId: winner.id });
  state.game.nextRound.push(winner);
  state.game.completedMatches += 1;
  const roundFinished = state.game.matchCursor + 2 >= state.game.currentRound.length;

  if (!roundFinished) {
    state.game.matchCursor += 2;
    state.selecting = false;
    render();
    return;
  }

  if (state.game.currentRound.length === 2) {
    state.game.winner = winner;
    state.game.dokdoDiscovery = resolveDokdoDiscovery(state.game, winner);
    state.hiddenItemOpen = false;
    state.screen = "result";
    state.selecting = false;
    render();
    await recordResult(winner);
    if (state.game.mode === "daily") await recordDailyResult(winner);
    return;
  }

  state.game.currentRound = state.game.mode === "daily" ? [...state.game.nextRound] : shuffle(state.game.nextRound);
  state.game.roundSize = state.game.currentRound.length;
  state.game.nextRound = [];
  state.game.matchCursor = 0;
  state.selecting = false;
  render();
}

async function recordResult(winner) {
  state.savingResult = true;
  render();
  try {
    if (state.apiAvailable) {
      const payload = await apiRequest("/api/results", {
        method: "POST",
        body: JSON.stringify({ gameId: state.game.id, winnerId: winner.id })
      });
      state.stats = normalizeStats(payload);
    } else {
      const stats = normalizeStats(readLocalStats());
      if (!stats.recordedGameIds.includes(state.game.id)) {
        stats.totalCompletedGames += 1;
        stats.winners[winner.id] = Number(stats.winners[winner.id] || 0) + 1;
        stats.recordedGameIds.push(state.game.id);
        stats.recentResults.unshift({
          gameId: state.game.id,
          winnerId: winner.id,
          winnerName: winner.name,
          completedAt: new Date().toISOString()
        });
        stats.updatedAt = new Date().toISOString();
        stats.topWinner = computeTopWinner(stats);
        writeLocalStats(stats);
      }
      state.stats = stats;
    }
  } catch (error) {
    state.message = `우승 기록 저장 실패: ${error.message}`;
  } finally {
    state.savingResult = false;
    render();
  }
}

function restartGame() {
  state.game = null;
  state.screen = "setup";
  state.message = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
}

function originalImagePath(place) {
  return place.imagePath || `/images/places/${place.id}.png`;
}

function imageVariantPath(place, variant = "main") {
  const originalPath = originalImagePath(place);
  const match = originalPath.match(/^(.*\/)places\/([^/?]+)\.[^/?]+(?:\?.*)?$/);
  if (!match) return originalPath;

  const folder = {
    main: "optimized",
    thumbnail: "thumbnails",
    map: "map-thumbs"
  }[variant] || "optimized";

  return `${match[1]}${folder}/${match[2]}.webp`;
}

function renderResponsiveImage(place, { variant = "main", className, alt, loading = "lazy", fetchPriority = "" }) {
  const priority = fetchPriority ? ` fetchpriority="${fetchPriority}"` : "";
  return `
    <img
      class="${className}"
      src="${escapeHtml(imageVariantPath(place, variant))}"
      data-fallback-src="${escapeHtml(originalImagePath(place))}"
      alt="${escapeHtml(alt)}"
      loading="${loading}"
      decoding="async"${priority}
    />
  `;
}

function renderPlaceArt(place, size = "large") {
  if (place.imagePath) {
    const isSmallArt = size === "grid" || size === "mini";
    return renderResponsiveImage(place, {
      variant: isSmallArt ? "thumbnail" : "main",
      className: `place-art place-art-${size} place-photo`,
      alt: `${place.name} 실사 이미지`,
      loading: size === "hero" || size === "match" || size === "winner" ? "eager" : "lazy",
      fetchPriority: size === "hero" || size === "match" ? "high" : ""
    });
  }

  const baseShapes = {
    heritage: `<path d="M112 348H528L480 278H160Z" fill="#FFFFFF" opacity=".92"/><path d="M128 278L320 162L512 278Z" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="18" stroke-linejoin="round"/><path d="M206 346V266M320 346V236M434 346V266" stroke="${escapeHtml(place.accent)}" stroke-width="16"/>`,
    city: `<path d="M114 368V246H188V368M202 368V180H286V368M300 368V226H388V368M402 368V142H506V368" fill="#FFFFFF" opacity=".9"/><path d="M142 278H164M142 310H164M228 220H260M228 258H260M328 266H360M328 300H360M432 186H476M432 228H476M432 270H476" stroke="${escapeHtml(place.accent)}" stroke-width="11"/>`,
    tower: `<path d="M320 116L355 354H285Z" fill="#FFFFFF" opacity=".9"/><path d="M320 88V160M282 160H358M300 224H340M270 354H370" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linecap="round"/>`,
    mountain: `<path d="M74 380L220 176L322 312L414 206L582 380Z" fill="#FFFFFF" opacity=".92"/><path d="M74 380L220 176L322 312L414 206L582 380" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="17" stroke-linejoin="round"/>`,
    forest: `<path d="M148 370V252M246 370V190M344 370V234M442 370V164" stroke="${escapeHtml(place.accent)}" stroke-width="18" stroke-linecap="round"/><path d="M100 278L148 188L196 278ZM188 234L246 126L304 234ZM296 258L344 166L392 258ZM376 214L442 98L508 214Z" fill="#FFFFFF" opacity=".92"/>`,
    coast: `<path d="M76 302C150 260 208 340 280 298S414 260 486 302S540 326 592 284V398H76Z" fill="#FFFFFF" opacity=".92"/><path d="M80 318C150 276 208 356 280 314S414 276 486 318S540 342 588 300" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linecap="round"/>`,
    island: `<path d="M90 374C182 266 268 328 350 268C420 218 480 248 552 374Z" fill="#FFFFFF" opacity=".92"/><path d="M98 376C182 268 268 330 350 270C420 220 480 250 544 376" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="17"/>`,
    river: `<path d="M60 382C132 312 224 430 300 354S444 282 580 370" fill="none" stroke="#FFFFFF" stroke-width="54" opacity=".92"/><path d="M60 382C132 312 224 430 300 354S444 282 580 370" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="15"/>`,
    lake: `<ellipse cx="320" cy="328" rx="236" ry="80" fill="#FFFFFF" opacity=".92"/><path d="M108 328C188 290 250 360 326 326S456 292 532 330" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="15"/>`,
    canyon: `<path d="M116 378L198 162L310 378L418 132L532 378" fill="none" stroke="#FFFFFF" stroke-width="58" stroke-linecap="round" opacity=".9"/><path d="M116 378L198 162L310 378L418 132L532 378" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linecap="round"/>`,
    garden: `<path d="M320 374V198M320 268C248 250 226 188 238 148C300 158 322 206 320 268M320 300C386 280 420 224 408 184C346 196 318 244 320 300" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="17" stroke-linecap="round"/><circle cx="214" cy="158" r="42" fill="#FFFFFF" opacity=".92"/><circle cx="426" cy="194" r="42" fill="#FFFFFF" opacity=".92"/>`,
    village: `<path d="M132 370V282L218 212L304 282V370M336 370V252L432 176L528 252V370" fill="#FFFFFF" opacity=".92"/><path d="M132 370V282L218 212L304 282V370M336 370V252L432 176L528 252V370" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linejoin="round"/>`,
    street: `<path d="M112 370V238H220V370M248 370V168H374V370M402 370V228H528V370" fill="#FFFFFF" opacity=".92"/><path d="M158 278H180M288 218H334M288 262H334M444 270H488" stroke="${escapeHtml(place.accent)}" stroke-width="13"/>`,
    market: `<path d="M110 246H530L488 186H152Z" fill="#FFFFFF" opacity=".92"/><path d="M144 246V370H496V246M110 246H530L488 186H152Z" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linejoin="round"/><path d="M212 246V370M320 246V370M428 246V370" stroke="${escapeHtml(place.accent)}" stroke-width="13"/>`,
    theme: `<circle cx="320" cy="268" r="128" fill="#FFFFFF" opacity=".92"/><path d="M320 140V396M192 268H448M232 180L408 356M408 180L232 356" stroke="${escapeHtml(place.accent)}" stroke-width="16" stroke-linecap="round"/>`,
    wetland: `<path d="M96 370H544" stroke="#FFFFFF" stroke-width="54" opacity=".92"/><path d="M144 368V224M212 368V186M280 368V238M368 368V172M436 368V218M504 368V194" stroke="${escapeHtml(place.accent)}" stroke-width="13" stroke-linecap="round"/>`,
    cave: `<path d="M106 378C122 186 206 126 320 126S518 190 534 378Z" fill="#FFFFFF" opacity=".92"/><path d="M106 378C122 186 206 126 320 126S518 190 534 378" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="17"/>`
  };
  const base = baseShapes[place.visual] || baseShapes.mountain;
  return `
    <svg class="place-art place-art-${size}" viewBox="0 0 640 500" role="img" aria-label="${escapeHtml(place.name)} 일러스트" style="--place-bg:${escapeHtml(place.background)};--place-accent:${escapeHtml(place.accent)}">
      <rect width="640" height="500" fill="${escapeHtml(place.background)}"/>
      <circle cx="75" cy="78" r="34" fill="${escapeHtml(place.accent)}" opacity=".22"/>
      <circle cx="562" cy="120" r="54" fill="#FFFFFF" opacity=".42"/>
      <path d="M44 435 C120 388 168 462 245 420 S390 390 464 432 S560 445 620 400" fill="none" stroke="${escapeHtml(place.accent)}" stroke-width="18" opacity=".22"/>
      ${base}
      <text x="320" y="334" text-anchor="middle" dominant-baseline="middle" font-size="92">${escapeHtml(place.icon)}</text>
      <circle cx="516" cy="410" r="16" fill="${escapeHtml(place.accent)}"/>
      <circle cx="105" cy="250" r="11" fill="#FFFFFF" opacity=".8"/>
    </svg>
  `;
}

function renderSeasonMark(season) {
  const labels = {
    봄: "봄 추천",
    여름: "여름 추천",
    가을: "가을 추천",
    겨울: "겨울 추천",
    사철: "사철 추천"
  };
  const value = labels[season] ? season : "사철";
  const className = {
    봄: "is-spring",
    여름: "is-summer",
    가을: "is-autumn",
    겨울: "is-winter",
    사철: "is-all-season"
  }[value];
  return `<span class="season-mark ${className}" title="${labels[value]}" aria-label="${labels[value]}">${value}</span>`;
}

function getMapPosition(place) {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  const x =
    ((MAP_ASSET.referenceX + (longitude - MAP_ASSET.referenceLongitude) * MAP_ASSET.longitudePixelsPerDegree) /
      MAP_ASSET.width) *
    100;
  const y =
    ((MAP_ASSET.referenceY + (MAP_ASSET.referenceLatitude - latitude) * MAP_ASSET.latitudePixelsPerDegree) /
      MAP_ASSET.height) *
    100;
  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(98, Math.max(2, y))
  };
}

function mapPinClasses(place) {
  const { x, y } = getMapPosition(place);
  const classes = [];
  if (x > 79) classes.push("is-edge-right");
  if (x < 15) classes.push("is-edge-left");
  if (y < 18) classes.push("is-near-top");
  return classes.join(" ");
}

function filteredMapPlaces() {
  return state.places.filter((place) => {
    const regionMatch = state.mapRegion === "전체" || place.region === state.mapRegion;
    const seasonMatch = state.mapSeason === "전체" || place.season === state.mapSeason;
    return regionMatch && seasonMatch;
  });
}

function renderHeader() {
  return `
    <header class="topbar">
      <button class="brand" type="button" data-action="home" aria-label="한국 여행지 월드컵 홈">
        <span class="brand-mark">64</span>
        <span>
          <strong>한국 여행지 월드컵</strong>
          <small>내가 가장 가고 싶은 곳은 어디일까요?</small>
        </span>
      </button>
      <nav class="nav-tabs" aria-label="주요 메뉴">
        <a class="nav-tab hub-link" href="https://k-worldcup-hub.netlify.app/" aria-label="전체 월드컵 게임으로 돌아가기">← 전체 게임</a>
        <button class="nav-tab ${state.view === "game" ? "is-active" : ""}" type="button" data-view="game">게임</button>
        <button class="nav-tab ${state.view === "places" ? "is-active" : ""}" type="button" data-view="places">후보 ${state.places.length || TOURNAMENT_SIZE}</button>
        <button class="nav-tab ${state.view === "map" ? "is-active" : ""}" type="button" data-view="map">관광지도</button>
        <button class="nav-tab ${state.view === "rights" ? "is-active" : ""}" type="button" data-view="rights">이미지 정책</button>
      </nav>
    </header>
  `;
}

function renderSetup() {
  const top = state.stats.topWinner;
  return `
    <main class="main">
      <section class="setup-band">
        <div class="setup-copy">
          <span class="eyebrow">KOREA TRAVEL TOURNAMENT</span>
          <h1>당신의 최애 여행지는<br />어디까지 살아남을까요?</h1>
          <p>궁궐과 골목, 산과 바다, 도시의 야경까지 전국 ${state.places.length.toLocaleString("ko-KR")}곳 중 원하는 경기 규모를 골라 시작하세요.</p>
          <div class="tournament-options" role="group" aria-label="토너먼트 규모 선택">
            <button class="tournament-option" type="button" data-tournament-size="16"><strong>16강</strong><small>빠르게 · 15번 선택</small></button>
            <button class="tournament-option is-recommended" type="button" data-tournament-size="32"><span>추천</span><strong>32강</strong><small>적당하게 · 31번 선택</small></button>
            <button class="tournament-option" type="button" data-tournament-size="64"><strong>64강</strong><small>깊이 있게 · 63번 선택</small></button>
          </div>
          <button class="daily-challenge" type="button" data-action="start-daily"><span>매일 자정 갱신</span><strong>오늘의 16강</strong><small>모두 같은 후보 · 완료 후 취향 통계 비교</small></button>
        </div>
        <div class="setup-visual" aria-hidden="true">
          ${renderPlaceArt(state.places[0], "hero")}
          <div class="floating-place floating-place-one">${state.places[8] ? renderPlaceArt(state.places[8], "mini") : ""}</div>
          <div class="floating-place floating-place-two">${state.places[56] ? renderPlaceArt(state.places[56], "mini") : ""}</div>
        </div>
      </section>

      <section class="stats-band" aria-label="게임 통계">
        <div>
          <span>완료된 게임</span>
          <strong>${state.stats.totalCompletedGames.toLocaleString("ko-KR")}</strong>
        </div>
        <div>
          <span>후보 풀</span>
          <strong>${state.places.length.toLocaleString("ko-KR")}</strong>
        </div>
        <div>
          <span>누적 최다 우승</span>
          <strong>${top ? `${escapeHtml(top.place.name)} · ${top.wins}회` : "첫 우승을 기다리는 중"}</strong>
        </div>
      </section>

      <section class="category-band">
        <div class="section-heading">
          <div>
            <span class="eyebrow">THE FIELD</span>
            <h2>여덟 가지 여행 테마의 대진표</h2>
          </div>
          <button class="text-button" type="button" data-view="places">후보 전체 보기 →</button>
        </div>
        <div class="category-grid">
          ${[...new Set(state.places.map((place) => place.category))]
            .map((category) => {
              const sample = state.places.find((place) => place.category === category);
              const count = state.places.filter((place) => place.category === category).length;
              return `
                <button class="category-item" type="button" data-category-link="${escapeHtml(category)}">
                  <span class="category-icon">${escapeHtml(sample?.icon || "🧭")}</span>
                  <span><strong>${escapeHtml(category)}</strong><small>${count}개 후보</small></span>
                </button>
              `;
            })
            .join("")}
        </div>
      </section>
    </main>
  `;
}

function renderMatchCard(place, side) {
  return `
    <button class="match-card match-card-${side}" type="button" data-pick="${escapeHtml(place.id)}">
      <span class="pick-label">선택</span>
      <span class="match-art">${renderPlaceArt(place, "match")}</span>
      <span class="match-content">
        <span class="place-meta">${escapeHtml(place.category)} · ${escapeHtml(place.region)} ${renderSeasonMark(place.season)}</span>
        <strong>${escapeHtml(place.name)}</strong>
        <span>${escapeHtml(place.tagline)}</span>
      </span>
    </button>
  `;
}

function renderMatch() {
  const pair = currentPair();
  if (pair.length !== 2) return renderSetup();
  const game = state.game;
  const roundMatch = Math.floor(game.matchCursor / 2) + 1;
  const roundTotal = game.currentRound.length / 2;
  const percent = Math.round((game.completedMatches / game.totalMatches) * 100);
  return `
    <main class="main match-main">
      <section class="match-status">
        <div>
          <span class="round-badge">${roundLabel(game.roundSize)}</span>
          <strong>${roundMatch} / ${roundTotal} 매치</strong>
        </div>
        <div class="total-progress">
          <span>전체 진행 ${percent}%</span>
          <div class="progress-track"><span style="width:${percent}%"></span></div>
        </div>
      </section>
      <section class="match-stage" aria-label="${roundLabel(game.roundSize)} ${roundMatch}번째 대결">
        ${renderMatchCard(pair[0], "left")}
        <div class="versus" aria-hidden="true"><span>VS</span></div>
        ${renderMatchCard(pair[1], "right")}
      </section>
      <div class="match-footer">
        <button class="ghost-button" type="button" data-action="quit-game">처음으로</button>
        <span>더 가고 싶은 여행지를 선택하세요.</span>
      </div>
    </main>
  `;
}

function renderWinnerPanel(place, label, wins = null, featured = false) {
  return `
    <article class="winner-panel ${featured ? "is-featured" : ""}">
      <div class="winner-label">${label}</div>
      ${renderPlaceArt(place, "winner")}
      <div class="winner-content">
        <span>${escapeHtml(place.category)} · ${escapeHtml(place.region)} ${renderSeasonMark(place.season)}</span>
        <h2>${escapeHtml(place.name)}${wins !== null ? `<sup>★ ${wins}</sup>` : ""}</h2>
        <p>${escapeHtml(place.description)}</p>
      </div>
    </article>
  `;
}

function renderResult() {
  const winner = state.game?.winner;
  if (!winner) return renderSetup();
  const top = state.stats.topWinner;
  const topPlace = top?.place || winner;
  const topWins = top?.wins ?? Number(state.stats.winners[winner.id] || 0);
  const dokdoDiscovered = state.game?.dokdoDiscovery?.available;
  return `
    <main class="main result-main">
      <section class="result-heading">
        <span class="eyebrow">TOURNAMENT COMPLETE</span>
        <h1>오늘의 최종 선택</h1>
        <p>${state.savingResult ? "우승 기록을 저장하고 있습니다." : `${state.stats.totalCompletedGames.toLocaleString("ko-KR")}번째 게임 결과가 기록되었습니다.`}</p>
      </section>
      <section class="winner-showcase">
        ${renderWinnerPanel(topPlace, "누적 최다 우승", topWins)}
        ${renderWinnerPanel(winner, "이번 게임 우승", null, true)}
      </section>
      ${
        dokdoDiscovered
          ? `
            <section class="hidden-item-entry" aria-label="숨겨진 여행지">
              <span>HIDDEN DESTINATION</span>
              <p>이번 여정에서 숨겨진 비경을 발견했습니다.</p>
              <button class="hidden-item-button" type="button" data-action="open-dokdo">숨겨진 비경: 독도</button>
            </section>
          `
          : ""
      }
      ${state.message ? `<div class="notice" role="alert">${escapeHtml(state.message)}</div>` : ""}
      ${renderDailyComparison(winner)}
      <div class="result-actions">
        <button class="primary-button" type="button" data-action="restart-game">다시 ${state.game?.initialSize || state.tournamentSize}강</button>
        <button class="secondary-button" type="button" data-view="places">후보 둘러보기</button>
      </div>
    </main>
    ${state.hiddenItemOpen && dokdoDiscovered ? renderDokdoHiddenItem() : ""}
  `;
}

function renderDokdoHiddenItem() {
  return `
    <div class="hidden-item-backdrop">
      <section class="hidden-item-modal" role="dialog" aria-modal="true" aria-labelledby="dokdo-hidden-title">
        <div class="hidden-item-image-wrap">
          <img src="${DOKDO_HIDDEN_ITEM.imagePath}" alt="푸른 동해 위에 솟은 독도의 바위섬" />
        </div>
        <div class="hidden-item-copy">
          <span class="eyebrow">${DOKDO_HIDDEN_ITEM.eyebrow}</span>
          <h2 id="dokdo-hidden-title">${DOKDO_HIDDEN_ITEM.title}</h2>
          <p>${DOKDO_HIDDEN_ITEM.description}</p>
          <dl>
            <div><dt>위치</dt><dd>경상북도 울릉군 울릉읍 독도리</dd></div>
            <div><dt>이미지</dt><dd>${DOKDO_HIDDEN_ITEM.imageCredit}</dd></div>
          </dl>
          <button class="primary-button" type="button" data-action="close-dokdo">결과로 돌아가기</button>
        </div>
      </section>
    </div>
  `;
}

function filteredPlaces() {
  const term = state.search.trim().toLocaleLowerCase("ko-KR");
  return state.places.filter((place) => {
    const categoryMatch = state.category === "전체" || place.category === state.category;
    const seasonMatch = state.season === "전체" || place.season === state.season;
    const text = `${place.name} ${place.category} ${place.region} ${place.tagline}`.toLocaleLowerCase("ko-KR");
    return categoryMatch && seasonMatch && (!term || text.includes(term));
  });
}

function renderPlaces() {
  const categories = ["전체", ...new Set(state.places.map((place) => place.category))];
  const places = filteredPlaces();
  return `
    <main class="main places-main">
      <section class="list-heading">
        <div>
          <span class="eyebrow">ALL ${state.places.length.toLocaleString("ko-KR")} PLACES</span>
          <h1>한국 여행지 후보</h1>
          <p>최신 한국관광 100선 선정지를 지역과 여행 테마로 살펴보세요.</p>
        </div>
        <div class="place-count"><strong>${places.length}</strong><span>표시 중</span></div>
      </section>
      <section class="place-tools">
        <div class="search-field">
          <label for="place-search">후보 검색</label>
          <input id="place-search" type="search" value="${escapeHtml(state.search)}" placeholder="여행지, 지역, 분류" autocomplete="off" />
        </div>
        <div class="place-filter-groups">
          <div class="category-tabs" role="group" aria-label="여행지 분류">
            ${categories
              .map(
                (category) => `
                  <button class="filter-button ${state.category === category ? "is-active" : ""}" type="button" data-filter="${escapeHtml(category)}">
                    ${escapeHtml(category)}
                  </button>
                `
              )
              .join("")}
          </div>
          <div class="season-tabs" role="group" aria-label="추천 계절">
            ${["전체", "봄", "여름", "가을", "겨울", "사철"]
              .map(
                (season) => `
                  <button class="season-filter ${state.season === season ? "is-active" : ""}" type="button" data-season="${season}" aria-label="${season === "전체" ? "전체 계절" : `${season} 추천 후보`}">
                    ${season === "전체" ? "전체 계절" : renderSeasonMark(season)}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
      <section class="place-grid">
        ${places
          .map(
            (place) => `
              <article class="place-item">
                ${renderPlaceArt(place, "grid")}
                <div>
                  <span>${escapeHtml(place.category)} · ${escapeHtml(place.region)} ${renderSeasonMark(place.season)}</span>
                  <h2>${escapeHtml(place.name)}</h2>
                  <p>${escapeHtml(place.tagline)}</p>
                </div>
              </article>
            `
          )
          .join("")}
      </section>
      ${places.length ? "" : `<div class="empty-state">조건에 맞는 후보가 없습니다.</div>`}
    </main>
  `;
}

function renderMapPin(place) {
  const { x, y } = getMapPosition(place);
  const color = REGION_CONFIG[place.region]?.color || "#187A6A";
  const selected = state.mapSelectedId === place.id;
  return `
    <button
      class="map-pin ${selected ? "is-selected" : ""} ${mapPinClasses(place)}"
      type="button"
      data-map-place="${escapeHtml(place.id)}"
      style="--pin-x:${x.toFixed(2)}%;--pin-y:${y.toFixed(2)}%;--pin-color:${color}"
      aria-label="${escapeHtml(place.name)} 지도 위치"
      aria-pressed="${selected}"
    >
      <span class="map-pin-core"></span>
      ${
        selected
          ? `
            <span class="map-pin-tooltip" role="tooltip">
              ${renderResponsiveImage(place, {
                variant: "map",
                className: "map-pin-photo",
                alt: `${place.name} 미리보기`
              })}
              <span class="map-tooltip-copy">
                <span>${escapeHtml(place.region)} · ${escapeHtml(place.category)}</span>
                <strong>${escapeHtml(place.name)}</strong>
                <span>${renderSeasonMark(place.season)}</span>
              </span>
            </span>
          `
          : ""
      }
    </button>
  `;
}

function renderMapRegionLabels() {
  return MAP_REGION_LABELS.map((item) => {
    const classes = [
      "map-region-label",
      item.compact ? "is-compact" : "",
      item.island ? "is-island" : "",
      item.zoom ? "map-region-label--zoom" : ""
    ]
      .filter(Boolean)
      .join(" ");
    const style = `--label-x:${item.x}%;--label-y:${item.y}%`;

    if (!item.zoom) {
      return `<span class="${classes}" style="${style}">${escapeHtml(item.label)}</span>`;
    }

    const active = state.mapZoomRegion === item.region;
    return `
      <button
        class="${classes} ${active ? "is-active" : ""}"
        type="button"
        data-map-zoom="${escapeHtml(item.region)}"
        style="${style}"
        aria-label="${escapeHtml(item.label)} 확대 지도 열기"
        aria-pressed="${active}"
        title="${escapeHtml(item.label)} 확대 지도"
      >
        <span>${escapeHtml(item.label)}</span>
        <span class="map-region-label-icon" aria-hidden="true">+</span>
      </button>
    `;
  }).join("");
}

function metroZoomPlaces(region) {
  return state.places.filter((place) => place.region === region);
}

function getMetroZoomPosition(place, places) {
  const metroMap = METRO_ZOOM_MAPS[place.region];
  const sourcePosition = (item) => ({
    x: MAP_ASSET.referenceX + (Number(item.longitude) - MAP_ASSET.referenceLongitude) * MAP_ASSET.longitudePixelsPerDegree,
    y: MAP_ASSET.referenceY + (MAP_ASSET.referenceLatitude - Number(item.latitude)) * MAP_ASSET.latitudePixelsPerDegree
  });
  const sourcePositions = places.map(sourcePosition);
  const centerX = sourcePositions.reduce((sum, item) => sum + item.x, 0) / sourcePositions.length;
  const centerY = sourcePositions.reduce((sum, item) => sum + item.y, 0) / sourcePositions.length;
  const source = sourcePosition(place);
  const index = Math.max(0, places.findIndex((item) => item.id === place.id));
  const offsetX = ((index % 3) - 1) * 1.4;
  const offsetY = (Math.floor(index / 3) - 1) * 1.3;
  const expandedX = centerX + (source.x - centerX) * metroMap.spread;
  const expandedY = centerY + (source.y - centerY) * metroMap.spread;
  const x = ((expandedX - metroMap.x) / metroMap.width) * 100 + offsetX;
  const y = ((expandedY - metroMap.y) / metroMap.height) * 100 + offsetY;
  return {
    x: Math.min(87, Math.max(13, x)),
    y: Math.min(85, Math.max(13, y))
  };
}

function renderMetroZoomPin(place, places) {
  const { x, y } = getMetroZoomPosition(place, places);
  const color = REGION_CONFIG[place.region]?.color || "#187A6A";
  const selected = state.mapSelectedId === place.id;
  const positionClasses = [x < 30 ? "is-edge-left" : "", x > 70 ? "is-edge-right" : "", y < 35 ? "is-near-top" : ""]
    .filter(Boolean)
    .join(" ");
  return `
    <button
      class="metro-zoom-pin ${selected ? "is-selected" : ""} ${positionClasses}"
      type="button"
      data-map-place="${escapeHtml(place.id)}"
      style="--zoom-x:${x.toFixed(2)}%;--zoom-y:${y.toFixed(2)}%;--pin-color:${color}"
      aria-label="${escapeHtml(place.name)}"
      aria-pressed="${selected}"
    >
      <span class="metro-zoom-pin-core"></span>
      <span class="metro-zoom-pin-name">${escapeHtml(place.name)}</span>
      <span class="metro-zoom-pin-tooltip" role="tooltip">
        ${renderResponsiveImage(place, {
          variant: "map",
          className: "metro-zoom-pin-photo",
          alt: `${place.name} 미리보기`
        })}
        <span class="metro-zoom-tooltip-copy">
          <span>${escapeHtml(place.category)} · ${renderSeasonMark(place.season)}</span>
          <strong>${escapeHtml(place.name)}</strong>
        </span>
      </span>
    </button>
  `;
}

function renderMetroZoom() {
  const region = state.mapZoomRegion;
  if (!region) return "";

  const places = metroZoomPlaces(region);
  const selected = places.find((place) => place.id === state.mapSelectedId);
  const color = REGION_CONFIG[region]?.color || "#187A6A";
  const label = region === "서울" ? "서울특별시" : "부산광역시";
  const metroMap = METRO_ZOOM_MAPS[region];

  return `
    <section class="metro-zoom" role="dialog" aria-label="${label} 확대 지도">
      <header class="metro-zoom-header">
        <div>
          <span class="eyebrow">CITY DETAIL</span>
          <h2>${label}</h2>
        </div>
        <div class="metro-zoom-actions">
          <span class="metro-zoom-count">${places.length}곳</span>
          <button class="metro-zoom-back" type="button" data-map-zoom-close aria-label="${label} 확대 지도를 닫고 전체 지도 보기">
            <span aria-hidden="true">←</span> 전체 지도
          </button>
        </div>
      </header>
      <div class="metro-zoom-canvas" style="--metro-color:${color}">
        <svg class="metro-zoom-outline" viewBox="${metroMap.viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <image href="./images/map/korea-admin-boundaries.svg?v=20260711-region-colors" x="0" y="0" width="800" height="759" />
        </svg>
        <div class="metro-zoom-pins">
          ${places.map((place) => renderMetroZoomPin(place, places)).join("")}
        </div>
      </div>
      ${
        selected
          ? `
            <div class="metro-zoom-selection" aria-live="polite">
              ${renderResponsiveImage(selected, {
                variant: "thumbnail",
                className: "metro-zoom-photo",
                alt: `${selected.name} 미리보기`
              })}
              <span>
                <small>${escapeHtml(selected.category)} · ${renderSeasonMark(selected.season)}</small>
                <strong>${escapeHtml(selected.name)}</strong>
              </span>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderMap() {
  const regions = [...new Set(state.places.map((place) => place.region))];
  const places = filteredMapPlaces();
  return `
    <main class="main map-main">
      <section class="map-heading">
        <div>
          <span class="eyebrow">KOREA TRAVEL ATLAS</span>
          <h1>대한민국 관광지도 100</h1>
          <p>한국관광 100선 후보의 대략적인 위치를 한눈에 살펴보세요.</p>
        </div>
        <strong class="map-count">${places.length}<span>곳 표시</span></strong>
      </section>

      <section class="map-controls" aria-label="관광지도 필터">
        <label class="map-region-control">
          <span>지역</span>
          <select id="map-region">
            ${["전체", ...regions]
              .map((region) => `<option value="${escapeHtml(region)}"${region === state.mapRegion ? " selected" : ""}>${escapeHtml(region)}</option>`)
              .join("")}
          </select>
        </label>
        <div class="map-season-controls" role="group" aria-label="추천 계절">
          ${["전체", "봄", "여름", "가을", "겨울", "사철"]
            .map(
              (season) => `
                <button class="season-filter ${state.mapSeason === season ? "is-active" : ""}" type="button" data-map-season="${season}" aria-label="${season === "전체" ? "전체 계절" : `${season} 추천 후보`}">
                  ${season === "전체" ? "전체 계절" : renderSeasonMark(season)}
                </button>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="travel-map-layout">
        <div class="map-stage" aria-label="대한민국 관광지 지도">
          <img class="map-outline map-outline-detail" src="./images/map/korea-admin-boundaries.svg?v=20260711-region-colors" alt="" aria-hidden="true" />
          <div class="map-region-labels">
            ${renderMapRegionLabels()}
          </div>
          <div class="map-pins">
            ${places.map(renderMapPin).join("")}
          </div>
          ${renderMetroZoom()}
        </div>

        <aside class="map-legend" aria-label="지역별 색상 범례">
          <span class="eyebrow">REGION AREAS</span>
          <div class="map-legend-grid">
            ${regions
              .map((region) => {
                const count = state.places.filter((place) => place.region === region).length;
                const color = MAP_REGION_FILLS[region] || "#e9f3f7";
                return `<span><i style="--legend-color:${color}"></i>${escapeHtml(region)} <b>${count}</b></span>`;
              })
              .join("")}
          </div>
        </aside>
      </section>
    </main>
  `;
}

function renderRights() {
  const aiImageCount = state.places.filter((place) => place.imagePath && place.imageType === "ai-generated").length;
  const pendingImageCount = Math.max(0, state.places.length - aiImageCount);
  const fallbackText = pendingImageCount
    ? `${pendingImageCount.toLocaleString("ko-KR")}개 후보는 실사 이미지 등록 전까지 앱 내장 SVG 일러스트로 표시합니다.`
    : "모든 후보가 AI 생성 실사 이미지로 연결되어 있으며, 이미지가 누락되면 앱 내장 SVG 일러스트가 안전하게 표시됩니다.";
  return `
    <main class="main rights-main">
      <section class="rights-heading">
        <span class="eyebrow">ASSET POLICY</span>
        <h1>사진 저작권 걱정 없는 시각 시스템</h1>
        <p>이 버전의 여행지 이미지는 OpenAI의 ChatGPT 이미지 생성 도구(ChatGPT Images)와 앱 내장 SVG 대체 일러스트를 사용하며, 외부 여행지 사진이나 브랜드 이미지를 사용하지 않습니다.</p>
      </section>
      <section class="rights-grid">
        <div>
          <strong>01</strong>
          <h2>AI 생성 도구</h2>
          <p>${aiImageCount.toLocaleString("ko-KR")}개 후보 이미지와 독도 히든 아이템 이미지는 OpenAI의 ChatGPT 이미지 생성 도구(ChatGPT Images)로 제작한 AI 생성 이미지입니다.</p>
        </div>
        <div>
          <strong>02</strong>
          <h2>대체 일러스트 예비</h2>
          <p>${fallbackText}</p>
        </div>
        <div>
          <strong>03</strong>
          <h2>출처 기록 원칙</h2>
          <p>향후 실제 사진을 쓰게 될 경우 저자, 원본, 라이선스와 변경 여부를 함께 기록합니다.</p>
        </div>
      </section>
      <section class="rights-note">
        <h2>공개 전 점검</h2>
        <p>외부의 실제 사진으로 교체할 경우 후보별 저자, 원본 URL, 라이선스, 변경 여부를 별도로 기록해야 합니다.</p>
      </section>
    </main>
  `;
}

function renderLoading() {
  return `
    <main class="main loading-main">
      <div class="loading-mark">${TOURNAMENT_SIZE}</div>
      <strong>한국 여행지 대진표를 준비하고 있습니다.</strong>
    </main>
  `;
}

function renderError() {
  return `
    <main class="main error-main">
      <span class="eyebrow">LOAD ERROR</span>
      <h1>후보 데이터를 불러오지 못했습니다.</h1>
      <p>${escapeHtml(state.message)}</p>
      <button class="primary-button" type="button" data-action="reload">다시 불러오기</button>
    </main>
  `;
}

function render() {
  let content = renderLoading();
  if (state.screen === "error") content = renderError();
  else if (state.view === "places") content = renderPlaces();
  else if (state.view === "map") content = renderMap();
  else if (state.view === "rights") content = renderRights();
  else if (state.screen === "setup") content = renderSetup();
  else if (state.screen === "match") content = renderMatch();
  else if (state.screen === "result") content = renderResult();

  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      ${state.screen === "loading" || state.screen === "error" ? "" : renderHeader()}
      ${content}
      ${
        state.screen === "loading" || state.screen === "error"
          ? ""
          : `<footer class="footer">한국 여행지 월드컵 · 후보 ${state.places.length.toLocaleString("ko-KR")}개</footer>`
      }
    </div>
  `;
}

async function initialize() {
  render();
  try {
    let placesPayload;
    try {
      placesPayload = await apiRequest("/api/places");
      state.apiAvailable = true;
    } catch {
      const response = await fetch("./data/places.json");
      if (!response.ok) throw new Error("places.json을 찾을 수 없습니다.");
      placesPayload = { places: await response.json() };
      state.apiAvailable = false;
    }

    state.places = placesPayload.places;
    if (!Array.isArray(state.places) || state.places.length < TOURNAMENT_SIZE) {
      throw new Error(`${TOURNAMENT_SIZE}개 이상의 후보 데이터가 필요합니다.`);
    }

    try {
      state.stats = state.apiAvailable
        ? normalizeStats(await apiRequest("/api/stats"))
        : normalizeStats(readLocalStats());
    } catch {
      state.apiAvailable = false;
      state.stats = normalizeStats(readLocalStats());
    }
    state.screen = "setup";
  } catch (error) {
    state.screen = "error";
    state.message = error.message;
  }
  render();
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.view) {
    state.view = button.dataset.view;
    if (state.view === "game" && state.screen === "loading") state.screen = "setup";
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    return;
  }

  if (button.dataset.categoryLink) {
    state.category = button.dataset.categoryLink;
    state.view = "places";
    window.scrollTo({ top: 0, behavior: "smooth" });
    render();
    return;
  }

  if (button.dataset.filter) {
    state.category = button.dataset.filter;
    render();
    return;
  }

  if (button.dataset.season) {
    state.season = button.dataset.season;
    render();
    return;
  }

  if (button.dataset.mapSeason) {
    state.mapSeason = button.dataset.mapSeason;
    state.mapSelectedId = null;
    state.mapZoomRegion = null;
    render();
    return;
  }

  if (button.dataset.mapZoom) {
    state.mapZoomRegion = button.dataset.mapZoom;
    state.mapSelectedId = null;
    render();
    return;
  }

  if (button.dataset.mapZoomClose !== undefined) {
    state.mapZoomRegion = null;
    state.mapSelectedId = null;
    render();
    return;
  }

  if (button.dataset.mapPlace) {
    state.mapSelectedId = state.mapSelectedId === button.dataset.mapPlace ? null : button.dataset.mapPlace;
    render();
    return;
  }

  if (button.dataset.pick) {
    await choosePlace(button.dataset.pick);
    return;
  }

  if (button.dataset.tournamentSize) {
    startGame(button.dataset.tournamentSize);
    return;
  }

  const action = button.dataset.action;
  if (action === "start-daily") {
    startDailyGame();
    return;
  }
  if (action === "open-dokdo") {
    state.hiddenItemOpen = true;
    render();
    return;
  }
  if (action === "close-dokdo") {
    state.hiddenItemOpen = false;
    render();
    return;
  }
  if (action === "start-game" || action === "restart-game") startGame();
  if (action === "quit-game" || action === "home") {
    state.view = "game";
    restartGame();
  }
  if (action === "reload") initialize();
});

document.addEventListener("compositionstart", (event) => {
  if (event.target.id === "place-search") searchComposing = true;
});

document.addEventListener("compositionend", (event) => {
  if (event.target.id !== "place-search") return;
  searchComposing = false;
  state.search = event.target.value;
  render();
  const input = document.getElementById("place-search");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id !== "place-search" || searchComposing) return;
  state.search = event.target.value;
  render();
  const input = document.getElementById("place-search");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id !== "map-region") return;
  state.mapRegion = event.target.value;
  state.mapSelectedId = null;
  state.mapZoomRegion = null;
  render();
});

document.addEventListener("pointerover", (event) => {
  if (event.pointerType !== "mouse" || state.view !== "map") return;
  const pin = event.target.closest("[data-map-place]");
  if (!pin || state.mapSelectedId === pin.dataset.mapPlace) return;
  state.mapSelectedId = pin.dataset.mapPlace;
  render();
});

document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;

    const fallback = image.dataset.fallbackSrc;
    if (fallback) {
      delete image.dataset.fallbackSrc;
      image.src = fallback;
      return;
    }

    image.classList.add("is-image-unavailable");
  },
  true
);

document.addEventListener("keydown", async (event) => {
  if (event.key === "Escape" && state.hiddenItemOpen) {
    state.hiddenItemOpen = false;
    render();
    return;
  }
  if (state.screen !== "match" || state.view !== "game") return;
  const pair = currentPair();
  if (event.key === "1" && pair[0]) await choosePlace(pair[0].id);
  if (event.key === "2" && pair[1]) await choosePlace(pair[1].id);
});

initialize();

const grid = document.getElementById("review-grid");
const select = document.getElementById("batch-select");
const count = document.getElementById("batch-count");
const placeNamesById = new Map();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayNameFor(image) {
  const name = String(image.name || "").trim();
  const hasReadableName = /[가-힣A-Za-z0-9]/.test(name);
  return hasReadableName ? name : placeNamesById.get(image.placeId) || image.placeId;
}

function renderBatch(images, batch) {
  const items = images.filter((image) => image.batch === batch);
  count.textContent = `${items.length}개 이미지`;
  grid.innerHTML = items
    .map((image) => {
      const name = displayNameFor(image);
      return `
        <a class="review-item" href="/images/places/${encodeURIComponent(image.file)}" target="_blank" rel="noreferrer">
          <img src="/images/places/${encodeURIComponent(image.file)}" alt="${escapeHtml(name)} 실사 이미지" loading="lazy" decoding="async" />
          <div>
            <h2>${escapeHtml(name)}</h2>
            <span>${image.status === "approved" ? "승인" : "검수 대기"}</span>
          </div>
        </a>
      `;
    })
    .join("");
}

async function init() {
  const [manifestResponse, placesResponse] = await Promise.all([
    fetch("/images/places/image-generation-manifest.json", { cache: "no-store" }),
    fetch("/data/places.json", { cache: "no-store" })
  ]);
  if (!manifestResponse.ok) throw new Error("이미지 검수 데이터를 불러오지 못했습니다.");

  if (placesResponse.ok) {
    const places = await placesResponse.json();
    places.forEach((place) => placeNamesById.set(place.id, place.name));
  }

  const manifest = await manifestResponse.json();
  const batches = [...new Set(manifest.images.map((image) => image.batch))];
  const requested = new URLSearchParams(location.search).get("batch");
  const selected = batches.includes(requested) ? requested : batches.at(-1);

  select.innerHTML = batches
    .map(
      (batch) =>
        `<option value="${escapeHtml(batch)}"${batch === selected ? " selected" : ""}>${escapeHtml(batch)}</option>`
    )
    .join("");

  select.addEventListener("change", () => {
    const url = new URL(location.href);
    url.searchParams.set("batch", select.value);
    history.replaceState(null, "", url);
    renderBatch(manifest.images, select.value);
  });

  renderBatch(manifest.images, selected);
}

init().catch((error) => {
  grid.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});

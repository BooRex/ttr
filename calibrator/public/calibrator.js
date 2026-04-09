const SVG_CONFIG = {
  src: "/assets/maps/europe.svg",
  width: 1613,
  height: 1417,
  board: { width: 1335, height: 872 },
  backgroundOffset: { x: 70, y: 470 },
};

const STORAGE_KEY_V2 = "ttr-calibration:v2";
const STORAGE_KEY_V1 = "ttr-calibration";

const COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#facc15",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#84cc16",
];

const DEFAULT_EUROPE_CITIES = {
  Edinburgh: { x: 268, y: 232, label: { dx: 10, dy: -18 } },
  London: { x: 309, y: 392, label: { dx: -90, dy: -10 } },
  Amsterdam: { x: 410, y: 369, label: { dx: -56, dy: -35 } },
  Bruxelles: { x: 404, y: 428, label: { dx: 10, dy: 2 } },
  Dieppe: { x: 323, y: 449, label: { dx: -69, dy: -15 } },
  Paris: { x: 380, y: 509, label: { dx: -94, dy: 1 } },
  Brest: { x: 215, y: 488, label: { dx: -70, dy: -10 } },
  Essen: { x: 485, y: 411, label: { dx: -17, dy: -25 } },
  Frankfurt: { x: 487, y: 475, label: { dx: -39, dy: 20 } },
  Berlin: { x: 567, y: 373, label: { dx: -35, dy: -34 } },
  Danzig: { x: 645, y: 310, label: { dx: -46, dy: -33 } },
  Copenhagen: { x: 546, y: 254, label: { dx: -109, dy: -24 } },
  Stockholm: { x: 641, y: 132, label: { dx: -46, dy: -35 } },
  Zurich: { x: 486, y: 552, label: { dx: -55, dy: 10 } },
  Munich: { x: 560, y: 500, label: { dx: 10, dy: -28 } },
  Vienna: { x: 644, y: 529, label: { dx: -56, dy: 6 } },
  Budapest: { x: 720, y: 534, label: { dx: 32, dy: -15 } },
  Warszawa: { x: 732, y: 352, label: { dx: 7, dy: 16 } },
  Wilno: { x: 806, y: 272, label: { dx: 24, dy: -4 } },
  Riga: { x: 775, y: 197, label: { dx: -50, dy: -12 } },
  Petrograd: { x: 854, y: 85, label: { dx: 10, dy: -20 } },
  Smolensk: { x: 947, y: 223, label: { dx: 10, dy: 0 } },
  Moskva: { x: 1007, y: 151, label: { dx: 18, dy: -12 } },
  Kyiv: { x: 966, y: 385, label: { dx: 6, dy: 10 } },
  Kharkov: { x: 1081, y: 370, label: { dx: 15, dy: -20 } },
  Bucharest: { x: 868, y: 590, label: { dx: 51, dy: 13 } },
  Sofia: { x: 837, y: 668, label: { dx: 10, dy: 15 } },
  Athina: { x: 834, y: 804, label: { dx: 20, dy: -23 } },
  Sarajevo: { x: 720, y: 648, label: { dx: -61, dy: 20 } },
  Zagreb: { x: 633, y: 612, label: { dx: 21, dy: -18 } },
  Venezia: { x: 562, y: 600, label: { dx: -90, dy: 3 } },
  Roma: { x: 568, y: 721, label: { dx: -34, dy: 20 } },
  Brindisi: { x: 703, y: 757, label: { dx: -8, dy: 24 } },
  Palermo: { x: 610, y: 856, label: { dx: -15, dy: 23 } },
  Barcelona: { x: 284, y: 734, label: { dx: 21, dy: 16 } },
  Pamplona: { x: 223, y: 665, label: { dx: -106, dy: -22 } },
  Madrid: { x: 161, y: 748, label: { dx: -86, dy: -33 } },
  Cadiz: { x: 79, y: 857, label: { dx: 15, dy: 13 } },
  Lisboa: { x: 14, y: 766, label: { dx: -24, dy: -32 } },
  Marseille: { x: 397, y: 665, label: { dx: -5, dy: 25 } },
  Constantinople: { x: 982, y: 688, label: { dx: 0, dy: -30 } },
  Ankara: { x: 1114, y: 693, label: { dx: 10, dy: 12 } },
  Smyrna: { x: 971, y: 812, label: { dx: 8, dy: 14 } },
  Erzurum: { x: 1260, y: 639, label: { dx: -30, dy: 20 } },
  Sochi: { x: 1177, y: 503, label: { dx: 15, dy: 11 } },
  Sevastopol: { x: 1058, y: 550, label: { dx: -30, dy: 22 } },
  Rostov: { x: 1161, y: 425, label: { dx: 20, dy: -10 } },
};

const CITIES = Object.keys(DEFAULT_EUROPE_CITIES);

const state = {
  placements: cloneCities(DEFAULT_EUROPE_CITIES),
  activeCity: CITIES[0],
  mode: "both",
  zoom: 1,
  drag: null,
};

const dom = {
  cityList: document.getElementById("city-list"),
  mapArea: document.getElementById("map-area"),
  canvasWrap: document.getElementById("canvas-wrap"),
  mapImg: document.getElementById("map-img"),
  overlay: document.getElementById("overlay"),
  output: document.getElementById("output-area"),
  hint: document.getElementById("hint"),
  cursor: document.getElementById("cursor-info"),
  zoomInput: document.getElementById("zoom-input"),
  zoomValue: document.getElementById("zoom-value"),
  modeSelect: document.getElementById("mode-select"),
};

init();

function init() {
  const loaded = loadState();
  if (loaded) {
    state.placements = loaded;
  }

  dom.mapImg.src = SVG_CONFIG.src;
  dom.mapImg.width = SVG_CONFIG.width;
  dom.mapImg.height = SVG_CONFIG.height;
  dom.overlay.style.width = `${SVG_CONFIG.width}px`;
  dom.overlay.style.height = `${SVG_CONFIG.height}px`;

  const fitZoom = Math.max(
    0.3,
    Math.min(
      1,
      Math.min(
        dom.mapArea.clientWidth / SVG_CONFIG.width,
        dom.mapArea.clientHeight / SVG_CONFIG.height,
      ),
    ),
  );
  state.zoom = Number(fitZoom.toFixed(2));
  dom.zoomInput.value = String(Math.round(state.zoom * 100));

  buildSidebar();
  updateModeClass();
  applyZoom();
  renderOverlay();
  updateSidebarMeta();
  syncActiveInSidebar();
  bindEvents();
  setHint(`Готово: перетаскивай точки городов и подписи (mode: ${state.mode})`);
}

function bindEvents() {
  dom.zoomInput.addEventListener("input", () => {
    state.zoom = Number(dom.zoomInput.value) / 100;
    applyZoom();
    renderOverlay();
  });

  dom.modeSelect.addEventListener("change", () => {
    state.mode = dom.modeSelect.value;
    updateModeClass();
    setHint(`Режим: ${state.mode}`);
  });

  dom.mapArea.addEventListener("mousemove", (event) => {
    const svg = screenToSvg(event.clientX, event.clientY);
    const board = svgToBoard(svg.x, svg.y);
    dom.cursor.textContent = `svg: ${svg.x}, ${svg.y} | board: ${board.x}, ${board.y}`;
    if (state.drag) {
      performDrag(svg.x, svg.y);
    }
  });

  dom.mapArea.addEventListener("mouseup", stopDrag);
  dom.mapArea.addEventListener("mouseleave", stopDrag);
  window.addEventListener("mouseup", stopDrag);

  dom.overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.kind === "city" || target.dataset.kind === "label") return;

    if (!(state.mode === "city" || state.mode === "both")) return;
    if (!state.activeCity) return;

    const svg = screenToSvg(event.clientX, event.clientY);
    const board = clampBoard(svgToBoard(svg.x, svg.y));

    const current = state.placements[state.activeCity];
    state.placements[state.activeCity] = {
      ...current,
      x: board.x,
      y: board.y,
    };
    afterPlacementChange(state.activeCity);
  });

  document.getElementById("copy-output-btn").addEventListener("click", copyEuropeCities);
  document.getElementById("undo-btn").addEventListener("click", restoreDefaults);
  document.getElementById("reset-city-btn").addEventListener("click", resetActiveCityPosition);
  document.getElementById("reset-label-btn").addEventListener("click", resetActiveCityLabel);
}

function buildSidebar() {
  dom.cityList.innerHTML = "";
  CITIES.forEach((city, index) => {
    const row = document.createElement("div");
    row.className = "city-item";
    row.id = cityRowId(city);
    row.addEventListener("click", () => {
      state.activeCity = city;
      syncActiveInSidebar();
      renderOverlay();
      setHint(`Выбран ${city}`);
    });

    const dot = document.createElement("span");
    dot.className = "city-dot";
    dot.style.background = COLORS[index % COLORS.length];

    const content = document.createElement("div");
    const name = document.createElement("div");
    name.className = "city-name";
    name.textContent = city;

    const meta = document.createElement("div");
    meta.className = "city-meta";
    meta.id = cityMetaId(city);

    content.appendChild(name);
    content.appendChild(meta);

    row.appendChild(dot);
    row.appendChild(content);
    dom.cityList.appendChild(row);
  });
}

function renderOverlay() {
  dom.overlay.innerHTML = "";

  CITIES.forEach((city, index) => {
    const placement = state.placements[city];
    const citySvg = boardToSvg(placement.x, placement.y);
    const labelSvg = {
      x: citySvg.x + placement.label.dx,
      y: citySvg.y + placement.label.dy,
    };

    const link = document.createElement("div");
    link.className = "overlay-link";
    positionLink(link, citySvg, labelSvg);
    dom.overlay.appendChild(link);

    const dot = document.createElement("div");
    dot.className = "overlay-city-dot";
    dot.dataset.city = city;
    dot.dataset.kind = "city";
    dot.style.left = `${citySvg.x}px`;
    dot.style.top = `${citySvg.y}px`;
    dot.style.background = COLORS[index % COLORS.length];
    if (city === state.activeCity) dot.classList.add("active");
    dot.addEventListener("mousedown", (event) => {
      if (state.mode === "label") return;
      startDrag(event, city, "city");
    });

    const label = document.createElement("div");
    label.className = "overlay-label";
    label.dataset.city = city;
    label.dataset.kind = "label";
    label.style.left = `${labelSvg.x}px`;
    label.style.top = `${labelSvg.y}px`;
    label.textContent = city;
    if (city === state.activeCity) label.classList.add("active");
    label.addEventListener("mousedown", (event) => {
      if (state.mode === "city") return;
      startDrag(event, city, "label");
    });

    dom.overlay.appendChild(dot);
    dom.overlay.appendChild(label);
  });
}

function positionLink(link, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  link.style.left = `${from.x}px`;
  link.style.top = `${from.y}px`;
  link.style.width = `${length}px`;
  link.style.transform = `rotate(${angle}deg)`;
}

function startDrag(event, city, kind) {
  event.preventDefault();
  state.activeCity = city;
  state.drag = {
    city,
    kind,
  };
  syncActiveInSidebar();
  setHint(`${kind === "city" ? "Перемещение города" : "Перемещение подписи"}: ${city}`);
}

function performDrag(svgX, svgY) {
  if (!state.drag) return;

  const placement = state.placements[state.drag.city];
  if (!placement) return;

  if (state.drag.kind === "city") {
    const board = clampBoard(svgToBoard(svgX, svgY));
    placement.x = board.x;
    placement.y = board.y;
  } else {
    const citySvg = boardToSvg(placement.x, placement.y);
    placement.label.dx = round(svgX - citySvg.x);
    placement.label.dy = round(svgY - citySvg.y);
  }

  afterPlacementChange(state.drag.city);
}

function stopDrag() {
  if (!state.drag) return;
  setHint(`Изменено: ${state.drag.city}`);
  state.drag = null;
}

function afterPlacementChange(city) {
  state.activeCity = city;
  renderOverlay();
  updateSidebarMeta();
  syncActiveInSidebar();
  saveState();
}

function updateSidebarMeta() {
  CITIES.forEach((city) => {
    const item = document.getElementById(cityRowId(city));
    const meta = document.getElementById(cityMetaId(city));
    if (!item || !meta) return;

    const p = state.placements[city];
    meta.textContent = `x:${p.x} y:${p.y} | dx:${p.label.dx} dy:${p.label.dy}`;

    const changed = isChangedFromDefault(city);
    item.classList.toggle("changed", changed);
  });
}

function syncActiveInSidebar() {
  CITIES.forEach((city) => {
    const item = document.getElementById(cityRowId(city));
    if (!item) return;
    item.classList.toggle("active", city === state.activeCity);
  });
}

function applyZoom() {
  dom.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  dom.canvasWrap.style.transform = `scale(${state.zoom})`;
}

function updateModeClass() {
  dom.overlay.classList.remove("mode-city", "mode-label", "mode-both");
  dom.overlay.classList.add(`mode-${state.mode}`);
}

function copyEuropeCities() {
  const text = generateEuropeCitiesTs();
  dom.output.textContent = text;
  copyText(text)
    .then(() => setHint("Скопировано: europeCities"))
    .catch(() => setHint("Текст сгенерирован. Скопируй вручную из output"));
}

function restoreDefaults() {
  state.placements = cloneCities(DEFAULT_EUROPE_CITIES);
  saveState();
  renderOverlay();
  updateSidebarMeta();
  setHint("Все позиции сброшены к дефолту");
}

function resetActiveCityPosition() {
  if (!state.activeCity) return;
  const city = state.activeCity;
  const defaults = DEFAULT_EUROPE_CITIES[city];
  const current = state.placements[city];
  current.x = defaults.x;
  current.y = defaults.y;
  afterPlacementChange(city);
  setHint(`Сброшена позиция: ${city}`);
}

function resetActiveCityLabel() {
  if (!state.activeCity) return;
  const city = state.activeCity;
  const defaults = DEFAULT_EUROPE_CITIES[city];
  const current = state.placements[city];
  current.label.dx = defaults.label.dx;
  current.label.dy = defaults.label.dy;
  afterPlacementChange(city);
  setHint(`Сброшен label offset: ${city}`);
}

function generateEuropeCitiesTs() {
  const lines = [];
  lines.push(`// Generated by calibrator on ${new Date().toISOString()}`);
  lines.push(`const europeCities: Record<string, { x: number; y: number; label: { dx: number; dy: number } }> = {`);

  CITIES.forEach((city) => {
    const p = state.placements[city];
    lines.push(
      `  ${city}: { x: ${round(p.x)}, y: ${round(p.y)}, label: { dx: ${round(p.label.dx)}, dy: ${round(p.label.dy)} } },`,
    );
  });

  lines.push("};");
  lines.push("");
  lines.push(`// board: { width: ${SVG_CONFIG.board.width}, height: ${SVG_CONFIG.board.height} }`);
  lines.push(`// backgroundOffset: { x: ${SVG_CONFIG.backgroundOffset.x}, y: ${SVG_CONFIG.backgroundOffset.y} }`);
  lines.push(`// backgroundSvgSize: { width: ${SVG_CONFIG.width}, height: ${SVG_CONFIG.height} }`);
  return lines.join("\n");
}

function loadState() {
  try {
    const parsedV2 = JSON.parse(localStorage.getItem(STORAGE_KEY_V2) || "null");
    if (parsedV2 && parsedV2.placements) {
      return normalizePlacements(parsedV2.placements);
    }

    const parsedV1 = JSON.parse(localStorage.getItem(STORAGE_KEY_V1) || "null");
    if (parsedV1 && typeof parsedV1 === "object") {
      const migrated = cloneCities(DEFAULT_EUROPE_CITIES);
      CITIES.forEach((city) => {
        const old = parsedV1[city];
        if (!old || typeof old.svgX !== "number" || typeof old.svgY !== "number") return;

        const board = svgToBoard(old.svgX, old.svgY);
        migrated[city].x = round(board.x);
        migrated[city].y = round(board.y);
      });
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ placements: migrated }));
      return migrated;
    }
  } catch (error) {
    console.error("Failed to load calibration state", error);
  }

  return null;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ placements: state.placements }));
}

function normalizePlacements(raw) {
  const normalized = cloneCities(DEFAULT_EUROPE_CITIES);
  CITIES.forEach((city) => {
    const current = raw[city];
    if (!current) return;
    if (typeof current.x === "number") normalized[city].x = round(current.x);
    if (typeof current.y === "number") normalized[city].y = round(current.y);

    if (current.label && typeof current.label.dx === "number" && typeof current.label.dy === "number") {
      normalized[city].label.dx = round(current.label.dx);
      normalized[city].label.dy = round(current.label.dy);
    }
  });
  return normalized;
}

function cityRowId(city) {
  return `city-${city.replace(/\s/g, "_")}`;
}

function cityMetaId(city) {
  return `city-meta-${city.replace(/\s/g, "_")}`;
}

function boardToSvg(x, y) {
  return {
    x: x + SVG_CONFIG.backgroundOffset.x,
    y: y + SVG_CONFIG.backgroundOffset.y,
  };
}

function svgToBoard(svgX, svgY) {
  return {
    x: round(svgX - SVG_CONFIG.backgroundOffset.x),
    y: round(svgY - SVG_CONFIG.backgroundOffset.y),
  };
}

function screenToSvg(clientX, clientY) {
  const rect = dom.mapArea.getBoundingClientRect();
  return {
    x: round((clientX - rect.left + dom.mapArea.scrollLeft) / state.zoom),
    y: round((clientY - rect.top + dom.mapArea.scrollTop) / state.zoom),
  };
}

function clampBoard(point) {
  return {
    x: clamp(point.x, 0, SVG_CONFIG.board.width),
    y: clamp(point.y, 0, SVG_CONFIG.board.height),
  };
}

function isChangedFromDefault(city) {
  const cur = state.placements[city];
  const def = DEFAULT_EUROPE_CITIES[city];
  return (
    cur.x !== def.x ||
    cur.y !== def.y ||
    cur.label.dx !== def.label.dx ||
    cur.label.dy !== def.label.dy
  );
}

function setHint(message) {
  dom.hint.textContent = message;
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

function cloneCities(source) {
  return JSON.parse(JSON.stringify(source));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(value);
}


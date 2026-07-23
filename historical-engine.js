/* ============================================================
   CYCLING MANAGER TOUR v0.25+ WT HISTORICAL
   Archivo histórico de equipos de élite 1990-2026, selector anual y cruce de épocas.

   La distribución incluye todos los packs 1990-2026. Desde 2005 se usa la categoría
   UCI ProTeam/WorldTeam cuando está disponible; entre 1990 y 2004 se usa el equivalente
   élite participante en el Tour. Las plantillas proceden del archivo histórico del Tour
   y se completan, cuando es necesario, con reservas reales de la misma estructura.
   ============================================================ */

const V025_VERSION = "v0.25plus-wt-history";
const V025_SAVE_KEY = "cyclingManager_v025plus_wt_history";

const HistoricalV025 = {
  baseTeams: clone(TEAMS),
  baseRiders: clone(RIDERS),
  baseRaces: clone(RACES),
  baseSeasonRaceIds: [...SEASON_RACE_IDS],
  packCache: {},
  loading: false,
  lastError: null,
  manifest: HISTORICAL_MANIFEST_V025,
  importedYears: new Set()
};

function ensureHistoricalStateV025() {
  Game.historical ||= {
    selectedYear: 2026,
    databaseMode: "season",
    specialYears: [1992, 2026],
    specialCalendarYear: 2026,
    eraNormalization: "equalized",
    activeYears: [2026],
    activePackStatus: "complete-simulator-v024",
    dataMessage: "34 equipos y 927 registros de corredor de v0.24 activos",
    teamSearch: "",
    teamLevelFilter: "all",
    showDataTools: false
  };
  Game.historical.specialYears ||= [1992, 2026];
  Game.historical.activeYears ||= [Game.historical.selectedYear || 2026];
  Game.version = V025_VERSION;
}

function manifestEntryV025(year) {
  return HistoricalV025.manifest.years.find(x => Number(x.year) === Number(year));
}

function availableHistoricalYearsV025() {
  return HistoricalV025.manifest.years
    .filter(x => x.file || HistoricalV025.importedYears.has(Number(x.year)))
    .map(x => Number(x.year))
    .sort((a,b) => a-b);
}

function allHistoricalYearsV025() {
  return Array.from({length: 37}, (_,i) => 1990 + i);
}

function slugV025(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function searchTokensV025(value) {
  const raw = String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().match(/[a-z0-9]+/g) || [];
  const tokens = [];
  for (let i = 0; i < raw.length;) {
    if (raw[i].length === 1 && /[a-z]/.test(raw[i])) {
      let joined = "";
      while (i < raw.length && raw[i].length === 1 && /[a-z]/.test(raw[i])) joined += raw[i++];
      tokens.push(joined);
    } else {
      tokens.push(raw[i++]);
    }
  }
  return tokens;
}

function containsTokenSequenceV025(haystack, needle) {
  if (!needle.length) return true;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let matches = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { matches = false; break; }
    }
    if (matches) return true;
  }
  return false;
}

function stableHashV025(value) {
  let h = 2166136261;
  const text = String(value || "");
  for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function generatedVisualV025(name, year) {
  const hash = stableHashV025(`${name}-${year}`);
  const hue = hash % 360;
  const hue2 = (hue + 55 + ((hash >>> 8) % 85)) % 360;
  const hue3 = (hue + 175) % 360;
  const words = String(name).match(/[A-Za-zÀ-ÿ0-9]+/g) || ["TEAM"];
  return {
    primary: `hsl(${hue} 70% 37%)`,
    secondary: `hsl(${hue2} 76% 52%)`,
    accent: `hsl(${hue3} 82% 58%)`,
    logoText: words.slice(0,4).map(w => w[0]).join("").toUpperCase(),
    pattern: ["diagonal","center","bands","chevron"][hash % 4]
  };
}

function normalizePackV025(raw) {
  const pack = clone(raw || {});
  const year = Number(pack.season);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error("Pack histórico sin temporada válida");
  pack.teams ||= [];
  pack.riders ||= [];
  pack.calendar ||= [];
  const teamIds = new Set();
  pack.teams = pack.teams.map((team,index) => {
    const id = String(team.id || `y${year}__${slugV025(team.name)}_${index}`);
    if (teamIds.has(id)) throw new Error(`ID de equipo duplicado: ${id}`);
    teamIds.add(id);
    return {
      level: "PRO", country: "International", archetype: `Equipo ${year}`,
      ai: {gc:60,sprint:60,classics:60,breakaway:60,control:55},
      material: {frame:"canyon",wheels:"shimano"},
      ...team,
      id,
      season: year,
      visual: team.visual || generatedVisualV025(team.name, year)
    };
  });
  const riderIds = new Set();
  pack.riders = pack.riders.map((r,index) => {
    const id = String(r.id || `y${year}__${slugV025(r.name)}_${index}`);
    if (riderIds.has(id)) throw new Error(`ID de corredor duplicado: ${id}`);
    riderIds.add(id);
    const stats = {...(r.stats || {})};
    ["flat","sprint","mountain","hills","cobbles","tt","ttt","stamina","recovery","acceleration","positioning","downhill"].forEach(k => {
      stats[k] = clamp(toNum(stats[k], 70), 35, 99);
    });
    stats.timeTrial = stats.tt;
    stats.teamTimeTrial = stats.ttt;
    return {
      nationality:"Unknown", age:27, roleKey:"domestique", role:"Gregario", base:72,
      defaultOrder:"hold", defaultEffort:65, form:72, morale:75, fatigue:0, energy:100,
      totalTime:0, points:0, mountainPoints:0, uciPoints:0, stageWins:0,
      seasonStageWins:0, raceDays:0, abandoned:false,
      ...r,
      id,
      season:year,
      stats
    };
  });
  const validTeamIds = new Set(pack.teams.map(t=>t.id));
  pack.riders = pack.riders.filter(r => validTeamIds.has(r.teamId));
  pack.completeness ||= {status:"unknown",teamCount:pack.teams.length,riderCount:pack.riders.length};
  pack.completeness.teamCount = pack.teams.length;
  pack.completeness.riderCount = pack.riders.length;
  return pack;
}

async function loadHistoricalPackV025(year) {
  year = Number(year);
  if (HistoricalV025.packCache[year]) return HistoricalV025.packCache[year];
  if (year === 2026) {
    const curated = clone(CURRENT_2026_MAJOR_PACK);
    curated.calendar = clone(HistoricalV025.baseRaces);
    const base = normalizePackV025(curated);
    HistoricalV025.packCache[year] = base;
    return base;
  }
  const entry = manifestEntryV025(year);
  if (!entry?.file && !HistoricalV025.importedYears.has(year)) {
    throw new Error(`El pack histórico ${year} no está disponible en historical-data/. Restaura ${year}.json o actualiza el manifiesto.`);
  }
  HistoricalV025.loading = true;
  try {
    const response = await fetch(`historical-data/${year}.json`, {cache:"no-store"});
    if (!response.ok) throw new Error(`No se pudo cargar historical-data/${year}.json (${response.status})`);
    const pack = normalizePackV025(await response.json());
    HistoricalV025.packCache[year] = pack;
    return pack;
  } finally {
    HistoricalV025.loading = false;
  }
}

function namespacePackV025(pack) {
  const year = Number(pack.season);
  const teamMap = new Map();
  const teams = pack.teams.map((team,index) => {
    const id = `era${year}__${slugV025(team.id || team.name)}_${index}`;
    teamMap.set(team.id, id);
    return {...clone(team), id, originalId:team.id, season:year, name:`${team.name} (${year})`, displayName:team.name};
  });
  const riders = pack.riders.map((r,index) => ({
    ...clone(r),
    id:`era${year}__${slugV025(r.id || r.name)}_${index}`,
    originalId:r.id,
    teamId:teamMap.get(r.teamId),
    season:year
  })).filter(r => r.teamId);
  return {...clone(pack), teams, riders};
}

function eraAdjustedRiderV025(rider, normalization) {
  const r = clone(rider);
  if (normalization === "equalized") return r;
  const year = Number(r.season || 2026);
  const equipmentGap = clamp((2026 - year) * 0.055, 0, 2.4);
  if (normalization === "authentic") {
    r.stats.flat = clamp(r.stats.flat - equipmentGap,35,99);
    r.stats.tt = clamp(r.stats.tt - equipmentGap * 1.35,35,99);
    r.stats.ttt = clamp(r.stats.ttt - equipmentGap * 1.2,35,99);
    r.stats.cobbles = clamp(r.stats.cobbles - equipmentGap * .35,35,99);
    r.stats.timeTrial = r.stats.tt;
    r.stats.teamTimeTrial = r.stats.ttt;
  }
  return r;
}

const RACE_FIRST_YEAR_V025 = {
  santos:1999,cadel:2015,uae_tour:2019,omloop:1945,strade:2007,paris_nice:1933,tirreno:1966,milan_sanremo:1907,catalunya:1911,e3:1958,gent_wevelgem:1934,flanders:1913,itzulia:1924,roubaix:1896,amstel:1966,fleche:1936,liege:1892,romandie:1947,eschborn:1962,giro:1909,dauphine:1947,suisse:1933,tour:1903,san_sebastian:1981,vuelta:1935,quebec:2010,montreal:2010,worlds:1927,lombardia:1905
};

function buildHistoricalCalendarV025(year) {
  const source = HistoricalV025.baseRaces.filter(r => year >= (RACE_FIRST_YEAR_V025[r.id] || 1900));
  return source.map((race,index) => {
    const copy = clone(race);
    const originalId = race.id;
    copy.originalId = originalId;
    copy.id = `y${year}__${originalId}`;
    copy.season = year;
    copy.date = String(copy.date || `${year}-01-01`).replace(/^\d{4}/, String(year));
    copy.stages = (copy.stages || []).map((stage,si) => ({...stage,id:`y${year}__${stage.id || `${originalId}_${si+1}`}`,season:year}));
    copy.dataNote = year === 2026 ? "Calendario base 2026" : "Plantilla de grandes carreras; ejecutar builder para calendario PCS exacto";
    return copy;
  }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

function activatePackDataV025(pack, options={}) {
  const normalized = normalizePackV025(pack);
  const teams = clone(normalized.teams);
  const riders = normalized.riders.map(r => eraAdjustedRiderV025(r, options.normalization || "equalized"));
  const calendar = normalized.calendar?.length ? clone(normalized.calendar) : buildHistoricalCalendarV025(normalized.season);
  TEAMS.splice(0, TEAMS.length, ...teams);
  RIDERS.splice(0, RIDERS.length, ...riders);
  RACES.splice(0, RACES.length, ...calendar);
  SEASON_RACE_IDS.splice(0, SEASON_RACE_IDS.length, ...calendar.map(r=>r.id));
  Game.selectedRaceId = calendar[0]?.id || RACES[0]?.id;
  Game.seasonIndex = 0;
  Game.selectedTeamId = null;
  Game.riders = clone(RIDERS);
  Game.manager = null;
  Game.v024 = null;
  Game.rosterLocked = false;
  Game.finished = false;
  Game.betweenRaces = false;
  Game.seasonFinished = false;
  return normalized;
}

async function activateHistoricalYearV025(year, notify=true) {
  ensureHistoricalStateV025();
  year = Number(year);
  try {
    const pack = await loadHistoricalPackV025(year);
    activatePackDataV025(pack, {normalization:Game.historical.eraNormalization});
    Game.historical.selectedYear = year;
    Game.historical.databaseMode = "season";
    Game.historical.activeYears = [year];
    Game.historical.teamLevelFilter = "all";
    Game.historical.activePackStatus = pack.completeness?.status || "unknown";
    Game.historical.dataMessage = `${pack.teams.length} equipos · ${pack.riders.length} corredores cargados para ${year}`;
    if (notify) toast(`Temporada ${year} cargada`);
    renderHome();
  } catch (error) {
    console.error(error);
    HistoricalV025.lastError = error.message;
    Game.historical.dataMessage = error.message;
    toast(error.message);
    renderHome();
  }
}

async function activateSpecialEraV025() {
  ensureHistoricalStateV025();
  const years = [...new Set((Game.historical.specialYears || []).map(Number))].sort((a,b)=>a-b);
  if (years.length < 2) return toast("Selecciona al menos dos temporadas con pack disponible");
  try {
    const packs = await Promise.all(years.map(loadHistoricalPackV025));
    const namespaced = packs.map(namespacePackV025);
    const teams = namespaced.flatMap(p=>p.teams);
    const riders = namespaced.flatMap(p=>p.riders).map(r=>eraAdjustedRiderV025(r,Game.historical.eraNormalization));
    const calendarYear = Number(Game.historical.specialCalendarYear || Math.max(...years));
    const host = packs.find(p=>p.season===calendarYear) || packs[packs.length-1];
    const calendarBase = host.calendar?.length ? host.calendar : buildHistoricalCalendarV025(calendarYear);
    const calendar = clone(calendarBase).map(r=>({...r,id:`special_${years.join("_")}__${r.id}`,season:calendarYear,stages:(r.stages||[]).map(s=>({...s,id:`special_${years.join("_")}__${s.id}`}))}));
    TEAMS.splice(0,TEAMS.length,...teams);
    RIDERS.splice(0,RIDERS.length,...riders);
    RACES.splice(0,RACES.length,...calendar);
    SEASON_RACE_IDS.splice(0,SEASON_RACE_IDS.length,...calendar.map(r=>r.id));
    Game.selectedRaceId = calendar[0]?.id;
    Game.seasonIndex = 0;
    Game.selectedTeamId = null;
    Game.riders = clone(RIDERS);
    Game.manager = null;
    Game.v024 = null;
    Game.rosterLocked = false;
    Game.finished = false;
    Game.betweenRaces = false;
    Game.seasonFinished = false;
    Game.historical.databaseMode = "special";
    Game.historical.activeYears = years;
    Game.historical.activePackStatus = "cross-era";
    Game.historical.dataMessage = `Cruce de épocas activo: ${years.join(", ")} · ${teams.length} equipos · ${riders.length} corredores`;
    toast("Temporada especial cargada");
    renderHome();
  } catch (error) {
    console.error(error);
    HistoricalV025.lastError = error.message;
    Game.historical.dataMessage = error.message;
    toast(error.message);
    renderHome();
  }
}

function setHistoricalGameModeV025(mode) {
  ensureHistoricalStateV025();
  if (mode === "single") { Game.mode="single"; Game.historical.databaseMode="season"; }
  if (mode === "season") { Game.mode="season"; Game.historical.databaseMode="season"; }
  if (mode === "special-single") { Game.mode="single"; Game.historical.databaseMode="special"; }
  if (mode === "special-season") { Game.mode="season"; Game.historical.databaseMode="special"; }
  Game.seasonIndex = 0;
  Game.selectedRaceId = RACES[0]?.id;
  renderHome();
}

function toggleSpecialYearV025(year, checked) {
  ensureHistoricalStateV025();
  year = Number(year);
  const set = new Set(Game.historical.specialYears || []);
  checked ? set.add(year) : set.delete(year);
  Game.historical.specialYears = [...set].sort((a,b)=>a-b);
  renderHome();
}

function setHistoricalSearchV025(value) {
  ensureHistoricalStateV025();
  Game.historical.teamSearch = String(value || "");
  renderHome();
}

function setHistoricalLevelV025(value) {
  ensureHistoricalStateV025();
  Game.historical.teamLevelFilter = value;
  renderHome();
}

function filteredTeamsV025() {
  ensureHistoricalStateV025();
  const queryTokens = searchTokensV025(Game.historical.teamSearch || "");
  const level = Game.historical.teamLevelFilter;
  return TEAMS.filter(t => {
    const searchableTokens = searchTokensV025(`${t.name} ${t.displayName || ""} ${t.country} ${t.season} ${t.lineage || ""}`);
    return containsTokenSequenceV025(searchableTokens, queryTokens) && (level === "all" || t.level === level);
  });
}

function packStatusLabelV025(entry) {
  if (!entry) return "No catalogado";
  return {
    "included-tour-elite-archive":"Incluido · élite histórica",
    "included-simulator-wt-base":"Incluido · 18 WorldTeams",
    "major-riders-verified":"Incluido · selección compacta de figuras",
    "complete-simulator-v024":"Completo · base íntegra del simulador v0.24",
    "included-open-dataset":"Incluido · dataset abierto",
    "included-simulator-base":"Incluido · base v0.24+",
    "build-required":"Pendiente de generación",
    "complete":"Completo",
    "partial":"Parcial"
  }[entry.status] || entry.status;
}

function renderHistoricalDataPanelV025() {
  ensureHistoricalStateV025();
  const current = manifestEntryV025(Game.historical.selectedYear);
  const available = availableHistoricalYearsV025();
  const icons = ["ONCE","Banesto","US Postal","Caisse d'Epargne","Kelme","Astana","Trek","Telekom","T-Mobile","Cofidis","Saunier Duval"];
  return `<section class="panel historical-control-panel">
    <div class="historical-control-head"><div><h2>Archivo WT / élite 1990-2026</h2><p class="muted">Selecciona un año para cargar únicamente sus grandes equipos. De 2005 en adelante se identifica la máxima categoría UCI; para 1990-2004 se usa el equivalente élite de la época presente en el Tour.</p></div><span class="badge ${current?.file ? "green" : "orange"}">${packStatusLabelV025(current)}</span></div>
    <div class="historical-controls-grid">
      <label>Año de temporada<select onchange="activateHistoricalYearV025(Number(this.value))">${allHistoricalYearsV025().map(y=>{const e=manifestEntryV025(y);return `<option value="${y}" ${y===Game.historical.selectedYear?"selected":""}>${y} · ${e?.file?`${e.teamCount} equipos / ${e.riderCount} corredores`:"no disponible"}</option>`}).join("")}</select></label>
      <label>Normalización entre épocas<select onchange="Game.historical.eraNormalization=this.value;renderHome()"><option value="equalized" ${Game.historical.eraNormalization==="equalized"?"selected":""}>Igualada · capacidades puras</option><option value="authentic" ${Game.historical.eraNormalization==="authentic"?"selected":""}>Tecnología de época · aero/CRI históricos</option></select></label>
      <label>Buscar equipo<input class="historical-search" value="${esc(Game.historical.teamSearch)}" oninput="setHistoricalSearchV025(this.value)" placeholder="ONCE, Banesto, Telekom…"></label>
      <label>Nivel<select onchange="setHistoricalLevelV025(this.value)"><option value="all">Todos los equipos cargados</option>${[...new Set(TEAMS.map(t=>t.level))].sort().map(l=>`<option value="${esc(l)}" ${Game.historical.teamLevelFilter===l?"selected":""}>${esc(l)}</option>`).join("")}</select></label>
    </div>
    <div class="historical-iconic-search"><span>Acceso rápido:</span>${icons.map(name=>`<button class="chip-button" onclick="setHistoricalSearchV025('${name.replaceAll("'","\\'")}')">${esc(name)}</button>`).join("")}<button class="chip-button clear" onclick="setHistoricalSearchV025('')">Todos</button></div>
    <div class="historical-status"><strong>${esc(Game.historical.dataMessage || "")}</strong><span>Los ${available.length} packs anuales están incluidos. Las reservas de archivo se identifican en la ficha del corredor y nunca usan nombres inventados.</span></div>
    <div class="historical-tools-row"><button class="secondary" onclick="document.getElementById('historical-pack-input').click()">Importar pack JSON</button><input id="historical-pack-input" type="file" accept="application/json,.json" hidden onchange="importHistoricalPackV025(this.files[0])"><button class="secondary" onclick="Game.historical.showDataTools=!Game.historical.showDataTools;renderHome()">${Game.historical.showDataTools?"Ocultar":"Ver"} trazabilidad</button></div>
    ${Game.historical.showDataTools?`<div class="data-tools-note"><strong>Criterio histórico:</strong> “WorldTeam” existe desde 2015 y “UCI ProTeam” fue la categoría superior entre 2005 y 2014. Para 1990-2004 se muestra el pelotón élite equivalente. La base de corredores 1990-2025 se deriva del archivo histórico del Tour; 2026 usa la base WT del simulador.</div>`:""}
  </section>`;
}

function renderSpecialEraPanelV025() {
  ensureHistoricalStateV025();
  const available = availableHistoricalYearsV025();
  return `<section class="panel special-era-panel"><div class="historical-control-head"><div><h2>Temporada especial · cruce de épocas</h2><p class="muted">Combina equipos de varias temporadas en la misma carrera o calendario. Los IDs quedan aislados por año y el maillot muestra su temporada.</p></div><span class="badge jersey-rainbow">MULTI-ERA</span></div>
    <div class="special-years">${allHistoricalYearsV025().map(year=>{const ready=available.includes(year);const checked=(Game.historical.specialYears||[]).includes(year);return `<label class="year-chip ${ready?"ready":"missing"}"><input type="checkbox" ${checked?"checked":""} ${ready?"":"disabled"} onchange="toggleSpecialYearV025(${year},this.checked)"><span>${year}</span></label>`}).join("")}</div>
    <div class="historical-controls-grid"><label>Calendario anfitrión<select onchange="Game.historical.specialCalendarYear=Number(this.value)">${available.map(y=>`<option value="${y}" ${Game.historical.specialCalendarYear===y?"selected":""}>${y}</option>`).join("")}</select></label><div class="special-launch"><button onclick="activateSpecialEraV025()">Cargar cruce de épocas</button></div></div>
  </section>`;
}

async function importHistoricalPackV025(file) {
  if (!file) return;
  try {
    const pack = normalizePackV025(JSON.parse(await file.text()));
    HistoricalV025.packCache[pack.season] = pack;
    HistoricalV025.importedYears.add(pack.season);
    let entry = manifestEntryV025(pack.season);
    if (!entry) { entry={year:pack.season}; HistoricalV025.manifest.years.push(entry); }
    Object.assign(entry,{status:pack.completeness?.status || "imported",teamCount:pack.teams.length,riderCount:pack.riders.length,file:`${pack.season}.json`});
    Game.historical.selectedYear = pack.season;
    activatePackDataV025(pack,{normalization:Game.historical.eraNormalization});
    Game.historical.activeYears=[pack.season];
    Game.historical.dataMessage=`Pack ${pack.season} importado: ${pack.teams.length} equipos · ${pack.riders.length} corredores`;
    toast("Pack histórico importado");
    renderHome();
  } catch(error) { console.error(error); toast(`Pack inválido: ${error.message}`); }
}

/* ============================================================
   Maillots 3D por temporada
   ============================================================ */

renderJersey = function(team) {
  const visual = team.visual || generatedVisualV025(team.name, team.season || 2026);
  const pattern = visual.pattern || ["diagonal","center","bands","chevron"][stableHashV025(team.name)%4];
  return `<div class="jersey-card historical-jersey-card"><div class="jersey-year">${team.season || 2026}</div><div class="jersey-3d jersey-pattern-${pattern}"><div class="jersey-sleeve left"></div><div class="jersey-body"><div class="jersey-neck"></div><div class="stripe stripe-a"></div><div class="stripe stripe-b"></div><span>${esc(visual.logoText || "TEAM")}</span><small>${esc(team.displayName || team.name)}</small></div><div class="jersey-sleeve right"></div></div></div>`;
};

renderTeamCard = function(team) {
  const riders = RIDERS.filter(r=>r.teamId===team.id).sort((a,b)=>b.base-a.base);
  const visual = team.visual || generatedVisualV025(team.name,team.season||2026);
  const sourceStatus = team.source?.status || team.source?.provider || "database";
  return `<div class="team-card historical-team-card" style="--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-accent:${visual.accent};">
    ${renderJersey({...team,visual})}<div class="badge-row"><span class="badge jersey-rainbow">${team.season || Game.historical?.selectedYear || 2026}</span><span class="badge green">${esc(team.level || "PRO")}</span><span class="badge">${esc(team.archetype || "Equipo profesional")}</span><span class="badge blue">${riders.length} corredores</span></div>
    <h3>${esc(team.displayName || team.name)}</h3><p class="muted small">${esc(team.country || "International")} · ${esc(getFrame(team.material?.frame).name)} · ${esc(getWheels(team.material?.wheels).name)}</p>
    <div class="chip-row">${riders.slice(0,6).map(r=>`<span class="chip">${esc(r.name)} · ${r.base}</span>`).join("")}</div>
    <p class="data-provenance">Datos: ${esc(sourceStatus)}${riders.some(r=>r.archivalReserve)?` · ${riders.filter(r=>r.archivalReserve).length} reservas de archivo`:""}</p><button ${riders.length < 2 ? "disabled" : ""} onclick="selectTeam('${team.id}')">${riders.length < 2 ? "Sin plantilla jugable" : `Seleccionar ${team.season || ""} · ${Math.min(ROSTER_SIZE,riders.length)} corredores`}</button>
  </div>`;
};

/* ============================================================
   Home histórico
   ============================================================ */

renderHome = function() {
  ensureHistoricalStateV025();
  const filtered = filteredTeamsV025();
  const modeKey = Game.historical.databaseMode === "special" ? (Game.mode === "season" ? "special-season" : "special-single") : Game.mode;
  app.innerHTML = `<div class="header"><div><h1>Cycling Manager Tour v0.25+ WT Historical</h1><p>WorldTeams y élite histórica por año · cruce de épocas · motor completo v0.24+</p></div><div class="top-actions"><button class="secondary" onclick="loadGame()">Cargar</button><button class="danger" onclick="clearSave()">Borrar guardado</button></div></div>
    <section class="panel"><h2>Modo de juego</h2><div class="mode-grid historical-mode-grid">
      <button class="mode-card ${modeKey==="single"?"active":""}" onclick="setHistoricalGameModeV025('single')"><strong>Carrera única histórica</strong><span>Una carrera con equipos del año seleccionado.</span></button>
      <button class="mode-card ${modeKey==="season"?"active":""}" onclick="setHistoricalGameModeV025('season')"><strong>Temporada histórica</strong><span>Calendario encadenado y equipos de una misma temporada.</span></button>
      <button class="mode-card ${modeKey==="special-single"?"active":""}" onclick="setHistoricalGameModeV025('special-single')"><strong>Carrera especial multi-era</strong><span>Equipos de años diferentes en un mismo evento.</span></button>
      <button class="mode-card ${modeKey==="special-season"?"active":""}" onclick="setHistoricalGameModeV025('special-season')"><strong>Temporada especial multi-era</strong><span>Calendario completo enfrentando generaciones.</span></button>
    </div></section>
    ${renderHistoricalDataPanelV025()}
    ${Game.historical.databaseMode==="special"?renderSpecialEraPanelV025():""}
    ${Game.mode==="single"?renderRaceSelector():renderSeasonPreview()}
    <section class="panel"><div class="historical-control-head"><div><h2>Elige equipo</h2><p class="muted">${filtered.length} equipos visibles · año(s): ${Game.historical.activeYears.join(", ")}</p></div><span class="badge blue">${RIDERS.length} corredores cargados</span></div><div class="grid teams">${filtered.map(renderTeamCard).join("") || `<div class="empty-state"><strong>No hay equipos activos para este filtro.</strong><span>Carga el pack del año o elimina el filtro.</span></div>`}</div></section>`;
};

/* ============================================================
   Calendario y encabezados por año
   ============================================================ */

const __v025_renderRaceSelectorBase = renderRaceSelector;
renderRaceSelector = function() {
  const years = Game.historical?.activeYears?.join(" / ") || "2026";
  return `<section class="panel"><h2>Carrera única · ${years}</h2><div class="race-grid">${RACES.map(r=>`<button class="race-card ${Game.selectedRaceId===r.id?"active":""}" onclick="Game.selectedRaceId='${r.id}';renderHome()"><span class="race-date">${esc(r.date || r.season || "")}</span><span class="race-title">${esc(r.name)}</span><span class="badge ${r.jerseyClass || ""}">${esc(r.jersey || r.type)}</span><span class="muted small">${r.stages.length} etapa${r.stages.length>1?"s":""} · ${esc(r.country || "")}</span></button>`).join("")}</div></section>`;
};

renderSeasonPreview = function() {
  const years = Game.historical?.activeYears?.join(" / ") || "2026";
  return `<section class="panel"><h2>Calendario de temporada · ${years}</h2><div class="season-calendar">${RACES.map((r,i)=>`<div class="calendar-card ${i===Game.seasonIndex?"active":""}"><span class="badge ${r.jerseyClass||""}">${esc(r.date || "")}</span><strong>${esc(r.name)}</strong><small>${r.stages.length} etapa${r.stages.length>1?"s":""} · ${esc(r.country||"")}</small></div>`).join("")}</div></section>`;
};

/* ============================================================
   Guardado histórico seguro
   ============================================================ */

saveGame = function(show=true) {
  ensureHistoricalStateV025();
  Game.version = V025_VERSION;
  const saved = safeStorageSet(V025_SAVE_KEY, JSON.stringify(Game));
  if (show) toast(saved?"Partida histórica guardada":"La partida continúa, pero el navegador bloquea localStorage");
  return saved;
};

loadGame = async function() {
  const raw = safeStorageGet(V025_SAVE_KEY);
  if (!raw) return toast("No hay guardado v0.25+ WT Historical");
  try {
    const obj = JSON.parse(raw);
    if (obj.version !== V025_VERSION) throw new Error("Versión de guardado incompatible");
    const historical = obj.historical || {selectedYear:2026,databaseMode:"season",activeYears:[2026]};
    Game.historical = clone(historical);
    if (historical.databaseMode === "special") {
      Game.historical.specialYears = historical.activeYears || historical.specialYears;
      await activateSpecialEraV025();
    } else {
      const year = Number(historical.selectedYear || historical.activeYears?.[0] || 2026);
      const pack = await loadHistoricalPackV025(year);
      activatePackDataV025(pack,{normalization:historical.eraNormalization});
    }
    Object.assign(Game,obj);
    sanitizeGameState();
    ensureV024State();
    render();
  } catch(error) { console.error(error); toast(`No se pudo cargar: ${error.message}`); }
};

clearSave = function() {
  [V025_SAVE_KEY,SAVE_KEY,"cyclingManager_v024","cyclingManager_v023","cyclingManager_v021","cyclingManager_v019"].forEach(safeStorageRemove);
  toast("Guardados del simulador borrados");
};

/* Reconfigurar init sin perder el pack activo. */
const __v025_initBase = init;
init = function() {
  ensureHistoricalStateV025();
  const historical = clone(Game.historical);
  Game.mode = "single";
  Game.selectedRaceId = RACES[0]?.id;
  Game.selectedTeamId = null;
  Game.seasonIndex = 0;
  Game.betweenRaces = false;
  Game.seasonFinished = false;
  Game.raceHistory = [];
  Game.pendingRosterIds = [];
  Game.raceRosters = {};
  Game.rosterLocked = false;
  Game.lastRaceRosterIds = [];
  Game.currentStageIndex = 0;
  Game.activeTab = "director";
  Game.riders = clone(RIDERS);
  Game.riderOrders = {};
  Game.riderEfforts = {};
  Game.riderEquipment = {};
  Game.protectedRiderId = null;
  Game.nutritionMode = "auto_smart";
  Game.nutritionPlanId = "balanced";
  Game.stock = {};
  Game.stageHistory = [];
  Game.lastStage = null;
  Game.live = null;
  Game.teamTimes = {};
  Game.finished = false;
  Game.manager = null;
  Game.v024 = null;
  Game.historical = historical;
  Game.version = V025_VERSION;
  renderHome();
};

ensureHistoricalStateV025();
{
  const curated2026 = clone(CURRENT_2026_MAJOR_PACK);
  curated2026.calendar = clone(HistoricalV025.baseRaces);
  HistoricalV025.packCache[2026] = normalizePackV025(curated2026);
}
activatePackDataV025(HistoricalV025.packCache[2026], {normalization:Game.historical.eraNormalization});
Game.historical.selectedYear = 2026;
Game.historical.activeYears = [2026];
Game.historical.activePackStatus = "complete-simulator-v024";
Game.historical.dataMessage = `${TEAMS.length} equipos · ${RIDERS.length} registros de corredor restaurados desde v0.24`;
Game.version = V025_VERSION;
renderHome();


/* ============================================================
   Convocatorias históricas adaptativas
   Mantiene 8 corredores en plantillas completas y permite disputar
   temporadas antiguas con archivos documentales más pequeños.
   ============================================================ */
function historicalRosterSizeV025(teamId) {
  const available = getFullTeamRiders(teamId).length;
  return Math.max(1, Math.min(ROSTER_SIZE, available));
}

prepareRosterSelection = function() {
  const required = historicalRosterSizeV025(Game.selectedTeamId);
  Game.pendingRosterIds = autoSelectRoster(Game.selectedTeamId, getRace()).slice(0, required).map(r => r.id);
  Game.raceRosters = {};
  Game.rosterLocked = false;
  Game.finished = false;
  Game.betweenRaces = false;
  Game.live = null;
  renderRosterSelection();
};

toggleRoster = function(id) {
  if (Game.rosterLocked) return;
  const required = historicalRosterSizeV025(Game.selectedTeamId);
  if (Game.pendingRosterIds.includes(id)) {
    Game.pendingRosterIds = Game.pendingRosterIds.filter(x => x !== id);
  } else {
    if (Game.pendingRosterIds.length >= required) return toast(`Máximo ${required} corredores para esta plantilla`);
    Game.pendingRosterIds.push(id);
  }
  renderRosterSelection();
};

confirmRoster = function() {
  const required = historicalRosterSizeV025(Game.selectedTeamId);
  const uniqueIds = [...new Set((Game.pendingRosterIds || []).filter(id => !!getRider(id) && getRider(id).teamId === Game.selectedTeamId))];
  if (uniqueIds.length !== required) {
    Game.pendingRosterIds = uniqueIds;
    renderRosterSelection();
    return toast(`Debes escoger exactamente ${required} corredores`);
  }
  try {
    Game.pendingRosterIds = uniqueIds;
    Game.raceRosters = {};
    TEAMS.forEach(team => {
      const teamSize = historicalRosterSizeV025(team.id);
      Game.raceRosters[team.id] = autoSelectRoster(team.id, getRace()).filter(Boolean).slice(0, teamSize).map(r => r.id);
    });
    Game.raceRosters[Game.selectedTeamId] = [...uniqueIds];
    Game.lastRaceRosterIds = [...uniqueIds];
    resetRaceState();
    Game.rosterLocked = true;
    renderRace();
    saveGame(false);
  } catch (error) {
    console.error("Error al confirmar convocatoria histórica:", error);
    Game.rosterLocked = false;
    toast("No se pudo iniciar la carrera. Revisa la convocatoria e inténtalo de nuevo.");
    renderRosterSelection();
  }
};

renderRosterSelection = function() {
  const team = getTeam(Game.selectedTeamId), race = getRace();
  const riders = getFullTeamRiders(Game.selectedTeamId).slice().sort((a,b) => b.base - a.base);
  const required = historicalRosterSizeV025(Game.selectedTeamId);
  const reserveCount = riders.filter(r=>r.archivalReserve).length;
  app.innerHTML = `<div class="header"><div><h1>Selecciona ${required} corredores</h1><p>${esc(team.name)} · ${esc(race.name)} · convocatoria histórica bloqueada durante la carrera</p></div><div class="top-actions"><button class="secondary" onclick="Game.selectedTeamId=null;renderHome()">Volver</button><button id="confirm-roster-button" type="button" onclick="confirmRoster()">Confirmar selección e iniciar</button></div></div>
    <section class="panel sticky-panel"><div class="roster-summary"><div><strong>${Game.pendingRosterIds.length}/${required} seleccionados</strong><p class="muted small">${required===ROSTER_SIZE?"Convocatoria completa de ocho corredores.":`Archivo parcial: se utilizarán los ${required} corredores disponibles.`}${reserveCount?` · ${reserveCount} reservas reales de la misma estructura y temporadas cercanas.`:""}</p></div><div class="chip-row">${Game.pendingRosterIds.map(id => `<span class="chip selected">${esc(getRider(id).name)}</span>`).join("")}</div></div></section>
    <section class="panel"><h2>Plantilla ${team.season || ""}</h2><div class="roster-grid">${riders.map(renderRosterCard).join("")}</div></section>`;
};

renderRosterCard = function(r) {
  const selected = Game.pendingRosterIds.includes(r.id);
  const archive = r.archivalReserve ? `<span class="badge historical-reserve">Reserva ${r.sourceSeason || "archivo"}</span>` : "";
  return `<button class="roster-card ${selected?"selected":""}" onclick="toggleRoster('${r.id}')"><div class="badge-row"><span class="badge green">${esc(r.role)}</span><span class="badge blue">Base ${r.base}</span><span class="badge orange">Forma ${Math.round(r.form)}</span>${archive}</div><h3>${esc(r.name)}</h3><p class="muted small">${esc(r.nationality)} · ${r.age} años · ${r.weightKg} kg</p>${miniStats(r)}</button>`;
};

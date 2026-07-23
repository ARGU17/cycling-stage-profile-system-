/* ============================================================
   CYCLING MANAGER v0.27 · GRAND TOUR STAGE LAB INTEGRATION

   Workflow:
   1. Competition + team are selected in the existing manager.
   2. Grand Tour Stage Lab opens as an independent full-screen workspace.
   3. The generated/routed GPX tour is compacted and converted to native
      Cycling Manager stages.
   4. The original roster selection and all v0.24+ systems continue unchanged.
   ============================================================ */

const CM_STAGE_LAB_VERSION = "v0.27-stage-lab";
const CM_STAGE_LAB_MAX_POINTS_PER_STAGE = 2200;
const CM_STAGE_LAB_COUNTRY_MODE = {
  "France": "france",
  "Spain": "spain",
  "Italy": "italy",
  "Australia": "australia",
  "United Arab Emirates": "uae",
  "Belgium": "belgium",
  "Netherlands": "netherlands",
  "Belgium/Netherlands": "benelux",
  "Germany": "germany",
  "Switzerland": "switzerland",
  "Denmark": "denmark",
  "Poland": "poland",
  "Canada": "canada",
  "China": "china",
  "World": "world"
};

// The v0.26 database can replace RACES when the user changes year or builds a
// multi-era field. Baselines are therefore captured lazily per concrete race
// definition instead of once at page load.
const CM_STAGE_LAB_BASE_STAGES = new Map();

function stageLabBaseKey(race) {
  const activeYears = Game.historical?.activeYears?.length
    ? Game.historical.activeYears.join("-")
    : (Game.v026?.wizard?.selectedYears?.join("-") || Game.v026?.wizard?.selectedYear || race?.season || "current");
  const signature = (race?.stages || []).map(stage => `${stage.id}:${stage.distance}:${stage.type}`).join("|");
  return `${race?.id || "race"}::${activeYears}::${signature}`;
}

function rememberStageLabBase(race) {
  if (!race) return null;
  const key = stageLabBaseKey(race);
  if (!CM_STAGE_LAB_BASE_STAGES.has(key)) CM_STAGE_LAB_BASE_STAGES.set(key, clone(race.stages || []));
  return key;
}

function rememberAllStageLabBases() {
  (typeof RACES !== "undefined" ? RACES : []).forEach(rememberStageLabBase);
}

rememberAllStageLabBases();

let CM_STAGE_LAB_ACCEPTING = false;

function ensureStageLabManagerState() {
  if (!Game.stageLab || typeof Game.stageLab !== "object") {
    Game.stageLab = {};
  }
  const state = Game.stageLab;
  state.version = CM_STAGE_LAB_VERSION;
  state.enabled = state.enabled !== false;
  state.screenActive = Boolean(state.screenActive);
  state.pendingRaceId ||= null;
  state.activeRaceId ||= null;
  state.activeRaceData ||= null;
  state.baseKey ||= null;
  state.skippedRaceId ||= null;
  state.lastError ||= null;
  return state;
}

function stageLabHash(text) {
  let h = 2166136261;
  const value = String(text || "cycling-manager");
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0) || 20260714;
}

function stageLabModeForRace(race) {
  return CM_STAGE_LAB_COUNTRY_MODE[race?.country] || "europe";
}

function stageLabEventConfig(race = getRace()) {
  const stages = race?.stages?.length ? race.stages : [];
  const stageTypes = stages.map(stage => stage.type);
  const count = type => stageTypes.filter(value => value === type).length;
  const totalDistance = stages.reduce((sum, stage) => sum + toNum(stage.distance, 0), 0);
  const maxDistance = Math.max(30, ...stages.map(stage => toNum(stage.distance, 30)));
  const hillyCount = count("hilly") + count("cobbles");
  const mountainCount = count("mountain");
  const timeTrialCount = count("tt") + count("ttt");
  const summitCount = Math.min(
    mountainCount,
    Math.max(0, stages.filter(stage => stage.finalClimb || stage.type === "mountain").length)
  );

  return {
    id: race.id,
    name: race.name,
    country: race.country,
    mode: stageLabModeForRace(race),
    stageCount: Math.max(1, stages.length),
    seed: stageLabHash(`${race.id}|${race.date}|${race.name}`),
    totalDistance: Math.max(30, Math.round(totalDistance)),
    flatCount: count("flat"),
    rollingCount: hillyCount,
    mediumCount: 0,
    highCount: mountainCount,
    ittCount: timeTrialCount,
    summitCount,
    maxStageDistance: Math.min(300, Math.max(45, Math.ceil(maxDistance * 1.06))),
    stageTypes,
    stageDistances: stages.map(stage => stageLabRound(toNum(stage.distance, 30), 1)),
    naturalConditions: `${race.name}: ${stages.length} etapa${stages.length === 1 ? "" : "s"} en ${race.country}, ${count("flat")} llanas, ${hillyCount} quebradas o de pavé, ${mountainCount} de montaña y ${timeTrialCount} contrarreloj. Mantener la estructura deportiva del evento.`
  };
}

function stageLabTargetOrigin() {
  return window.location.origin === "null" ? "*" : window.location.origin;
}

function stageLabFrame() {
  return document.getElementById("cmStageLabFrame");
}

function sendStageLabInit() {
  const state = ensureStageLabManagerState();
  const race = byId(RACES, state.pendingRaceId) || getRace();
  const frame = stageLabFrame();
  if (!frame?.contentWindow || !race) return;
  frame.contentWindow.postMessage(
    { type: "CM_STAGE_LAB_INIT", event: stageLabEventConfig(race) },
    stageLabTargetOrigin()
  );
  const status = document.getElementById("cmStageLabStatus");
  if (status) status.textContent = `Stage Lab conectado a ${race.name}. Generando la propuesta inicial…`;
}

function renderStageLabSetup() {
  const state = ensureStageLabManagerState();
  const race = byId(RACES, state.pendingRaceId) || getRace();
  const team = getTeam(Game.selectedTeamId);
  if (!race || !team) return renderHome();
  state.screenActive = true;
  state.pendingRaceId = race.id;

  const cfg = stageLabEventConfig(race);
  app.innerHTML = `
    <div class="stage-lab-manager-shell">
      <div class="header stage-lab-manager-header">
        <div>
          <div class="badge-row">
            <span class="badge green">GRAND TOUR STAGE LAB</span>
            <span class="badge blue">${esc(race.country)}</span>
            <span class="badge orange">${cfg.stageCount} etapa${cfg.stageCount === 1 ? "" : "s"}</span>
          </div>
          <h1>${esc(race.name)}</h1>
          <p>${esc(team.name)} · genera, revisa o enruta los GPX que utilizará el motor físico de la competición.</p>
        </div>
        <div class="top-actions">
          <button class="secondary" onclick="cancelStageLabSetup()">Volver al calendario</button>
          <button class="secondary" onclick="reloadStageLabFrame()">Recargar Stage Lab</button>
          <button onclick="skipStageLabForCurrentRace()">Continuar con recorridos actuales</button>
        </div>
      </div>

      <section class="panel stage-lab-manager-info">
        <div>
          <strong id="cmStageLabStatus">Inicializando Grand Tour Stage Lab…</strong>
          <span>Al pulsar <b>Usar GPX en Cycling Manager</b>, las etapas generadas sustituirán únicamente la geometría, altimetría y sectores del evento actual. Corredores, CP/W′, IA, contratos, material, nutrición, tácticas, clasificaciones y persistencia, archivo histórico y Director Suite v0.26 se conservan.</span>
        </div>
        <div class="stage-lab-config-chips">
          <span>${Math.round(cfg.totalDistance)} km objetivo</span>
          <span>${cfg.flatCount} llanas</span>
          <span>${cfg.rollingCount} quebradas/pavé</span>
          <span>${cfg.highCount} montaña</span>
          <span>${cfg.ittCount} CRI/CRE</span>
        </div>
      </section>

      <section class="stage-lab-iframe-panel">
        <iframe
          id="cmStageLabFrame"
          src="stage-lab/index.html?embed=manager&event=${encodeURIComponent(race.id)}"
          title="Grand Tour Stage Lab para ${esc(race.name)}"
          allow="fullscreen"
          onload="sendStageLabInit()"
        ></iframe>
      </section>
    </div>`;
}

function reloadStageLabFrame() {
  const frame = stageLabFrame();
  if (!frame) return;
  const src = frame.src;
  frame.src = "about:blank";
  setTimeout(() => { frame.src = src; }, 50);
}

function cancelStageLabSetup() {
  const state = ensureStageLabManagerState();
  state.screenActive = false;
  state.pendingRaceId = null;
  Game.selectedTeamId = null;
  Game.rosterLocked = false;
  renderHome();
}

function restoreBaseRaceStages(raceId) {
  const state = ensureStageLabManagerState();
  const race = byId(RACES, raceId);
  if (!race) return false;
  const key = state.baseKey || rememberStageLabBase(race);
  const base = key ? CM_STAGE_LAB_BASE_STAGES.get(key) : null;
  if (!base) return false;
  race.stages = clone(base);
  return true;
}

function skipStageLabForCurrentRace() {
  const state = ensureStageLabManagerState();
  const race = byId(RACES, state.pendingRaceId) || getRace();
  if (!race) return;
  restoreBaseRaceStages(race.id);
  state.skippedRaceId = race.id;
  state.activeRaceId = null;
  state.activeRaceData = null;
  state.screenActive = false;
  state.pendingRaceId = null;
  CM_STAGE_LAB_ACCEPTING = false;
  __cm_stage_lab_prepareRosterSelection();
  toast(`Se mantienen los recorridos actuales de ${race.name}`);
}

function stageLabRound(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(toNum(value, 0) * factor) / factor;
}

function compactStageLabPoints(points, maximum = CM_STAGE_LAB_MAX_POINTS_PER_STAGE) {
  const source = Array.isArray(points) ? points.filter(point => Number.isFinite(Number(point?.distanceKm))) : [];
  if (source.length < 2) throw new Error("La etapa no contiene suficientes puntos GPX");
  const step = Math.max(1, Math.ceil(source.length / maximum));
  const sampled = source.filter((_, index) => index % step === 0);
  if (sampled[sampled.length - 1] !== source[source.length - 1]) sampled.push(source[source.length - 1]);

  const compact = sampled.map(point => [
    stageLabRound(Number(point.distanceKm) * 1000, 1),
    stageLabRound(point.ele, 1),
    stageLabRound(point.grade, 1),
    stageLabRound(point.lat, 6),
    stageLabRound(point.lon, 6)
  ]).filter((point, index, arr) => index === 0 || point[0] > arr[index - 1][0]);

  if (compact.length < 2) throw new Error("La geometría GPX no es válida");
  compact[0][0] = 0;
  return compact;
}

function scaleStageFeatures(features, oldDistance, newDistance) {
  const ratio = newDistance / Math.max(0.001, oldDistance || newDistance);
  return (features || []).map(feature => {
    const copy = clone(feature);
    if (Number.isFinite(copy.from)) copy.from = stageLabRound(copy.from * ratio, 1);
    if (Number.isFinite(copy.to)) copy.to = stageLabRound(copy.to * ratio, 1);
    if (Number.isFinite(copy.km)) copy.km = stageLabRound(copy.km * ratio, 1);
    return copy;
  });
}

function stageLabTypeToManager(labType, baseType) {
  // Sporting formats that cannot be inferred from geometry remain fixed. Road
  // stages, however, adopt the generated relief so a flat blueprint can become
  // hilly or mountainous when the accepted GPX actually demands it.
  if (["tt", "ttt", "cobbles"].includes(baseType)) return baseType;
  const map = {
    flat: "flat",
    rolling: "hilly",
    punchy: "hilly",
    medium_mountain: "hilly",
    high_mountain: "mountain",
    mountain: "mountain",
    hilly: "hilly",
    itt: "tt",
    ttt: "ttt"
  };
  return map[labType] || baseType || "hilly";
}

function stageLabLabel(type) {
  return {
    flat: "Llana",
    hilly: "Media montaña",
    mountain: "Alta montaña",
    cobbles: "Pavés y muros",
    tt: "CRI",
    ttt: "CRE"
  }[type] || "Etapa GPX";
}

function managerStageFromStageLab(race, baseStage, labStage, index) {
  const points = compactStageLabPoints(labStage.points);
  const distanceKm = Math.max(0.1, points[points.length - 1][0] / 1000);
  const type = stageLabTypeToManager(labStage.type, baseStage?.type);
  const elevations = points.map(point => point[1]);
  const ascentM = Math.max(0, toNum(labStage.ascentM, baseStage?.elevation));
  const meta = {
    distanceKm,
    totalAscentM: ascentM,
    minElevationM: Math.min(...elevations),
    maxElevationM: Math.max(...elevations)
  };
  const stage = {
    ...(baseStage ? clone(baseStage) : {}),
    id: `${race.id}_${String(index + 1).padStart(2, "0")}`,
    number: index + 1,
    name: `${race.name} · ${labStage.routeLabel || `Etapa ${index + 1}`}`,
    label: stageLabLabel(type),
    type,
    distance: stageLabRound(distanceKm, 2),
    elevation: Math.round(ascentM),
    difficulty: gpxStageDifficulty(meta, type),
    description: `Recorrido generado con Grand Tour Stage Lab: ${labStage.routeLabel || "GPX"}.`,
    finalClimb: Boolean(labStage.summitFinish),
    climbs: [],
    paves: scaleStageFeatures(baseStage?.paves, baseStage?.distance, distanceKm),
    walls: scaleStageFeatures(baseStage?.walls, baseStage?.distance, distanceKm),
    weather: clone(baseStage?.weather || raceWeather(race.month, race.climate, index + 1)),
    gpxAvailable: true,
    gpx: {
      version: CM_STAGE_LAB_VERSION,
      sourceFile: `${race.id}-stage-${index + 1}.gpx`,
      source: labStage.source || "included",
      routeStatus: labStage.routeStatus || labStage.source || "included",
      routeLabel: labStage.routeLabel || `Etapa ${index + 1}`,
      country: labStage.country || race.country,
      regionName: labStage.regionName || "",
      pointSpacingM: Math.round(distanceKm * 1000 / Math.max(1, points.length - 1)),
      gradeWindowM: 100,
      points
    },
    stageLab: {
      stageId: labStage.id,
      seed: labStage.seed,
      source: labStage.source,
      routeStatus: labStage.routeStatus,
      country: labStage.country,
      regionName: labStage.regionName,
      startName: labStage.startName,
      finishName: labStage.finishName
    }
  };

  stage.climbs = gpxDetectClimbs(stage);
  stage.finalClimb = stage.finalClimb || stage.climbs.some(climb => stage.distance - climb.km < 1.3);
  stage.profilePoints = gpxBuildCompatibilityProfile(stage);
  stage.sectors = gpxBuildSectors(stage);
  return stage;
}

function convertStageLabTourForRace(race, tour) {
  if (!tour || !Array.isArray(tour.stages)) throw new Error("Stage Lab no ha enviado una vuelta válida");
  if (tour.stages.length !== race.stages.length) {
    throw new Error(`El evento necesita ${race.stages.length} etapas y Stage Lab ha enviado ${tour.stages.length}`);
  }
  const state = ensureStageLabManagerState();
  state.baseKey = state.baseKey || rememberStageLabBase(race);
  const baseStages = CM_STAGE_LAB_BASE_STAGES.get(state.baseKey) || race.stages;
  const stages = tour.stages.map((labStage, index) => managerStageFromStageLab(race, baseStages[index], labStage, index));
  return {
    schema: "cycling-manager/stage-lab-race-v1",
    raceId: race.id,
    raceName: race.name,
    generatedAt: new Date().toISOString(),
    sourceTitle: tour.title,
    baseKey: state.baseKey,
    config: {
      mode: tour.config?.mode,
      seed: tour.config?.seed,
      stageCount: tour.stages.length
    },
    stages
  };
}

function applyStageLabRaceData(data) {
  if (!data?.raceId || !Array.isArray(data.stages)) return false;
  const race = byId(RACES, data.raceId);
  if (!race) return false;
  race.stages = clone(data.stages);
  const state = ensureStageLabManagerState();
  if (data.baseKey) state.baseKey = data.baseKey;
  return true;
}

function restoreActiveStageLabRace() {
  const state = ensureStageLabManagerState();
  if (!state.activeRaceData || state.activeRaceData.raceId !== state.activeRaceId) return false;
  return applyStageLabRaceData(state.activeRaceData);
}

function acceptStageLabTour(eventId, tour) {
  const state = ensureStageLabManagerState();
  const race = byId(RACES, eventId);
  if (!race || eventId !== state.pendingRaceId || CM_STAGE_LAB_ACCEPTING) return;
  CM_STAGE_LAB_ACCEPTING = true;
  const status = document.getElementById("cmStageLabStatus");
  if (status) status.textContent = "Convirtiendo GPX, detectando puertos y creando sectores físicos cada 250 m…";

  setTimeout(() => {
    try {
      const data = convertStageLabTourForRace(race, tour);
      applyStageLabRaceData(data);
      state.activeRaceId = race.id;
      state.activeRaceData = data;
      state.skippedRaceId = null;
      state.pendingRaceId = null;
      state.screenActive = false;
      state.lastError = null;
      CM_STAGE_LAB_ACCEPTING = false;
      __cm_stage_lab_prepareRosterSelection();
      if (typeof saveGame === "function") saveGame(false);
      toast(`${race.name}: GPX de Stage Lab integrados en el motor físico v0.27`);
    } catch (error) {
      console.error("Stage Lab: error al convertir el evento", error);
      state.lastError = error.message;
      CM_STAGE_LAB_ACCEPTING = false;
      if (status) status.textContent = `Error: ${error.message}`;
      toast("No se pudieron integrar los GPX. Revisa la configuración del Stage Lab.");
    }
  }, 30);
}

window.addEventListener("message", event => {
  const sameOrigin = window.location.origin === "null" || event.origin === window.location.origin;
  if (!sameOrigin || event.source !== stageLabFrame()?.contentWindow) return;
  const message = event.data || {};
  if (message.source !== "grand-tour-stage-lab") return;
  if (message.type === "CM_STAGE_LAB_READY") {
    sendStageLabInit();
  }
  if (message.type === "CM_STAGE_LAB_ACCEPT") {
    acceptStageLabTour(message.eventId, message.tour);
  }
});

const __cm_stage_lab_prepareRosterSelection = prepareRosterSelection;
prepareRosterSelection = function() {
  const state = ensureStageLabManagerState();
  const race = getRace();
  if (!state.enabled || !race) return __cm_stage_lab_prepareRosterSelection();
  state.baseKey = rememberStageLabBase(race);

  if (state.activeRaceId === race.id && state.activeRaceData) {
    applyStageLabRaceData(state.activeRaceData);
    state.screenActive = false;
    state.pendingRaceId = null;
    return __cm_stage_lab_prepareRosterSelection();
  }
  if (state.skippedRaceId === race.id) {
    state.screenActive = false;
    state.pendingRaceId = null;
    return __cm_stage_lab_prepareRosterSelection();
  }

  // Keep only the active event in the save payload. Completed season events no
  // longer need their route geometry once the next race is selected.
  if (state.activeRaceId && state.activeRaceId !== race.id) {
    state.activeRaceId = null;
    state.activeRaceData = null;
    state.baseKey = rememberStageLabBase(race);
  }
  state.skippedRaceId = null;
  state.pendingRaceId = race.id;
  state.screenActive = true;
  Game.rosterLocked = false;
  Game.live = null;
  Game.finished = false;
  renderStageLabSetup();
};

const __cm_stage_lab_render = render;
render = function() {
  const state = ensureStageLabManagerState();
  if (state.screenActive && Game.selectedTeamId && !Game.rosterLocked) return renderStageLabSetup();
  return __cm_stage_lab_render();
};

const __cm_stage_lab_init = init;
init = function() {
  __cm_stage_lab_init();
  rememberAllStageLabBases();
  Game.stageLab = {
    version: CM_STAGE_LAB_VERSION,
    enabled: true,
    screenActive: false,
    pendingRaceId: null,
    activeRaceId: null,
    activeRaceData: null,
    baseKey: null,
    skippedRaceId: null,
    lastError: null
  };
};

const __cm_stage_lab_loadGame = loadGame;
loadGame = async function() {
  const result = await __cm_stage_lab_loadGame();
  rememberAllStageLabBases();
  restoreActiveStageLabRace();
  if (Game.selectedTeamId) render();
  return result;
};

const __cm_stage_lab_renderHome = renderHome;
renderHome = function() {
  __cm_stage_lab_renderHome();
  app.querySelectorAll(".race-card").forEach(card => {
    if (card.querySelector(".stage-lab-calendar-badge")) return;
    card.insertAdjacentHTML("beforeend", `<span class="badge green stage-lab-calendar-badge">GPX / STAGE LAB</span>`);
  });
};

// New games must never inherit a pending iframe or route from the previous run.
if (typeof resetWizardV026 === "function") {
  const __cm_stage_lab_resetWizardV026 = resetWizardV026;
  resetWizardV026 = function() {
    __cm_stage_lab_resetWizardV026();
    Game.stageLab = {
      version: CM_STAGE_LAB_VERSION,
      enabled: true,
      screenActive: false,
      pendingRaceId: null,
      activeRaceId: null,
      activeRaceData: null,
      baseKey: null,
      skippedRaceId: null,
      lastError: null
    };
  };
}

ensureStageLabManagerState();
if (!Game.selectedTeamId) renderHome();

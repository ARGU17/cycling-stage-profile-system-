/* ============================================================
   CYCLING MANAGER TOUR v0.27 · RELEASE GLUE
   Keeps the v0.26 save schema compatible while exposing the GPX Stage Lab
   build and lightweight runtime diagnostics.
   ============================================================ */

const V027_VERSION = "v0.27-gpx-stage-lab";

// v0.26 treated any id ending in "_tour" (for example uae_tour) as the Tour
// de France. v0.27 resolves namespaces without confusing race names.
function raceBaseIdV027(race) {
  let raw = String(race?.originalId || race?.id || "");
  if (raw.includes("__")) raw = raw.split("__").pop();
  if (/^tour_gpx(?:_|$)/.test(raw)) return "tour";
  return raw;
}

if (typeof raceBaseIdV026 === "function") raceBaseIdV026 = raceBaseIdV027;
if (typeof isGrandTourFieldRaceV026 === "function") {
  isGrandTourFieldRaceV026 = function(race) {
    const id = raceBaseIdV027(race).toLowerCase();
    const name = String(race?.name || "").toLowerCase();
    return id === "giro" || id === "tour" || id === "vuelta" ||
      name.includes("giro d'italia") || name.includes("giro d’italia") ||
      name.includes("tour de france") || name.includes("vuelta a españa");
  };
}


function ensureV027State() {
  Game.v027 ||= {};
  Game.v027.version = V027_VERSION;
  Game.v027.gpxPhysicsStepKm = typeof GPX_STAGE_SIMULATION_STEP_KM === "number" ? GPX_STAGE_SIMULATION_STEP_KM : 0.25;
  Game.v027.stageLabAvailable = typeof renderStageLabSetup === "function";
  Game.v027.historicalArchiveAvailable = typeof HistoricalV025 !== "undefined";
  return Game.v027;
}

function decorateV027Interface() {
  document.title = "Cycling Manager Tour v0.27 · GPX Stage Lab";
  const header = document.querySelector("#app .header");
  if (header) {
    header.querySelectorAll(".eyebrow, h1, p").forEach(node => {
      if (node.textContent.includes("v0.26")) node.textContent = node.textContent.replaceAll("v0.26", "v0.27");
    });
  }
  if (header && !header.querySelector(".v027-version-chip")) {
    const chip = document.createElement("span");
    chip.className = "v027-version-chip";
    chip.textContent = "v0.27 · GPX 250 m";
    const target = header.querySelector(".top-actions") || header;
    target.appendChild(chip);
  }
}

function v027Diagnostics() {
  const gpxStages = (typeof RACES !== "undefined" ? RACES : [])
    .flatMap(race => race.stages || [])
    .filter(stage => stage.gpxAvailable);
  return {
    version: V027_VERSION,
    teams: typeof TEAMS !== "undefined" ? TEAMS.length : 0,
    riders: typeof RIDERS !== "undefined" ? RIDERS.length : 0,
    races: typeof RACES !== "undefined" ? RACES.length : 0,
    gpxStages: gpxStages.length,
    stageLab: typeof renderStageLabSetup === "function",
    physicsStepKm: typeof GPX_STAGE_SIMULATION_STEP_KM === "number" ? GPX_STAGE_SIMULATION_STEP_KM : null,
    selectedRaceId: Game.selectedRaceId || null,
    stageLabState: Game.stageLab ? {
      screenActive: Boolean(Game.stageLab.screenActive),
      pendingRaceId: Game.stageLab.pendingRaceId || null,
      activeRaceId: Game.stageLab.activeRaceId || null
    } : null
  };
}

globalThis.v027Diagnostics = v027Diagnostics;

if (typeof saveGame === "function") {
  const __v027_saveGame = saveGame;
  saveGame = function(show = true) {
    ensureV027State();
    return __v027_saveGame(show);
  };
}

if (typeof loadGame === "function") {
  const __v027_loadGame = loadGame;
  loadGame = async function() {
    const result = await __v027_loadGame();
    ensureV027State();
    decorateV027Interface();
    return result;
  };
}

if (typeof init === "function") {
  const __v027_init = init;
  init = function() {
    const result = __v027_init();
    ensureV027State();
    decorateV027Interface();
    return result;
  };
}

ensureV027State();
const v027Observer = new MutationObserver(() => decorateV027Interface());
v027Observer.observe(document.getElementById("app"), { childList: true, subtree: true });
decorateV027Interface();

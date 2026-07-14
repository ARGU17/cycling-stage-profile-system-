/* ============================================================
   CYCLING MANAGER TOUR v0.24+
   Robust roster-confirmation and persistence hotfix.

   Fixes:
   - Confirmation always advances after exactly 8 valid riders.
   - Rendering no longer depends on localStorage succeeding.
   - Safe fallback when storage is unavailable, blocked or full.
   - Duplicate/invalid rider ids are sanitised before locking.
   - Rival rosters are validated and completed to eight riders.
   - Team selection is prepared once, avoiding the old double pass.
   ============================================================ */

const V024_PLUS_VERSION = "v0.24+";
const V024_PLUS_SAVE_KEY = typeof SAVE_KEY === "string" ? SAVE_KEY : "cyclingManager_v024";
const V024_PLUS_ACCEPTED_VERSIONS = new Set([
  typeof SAVE_VERSION === "string" ? SAVE_VERSION : "v0.24",
  typeof V024_VERSION === "string" ? V024_VERSION : "v0.24",
  V024_PLUS_VERSION
]);

let V024_PLUS_MEMORY_SAVE = null;
let V024_PLUS_STORAGE_WARNING_SHOWN = false;

function v024PlusStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("v0.24+: almacenamiento local no disponible", error);
    return null;
  }
}

function v024PlusSerializeGame() {
  ensureV024State();
  Game.version = V024_PLUS_VERSION;
  return JSON.stringify(Game);
}

function v024PlusPersist(show = true) {
  let payload;
  try {
    payload = v024PlusSerializeGame();
  } catch (error) {
    console.error("v0.24+: no se pudo serializar la partida", error);
    if (show) toast("No se pudo preparar el guardado, pero la partida sigue activa");
    return false;
  }

  // Always keep a session-memory snapshot. This guarantees that a storage
  // exception can never block roster confirmation or the race screen.
  V024_PLUS_MEMORY_SAVE = payload;

  const storage = v024PlusStorage();
  if (!storage) {
    if (show) toast("Partida activa · guardado local no disponible");
    return false;
  }

  try {
    storage.setItem(V024_PLUS_SAVE_KEY, payload);
    if (show) toast("Partida v0.24+ guardada");
    return true;
  } catch (error) {
    console.warn("v0.24+: localStorage bloqueado o sin espacio", error);
    if (show) toast("Partida activa · navegador sin espacio para guardar");
    return false;
  }
}

saveGame = function(show = true) {
  return v024PlusPersist(show);
};

loadGame = function() {
  let raw = null;
  const storage = v024PlusStorage();

  if (storage) {
    try {
      raw = storage.getItem(V024_PLUS_SAVE_KEY);
    } catch (error) {
      console.warn("v0.24+: no se pudo leer localStorage", error);
    }
  }
  raw ||= V024_PLUS_MEMORY_SAVE;

  if (!raw) return toast("No hay guardado v0.24+ disponible");

  try {
    const obj = JSON.parse(raw);
    if (!V024_PLUS_ACCEPTED_VERSIONS.has(obj.version)) {
      if (storage) {
        try { storage.removeItem(V024_PLUS_SAVE_KEY); } catch (_) {}
      }
      V024_PLUS_MEMORY_SAVE = null;
      toast("Guardado incompatible eliminado. Inicia una partida nueva.");
      return init();
    }

    Object.assign(Game, obj);
    if (!Game.riders?.length) Game.riders = clone(RIDERS);
    sanitizeGameState();
    ensureV024State();
    Game.version = V024_PLUS_VERSION;
    render();
  } catch (error) {
    console.error("v0.24+: guardado corrupto", error);
    if (storage) {
      try { storage.removeItem(V024_PLUS_SAVE_KEY); } catch (_) {}
    }
    V024_PLUS_MEMORY_SAVE = null;
    toast("Guardado corrupto eliminado");
    init();
  }
};

clearSave = function() {
  const keys = [
    V024_PLUS_SAVE_KEY,
    "cyclingManager_v015",
    "cyclingManager_v017",
    "cyclingManager_v019",
    "cyclingManager_v021",
    "cyclingManager_v023",
    "cyclingManager_v024",
    "cyclingManager_v024plus"
  ];
  const storage = v024PlusStorage();
  if (storage) {
    keys.forEach(key => {
      try { storage.removeItem(key); } catch (_) {}
    });
  }
  V024_PLUS_MEMORY_SAVE = null;
  toast("Guardados anteriores borrados");
};

function v024PlusUniqueValidRoster(ids, teamId) {
  const valid = new Set(getFullTeamRiders(teamId).map(r => r.id));
  return [...new Set(Array.isArray(ids) ? ids : [])].filter(id => valid.has(id));
}

function v024PlusBuildTeamRoster(teamId, race) {
  const teamRiders = getFullTeamRiders(teamId);
  const selected = v024PlusUniqueValidRoster(
    autoSelectRoster(teamId, race).map(r => r?.id).filter(Boolean),
    teamId
  );

  if (selected.length < ROSTER_SIZE) {
    const remainder = teamRiders
      .filter(r => !selected.includes(r.id))
      .sort((a, b) => {
        const readinessA = typeof readinessScoreAdvancedV024 === "function" ? readinessScoreAdvancedV024(a, race) : a.base;
        const readinessB = typeof readinessScoreAdvancedV024 === "function" ? readinessScoreAdvancedV024(b, race) : b.base;
        return readinessB - readinessA;
      });
    selected.push(...remainder.map(r => r.id).slice(0, ROSTER_SIZE - selected.length));
  }

  return selected.slice(0, ROSTER_SIZE);
}

// Replace the v0.24 wrapper, which prepared the roster twice.
selectTeam = function(teamId) {
  if (!getTeam(teamId)) return toast("Equipo no válido");

  Game.selectedTeamId = teamId;
  Game.riders = clone(RIDERS);
  if (Game.mode === "season") {
    Game.seasonIndex = 0;
    Game.selectedRaceId = GameRaceIdBySeasonIndex();
    Game.raceHistory = [];
    Game.seasonFinished = false;
  }

  ensureV024State();
  prepareRosterSelection();
};

// Transactional confirmation. The race screen is rendered before attempting
// persistence, so a browser storage error cannot leave the user stuck.
confirmRoster = function() {
  if (!Game.selectedTeamId || !getTeam(Game.selectedTeamId)) {
    toast("Selecciona primero un equipo");
    return false;
  }

  const race = getRace();
  const chosen = v024PlusUniqueValidRoster(Game.pendingRosterIds, Game.selectedTeamId);
  Game.pendingRosterIds = chosen;

  if (chosen.length !== ROSTER_SIZE) {
    toast(`Debes escoger exactamente ${ROSTER_SIZE} corredores distintos`);
    renderRosterSelection();
    return false;
  }

  const previous = {
    raceRosters: clone(Game.raceRosters || {}),
    lastRaceRosterIds: [...(Game.lastRaceRosterIds || [])],
    rosterLocked: Boolean(Game.rosterLocked),
    live: Game.live,
    finished: Boolean(Game.finished),
    betweenRaces: Boolean(Game.betweenRaces)
  };

  try {
    const rosters = {};
    TEAMS.forEach(team => {
      const ids = v024PlusBuildTeamRoster(team.id, race);
      if (ids.length !== ROSTER_SIZE) {
        throw new Error(`Plantilla incompleta para ${team.name}: ${ids.length}/${ROSTER_SIZE}`);
      }
      rosters[team.id] = ids;
    });
    rosters[Game.selectedTeamId] = [...chosen];

    Game.raceRosters = rosters;
    Game.lastRaceRosterIds = [...chosen];
    Game.rosterLocked = true;
    Game.finished = false;
    Game.betweenRaces = false;
    Game.live = null;

    resetRaceState();

    // resetRaceState chooses an automatic protected rider. Keep it inside the
    // actual selected eight, otherwise downstream strategy panels may refer to
    // a rider who is not racing.
    if (!chosen.includes(Game.protectedRiderId)) {
      Game.protectedRiderId = chosen
        .map(getRider)
        .filter(Boolean)
        .sort((a, b) => b.base - a.base)[0]?.id || chosen[0];
    }

    Game.rosterLocked = true;
    Game.version = V024_PLUS_VERSION;

    // Critical fix: advance first, persist second.
    renderRace();
    const stored = v024PlusPersist(false);
    if (!stored && !V024_PLUS_STORAGE_WARNING_SHOWN) {
      V024_PLUS_STORAGE_WARNING_SHOWN = true;
      toast("Carrera iniciada · el guardado local del navegador no está disponible");
    }
    return true;
  } catch (error) {
    console.error("v0.24+: fallo al confirmar la convocatoria", error);
    Game.raceRosters = previous.raceRosters;
    Game.lastRaceRosterIds = previous.lastRaceRosterIds;
    Game.rosterLocked = previous.rosterLocked;
    Game.live = previous.live;
    Game.finished = previous.finished;
    Game.betweenRaces = previous.betweenRaces;
    toast("No se pudo iniciar la carrera. Revisa la consola del navegador.");
    renderRosterSelection();
    return false;
  }
};

// Visual version badge without changing the underlying v0.24 data model.
const __v024plus_renderHome = renderHome;
renderHome = function() {
  __v024plus_renderHome();
  const title = app.querySelector(".header h1");
  const subtitle = app.querySelector(".header p");
  if (title) title.textContent = "Cycling Manager Tour v0.24+";
  if (subtitle) subtitle.textContent = "GPX real · confirmación de 8 corredores corregida · motor físico CP/W′ · telemetría e IA rival";
};

const __v024plus_renderRace = renderRace;
renderRace = function() {
  __v024plus_renderRace();
  const header = app.querySelector(".header p");
  if (header && !header.textContent.includes("v0.24+")) header.textContent = `v0.24+ · ${header.textContent}`;
};

Game.version = V024_PLUS_VERSION;
renderHome();

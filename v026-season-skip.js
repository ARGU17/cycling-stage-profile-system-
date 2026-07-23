/* ============================================================
   CYCLING MANAGER TOUR v0.26
   Season fast-forward / selective race simulation.

   Adds:
   - Season planner: choose which events are played manually.
   - Presets for all events, Grand Tours, and key events.
   - Automatic background simulation of unselected races.
   - Direct jump to any future event from the between-races screen.
   - Progress screen and stop-after-current-race control.
   - Full use of the existing race engine, rosters, CP/W′, IA,
     fatigue, form, points, sponsor, contracts and scouting.
   ============================================================ */

const V026_VERSION = "v0.26";
const V026_GRAND_TOUR_IDS = ["giro", "tour", "vuelta"];
const V026_MONUMENT_IDS = ["sanremo", "flanders", "roubaix", "liege", "lombardia"];
const V026_KEY_EVENT_IDS = [...V026_MONUMENT_IDS, ...V026_GRAND_TOUR_IDS, "worlds"];

function v026DefaultSeasonState() {
  return {
    version: V026_VERSION,
    presetId: "all",
    playRaceIds: [...SEASON_RACE_IDS],
    simulatedRaceIds: [],
    skippedResults: [],
    autoApplyTraining: true,
    fastForward: {
      running: false,
      startIndex: null,
      targetIndex: null,
      currentIndex: null,
      completed: 0,
      total: 0,
      cancelRequested: false,
      error: null
    }
  };
}

function ensureV026SeasonState() {
  if (!Game.v026Season || typeof Game.v026Season !== "object") {
    Game.v026Season = v026DefaultSeasonState();
  }
  const state = Game.v026Season;
  state.version = V026_VERSION;
  state.presetId ||= "all";
  state.playRaceIds = Array.isArray(state.playRaceIds) ? [...new Set(state.playRaceIds)].filter(id => SEASON_RACE_IDS.includes(id)) : [...SEASON_RACE_IDS];
  state.simulatedRaceIds = Array.isArray(state.simulatedRaceIds) ? [...new Set(state.simulatedRaceIds)] : [];
  state.skippedResults = Array.isArray(state.skippedResults) ? state.skippedResults : [];
  state.autoApplyTraining = state.autoApplyTraining !== false;
  state.fastForward ||= {};
  Object.assign(state.fastForward, {
    running: Boolean(state.fastForward.running),
    startIndex: Number.isInteger(state.fastForward.startIndex) ? state.fastForward.startIndex : null,
    targetIndex: Number.isInteger(state.fastForward.targetIndex) ? state.fastForward.targetIndex : null,
    currentIndex: Number.isInteger(state.fastForward.currentIndex) ? state.fastForward.currentIndex : null,
    completed: toNum(state.fastForward.completed, 0),
    total: toNum(state.fastForward.total, 0),
    cancelRequested: Boolean(state.fastForward.cancelRequested),
    error: state.fastForward.error || null
  });
  return state;
}

function v026RaceImportance(race) {
  if (!race) return "normal";
  if (V026_GRAND_TOUR_IDS.includes(race.id)) return "grand";
  if (V026_MONUMENT_IDS.includes(race.id)) return "monument";
  if (race.id === "worlds") return "worlds";
  if (race.type === "stage_race") return "stage";
  return "normal";
}

function v026RaceImportanceLabel(race) {
  const type = v026RaceImportance(race);
  return {
    grand: "GRAN VUELTA",
    monument: "MONUMENTO",
    worlds: "MUNDIAL",
    stage: "VUELTA",
    normal: "CLÁSICA"
  }[type] || "EVENTO";
}

function v026SetSeasonPreset(presetId) {
  const state = ensureV026SeasonState();
  state.presetId = presetId;
  if (presetId === "all") state.playRaceIds = [...SEASON_RACE_IDS];
  if (presetId === "grand_tours") state.playRaceIds = V026_GRAND_TOUR_IDS.filter(id => SEASON_RACE_IDS.includes(id));
  if (presetId === "key_events") state.playRaceIds = V026_KEY_EVENT_IDS.filter(id => SEASON_RACE_IDS.includes(id));
  if (presetId === "stage_races") {
    state.playRaceIds = RACES.filter(r => ["grand_tour", "stage_race"].includes(r.type)).map(r => r.id);
  }
  if (presetId === "custom" && !state.playRaceIds.length) state.playRaceIds = [SEASON_RACE_IDS[0]];
  saveGame(false);
  Game.betweenRaces ? renderBetweenRaces() : renderHome();
}

function v026ToggleRaceManual(raceId) {
  const state = ensureV026SeasonState();
  state.presetId = "custom";
  if (state.playRaceIds.includes(raceId)) {
    state.playRaceIds = state.playRaceIds.filter(id => id !== raceId);
  } else {
    state.playRaceIds.push(raceId);
    state.playRaceIds.sort((a, b) => SEASON_RACE_IDS.indexOf(a) - SEASON_RACE_IDS.indexOf(b));
  }
  saveGame(false);
  Game.betweenRaces ? renderBetweenRaces() : renderHome();
}

function v026SelectAllRemaining(play) {
  const state = ensureV026SeasonState();
  const from = Game.mode === "season" && Game.selectedTeamId ? Math.max(0, Game.seasonIndex + (Game.betweenRaces || Game.finished ? 1 : 0)) : 0;
  const remaining = SEASON_RACE_IDS.slice(from);
  if (play) {
    state.playRaceIds = [...new Set([...state.playRaceIds, ...remaining])];
    state.presetId = "custom";
  } else {
    state.playRaceIds = state.playRaceIds.filter(id => !remaining.includes(id));
    state.presetId = "custom";
  }
  saveGame(false);
  Game.betweenRaces ? renderBetweenRaces() : renderHome();
}


function v026SetAutoTraining(enabled) {
  const state = ensureV026SeasonState();
  state.autoApplyTraining = Boolean(enabled);
  saveGame(false);
  Game.betweenRaces ? renderBetweenRaces() : renderHome();
}

function v026NextManualIndex(fromIndex) {
  const state = ensureV026SeasonState();
  for (let i = Math.max(0, fromIndex); i < SEASON_RACE_IDS.length; i++) {
    if (state.playRaceIds.includes(SEASON_RACE_IDS[i])) return i;
  }
  return SEASON_RACE_IDS.length;
}

function v026SeasonPlanStats(fromIndex = 0) {
  const state = ensureV026SeasonState();
  const remainingIds = SEASON_RACE_IDS.slice(fromIndex);
  const manual = remainingIds.filter(id => state.playRaceIds.includes(id)).length;
  return { total: remainingIds.length, manual, automatic: remainingIds.length - manual };
}

function renderSeasonPlannerV026({ fromIndex = 0, compact = false } = {}) {
  const state = ensureV026SeasonState();
  const stats = v026SeasonPlanStats(fromIndex);
  const races = SEASON_RACE_IDS.slice(fromIndex).map(id => byId(RACES, id)).filter(Boolean);
  return `<section class="panel v026-season-planner ${compact ? "compact" : ""}">
    <div class="section-heading">
      <div>
        <div class="badge-row"><span class="badge green">v0.26 · PLANIFICADOR</span><span class="badge blue">${stats.manual} manuales</span><span class="badge orange">${stats.automatic} automáticas</span></div>
        <h2>Simulación y salto de carreras</h2>
        <p class="muted">Las carreras desmarcadas se disputan automáticamente con el motor deportivo condensado v0.26. Las marcadas abren Grand Tour Stage Lab y se juegan de forma normal.</p>
      </div>
    </div>
    <div class="v026-preset-row">
      <button class="secondary ${state.presetId === "all" ? "active" : ""}" onclick="v026SetSeasonPreset('all')">Todo el calendario</button>
      <button class="secondary ${state.presetId === "grand_tours" ? "active" : ""}" onclick="v026SetSeasonPreset('grand_tours')">Solo grandes vueltas</button>
      <button class="secondary ${state.presetId === "key_events" ? "active" : ""}" onclick="v026SetSeasonPreset('key_events')">Grandes vueltas + monumentos + Mundial</button>
      <button class="secondary ${state.presetId === "stage_races" ? "active" : ""}" onclick="v026SetSeasonPreset('stage_races')">Todas las vueltas por etapas</button>
      <button class="secondary" onclick="v026SelectAllRemaining(true)">Marcar todas</button>
      <button class="secondary" onclick="v026SelectAllRemaining(false)">Simular todas</button>
    </div>
    <label class="v026-auto-training"><input type="checkbox" ${state.autoApplyTraining ? "checked" : ""} onchange="v026SetAutoTraining(this.checked)"><span><b>Aplicar automáticamente el training camp seleccionado</b><small>Se ejecuta entre las carreras simuladas, igual que al avanzar manualmente.</small></span></label>
    <div class="v026-race-plan-grid">
      ${races.map(race => {
        const index = SEASON_RACE_IDS.indexOf(race.id);
        const manual = state.playRaceIds.includes(race.id);
        const simulated = state.simulatedRaceIds.includes(race.id);
        return `<label class="v026-race-plan-card ${manual ? "manual" : "automatic"} ${simulated ? "completed" : ""}">
          <input type="checkbox" ${manual ? "checked" : ""} ${simulated ? "disabled" : ""} onchange="v026ToggleRaceManual('${race.id}')">
          <span class="v026-plan-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="v026-plan-copy"><b>${esc(race.name)}</b><small>${race.date} · ${v026RaceImportanceLabel(race)} · ${race.stages.length} etapa${race.stages.length === 1 ? "" : "s"}</small></span>
          <span class="v026-plan-mode">${simulated ? "COMPLETADA" : manual ? "JUGAR" : "AUTO"}</span>
        </label>`;
      }).join("")}
    </div>
  </section>`;
}

function renderJumpPanelV026() {
  const from = Game.seasonIndex + 1;
  const future = SEASON_RACE_IDS.slice(from).map((id, offset) => ({ race: byId(RACES, id), index: from + offset })).filter(x => x.race);
  if (!future.length) return "";
  const recommended = future.find(x => V026_KEY_EVENT_IDS.includes(x.race.id)) || future[0];
  return `<section class="panel v026-jump-panel">
    <div class="section-heading"><div><h2>Ir directamente a un objetivo</h2><p class="muted">Se simularán automáticamente todas las competiciones intermedias y se abrirá Stage Lab en el evento elegido.</p></div></div>
    <div class="v026-jump-controls">
      <select id="v026JumpTarget">
        ${future.map(({ race, index }) => `<option value="${index}" ${index === recommended.index ? "selected" : ""}>${race.date} · ${esc(race.name)} · ${v026RaceImportanceLabel(race)}</option>`).join("")}
      </select>
      <button onclick="v026JumpFromBetweenRaces()">Simular hasta este evento</button>
    </div>
  </section>`;
}

function v026JumpFromBetweenRaces() {
  const select = document.getElementById("v026JumpTarget");
  const targetIndex = Number(select?.value);
  if (!Number.isInteger(targetIndex) || targetIndex <= Game.seasonIndex || targetIndex >= SEASON_RACE_IDS.length) return toast("Selecciona una competición futura válida");
  const state = ensureV026SeasonState();
  const targetId = SEASON_RACE_IDS[targetIndex];
  state.presetId = "custom";
  for (let i = Game.seasonIndex + 1; i < targetIndex; i++) {
    state.playRaceIds = state.playRaceIds.filter(id => id !== SEASON_RACE_IDS[i]);
  }
  if (!state.playRaceIds.includes(targetId)) state.playRaceIds.push(targetId);
  state.playRaceIds.sort((a, b) => SEASON_RACE_IDS.indexOf(a) - SEASON_RACE_IDS.indexOf(b));
  saveGame(false);
  advanceToNextRace();
}

function v026BuildAutoRoster(teamId, race) {
  if (typeof v024PlusBuildTeamRoster === "function") return v024PlusBuildTeamRoster(teamId, race);
  const ids = autoSelectRoster(teamId, race).map(r => r.id);
  const valid = [...new Set(ids)].filter(id => getRider(id)?.teamId === teamId);
  if (valid.length < ROSTER_SIZE) {
    valid.push(...getFullTeamRiders(teamId).filter(r => !valid.includes(r.id)).sort((a, b) => b.base - a.base).slice(0, ROSTER_SIZE - valid.length).map(r => r.id));
  }
  return valid.slice(0, ROSTER_SIZE);
}

function v026PrepareAutoRace(index) {
  const raceId = SEASON_RACE_IDS[index];
  const race = byId(RACES, raceId);
  if (!race) throw new Error(`Carrera inexistente en el índice ${index}`);

  Game.seasonIndex = index;
  Game.selectedRaceId = raceId;
  Game.betweenRaces = false;
  Game.finished = false;
  Game.rosterLocked = false;
  Game.live = null;

  if (typeof restoreBaseRaceStages === "function") restoreBaseRaceStages(raceId);
  if (typeof ensureStageLabManagerState === "function") {
    const stageLab = ensureStageLabManagerState();
    stageLab.screenActive = false;
    stageLab.pendingRaceId = null;
    stageLab.activeRaceId = null;
    stageLab.activeRaceData = null;
    stageLab.skippedRaceId = raceId;
  }

  const rosters = {};
  TEAMS.forEach(team => {
    const ids = v026BuildAutoRoster(team.id, race);
    if (ids.length !== ROSTER_SIZE) throw new Error(`Convocatoria automática incompleta para ${team.name}`);
    rosters[team.id] = ids;
  });
  Game.raceRosters = rosters;
  Game.pendingRosterIds = [...rosters[Game.selectedTeamId]];
  Game.lastRaceRosterIds = [...rosters[Game.selectedTeamId]];
  Game.rosterLocked = true;
  resetRaceState();
  Game.rosterLocked = true;
  return race;
}

function v026FastPhysicsBonus(rider, stage) {
  let bonus = 0;
  if (typeof getPhysiologyV024 === "function") {
    const phys = getPhysiologyV024(rider);
    if (phys) {
      bonus += (toNum(phys.cpWkg, 4.7) - 4.7) * (stage.type === "mountain" ? 4.2 : stage.type === "tt" ? 3.0 : 2.0);
      bonus += (toNum(phys.durability, 1) - 1) * (toNum(stage.distance, 150) / 35);
      bonus += (toNum(phys.wPrimeMax, 24000) / 1000 - 24) * (stage.type === "flat" ? .035 : stage.type === "hilly" ? .055 : .025);
    }
  }
  if (typeof readinessScoreAdvancedV024 === "function") {
    bonus += (readinessScoreAdvancedV024(rider, getRace()) - 75) * .055;
  }
  if (typeof materialScore === "function") {
    bonus += (materialScore(rider, stage) - 90) * .055;
  }
  if (typeof tireFactorsV024 === "function") {
    const tire = tireFactorsV024(rider, stage, Math.max(0, toNum(stage.distance, 100) * .55));
    bonus += (toNum(tire.rolling, 1) - 1) * 7 + (toNum(tire.grip, 1) - 1) * (toNum(stage.weather?.roadWet, 0) > 45 ? 5 : 2);
  }
  return clamp(bonus, -7, 9);
}

function v026SimulateStageCondensed(stage, stageIndex) {
  Game.currentStageIndex = stageIndex;
  Game.live = null;
  const riders = getRaceRiders();
  const ttOrder = isTT(stage) ? [...riders].sort((a, b) => b.totalTime - a.totalTime || a.base - b.base) : [];
  const teamOrder = isTTT(stage) ? new Map(TEAMS.map((team, index) => [team.id, index * 300])) : null;

  let preliminary = riders.map(rider => {
    const positioning = toNum(rider.stats?.positioning, 70);
    const downhill = toNum(rider.stats?.downhill, 70);
    const wet = toNum(stage.weather?.roadWet, 0);
    const technicalRisk = (wet / 2100) + (stage.type === "cobbles" ? .018 : 0) + Math.max(0, 72 - positioning) / 8000 + Math.max(0, 68 - downhill) / 10000;
    const incident = Math.random() < clamp(technicalRisk, .001, .075) ? "Incidente" : null;
    const startOffset = isTT(stage)
      ? Math.max(0, ttOrder.findIndex(r => r.id === rider.id)) * 120
      : isTTT(stage)
        ? toNum(teamOrder.get(rider.teamId), 0)
        : 0;
    return {
      riderId: rider.id,
      riderName: rider.name,
      teamId: rider.teamId,
      teamName: getTeam(rider.teamId).name,
      time: safeRaceTime(rider, stage, isTT(stage) ? .92 : isTTT(stage) ? .88 : 1),
      elapsed: 0,
      group: isTT(stage) ? "CRI individual" : isTTT(stage) ? `CRE ${getTeam(rider.teamId).name}` : "Pelotón",
      incident,
      fatigueGain: clamp(toNum(stage.difficulty, 50) / 13 + toNum(stage.distance, 150) / 85 - toNum(rider.stats?.recovery, 70) * .025, 1.5, 22),
      startOffset
    };
  });

  const originalStageScore = stageScore;
  stageScore = function(rider, stageArg, mode) {
    return originalStageScore(rider, stageArg, mode) + v026FastPhysicsBonus(rider, stageArg);
  };
  try {
    preliminary = normalizeStageResults(stage, preliminary);
  } finally {
    stageScore = originalStageScore;
  }

  preliminary = preliminary.filter(result => Number.isFinite(result.time)).sort((a, b) => a.time - b.time);
  preliminary.forEach((result, index) => {
    result.pos = index + 1;
    result.elapsed = toNum(result.elapsed, result.time + toNum(result.startOffset, 0));
  });

  applyPoints(stage, preliminary);
  updateTotals(preliminary);
  updateTeamTimes(preliminary);
  Game.lastStage = { stage, results: preliminary, autoSimulatedV026: true, condensedPhysics: true };
  Game.stageHistory.push(Game.lastStage);

  if (Game.v024?.analytics?.stageReports) {
    Game.v024.analytics.stageReports.push({
      raceId: Game.selectedRaceId,
      stageId: stage.id,
      stageName: stage.name,
      date: getRace().date,
      autoSimulatedV026: true,
      winnerId: preliminary[0]?.riderId || null,
      winnerName: preliminary[0]?.riderName || null
    });
  }
}

function v026SimulateCurrentRaceWithFullEngine() {
  const race = getRace();
  const originalRenderRaceFinal = renderRaceFinal;
  const originalSaveGame = saveGame;
  const originalToast = toast;
  renderRaceFinal = function() {};
  saveGame = function() { return true; };
  toast = function() {};

  try {
    for (let stageIndex = 0; stageIndex < race.stages.length; stageIndex++) {
      v026SimulateStageCondensed(race.stages[stageIndex], stageIndex);
    }
    finishRace();
  } finally {
    renderRaceFinal = originalRenderRaceFinal;
    saveGame = originalSaveGame;
    toast = originalToast;
  }

  const history = Game.raceHistory[Game.raceHistory.length - 1];
  if (!history || history.raceId !== race.id) throw new Error(`No se registró el resultado de ${race.name}`);
  history.autoSimulated = true;
  history.simulationVersion = V026_VERSION;
  history.simulationModel = "condensed_v024_physics";
  return history;
}

function v026RecordSkippedRace(race, history) {
  const state = ensureV026SeasonState();
  if (!state.simulatedRaceIds.includes(race.id)) state.simulatedRaceIds.push(race.id);
  state.skippedResults.push({
    raceId: race.id,
    raceName: race.name,
    date: race.date,
    winnerId: history.winnerId,
    winnerName: history.winnerName,
    userBestId: history.userBestId,
    userBestName: getRider(history.userBestId)?.name || "—",
    stageWins: history.stageWins || 0,
    seasonIndex: Game.seasonIndex
  });
  state.skippedResults = state.skippedResults.slice(-80);
}

function renderFastForwardV026() {
  const state = ensureV026SeasonState();
  const ff = state.fastForward;
  const race = Number.isInteger(ff.currentIndex) ? byId(RACES, SEASON_RACE_IDS[ff.currentIndex]) : null;
  const target = Number.isInteger(ff.targetIndex) && ff.targetIndex < SEASON_RACE_IDS.length ? byId(RACES, SEASON_RACE_IDS[ff.targetIndex]) : null;
  const percent = ff.total > 0 ? Math.round(ff.completed / ff.total * 100) : 0;
  app.innerHTML = `<div class="v026-fast-shell">
    <div class="header"><div><div class="badge-row"><span class="badge green">v0.26 · SIMULACIÓN AUTOMÁTICA</span><span class="badge blue">${ff.completed}/${ff.total}</span></div><h1>Avanzando la temporada</h1><p>${target ? `Objetivo: ${esc(target.name)}` : "Simulando hasta el final de temporada"}</p></div><div class="top-actions"><button class="secondary" onclick="v026RequestFastForwardStop()">Detener después de esta carrera</button></div></div>
    <section class="panel v026-fast-card">
      <div class="v026-fast-icon">⏩</div>
      <h2>${race ? esc(race.name) : "Preparando calendario"}</h2>
      <p class="muted">${race ? `${race.date} · ${race.stages.length} etapa${race.stages.length === 1 ? "" : "s"} · ${v026RaceImportanceLabel(race)}` : "Inicializando motor"}</p>
      <div class="v026-progress"><div style="width:${percent}%"></div></div>
      <strong>${percent}% completado</strong>
      <p class="muted small">Se conservan resultados, puntos UCI, fisiología CP/W′, material, fatiga, forma, contratos, objetivos, scouting, mentoría y entrenamiento. Stage Lab solo se abrirá en las carreras marcadas para jugar.</p>
      ${ff.cancelRequested ? `<div class="advice medium"><span>⏸</span><div><strong>Parada solicitada</strong><p>La simulación se detendrá al terminar la carrera actual.</p></div></div>` : ""}
      ${ff.error ? `<div class="advice high"><span>⚠️</span><div><strong>Error de simulación</strong><p>${esc(ff.error)}</p></div></div>` : ""}
    </section>
    ${renderRecentSkippedResultsV026(6)}
  </div>`;
}

function renderRecentSkippedResultsV026(limit = 8) {
  const results = ensureV026SeasonState().skippedResults.slice(-limit).reverse();
  if (!results.length) return "";
  return `<section class="panel"><h2>Últimas carreras simuladas</h2><div class="v026-simulated-results">${results.map(result => `<div><span>${result.date}</span><strong>${esc(result.raceName)}</strong><small>Ganador: ${esc(result.winnerName || "—")} · Mejor del equipo: ${esc(result.userBestName || "—")} · ${result.stageWins} victoria${result.stageWins === 1 ? "" : "s"} de etapa</small></div>`).join("")}</div></section>`;
}

function v026RequestFastForwardStop() {
  const state = ensureV026SeasonState();
  if (!state.fastForward.running) return;
  state.fastForward.cancelRequested = true;
  renderFastForwardV026();
}

function v026Yield() {
  return new Promise(resolve => setTimeout(resolve, 25));
}

async function beginSeasonFastForwardV026(startIndex, targetIndex) {
  const state = ensureV026SeasonState();
  if (state.fastForward.running) return;
  const endExclusive = Math.min(targetIndex, SEASON_RACE_IDS.length);
  if (startIndex >= endExclusive) {
    if (targetIndex >= SEASON_RACE_IDS.length) {
      Game.seasonFinished = true;
      Game.betweenRaces = false;
      Game.finished = false;
      saveGame(false);
      return renderSeasonFinal();
    }
    Game.seasonIndex = targetIndex;
    Game.selectedRaceId = SEASON_RACE_IDS[targetIndex];
    Game.finished = false;
    Game.betweenRaces = false;
    Game.rosterLocked = false;
    return prepareRosterSelection();
  }

  state.fastForward = {
    running: true,
    startIndex,
    targetIndex,
    currentIndex: startIndex,
    completed: 0,
    total: endExclusive - startIndex,
    cancelRequested: false,
    error: null
  };
  renderFastForwardV026();
  await v026Yield();

  try {
    for (let index = startIndex; index < endExclusive; index++) {
      state.fastForward.currentIndex = index;
      renderFastForwardV026();
      await v026Yield();

      const race = v026PrepareAutoRace(index);
      const history = v026SimulateCurrentRaceWithFullEngine();
      v026RecordSkippedRace(race, history);
      state.fastForward.completed++;
      renderFastForwardV026();

      // Stop before applying the inter-race training so the normal
      // between-races screen cannot apply the same camp twice.
      if (state.fastForward.cancelRequested) {
        state.fastForward.running = false;
        Game.seasonIndex = index;
        Game.selectedRaceId = SEASON_RACE_IDS[index];
        Game.finished = true;
        Game.betweenRaces = true;
        Game.rosterLocked = false;
        saveGame(false);
        return renderBetweenRaces();
      }

      if (state.autoApplyTraining && index < SEASON_RACE_IDS.length - 1) applyTraining();
      await v026Yield();
    }

    state.fastForward.running = false;
    state.fastForward.currentIndex = null;
    if (targetIndex >= SEASON_RACE_IDS.length) {
      Game.seasonFinished = true;
      Game.betweenRaces = false;
      Game.finished = false;
      Game.rosterLocked = false;
      saveGame(false);
      return renderSeasonFinal();
    }

    Game.seasonIndex = targetIndex;
    Game.selectedRaceId = SEASON_RACE_IDS[targetIndex];
    Game.finished = false;
    Game.betweenRaces = false;
    Game.rosterLocked = false;
    Game.live = null;
    saveGame(false);
    prepareRosterSelection();
  } catch (error) {
    console.error("v0.26: error durante el salto de temporada", error);
    state.fastForward.running = false;
    state.fastForward.error = error?.message || String(error);
    saveGame(false);
    renderFastForwardV026();
  }
}

function v026SimulateCurrentRaceAndContinue() {
  if (Game.mode !== "season") return toast("La simulación automática está disponible en modo temporada");
  const state = ensureV026SeasonState();
  const currentId = SEASON_RACE_IDS[Game.seasonIndex];
  state.presetId = "custom";
  state.playRaceIds = state.playRaceIds.filter(id => id !== currentId);
  if (typeof ensureStageLabManagerState === "function") {
    const lab = ensureStageLabManagerState();
    lab.screenActive = false;
    lab.pendingRaceId = null;
  }
  const target = v026NextManualIndex(Game.seasonIndex + 1);
  beginSeasonFastForwardV026(Game.seasonIndex, target);
}

/* ---------- Runtime hooks ---------- */

const __v026_renderSeasonPreview = renderSeasonPreview;
renderSeasonPreview = function() {
  return `${__v026_renderSeasonPreview()}${renderSeasonPlannerV026({ fromIndex: 0 })}`;
};

const __v026_renderBetweenRaces = renderBetweenRaces;
renderBetweenRaces = function() {
  __v026_renderBetweenRaces();
  app.insertAdjacentHTML("beforeend", `${renderJumpPanelV026()}${renderSeasonPlannerV026({ fromIndex: Game.seasonIndex + 1, compact: true })}${renderRecentSkippedResultsV026(10)}`);
};

const __v026_prepareRosterSelection = prepareRosterSelection;
prepareRosterSelection = function() {
  const state = ensureV026SeasonState();
  if (Game.mode === "season" && !state.fastForward.running) {
    const raceId = SEASON_RACE_IDS[Game.seasonIndex];
    if (raceId && !state.playRaceIds.includes(raceId)) {
      const targetIndex = v026NextManualIndex(Game.seasonIndex + 1);
      beginSeasonFastForwardV026(Game.seasonIndex, targetIndex);
      return;
    }
  }
  return __v026_prepareRosterSelection();
};

const __v026_renderStageLabSetup = renderStageLabSetup;
renderStageLabSetup = function() {
  __v026_renderStageLabSetup();
  if (Game.mode !== "season") return;
  const actions = app.querySelector(".stage-lab-manager-header .top-actions");
  if (actions && !document.getElementById("v026SimulateCurrentButton")) {
    actions.insertAdjacentHTML("afterbegin", `<button id="v026SimulateCurrentButton" class="secondary" onclick="v026SimulateCurrentRaceAndContinue()">Simular esta carrera y continuar</button>`);
  }
};

const __v026_renderSeasonFinal = renderSeasonFinal;
renderSeasonFinal = function() {
  __v026_renderSeasonFinal();
  const results = ensureV026SeasonState().skippedResults;
  if (results.length) app.insertAdjacentHTML("beforeend", `<section class="panel"><h2>Resumen de simulación automática v0.26</h2><p class="muted">${results.length} carreras fueron simuladas en segundo plano con el motor deportivo condensado v0.26.</p>${renderRecentSkippedResultsV026(20)}</section>`);
};

const __v026_renderHome = renderHome;
renderHome = function() {
  ensureV026SeasonState();
  __v026_renderHome();
  const title = app.querySelector(".header h1");
  const subtitle = app.querySelector(".header p");
  if (title) title.textContent = "Cycling Manager Tour v0.26";
  if (subtitle) subtitle.textContent = "Grand Tour Stage Lab · calendario seleccionable · simulación automática de carreras · GPX dinámicos · física CP/W′";
};

const __v026_init = init;
init = function() {
  __v026_init();
  Game.v026Season = v026DefaultSeasonState();
  Game.version = V026_VERSION;
  renderHome();
};

const __v026_loadGame = loadGame;
loadGame = function() {
  const result = __v026_loadGame();
  ensureV026SeasonState();
  Game.version = V026_VERSION;
  if (Game.v026Season.fastForward.running) {
    // A browser reload cannot resume inside a half-completed race safely.
    Game.v026Season.fastForward.running = false;
    Game.v026Season.fastForward.error = "La simulación automática fue interrumpida por una recarga. Puedes continuar desde la carrera actual.";
  }
  render();
  return result;
};

ensureV026SeasonState();
Game.version = V026_VERSION;
if (!Game.selectedTeamId) renderHome();

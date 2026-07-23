/* ============================================================
   CYCLING MANAGER TOUR v0.24+
   v024-expansion.js
   Integración v0.21 + v0.23 + v0.24+ sobre la base v0.19.

   Funciones principales:
   - Motor físico por pendiente con CP/W′.
   - Recuperación anaeróbica según grupo y posición.
   - Formaciones, ataques/respuestas, corredores puente.
   - Autobús, abanicos, descensos y pavé avanzados.
   - Neumáticos y presiones.
   - Calendario individual y objetivos A/B/C.
   - Contratos/promesas, cantera, scouting y mentoría.
   - Staff asignable y logística.
   - Vista TV, narración, alertas, telemetría y récords.
   ============================================================ */

/* ============================================================
   1. ESTADO Y COMPATIBILIDAD
   ============================================================ */

function ensureV024State() {
  ensureManagerSystems();

  if (!Game.v024) Game.v024 = {};
  const v = Game.v024;

  v.version = V024_VERSION;
  Game.aiMemory ||= {};
  Game.directorLog ||= [];
  Game.recommendationHistory ||= [];
  v.physiology ||= {};
  v.technical ||= {};
  v.individualCalendars ||= {};
  v.formTargets ||= {};
  v.contractPromises ||= {};
  v.mentorships ||= {};
  v.staffAssignments ||= {};
  v.logistics ||= {};
  v.scoutingMissions ||= [];
  v.academy ||= { level: 1, budget: 250000, reputation: 48, graduates: 0 };
  v.alerts ||= Object.fromEntries(ALERT_DEFINITIONS_V024.map(a => [a.id, a.default]));
  v.records ||= {};
  v.palmares ||= [];
  v.analytics ||= { riderHistory: {}, teamHistory: [], stageReports: [] };
  v.broadcast ||= { camera: "auto", selectedRiderId: null, tickerSpeed: "normal" };
  v.livePlan ||= {
    responseMode: "progressive",
    longRangePlan: "none",
    satelliteRiderId: null,
    bridgeRiderId: null,
    secondAttackerId: null
  };
  v.ui ||= { managerSubtab: "calendar", analyticsRiderId: null, scoutingFilter: "all" };

  Game.riders.forEach(r => ensureRiderV024(r));

  TEAMS.forEach(team => {
    v.staffAssignments[team.id] ||= {};
    v.logistics[team.id] ||= {};
  });

  if (Game.selectedTeamId) {
    const team = getTeam(Game.selectedTeamId);
    const race = getRace();
    ensureRaceOperationsV024(team?.id, race?.id);
  }

  normalizeManagerContractsV024();
}

function ensureRiderV024(r) {
  if (!r) return;
  const v = Game.v024;
  const profile = PHYSIOLOGY_PROFILES_V024[r.roleKey] || PHYSIOLOGY_PROFILES_V024.domestique;
  const weight = toNum(r.weightKg, estimateWeightV024(r));
  r.weightKg = weight;

  if (!v.physiology[r.id]) {
    const quality = clamp((toNum(r.base, 74) - 70) / 28, 0, 1);
    const mountainBias = (toNum(r.stats?.mountain, 72) - 72) * 0.010;
    const ttBias = (toNum(r.stats?.tt, 72) - 72) * 0.006;
    const cpWkg = clamp(profile.cpWkg + quality * 0.72 + mountainBias + ttBias, 3.65, 6.45);
    const cp = Math.round(cpWkg * weight);
    const wPrimeMax = Math.round((profile.wPrimeKJ + quality * 8 + (toNum(r.stats?.acceleration, 72) - 70) * 0.12) * 1000);
    v.physiology[r.id] = {
      cp,
      cpWkg: Math.round((cp / weight) * 100) / 100,
      wPrimeMax,
      vo2max: Math.round(profile.vo2 + quality * 8 + (toNum(r.stats?.stamina, 72) - 72) * 0.08),
      durability: clamp(profile.durability + (toNum(r.stats?.recovery, 72) - 72) * 0.004, 0.84, 1.18),
      sprintReserve: profile.sprintReserve,
      heatAcclimation: 50,
      altitudeAdaptation: 40,
      illnessRisk: 8,
      lastUpdated: Date.now()
    };
  }

  if (!v.technical[r.id]) {
    const role = r.roleKey;
    v.technical[r.id] = {
      tireWidth: role === "classics" ? "32" : role === "sprinter" ? "30" : "30",
      pressureFront: role === "classics" ? 3.9 : 4.5,
      pressureRear: role === "classics" ? 4.1 : 4.7,
      tireSystem: "tubeless",
      compound: "balanced",
      protection: role === "classics" ? "reinforced" : "standard",
      descentMode: "normal",
      formation: r.id === Game.protectedRiderId ? "protected" : ["rouleur", "tt", "domestique"].includes(role) ? "rotation" : "middle"
    };
  }

  if (!v.individualCalendars[r.id]) {
    const preset = calendarPresetForRiderV024(r);
    v.individualCalendars[r.id] = {
      presetId: preset.id,
      raceIds: preset.priorities.filter(id => byId(RACES, id)),
      maxRaceDays: preset.maxRaceDays,
      plannedRaceDays: 0,
      notes: ""
    };
  }

  if (!v.formTargets[r.id]) {
    const calendar = v.individualCalendars[r.id];
    const available = calendar.raceIds.length ? calendar.raceIds : SEASON_RACE_IDS;
    v.formTargets[r.id] = {
      peakType: ["gc", "co", "climber"].includes(r.roleKey) ? "single_long" : ["classics", "puncheur"].includes(r.roleKey) ? "classics_block" : "single_sharp",
      A: available[0] || DEFAULT_RACE_ID,
      B: available[Math.min(1, available.length - 1)] || available[0] || DEFAULT_RACE_ID,
      C: available[Math.min(2, available.length - 1)] || available[0] || DEFAULT_RACE_ID,
      trainingLoad: 50,
      freshness: 70,
      peakHistory: []
    };
  }

  if (!v.contractPromises[r.id]) {
    const existing = Game.manager?.contracts?.[r.id] || defaultContractForRiderV019(r);
    v.contractPromises[r.id] = {
      role: contractRoleForRiderV024(r),
      promises: [],
      targetRaceId: v.formTargets[r.id].A,
      minimumRaceDays: ["domestique", "rouleur"].includes(r.roleKey) ? 65 : 48,
      raceDaysCompleted: 0,
      leadershipStarts: 0,
      releaseClause: Math.round(toNum(existing.marketValue, 1000000) * 2.2 / 1000) * 1000,
      winBonus: Math.round(toNum(existing.salary, 150000) * 0.12 / 1000) * 1000,
      promiseScore: 70,
      lastEvaluation: null
    };
  }

  v.analytics.riderHistory[r.id] ||= [];
}

function estimateWeightV024(r) {
  if (["gc", "climber"].includes(r.roleKey)) return Math.round(rnd(59, 67));
  if (r.roleKey === "co") return Math.round(rnd(62, 69));
  if (["sprinter", "classics"].includes(r.roleKey)) return Math.round(rnd(72, 82));
  if (["tt", "rouleur"].includes(r.roleKey)) return Math.round(rnd(70, 80));
  if (r.roleKey === "puncheur") return Math.round(rnd(64, 73));
  return Math.round(rnd(66, 76));
}

function calendarPresetForRiderV024(r) {
  const id = ["gc", "co", "climber"].includes(r.roleKey) ? "gc" :
    ["classics", "puncheur"].includes(r.roleKey) ? "classics" :
    r.roleKey === "sprinter" ? "sprinter" :
    r.roleKey === "tt" ? "tt" :
    r.age <= 23 ? "development" : "custom";
  return byId(CALENDAR_PRESETS_V024, id) || CALENDAR_PRESETS_V024[0];
}

function contractRoleForRiderV024(r) {
  if (r.roleKey === "gc") return "leader";
  if (r.roleKey === "co") return "co_leader";
  if (r.roleKey === "sprinter") return "sprinter";
  if (["climber", "puncheur", "classics"].includes(r.roleKey) && r.base >= 82) return "stage_hunter";
  if (r.age <= 23) return "development";
  return "domestique";
}

function normalizeManagerContractsV024() {
  if (!Game.manager) return;
  Game.manager.contracts ||= {};
  Game.riders.filter(r => r.teamId === Game.selectedTeamId).forEach(r => {
    const c = Game.manager.contracts[r.id] ||= defaultContractForRiderV019(r);
    c.salary = toNum(c.salary, 150000);
    c.years = clamp(toNum(c.years, 2), 1, 5);
    c.happiness = clamp(toNum(c.happiness, 70), 0, 100);
    c.marketValue = toNum(c.marketValue, Math.round(r.base * r.base * 180));
    c.rolePromise ||= Game.v024.contractPromises[r.id]?.role || contractRoleForRiderV024(r);
    c.releaseClause ||= Game.v024.contractPromises[r.id]?.releaseClause || Math.round(c.marketValue * 2.2);
    c.winBonus ||= Game.v024.contractPromises[r.id]?.winBonus || Math.round(c.salary * 0.12);
  });
}

function ensureRaceOperationsV024(teamId, raceId) {
  if (!teamId || !raceId || !Game.v024) return;
  Game.v024.staffAssignments[teamId] ||= {};
  Game.v024.staffAssignments[teamId][raceId] ||= { director: null, coach: null, nutrition: null, mechanic: null, analyst: null, scout: null };
  Game.v024.logistics[teamId] ||= {};
  Game.v024.logistics[teamId][raceId] ||= { planId: "standard", arrivalId: "normal", paid: false, applied: false };
}

function getPhysiologyV024(riderOrId) {
  const r = typeof riderOrId === "string" ? getRider(riderOrId) : riderOrId;
  if (!r) return null;
  ensureRiderV024(r);
  return Game.v024.physiology[r.id];
}

function getTechnicalV024(riderOrId) {
  const r = typeof riderOrId === "string" ? getRider(riderOrId) : riderOrId;
  if (!r) return null;
  ensureRiderV024(r);
  return Game.v024.technical[r.id];
}

function currentRaceDateV024() {
  const race = getRace();
  return race?.date ? new Date(`${race.date}T12:00:00`) : new Date("2026-07-01T12:00:00");
}

function daysBetweenV024(a, b) {
  const da = a instanceof Date ? a : new Date(`${a}T12:00:00`);
  const db = b instanceof Date ? b : new Date(`${b}T12:00:00`);
  return Math.round((db - da) / 86400000);
}

function raceDateByIdV024(id) {
  const race = byId(RACES, id);
  return race?.date || "2026-12-31";
}

/* ============================================================
   2. WRAPPERS DE INICIO, GUARDADO Y ROSTER
   ============================================================ */

const __v024_init_base = init;
init = function() {
  __v024_init_base();
  ensureV024State();
  Game.version = V024_VERSION;
  renderHome();
};

const __v024_load_base = loadGame;
loadGame = function() {
  const raw = safeStorageGet(SAVE_KEY);
  if (!raw) {
    return toast(STORAGE_STATE.available
      ? "No hay guardado v0.24+. Empieza una partida nueva."
      : "El navegador bloquea el almacenamiento local. Puedes jugar, pero no cargar partidas.");
  }
  try {
    const obj = JSON.parse(raw);
    if (obj.version !== SAVE_VERSION && obj.version !== V024_VERSION) {
      safeStorageRemove(SAVE_KEY);
      toast("Guardado incompatible eliminado. Inicia una partida nueva.");
      return init();
    }
    Object.assign(Game, obj);
    if (!Game.riders?.length) Game.riders = clone(RIDERS);
    sanitizeGameState();
    ensureV024State();
    render();
  } catch (error) {
    console.error(error);
    safeStorageRemove(SAVE_KEY);
    toast("Guardado corrupto eliminado.");
    init();
  }
};

const __v024_save_base = saveGame;
saveGame = function(show = true) {
  ensureV024State();
  Game.version = V024_VERSION;
  const saved = safeStorageSet(SAVE_KEY, JSON.stringify(Game));
  if (show) {
    toast(saved ? "Partida v0.24+ guardada" : "La partida continúa, pero el navegador bloquea el guardado local");
  }
  return saved;
};

const __v024_clear_base = clearSave;
clearSave = function() {
  __v024_clear_base();
  ["cyclingManager_v015", "cyclingManager_v017", "cyclingManager_v019", "cyclingManager_v021", "cyclingManager_v023", "cyclingManager_v024", "cyclingManager_v024plus"].forEach(safeStorageRemove);
  toast(STORAGE_STATE.available ? "Guardados anteriores borrados" : "El navegador bloquea el almacenamiento local");
};

const __v024_selectTeam_base = selectTeam;
selectTeam = function(teamId) {
  // La función base ya prepara y renderiza la convocatoria.
  // Evitamos una segunda inicialización que podía pisar el estado en navegadores móviles.
  __v024_selectTeam_base(teamId);
  ensureV024State();
};

const __v024_autoSelectRoster_base = autoSelectRoster;
autoSelectRoster = function(teamId, race) {
  ensureV024State();
  const riders = getFullTeamRiders(teamId);
  if (teamId !== Game.selectedTeamId) return __v024_autoSelectRoster_base(teamId, race);
  const scheduled = riders.filter(r => {
    const calendar = Game.v024.individualCalendars[r.id];
    return !calendar || calendar.raceIds.includes(race.id);
  });
  const pool = scheduled.length >= ROSTER_SIZE ? scheduled : riders;
  const originalRiders = Game.riders;
  if (pool === riders) return __v024_autoSelectRoster_base(teamId, race);
  const excluded = new Set(riders.filter(r => !pool.includes(r)).map(r => r.id));
  const selected = __v024_autoSelectRoster_base(teamId, race).filter(r => !excluded.has(r.id));
  if (selected.length >= ROSTER_SIZE) return selected.slice(0, ROSTER_SIZE);
  return [...selected, ...pool.filter(r => !selected.some(x => x.id === r.id)).sort((a, b) => readinessScoreAdvancedV024(b, race) - readinessScoreAdvancedV024(a, race))].slice(0, ROSTER_SIZE);
};

/* ============================================================
   3. PLANIFICACIÓN DE FORMA Y CALENDARIO INDIVIDUAL
   ============================================================ */

function readinessScoreAdvancedV024(r, race = getRace()) {
  ensureRiderV024(r);
  const targets = Game.v024.formTargets[r.id];
  const peak = byId(PEAK_TYPES_V024, targets.peakType) || PEAK_TYPES_V024[0];
  const raceDate = new Date(`${race.date}T12:00:00`);
  const targetEntries = [["A", targets.A, 1.0], ["B", targets.B, 0.66], ["C", targets.C, 0.38]];
  let peakBonus = 0;
  let closestDays = 999;

  targetEntries.forEach(([priority, id, scale]) => {
    if (!id) return;
    const days = Math.abs(daysBetweenV024(raceDate, new Date(`${raceDateByIdV024(id)}T12:00:00`)));
    closestDays = Math.min(closestDays, days);
    const gaussian = Math.exp(-Math.pow(days / Math.max(5, peak.peakWidthDays), 2));
    peakBonus = Math.max(peakBonus, peak.maxBonus * scale * gaussian);
  });

  const logistics = logisticsReadinessV024(r, race);
  const fatiguePenalty = toNum(r.fatigue, 0) * 0.42;
  const loadPenalty = Math.max(0, targets.trainingLoad - 72) * 0.18;
  const freshness = clamp(82 - fatiguePenalty - loadPenalty + targets.freshness * 0.12, 0, 100);
  const base = toNum(r.form, 70) + peakBonus + logistics + freshness * 0.08;
  return clamp(base, 35, 105);
}

function formModifierV024(r, race = getRace()) {
  return (readinessScoreAdvancedV024(r, race) - 75) * 0.0065;
}

function logisticsReadinessV024(r, race = getRace()) {
  if (!Game.selectedTeamId || r.teamId !== Game.selectedTeamId) return 0;
  ensureRaceOperationsV024(r.teamId, race.id);
  const settings = Game.v024.logistics[r.teamId][race.id];
  const plan = byId(LOGISTICS_PLANS_V024, settings.planId) || LOGISTICS_PLANS_V024[1];
  const arrival = byId(ARRIVAL_OPTIONS_V024, settings.arrivalId) || ARRIVAL_OPTIONS_V024[1];
  const jetLag = race.country === "Australia" || race.country === "China" || race.country === "Canada" ? 5 : race.country === "United Arab Emirates" ? 3 : 1;
  return plan.recovery + arrival.adaptation - jetLag * plan.jetLag * 0.6;
}

function setCalendarPresetV024(riderId, presetId) {
  ensureV024State();
  const p = byId(CALENDAR_PRESETS_V024, presetId) || CALENDAR_PRESETS_V024[0];
  Game.v024.individualCalendars[riderId] = {
    ...Game.v024.individualCalendars[riderId],
    presetId: p.id,
    raceIds: p.priorities.filter(id => byId(RACES, id)),
    maxRaceDays: p.maxRaceDays
  };
  renderRace();
}

function toggleRiderRaceV024(riderId, raceId) {
  ensureV024State();
  const cal = Game.v024.individualCalendars[riderId];
  cal.presetId = "custom";
  cal.raceIds = cal.raceIds.includes(raceId) ? cal.raceIds.filter(id => id !== raceId) : [...cal.raceIds, raceId];
  cal.raceIds.sort((a, b) => raceDateByIdV024(a).localeCompare(raceDateByIdV024(b)));
  renderRace();
}

function setFormTargetV024(riderId, priority, raceId) {
  ensureV024State();
  Game.v024.formTargets[riderId][priority] = raceId;
  renderRace();
}

function setPeakTypeV024(riderId, peakType) {
  ensureV024State();
  Game.v024.formTargets[riderId].peakType = peakType;
  renderRace();
}

function setTrainingLoadV024(riderId, load) {
  ensureV024State();
  Game.v024.formTargets[riderId].trainingLoad = clamp(Number(load), 20, 100);
  renderRace();
}

function renderSeasonPlanningV024() {
  ensureV024State();
  const riders = getFullTeamRiders(Game.selectedTeamId).slice().sort((a, b) => b.base - a.base);
  const selectedId = Game.v024.ui.calendarRiderId || riders[0]?.id;
  Game.v024.ui.calendarRiderId = selectedId;
  const selected = getRider(selectedId);
  const races = RACES;
  const cal = selected ? Game.v024.individualCalendars[selected.id] : null;
  const targets = selected ? Game.v024.formTargets[selected.id] : null;

  return `<section class="panel">
    <div class="section-heading"><div><h2>Calendario individual y objetivos A/B/C</h2><p class="muted">Planifica días de competición, picos de forma, carga y frescura. La convocatoria automática respeta el calendario.</p></div></div>
    <div class="planning-layout">
      <div class="planning-rider-list">
        ${riders.map(r => `<button class="planning-rider ${r.id === selectedId ? "active" : ""}" onclick="Game.v024.ui.calendarRiderId='${r.id}';renderRace()"><strong>${esc(r.name)}</strong><span>${esc(r.role)} · readiness ${Math.round(readinessScoreAdvancedV024(r))}</span></button>`).join("")}
      </div>
      ${selected ? `<div class="planning-main">
        <div class="manager-card">
          <div class="badge-row"><span class="badge green">${esc(selected.role)}</span><span class="badge blue">Forma ${Math.round(selected.form)}</span><span class="badge orange">Fatiga ${Math.round(selected.fatigue)}</span><span class="badge">CP ${getPhysiologyV024(selected).cp} W</span></div>
          <h3>${esc(selected.name)}</h3>
          <label>Preset de calendario</label>
          <select onchange="setCalendarPresetV024('${selected.id}',this.value)">${CALENDAR_PRESETS_V024.map(p => `<option value="${p.id}" ${cal.presetId === p.id ? "selected" : ""}>${esc(p.name)} · máx. ${p.maxRaceDays} días</option>`).join("")}</select>
          <label>Tipo de pico</label>
          <select onchange="setPeakTypeV024('${selected.id}',this.value)">${PEAK_TYPES_V024.map(p => `<option value="${p.id}" ${targets.peakType === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
          <div class="target-grid">
            ${["A", "B", "C"].map(priority => `<label>Objetivo ${priority}<select onchange="setFormTargetV024('${selected.id}','${priority}',this.value)">${races.map(r => `<option value="${r.id}" ${targets[priority] === r.id ? "selected" : ""}>${r.date} · ${esc(r.name)}</option>`).join("")}</select></label>`).join("")}
          </div>
          <label>Carga planificada: <strong>${Math.round(targets.trainingLoad)}</strong></label>
          <input type="range" min="20" max="100" value="${targets.trainingLoad}" onchange="setTrainingLoadV024('${selected.id}',this.value)">
          ${renderPeakCurveV024(selected)}
        </div>
        <div class="race-check-grid">${races.map(r => `<label class="race-check ${cal.raceIds.includes(r.id) ? "selected" : ""}"><input type="checkbox" ${cal.raceIds.includes(r.id) ? "checked" : ""} onchange="toggleRiderRaceV024('${selected.id}','${r.id}')"><span><b>${r.date}</b>${esc(r.name)}</span></label>`).join("")}</div>
      </div>` : ""}
    </div>
  </section>`;
}

function renderPeakCurveV024(r) {
  const targets = Game.v024.formTargets[r.id];
  const w = 720, h = 140, pad = 28;
  const races = RACES;
  const start = new Date("2026-01-01T12:00:00");
  const end = new Date("2026-12-31T12:00:00");
  const points = [];
  for (let day = 0; day <= 364; day += 7) {
    const d = new Date(start.getTime() + day * 86400000);
    let bonus = 0;
    [[targets.A, 1], [targets.B, .66], [targets.C, .38]].forEach(([id, scale]) => {
      const peak = byId(PEAK_TYPES_V024, targets.peakType) || PEAK_TYPES_V024[0];
      const target = new Date(`${raceDateByIdV024(id)}T12:00:00`);
      const dist = Math.abs(daysBetweenV024(d, target));
      bonus = Math.max(bonus, Math.exp(-Math.pow(dist / peak.peakWidthDays, 2)) * peak.maxBonus * scale);
    });
    const readiness = clamp(toNum(r.form, 70) - toNum(r.fatigue, 0) * .24 + bonus, 45, 102);
    points.push({ day, readiness });
  }
  const x = d => pad + (d / 364) * (w - pad * 2);
  const y = v => h - pad - ((v - 45) / 57) * (h - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.readiness).toFixed(1)}`).join(" ");
  const markers = [[targets.A, "A"], [targets.B, "B"], [targets.C, "C"]].map(([id, label]) => {
    const race = byId(races, id); if (!race) return "";
    const day = daysBetweenV024(start, new Date(`${race.date}T12:00:00`));
    return `<line x1="${x(day)}" y1="15" x2="${x(day)}" y2="${h - 18}" class="peak-marker peak-${label.toLowerCase()}"/><text x="${x(day) + 4}" y="22" class="svg-label">${label}</text>`;
  }).join("");
  return `<div class="peak-chart"><svg viewBox="0 0 ${w} ${h}"><line x1="${pad}" y1="${y(75)}" x2="${w-pad}" y2="${y(75)}" class="chart-grid"/><path d="${path}" class="chart-line"/>${markers}</svg></div>`;
}

/* ============================================================
   4. CONTRATOS, PROMESAS, SCOUTING Y MENTORÍA
   ============================================================ */

function renderContractsScoutingV024() {
  ensureV024State();
  return `<div class="manager-tabs"><button class="secondary ${Game.v024.ui.managerSubtab === "contracts" ? "active" : ""}" onclick="Game.v024.ui.managerSubtab='contracts';renderRace()">Contratos</button><button class="secondary ${Game.v024.ui.managerSubtab === "scouting" ? "active" : ""}" onclick="Game.v024.ui.managerSubtab='scouting';renderRace()">Scouting</button><button class="secondary ${Game.v024.ui.managerSubtab === "mentoring" ? "active" : ""}" onclick="Game.v024.ui.managerSubtab='mentoring';renderRace()">Mentoría</button><button class="secondary ${Game.v024.ui.managerSubtab === "legacy_market" ? "active" : ""}" onclick="Game.v024.ui.managerSubtab='legacy_market';renderRace()">Mercado v0.19</button></div>
  ${Game.v024.ui.managerSubtab === "contracts" ? renderAdvancedContractsV024() : ""}
  ${Game.v024.ui.managerSubtab === "scouting" ? renderAdvancedScoutingV024() : ""}
  ${Game.v024.ui.managerSubtab === "mentoring" ? renderMentorshipV024() : ""}
  ${Game.v024.ui.managerSubtab === "legacy_market" ? renderMarketTabV019() : ""}`;
}

function renderAdvancedContractsV024() {
  const riders = getFullTeamRiders(Game.selectedTeamId).slice().sort((a, b) => b.base - a.base);
  return `<section class="panel"><h2>Contratos, salario y promesas</h2><p class="muted">El rol prometido, las carreras garantizadas y los días de competición afectan a la felicidad y las renovaciones.</p><div class="contract-grid">${riders.map(renderContractCardV024).join("")}</div></section>`;
}

function renderContractCardV024(r) {
  const c = Game.manager.contracts[r.id] || defaultContractForRiderV019(r);
  const p = Game.v024.contractPromises[r.id];
  return `<div class="contract-card ${c.happiness < 45 ? "bad" : c.happiness < 68 ? "warn" : "good"}">
    <div class="badge-row"><span class="badge green">${esc(r.role)}</span><span class="badge blue">${moneyV019(c.salary)}/año</span><span class="badge orange">${c.years} años</span><span class="badge">Felicidad ${Math.round(c.happiness)}</span></div>
    <h3>${esc(r.name)}</h3>
    <label>Rol prometido</label><select onchange="setContractRoleV024('${r.id}',this.value)">${CONTRACT_ROLES_V024.map(role => `<option value="${role.id}" ${p.role === role.id ? "selected" : ""}>${esc(role.name)}</option>`).join("")}</select>
    <label>Carrera objetivo / liderazgo</label><select onchange="setContractTargetV024('${r.id}',this.value)">${RACES.map(race => `<option value="${race.id}" ${p.targetRaceId === race.id ? "selected" : ""}>${race.date} · ${esc(race.name)}</option>`).join("")}</select>
    <label>Días mínimos: <strong>${p.minimumRaceDays}</strong></label><input type="range" min="25" max="90" value="${p.minimumRaceDays}" onchange="setContractDaysV024('${r.id}',this.value)">
    <div class="promise-list">${CONTRACT_PROMISES_V024.map(pr => `<label><input type="checkbox" ${p.promises.includes(pr.id) ? "checked" : ""} onchange="togglePromiseV024('${r.id}','${pr.id}')">${esc(pr.name)}</label>`).join("")}</div>
    <div class="contract-money"><span>Bonus victoria: ${moneyV019(p.winBonus)}</span><span>Cláusula: ${moneyV019(p.releaseClause)}</span></div>
    <div class="preset-row"><button class="secondary" onclick="renewContractV024('${r.id}')">Negociar renovación</button><button class="danger" onclick="releaseRiderV019('${r.id}')">Rescindir</button></div>
  </div>`;
}

function setContractRoleV024(id, role) { Game.v024.contractPromises[id].role = role; renderRace(); }
function setContractTargetV024(id, raceId) { Game.v024.contractPromises[id].targetRaceId = raceId; renderRace(); }
function setContractDaysV024(id, days) { Game.v024.contractPromises[id].minimumRaceDays = Number(days); renderRace(); }
function togglePromiseV024(id, promiseId) {
  const p = Game.v024.contractPromises[id];
  p.promises = p.promises.includes(promiseId) ? p.promises.filter(x => x !== promiseId) : [...p.promises, promiseId];
  renderRace();
}

function renewContractV024(id) {
  const r = getRider(id); if (!r) return;
  const c = Game.manager.contracts[id] || defaultContractForRiderV019(r);
  const promise = Game.v024.contractPromises[id];
  const role = byId(CONTRACT_ROLES_V024, promise.role) || CONTRACT_ROLES_V024[5];
  const requested = Math.round(c.salary * role.salaryFactor * (1 + Math.max(0, r.form - 78) / 180) / 1000) * 1000;
  const signing = Math.round(requested * .30);
  if (Game.manager.budget < signing) return toast("Presupuesto insuficiente para la prima de renovación");
  Game.manager.budget -= signing;
  c.salary = requested;
  c.years = clamp(c.years + 2, 2, 5);
  c.happiness = clamp(c.happiness + 14 + promise.promises.length * 2, 0, 100);
  c.rolePromise = promise.role;
  c.releaseClause = promise.releaseClause;
  c.winBonus = promise.winBonus;
  Game.manager.contracts[id] = c;
  toast(`${r.name} renueva por ${c.years} años`);
  renderRace();
}

function renderAdvancedScoutingV024() {
  processCompletedScoutingV024(false);
  return `<section class="panel"><h2>Cantera y scouting profundo</h2><div class="manager-strip"><div class="manager-kpi"><span>Nivel academia</span><strong>${Game.v024.academy.level}/5</strong></div><div class="manager-kpi"><span>Reputación</span><strong>${Math.round(Game.v024.academy.reputation)}</strong></div><div class="manager-kpi"><span>Graduados</span><strong>${Game.v024.academy.graduates}</strong></div><div class="manager-kpi"><span>Misiones activas</span><strong>${Game.v024.scoutingMissions.filter(m => !m.completed).length}</strong></div></div>
  <div class="scouting-mission-grid">${SCOUTING_MISSIONS_V024.map(m => renderScoutingMissionV024(m)).join("")}</div>
  <h2>Informes disponibles</h2><div class="market-list">${(Game.manager.youthPool || []).map(renderDeepYouthV024).join("") || `<p class="muted">No hay jóvenes observados. Lanza una misión.</p>`}</div>
  <div class="preset-row"><button class="secondary" onclick="upgradeAcademyV024()">Mejorar academia</button></div></section>`;
}

function renderScoutingMissionV024(m) {
  const active = Game.v024.scoutingMissions.find(x => x.missionId === m.id && !x.completed);
  return `<div class="scouting-card ${active ? "active" : ""}"><div class="badge-row"><span class="badge blue">${esc(m.region)}</span><span class="badge orange">${m.races} carreras</span><span class="badge">${moneyV019(m.cost)}</span></div><h3>${esc(m.name)}</h3><p>${esc(m.focus)} · precisión base ${Math.round(m.accuracy * 100)}%</p><button ${active ? "disabled" : ""} onclick="launchScoutingMissionV024('${m.id}')">${active ? `En curso · ${active.remainingRaces} carreras` : "Lanzar misión"}</button></div>`;
}

function launchScoutingMissionV024(id) {
  const mission = byId(SCOUTING_MISSIONS_V024, id); if (!mission) return;
  if (Game.manager.budget < mission.cost) return toast("Presupuesto insuficiente");
  if (Game.v024.scoutingMissions.some(m => m.missionId === id && !m.completed)) return;
  Game.manager.budget -= mission.cost;
  Game.v024.scoutingMissions.push({ missionId: id, remainingRaces: mission.races, completed: false, startedAtRace: Game.selectedRaceId });
  toast(`Misión iniciada: ${mission.name}`);
  renderRace();
}

function processCompletedScoutingV024(decrement = true) {
  ensureV024State();
  Game.v024.scoutingMissions.forEach(active => {
    if (active.completed) return;
    if (decrement) active.remainingRaces--;
    if (active.remainingRaces > 0) return;
    const mission = byId(SCOUTING_MISSIONS_V024, active.missionId);
    const quantity = 2 + Game.v024.academy.level;
    for (let i = 0; i < quantity; i++) {
      const rider = generateScoutedRiderV019(mission.focus, mission.region);
      rider.age = Math.round(rnd(17, 21));
      rider.potential = clamp(rider.base + Math.round(rnd(5, 14) + mission.potentialBonus + Game.v024.academy.level), rider.base + 3, 98);
      rider.developmentCurve = DEVELOPMENT_CURVES_V024[Math.floor(rnd(0, DEVELOPMENT_CURVES_V024.length))].id;
      rider.scoutAccuracy = clamp(mission.accuracy + staffEffectAssignedV024("scouting") / 100 + Game.v024.academy.level * .025, .45, .96);
      rider.potentialLow = Math.max(rider.base, Math.round(rider.potential - (1 - rider.scoutAccuracy) * 12));
      rider.potentialHigh = Math.min(99, Math.round(rider.potential + (1 - rider.scoutAccuracy) * 12));
      rider.traits = generateTraitsV024(rider);
      Game.manager.youthPool.push(rider);
    }
    active.completed = true;
    toast(`Scouting completado: ${mission.name}`);
  });
}

function generateTraitsV024(r) {
  const pool = r.roleKey === "climber" ? ["altitud", "calor", "recuperación", "bajadas"] : r.roleKey === "classics" ? ["lluvia", "pavé", "colocación", "resistencia"] : r.roleKey === "sprinter" ? ["explosivo", "tren", "colocación", "potencia"] : ["regular", "motor", "táctico", "resistente"];
  return [...pool].sort(() => Math.random() - .5).slice(0, 2);
}

function renderDeepYouthV024(r) {
  return `<div class="market-card youth"><div class="badge-row"><span class="badge green">${esc(r.role)}</span><span class="badge blue">Base ${r.base}</span><span class="badge orange">Potencial ${r.potentialLow || r.potential}-${r.potentialHigh || r.potential}</span></div><h3>${esc(r.name)}</h3><p>${esc(r.nationality)} · ${r.age} años · curva ${esc(r.developmentCurve || "normal")}</p><div class="chip-row">${(r.traits || []).map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div>${miniStats(r)}<button onclick="signYouthAdvancedV024('${r.id}')">Promocionar</button></div>`;
}

function signYouthAdvancedV024(id) {
  signMarketRiderV019(id, "youthPool");
  Game.v024.academy.graduates++;
  ensureV024State();
}

function upgradeAcademyV024() {
  const cost = 350000 * Game.v024.academy.level;
  if (Game.v024.academy.level >= 5) return toast("Academia al máximo");
  if (Game.manager.budget < cost) return toast("Presupuesto insuficiente");
  Game.manager.budget -= cost;
  Game.v024.academy.level++;
  Game.v024.academy.reputation = clamp(Game.v024.academy.reputation + 9, 0, 100);
  renderRace();
}

function renderMentorshipV024() {
  const riders = getFullTeamRiders(Game.selectedTeamId);
  const young = riders.filter(r => r.age <= 23);
  const mentors = riders.filter(r => r.age >= 28 && r.base >= 76);
  return `<section class="panel"><h2>Sistema de mentoría</h2><p class="muted">Los veteranos aceleran el desarrollo técnico y táctico de los jóvenes durante los bloques de entrenamiento.</p><div class="mentorship-grid">${young.map(y => {
    const m = Game.v024.mentorships[y.id] || { mentorId: "", typeId: "leadership" };
    return `<div class="mentorship-card"><div class="badge-row"><span class="badge green">Joven</span><span class="badge blue">${esc(y.role)}</span></div><h3>${esc(y.name)}</h3><label>Mentor</label><select onchange="setMentorV024('${y.id}',this.value)"><option value="">Sin mentor</option>${mentors.map(v => `<option value="${v.id}" ${m.mentorId === v.id ? "selected" : ""}>${esc(v.name)} · ${esc(v.role)}</option>`).join("")}</select><label>Tipo</label><select onchange="setMentorshipTypeV024('${y.id}',this.value)">${MENTORSHIP_TYPES_V024.map(t => `<option value="${t.id}" ${m.typeId === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>`;
  }).join("") || `<p class="muted">No hay corredores sub-23 en la plantilla.</p>`}</div></section>`;
}

function setMentorV024(youthId, mentorId) { Game.v024.mentorships[youthId] ||= {}; Game.v024.mentorships[youthId].mentorId = mentorId; Game.v024.mentorships[youthId].typeId ||= "leadership"; renderRace(); }
function setMentorshipTypeV024(youthId, typeId) { Game.v024.mentorships[youthId] ||= {}; Game.v024.mentorships[youthId].typeId = typeId; renderRace(); }

/* ============================================================
   5. STAFF ASIGNABLE Y LOGÍSTICA
   ============================================================ */

function renderOperationsV024() {
  ensureV024State();
  const teamId = Game.selectedTeamId;
  const race = getRace();
  ensureRaceOperationsV024(teamId, race.id);
  const assignments = Game.v024.staffAssignments[teamId][race.id];
  const logistics = Game.v024.logistics[teamId][race.id];

  return `<section class="panel"><h2>Operaciones de carrera: staff y logística</h2><p class="muted">El staff solo aporta su efecto completo cuando está asignado a la carrera. La logística modifica adaptación, recuperación y moral.</p>
    <div class="operations-grid">
      <div class="manager-card"><h3>Staff para ${esc(race.name)}</h3>${STAFF_RACE_ROLES_V024.map(role => `<label>${esc(role.name)}<select onchange="assignStaffV024('${role.id}',this.value)"><option value="">Sin asignar</option>${Object.keys(Game.manager.staff || {}).map(id => { const s = STAFF_OPTIONS_V019.find(x => x.id === id); return s ? `<option value="${id}" ${assignments[role.id] === id ? "selected" : ""}>${esc(s.name)}</option>` : ""; }).join("")}</select></label>`).join("")}<div class="effect-grid">${renderAssignedStaffEffectsV024()}</div></div>
      <div class="manager-card"><h3>Plan logístico</h3><label>Nivel de operación<select onchange="setLogisticsPlanV024(this.value)">${LOGISTICS_PLANS_V024.map(p => `<option value="${p.id}" ${logistics.planId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label><label>Llegada<select onchange="setArrivalPlanV024(this.value)">${ARRIVAL_OPTIONS_V024.map(p => `<option value="${p.id}" ${logistics.arrivalId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>${renderLogisticsSummaryV024(race, logistics)}<button class="secondary" onclick="payLogisticsV024()">Confirmar y pagar operación</button></div>
    </div>
    <h2>Contratación de staff</h2>${renderStaffTabV019()}
  </section>`;
}

function assignStaffV024(roleId, staffId) {
  ensureRaceOperationsV024(Game.selectedTeamId, Game.selectedRaceId);
  Game.v024.staffAssignments[Game.selectedTeamId][Game.selectedRaceId][roleId] = staffId || null;
  renderRace();
}

function staffEffectAssignedV024(key, teamId = Game.selectedTeamId, raceId = Game.selectedRaceId) {
  if (!teamId || !raceId) return 0;
  ensureRaceOperationsV024(teamId, raceId);
  const assignments = Game.v024.staffAssignments[teamId][raceId];
  return Object.values(assignments).reduce((sum, id) => {
    const staff = STAFF_OPTIONS_V019.find(s => s.id === id);
    return sum + toNum(staff?.effect?.[key], 0);
  }, 0);
}

function renderAssignedStaffEffectsV024() {
  const keys = ["tactics", "form", "nutrition", "reliability", "pacing", "scouting"];
  return keys.map(k => `<div><strong>${esc(k)}</strong><span>+${Math.round(staffEffectAssignedV024(k))}</span></div>`).join("");
}

function setLogisticsPlanV024(id) { ensureRaceOperationsV024(Game.selectedTeamId, Game.selectedRaceId); Game.v024.logistics[Game.selectedTeamId][Game.selectedRaceId].planId = id; Game.v024.logistics[Game.selectedTeamId][Game.selectedRaceId].paid = false; renderRace(); }
function setArrivalPlanV024(id) { ensureRaceOperationsV024(Game.selectedTeamId, Game.selectedRaceId); Game.v024.logistics[Game.selectedTeamId][Game.selectedRaceId].arrivalId = id; Game.v024.logistics[Game.selectedTeamId][Game.selectedRaceId].paid = false; renderRace(); }

function logisticsCostV024(race, settings) {
  const plan = byId(LOGISTICS_PLANS_V024, settings.planId) || LOGISTICS_PLANS_V024[1];
  const arrival = byId(ARRIVAL_OPTIONS_V024, settings.arrivalId) || ARRIVAL_OPTIONS_V024[1];
  const distanceFactor = ["Australia", "China", "Canada"].includes(race.country) ? 2.2 : ["United Arab Emirates"].includes(race.country) ? 1.55 : 1;
  const stageFactor = 1 + race.stages.length * .06;
  return Math.round(42000 * plan.costFactor * arrival.cost * distanceFactor * stageFactor / 1000) * 1000;
}

function renderLogisticsSummaryV024(race, settings) {
  const plan = byId(LOGISTICS_PLANS_V024, settings.planId) || LOGISTICS_PLANS_V024[1];
  const arrival = byId(ARRIVAL_OPTIONS_V024, settings.arrivalId) || ARRIVAL_OPTIONS_V024[1];
  const cost = logisticsCostV024(race, settings);
  return `<div class="logistics-summary"><div><span>Coste</span><strong>${moneyV019(cost)}</strong></div><div><span>Recuperación</span><strong>${plan.recovery >= 0 ? "+" : ""}${plan.recovery}</strong></div><div><span>Adaptación</span><strong>${arrival.adaptation >= 0 ? "+" : ""}${arrival.adaptation}</strong></div><div><span>Estado</span><strong>${settings.paid ? "Confirmado" : "Pendiente"}</strong></div></div><p class="muted small">${esc(plan.description)}</p>`;
}

function payLogisticsV024() {
  const race = getRace();
  const settings = Game.v024.logistics[Game.selectedTeamId][race.id];
  const cost = logisticsCostV024(race, settings);
  if (settings.paid) return toast("Operación ya confirmada");
  if (Game.manager.budget < cost) return toast("Presupuesto insuficiente");
  Game.manager.budget -= cost;
  settings.paid = true;
  settings.applied = false;
  toast("Logística confirmada");
  renderRace();
}

/* ============================================================
   6. NEUMÁTICOS, PRESIONES Y MATERIAL TÉCNICO
   ============================================================ */

const __v024_renderMaterial_base = renderMaterialTab;
renderMaterialTab = function() {
  const base = __v024_renderMaterial_base();
  return `${base}<section class="panel"><h2>Neumáticos, presión y configuración técnica</h2><p class="muted">La presión se interpreta en bar. Pavé, lluvia, peso y anchura alteran agarre, resistencia y riesgo de pinchazo.</p><div class="preset-row"><button class="secondary" onclick="applyTirePresetV024('road')">Carretera rápida</button><button class="secondary" onclick="applyTirePresetV024('mountain')">Montaña</button><button class="secondary" onclick="applyTirePresetV024('wet')">Lluvia</button><button class="secondary" onclick="applyTirePresetV024('cobbles')">Pavé</button></div><div class="technical-grid">${getTeamRiders(Game.selectedTeamId).map(renderTechnicalCardV024).join("")}</div></section>`;
};

function renderTechnicalCardV024(r) {
  const t = getTechnicalV024(r);
  return `<div class="technical-card"><div class="badge-row"><span class="badge green">${esc(r.role)}</span><span class="badge blue">${r.weightKg} kg</span><span class="badge">Riesgo ${Math.round(tireRiskScoreV024(r, getStage()) * 100)}%</span></div><h3>${esc(r.name)}</h3>
    <label>Anchura<select onchange="setTechnicalV024('${r.id}','tireWidth',this.value)">${TIRE_WIDTHS_V024.map(x => `<option value="${x.id}" ${t.tireWidth === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    <label>Sistema<select onchange="setTechnicalV024('${r.id}','tireSystem',this.value)">${TIRE_SYSTEMS_V024.map(x => `<option value="${x.id}" ${t.tireSystem === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    <label>Compuesto<select onchange="setTechnicalV024('${r.id}','compound',this.value)">${TIRE_COMPOUNDS_V024.map(x => `<option value="${x.id}" ${t.compound === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    <label>Protección<select onchange="setTechnicalV024('${r.id}','protection',this.value)">${TIRE_PROTECTION_V024.map(x => `<option value="${x.id}" ${t.protection === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
    <label>Presión delantera ${Number(t.pressureFront).toFixed(1)} bar<input type="range" min="3.0" max="6.5" step="0.1" value="${t.pressureFront}" onchange="setTechnicalV024('${r.id}','pressureFront',this.value)"></label>
    <label>Presión trasera ${Number(t.pressureRear).toFixed(1)} bar<input type="range" min="3.2" max="7.0" step="0.1" value="${t.pressureRear}" onchange="setTechnicalV024('${r.id}','pressureRear',this.value)"></label>
    <label>Descenso<select onchange="setTechnicalV024('${r.id}','descentMode',this.value)">${DESCENT_MODES_V024.map(x => `<option value="${x.id}" ${t.descentMode === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>
  </div>`;
}

function setTechnicalV024(id, key, value) {
  const t = getTechnicalV024(id);
  t[key] = ["pressureFront", "pressureRear"].includes(key) ? Number(value) : value;
  renderRace();
}

function applyTirePresetV024(type) {
  getTeamRiders(Game.selectedTeamId).forEach(r => {
    const t = getTechnicalV024(r);
    if (type === "road") Object.assign(t, { tireWidth: "30", pressureFront: 4.7, pressureRear: 4.9, compound: "fast", protection: "standard", tireSystem: "tubeless" });
    if (type === "mountain") Object.assign(t, { tireWidth: "28", pressureFront: 4.8, pressureRear: 5.0, compound: "balanced", protection: "light", tireSystem: "tubeless" });
    if (type === "wet") Object.assign(t, { tireWidth: "32", pressureFront: 3.8, pressureRear: 4.0, compound: "wet", protection: "reinforced", tireSystem: "tubeless" });
    if (type === "cobbles") Object.assign(t, { tireWidth: "34", pressureFront: 3.4, pressureRear: 3.6, compound: "cobbles", protection: "insert", tireSystem: "tubeless" });
  });
  renderRace();
}

function tireFactorsV024(r, stage, km) {
  const t = getTechnicalV024(r);
  const width = byId(TIRE_WIDTHS_V024, t.tireWidth) || TIRE_WIDTHS_V024[1];
  const system = byId(TIRE_SYSTEMS_V024, t.tireSystem) || TIRE_SYSTEMS_V024[0];
  const compound = byId(TIRE_COMPOUNDS_V024, t.compound) || TIRE_COMPOUNDS_V024[1];
  const protection = byId(TIRE_PROTECTION_V024, t.protection) || TIRE_PROTECTION_V024[1];
  const onPave = paveAtKmV024(stage, km);
  const wet = toNum(stage.weather?.roadWet, 0) / 100;
  const idealFront = onPave ? 3.5 + (r.weightKg - 65) * .025 : wet > .55 ? 3.9 + (r.weightKg - 65) * .028 : 4.5 + (r.weightKg - 65) * .032;
  const idealRear = idealFront + .22;
  const pressurePenalty = Math.abs(t.pressureFront - idealFront) * .025 + Math.abs(t.pressureRear - idealRear) * .022;
  const rolling = width.rolling * system.rolling * compound.rolling * protection.rolling * (1 - pressurePenalty);
  const grip = width.grip * compound.grip * (wet > .4 ? compound.wet : 1) * clamp(1 - pressurePenalty * .5, .75, 1.02);
  const puncture = width.puncture * system.puncture * protection.puncture * (onPave ? 1 + onPave.severity * .17 : 1);
  return { rolling, grip, puncture, comfort: width.comfort, aero: width.aero, onPave };
}

function tireRiskScoreV024(r, stage) {
  const factors = tireFactorsV024(r, stage, stage.paves?.[0]?.from || 0);
  return clamp(.015 * factors.puncture + toNum(stage.weather?.roadWet, 0) / 1800, .004, .18);
}

function paveAtKmV024(stage, km) {
  return (stage.paves || []).find(p => km >= p.from && km <= p.to) || null;
}

/* ============================================================
   7. MOTOR FÍSICO CP/W′ POR PENDIENTE
   ============================================================ */

function slopeAtKmV024(stage, km) {
  const pts = stage.profilePoints?.length ? stage.profilePoints : generateEnhancedProfilePointsV019(stage);
  const idx = clamp(Math.round(km), 1, pts.length - 1);
  const p = pts[idx], prev = pts[idx - 1];
  if (Number.isFinite(p.gradient)) return p.gradient;
  return ((toNum(p.alt, 0) - toNum(prev.alt, 0)) / Math.max(.1, toNum(p.km, idx) - toNum(prev.km, idx - 1))) / 10;
}

function solveSpeedPhysicsV024(powerW, massKg, gradientPct, cda = .30, crr = .004, windKmh = 0, rho = 1.18) {
  const g = 9.80665;
  const grade = gradientPct / 100;
  const wind = windKmh / 3.6;
  const drivetrain = .975;
  let lo = .8, hi = 35;
  for (let i = 0; i < 38; i++) {
    const v = (lo + hi) / 2;
    const airV = Math.max(.2, v + wind);
    const forceGravity = massKg * g * grade;
    const forceRolling = massKg * g * crr;
    const forceAero = .5 * rho * cda * airV * airV;
    const required = Math.max(0, (forceGravity + forceRolling + forceAero) * v / drivetrain);
    if (required > powerW) hi = v; else lo = v;
  }
  return clamp(((lo + hi) / 2) * 3.6, 3, gradientPct < -5 ? 105 : 78);
}

function formationByIdV024(id) { return byId(GROUP_FORMATIONS_V024, id) || GROUP_FORMATIONS_V024[3]; }

function targetPowerV024(r, st, stage, km, effort, order, groupSize = 1) {
  const phys = getPhysiologyV024(r);
  const technical = getTechnicalV024(r);
  const formation = formationByIdV024(st.formation || technical.formation);
  const grade = slopeAtKmV024(stage, km);
  const formFactor = 1 + formModifierV024(r, getRace());
  const fatigueFactor = clamp(1 - toNum(r.fatigue, 0) * .0026 - toNum(st.fatigueGain, 0) * .0018, .70, 1.04);
  const energyFactor = clamp(.70 + toNum(st.energy, 75) / 330, .72, 1.05);
  let intensity = .60 + effort * .0048;
  if (order.id === "sit") intensity -= .06;
  if (order.id === "protect") intensity += .015;
  if (order.id === "pull") intensity += .055;
  if (order.id === "catch") intensity += .085;
  if (order.id === "tempo") intensity += .07;
  if (order.id === "attack") intensity += .22;
  if (order.id === "bridge") intensity += .16;
  if (order.id === "sprint_train") intensity += .07;
  if (grade > 7 && ["gc", "co", "climber"].includes(r.roleKey)) intensity += .025;
  if (grade > 6 && r.roleKey === "sprinter") intensity -= .025;
  if (st.groupId === "autobus") intensity = clamp(intensity, .72, .92);
  const groupSaving = groupSize > 1 ? (1 - formation.draft) * .12 : 0;
  let power = phys.cp * (intensity - groupSaving) * formFactor * fatigueFactor * energyFactor;
  const availableWPrime = Number.isFinite(st.wPrime) ? st.wPrime : phys.wPrimeMax;
  if (power > phys.cp) {
    const sustainableAboveCp = availableWPrime / 120;
    power = Math.min(power, phys.cp + sustainableAboveCp);
    if (availableWPrime <= 250) power = Math.min(power, phys.cp * .985);
  }
  return clamp(power, phys.cp * .48, phys.cp * 1.58);
}

function updateWPrimeV024(r, st, powerW, durationSec) {
  const phys = getPhysiologyV024(r);
  st.wPrimeMax = st.wPrimeMax || phys.wPrimeMax;
  st.wPrime = Number.isFinite(st.wPrime) ? st.wPrime : st.wPrimeMax;
  if (powerW > phys.cp) {
    st.wPrime = Math.max(0, st.wPrime - (powerW - phys.cp) * durationSec);
  } else {
    const below = clamp((phys.cp - powerW) / phys.cp, 0, .65);
    const formation = formationByIdV024(st.formation || "middle");
    const groupRecovery = st.groupId && !String(st.groupId).startsWith("attack") ? 1 + (1 - formation.draft) * 1.5 : .72;
    const descentBonus = st.currentGradient < -2 ? 1.45 : 1;
    const recoveryRate = (6 + below * 28) * groupRecovery * descentBonus * phys.durability;
    st.wPrime = Math.min(st.wPrimeMax, st.wPrime + recoveryRate * durationSec);
  }
  st.wPrimeMin = Math.min(toNum(st.wPrimeMin, st.wPrime), st.wPrime);
}

function cdaForRiderV024(r, st, stage, km, groupSize) {
  const eq = Game.riderEquipment[r.id] || autoEquipmentForStage(r.teamId, stage);
  const frame = getFrame(eq.frame);
  const wheels = getWheels(eq.wheels);
  const technical = getTechnicalV024(r);
  const formation = formationByIdV024(st.formation || technical.formation);
  const tire = tireFactorsV024(r, stage, km);
  const base = ["tt", "rouleur"].includes(r.roleKey) ? .285 : r.roleKey === "sprinter" ? .315 : .300;
  const equipment = clamp(1 - ((frame.aero + wheels.aero) / 2 - 90) * .003, .88, 1.05);
  const drafting = groupSize > 1 && !isTT(stage) ? formation.draft : 1;
  return clamp(base * equipment * drafting / tire.aero, .18, .40);
}

function crrForRiderV024(r, stage, km) {
  const tire = tireFactorsV024(r, stage, km);
  let crr = .0042 / clamp(tire.rolling, .72, 1.18);
  if (tire.onPave) crr *= 1.65 + tire.onPave.severity * .15;
  if (stage.weather?.roadWet > 55) crr *= 1.05;
  return clamp(crr, .0031, .012);
}

function effectiveWindV024(stage, km, st) {
  const wind = toNum(stage.weather?.wind, 0);
  const cross = toNum(stage.weather?.crosswind, 0);
  const routeAngle = Math.sin((km + stage.number * 9) * .16);
  const headComponent = wind * routeAngle * .45;
  const formation = formationByIdV024(st.formation || "middle");
  return headComponent + cross * .08 * formation.risk;
}

function riderSpeedCapacityV024(r, st, stage, km, effort, order, groupSize) {
  const grade = slopeAtKmV024(stage, km);
  st.currentGradient = grade;
  const power = targetPowerV024(r, st, stage, km, effort, order, groupSize);
  const totalMass = r.weightKg + 8.2;
  const cda = cdaForRiderV024(r, st, stage, km, groupSize);
  const crr = crrForRiderV024(r, stage, km);
  const wind = effectiveWindV024(stage, km, st);
  let speed = solveSpeedPhysicsV024(power, totalMass, grade, cda, crr, wind);
  const descent = byId(DESCENT_MODES_V024, getTechnicalV024(r).descentMode) || DESCENT_MODES_V024[1];
  if (grade < -3) {
    const skill = toNum(r.stats.downhill, 70) / 100;
    speed *= 1 + descent.speedBonus * (.65 + skill * .45);
  }
  const tire = tireFactorsV024(r, stage, km);
  if (tire.onPave) speed *= clamp(.89 + tire.comfort * .07 + toNum(r.stats.cobbles, 70) * .0008, .84, 1.02);
  return { speed: clamp(speed, 4, 105), power, grade };
}

function groupCollaborationV024(groupId, riders, stage, km) {
  if (!riders.length) return 0;
  if (groupId === "breakaway") return clamp(toNum(Game.live.breakaway?.collaboration, 62), 15, 96);
  if (groupId === "favorites") return slopeAtKmV024(stage, km) > 5 ? 72 : 48;
  if (groupId === "autobus") return 74;
  if (String(groupId).startsWith("echelon")) return 78;
  const pulls = riders.filter(r => ["pull", "catch", "tempo", "sprint_train"].includes(Game.riderOrders[r.id] || r.defaultOrder)).length;
  return clamp(42 + pulls / Math.max(1, riders.length) * 52 + aiTeamsPullingV024(stage, km) * 2, 28, 92);
}

function aiTeamsPullingV024(stage, km) {
  let count = 0;
  TEAMS.forEach(team => {
    if (team.id === Game.selectedTeamId) return;
    const roster = getTeamRiders(team.id);
    if (roster.some(r => ["pull", "catch", "tempo", "sprint_train"].includes(Game.riderOrders[r.id]))) count++;
  });
  return count;
}

/* ============================================================
   8. INICIO LIVE, FORMACIONES Y CONTROLES TÁCTICOS
   ============================================================ */

const __v024_startLive_base = startLiveStage;
startLiveStage = function(renderNow = true) {
  ensureV024State();
  applyRaceOperationsBeforeStartV024();
  __v024_startLive_base(false);
  enrichLiveStateV024();
  applyAdvancedRivalAIv024(getStage(), getStage().sectors[0], true);
  if (renderNow) renderLive();
};

function applyRaceOperationsBeforeStartV024() {
  if (!Game.selectedTeamId) return;
  ensureRaceOperationsV024(Game.selectedTeamId, Game.selectedRaceId);
  const settings = Game.v024.logistics[Game.selectedTeamId][Game.selectedRaceId];
  if (!settings.paid || settings.applied) return;
  const plan = byId(LOGISTICS_PLANS_V024, settings.planId) || LOGISTICS_PLANS_V024[1];
  const arrival = byId(ARRIVAL_OPTIONS_V024, settings.arrivalId) || ARRIVAL_OPTIONS_V024[1];
  getTeamRiders(Game.selectedTeamId, true).forEach(r => {
    r.fatigue = clamp(r.fatigue - plan.recovery - arrival.adaptation * .5, 0, 100);
    r.morale = clamp(toNum(r.morale, 70) + plan.morale + arrival.adaptation * .3, 20, 100);
  });
  settings.applied = true;
}

function enrichLiveStateV024() {
  const stage = getStage();
  Game.live.v024 = {
    timeline: [],
    attackQueue: [],
    activeAttacks: [],
    echelons: [],
    bus: { active: false, timeCutEstimate: 0, margin: 0 },
    kilometer: 0,
    alerts: [],
    groupHistory: [],
    weatherHistory: [],
    camera: Game.v024.broadcast.camera || "auto"
  };
  getRaceRiders().forEach(r => {
    const st = Game.live.states[r.id];
    const phys = getPhysiologyV024(r);
    const tech = getTechnicalV024(r);
    st.wPrimeMax = phys.wPrimeMax;
    st.wPrime = phys.wPrimeMax;
    st.wPrimeMin = phys.wPrimeMax;
    st.powerSum = 0;
    st.powerSqSum = 0;
    st.powerSamples = 0;
    st.maxPower = 0;
    st.timePulling = 0;
    st.timeDrafting = 0;
    st.choGrams = 0;
    st.fluidMl = 0;
    st.lastFeedElapsed = 0;
    st.attacks = 0;
    st.responses = 0;
    st.soloKm = 0;
    st.maxSpeed = 0;
    st.formation = tech.formation || (r.id === Game.protectedRiderId ? "protected" : "middle");
    st.positionIndex = Math.round(rnd(1, 150));
    st.descentMode = tech.descentMode;
    st.currentGradient = 0;
    st.telemetry = [];
  });
  logRaceEventV024("Salida", "Comienza la etapa con motor físico CP/W′ por pendiente.", "info");
  if (stage.weather?.crosswind > 35) triggerAlertV024("crosswind", `Viento lateral ${stage.weather.crosswind} km/h: riesgo de abanicos.`);
}

function setFormationV024(riderId, formationId, live = true) {
  const tech = getTechnicalV024(riderId);
  tech.formation = formationId;
  if (Game.live?.states?.[riderId]) Game.live.states[riderId].formation = formationId;
  live && Game.live ? renderLive() : renderRace();
}

function queueAttackV024(riderId, attackTypeId) {
  if (!Game.live) return toast("Inicia la etapa por sectores");
  const r = getRider(riderId), type = byId(ATTACK_TYPES_V024, attackTypeId) || ATTACK_TYPES_V024[1];
  const st = Game.live.states[riderId];
  if (!r || !st) return;
  if (st.wPrime < st.wPrimeMax * .18) return toast("Reserva W′ insuficiente");
  Game.live.v024.attackQueue.push({ riderId, attackTypeId: type.id, source: "user", km: st.km });
  addRadio(`${r.name}: orden de ${type.name.toLowerCase()}.`);
  renderLive();
}

function setResponseModeV024(mode) { Game.v024.livePlan.responseMode = mode; Game.live ? renderLive() : renderRace(); }
function setLongRangePlanV024(plan) { Game.v024.livePlan.longRangePlan = plan; Game.live ? renderLive() : renderRace(); }
function setLongRangeRiderV024(key, id) { Game.v024.livePlan[key] = id; Game.live ? renderLive() : renderRace(); }

function renderAdvancedTacticsV024(live) {
  const riders = getTeamRiders(Game.selectedTeamId);
  const leader = getRider(Game.protectedRiderId) || riders[0];
  const plan = Game.v024.livePlan;
  return `<div class="advanced-tactics">
    <h2>Formación, ataques y respuestas</h2>
    <div class="advanced-control-grid">
      <div class="manager-card"><h3>Respuesta del líder</h3><select onchange="setResponseModeV024(this.value)">${RESPONSE_MODES_V024.map(m => `<option value="${m.id}" ${plan.responseMode === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select><p class="muted small">${esc((byId(RESPONSE_MODES_V024, plan.responseMode) || RESPONSE_MODES_V024[1]).description)}</p></div>
      <div class="manager-card"><h3>Plan de largo alcance</h3><select onchange="setLongRangePlanV024(this.value)">${LONG_RANGE_PLANS_V024.map(m => `<option value="${m.id}" ${plan.longRangePlan === m.id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select><label>Corredor satélite<select onchange="setLongRangeRiderV024('satelliteRiderId',this.value)"><option value="">Sin asignar</option>${riders.filter(r => r.id !== leader?.id).map(r => `<option value="${r.id}" ${plan.satelliteRiderId === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label><label>Corredor puente<select onchange="setLongRangeRiderV024('bridgeRiderId',this.value)"><option value="">Sin asignar</option>${riders.map(r => `<option value="${r.id}" ${plan.bridgeRiderId === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label></div>
    </div>
    <div class="attack-buttons">${riders.map(r => `<div class="attack-row"><strong>${esc(r.name)}</strong><span>W′ ${live && Game.live ? Math.round(Game.live.states[r.id].wPrime / 1000) : Math.round(getPhysiologyV024(r).wPrimeMax / 1000)} kJ</span><select id="attack_${r.id}">${ATTACK_TYPES_V024.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select><button class="secondary" ${!live ? "disabled" : ""} onclick="queueAttackV024('${r.id}',document.getElementById('attack_${r.id}').value)">Lanzar</button></div>`).join("")}</div>
    <h3>Posición dentro del grupo</h3><div class="formation-grid">${riders.map(r => { const st = live && Game.live ? Game.live.states[r.id] : null; const current = st?.formation || getTechnicalV024(r).formation; return `<label><b>${esc(r.name)}</b><select onchange="setFormationV024('${r.id}',this.value,${live})">${GROUP_FORMATIONS_V024.map(f => `<option value="${f.id}" ${current === f.id ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select></label>`; }).join("")}</div>
  </div>`;
}

const __v024_renderStrategy_base = renderStrategyTab;
renderStrategyTab = function(live = false, embedded = false) {
  const base = __v024_renderStrategy_base(live, embedded);
  if (embedded) return `${base}${renderAdvancedTacticsV024(live)}`;
  return `${base}${renderAdvancedTacticsV024(live)}`;
};

/* ============================================================
   9. IA AVANZADA DE DIRECTORES RIVALES
   ============================================================ */

function applyAdvancedRivalAIv024(stage, sector, preStart = false) {
  const remaining = Math.max(0, stage.distance - toNum(sector?.from, 0));
  const gap = toNum(Game.live?.breakaway?.gap, 0);
  TEAMS.forEach(team => {
    if (team.id === Game.selectedTeamId) return;
    const roster = getTeamRiders(team.id);
    const gc = roster.filter(r => ["gc", "co"].includes(r.roleKey)).sort((a, b) => b.base - a.base)[0];
    const sprinter = roster.filter(r => r.roleKey === "sprinter").sort((a, b) => b.stats.sprint - a.stats.sprint)[0];
    const workers = roster.filter(r => ["domestique", "rouleur", "tt", "classics"].includes(r.roleKey));
    const climbers = roster.filter(r => ["climber", "puncheur"].includes(r.roleKey));
    const profile = team.ai || {};
    const teamState = Game.aiMemory[team.id] ||= { aggression: 0, pulls: 0, attacks: 0, lastAction: "neutral" };

    roster.forEach(r => {
      Game.riderOrders[r.id] ||= r.defaultOrder;
      Game.riderEfforts[r.id] ||= r.defaultEffort;
      if (Game.live?.states?.[r.id]) Game.live.states[r.id].formation ||= ["gc", "co", "sprinter"].includes(r.roleKey) ? "protected" : "middle";
    });

    if (isTT(stage)) {
      roster.forEach(r => { Game.riderOrders[r.id] = "pull"; Game.riderEfforts[r.id] = ["tt", "gc", "co"].includes(r.roleKey) ? 88 : 76; });
      return;
    }
    if (isTTT(stage)) {
      roster.forEach(r => { Game.riderOrders[r.id] = "pull"; Game.riderEfforts[r.id] = 82 + Math.round(toNum(profile.control, 60) / 16); });
      return;
    }

    const finalSector = sector?.type === "final" || remaining < 25;
    const mountainDecisive = stage.type === "mountain" && ["climb", "final"].includes(sector?.type);
    const sprintInterest = stage.type === "flat" && sprinter && toNum(profile.sprint, 50) > 65;
    const breakDanger = gap > 150 && remaining < 75;
    const crosswind = stage.weather?.crosswind > 38 && ["flat", "hilly"].includes(stage.type);

    workers.forEach(r => {
      if (breakDanger || sprintInterest && remaining < 80) {
        Game.riderOrders[r.id] = gap > 240 ? "catch" : "pull";
        Game.riderEfforts[r.id] = clamp(72 + toNum(profile.control, 55) * .16, 74, 91);
        if (Game.live?.states?.[r.id]) Game.live.states[r.id].formation = "rotation";
      } else if (crosswind) {
        Game.riderOrders[r.id] = "pull";
        Game.riderEfforts[r.id] = clamp(76 + toNum(profile.classics, 55) * .12, 76, 91);
        if (Game.live?.states?.[r.id]) Game.live.states[r.id].formation = "front";
      } else {
        Game.riderOrders[r.id] = gc ? "protect" : "hold";
        Game.riderEfforts[r.id] = 62;
      }
    });

    if (gc) {
      Game.riderOrders[gc.id] = "hold";
      Game.riderEfforts[gc.id] = mountainDecisive ? 82 : 66;
      if (Game.live?.states?.[gc.id]) Game.live.states[gc.id].formation = "protected";
      const attackProbability = mountainDecisive && finalSector ? (toNum(profile.gc, 60) + toNum(profile.aggression, 60)) / 240 : 0;
      if (Game.live && Math.random() < attackProbability && Game.live.states[gc.id].wPrime > Game.live.states[gc.id].wPrimeMax * .38) {
        Game.live.v024.attackQueue.push({ riderId: gc.id, attackTypeId: remaining < 8 ? "all_in" : "hard", source: "ai", km: Game.live.states[gc.id].km });
        teamState.attacks++;
        teamState.lastAction = "gc_attack";
      }
    }

    climbers.forEach(r => {
      if (mountainDecisive) {
        Game.riderOrders[r.id] = "tempo";
        Game.riderEfforts[r.id] = 78 + Math.round(toNum(profile.gc, 60) / 20);
        if (Game.live?.states?.[r.id]) Game.live.states[r.id].formation = "front";
      } else if (preStart && toNum(profile.breakaway, 50) > 75 && Math.random() < .25) {
        Game.riderOrders[r.id] = "attack";
        Game.riderEfforts[r.id] = 84;
      }
    });

    if (sprinter) {
      Game.riderOrders[sprinter.id] = finalSector && stage.type === "flat" ? "hold" : "sit";
      Game.riderEfforts[sprinter.id] = finalSector && stage.type === "flat" ? 93 : 54;
      if (Game.live?.states?.[sprinter.id]) Game.live.states[sprinter.id].formation = finalSector ? "front" : "protected";
    }
  });
}

function aiResponseToAttackV024(attacker, attack, stage, km) {
  const attackerTeam = attacker.teamId;
  const attackerDanger = ["gc", "co"].includes(attacker.roleKey) || attacker.totalTime < getGC()[Math.min(15, getGC().length - 1)]?.totalTime;
  if (!attackerDanger) return;
  TEAMS.forEach(team => {
    if (team.id === attackerTeam) return;
    const leader = getTeamRiders(team.id).filter(r => ["gc", "co"].includes(r.roleKey)).sort((a, b) => a.totalTime - b.totalTime || b.base - a.base)[0];
    if (!leader || !Game.live.states[leader.id]) return;
    const st = Game.live.states[leader.id];
    if (st.wPrime < st.wPrimeMax * .16) return;
    const profile = team.ai || {};
    const mode = toNum(profile.gc, 50) > 82 ? "instant" : toNum(profile.control, 50) > 70 ? "progressive" : "tempo";
    executeResponseV024(leader, mode, attacker, attack, stage, km, "ai");
  });

  const userLeader = getRider(Game.protectedRiderId);
  if (userLeader && userLeader.teamId !== attackerTeam) {
    executeResponseV024(userLeader, Game.v024.livePlan.responseMode, attacker, attack, stage, km, "user_auto");
  }
}

function executeResponseV024(responder, modeId, attacker, attack, stage, km, source) {
  const mode = byId(RESPONSE_MODES_V024, modeId) || RESPONSE_MODES_V024[1];
  const st = Game.live.states[responder.id]; if (!st) return;
  const phys = getPhysiologyV024(responder);
  const cost = Math.max(0, phys.cp * (mode.powerFactor - 1) * attack.durationSec * mode.wPrimeFactor);
  if (st.wPrime < cost * .45 && mode.id !== "let_go") return;
  st.wPrime = Math.max(0, st.wPrime - cost);
  st.responses++;
  if (mode.id === "let_go") return;
  st.groupId = `attack_${attacker.id}`;
  st.group = "Ataque";
  st.elapsed += mode.delaySec;
  if (source === "user_auto") addRadio(`${responder.name} ${mode.name.toLowerCase()} al ataque de ${attacker.name}.`);
  logRaceEventV024("Respuesta", `${responder.name}: ${mode.name} al movimiento de ${attacker.name}.`, mode.id === "instant" ? "danger" : "info");
}

/* ============================================================
   10. SIMULACIÓN AVANZADA POR KILÓMETRO Y GRUPOS
   ============================================================ */

const __v024_processSector_base = processSector;
processSector = function(renderNow) {
  const stage = getStage();
  const sector = stage.sectors[Game.live.sectorIndex];
  applyAdvancedRivalAIv024(stage, sector, false);
  autoFeed(sector);
  checkSectorAlertsV024(stage, sector);

  if (isTT(stage)) simulateTTSectorV024(stage, sector);
  else if (isTTT(stage)) simulateTTTSectorV024(stage, sector);
  else simulateRoadSectorV024(stage, sector);

  captureSectorSnapshotV024(stage, sector);
  Game.live.sectorIndex++;
  if (Game.live.sectorIndex >= stage.sectors.length) {
    finishStage(renderNow);
    return;
  }
  addRadio(`Entramos en ${stage.sectors[Game.live.sectorIndex].name}.`);
  if (renderNow) renderLive();
};

function simulateRoadSectorV024(stage, sector) {
  const startKm = Math.floor(sector.from);
  const endKm = Math.ceil(sector.to);
  for (let km = startKm; km < endKm; km++) {
    const distance = Math.min(1, sector.to - km);
    if (distance <= 0) continue;
    Game.live.v024.kilometer = km;
    processAttackQueueV024(stage, km);
    applyLongRangePlanV024(stage, km);
    updateEchelonsV024(stage, km);
    simulateRoadKilometerV024(stage, sector, km, distance);
    updateAutobusV024(stage, km, distance);
    autoNutritionAtKmV024(stage, km);
    evaluateLiveAlertsV024(stage, km);
  }
  updateBreakawayGapFromTimesV024();
  applyRaceGroupSelection(stage, sector);
}

function simulateRoadKilometerV024(stage, sector, km, distance) {
  const active = getRaceRiders().filter(r => Game.live.states[r.id]);
  const groups = {};
  active.forEach(r => {
    const st = Game.live.states[r.id];
    const id = st.groupId || "peloton";
    (groups[id] ||= []).push(r);
  });

  const groupResults = {};
  Object.entries(groups).forEach(([groupId, riders]) => {
    const collaboration = groupCollaborationV024(groupId, riders, stage, km);
    const capacities = riders.map(r => {
      const st = Game.live.states[r.id];
      const order = getOrder(Game.riderOrders[r.id] || r.defaultOrder);
      const effort = Game.riderEfforts[r.id] ?? r.defaultEffort;
      const cap = riderSpeedCapacityV024(r, st, stage, km, effort, order, riders.length);
      return { r, st, order, effort, ...cap };
    });

    capacities.sort((a, b) => b.speed - a.speed);
    const contributors = capacities.filter(x => ["rotation", "front"].includes(x.st.formation) || ["pull", "catch", "tempo", "sprint_train"].includes(x.order.id));
    const topPool = (contributors.length >= 2 ? contributors : capacities).slice(0, Math.max(2, Math.ceil(riders.length * .35)));
    const weightedSpeed = avg(topPool.map(x => x.speed)) * (.94 + collaboration / 1000);
    const groupSpeed = clamp(weightedSpeed, 5, 100);
    const groupTime = distance / groupSpeed * 3600;
    groupResults[groupId] = { groupSpeed, groupTime, collaboration, capacities };
  });

  Object.entries(groupResults).forEach(([groupId, result]) => {
    const { groupSpeed, groupTime, collaboration, capacities } = result;
    capacities.forEach(x => {
      const { r, st, order, effort, speed, power, grade } = x;
      const formation = formationByIdV024(st.formation || "middle");
      const deficit = (groupSpeed - speed) / Math.max(1, groupSpeed);
      let personalLoss = 0;
      const isAttackGroup = String(groupId).startsWith("attack");
      const isBreak = groupId === "breakaway";
      const dropThreshold = grade > 6 ? .075 : paveAtKmV024(stage, km) ? .085 : .105;

      if (deficit > dropThreshold && !isAttackGroup) {
        personalLoss = groupTime * clamp(deficit * 1.6, .02, .35);
        if (deficit > dropThreshold * 1.7 || st.energy < 15) {
          st.groupId = grade > 4 && ["sprinter", "rouleur", "classics"].includes(r.roleKey) ? "autobus" : "dropped";
          st.group = st.groupId === "autobus" ? "Autobús" : "Cortados";
          st.formation = "struggling";
        }
      }

      if (isAttackGroup && st.wPrime <= 0) {
        st.groupId = "favorites";
        st.group = "Grupo favoritos";
        personalLoss += 8;
      }

      const elapsed = groupTime + personalLoss;
      st.elapsed += elapsed;
      st.raceTime += elapsed;
      st.km = Math.min(stage.distance, toNum(st.km, km) + distance);
      st.speed = distance / Math.max(.001, elapsed / 3600);
      st.maxSpeed = Math.max(st.maxSpeed, st.speed);
      st.wkg = power / r.weightKg;
      st.powerSum += power;
      st.powerSqSum += power * power;
      st.powerSamples++;
      st.maxPower = Math.max(st.maxPower, power);
      if (["front", "rotation"].includes(st.formation)) st.timePulling += elapsed;
      else st.timeDrafting += elapsed;
      if (isAttackGroup && capacities.length === 1) st.soloKm += distance;
      updateWPrimeV024(r, st, power, elapsed);
      updateEnergyHydrationPhysicalV024(r, st, stage, km, power, elapsed, order, collaboration);
      handleTerrainRiskV024(r, st, stage, km, elapsed, formation);
      appendRiderTelemetryV024(r, st, km, grade, power, st.speed);
    });
  });

  maintainGroupCohesionV024(stage, km);
}

function updateEnergyHydrationPhysicalV024(r, st, stage, km, power, elapsedSec, order, collaboration) {
  const phys = getPhysiologyV024(r);
  const kj = power * elapsedSec / 1000;
  const efficiencyCost = kj / Math.max(1, phys.cp * .18);
  const draftingSave = collaboration > 60 && !["front", "rotation"].includes(st.formation) ? .82 : 1;
  st.energy = clamp(st.energy - efficiencyCost * .28 * draftingSave, 0, 118);
  const temp = toNum(stage.weather?.temp, 20);
  const heat = Math.max(0, temp - 20) * .012 * (1 - phys.heatAcclimation / 180);
  st.hydration = clamp(st.hydration - elapsedSec / 3600 * (5.5 + heat * 10), 0, 125);
  st.stomach = clamp(st.stomach - elapsedSec / 3600 * 5, 0, 100);
  st.fatigueGain += elapsedSec / 3600 * (power / phys.cp) * .65;
}

function handleTerrainRiskV024(r, st, stage, km, elapsed, formation) {
  const grade = st.currentGradient;
  const tech = getTechnicalV024(r);
  const tire = tireFactorsV024(r, stage, km);
  let risk = .00008 * elapsed;
  if (tire.onPave) risk *= 1.6 + tire.onPave.severity * .28;
  if (stage.weather?.roadWet > 55) risk *= 1.55;
  risk *= formation.risk;
  risk *= tire.puncture;

  if (grade < -3) {
    const descent = byId(DESCENT_MODES_V024, tech.descentMode) || DESCENT_MODES_V024[1];
    const skillReduction = clamp(1 - toNum(r.stats.downhill, 70) / 170, .35, .75);
    risk *= descent.risk * skillReduction * (1 + Math.abs(grade) * .06);
  }

  if (Math.random() < clamp(risk, 0, .11)) {
    const puncture = tire.onPave && Math.random() < .58;
    const loss = puncture ? rnd(25, 100) : rnd(45, 180);
    st.elapsed += loss;
    st.raceTime += loss;
    st.incident = puncture ? "Pinchazo" : "Caída / salida de trazada";
    st.groupId = "dropped";
    st.group = "Cortados";
    logRaceEventV024(puncture ? "Pinchazo" : "Caída", `${r.name} pierde ${seconds(loss)} en el km ${km}.`, "danger");
    if (r.teamId === Game.selectedTeamId) addRadio(`${r.name}: ${st.incident}, pérdida ${seconds(loss)}.`);
  }
}

function maintainGroupCohesionV024(stage, km) {
  const riders = getRaceRiders().filter(r => Game.live.states[r.id]);
  const fastest = Math.min(...riders.map(r => Game.live.states[r.id].elapsed));
  riders.forEach(r => {
    const st = Game.live.states[r.id];
    const delta = st.elapsed - fastest;
    if (st.groupId === "breakaway" || String(st.groupId).startsWith("attack") || st.groupId === "autobus") return;
    if (delta <= 20) { st.groupId = slopeAtKmV024(stage, km) > 4 ? "favorites" : "peloton"; }
    else if (delta <= 90) st.groupId = "peloton";
    else if (delta <= 260) st.groupId = "group2";
    else st.groupId = "dropped";
  });
}

function processAttackQueueV024(stage, km) {
  const queue = Game.live.v024.attackQueue.splice(0);
  queue.forEach(item => {
    const attacker = getRider(item.riderId), st = Game.live.states[item.riderId];
    const attack = byId(ATTACK_TYPES_V024, item.attackTypeId) || ATTACK_TYPES_V024[1];
    if (!attacker || !st || st.wPrime <= st.wPrimeMax * .08) return;
    const phys = getPhysiologyV024(attacker);
    const cost = Math.max(1000, (phys.cp * (attack.powerFactor - 1) * attack.durationSec) * attack.wPrimeCost);
    if (st.wPrime < cost * .55) return;
    st.wPrime = Math.max(0, st.wPrime - cost);
    st.groupId = `attack_${attacker.id}`;
    st.group = "Ataque";
    st.formation = "front";
    st.elapsed = Math.max(0, st.elapsed - attack.gapPotential);
    st.attacks++;
    Game.live.v024.activeAttacks.push({ riderId: attacker.id, typeId: attack.id, startKm: km, remainingKm: Math.max(1, attack.durationSec / 90), source: item.source });
    logRaceEventV024("Ataque", `${attacker.name} lanza ${attack.name.toLowerCase()} en el km ${km}.`, "danger");
    if (item.source === "ai") triggerAlertV024("rival_attack", `${attacker.name} ataca en el km ${km}.`);
    aiResponseToAttackV024(attacker, attack, stage, km);
  });

  Game.live.v024.activeAttacks.forEach(a => a.remainingKm--);
  Game.live.v024.activeAttacks = Game.live.v024.activeAttacks.filter(a => {
    if (a.remainingKm > 0) return true;
    const st = Game.live.states[a.riderId];
    if (st && String(st.groupId).startsWith("attack")) st.groupId = "favorites";
    return false;
  });
}

function applyLongRangePlanV024(stage, km) {
  const plan = Game.v024.livePlan;
  if (plan.longRangePlan === "satellite" && plan.satelliteRiderId) {
    const st = Game.live.states[plan.satelliteRiderId];
    if (st && km < stage.distance * .45 && st.groupId !== "breakaway" && st.wPrime > st.wPrimeMax * .45 && Math.random() < .10) {
      st.groupId = "breakaway"; st.group = "Fuga";
      if (!Game.live.breakaway.ids.includes(plan.satelliteRiderId)) Game.live.breakaway.ids.push(plan.satelliteRiderId);
      logRaceEventV024("Táctica", `${getRider(plan.satelliteRiderId).name} entra en fuga como corredor satélite.`, "info");
    }
  }
  if (plan.longRangePlan === "bridge_leader" && plan.bridgeRiderId && km > stage.distance * .62) {
    const st = Game.live.states[plan.bridgeRiderId];
    const satellite = Game.live.states[plan.satelliteRiderId];
    if (st && satellite && satellite.groupId === "breakaway" && st.wPrime > st.wPrimeMax * .40 && Math.random() < .06) {
      Game.live.v024.attackQueue.push({ riderId: plan.bridgeRiderId, attackTypeId: "bridge", source: "user", km });
    }
  }
  if (plan.longRangePlan === "double_attack" && plan.bridgeRiderId && plan.secondAttackerId && Math.random() < .025) {
    Game.live.v024.attackQueue.push({ riderId: plan.bridgeRiderId, attackTypeId: "probe", source: "user", km });
    Game.live.v024.attackQueue.push({ riderId: plan.secondAttackerId, attackTypeId: "hard", source: "user", km });
  }
}

function updateBreakawayGapFromTimesV024() {
  const breakRiders = getRaceRiders().filter(r => Game.live.states[r.id]?.groupId === "breakaway");
  const pelotonRiders = getRaceRiders().filter(r => ["peloton", "favorites"].includes(Game.live.states[r.id]?.groupId));
  if (!breakRiders.length || !pelotonRiders.length) {
    Game.live.breakaway.gap = 0;
    return;
  }
  const breakTime = avg(breakRiders.map(r => Game.live.states[r.id].elapsed));
  const pelotonTime = avg(pelotonRiders.map(r => Game.live.states[r.id].elapsed));
  const actualGap = clamp(pelotonTime - breakTime, 0, 1800);
  Game.live.breakaway.gap = clamp(toNum(Game.live.breakaway.gap, actualGap) * .35 + actualGap * .65, 0, 1800);
  Game.live.breakaway.collaboration = groupCollaborationV024("breakaway", breakRiders, getStage(), Game.live.v024.kilometer);
}

/* ============================================================
   11. ABANICOS, AUTOBÚS, DESCENSOS Y PAVÉ
   ============================================================ */

function crosswindRiskAtKmV024(stage, km) {
  const cross = toNum(stage.weather?.crosswind, 0);
  const exposure = Math.abs(Math.sin((km + stage.number * 13) * .11));
  return clamp((cross - 22) * 2.2 * exposure + (stage.type === "flat" ? 15 : 0), 0, 100);
}

function updateEchelonsV024(stage, km) {
  if (!["flat", "hilly", "cobbles"].includes(stage.type)) return;
  const risk = crosswindRiskAtKmV024(stage, km);
  if (risk < 58) return;
  const peloton = getRaceRiders().filter(r => ["peloton", "favorites"].includes(Game.live.states[r.id]?.groupId));
  if (peloton.length < 30) return;
  peloton.sort((a, b) => {
    const sa = Game.live.states[a.id], sb = Game.live.states[b.id];
    const va = toNum(a.stats.positioning, 70) + formationByIdV024(sa.formation).response * 15 + rnd(-8, 8);
    const vb = toNum(b.stats.positioning, 70) + formationByIdV024(sb.formation).response * 15 + rnd(-8, 8);
    return vb - va;
  });
  const echelonSize = clamp(Math.round(24 + (100 - risk) * .12), 18, 32);
  peloton.forEach((r, i) => {
    const st = Game.live.states[r.id];
    if (i < echelonSize) { st.groupId = "echelon1"; st.group = "Pelotón"; }
    else if (i < echelonSize * 2) { st.groupId = "echelon2"; st.group = "Grupo 2"; st.elapsed += rnd(2, 7); }
    else { st.groupId = "group2"; st.group = "Grupo 2"; st.elapsed += rnd(5, 16); }
  });
  Game.live.v024.echelons.push({ km, risk, groups: Math.ceil(peloton.length / echelonSize) });
  logRaceEventV024("Abanicos", `El pelotón se corta en ${Math.ceil(peloton.length / echelonSize)} abanicos en el km ${km}.`, "warning");
  triggerAlertV024("crosswind", `Abanicos en el km ${km}: riesgo ${Math.round(risk)}%.`);
}

function updateAutobusV024(stage, km, distance) {
  const gradient = slopeAtKmV024(stage, km);
  if (gradient < 4.5 && stage.type !== "mountain") return;
  const leaders = getRaceRiders().filter(r => ["gc", "co", "climber"].includes(r.roleKey));
  const best = Math.min(...leaders.map(r => Game.live.states[r.id]?.elapsed || Infinity));
  const candidates = getRaceRiders().filter(r => {
    const st = Game.live.states[r.id];
    return st && ["sprinter", "rouleur", "classics", "domestique"].includes(r.roleKey) && st.elapsed - best > 120;
  });
  if (candidates.length < 4) return;
  candidates.forEach(r => {
    const st = Game.live.states[r.id];
    st.groupId = "autobus";
    st.group = "Autobús";
    st.formation = st.energy < 25 ? "struggling" : "middle";
  });
  const elapsedLeader = best;
  const busElapsed = avg(candidates.map(r => Game.live.states[r.id].elapsed));
  const stageEstimate = elapsedLeader / Math.max(1, km) * stage.distance;
  const timeCutPct = stage.type === "mountain" ? .18 : .12;
  const timeCut = stageEstimate * timeCutPct;
  const currentGap = busElapsed - elapsedLeader;
  const projectedGap = currentGap / Math.max(1, km) * stage.distance;
  Game.live.v024.bus = { active: true, count: candidates.length, timeCutEstimate: timeCut, margin: timeCut - projectedGap, km };
  if (Game.live.v024.bus.margin < 120) triggerAlertV024("time_cut", `Autobús a ${seconds(Math.max(0, Game.live.v024.bus.margin))} del fuera de control.`);
}

function checkSectorAlertsV024(stage, sector) {
  if (sector.type === "climb") triggerAlertV024("climb_start", `Comienza ${sector.name}.`);
  if (sector.type === "cobbles") triggerAlertV024("pave", `Entrada en ${sector.name}.`);
}

/* ============================================================
   12. NUTRICIÓN AUTOMÁTICA AVANZADA
   ============================================================ */

function nutritionItemMacroV024(itemId) {
  return {
    gel: { cho: 30, fluid: 0 },
    bar: { cho: 38, fluid: 0 },
    iso: { cho: 25, fluid: 500 },
    caf: { cho: 30, fluid: 0 },
    rice: { cho: 32, fluid: 0 },
    water: { cho: 0, fluid: 500 }
  }[itemId] || { cho: 20, fluid: 0 };
}

function autoNutritionAtKmV024(stage, km) {
  if (Game.nutritionMode === "manual") return;
  getTeamRiders(Game.selectedTeamId).forEach(r => {
    const st = Game.live.states[r.id]; if (!st) return;
    const sinceFeed = st.elapsed - toNum(st.lastFeedElapsed, 0);
    const temp = toNum(stage.weather?.temp, 20);
    const targetInterval = temp > 29 ? 850 : 1050;
    let itemId = null;
    if (st.hydration < 55 && (Game.stock.iso || 0) > 0) itemId = "iso";
    else if (st.hydration < 42 && (Game.stock.water || 0) > 0) itemId = "water";
    else if (st.energy < 52 && (Game.stock.gel || 0) > 0) itemId = "gel";
    else if (sinceFeed > targetInterval && st.stomach < 75 && (Game.stock.rice || 0) > 0) itemId = "rice";
    else if (stage.distance - km < 35 && st.energy < 72 && (Game.stock.caf || 0) > 0) itemId = "caf";
    if (!itemId) return;
    consumeNutritionSilentV024(r, itemId, true);
  });
}

function consumeNutritionSilentV024(r, itemId, auto) {
  if ((Game.stock[itemId] || 0) <= 0) return false;
  const item = getNutritionItem(itemId); if (!item) return false;
  const st = Game.live.states[r.id]; if (!st) return false;
  Game.stock[itemId]--;
  st.energy = clamp(st.energy + item.energy, 0, 118);
  st.hydration = clamp(st.hydration + item.hydration, 0, 125);
  st.stomach = clamp(st.stomach + item.stomach, 0, 100);
  st.finalBonus += item.finalBonus || 0;
  st.lastFeedElapsed = st.elapsed;
  const macro = nutritionItemMacroV024(itemId);
  st.choGrams += macro.cho;
  st.fluidMl += macro.fluid;
  if (auto && (r.id === Game.protectedRiderId || st.energy < 40 || st.hydration < 42)) addRadio(`${r.name} toma ${item.name} automáticamente.`);
  return true;
}

const __v024_useNutrition_base = useNutrition;
useNutrition = function(riderId, itemId) {
  const r = getRider(riderId);
  if (!r || !Game.live) return;
  if (!consumeNutritionSilentV024(r, itemId, false)) return toast("Sin stock o corredor no disponible");
  addRadio(`${r.name} toma ${getNutritionItem(itemId).name}.`);
  renderLive();
};

const __v024_resetStock_base = resetStockForStage;
resetStockForStage = function() {
  __v024_resetStock_base();
  Object.keys(Game.stock || {}).forEach(k => Game.stock[k] = Math.max(Game.stock[k], Math.round(Game.stock[k] * 4.5)));
};

/* ============================================================
   13. CRI Y CRE FÍSICAS
   ============================================================ */

function simulateTTSectorV024(stage, sector) {
  const start = Math.floor(sector.from), end = Math.ceil(sector.to);
  getRaceRiders().forEach(r => {
    const st = Game.live.states[r.id]; if (!st) return;
    const effort = Game.riderEfforts[r.id] ?? r.defaultEffort;
    for (let km = start; km < end; km++) {
      const distance = Math.min(1, sector.to - km); if (distance <= 0) continue;
      st.formation = "front";
      const order = getOrder("pull");
      const cap = riderSpeedCapacityV024(r, st, stage, km, effort, order, 1);
      const pacing = 1 + staffEffectAssignedV024("pacing", r.teamId, stage.id) * .002;
      const speed = cap.speed * pacing;
      const time = distance / speed * 3600;
      st.elapsed += time; st.raceTime += time; st.km += distance; st.speed = speed; st.maxSpeed = Math.max(st.maxSpeed, speed);
      st.wkg = cap.power / r.weightKg; st.powerSum += cap.power; st.powerSqSum += cap.power ** 2; st.powerSamples++; st.maxPower = Math.max(st.maxPower, cap.power);
      updateWPrimeV024(r, st, cap.power, time); updateEnergyHydrationPhysicalV024(r, st, stage, km, cap.power, time, order, 0);
      appendRiderTelemetryV024(r, st, km, cap.grade, cap.power, speed);
      st.group = "CRI individual"; st.groupId = `tt_${r.id}`;
    }
  });
}

function simulateTTTSectorV024(stage, sector) {
  const intensity = byId(TTT_SETTINGS.relayIntensity, Game.tttRelayIntensity) || TTT_SETTINGS.relayIntensity[1];
  const relayLength = byId(TTT_SETTINGS.relayLength, Game.tttRelayLength) || TTT_SETTINGS.relayLength[1];
  const formation = byId(TTT_SETTINGS.formation, Game.tttFormation) || TTT_SETTINGS.formation[1];
  const start = Math.floor(sector.from), end = Math.ceil(sector.to);

  TEAMS.forEach(team => {
    let active = getTeamRiders(team.id).filter(r => Game.live.states[r.id] && !String(Game.live.states[r.id].groupId).startsWith("ttt_drop"));
    for (let km = start; km < end; km++) {
      const distance = Math.min(1, sector.to - km); if (distance <= 0 || active.length < 1) continue;
      const capacities = active.map((r, i) => {
        const st = Game.live.states[r.id];
        const baseEffort = Game.riderEfforts[r.id] ?? r.defaultEffort;
        const isPuller = i === (km % active.length);
        st.formation = isPuller ? "front" : "protected";
        const effort = clamp(baseEffort + (isPuller ? 8 : -4), 45, 100);
        const order = getOrder("pull");
        const cap = riderSpeedCapacityV024(r, st, stage, km, effort, order, active.length);
        cap.speed *= intensity.power * relayLength.efficiency * formation.aero;
        return { r, st, effort, order, ...cap, isPuller };
      }).sort((a, b) => b.speed - a.speed);
      const fourth = capacities[Math.min(3, capacities.length - 1)];
      const teamSpeed = clamp(fourth.speed * .985, 10, 75);
      const teamTime = distance / teamSpeed * 3600;
      capacities.forEach(x => {
        const deficit = (teamSpeed - x.speed) / teamSpeed;
        const dropRisk = deficit > .07 ? .20 * intensity.dropRisk * relayLength.dropRisk / formation.handling : 0;
        if (capacities.length > 4 && (deficit > .13 || x.st.energy < 10 || Math.random() < dropRisk)) {
          x.st.groupId = `ttt_drop_${team.id}`; x.st.group = "Descolgado CRE"; x.st.elapsed += teamTime + rnd(10, 35); x.st.raceTime += teamTime + rnd(10, 35);
        } else {
          x.st.groupId = `ttt_${team.id}`; x.st.group = `CRE ${team.name}`; x.st.elapsed += teamTime; x.st.raceTime += teamTime;
        }
        x.st.km += distance; x.st.speed = teamSpeed; x.st.maxSpeed = Math.max(x.st.maxSpeed, teamSpeed); x.st.wkg = x.power / x.r.weightKg;
        x.st.powerSum += x.power; x.st.powerSqSum += x.power ** 2; x.st.powerSamples++; x.st.maxPower = Math.max(x.st.maxPower, x.power);
        if (x.isPuller) x.st.timePulling += teamTime; else x.st.timeDrafting += teamTime;
        updateWPrimeV024(x.r, x.st, x.power, teamTime); updateEnergyHydrationPhysicalV024(x.r, x.st, stage, km, x.power, teamTime, x.order, 88);
        appendRiderTelemetryV024(x.r, x.st, km, x.grade, x.power, teamSpeed);
      });
      active = active.filter(r => !String(Game.live.states[r.id].groupId).startsWith("ttt_drop"));
    }
  });
}

/* ============================================================
   14. ALERTAS Y NARRACIÓN
   ============================================================ */

function triggerAlertV024(id, message) {
  if (!Game.v024?.alerts?.[id]) return;
  if (!Game.live?.v024) return;
  const def = byId(ALERT_DEFINITIONS_V024, id) || { severity: "info", name: id };
  const duplicate = Game.live.v024.alerts.some(a => a.id === id && a.message === message && Game.live.v024.kilometer - a.km < 5);
  if (duplicate) return;
  Game.live.v024.alerts.unshift({ id, message, severity: def.severity, km: Game.live.v024.kilometer, time: Date.now() });
  Game.live.v024.alerts = Game.live.v024.alerts.slice(0, 12);
  logRaceEventV024("Alerta", message, def.severity);
}

function evaluateLiveAlertsV024(stage, km) {
  const leader = getRider(Game.protectedRiderId), leaderState = leader ? Game.live.states[leader.id] : null;
  if (leaderState?.energy < 35) triggerAlertV024("leader_energy", `${leader.name} baja a ${Math.round(leaderState.energy)}% de energía.`);
  if (leaderState?.wPrime < leaderState?.wPrimeMax * .18) triggerAlertV024("wprime_low", `${leader.name} tiene la reserva W′ crítica.`);
  if (toNum(Game.live.breakaway?.gap, 0) > 240) triggerAlertV024("break_gap", `La fuga supera 4 minutos: ${seconds(Game.live.breakaway.gap)}.`);
  const stockTotal = Object.values(Game.stock || {}).reduce((s, v) => s + toNum(v, 0), 0);
  if (stockTotal < 25) triggerAlertV024("nutrition_low", `Stock del coche bajo: ${stockTotal} unidades.`);
  if (leaderState && ["group2", "dropped", "autobus"].includes(leaderState.groupId)) triggerAlertV024("isolated_leader", `${leader.name} está aislado o cortado.`);
}

function logRaceEventV024(tag, text, severity = "info") {
  if (!Game.live?.v024) return;
  Game.live.v024.timeline.unshift({ tag, text, severity, km: Game.live.v024.kilometer, timestamp: Date.now() });
  Game.live.v024.timeline = Game.live.v024.timeline.slice(0, 120);
}

function checkAlertSettingV024(id, checked) { Game.v024.alerts[id] = !!checked; renderRace(); }

function renderAlertSettingsV024() {
  return `<section class="panel"><h2>Alertas configurables</h2><div class="alert-settings">${ALERT_DEFINITIONS_V024.map(a => `<label class="alert-setting ${a.severity}"><input type="checkbox" ${Game.v024.alerts[a.id] ? "checked" : ""} onchange="checkAlertSettingV024('${a.id}',this.checked)"><span><b>${esc(a.name)}</b><small>${esc(a.severity)}</small></span></label>`).join("")}</div></section>`;
}

function dynamicNarrationV024(groups, situation) {
  const lines = [];
  const stage = getStage();
  const fuga = groups.find(g => g.label === "Fuga");
  const fav = groups.find(g => g.label === "Grupo favoritos");
  const bus = groups.find(g => g.label === "Autobús");
  const attacks = Game.live?.v024?.activeAttacks || [];
  if (attacks.length) lines.push(`Hay ${attacks.length} ataque${attacks.length > 1 ? "s" : ""} activo${attacks.length > 1 ? "s" : ""}; la selección se está produciendo.`);
  if (fuga) lines.push(`La fuga conserva ${fuga.gapText}, rueda a ${fuga.speed.toFixed(1)} km/h y colabora al ${Math.round(fuga.collaboration)}%.`);
  if (fav) lines.push(`El grupo de favoritos tiene ${fav.count} corredores y sostiene ${fav.wkg.toFixed(1)} W/kg de media.`);
  if (bus) lines.push(`El autobús reúne ${bus.count} corredores; margen estimado de control ${seconds(Math.max(0, Game.live.v024.bus.margin))}.`);
  if (stage.weather?.crosswind > 35) lines.push(`El viento lateral sigue siendo un factor táctico: ${stage.weather.crosswind} km/h.`);
  const latest = Game.live?.v024?.timeline?.[0]; if (latest) lines.push(latest.text);
  lines.push(situation.recommendationText || situation.recommendation || "Mantener lectura táctica y energía del líder.");
  return lines.slice(0, 7);
}

/* ============================================================
   15. TELEMETRÍA, ANÁLISIS Y RÉCORDS
   ============================================================ */

function appendRiderTelemetryV024(r, st, km, grade, power, speed) {
  st.telemetry.push({ km: Math.round(km * 10) / 10, grade: Math.round(grade * 10) / 10, power: Math.round(power), wkg: Math.round(power / r.weightKg * 100) / 100, speed: Math.round(speed * 10) / 10, energy: Math.round(st.energy * 10) / 10, wPrime: Math.round(st.wPrime), groupId: st.groupId });
  if (st.telemetry.length > 500) st.telemetry.shift();
}

function captureSectorSnapshotV024(stage, sector) {
  const groups = buildGroups();
  Game.live.v024.groupHistory.push({ sectorIndex: Game.live.sectorIndex, km: sector.to, groups: groups.map(g => ({ label: g.label, count: g.count, gapSeconds: g.gapSeconds, speed: g.speed, wkg: g.wkg, energy: g.energy })) });
  Game.live.v024.weatherHistory.push({ km: sector.to, ...stage.weather });
}

function buildStageTelemetryV024(stage, results) {
  const report = {};
  results.forEach(res => {
    const r = getRider(res.riderId), st = Game.live?.states?.[r.id];
    if (!r || !st) return;
    const samples = Math.max(1, st.powerSamples);
    const avgPower = st.powerSum / samples;
    const normalizedPower = Math.pow(st.powerSqSum / samples, .5) * 1.025;
    const hours = Math.max(.1, st.raceTime / 3600);
    report[r.id] = {
      riderId: r.id,
      riderName: r.name,
      avgPower: Math.round(avgPower),
      normalizedPower: Math.round(normalizedPower),
      avgWkg: Math.round(avgPower / r.weightKg * 100) / 100,
      maxPower: Math.round(st.maxPower),
      maxSpeed: Math.round(st.maxSpeed * 10) / 10,
      energyKj: Math.round(avgPower * st.raceTime / 1000),
      choPerHour: Math.round(st.choGrams / hours),
      fluidPerHour: Math.round(st.fluidMl / hours),
      draftPct: Math.round(st.timeDrafting / Math.max(1, st.timeDrafting + st.timePulling) * 100),
      pullingMinutes: Math.round(st.timePulling / 60),
      wPrimeMinKj: Math.round(st.wPrimeMin / 100) / 10,
      attacks: st.attacks,
      responses: st.responses,
      soloKm: Math.round(st.soloKm * 10) / 10,
      telemetry: st.telemetry.slice()
    };
  });
  return report;
}

function renderTelemetryPanelV024(stageReport = null) {
  const report = stageReport || Game.lastStage?.telemetryV024;
  if (!report) return `<section class="panel"><h2>Telemetría</h2><p class="muted">Disponible después de simular una etapa.</p></section>`;
  const userIds = getRaceRosterIds(Game.selectedTeamId);
  const rows = userIds.map(id => report[id]).filter(Boolean);
  return `<section class="panel"><h2>Telemetría postetapa</h2><div class="classification-scroll"><table><thead><tr><th>Corredor</th><th>P media</th><th>NP est.</th><th>W/kg</th><th>P máx.</th><th>Vel. máx.</th><th>kJ</th><th>CHO/h</th><th>ml/h</th><th>A rueda</th><th>Tirando</th><th>W′ mín.</th><th>Ataques</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.riderName)}</td><td>${x.avgPower} W</td><td>${x.normalizedPower} W</td><td>${x.avgWkg}</td><td>${x.maxPower} W</td><td>${x.maxSpeed} km/h</td><td>${x.energyKj}</td><td>${x.choPerHour} g</td><td>${x.fluidPerHour}</td><td>${x.draftPct}%</td><td>${x.pullingMinutes} min</td><td>${x.wPrimeMinKj} kJ</td><td>${x.attacks}</td></tr>`).join("")}</tbody></table></div>${rows[0] ? renderTelemetryChartsV024(rows[0]) : ""}</section>`;
}

function renderTelemetryChartsV024(data) {
  const pts = data.telemetry || [];
  if (!pts.length) return "";
  return `<div class="chart-grid-v024">${renderLineChartV024("Potencia", pts, "power", "W")}${renderLineChartV024("W/kg", pts, "wkg", "W/kg")}${renderLineChartV024("Velocidad", pts, "speed", "km/h")}${renderLineChartV024("Energía", pts, "energy", "%")}</div>`;
}

function renderLineChartV024(title, points, key, unit) {
  const w = 520, h = 160, pad = 28;
  const vals = points.map(p => toNum(p[key], 0));
  const min = Math.min(...vals), max = Math.max(...vals, min + 1);
  const maxKm = Math.max(...points.map(p => p.km), 1);
  const x = km => pad + km / maxKm * (w - pad * 2);
  const y = v => h - pad - (v - min) / (max - min) * (h - pad * 2);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.km).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  return `<div class="analysis-chart"><h3>${esc(title)}</h3><svg viewBox="0 0 ${w} ${h}"><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" class="chart-grid"/><path d="${path}" class="chart-line"/><text x="5" y="18" class="svg-label">${Math.round(max)} ${unit}</text><text x="5" y="${h-8}" class="svg-label">${Math.round(min)} ${unit}</text></svg></div>`;
}

function renderAnalyticsV024() {
  ensureV024State();
  const riders = getFullTeamRiders(Game.selectedTeamId);
  const selectedId = Game.v024.ui.analyticsRiderId || riders[0]?.id;
  Game.v024.ui.analyticsRiderId = selectedId;
  const r = getRider(selectedId);
  const history = Game.v024.analytics.riderHistory[selectedId] || [];
  return `<section class="panel"><h2>Análisis de rendimiento</h2><label>Corredor<select onchange="Game.v024.ui.analyticsRiderId=this.value;renderRace()">${riders.map(x => `<option value="${x.id}" ${x.id === selectedId ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>${r ? renderRiderSeasonAnalyticsV024(r, history) : ""}</section>${renderTelemetryPanelV024()}`;
}

function renderRiderSeasonAnalyticsV024(r, history) {
  const phys = getPhysiologyV024(r);
  return `<div class="manager-strip"><div class="manager-kpi"><span>CP</span><strong>${phys.cp} W</strong></div><div class="manager-kpi"><span>CP relativo</span><strong>${phys.cpWkg} W/kg</strong></div><div class="manager-kpi"><span>W′</span><strong>${Math.round(phys.wPrimeMax / 1000)} kJ</strong></div><div class="manager-kpi"><span>VO₂max est.</span><strong>${phys.vo2max}</strong></div></div>${renderHistoryChartV024(r, history)}`;
}

function renderHistoryChartV024(r, history) {
  if (!history.length) return `<p class="muted">El historial se irá construyendo después de cada carrera.</p>`;
  const w = 900, h = 220, pad = 35;
  const x = i => pad + i / Math.max(1, history.length - 1) * (w - pad * 2);
  const y = v => h - pad - (v - 35) / 70 * (h - pad * 2);
  const formPath = history.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.form)}`).join(" ");
  const fatiguePath = history.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.fatigue)}`).join(" ");
  return `<div class="analysis-chart wide"><h3>Forma y fatiga</h3><svg viewBox="0 0 ${w} ${h}"><path d="${formPath}" class="chart-line form"/><path d="${fatiguePath}" class="chart-line fatigue"/>${history.map((p, i) => `<text x="${x(i)}" y="${h-8}" class="svg-label small-label">${esc(p.raceName.slice(0,10))}</text>`).join("")}</svg><div class="legend"><span class="line-key form"></span>Forma <span class="line-key fatigue"></span>Fatiga</div></div>`;
}

function updateRecordsV024(stage, results, telemetry) {
  const records = Game.v024.records;
  Object.values(telemetry || {}).forEach(t => {
    setRecordV024("highest_wkg", t.avgWkg, t.riderName, `${stage.name} · ${t.avgWkg} W/kg`);
    setRecordV024("highest_speed", t.maxSpeed, t.riderName, `${stage.name} · ${t.maxSpeed} km/h`);
    setRecordV024("longest_solo", t.soloKm, t.riderName, `${stage.name} · ${t.soloKm} km`);
  });
  Game.riders.forEach(r => {
    setRecordV024("most_stage_wins", r.seasonStageWins || 0, r.name, `${r.seasonStageWins || 0} victorias`);
    setRecordV024("highest_uci", r.uciPoints || 0, r.name, `${r.uciPoints || 0} puntos`);
  });
}

function setRecordV024(id, value, holder, detail) {
  if (!Number.isFinite(Number(value))) return;
  const catalog = byId(RECORD_CATALOG_V024, id); if (!catalog) return;
  const existing = Game.v024.records[id];
  const better = !existing || (catalog.mode === "max" ? value > existing.value : value < existing.value);
  if (better) Game.v024.records[id] = { value, holder, detail, date: new Date().toLocaleDateString("es-ES") };
}

function renderRecordsV024() {
  const wins = {};
  Game.v024.palmares.forEach(p => wins[p.riderName] = (wins[p.riderName] || 0) + 1);
  return `<section class="panel"><h2>Récords persistentes</h2><div class="record-grid">${RECORD_CATALOG_V024.map(c => { const r = Game.v024.records[c.id]; return `<div class="record-card"><span>${esc(c.name)}</span><strong>${r ? esc(r.holder) : "—"}</strong><small>${r ? esc(r.detail) : "Sin registro"}</small></div>`; }).join("")}</div></section><section class="panel"><h2>Palmarés</h2><div class="classification-scroll"><table><thead><tr><th>Fecha</th><th>Carrera</th><th>Corredor</th><th>Equipo</th><th>Tipo</th></tr></thead><tbody>${Game.v024.palmares.map(p => `<tr><td>${esc(p.date)}</td><td>${esc(p.raceName)}</td><td>${esc(p.riderName)}</td><td>${esc(p.teamName)}</td><td>${esc(p.type)}</td></tr>`).join("") || `<tr><td colspan="5">Sin victorias registradas</td></tr>`}</tbody></table></div></section>`;
}

/* ============================================================
   16. FIN DE ETAPA/CARRERA Y PROGRESIÓN
   ============================================================ */

const __v024_finishStage_base = finishStage;
finishStage = function(renderNow) {
  const stage = getStage();
  const liveSnapshot = Game.live;
  let preliminary = getRaceRiders().map(r => ({ riderId: r.id, riderName: r.name, teamId: r.teamId, teamName: getTeam(r.teamId).name, time: toNum(Game.live.states[r.id]?.raceTime, safeRaceTime(r, stage)), group: Game.live.states[r.id]?.group || "", incident: Game.live.states[r.id]?.incident, fatigueGain: toNum(Game.live.states[r.id]?.fatigueGain, 0), energy: toNum(Game.live.states[r.id]?.energy, 0) })).sort((a, b) => a.time - b.time);
  const telemetry = buildStageTelemetryV024(stage, preliminary);
  __v024_finishStage_base(renderNow);
  if (Game.lastStage) {
    Game.lastStage.telemetryV024 = telemetry;
    Game.lastStage.timelineV024 = liveSnapshot?.v024?.timeline || [];
    Game.lastStage.groupHistoryV024 = liveSnapshot?.v024?.groupHistory || [];
    updateRecordsV024(stage, Game.lastStage.results, telemetry);
    Game.v024.analytics.stageReports.push({ raceId: Game.selectedRaceId, stageId: stage.id, stageName: stage.name, telemetry, date: getRace().date });
    if (renderNow) renderStageResult();
  }
};

const __v024_renderStageResult_base = renderStageResult;
renderStageResult = function() {
  __v024_renderStageResult_base();
  if (Game.lastStage?.telemetryV024) app.insertAdjacentHTML("beforeend", renderTelemetryPanelV024(Game.lastStage.telemetryV024));
  if (Game.lastStage?.timelineV024?.length) app.insertAdjacentHTML("beforeend", `<section class="panel"><h2>Replay textual / eventos</h2><div class="timeline-list">${Game.lastStage.timelineV024.slice(0,80).map(e => `<div class="timeline-event ${e.severity}"><span>km ${e.km}</span><b>${esc(e.tag)}</b><p>${esc(e.text)}</p></div>`).join("")}</div></section>`);
};

const __v024_finishRace_base = finishRace;
finishRace = function() {
  const race = getRace();
  __v024_finishRace_base();
  ensureV024State();
  const gc = getGC();
  const winner = gc[0];
  if (winner) {
    Game.v024.palmares.unshift({ date: race.date, raceId: race.id, raceName: race.name, riderId: winner.id, riderName: winner.name, teamId: winner.teamId, teamName: getTeam(winner.teamId).name, type: race.type });
    setRecordV024("most_race_wins", Game.v024.palmares.filter(p => p.riderId === winner.id).length, winner.name, `${Game.v024.palmares.filter(p => p.riderId === winner.id).length} carreras`);
    if (winner.age) setRecordV024("youngest_winner", winner.age, winner.name, `${winner.age} años · ${race.name}`);
  }
  if (gc.length > 1) setRecordV024("largest_gc_margin", gc[1].totalTime - gc[0].totalTime, winner?.name || "—", `${seconds(gc[1].totalTime - gc[0].totalTime)} · ${race.name}`);
  evaluateContractsAfterRaceV024(race);
  updateSeasonAnalyticsV024(race);
  processCompletedScoutingV024(true);
  applyMentorshipProgressV024();
  saveGame(false);
};

function evaluateContractsAfterRaceV024(race) {
  getFullTeamRiders(Game.selectedTeamId).forEach(r => {
    const c = Game.manager.contracts[r.id]; const p = Game.v024.contractPromises[r.id]; if (!c || !p) return;
    const selected = getRaceRosterIds(Game.selectedTeamId).includes(r.id);
    if (selected) p.raceDaysCompleted += race.stages.length;
    let delta = selected ? 1 : -1;
    if (p.targetRaceId === race.id && selected) delta += 5;
    if (p.promises.includes("tour_selection") && race.id === "tour") delta += selected ? 10 : -16;
    if (p.promises.includes("target_race") && p.targetRaceId === race.id) delta += selected ? 8 : -14;
    const userBest = getTeamRiders(Game.selectedTeamId, true).sort((a, b) => a.totalTime - b.totalTime)[0];
    if (["leader", "co_leader"].includes(p.role) && userBest?.id === r.id) { p.leadershipStarts++; delta += 4; }
    if (r.stageWins > 0) { delta += 4; Game.manager.budget -= Math.min(Game.manager.budget, p.winBonus * r.stageWins); }
    c.happiness = clamp(c.happiness + delta, 0, 100);
    p.promiseScore = clamp(p.promiseScore + delta, 0, 100);
    p.lastEvaluation = { raceId: race.id, delta, date: race.date };
  });
}

function updateSeasonAnalyticsV024(race) {
  getFullTeamRiders(Game.selectedTeamId).forEach(r => {
    Game.v024.analytics.riderHistory[r.id].push({ raceId: race.id, raceName: race.name, date: race.date, form: Math.round(r.form), fatigue: Math.round(r.fatigue), uci: r.uciPoints, wins: r.seasonStageWins || 0, readiness: Math.round(readinessScoreAdvancedV024(r, race)) });
  });
}

function applyMentorshipProgressV024() {
  Object.entries(Game.v024.mentorships).forEach(([youthId, link]) => {
    const youth = getRider(youthId), mentor = getRider(link.mentorId); if (!youth || !mentor) return;
    const type = byId(MENTORSHIP_TYPES_V024, link.typeId) || MENTORSHIP_TYPES_V024[4];
    const moraleFactor = clamp((toNum(mentor.morale, 70) + toNum(youth.morale, 70)) / 160, .6, 1.2);
    type.statKeys.forEach(key => {
      if (youth.stats[key] !== undefined && Math.random() < .55) youth.stats[key] = clamp(youth.stats[key] + type.bonus * moraleFactor, 40, 99);
    });
    youth.form = clamp(youth.form + .3, 45, 100);
    mentor.morale = clamp(toNum(mentor.morale, 70) + .2, 20, 100);
  });
}

const __v024_applyTraining_base = applyTraining;
applyTraining = function() {
  __v024_applyTraining_base();
  ensureV024State();
  const currentDate = currentRaceDateV024();
  getFullTeamRiders(Game.selectedTeamId).forEach(r => {
    const t = Game.v024.formTargets[r.id];
    const peak = byId(PEAK_TYPES_V024, t.peakType) || PEAK_TYPES_V024[0];
    const nextTargets = [t.A, t.B, t.C].map(id => byId(RACES, id)).filter(Boolean).map(race => ({ race, days: daysBetweenV024(currentDate, new Date(`${race.date}T12:00:00`)) })).filter(x => x.days >= 0).sort((a, b) => a.days - b.days);
    const next = nextTargets[0];
    if (next) {
      if (next.days <= 10) { t.trainingLoad = clamp(t.trainingLoad - 12, 20, 100); t.freshness = clamp(t.freshness + 10, 0, 100); r.fatigue = clamp(r.fatigue - 5, 0, 100); }
      else if (next.days <= peak.buildDays) { t.trainingLoad = clamp(t.trainingLoad + 4, 20, 100); t.freshness = clamp(t.freshness - 3, 0, 100); }
      else { t.trainingLoad = clamp(t.trainingLoad - 2, 20, 100); t.freshness = clamp(t.freshness + 2, 0, 100); }
    }
  });
  applyMentorshipProgressV024();
};

/* ============================================================
   17. VISTA TV AVANZADA Y LIVE UI
   ============================================================ */

function setBroadcastCameraV024(id) { Game.v024.broadcast.camera = id; if (Game.live?.v024) Game.live.v024.camera = id; Game.live ? renderLiveBroadcastV024() : renderRace(); }

function cameraGroupV024(groups) {
  const id = Game.v024.broadcast.camera;
  if (id === "breakaway") return groups.find(g => g.label === "Fuga");
  if (id === "chase") return groups.find(g => g.label === "Grupo perseguidor");
  if (id === "favorites") return groups.find(g => g.label === "Grupo favoritos");
  if (id === "peloton") return groups.find(g => g.label === "Pelotón");
  if (id === "bus") return groups.find(g => g.label === "Autobús");
  if (id === "leader") {
    const leader = getRider(Game.protectedRiderId); return groups.find(g => g.riders.some(r => r.id === leader?.id));
  }
  if (id === "sprinter") {
    const sprinter = getTeamRiders(Game.selectedTeamId).filter(r => r.roleKey === "sprinter").sort((a, b) => b.stats.sprint - a.stats.sprint)[0]; return groups.find(g => g.riders.some(r => r.id === sprinter?.id));
  }
  return groups.find(g => g.label === "Fuga") || groups.find(g => g.label === "Grupo favoritos") || groups.find(g => g.label === "Pelotón") || groups[0];
}

function renderAdvancedBroadcastV024(full = true) {
  const stage = getStage(), sector = stage.sectors[Game.live.sectorIndex], groups = buildGroups(), situation = analyzeRaceSituation(groups, stage, sector);
  const camera = cameraGroupV024(groups);
  const narrative = dynamicNarrationV024(groups, situation);
  const alerts = Game.live.v024.alerts || [];
  return `<section class="panel tv-studio">
    <div class="tv-topbar"><span class="tv-live">● DIRECTO</span><strong>${esc(stage.name)}</strong><span>km ${camera ? camera.km.toFixed(1) : sector.from.toFixed(1)} / ${stage.distance}</span><span>${camera ? camera.speed.toFixed(1) : "—"} km/h</span><span>${camera ? camera.wkg.toFixed(1) : "—"} W/kg</span><span>${esc(stage.weather.label)}</span></div>
    <div class="camera-buttons">${CAMERA_OPTIONS_V024.map(c => `<button class="secondary ${Game.v024.broadcast.camera === c.id ? "active" : ""}" onclick="setBroadcastCameraV024('${c.id}')">${esc(c.name)}</button>`).join("")}</div>
    ${renderBroadcastHeroV019(stage, groups, situation)}
    <div class="tv-main-grid"><div>${renderStageProfile(stage, groups)}${renderTVLanes(groups)}</div><div><div class="narration-box"><h2>Narración dinámica</h2>${narrative.map((line, i) => `<p><b>${i + 1}</b>${esc(line)}</p>`).join("")}</div><div class="alert-feed"><h2>Alertas</h2>${alerts.map(a => `<div class="live-alert ${a.severity}"><span>km ${a.km}</span><p>${esc(a.message)}</p></div>`).join("") || `<p class="muted">Sin alertas activas.</p>`}</div></div></div>
    <div class="timeline-ribbon">${Game.live.v024.timeline.slice(0, 16).map(e => `<span class="${e.severity}"><b>km ${e.km}</b>${esc(e.tag)}: ${esc(e.text)}</span>`).join("")}</div>
  </section>`;
}

renderLiveBroadcastV024 = function() {
  if (!Game.live) return renderRace();
  const stage = getStage(), sector = stage.sectors[Game.live.sectorIndex];
  app.innerHTML = `<div class="header"><div><h1>Realización TV v0.24+</h1><p>${esc(stage.name)} · sector ${Game.live.sectorIndex + 1}/${stage.sectors.length}</p></div><div class="top-actions"><button onclick="renderLive()">Race Director</button><button class="secondary" onclick="simulateSector()">Simular sector</button><button class="secondary" onclick="saveGame()">Guardar</button></div></div>${renderAdvancedBroadcastV024(true)}`;
};

const __v024_renderLive_base = renderLive;
renderLive = function() {
  ensureV024State();
  const stage = getStage(), sector = stage.sectors[Game.live.sectorIndex], groups = buildGroups(), situation = analyzeRaceSituation(groups, stage, sector);
  app.innerHTML = `<div class="header"><div><h1>Race Director v0.24+ · ${esc(stage.name)}</h1><p>Sector ${Game.live.sectorIndex + 1}/${stage.sectors.length} · km ${sector.from}-${sector.to} · motor CP/W′</p></div><div class="top-actions"><button class="secondary" onclick="saveGame()">Guardar</button><button class="secondary" onclick="renderLiveBroadcastV024()">Vista TV</button></div></div>
    ${renderActionBar(true)}
    <section class="panel">${renderWeather(stage)}${renderRaceControlPanel(situation, true)}${renderBroadcastOverlayV019(groups, situation)}${renderStageProfile(stage, groups)}${renderTVLanes(groups)}${renderThreatPanel(situation, true)}${renderDirectorRecommendation(situation, true)}</section>
    <div class="grid live-grid"><section class="panel"><h2>Decisión del sector</h2><div class="sector-focus"><strong>${esc(sector.question)}</strong><p>${esc(sector.name)} · Dificultad ${sector.difficulty} · pendiente actual ${slopeAtKmV024(stage, sector.from).toFixed(1)}%</p></div>${isTTT(stage) ? renderTTTControls(true) : ""}${renderLiveRadar(groups)}${renderQuickControls(true)}${renderAdvancedTacticsV024(true)}</section><section class="panel"><h2>Radio / TV</h2><div class="radio-list">${Game.live.radio.map(r => `<div class="radio"><span>${esc(r.time)}</span><p>${esc(r.msg)}</p></div>`).join("")}</div><h2>Alertas activas</h2><div class="alert-feed">${Game.live.v024.alerts.map(a => `<div class="live-alert ${a.severity}"><span>km ${a.km}</span><p>${esc(a.message)}</p></div>`).join("") || `<p class="muted">Sin alertas.</p>`}</div><h2>Stock coche</h2>${renderStock(Game.stock)}</section></div>
    <section class="panel"><h2>Tu equipo en carrera</h2>${renderEnergyHeatmapV024()}<div class="live-rider-grid">${getTeamRiders(Game.selectedTeamId).map(renderLiveRiderCardV024).join("")}</div></section>`;
};

function renderEnergyHeatmapV024() {
  return `<div class="energy-map">${getTeamRiders(Game.selectedTeamId).map(r => { const st = Game.live.states[r.id], w = st.wPrime / st.wPrimeMax * 100; const cls = st.energy > 68 && w > 45 ? "good" : st.energy > 38 && w > 20 ? "warn" : "bad"; return `<div class="energy ${cls}"><strong>${esc(r.name)}</strong><span>E ${Math.round(st.energy)}% · W′ ${Math.round(w)}%</span></div>`; }).join("")}</div>`;
}

function renderLiveRiderCardV024(r) {
  const st = Game.live.states[r.id], eff = Game.riderEfforts[r.id] ?? r.defaultEffort, order = Game.riderOrders[r.id] ?? r.defaultOrder;
  const phys = getPhysiologyV024(r);
  return `<div class="live-rider-card ${Game.protectedRiderId === r.id ? "protected" : ""}"><div class="badge-row"><span class="badge green">${esc(r.role)}</span><span class="badge blue">${esc(st.group)}</span><span class="badge">km ${st.km.toFixed(1)}</span><span class="badge orange">E ${Math.round(st.energy)}</span><span class="badge">W′ ${Math.round(st.wPrime / 1000)} kJ</span><span class="badge">${st.wkg.toFixed(1)} W/kg</span></div><h3>${esc(r.name)}</h3><div class="physio-bars"><label>Reserva anaeróbica<div class="mini-bar"><div style="width:${clamp(st.wPrime / st.wPrimeMax * 100, 0, 100)}%"></div></div></label><span>CP ${phys.cp} W · ${phys.cpWkg} W/kg</span></div><label>Orden</label><select onchange="Game.riderOrders['${r.id}']=this.value;renderLive()">${RIDER_ORDERS.map(o => `<option value="${o.id}" ${order === o.id ? "selected" : ""}>${esc(o.name)}</option>`).join("")}</select><label>Posición</label><select onchange="setFormationV024('${r.id}',this.value,true)">${GROUP_FORMATIONS_V024.map(f => `<option value="${f.id}" ${st.formation === f.id ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select><label>Esfuerzo <strong id="live_eff_${r.id}">${eff}%</strong></label><input type="range" min="20" max="100" value="${eff}" oninput="document.getElementById('live_eff_${r.id}').textContent=this.value+'%'" onchange="Game.riderEfforts['${r.id}']=Number(this.value);renderLive()"><div class="nutrition-actions">${NUTRITION_ITEMS.map(it => `<button class="secondary" onclick="useNutrition('${r.id}','${it.id}')">${esc(it.name)}</button>`).join("")}</div></div>`;
}

/* ============================================================
   18. RENDER PRINCIPAL Y NUEVAS PESTAÑAS
   ============================================================ */

const __v024_renderRace_base = renderRace;
renderRace = function() {
  ensureV024State();
  const race = getRace(), team = getTeam(Game.selectedTeamId);
  const tabs = [
    ["director", "Race Director"], ["broadcast", "TV"], ["strategy", "Estrategia"], ["nutrition", "Alimentación"], ["material", "Material"], ["team", "Equipo"], ["class", "Clasificaciones"], ["objectives", "Objetivos"], ["season_plan", "Plan anual"], ["contracts", "Contratos / Cantera"], ["operations", "Staff / Logística"], ["analytics", "Análisis"], ["alerts", "Alertas"], ["records", "Récords"], ["history", "Historial"]
  ];
  app.innerHTML = `<div class="header"><div><h1>${esc(team.name)}</h1><p>v0.24+ · ${Game.mode === "season" ? `Temporada ${Game.seasonIndex + 1}/${SEASON_RACE_IDS.length} · ` : ""}${esc(race.name)} · Etapa ${Game.currentStageIndex + 1}/${race.stages.length}</p></div><div class="top-actions"><button class="secondary" onclick="saveGame()">Guardar</button><button class="danger" onclick="init()">Reiniciar</button></div></div>${renderManagerHeaderV019()}${renderLeaderStrip()}<div class="tabs">${tabs.map(([id, label]) => `<button class="tab ${Game.activeTab === id ? "active" : ""}" onclick="setTab('${id}')">${label}</button>`).join("")}</div>
    ${Game.activeTab === "director" ? renderDirectorTab() : ""}
    ${Game.activeTab === "broadcast" ? renderBroadcastTabV019() : ""}
    ${Game.activeTab === "strategy" ? renderStrategyTab(false) : ""}
    ${Game.activeTab === "nutrition" ? renderNutritionTab() : ""}
    ${Game.activeTab === "material" ? renderMaterialTab() : ""}
    ${Game.activeTab === "team" ? renderTeamTab() : ""}
    ${Game.activeTab === "class" ? renderClassTab() : ""}
    ${Game.activeTab === "objectives" ? renderObjectivesTabV019() : ""}
    ${Game.activeTab === "season_plan" ? renderSeasonPlanningV024() : ""}
    ${Game.activeTab === "contracts" ? renderContractsScoutingV024() : ""}
    ${Game.activeTab === "operations" ? renderOperationsV024() : ""}
    ${Game.activeTab === "analytics" ? renderAnalyticsV024() : ""}
    ${Game.activeTab === "alerts" ? renderAlertSettingsV024() : ""}
    ${Game.activeTab === "records" ? renderRecordsV024() : ""}
    ${Game.activeTab === "history" ? renderHistoryTab() : ""}`;
};

const __v024_renderDirector_base = renderDirectorTab;
renderDirectorTab = function() {
  ensureV024State();
  const stage = getStage();
  const previewGroups = previewStartGroups(stage);
  const situation = analyzeRaceSituation(previewGroups, stage, null);
  return `<div class="grid director"><section class="panel">${renderActionBar(false)}${renderWeather(stage)}${renderRaceControlPanel(situation, false)}${renderStageProfile(stage, previewGroups)}${renderThreatPanel(situation, false)}${renderDirectorRecommendation(situation, false)}${renderVisualLanesPreview()}${renderPhysiologyPreviewV024()}</section><section class="panel">${renderStrategyTab(false, true)}</section></div>`;
};

function renderPhysiologyPreviewV024() {
  const leader = getRider(Game.protectedRiderId) || getTeamRiders(Game.selectedTeamId)[0];
  if (!leader) return "";
  const p = getPhysiologyV024(leader), readiness = readinessScoreAdvancedV024(leader);
  return `<div class="physiology-preview"><div><span>Corredor protegido</span><strong>${esc(leader.name)}</strong></div><div><span>CP</span><strong>${p.cp} W · ${p.cpWkg} W/kg</strong></div><div><span>W′</span><strong>${Math.round(p.wPrimeMax / 1000)} kJ</strong></div><div><span>Readiness</span><strong>${Math.round(readiness)}</strong></div></div>`;
}

/* ============================================================
   19. MEJORAS DE GRUPOS VISUALES
   ============================================================ */

const __v024_groupObject_base = groupObject;
groupObject = function(label, riders, best) {
  const obj = __v024_groupObject_base(label, riders, best);
  const states = riders.map(r => Game.live.states[r.id]).filter(Boolean);
  obj.cpWkg = avg(riders.map(r => getPhysiologyV024(r).cpWkg));
  obj.wPrimePct = avg(states.map(st => st.wPrime / Math.max(1, st.wPrimeMax) * 100));
  obj.positioning = avg(riders.map(r => r.stats.positioning));
  obj.gradient = avg(states.map(st => st.currentGradient));
  obj.timeCutMargin = label === "Autobús" ? Game.live.v024?.bus?.margin || 0 : null;
  return obj;
};

const __v024_renderTVLanes_base = renderTVLanes;
renderTVLanes = function(groups) {
  if (isTT(getStage()) || isTTT(getStage())) return renderChronoLanes(groups);
  const lanes = ["Fuga", "Ataque", "Grupo perseguidor", "Grupo favoritos", "Pelotón", "Grupo 2", "Autobús", "Cortados"];
  return `<div class="tv-lanes live pro">${lanes.map(label => { const g = groups.find(x => x.label === label); const cp = toNum(g?.cpWkg, avg((g?.riders || []).map(r => getPhysiologyV024(r).cpWkg))); const wp = toNum(g?.wPrimePct, 100); const grad = toNum(g?.gradient, 0); const energy = toNum(g?.energy, 100); const collab = toNum(g?.collaboration, 0); return `<div class="lane ${g ? g.cls : ""}"><strong>${label}</strong><span>${g ? `${g.count} corredores · ${g.gapText} · km ${toNum(g.km,0).toFixed(1)} · ${toNum(g.speed,0).toFixed(1)} km/h · ${toNum(g.wkg,0).toFixed(1)} W/kg` : "—"}</span>${g ? `<div class="group-metrics"><i>CP ${cp.toFixed(1)} W/kg</i><i>W′ ${Math.round(wp)}%</i><i>colab. ${Math.round(collab)}%</i><i>energía ${Math.round(energy)}%</i><i>pend. ${grad.toFixed(1)}%</i>${g.timeCutMargin !== null && g.timeCutMargin !== undefined ? `<i>margen control ${seconds(Math.max(0, g.timeCutMargin))}</i>` : ""}</div>` : ""}<div class="lane-chips">${g ? g.riders.slice(0, 16).map(r => `<b class="${r.teamId === Game.selectedTeamId ? "mine" : isRival(r) ? "rival" : ""}">${esc(r.name)}</b>`).join("") : ""}</div></div>`; }).join("")}</div>`;
};

/* ============================================================
   20. PERFIL 2D: DETALLE 1 KM, PENDIENTE Y SUPERFICIE
   ============================================================ */

const __v024_renderStageProfile_base = renderStageProfile;
renderStageProfile = function(stage, groups = []) {
  const w = 1400, h = 410, padL = 58, padR = 36, padTop = 42, padBottom = 74;
  const pts = generateEnhancedProfilePointsV019(stage);
  const maxAlt = Math.max(...pts.map(p => p.alt), 500), minAlt = Math.min(...pts.map(p => p.alt), 0);
  const xOf = km => padL + km / stage.distance * (w - padL - padR);
  const yOf = alt => h - padBottom - (alt - minAlt) / Math.max(1, maxAlt - minAlt) * (h - padTop - padBottom);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${xOf(p.km).toFixed(1)},${yOf(p.alt).toFixed(1)}`).join(" ");
  const area = `${path} L${xOf(stage.distance)},${h-padBottom} L${xOf(0)},${h-padBottom} Z`;
  const altitudeLines = Array.from({ length: 7 }, (_, i) => {
    const alt = minAlt + (maxAlt - minAlt) * i / 6;
    const y = yOf(alt);
    return `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" class="profile-gridline"/><text x="6" y="${y+4}" class="svg-label alt-label">${Math.round(alt)} m</text>`;
  }).join("");
  const kmStep = stage.distance > 220 ? 20 : stage.distance > 120 ? 10 : 5;
  const kmLines = Array.from({ length: Math.floor(stage.distance / kmStep) + 1 }, (_, i) => {
    const km = i * kmStep, x = xOf(km);
    return `<line x1="${x}" y1="${padTop}" x2="${x}" y2="${h-padBottom}" class="profile-kmline"/><text x="${x-7}" y="${h-10}" class="svg-label alt-label">${km}</text>`;
  }).join("");
  const gradientBars = pts.slice(1).map((p, i) => {
    const prev = pts[i], x1 = xOf(prev.km), x2 = xOf(p.km), g = toNum(p.gradient, slopeAtKmV024(stage, p.km));
    const cls = g > 10 ? "g-extreme" : g > 7 ? "g-hard" : g > 4 ? "g-med" : g > 1 ? "g-up" : g < -3 ? "g-down" : "g-flat";
    return `<rect x="${x1}" y="${h-60}" width="${Math.max(1, x2-x1)}" height="18" class="gradient-bar ${cls}"><title>km ${p.km}: ${g.toFixed(1)}%</title></rect>`;
  }).join("");
  const climbLabels = (stage.climbs || []).map(c => {
    const start = Math.max(0, c.km - c.length), xs = xOf(start), xe = xOf(c.km), top = pts[Math.min(pts.length-1, Math.round(c.km))];
    return `<rect x="${xs}" y="${padTop}" width="${Math.max(2, xe-xs)}" height="${h-padTop-padBottom}" class="climb-band ${c.category === "HC" || c.category === "1" ? "hard" : ""}"/><line x1="${xs}" y1="${padTop}" x2="${xs}" y2="${h-padBottom}" class="climb-start-line"/><line x1="${xe}" y1="${padTop}" x2="${xe}" y2="${h-padBottom}" class="climb-line"/><circle cx="${xe}" cy="${yOf(top.alt)}" r="7" class="climb-dot"/><text x="${xs+5}" y="${padTop+14}" class="svg-label small-label">${esc(c.name)} · ${c.length} km · ${c.gradient}%</text><text x="${xe+7}" y="${Math.max(padTop+24,yOf(top.alt)-10)}" class="svg-label">${esc(c.category)} · ${Math.round(top.alt)} m</text>`;
  }).join("");
  const paveBands = (stage.paves || []).map(p => `<rect x="${xOf(p.from)}" y="${h-38}" width="${Math.max(2,xOf(p.to)-xOf(p.from))}" height="12" class="pave-band severity-${p.severity}"><title>${esc(p.name)} · ${p.to-p.from} km · severidad ${p.severity}</title></rect>`).join("");
  const groupMarks = (groups || []).map((g, i) => { const x = xOf(clamp(g.km,0,stage.distance)), y = padTop + 34 + i*26; return `<g><line x1="${x}" y1="${y+10}" x2="${x}" y2="${h-padBottom}" class="group-marker-line"/><circle cx="${x}" cy="${y}" r="9" class="group-dot ${g.cls}"/><text x="${x+13}" y="${y+4}" class="svg-label">${esc(g.label)} · ${g.count} · ${g.speed.toFixed(1)} km/h</text></g>`; }).join("");
  return `<div class="stage-profile-card pro-profile v024-profile"><div class="stage-title-row"><div><h2>${esc(stage.name)}</h2><p>${esc(stage.label)} · ${stage.distance} km · ${stage.elevation} m+ · ${pts.length} puntos · pendiente y superficie por km</p></div><div class="badge-row"><span class="badge">${stage.type.toUpperCase()}</span><span class="badge orange">Dif. ${stage.difficulty}</span><span class="badge blue">1 punto/km</span></div></div><div class="profile-svg"><svg viewBox="0 0 ${w} ${h}">${altitudeLines}${kmLines}${climbLabels}<path d="${area}" class="profile-area"/><path d="${path}" class="profile-line"/>${gradientBars}${paveBands}${groupMarks}</svg></div><div class="legend"><span><b class="gradient-bar g-flat"></b>Llano</span><span><b class="gradient-bar g-up"></b>1-4%</span><span><b class="gradient-bar g-med"></b>4-7%</span><span><b class="gradient-bar g-hard"></b>7-10%</span><span><b class="gradient-bar g-extreme"></b>&gt;10%</span><span><b class="gradient-bar g-down"></b>Descenso</span><span><b class="pave-key"></b>Pavé</span></div><div class="sector-grid">${stage.sectors.map((s,i)=>`<div class="sector-card"><strong>${i+1}. ${esc(s.name)}</strong><span>km ${s.from}-${s.to}</span><small>${esc(s.question)}</small></div>`).join("")}</div></div>`;
};

/* ============================================================
   21. HOME Y VERSIONADO FINAL
   ============================================================ */

const __v024_renderHome_base = renderHome;
renderHome = function() {
  ensureV024State();
  __v024_renderHome_base();
  const title = app.querySelector(".header h1");
  const subtitle = app.querySelector(".header p");
  if (title) title.textContent = "Cycling Manager Tour v0.24+";
  if (subtitle) subtitle.textContent = "Motor físico CP/W′ · grupos y formaciones · manager avanzado · telemetría · IA rival";
};

/* ============================================================
   22. ARRANQUE DE LA EXPANSIÓN
   ============================================================ */

ensureV024State();
Game.version = V024_VERSION;
renderHome();

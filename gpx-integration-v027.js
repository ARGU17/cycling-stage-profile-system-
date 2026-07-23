/* ============================================================
   CYCLING MANAGER TOUR v0.24 · GPX RUNTIME INTEGRATION
   Loaded after v024-expansion.js.
   - Real GPX gradients drive CP/W′ physics.
   - GPX stages use 250 m simulation substeps.
   - Interactive Radial-style profile and route visualization.
   ============================================================ */

const GPX_UI_STATE = {};
const GPX_RENDER_GROUPS = {};
const GPX_GRADE_COLORS = [
  { max: -9, color: "#1a4bff", label: "< -9%" },
  { max: -6, color: "#2c7cff", label: "-9 a -6%" },
  { max: -3, color: "#2bb2ff", label: "-6 a -3%" },
  { max: -1, color: "#24c6c6", label: "-3 a -1%" },
  { max: 1.5, color: "#14b81f", label: "-1 a 1.5%" },
  { max: 3, color: "#63cf15", label: "1.5 a 3%" },
  { max: 5, color: "#b5c718", label: "3 a 5%" },
  { max: 7, color: "#e4c625", label: "5 a 7%" },
  { max: 9, color: "#ee9430", label: "7 a 9%" },
  { max: Infinity, color: "#dd5a22", label: "> 9%" }
];

function gpxGradeColor(grade) {
  return GPX_GRADE_COLORS.find(band => grade <= band.max)?.color || "#14b81f";
}

function findStageByIdGpx(stageId) {
  for (const race of RACES) {
    const stage = race.stages.find(s => s.id === stageId);
    if (stage) return stage;
  }
  return null;
}

const __gpx_generateEnhancedProfilePoints = generateEnhancedProfilePointsV019;
generateEnhancedProfilePointsV019 = function(stage) {
  if (stage?.gpxAvailable && stage.profilePoints?.length) return stage.profilePoints;
  return __gpx_generateEnhancedProfilePoints(stage);
};

const __gpx_slopeAtKm = slopeAtKmV024;
slopeAtKmV024 = function(stage, km) {
  if (stage?.gpxAvailable) return gpxPointAtKm(stage, km)?.gradePct ?? 0;
  return __gpx_slopeAtKm(stage, km);
};

const __gpx_effectiveWind = effectiveWindV024;
effectiveWindV024 = function(stage, km, st) {
  if (!stage?.gpxAvailable) return __gpx_effectiveWind(stage, km, st);
  const point = gpxPointAtKm(stage, km);
  const wind = toNum(stage.weather?.wind, 0);
  const crosswind = toNum(stage.weather?.crosswind, 0);
  const windFromDeg = Number.isFinite(stage.weather?.windDirectionDeg)
    ? stage.weather.windDirectionDeg
    : (210 + stage.number * 37) % 360;
  const deltaRad = ((windFromDeg - point.bearingDeg) * Math.PI) / 180;
  const formation = formationByIdV024(st.formation || "middle");
  const headComponent = wind * Math.cos(deltaRad);
  const crossComponent = Math.abs(crosswind * Math.sin(deltaRad));
  return headComponent + crossComponent * 0.10 * formation.risk;
};

const __gpx_crosswindRisk = crosswindRiskAtKmV024;
crosswindRiskAtKmV024 = function(stage, km) {
  if (!stage?.gpxAvailable) return __gpx_crosswindRisk(stage, km);
  const point = gpxPointAtKm(stage, km);
  const cross = toNum(stage.weather?.crosswind, 0);
  const windFromDeg = Number.isFinite(stage.weather?.windDirectionDeg)
    ? stage.weather.windDirectionDeg
    : (210 + stage.number * 37) % 360;
  const deltaRad = ((windFromDeg - point.bearingDeg) * Math.PI) / 180;
  const exposure = Math.abs(Math.sin(deltaRad));
  const terrainShelter = Math.abs(point.gradePct) > 5 ? 0.82 : 1;
  return clamp((cross - 18) * 2.45 * exposure * terrainShelter + (stage.type === "flat" ? 12 : 0), 0, 100);
};

function gpxRunRoadSubsteps(stage, sector) {
  const step = GPX_STAGE_SIMULATION_STEP_KM;
  const epsilon = 1e-7;
  let km = sector.from;
  let lastWholeKm = -1;

  while (km < sector.to - epsilon) {
    const distance = Math.min(step, sector.to - km);
    const wholeKm = Math.floor(km + epsilon);
    const firstSubstepOfKm = wholeKm !== lastWholeKm;
    Game.live.v024.kilometer = km;

    if (firstSubstepOfKm) {
      processAttackQueueV024(stage, km);
      applyLongRangePlanV024(stage, km);
      updateEchelonsV024(stage, km);
    }

    simulateRoadKilometerV024(stage, sector, km, distance);

    if (firstSubstepOfKm) {
      updateAutobusV024(stage, km, distance);
      autoNutritionAtKmV024(stage, km);
      evaluateLiveAlertsV024(stage, km);
      lastWholeKm = wholeKm;
    }
    km += distance;
  }

  updateBreakawayGapFromTimesV024();
  applyRaceGroupSelection(stage, sector);
}

const __gpx_simulateRoadSectorV024 = simulateRoadSectorV024;
simulateRoadSectorV024 = function(stage, sector) {
  if (!stage?.gpxAvailable) return __gpx_simulateRoadSectorV024(stage, sector);
  return gpxRunRoadSubsteps(stage, sector);
};

const __gpx_simulateTTSectorV024 = simulateTTSectorV024;
simulateTTSectorV024 = function(stage, sector) {
  if (!stage?.gpxAvailable) return __gpx_simulateTTSectorV024(stage, sector);
  const step = GPX_STAGE_SIMULATION_STEP_KM;
  getRaceRiders().forEach(r => {
    const st = Game.live.states[r.id];
    if (!st) return;
    const effort = Game.riderEfforts[r.id] ?? r.defaultEffort;
    for (let km = sector.from; km < sector.to - 1e-7; km += step) {
      const distance = Math.min(step, sector.to - km);
      st.formation = "front";
      const order = getOrder("pull");
      const cap = riderSpeedCapacityV024(r, st, stage, km, effort, order, 1);
      const pacing = 1 + staffEffectAssignedV024("pacing", r.teamId, stage.id) * .002;
      const speed = cap.speed * pacing;
      const time = distance / speed * 3600;
      st.elapsed += time;
      st.raceTime += time;
      st.km = Math.min(stage.distance, st.km + distance);
      st.speed = speed;
      st.maxSpeed = Math.max(st.maxSpeed, speed);
      st.wkg = cap.power / r.weightKg;
      st.powerSum += cap.power;
      st.powerSqSum += cap.power ** 2;
      st.powerSamples++;
      st.maxPower = Math.max(st.maxPower, cap.power);
      updateWPrimeV024(r, st, cap.power, time);
      updateEnergyHydrationPhysicalV024(r, st, stage, km, cap.power, time, order, 0);
      appendRiderTelemetryV024(r, st, km, cap.grade, cap.power, speed);
      st.group = "CRI individual";
      st.groupId = `tt_${r.id}`;
    }
  });
};

const __gpx_simulateTTTSectorV024 = simulateTTTSectorV024;
simulateTTTSectorV024 = function(stage, sector) {
  if (!stage?.gpxAvailable) return __gpx_simulateTTTSectorV024(stage, sector);
  const intensity = byId(TTT_SETTINGS.relayIntensity, Game.tttRelayIntensity) || TTT_SETTINGS.relayIntensity[1];
  const relayLength = byId(TTT_SETTINGS.relayLength, Game.tttRelayLength) || TTT_SETTINGS.relayLength[1];
  const formation = byId(TTT_SETTINGS.formation, Game.tttFormation) || TTT_SETTINGS.formation[1];
  const step = GPX_STAGE_SIMULATION_STEP_KM;

  TEAMS.forEach(team => {
    let active = getTeamRiders(team.id).filter(r => Game.live.states[r.id] && !String(Game.live.states[r.id].groupId).startsWith("ttt_drop"));
    let substepIndex = 0;
    for (let km = sector.from; km < sector.to - 1e-7; km += step, substepIndex++) {
      const distance = Math.min(step, sector.to - km);
      if (active.length < 4) continue;
      const capacities = active.map((r, i) => {
        const st = Game.live.states[r.id];
        const baseEffort = Game.riderEfforts[r.id] ?? r.defaultEffort;
        const isPuller = i === (substepIndex % active.length);
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
        if (capacities.length > 4 && (deficit > .13 || x.st.energy < 10 || Math.random() < dropRisk * distance)) {
          x.st.groupId = `ttt_drop_${team.id}`;
          x.st.group = "Descolgado CRE";
          x.st.elapsed += teamTime + rnd(10, 35) * distance;
          x.st.raceTime += teamTime + rnd(10, 35) * distance;
        } else {
          x.st.groupId = `ttt_${team.id}`;
          x.st.group = `CRE ${team.name}`;
          x.st.elapsed += teamTime;
          x.st.raceTime += teamTime;
        }
        x.st.km = Math.min(stage.distance, x.st.km + distance);
        x.st.speed = teamSpeed;
        x.st.maxSpeed = Math.max(x.st.maxSpeed, teamSpeed);
        x.st.wkg = x.power / x.r.weightKg;
        x.st.powerSum += x.power;
        x.st.powerSqSum += x.power ** 2;
        x.st.powerSamples++;
        x.st.maxPower = Math.max(x.st.maxPower, x.power);
        if (x.isPuller) x.st.timePulling += teamTime;
        else x.st.timeDrafting += teamTime;
        updateWPrimeV024(x.r, x.st, x.power, teamTime);
        updateEnergyHydrationPhysicalV024(x.r, x.st, stage, km, x.power, teamTime, x.order, 88);
        appendRiderTelemetryV024(x.r, x.st, km, x.grade, x.power, teamSpeed);
      });
      active = active.filter(r => !String(Game.live.states[r.id].groupId).startsWith("ttt_drop"));
    }
  });
};

const __gpx_renderStageProfile = renderStageProfile;
renderStageProfile = function(stage, groups = []) {
  if (!stage?.gpxAvailable) return __gpx_renderStageProfile(stage, groups);
  GPX_RENDER_GROUPS[stage.id] = groups || [];
  const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
  const liveFrontKm = groups?.length ? Math.max(...groups.map(g => toNum(g.km, 0))) : 0;
  if (!ui.locked && liveFrontKm > 0) ui.cursorKm = liveFrontKm;

  const legend = GPX_GRADE_COLORS.map(b => `<span><i style="background:${b.color}"></i>${b.label}</span>`).join("");
  return `<div class="stage-profile-card gpx-stage-card" data-gpx-stage="${stage.id}">
    <div class="stage-title-row">
      <div>
        <h2>${esc(stage.name)}</h2>
        <p>${esc(stage.label)} · ${stage.distance.toFixed(2)} km · ${Math.round(stage.elevation)} m+ · ${stage.gpx.points.length.toLocaleString("es-ES")} muestras reales · física cada ${Math.round(GPX_STAGE_SIMULATION_STEP_KM*1000)} m</p>
      </div>
      <div class="badge-row">
        <span class="badge green">GPX REAL</span>
        <span class="badge">${stage.type.toUpperCase()}</span>
        <span class="badge orange">Dif. ${stage.difficulty}</span>
      </div>
    </div>

    <div class="gpx-dashboard">
      <div class="gpx-map-panel">
        <div class="gpx-panel-heading"><strong>Recorrido real</strong><span>Grupos sincronizados por distancia</span></div>
        <canvas class="gpx-route-canvas" data-stage-id="${stage.id}" aria-label="Mapa del recorrido GPX"></canvas>
      </div>
      <div class="gpx-profile-panel">
        <div class="gpx-readout">
          <div><span>Km</span><strong data-gpx-readout="km">0.0</strong></div>
          <div><span>A meta</span><strong data-gpx-readout="remaining">${stage.distance.toFixed(1)}</strong></div>
          <div><span>Altitud</span><strong data-gpx-readout="elevation">0 m</strong></div>
          <div><span>Pendiente</span><strong data-gpx-readout="grade">0.0%</strong></div>
        </div>
        <div class="gpx-canvas-wrap">
          <canvas class="gpx-profile-canvas" data-stage-id="${stage.id}" tabindex="0" aria-label="Perfil altimétrico GPX interactivo"></canvas>
          <div class="gpx-tooltip" data-gpx-tooltip></div>
        </div>
        <input class="gpx-scrubber" data-stage-id="${stage.id}" type="range" min="0" max="${stage.distance}" step="0.02" value="${ui.cursorKm}">
        <div class="gpx-gradient-legend">${legend}</div>
      </div>
    </div>

    <div class="sector-grid gpx-sector-grid">
      ${stage.sectors.map((s, i) => `<div class="sector-card">
        <strong>${i+1}. ${esc(s.name)}</strong>
        <span>km ${s.from.toFixed(1)}-${s.to.toFixed(1)} · ${s.gpx?.avgGradient >= 0 ? "+" : ""}${toNum(s.gpx?.avgGradient, 0).toFixed(1)}%</span>
        <small>${esc(s.question)}</small>
      </div>`).join("")}
    </div>
  </div>`;
};

function gpxCanvasSize(canvas, fallbackHeight) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, rect.width || canvas.parentElement?.clientWidth || 900);
  const height = Math.max(220, rect.height || fallbackHeight);
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function gpxProfileGeometry(stage, width, height) {
  const pad = { left: 52, right: 18, top: 30, bottom: 42 };
  const elevations = stage.gpx.points.map(p => p[1]);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  return {
    pad, minElevation, maxElevation, plotWidth, plotHeight,
    xForKm: km => pad.left + gpxClamp(km / stage.distance, 0, 1) * plotWidth,
    yForElevation: elevation => pad.top + (1 - (elevation - minElevation) / Math.max(1, maxElevation - minElevation)) * plotHeight
  };
}

function drawGpxProfile(canvas, stage) {
  const { ctx, width, height } = gpxCanvasSize(canvas, 360);
  const geom = gpxProfileGeometry(stage, width, height);
  const { pad, minElevation, maxElevation, plotWidth, plotHeight, xForKm, yForElevation } = geom;
  const points = stage.gpx.points;
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#102540");
  background.addColorStop(1, "#07111d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.13)";
  ctx.fillStyle = "rgba(226,232,240,.72)";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.setLineDash([5, 6]);
  for (let i = 0; i <= 4; i++) {
    const fraction = i / 4;
    const y = pad.top + fraction * plotHeight;
    const elevation = Math.round(maxElevation - fraction * (maxElevation - minElevation));
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.fillText(`${elevation} m`, 5, y - 5);
  }
  ctx.restore();

  // Profile silhouette clip.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pad.left, height - pad.bottom);
  for (let xPixel = 0; xPixel <= Math.ceil(plotWidth); xPixel++) {
    const km = (xPixel / plotWidth) * stage.distance;
    const p = gpxPointAtKm(stage, km);
    ctx.lineTo(pad.left + xPixel, yForElevation(p.elevationM));
  }
  ctx.lineTo(width - pad.right, height - pad.bottom);
  ctx.closePath();
  ctx.clip();

  for (let xPixel = 0; xPixel < Math.ceil(plotWidth); xPixel++) {
    const km = (xPixel / plotWidth) * stage.distance;
    const p = gpxPointAtKm(stage, km);
    ctx.fillStyle = gpxGradeColor(p.gradePct);
    ctx.fillRect(pad.left + xPixel, pad.top, 1.25, plotHeight + 1);
  }
  const shade = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
  shade.addColorStop(0, "rgba(255,255,255,.04)");
  shade.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = shade;
  ctx.fillRect(pad.left, pad.top, plotWidth, plotHeight);
  ctx.restore();

  // Profile outline.
  ctx.beginPath();
  for (let xPixel = 0; xPixel <= Math.ceil(plotWidth); xPixel++) {
    const km = (xPixel / plotWidth) * stage.distance;
    const p = gpxPointAtKm(stage, km);
    const x = pad.left + xPixel;
    const y = yForElevation(p.elevationM);
    if (xPixel === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = "rgba(240,248,255,.94)";
  ctx.lineWidth = 1.7;
  ctx.stroke();

  // Distance remaining labels, matching the Radial convention.
  ctx.fillStyle = "rgba(226,232,240,.72)";
  ctx.font = "12px Inter, system-ui, sans-serif";
  for (let i = 0; i <= 4; i++) {
    const fraction = i / 4;
    const x = pad.left + fraction * plotWidth;
    const remaining = stage.distance * (1 - fraction);
    ctx.fillText(i === 4 ? "0 m" : `${remaining.toFixed(0)} km`, x - 12, height - 24);
  }

  const groups = GPX_RENDER_GROUPS[stage.id] || [];
  groups.slice(0, 8).forEach((group, index) => {
    const x = xForKm(group.km);
    const color = group.cls === "break" ? "#f97316" :
      group.cls === "attack" ? "#a855f7" :
      group.cls === "fav" ? "#22c55e" :
      group.cls === "second" ? "#facc15" :
      group.cls === "dropped" ? "#ef4444" : "#38bdf8";
    ctx.beginPath();
    ctx.arc(x, pad.top + 10 + index * 15, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
  const cursor = gpxPointAtKm(stage, ui.cursorKm);
  const cursorX = xForKm(cursor.km);
  ctx.beginPath();
  ctx.moveTo(cursorX, pad.top - 4);
  ctx.lineTo(cursorX, height - pad.bottom);
  ctx.strokeStyle = "#d6e1ff";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cursorX, yForElevation(cursor.elevationM), 6.5, 0, Math.PI * 2);
  ctx.fillStyle = "#f7ff41";
  ctx.fill();
  ctx.strokeStyle = "#07111d";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const liveFrontKm = groups.length ? Math.max(...groups.map(g => toNum(g.km, 0))) : 0;
  if (liveFrontKm > 0 && Math.abs(liveFrontKm - cursor.km) > .1) {
    const liveX = xForKm(liveFrontKm);
    ctx.save();
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(liveX, pad.top);
    ctx.lineTo(liveX, height - pad.bottom);
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function gpxRouteProjection(stage, width, height) {
  const points = stage.gpx.points;
  const pad = 24;
  const meanLat = points.reduce((sum, p) => sum + p[3], 0) / points.length;
  const cosLat = Math.cos(meanLat * Math.PI / 180);
  const xs = points.map(p => p[4] * cosLat);
  const ys = points.map(p => p[3]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(
    (width - pad * 2) / Math.max(1e-9, maxX - minX),
    (height - pad * 2) / Math.max(1e-9, maxY - minY)
  );
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;
  return {
    project: p => [
      offsetX + (p[4] * cosLat - minX) * scale,
      height - offsetY - (p[3] - minY) * scale
    ]
  };
}

function drawRouteMarker(ctx, x, y, color, label, radius = 7) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#07111d";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (label) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    ctx.fillText(label, x + radius + 4, y - radius - 1);
  }
}

function drawGpxRoute(canvas, stage) {
  const { ctx, width, height } = gpxCanvasSize(canvas, 360);
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#17334c");
  gradient.addColorStop(1, "#0a1827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.lineWidth = 1;
  for (let x = 25; x < width; x += 70) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 25; y < height; y += 70) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  ctx.restore();

  const projection = gpxRouteProjection(stage, width, height);
  const points = stage.gpx.points;
  const sampleEvery = Math.max(1, Math.floor(points.length / 2500));
  const projected = [];
  for (let i = 0; i < points.length; i += sampleEvery) projected.push(projection.project(points[i]));
  projected.push(projection.project(points[points.length - 1]));

  ctx.beginPath();
  projected.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = "rgba(5,10,18,.78)";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  projected.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = "#4d72ff";
  ctx.lineWidth = 4.5;
  ctx.stroke();

  const groups = GPX_RENDER_GROUPS[stage.id] || [];
  const liveFrontKm = groups.length ? Math.max(...groups.map(g => toNum(g.km, 0))) : 0;
  if (liveFrontKm > 0) {
    const completedIndex = Math.round(gpxClamp(liveFrontKm / stage.distance, 0, 1) * (projected.length - 1));
    ctx.beginPath();
    projected.slice(0, completedIndex + 1).forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = "#2dd4bf";
    ctx.lineWidth = 4.5;
    ctx.stroke();
  }

  const start = projection.project(points[0]);
  const finish = projection.project(points[points.length - 1]);
  drawRouteMarker(ctx, start[0], start[1], "#ffffff", "Salida", 6.5);
  drawRouteMarker(ctx, finish[0], finish[1], "#facc15", "Meta", 7.5);

  groups.slice(0, 10).forEach((group, index) => {
    const p = gpxPointAtKm(stage, group.km);
    const xy = projection.project([p.distanceM, p.elevationM, p.gradePct, p.lat, p.lon]);
    const color = group.cls === "break" ? "#f97316" :
      group.cls === "attack" ? "#a855f7" :
      group.cls === "fav" ? "#22c55e" :
      group.cls === "second" ? "#facc15" :
      group.cls === "dropped" ? "#ef4444" : "#38bdf8";
    drawRouteMarker(ctx, xy[0], xy[1], color, `${group.label} · ${group.km.toFixed(1)} km`, 6);
  });

  const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
  const cursor = gpxPointAtKm(stage, ui.cursorKm);
  const cursorXY = projection.project([cursor.distanceM, cursor.elevationM, cursor.gradePct, cursor.lat, cursor.lon]);
  drawRouteMarker(ctx, cursorXY[0], cursorXY[1], "#f7ff41", "", 7);
}

function updateGpxReadout(stage) {
  const card = document.querySelector(`[data-gpx-stage="${stage.id}"]`);
  if (!card) return;
  const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
  const point = gpxPointAtKm(stage, ui.cursorKm);
  const set = (key, value) => {
    const el = card.querySelector(`[data-gpx-readout="${key}"]`);
    if (el) el.textContent = value;
  };
  set("km", `${point.km.toFixed(2)} km`);
  set("remaining", `${Math.max(0, stage.distance - point.km).toFixed(2)} km`);
  set("elevation", `${Math.round(point.elevationM)} m`);
  set("grade", `${point.gradePct >= 0 ? "+" : ""}${point.gradePct.toFixed(1)}%`);
  const gradeEl = card.querySelector(`[data-gpx-readout="grade"]`);
  if (gradeEl) gradeEl.style.color = gpxGradeColor(point.gradePct);
  const slider = card.querySelector(".gpx-scrubber");
  if (slider && document.activeElement !== slider) slider.value = ui.cursorKm;
}

function setGpxCursor(stage, km, lock = true, pointer = null) {
  const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
  ui.cursorKm = gpxClamp(km, 0, stage.distance);
  if (lock) ui.locked = true;
  updateGpxReadout(stage);
  document.querySelectorAll(`.gpx-profile-canvas[data-stage-id="${stage.id}"]`).forEach(c => drawGpxProfile(c, stage));
  document.querySelectorAll(`.gpx-route-canvas[data-stage-id="${stage.id}"]`).forEach(c => drawGpxRoute(c, stage));

  const card = document.querySelector(`[data-gpx-stage="${stage.id}"]`);
  const tooltip = card?.querySelector("[data-gpx-tooltip]");
  if (tooltip && pointer) {
    const p = gpxPointAtKm(stage, ui.cursorKm);
    tooltip.innerHTML = `<strong>km ${p.km.toFixed(2)}</strong><span>${Math.round(p.elevationM)} m</span><span style="color:${gpxGradeColor(p.gradePct)}">${p.gradePct >= 0 ? "+" : ""}${p.gradePct.toFixed(1)}%</span>`;
    tooltip.style.left = `${pointer.x}px`;
    tooltip.style.top = `${pointer.y}px`;
    tooltip.classList.add("visible");
  }
}

function bindGpxCanvas(canvas, stage, isProfile) {
  if (canvas.dataset.gpxBound === "1") return;
  canvas.dataset.gpxBound = "1";

  if (isProfile) {
    const move = event => {
      const rect = canvas.getBoundingClientRect();
      const geom = gpxProfileGeometry(stage, rect.width, rect.height);
      const x = gpxClamp(event.clientX - rect.left, geom.pad.left, rect.width - geom.pad.right);
      const km = ((x - geom.pad.left) / geom.plotWidth) * stage.distance;
      setGpxCursor(stage, km, true, { x: event.clientX - rect.left + 14, y: Math.max(70, event.clientY - rect.top - 8) });
    };
    canvas.addEventListener("pointerdown", event => {
      canvas.setPointerCapture?.(event.pointerId);
      move(event);
    });
    canvas.addEventListener("pointermove", event => {
      if (event.pointerType === "mouse" || canvas.hasPointerCapture?.(event.pointerId)) move(event);
    });
    canvas.addEventListener("wheel", event => {
      event.preventDefault();
      const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
      const increment = event.deltaY > 0 ? .25 : -.25;
      setGpxCursor(stage, ui.cursorKm + increment, true, { x: event.clientX - canvas.getBoundingClientRect().left + 14, y: 90 });
    }, { passive: false });
    canvas.addEventListener("mouseleave", () => {
      canvas.closest(".gpx-canvas-wrap")?.querySelector("[data-gpx-tooltip]")?.classList.remove("visible");
    });
    canvas.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const ui = GPX_UI_STATE[stage.id] ||= { cursorKm: 0, locked: false };
      setGpxCursor(stage, ui.cursorKm + (event.key === "ArrowRight" ? .1 : -.1), true);
    });
  } else {
    canvas.addEventListener("click", event => {
      // Find the closest projected GPX point to the click.
      const rect = canvas.getBoundingClientRect();
      const projection = gpxRouteProjection(stage, rect.width, rect.height);
      let closestKm = 0;
      let closestDistance = Infinity;
      const points = stage.gpx.points;
      const step = Math.max(1, Math.floor(points.length / 1200));
      for (let i = 0; i < points.length; i += step) {
        const [x, y] = projection.project(points[i]);
        const dx = x - (event.clientX - rect.left);
        const dy = y - (event.clientY - rect.top);
        const d2 = dx * dx + dy * dy;
        if (d2 < closestDistance) {
          closestDistance = d2;
          closestKm = points[i][0] / 1000;
        }
      }
      setGpxCursor(stage, closestKm, true);
    });
  }
}

function renderAllGpxVisuals() {
  document.querySelectorAll(".gpx-profile-canvas").forEach(canvas => {
    const stage = findStageByIdGpx(canvas.dataset.stageId);
    if (!stage) return;
    bindGpxCanvas(canvas, stage, true);
    drawGpxProfile(canvas, stage);
    updateGpxReadout(stage);
  });
  document.querySelectorAll(".gpx-route-canvas").forEach(canvas => {
    const stage = findStageByIdGpx(canvas.dataset.stageId);
    if (!stage) return;
    bindGpxCanvas(canvas, stage, false);
    drawGpxRoute(canvas, stage);
  });
  document.querySelectorAll(".gpx-scrubber").forEach(slider => {
    if (slider.dataset.gpxBound === "1") return;
    slider.dataset.gpxBound = "1";
    const stage = findStageByIdGpx(slider.dataset.stageId);
    slider.addEventListener("input", () => setGpxCursor(stage, Number(slider.value), true));
  });
}

let gpxRenderTimer = null;
function scheduleGpxVisualRender() {
  clearTimeout(gpxRenderTimer);
  gpxRenderTimer = setTimeout(renderAllGpxVisuals, 0);
}

const __gpx_renderRace = renderRace;
renderRace = function() {
  __gpx_renderRace();
  scheduleGpxVisualRender();
};

const __gpx_renderLive = renderLive;
renderLive = function() {
  __gpx_renderLive();
  scheduleGpxVisualRender();
};

if (typeof renderLiveBroadcastV019 === "function") {
  const __gpx_renderLiveBroadcast = renderLiveBroadcastV019;
  renderLiveBroadcastV019 = function() {
    __gpx_renderLiveBroadcast();
    scheduleGpxVisualRender();
  };
}

const __gpx_renderHome = renderHome;
renderHome = function() {
  __gpx_renderHome();
  // Preserve the v0.26 sequential wizard titles. Only annotate cards whose
  // active catalogue already contains native GPX geometry.
  [...app.querySelectorAll(".race-card")].forEach(card => {
    if (card.querySelector(".gpx-home-badge")) return;
    const text = card.textContent || "";
    const race = (typeof RACES !== "undefined" ? RACES : []).find(item => text.includes(item.name));
    if (!race || !(race.stages || []).some(stage => stage.gpxAvailable)) return;
    const count = race.stages.filter(stage => stage.gpxAvailable).length;
    card.insertAdjacentHTML("beforeend", `<span class="badge green gpx-home-badge">${count}/${race.stages.length} GPX</span>`);
  });
  scheduleGpxVisualRender();
};

window.addEventListener("resize", scheduleGpxVisualRender);
scheduleGpxVisualRender();

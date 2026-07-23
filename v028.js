/* ============================================================
   CYCLING MANAGER TOUR v0.28 · GRAPHITE PERFORMANCE UI
   Capa visual no destructiva sobre v0.27.
   Conserva íntegros datos, motor GPX, simulación y gestión.
   ============================================================ */

const V028_VERSION = "v0.28-graphite-performance";

function v028SvgIcon(name, size = 26) {
  const icons = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/><path d="M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h3a4 4 0 0 0 4-4V9a4 4 0 0 1 3-4"/>',
    mountain: '<path d="m3 20 6-10 4 6 2-3 6 7H3Z"/><path d="m7.7 12.2 1.3-2.2 1.4 2.1"/>',
    flag: '<path d="M5 22V4M5 5h11l-2 4 2 4H5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    team: '<path d="M4 20h16M6 20V9l6-5 6 5v11M9 20v-5h6v5"/>',
    cyclist: '<circle cx="7" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><circle cx="14" cy="5" r="2"/><path d="m11 8 3 3h4M10 9l-3 8M11 8l4 9M7 17l4-7"/>'
  };
  return `<svg class="v028-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.bolt}</svg>`;
}

function v028SafeId(value) {
  return String(value || "item").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function v028Initials(name) {
  return String(name || "CM").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function v028CountryFlag(country) {
  const map = {
    Spain:"🇪🇸", España:"🇪🇸", France:"🇫🇷", Francia:"🇫🇷", Italy:"🇮🇹", Italia:"🇮🇹",
    Belgium:"🇧🇪", Bélgica:"🇧🇪", Netherlands:"🇳🇱", "Países Bajos":"🇳🇱", Germany:"🇩🇪", Alemania:"🇩🇪",
    Denmark:"🇩🇰", Dinamarca:"🇩🇰", Norway:"🇳🇴", Noruega:"🇳🇴", Slovenia:"🇸🇮", Eslovenia:"🇸🇮",
    Australia:"🇦🇺", Canada:"🇨🇦", China:"🇨🇳", Switzerland:"🇨🇭", Suiza:"🇨🇭", Poland:"🇵🇱", Polonia:"🇵🇱",
    Bahrain:"🇧🇭", "United Arab Emirates":"🇦🇪", "Emiratos Árabes Unidos":"🇦🇪", USA:"🇺🇸", "United States":"🇺🇸",
    Colombia:"🇨🇴", Portugal:"🇵🇹", "United Kingdom":"🇬🇧", "Reino Unido":"🇬🇧", Kazakhstan:"🇰🇿", International:"🌐"
  };
  return map[country] || "🌐";
}

function v028LevelKey(level) {
  const value = String(level || "").toLowerCase();
  if (value.includes("world") || value === "wt") return "wt";
  if (value.includes("pro")) return "pro";
  if (value.includes("continental") || value.includes("conti")) return "continental";
  return "other";
}

function v028LevelLabel(level) {
  const key = v028LevelKey(level);
  return key === "wt" ? "WT" : key === "pro" ? "ProTeam" : key === "continental" ? "Continental" : String(level || "PRO");
}

function v028WizardProgress(activeStep = 1) {
  const labels = ["Modo", "Carrera", "Equipos", "Plantilla"];
  return `<nav class="v028-stepper" aria-label="Progreso de configuración">${labels.map((label, index) => {
    const step = index + 1;
    const state = step < activeStep ? "done" : step === activeStep ? "active" : "";
    return `<div class="v028-step ${state}"><span>${step < activeStep ? v028SvgIcon("check", 15) : step}</span><b>${label}</b></div>`;
  }).join("")}</nav>`;
}

function v028RaceCategory(race) {
  const name = String(race?.name || "").toLowerCase();
  const kind = String(race?.kind || race?.type || "").toLowerCase();
  const stages = race?.stages?.length || 1;
  if (isGrandTourFieldRaceV026(race)) return {key:"grand", label:"GRAN VUELTA"};
  if (name.includes("roubaix") || name.includes("flanders") || name.includes("sanremo") || name.includes("liège") || name.includes("liege") || kind.includes("monument")) return {key:"monument", label:"MONUMENTO"};
  if (stages > 1) return {key:"stage", label:"WORLD TOUR"};
  if ((race?.stages || []).some(stage => ["tt", "ttt"].includes(stage.type))) return {key:"tt", label:"CRONO"};
  return {key:"oneday", label:"CLÁSICA"};
}

function v028RaceTone(race) {
  const id = raceBaseIdV026(race).toLowerCase();
  const name = String(race?.name || "").toLowerCase();
  if (id === "tour" || name.includes("tour de france")) return {line:"#FFD60A", glow:"rgba(255,214,10,.35)", fill:"rgba(255,214,10,.13)"};
  if (id === "giro" || name.includes("giro")) return {line:"#FF4F9A", glow:"rgba(255,79,154,.35)", fill:"rgba(255,79,154,.13)"};
  if (id === "vuelta" || name.includes("vuelta")) return {line:"#FF453A", glow:"rgba(255,69,58,.35)", fill:"rgba(255,69,58,.13)"};
  if (name.includes("roubaix") || name.includes("flanders")) return {line:"#C68B48", glow:"rgba(198,139,72,.32)", fill:"rgba(198,139,72,.13)"};
  const palette = [
    {line:"#7C5CFC",glow:"rgba(124,92,252,.35)",fill:"rgba(124,92,252,.12)"},
    {line:"#0A84FF",glow:"rgba(10,132,255,.35)",fill:"rgba(10,132,255,.12)"},
    {line:"#30D158",glow:"rgba(48,209,88,.35)",fill:"rgba(48,209,88,.12)"},
    {line:"#64D2FF",glow:"rgba(100,210,255,.35)",fill:"rgba(100,210,255,.12)"},
    {line:"#FF9F0A",glow:"rgba(255,159,10,.35)",fill:"rgba(255,159,10,.12)"}
  ];
  let hash = 0;
  for (const char of String(race?.id || race?.name || "race")) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function v028DateLabel(value) {
  const raw = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00`);
    return new Intl.DateTimeFormat("es-ES", {day:"2-digit", month:"short"}).format(date).replace(".", "").toUpperCase();
  }
  return raw.toUpperCase();
}

function v028RaceDistance(race) {
  return Math.round((race?.stages || []).reduce((sum, stage) => sum + toNum(stage.distance, 0), 0));
}

function v028ProfileSource(race) {
  const stages = race?.stages || [];
  if (!stages.length) return [{alt:0},{alt:10},{alt:3}];
  const collected = [];
  stages.forEach((stage, stageIndex) => {
    const points = Array.isArray(stage.profilePoints) && stage.profilePoints.length > 2
      ? stage.profilePoints
      : [{alt:0},{alt:stage.type === "mountain" ? 90 : stage.type === "hilly" ? 45 : 12},{alt:stage.finalClimb ? 95 : 4}];
    const samples = Math.min(18, Math.max(5, Math.round(70 / Math.max(1, stages.length))));
    for (let i = 0; i < samples; i++) {
      const point = points[Math.round(i * (points.length - 1) / Math.max(1, samples - 1))];
      collected.push({alt:toNum(point?.alt ?? point?.ele, 0) + stageIndex * 1.5});
    }
  });
  return collected.slice(0, 120);
}

function v028MiniProfile(race) {
  const tone = v028RaceTone(race);
  const source = v028ProfileSource(race);
  const width = 320, height = 74, baseline = 68;
  const values = source.map(point => toNum(point.alt, 0));
  const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
  const coords = values.map((alt, index) => {
    const x = index * width / Math.max(1, values.length - 1);
    const y = 58 - ((alt - min) / range) * 48;
    return [x, y];
  });
  const line = coords.map(([x,y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${baseline} L0,${baseline} Z`;
  const id = `profile_${v028SafeId(race?.id || race?.name)}`;
  return `<svg class="v028-race-profile" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tone.line}" stop-opacity=".42"/><stop offset="1" stop-color="${tone.line}" stop-opacity="0"/></linearGradient><filter id="${id}_glow"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="${area}" fill="url(#${id})"/><path d="${line}" fill="none" stroke="${tone.line}" stroke-width="2.4" filter="url(#${id}_glow)" vector-effect="non-scaling-stroke"/></svg>`;
}

function v028RiderAvatar(rider, index = 0, compact = false) {
  const palettes = ["#335CFF", "#FF714A", "#36C58C", "#C557FF", "#F5A623", "#26A7E8", "#E7507B"];
  const color = palettes[(String(rider?.id || rider?.name || index).length + index) % palettes.length];
  return `<span class="v028-avatar ${compact ? "compact" : ""}" style="--avatar:${color}" title="${esc(rider?.name || "Corredor")}"><i>${esc(v028Initials(rider?.name))}</i></span>`;
}

function v028AvatarStack(riders, total) {
  const visible = (riders || []).slice(0, 5);
  return `<div class="v028-avatar-stack">${visible.map((rider, index) => v028RiderAvatar(rider, index, true)).join("")}${total > visible.length ? `<span class="v028-avatar-more">+${total - visible.length}</span>` : ""}</div>`;
}

function v028JerseySvg(team) {
  const visual = team.visual || generatedVisualV025(team.name, team.season || 2026);
  const id = v028SafeId(`${team.id}_${team.season || 2026}`);
  const logo = esc(visual.logoText || String(team.name || "TEAM").split(/\s+/).slice(0,2).map(x=>x[0]).join(""));
  return `<div class="v028-jersey-stage"><svg class="v028-jersey-svg" viewBox="0 0 220 190" role="img" aria-label="Maillot de ${esc(team.displayName || team.name)}"><defs><linearGradient id="${id}_body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${visual.primary}"/><stop offset=".58" stop-color="${visual.secondary}"/><stop offset="1" stop-color="${visual.primary}"/></linearGradient><linearGradient id="${id}_shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".34" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".09"/></linearGradient><filter id="${id}_shadow"><feDropShadow dx="0" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".5"/></filter><clipPath id="${id}_clip"><path d="M71 30 91 17h38l20 13 35 15-16 40-21-8v92H73V77l-21 8-16-40 35-15Z"/></clipPath></defs><g filter="url(#${id}_shadow)"><path d="M71 30 91 17h38l20 13 35 15-16 40-21-8v92H73V77l-21 8-16-40 35-15Z" fill="url(#${id}_body)" stroke="rgba(255,255,255,.34)" stroke-width="2"/><g clip-path="url(#${id}_clip)"><path d="M57 54 164 111" stroke="${visual.accent}" stroke-width="18" opacity=".82"/><path d="M65 112 158 63" stroke="${visual.accent}" stroke-width="8" opacity=".58"/><rect x="0" y="0" width="220" height="190" fill="url(#${id}_shine)"/></g><path d="M91 17q19 25 38 0" fill="#0d1117" stroke="rgba(255,255,255,.28)" stroke-width="2"/><path d="M74 77h72" stroke="rgba(255,255,255,.16)"/><text x="110" y="91" text-anchor="middle" fill="#fff" font-size="22" font-weight="900" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">${logo}</text><text x="110" y="111" text-anchor="middle" fill="#fff" fill-opacity=".9" font-size="8" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">${esc(String(team.displayName || team.name).slice(0,28))}</text></g></svg></div>`;
}

renderJersey = function(team) {
  return v028JerseySvg(team);
};

function v028RaceCard(race, selected, season) {
  const category = v028RaceCategory(race);
  const tone = v028RaceTone(race);
  const distance = v028RaceDistance(race);
  const stageCount = race.stages?.length || 1;
  const action = season
    ? `toggleSeasonRaceV026('${race.id}',this.checked)`
    : `chooseSingleRaceV026('${race.id}')`;
  const content = `<div class="v028-race-top"><span class="v028-race-date">${esc(v028DateLabel(race.date || race.season || ""))}</span><span class="v028-category ${category.key}">${category.label}</span></div><strong class="v028-race-name">${esc(race.name)}</strong><div class="v028-race-meta"><span>${stageCount} etapa${stageCount === 1 ? "" : "s"}</span><i>·</i><span>${distance.toLocaleString("es-ES")} km</span></div><div class="v028-race-limit">${isGrandTourFieldRaceV026(race) ? "22 equipos" : "máx. 25 equipos"}</div>${v028MiniProfile(race)}<span class="v028-card-arrow" style="--tone:${tone.line}">${v028SvgIcon(selected ? "check" : "arrow", 20)}</span>`;
  if (season) return `<label class="v028-race-card ${selected ? "selected" : ""}" style="--race-tone:${tone.line};--race-fill:${tone.fill};--race-glow:${tone.glow}"><input type="checkbox" ${selected ? "checked" : ""} onchange="${action}">${content}</label>`;
  return `<button class="v028-race-card ${selected ? "selected" : ""}" style="--race-tone:${tone.line};--race-fill:${tone.fill};--race-glow:${tone.glow}" onclick="${action}">${content}</button>`;
}

function v028TeamCard(team, riders, selected = false, fieldMode = false) {
  const visual = team.visual || generatedVisualV025(team.name, team.season || 2026);
  const level = v028LevelLabel(team.level);
  const strength = Math.round(teamStrengthV026(team) / 10);
  const body = `<div class="v028-team-top"><span class="v028-level-badge ${v028LevelKey(team.level)}">${esc(level)}</span><span class="v028-year-badge">${team.season || 2026}</span>${selected ? `<span class="v028-selected-check">${v028SvgIcon("check", 15)}</span>` : ""}</div>${renderJersey({...team, visual})}<div class="v028-team-copy"><strong>${esc(team.displayName || team.name)}</strong><span>${v028CountryFlag(team.country)} ${esc(team.country || "International")}</span></div><div class="v028-team-stats"><span>${riders.length} corredores</span><span>Fuerza ${strength}</span></div>${v028AvatarStack(riders, riders.length)}<span class="v028-card-arrow">${v028SvgIcon(selected ? "check" : "arrow", 20)}</span>`;
  if (fieldMode) return body;
  return `<button class="v028-team-card ${selected ? "selected" : ""}" style="--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-accent:${visual.accent}" onclick="chooseManagedTeamV028('${team.id}')">${body}</button>`;
}

wizardHeaderV026 = function(title, subtitle, backAction = "") {
  return `<header class="v028-wizard-header"><div class="v028-header-main">${backAction ? `<button class="v028-back-button" onclick="${backAction}" aria-label="Atrás">${v028SvgIcon("back", 17)}<span>Atrás</span></button>` : ""}<div><span class="v028-brandline">CYCLING MANAGER <b>TOUR</b> <em>V0.28</em></span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div></div><div class="v028-header-actions"><button class="secondary" onclick="loadGame()">Cargar partida</button><button class="danger" onclick="clearSave()">Borrar guardado</button></div></header>`;
};

renderLoadingV026 = function() {
  const w = ensureWizardV026();
  return `${wizardHeaderV026("Preparando base de datos", "Cargando equipos, corredores, calendarios y perfiles GPX…")}<section class="v028-loading-card"><div class="spinner"></div><div><strong>Procesando ${w.selectedYears?.join(", ") || w.selectedYear}</strong><span>La simulación y sus módulos de gestión permanecen activos.</span></div></section>`;
};

renderModeStepV026 = function() {
  const cards = [
    {mode:"single", number:"01", icon:"users", title:"Carrera individual", text:"Una prueba con equipos del mismo año."},
    {mode:"season", number:"02", icon:"trophy", title:"Temporada histórica", text:"Selecciona una o varias carreras y encadénalas."},
    {mode:"special-single", number:"03", icon:"calendar", title:"Carrera multi-anual", text:"Enfrenta equipos de años distintos.", special:true},
    {mode:"special-season", number:"04", icon:"layers", title:"Temporada multi-anual", text:"Calendario completo entre generaciones.", special:true}
  ];
  return `${wizardHeaderV026("¿Qué tipo de juego quieres iniciar?", "Selecciona primero el formato. Esta ventana desaparecerá al avanzar.")}<main class="v028-wizard-stage">${v028WizardProgress(1)}<section class="v028-mode-grid">${cards.map(card => `<button class="v028-mode-card ${card.special ? "special" : ""}" onclick="chooseGameModeV026('${card.mode}')">${card.special ? '<span class="v028-special-label">MULTI-ERA</span>' : ""}<span class="v028-mode-number">${card.number}</span><span class="v028-mode-icon">${v028SvgIcon(card.icon, 36)}</span><strong>${card.title}</strong><small>${card.text}</small><span class="v028-mode-arrow">${v028SvgIcon("arrow", 25)}</span></button>`).join("")}</section><section class="v028-feature-strip"><div>${v028SvgIcon("route",22)}<span><b>Stage Lab GPX</b> perfiles y carreteras reales</span></div><div>${v028SvgIcon("bolt",22)}<span><b>Motor CP/W′</b> simulación física avanzada</span></div><div>${v028SvgIcon("team",22)}<span><b>Director Suite</b> staff, mercado e infraestructura</span></div></section></main>`;
};

function setV028RaceSearch(value) {
  const w = ensureWizardV026();
  w.v028RaceSearch = value;
  renderHome();
}

function setV028RaceFilter(value) {
  const w = ensureWizardV026();
  w.v028RaceFilter = value;
  renderHome();
}

function v028VisibleRaces() {
  const w = ensureWizardV026();
  const search = String(w.v028RaceSearch || "").trim().toLowerCase();
  const filter = w.v028RaceFilter || "all";
  return V026Runtime.catalogRaces.filter(race => {
    const category = v028RaceCategory(race).key;
    const searchable = `${race.name} ${race.country || ""} ${race.date || ""}`.toLowerCase();
    return (!search || searchable.includes(search)) && (filter === "all" || category === filter || (filter === "stage" && (race.stages?.length || 1) > 1));
  });
}

renderCompetitionStepV026 = function() {
  const w = ensureWizardV026();
  const special = w.mode.startsWith("special");
  const season = w.mode.includes("season");
  const available = availableHistoricalYearsV025();
  const visibleRaces = v028VisibleRaces();
  const back = "resetWizardV026();renderHome()";
  const yearPanel = special
    ? `<section class="v028-config-card"><div class="v028-section-heading"><div><span class="v028-kicker">MULTI-ERA</span><h2>Años incluidos</h2><p>Selecciona las generaciones que formarán el pelotón.</p></div><span class="v028-count-pill">${w.selectedYears.length} años</span></div><div class="v028-year-grid">${allHistoricalYearsV025().map(year => `<label class="v028-year-chip ${available.includes(year) ? "ready" : "missing"} ${w.selectedYears.includes(year) ? "selected" : ""}"><input type="checkbox" ${w.selectedYears.includes(year) ? "checked" : ""} ${available.includes(year) ? "" : "disabled"} onchange="toggleWizardYearV026(${year},this.checked)"><span>${year}</span></label>`).join("")}</div><div class="v028-config-grid"><label><span>Calendario anfitrión</span><select onchange="setSpecialHostYearV026(Number(this.value))">${w.selectedYears.map(year => `<option value="${year}" ${w.hostYear === year ? "selected" : ""}>${year}</option>`).join("")}</select></label><label><span>Comparación entre épocas</span><select onchange="Game.v026.wizard.normalization=this.value"><option value="equalized" ${w.normalization === "equalized" ? "selected" : ""}>Capacidades igualadas</option><option value="authentic" ${w.normalization === "authentic" ? "selected" : ""}>Tecnología de época</option></select></label></div></section>`
    : `<section class="v028-config-card v028-season-selector"><label><span>Temporada</span><select onchange="setWizardYearV026(Number(this.value))">${allHistoricalYearsV025().map(year => { const entry = manifestEntryV025(year); return `<option value="${year}" ${w.selectedYear === year ? "selected" : ""}>${year} · ${entry?.teamCount || "?"} equipos</option>`; }).join("")}</select></label><div class="v028-dataset-summary"><strong>${V026Runtime.catalogTeams.length} equipos · ${V026Runtime.catalogRiders.length} corredores</strong><span>${w.selectedYear === 2026 ? "Base completa v0.24 restaurada" : "Pack histórico anual cargado"}</span></div></section>`;
  return `${wizardHeaderV026(season ? "¿Qué carreras formarán la temporada?" : "¿Qué carrera quieres disputar?", special ? "Selecciona años y calendario anfitrión. Después configurarás el pelotón." : "Selecciona el año y después la competición.", back)}<main class="v028-wizard-stage">${v028WizardProgress(2)}${yearPanel}<section class="v028-races-section"><div class="v028-section-heading"><div><h2>${season ? "Calendario seleccionable" : "Carreras disponibles"}</h2><p>${season ? "Marca las competiciones que quieras encadenar." : "Solo se disputará la prueba elegida."}</p></div>${season ? `<div class="button-row"><button class="secondary" onclick="selectAllSeasonRacesV026(true)">Todas</button><button class="secondary" onclick="selectAllSeasonRacesV026(false)">Ninguna</button></div>` : ""}</div><div class="v028-toolbar"><label class="v028-search">${v028SvgIcon("search",17)}<input value="${esc(w.v028RaceSearch || "")}" oninput="setV028RaceSearch(this.value)" placeholder="Buscar carrera…"></label><div class="v028-filter-pills"><button class="${(w.v028RaceFilter || "all") === "all" ? "active" : ""}" onclick="setV028RaceFilter('all')">Todas</button><button class="${w.v028RaceFilter === "stage" ? "active" : ""}" onclick="setV028RaceFilter('stage')">Vueltas</button><button class="${w.v028RaceFilter === "grand" ? "active" : ""}" onclick="setV028RaceFilter('grand')">Grandes vueltas</button><button class="${w.v028RaceFilter === "monument" ? "active" : ""}" onclick="setV028RaceFilter('monument')">Monumentos</button></div></div><div class="v028-race-grid">${visibleRaces.map(race => v028RaceCard(race, w.selectedRaceIds.includes(race.id), season)).join("") || '<div class="empty-state">No hay carreras con estos filtros.</div>'}</div><footer class="v028-wizard-footer"><span><b>${w.selectedRaceIds.length}</b> carrera${w.selectedRaceIds.length === 1 ? "" : "s"} seleccionada${w.selectedRaceIds.length === 1 ? "" : "s"}</span><button onclick="continueCompetitionV026()">Continuar ${v028SvgIcon("arrow",18)}</button></footer></section></main>`;
};

renderFieldStepV026 = function() {
  const w = ensureWizardV026();
  const limit = fieldLimitV026();
  const selected = new Set(w.selectedFieldTeamIds);
  const grouped = {};
  V026Runtime.catalogTeams.forEach(team => (grouped[team.season || 2026] ||= []).push(team));
  return `${wizardHeaderV026("Selecciona el pelotón multi-anual", `Elige entre 2 y ${limit} equipos. Los calendarios con Tour, Giro o Vuelta quedan limitados a 22.`, "Game.v026.wizard.step='competition';renderHome()")}<main class="v028-wizard-stage">${v028WizardProgress(3)}<section class="v028-field-toolbar"><div><span class="v028-kicker">PELOTÓN CONFIRMADO</span><strong>${selected.size}<small> / ${limit} equipos</small></strong><p>Años activos: ${w.selectedYears.join(", ")}</p></div><div class="button-row"><button class="secondary" onclick="autoFieldV026()">Selección equilibrada</button><button class="secondary" onclick="clearFieldV026()">Vaciar</button><button onclick="confirmFieldV026()">Confirmar pelotón ${v028SvgIcon("arrow",18)}</button></div></section>${Object.entries(grouped).sort((a,b) => Number(a[0]) - Number(b[0])).map(([year, teams]) => `<section class="v028-year-team-section"><div class="v028-section-heading"><div><span class="v028-kicker">TEMPORADA</span><h2>${year}</h2></div><span class="v028-count-pill">${teams.length} equipos</span></div><div class="v028-team-grid">${teams.sort((a,b) => teamStrengthV026(b) - teamStrengthV026(a)).map(team => { const riders = V026Runtime.catalogRiders.filter(rider => rider.teamId === team.id).sort((a,b) => b.base - a.base); const visual = team.visual || generatedVisualV025(team.name, team.season || 2026); return `<label class="v028-team-card v028-field-card ${selected.has(team.id) ? "selected" : ""}" style="--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-accent:${visual.accent}"><input type="checkbox" ${selected.has(team.id) ? "checked" : ""} onchange="toggleFieldTeamV026('${team.id}',this.checked)">${v028TeamCard(team, riders, selected.has(team.id), true)}</label>`; }).join("")}</div></section>`).join("")}</main>`;
};

function setV028TeamLevelFilter(value) {
  const w = ensureWizardV026();
  w.v028TeamLevelFilter = value;
  renderHome();
}

filteredWizardTeamsV026 = function() {
  const w = ensureWizardV026();
  const query = String(w.teamSearch || "").toLowerCase();
  const allowed = w.mode.startsWith("special") ? new Set(w.selectedFieldTeamIds) : null;
  const filter = w.v028TeamLevelFilter || "all";
  return V026Runtime.catalogTeams.filter(team => {
    const matchesAllowed = !allowed || allowed.has(team.id);
    const matchesSearch = !query || `${team.name} ${team.displayName || ""} ${team.country || ""} ${team.season || ""}`.toLowerCase().includes(query);
    const matchesLevel = filter === "all" || v028LevelKey(team.level) === filter;
    return matchesAllowed && matchesSearch && matchesLevel;
  });
};

function chooseManagedTeamV028(teamId) {
  const w = ensureWizardV026();
  if (!V026Runtime.catalogTeams.some(team => team.id === teamId)) return toast("Equipo no disponible");
  w.selectedManagedTeamId = teamId;
  renderHome();
}

function confirmManagedTeamV028() {
  const w = ensureWizardV026();
  if (!w.selectedManagedTeamId) return toast("Selecciona el equipo que vas a gestionar");
  selectTeam(w.selectedManagedTeamId);
}

renderTeamStepV026 = function() {
  const w = ensureWizardV026();
  const teams = filteredWizardTeamsV026();
  const limit = fieldLimitV026();
  const selectedId = w.selectedManagedTeamId;
  const selectedTeam = V026Runtime.catalogTeams.find(team => team.id === selectedId);
  return `${wizardHeaderV026("Elige el equipo que vas a gestionar", `${w.mode.startsWith("special") ? teams.length : V026Runtime.catalogTeams.length} equipos disponibles. La carrera tendrá como máximo ${limit} equipos.`, `Game.v026.wizard.step='${w.mode.startsWith("special") ? "field" : "competition"}';renderHome()`)}<main class="v028-wizard-stage">${v028WizardProgress(3)}<section class="v028-toolbar v028-team-toolbar"><label class="v028-search">${v028SvgIcon("search",17)}<input value="${esc(w.teamSearch || "")}" oninput="setWizardTeamSearchV026(this.value)" placeholder="Buscar equipo…"></label><div class="v028-filter-pills"><button class="${(w.v028TeamLevelFilter || "all") === "wt" ? "active" : ""}" onclick="setV028TeamLevelFilter('wt')">WT</button><button class="${w.v028TeamLevelFilter === "pro" ? "active" : ""}" onclick="setV028TeamLevelFilter('pro')">ProTeam</button><button class="${w.v028TeamLevelFilter === "continental" ? "active" : ""}" onclick="setV028TeamLevelFilter('continental')">Continental</button><button class="${(w.v028TeamLevelFilter || "all") === "all" ? "active" : ""}" onclick="setV028TeamLevelFilter('all')">Todos</button></div></section><section class="v028-team-grid">${teams.map(team => { const riders = V026Runtime.catalogRiders.filter(rider => rider.teamId === team.id).sort((a,b) => b.base - a.base); return v028TeamCard(team, riders, team.id === selectedId); }).join("") || '<div class="empty-state">No hay equipos con estos filtros.</div>'}</section><footer class="v028-wizard-footer v028-sticky-footer"><span>${selectedTeam ? `<b>1</b> equipo seleccionado · ${esc(selectedTeam.displayName || selectedTeam.name)}` : "Selecciona un equipo para continuar"}</span><button ${selectedTeam ? "" : "disabled"} onclick="confirmManagedTeamV028()">Continuar ${v028SvgIcon("arrow",18)}</button></footer></main>`;
};

renderRosterCard = function(rider) {
  const selected = Game.pendingRosterIds.includes(rider.id);
  const stats = rider.stats || {};
  const archive = rider.archivalReserve ? `<span class="v028-tag archive">Reserva ${rider.sourceSeason || "archivo"}</span>` : "";
  const skills = [
    ["MON", toNum(stats.mountain, 50)], ["CRI", toNum(stats.tt, 50)], ["SPR", toNum(stats.sprint, 50)], ["LLA", toNum(stats.flat, 50)]
  ];
  return `<button class="v028-rider-card ${selected ? "selected" : ""}" onclick="toggleRoster('${rider.id}')"><div class="v028-rider-head">${v028RiderAvatar(rider, 0)}<div><strong>${esc(rider.name)}</strong><span>${v028CountryFlag(rider.nationality)} ${esc(rider.nationality || "International")} · ${rider.age || "—"} años</span></div><span class="v028-roster-check">${selected ? v028SvgIcon("check", 17) : ""}</span></div><div class="v028-rider-badges"><span>${esc(rider.role || "Corredor")}</span><b>BASE ${rider.base}</b><em>FORMA ${Math.round(toNum(rider.form, 80))}</em>${archive}</div><div class="v028-skill-grid">${skills.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong><i><b style="width:${Math.max(0, Math.min(100, value))}%"></b></i></div>`).join("")}</div></button>`;
};

renderRosterSelection = function() {
  const team = getTeam(Game.selectedTeamId);
  const race = getRace();
  const riders = getFullTeamRiders(Game.selectedTeamId).slice().sort((a,b) => b.base - a.base);
  const required = historicalRosterSizeV025(Game.selectedTeamId);
  const reserveCount = riders.filter(rider => rider.archivalReserve).length;
  const visual = team.visual || generatedVisualV025(team.name, team.season || 2026);
  app.innerHTML = `<header class="v028-wizard-header"><div class="v028-header-main"><button class="v028-back-button" onclick="backToTeamSelectionV026()">${v028SvgIcon("back",17)}<span>Equipos</span></button><div><span class="v028-brandline">CYCLING MANAGER <b>TOUR</b> <em>V0.28</em></span><h1>Selecciona ${required} corredores</h1><p>${esc(team.name)} · ${esc(race.name)} · ${TEAMS.length} equipos participantes</p></div></div><div class="v028-header-actions"><button class="secondary" onclick="saveGame()">Guardar</button><button id="confirm-roster-button" onclick="confirmRoster()">Confirmar e iniciar ${v028SvgIcon("arrow",18)}</button></div></header><main class="v028-wizard-stage">${v028WizardProgress(4)}<section class="v028-roster-summary" style="--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-accent:${visual.accent}"><div class="v028-roster-team">${renderJersey({...team,visual})}<div><span class="v028-kicker">CONVOCATORIA</span><strong>${esc(team.displayName || team.name)}</strong><p>${required === ROSTER_SIZE ? "Bloque completo de ocho corredores" : `Archivo histórico: ${required} corredores disponibles`}${reserveCount ? ` · ${reserveCount} reservas de archivo` : ""}</p></div></div><div class="v028-roster-counter"><strong>${Game.pendingRosterIds.length}<small> / ${required}</small></strong><span>seleccionados</span></div><div class="v028-selected-riders">${Game.pendingRosterIds.map((id,index) => { const rider = getRider(id); return `<span>${v028RiderAvatar(rider,index,true)}<b>${esc(rider.name)}</b></span>`; }).join("")}</div></section><section class="v028-roster-section"><div class="v028-section-heading"><div><h2>Plantilla completa</h2><p>Combina líderes, gregarios y especialistas según el perfil del evento.</p></div><span class="v028-count-pill">${riders.length} corredores</span></div><div class="v028-roster-grid">${riders.map(renderRosterCard).join("")}</div></section></main>`;
};


function decorateV028Interface() {
  document.title = "Cycling Manager Tour v0.28 · Graphite Performance";
  document.querySelectorAll?.(".v027-version-chip").forEach?.(node => node.remove());
  const header = document.querySelector?.("#app .header");
  if (header && !header.querySelector?.(".v028-version-chip")) {
    const chip = document.createElement("span");
    chip.className = "v028-version-chip";
    chip.textContent = "v0.28 · GRAPHITE · GPX 250 m";
    (header.querySelector?.(".top-actions") || header).appendChild(chip);
  }
}

/* El observador heredado de v0.27 resuelve esta función de forma dinámica. */
if (typeof decorateV027Interface === "function") decorateV027Interface = decorateV028Interface;

/* Marca de versión y clase de tema. */
document.documentElement?.classList?.add("v028-graphite");
document.body?.classList?.add("v028-ui");
Game.version = V028_VERSION;
decorateV028Interface();

/* Re-renderiza el paso actual para aplicar la nueva capa visual sin tocar el estado. */
if (!Game.selectedTeamId || !Game.rosterLocked) {
  try { renderHome(); } catch (error) { console.warn("v0.28 UI render deferred", error); }
}

function v028Diagnostics() {
  return {
    version: V028_VERSION,
    inheritedEngine: typeof v027Diagnostics === "function" ? v027Diagnostics() : null,
    teams2026: typeof FULL_2026_PACK_V026 !== "undefined" ? FULL_2026_PACK_V026.teams.length : null,
    riders2026: typeof FULL_2026_PACK_V026 !== "undefined" ? FULL_2026_PACK_V026.riders.length : null,
    staffMarket: typeof STAFF_MARKET_V026 !== "undefined" ? STAFF_MARKET_V026.length : null,
    youthMarket: typeof YOUTH_MARKET_V026 !== "undefined" ? YOUTH_MARKET_V026.length : null,
    stageLab: typeof renderStageLabSetup === "function",
    graphiteUI: true
  };
}

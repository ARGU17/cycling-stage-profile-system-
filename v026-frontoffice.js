/* ============================================================
   CYCLING MANAGER TOUR v0.26 — ASISTENTE DE INICIO
   Flujo secuencial: modo → carrera/calendario → equipos multi-era →
   equipo gestionado → convocatoria. Limita el pelotón a 25 equipos,
   o 22 cuando el calendario incluye Giro, Tour o Vuelta.
   ============================================================ */

const V026_VERSION = "v0.26-director-suite";
const V026_SAVE_KEY = "cyclingManager_v026_director_suite";
const V026Runtime = {catalogTeams:[],catalogRiders:[],catalogRaces:[],packYears:[],teamSearch:"",loading:false,lastError:null};

function full2026PackV026() {
  return normalizePackV025({
    season:2026,
    teams:clone(HistoricalV025.baseTeams),
    riders:clone(HistoricalV025.baseRiders),
    calendar:clone(HistoricalV025.baseRaces),
    completeness:{status:"complete-simulator-v024",teamCount:HistoricalV025.baseTeams.length,riderCount:HistoricalV025.baseRiders.length},
    source:{provider:"Cycling Manager v0.24 full database",status:"full simulator roster"}
  });
}
const FULL_2026_PACK_V026 = full2026PackV026();
HistoricalV025.packCache[2026] = FULL_2026_PACK_V026;
const loadHistoricalPackV025BaseV026 = loadHistoricalPackV025;
loadHistoricalPackV025 = async function(year) { return Number(year)===2026 ? FULL_2026_PACK_V026 : loadHistoricalPackV025BaseV026(year); };

function ensureWizardV026() {
  Game.v026 ||= {};
  Game.v026.wizard ||= {
    active:true,step:"mode",mode:null,selectedYear:2026,selectedYears:[1992,2026],hostYear:2026,
    selectedRaceIds:[],selectedFieldTeamIds:[],normalization:"equalized",teamSearch:""
  };
  const w=Game.v026.wizard;
  w.selectedYears ||= [1992,2026]; w.selectedRaceIds ||= []; w.selectedFieldTeamIds ||= [];
  Game.version=V026_VERSION;
  return w;
}

function resetWizardV026() {
  ensureWizardV026();
  Game.v026.wizard={active:true,step:"mode",mode:null,selectedYear:2026,selectedYears:[1992,2026],hostYear:2026,selectedRaceIds:[],selectedFieldTeamIds:[],normalization:"equalized",teamSearch:""};
  V026Runtime.catalogTeams=[];V026Runtime.catalogRiders=[];V026Runtime.catalogRaces=[];V026Runtime.packYears=[];V026Runtime.teamSearch="";
  Game.selectedTeamId=null;Game.rosterLocked=false;Game.manager=null;Game.v024=null;Game.finished=false;Game.betweenRaces=false;Game.seasonFinished=false;
}

function raceBaseIdV026(race) {
  const raw=String(race?.originalId||race?.id||"");
  const known=["giro","tour","vuelta"];
  return known.find(k=>raw===k||raw.includes(`__${k}`)||raw.includes(`_${k}`)) || raw;
}
function isGrandTourFieldRaceV026(race) {
  const id=raceBaseIdV026(race).toLowerCase(),name=String(race?.name||"").toLowerCase();
  return id==="giro"||id==="tour"||id==="vuelta"||name.includes("giro d'italia")||name.includes("tour de france")||name.includes("vuelta a españa");
}
function teamLimitForRacesV026(races) { return (races||[]).some(isGrandTourFieldRaceV026)?22:25; }
function selectedWizardRacesV026() {
  const w=ensureWizardV026();
  if(w.mode?.includes("season")) return V026Runtime.catalogRaces.filter(r=>w.selectedRaceIds.includes(r.id)||w.selectedRaceIds.includes(r.originalId));
  const id=w.selectedRaceIds[0]; return V026Runtime.catalogRaces.filter(r=>r.id===id||r.originalId===id).slice(0,1);
}
function fieldLimitV026() { const races=selectedWizardRacesV026(); return teamLimitForRacesV026(races.length?races:V026Runtime.catalogRaces); }

async function catalogForYearV026(year) {
  const pack=await loadHistoricalPackV025(Number(year));
  const normalized=normalizePackV025(pack);
  const races=(normalized.calendar?.length?clone(normalized.calendar):buildHistoricalCalendarV025(normalized.season)).map(r=>({...r,originalId:r.originalId||r.id}));
  return {teams:clone(normalized.teams),riders:clone(normalized.riders),races,years:[Number(year)]};
}

function defaultRaceSelectionV026(mode,races) {
  if(!races.length)return [];
  return mode?.includes("season")?races.map(r=>r.id):[races.find(r=>raceBaseIdV026(r)==="tour")?.id||races[0].id];
}

async function chooseGameModeV026(mode) {
  const w=ensureWizardV026();
  w.mode=mode;w.step="competition";Game.mode=mode.includes("season")?"season":"single";Game.historical.databaseMode=mode.startsWith("special")?"special":"season";
  V026Runtime.loading=true;renderHome();
  try {
    if(mode.startsWith("special")) {
      w.selectedYears=[1992,2026];w.hostYear=2026;
      const host=await catalogForYearV026(w.hostYear);V026Runtime.catalogRaces=host.races;w.selectedRaceIds=defaultRaceSelectionV026(mode,host.races);
    } else {
      w.selectedYear=2026;const cat=await catalogForYearV026(2026);Object.assign(V026Runtime,{catalogTeams:cat.teams,catalogRiders:cat.riders,catalogRaces:cat.races,packYears:cat.years});w.selectedRaceIds=defaultRaceSelectionV026(mode,cat.races);
    }
  } catch(e){V026Runtime.lastError=e.message;toast(e.message);} finally {V026Runtime.loading=false;renderHome();}
}

async function setWizardYearV026(year) {
  const w=ensureWizardV026();w.selectedYear=Number(year);V026Runtime.loading=true;renderHome();
  try {const cat=await catalogForYearV026(year);Object.assign(V026Runtime,{catalogTeams:cat.teams,catalogRiders:cat.riders,catalogRaces:cat.races,packYears:cat.years});w.selectedRaceIds=defaultRaceSelectionV026(w.mode,cat.races);}catch(e){V026Runtime.lastError=e.message;toast(e.message);}finally{V026Runtime.loading=false;renderHome();}
}
async function setSpecialHostYearV026(year) {const w=ensureWizardV026();w.hostYear=Number(year);V026Runtime.loading=true;renderHome();try{const cat=await catalogForYearV026(year);V026Runtime.catalogRaces=cat.races;w.selectedRaceIds=defaultRaceSelectionV026(w.mode,cat.races);}catch(e){toast(e.message);}finally{V026Runtime.loading=false;renderHome();}}
function toggleWizardYearV026(year,checked){const w=ensureWizardV026(),set=new Set(w.selectedYears);checked?set.add(Number(year)):set.delete(Number(year));w.selectedYears=[...set].sort((a,b)=>a-b);if(!w.selectedYears.includes(w.hostYear)&&w.selectedYears.length){w.hostYear=Math.max(...w.selectedYears);setSpecialHostYearV026(w.hostYear);return;}renderHome();}
function chooseSingleRaceV026(id){const w=ensureWizardV026();w.selectedRaceIds=[id];renderHome();}
function toggleSeasonRaceV026(id,checked){const w=ensureWizardV026(),set=new Set(w.selectedRaceIds);checked?set.add(id):set.delete(id);w.selectedRaceIds=V026Runtime.catalogRaces.map(r=>r.id).filter(x=>set.has(x));renderHome();}
function selectAllSeasonRacesV026(all=true){const w=ensureWizardV026();w.selectedRaceIds=all?V026Runtime.catalogRaces.map(r=>r.id):[];renderHome();}

async function continueCompetitionV026() {
  const w=ensureWizardV026();
  if(!w.selectedRaceIds.length)return toast("Selecciona al menos una carrera");
  V026Runtime.loading=true;renderHome();
  try {
    if(w.mode.startsWith("special")) {
      if(w.selectedYears.length<2)throw new Error("Selecciona al menos dos años para el modo multi-anual");
      const packs=await Promise.all(w.selectedYears.map(loadHistoricalPackV025));
      const namespaced=packs.map(p=>namespacePackV025(normalizePackV025(p)));
      const hostPack=normalizePackV025(packs.find(p=>Number(p.season)===Number(w.hostYear))||packs[packs.length-1]);
      const hostRaces=(hostPack.calendar?.length?clone(hostPack.calendar):buildHistoricalCalendarV025(w.hostYear)).map(r=>({...r,originalId:r.originalId||r.id}));
      const selectedBase=new Set(w.selectedRaceIds);
      const selectedHost=hostRaces.filter(r=>selectedBase.has(r.id)||selectedBase.has(r.originalId));
      const eraPrefix=`special_${w.selectedYears.join("_")}__`;
      V026Runtime.catalogTeams=namespaced.flatMap(p=>p.teams);
      V026Runtime.catalogRiders=namespaced.flatMap(p=>p.riders).map(r=>eraAdjustedRiderV025(r,w.normalization));
      V026Runtime.catalogRaces=selectedHost.map(r=>({...clone(r),id:`${eraPrefix}${r.id}`,originalId:r.originalId||r.id,stages:(r.stages||[]).map(s=>({...s,id:`${eraPrefix}${s.id}`}))}));
      V026Runtime.packYears=[...w.selectedYears];
      w.selectedRaceIds=V026Runtime.catalogRaces.map(r=>r.id);
      w.selectedFieldTeamIds=autoBalancedFieldV026(V026Runtime.catalogTeams,fieldLimitV026());
      w.step="field";
    } else {
      const cat=await catalogForYearV026(w.selectedYear);
      V026Runtime.catalogTeams=cat.teams;V026Runtime.catalogRiders=cat.riders;V026Runtime.packYears=cat.years;
      const chosen=new Set(w.selectedRaceIds);V026Runtime.catalogRaces=cat.races.filter(r=>chosen.has(r.id)||chosen.has(r.originalId));
      w.selectedRaceIds=V026Runtime.catalogRaces.map(r=>r.id);w.step="team";
    }
  } catch(e){console.error(e);toast(e.message);} finally {V026Runtime.loading=false;renderHome();}
}

function teamStrengthV026(team,riders=V026Runtime.catalogRiders) {const arr=riders.filter(r=>r.teamId===team.id).sort((a,b)=>b.base-a.base).slice(0,8);const avgBase=arr.length?arr.reduce((s,r)=>s+r.base,0)/arr.length:0;const ai=team.ai||{};return avgBase*10+toNum(ai.gc,50)+toNum(ai.classics,50)*.4+toNum(ai.sprint,50)*.3;}
function autoBalancedFieldV026(teams,limit) {
  const byYear={};teams.forEach(t=>(byYear[t.season||2026] ||= []).push(t));Object.values(byYear).forEach(arr=>arr.sort((a,b)=>teamStrengthV026(b)-teamStrengthV026(a)));
  const years=Object.keys(byYear).sort();const ids=[];let round=0;while(ids.length<limit){let added=false;for(const y of years){const t=byYear[y][round];if(t&&ids.length<limit){ids.push(t.id);added=true;}}if(!added)break;round++;}return ids;
}
function toggleFieldTeamV026(id,checked){const w=ensureWizardV026(),set=new Set(w.selectedFieldTeamIds),limit=fieldLimitV026();if(checked&&set.size>=limit)return toast(`Máximo ${limit} equipos`);checked?set.add(id):set.delete(id);w.selectedFieldTeamIds=[...set];renderHome();}
function autoFieldV026(){const w=ensureWizardV026();w.selectedFieldTeamIds=autoBalancedFieldV026(V026Runtime.catalogTeams,fieldLimitV026());renderHome();}
function clearFieldV026(){ensureWizardV026().selectedFieldTeamIds=[];renderHome();}
function confirmFieldV026(){const w=ensureWizardV026(),limit=fieldLimitV026();if(w.selectedFieldTeamIds.length<2)return toast("Selecciona al menos dos equipos");if(w.selectedFieldTeamIds.length>limit)return toast(`Máximo ${limit} equipos`);w.step="team";renderHome();}

function selectedCatalogRacesV026(){const w=ensureWizardV026(),set=new Set(w.selectedRaceIds);return V026Runtime.catalogRaces.filter(r=>set.has(r.id)||set.has(r.originalId));}
function autoNormalFieldV026(playerTeamId) {const limit=fieldLimitV026();const ranked=[...V026Runtime.catalogTeams].sort((a,b)=>teamStrengthV026(b)-teamStrengthV026(a));const ids=ranked.slice(0,limit).map(t=>t.id);if(!ids.includes(playerTeamId)){ids[ids.length-1]=playerTeamId;}return [...new Set(ids)].slice(0,limit);}
function applyCompetitionFieldV026(teamIds,playerTeamId) {
  const ids=new Set(teamIds),teams=V026Runtime.catalogTeams.filter(t=>ids.has(t.id)),riders=V026Runtime.catalogRiders.filter(r=>ids.has(r.teamId)),races=selectedCatalogRacesV026();
  TEAMS.splice(0,TEAMS.length,...clone(teams));RIDERS.splice(0,RIDERS.length,...clone(riders));RACES.splice(0,RACES.length,...clone(races));SEASON_RACE_IDS.splice(0,SEASON_RACE_IDS.length,...RACES.map(r=>r.id));
  Game.mode=ensureWizardV026().mode.includes("season")?"season":"single";Game.selectedRaceId=RACES[0]?.id;Game.seasonIndex=0;Game.selectedTeamId=playerTeamId;Game.riders=clone(RIDERS);Game.raceHistory=[];Game.pendingRosterIds=[];Game.raceRosters={};Game.rosterLocked=false;Game.lastRaceRosterIds=[];Game.currentStageIndex=0;Game.activeTab="director";Game.finished=false;Game.betweenRaces=false;Game.seasonFinished=false;Game.manager=null;Game.v024=null;Game.historical.selectedYear=ensureWizardV026().selectedYear;Game.historical.activeYears=[...V026Runtime.packYears];Game.historical.databaseMode=ensureWizardV026().mode.startsWith("special")?"special":"season";
  Game.v026.competitionTeamIds=[...ids];Game.v026.competitionRaceIds=RACES.map(r=>r.id);Game.v026.wizard.active=false;Game.version=V026_VERSION;
}

selectTeam = function(teamId) {
  const w=ensureWizardV026();
  const allowed=w.mode.startsWith("special")?w.selectedFieldTeamIds:autoNormalFieldV026(teamId);
  if(w.mode.startsWith("special")&&!allowed.includes(teamId))return toast("El equipo debe estar incluido en el pelotón multi-anual");
  applyCompetitionFieldV026(allowed,teamId);
  prepareRosterSelection();
};
function backToTeamSelectionV026(){const w=ensureWizardV026();w.active=true;w.step="team";Game.selectedTeamId=null;Game.rosterLocked=false;renderHome();}

renderRosterSelection = function() {
  const team=getTeam(Game.selectedTeamId),race=getRace(),riders=getFullTeamRiders(Game.selectedTeamId).slice().sort((a,b)=>b.base-a.base),required=historicalRosterSizeV025(Game.selectedTeamId),reserveCount=riders.filter(r=>r.archivalReserve).length;
  app.innerHTML=`<div class="header"><div><h1>Selecciona ${required} corredores</h1><p>${esc(team.name)} · ${esc(race.name)} · ${TEAMS.length} equipos participantes</p></div><div class="top-actions"><button class="secondary" onclick="backToTeamSelectionV026()">Volver a equipos</button><button id="confirm-roster-button" type="button" onclick="confirmRoster()">Confirmar selección e iniciar</button></div></div><section class="panel sticky-panel"><div class="roster-summary"><div><strong>${Game.pendingRosterIds.length}/${required} seleccionados</strong><p class="muted small">Los pasos de modo y carrera ya están cerrados. La convocatoria queda bloqueada durante la competición.${reserveCount?` · ${reserveCount} reservas de archivo.`:''}</p></div><div class="chip-row">${Game.pendingRosterIds.map(id=>`<span class="chip selected">${esc(getRider(id).name)}</span>`).join('')}</div></div></section><section class="panel"><h2>Plantilla completa</h2><div class="roster-grid">${riders.map(renderRosterCard).join('')}</div></section>`;
};

function wizardHeaderV026(title,subtitle,backAction="") {return `<div class="header wizard-header"><div><span class="eyebrow">Cycling Manager Tour v0.26</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="top-actions">${backAction?`<button class="secondary" onclick="${backAction}">Atrás</button>`:''}<button class="secondary" onclick="loadGame()">Cargar partida</button><button class="danger" onclick="clearSave()">Borrar guardado</button></div></div>`;}
function renderLoadingV026(){return `${wizardHeaderV026('Preparando base de datos','Cargando equipos, corredores y calendario…')}<section class="panel wizard-loading"><div class="spinner"></div><strong>Procesando ${ensureWizardV026().selectedYears?.join(', ')||ensureWizardV026().selectedYear}</strong></section>`;}

function renderModeStepV026() {return `${wizardHeaderV026('¿Qué tipo de juego quieres iniciar?','Selecciona primero el formato. Esta ventana desaparecerá al avanzar.')}<section class="wizard-stage"><div class="wizard-progress"><b class="active">1. Modo</b><span>2. Carrera</span><span>3. Equipos</span><span>4. Plantilla</span></div><div class="mode-grid v026-mode-grid"><button class="mode-card" onclick="chooseGameModeV026('single')"><span>01</span><strong>Carrera individual</strong><small>Una prueba con equipos del mismo año.</small></button><button class="mode-card" onclick="chooseGameModeV026('season')"><span>02</span><strong>Temporada histórica</strong><small>Selecciona una o varias carreras y encadénalas.</small></button><button class="mode-card special" onclick="chooseGameModeV026('special-single')"><span>03</span><strong>Carrera multi-anual</strong><small>Enfrenta equipos de años distintos.</small></button><button class="mode-card special" onclick="chooseGameModeV026('special-season')"><span>04</span><strong>Temporada multi-anual</strong><small>Calendario completo entre generaciones.</small></button></div></section>`;}

function renderCompetitionStepV026(){const w=ensureWizardV026(),special=w.mode.startsWith('special'),season=w.mode.includes('season'),available=availableHistoricalYearsV025();return `${wizardHeaderV026(season?'¿Qué carreras formarán la temporada?':'¿Qué carrera quieres disputar?',special?'Selecciona años y calendario anfitrión. La elección de equipos vendrá en la siguiente ventana.':'Selecciona el año y después la competición.','resetWizardV026();renderHome()')}<section class="wizard-stage"><div class="wizard-progress"><span>1. Modo</span><b class="active">2. Carrera</b><span>3. Equipos</span><span>4. Plantilla</span></div>${special?`<section class="panel"><h2>Años incluidos</h2><div class="year-selector-grid">${allHistoricalYearsV025().map(y=>`<label class="year-chip ${available.includes(y)?'ready':'missing'}"><input type="checkbox" ${w.selectedYears.includes(y)?'checked':''} ${available.includes(y)?'':'disabled'} onchange="toggleWizardYearV026(${y},this.checked)"><span>${y}</span></label>`).join('')}</div><div class="setup-grid"><label>Calendario anfitrión<select onchange="setSpecialHostYearV026(Number(this.value))">${w.selectedYears.map(y=>`<option value="${y}" ${w.hostYear===y?'selected':''}>${y}</option>`).join('')}</select></label><label>Comparación<select onchange="Game.v026.wizard.normalization=this.value"><option value="equalized" ${w.normalization==='equalized'?'selected':''}>Capacidades igualadas</option><option value="authentic" ${w.normalization==='authentic'?'selected':''}>Tecnología de época</option></select></label></div></section>`:`<section class="panel"><label class="large-select">Temporada<select onchange="setWizardYearV026(Number(this.value))">${allHistoricalYearsV025().map(y=>{const e=manifestEntryV025(y);return `<option value="${y}" ${w.selectedYear===y?'selected':''}>${y} · ${e?.teamCount||'?'} equipos</option>`}).join('')}</select></label><div class="data-banner"><strong>${V026Runtime.catalogTeams.length} equipos · ${V026Runtime.catalogRiders.length} corredores</strong><span>${w.selectedYear===2026?'Base completa v0.24 restaurada: 34 equipos y 927 corredores.':'Pack histórico anual cargado.'}</span></div></section>`}<section class="panel"><div class="section-heading"><div><h2>${season?'Calendario seleccionable':'Carreras disponibles'}</h2><p class="muted">${season?'Marca todas las competiciones que quieras encadenar.':'Solo se disputará la carrera elegida.'}</p></div>${season?`<div class="button-row"><button class="secondary" onclick="selectAllSeasonRacesV026(true)">Todas</button><button class="secondary" onclick="selectAllSeasonRacesV026(false)">Ninguna</button></div>`:''}</div><div class="race-grid wizard-races">${V026Runtime.catalogRaces.map(r=>season?`<label class="race-card checkable ${w.selectedRaceIds.includes(r.id)?'active':''}"><input type="checkbox" ${w.selectedRaceIds.includes(r.id)?'checked':''} onchange="toggleSeasonRaceV026('${r.id}',this.checked)"><span class="race-date">${esc(r.date||'')}</span><span class="race-title">${esc(r.name)}</span><span class="badge">${r.stages?.length||1} etapas</span>${isGrandTourFieldRaceV026(r)?'<span class="badge orange">22 equipos</span>':'<span class="badge blue">máx. 25</span>'}</label>`:`<button class="race-card ${w.selectedRaceIds[0]===r.id?'active':''}" onclick="chooseSingleRaceV026('${r.id}')"><span class="race-date">${esc(r.date||'')}</span><span class="race-title">${esc(r.name)}</span><span class="badge">${r.stages?.length||1} etapas</span>${isGrandTourFieldRaceV026(r)?'<span class="badge orange">22 equipos</span>':'<span class="badge blue">máx. 25</span>'}</button>`).join('')}</div><div class="wizard-footer"><span>${w.selectedRaceIds.length} carrera${w.selectedRaceIds.length===1?'':'s'} seleccionada${w.selectedRaceIds.length===1?'':'s'}</span><button onclick="continueCompetitionV026()">Continuar</button></div></section></section>`;}

function renderFieldStepV026(){const w=ensureWizardV026(),limit=fieldLimitV026(),selected=new Set(w.selectedFieldTeamIds);const grouped={};V026Runtime.catalogTeams.forEach(t=>(grouped[t.season||2026] ||= []).push(t));return `${wizardHeaderV026('Selecciona el pelotón multi-anual',`Elige entre 2 y ${limit} equipos. El límite baja a 22 porque el calendario incluye una gran vuelta cuando corresponde.`,`Game.v026.wizard.step='competition';renderHome()`)}<section class="wizard-stage"><div class="wizard-progress"><span>1. Modo</span><span>2. Carrera</span><b class="active">3. Equipos</b><span>4. Plantilla</span></div><section class="panel sticky-panel"><div class="field-toolbar"><div><strong>${selected.size}/${limit} equipos</strong><p class="muted small">Años: ${w.selectedYears.join(', ')}</p></div><div class="button-row"><button class="secondary" onclick="autoFieldV026()">Selección equilibrada</button><button class="secondary" onclick="clearFieldV026()">Vaciar</button><button onclick="confirmFieldV026()">Confirmar pelotón</button></div></div></section>${Object.entries(grouped).sort((a,b)=>Number(a[0])-Number(b[0])).map(([year,teams])=>`<section class="panel"><h2>${year}</h2><div class="field-team-grid">${teams.sort((a,b)=>teamStrengthV026(b)-teamStrengthV026(a)).map(t=>{const riders=V026Runtime.catalogRiders.filter(r=>r.teamId===t.id).sort((a,b)=>b.base-a.base);return `<label class="field-team-card ${selected.has(t.id)?'selected':''}"><input type="checkbox" ${selected.has(t.id)?'checked':''} onchange="toggleFieldTeamV026('${t.id}',this.checked)">${renderJersey(t)}<div><strong>${esc(t.displayName||t.name)}</strong><span>${riders.length} corredores · fuerza ${Math.round(teamStrengthV026(t)/10)}</span><small>${riders.slice(0,4).map(r=>esc(r.name)).join(' · ')}</small></div></label>`}).join('')}</div></section>`).join('')}</section>`;}

function filteredWizardTeamsV026(){const w=ensureWizardV026(),q=String(w.teamSearch||'').toLowerCase(),allowed=w.mode.startsWith('special')?new Set(w.selectedFieldTeamIds):null;return V026Runtime.catalogTeams.filter(t=>(!allowed||allowed.has(t.id))&&(!q||`${t.name} ${t.displayName||''} ${t.country||''} ${t.season||''}`.toLowerCase().includes(q)));}
function setWizardTeamSearchV026(v){ensureWizardV026().teamSearch=v;renderHome();}
function renderTeamStepV026(){const w=ensureWizardV026(),teams=filteredWizardTeamsV026(),limit=fieldLimitV026();return `${wizardHeaderV026('Elige el equipo que vas a gestionar',`${w.mode.startsWith('special')?teams.length:V026Runtime.catalogTeams.length} equipos disponibles. La carrera tendrá como máximo ${limit} equipos.`,`Game.v026.wizard.step='${w.mode.startsWith('special')?'field':'competition'}';renderHome()`)}<section class="wizard-stage"><div class="wizard-progress"><span>1. Modo</span><span>2. Carrera</span><b class="active">3. Equipo</b><span>4. Plantilla</span></div><section class="panel"><label class="team-search">Buscar equipo<input value="${esc(w.teamSearch||'')}" oninput="setWizardTeamSearchV026(this.value)" placeholder="ONCE, Banesto, UAE, Movistar…"></label><div class="data-banner"><strong>${teams.length} equipos visibles</strong><span>${w.mode.startsWith('special')?'Solo aparecen los equipos confirmados para el cruce de épocas.':'Al escoger equipo, la IA completará el pelotón hasta el límite reglamentario.'}</span></div></section><section class="panel"><div class="grid teams">${teams.map(t=>{const riders=V026Runtime.catalogRiders.filter(r=>r.teamId===t.id).sort((a,b)=>b.base-a.base),visual=t.visual||generatedVisualV025(t.name,t.season||2026);return `<article class="team-card historical-team-card" style="--team-primary:${visual.primary};--team-secondary:${visual.secondary};--team-accent:${visual.accent};">${renderJersey({...t,visual})}<div class="badge-row"><span class="badge jersey-rainbow">${t.season||w.selectedYear}</span><span class="badge green">${esc(t.level||'PRO')}</span><span class="badge blue">${riders.length} corredores</span></div><h3>${esc(t.displayName||t.name)}</h3><p class="muted small">${esc(t.country||'International')} · fuerza ${Math.round(teamStrengthV026(t)/10)}</p><div class="chip-row">${riders.slice(0,6).map(r=>`<span class="chip">${esc(r.name)} · ${r.base}</span>`).join('')}</div><button onclick="selectTeam('${t.id}')">Gestionar este equipo</button></article>`}).join('')}</div></section></section>`;}

renderHome = function(){const w=ensureWizardV026();if(V026Runtime.loading){app.innerHTML=renderLoadingV026();return;}if(!w.active){w.active=true;w.step='mode';}app.innerHTML=w.step==='mode'?renderModeStepV026():w.step==='competition'?renderCompetitionStepV026():w.step==='field'?renderFieldStepV026():renderTeamStepV026();};

const initBaseV026=init;
init=function(){try{initBaseV026();}catch(e){console.warn(e);}resetWizardV026();HistoricalV025.packCache[2026]=FULL_2026_PACK_V026;Object.assign(V026Runtime,{catalogTeams:clone(FULL_2026_PACK_V026.teams),catalogRiders:clone(FULL_2026_PACK_V026.riders),catalogRaces:clone(FULL_2026_PACK_V026.calendar),packYears:[2026]});ensureWizardV026().selectedRaceIds=[];renderHome();};

saveGame=function(show=true){Game.version=V026_VERSION;const ok=safeStorageSet(V026_SAVE_KEY,JSON.stringify(Game));if(show)toast(ok?'Partida v0.26 guardada':'La partida continúa, pero el navegador bloquea localStorage');return ok;};
function rebuildSpecialCatalogV026(packs,wizard) {
  const years=(wizard.selectedYears||[]).map(Number);
  const namespaced=packs.map(p=>namespacePackV025(normalizePackV025(p)));
  const hostYear=Number(wizard.hostYear||years[years.length-1]||2026);
  const hostRaw=packs.find(p=>Number(p.season)===hostYear)||packs[packs.length-1];
  const host=normalizePackV025(hostRaw);
  const hostRaces=(host.calendar?.length?clone(host.calendar):buildHistoricalCalendarV025(hostYear)).map(r=>({...r,originalId:r.originalId||r.id}));
  const eraPrefix=`special_${years.join("_")}__`;
  return {
    teams:namespaced.flatMap(p=>p.teams),
    riders:namespaced.flatMap(p=>p.riders).map(r=>eraAdjustedRiderV025(r,wizard.normalization||"equalized")),
    races:hostRaces.map(r=>({...clone(r),id:`${eraPrefix}${r.id}`,originalId:r.originalId||r.id,stages:(r.stages||[]).map(s=>({...s,id:`${eraPrefix}${s.id}`}))})),
    years
  };
}

loadGame=async function(){
  const raw=safeStorageGet(V026_SAVE_KEY);
  if(!raw)return toast('No hay guardado v0.26');
  try{
    const saved=JSON.parse(raw);
    if(saved.version!==V026_VERSION)throw new Error('Versión incompatible');
    const sv=clone(saved.v026?.wizard||{});
    let catalog;
    if(sv.mode?.startsWith('special')){
      const years=(sv.selectedYears||saved.historical?.activeYears||[1992,2026]).map(Number);
      const packs=await Promise.all(years.map(loadHistoricalPackV025));
      catalog=rebuildSpecialCatalogV026(packs,{...sv,selectedYears:years});
    }else{
      const cat=await catalogForYearV026(sv.selectedYear||saved.historical?.selectedYear||2026);
      catalog={teams:cat.teams,riders:cat.riders,races:cat.races,years:cat.years};
    }
    Object.assign(V026Runtime,{catalogTeams:catalog.teams,catalogRiders:catalog.riders,catalogRaces:catalog.races,packYears:catalog.years});
    const teamIds=saved.v026?.competitionTeamIds||[];
    const raceIds=saved.v026?.competitionRaceIds||[];
    if(teamIds.length){
      TEAMS.splice(0,TEAMS.length,...clone(catalog.teams.filter(t=>teamIds.includes(t.id))));
      RIDERS.splice(0,RIDERS.length,...clone(catalog.riders.filter(r=>teamIds.includes(r.teamId))));
      const selectedRaces=catalog.races.filter(r=>raceIds.includes(r.id)||raceIds.includes(r.originalId));
      RACES.splice(0,RACES.length,...clone(selectedRaces));
      SEASON_RACE_IDS.splice(0,SEASON_RACE_IDS.length,...RACES.map(r=>r.id));
    }
    Object.assign(Game,saved);
    sanitizeGameState();
    ensureV024State();
    ensureV026ManagementState();
    Game.rosterLocked?render():renderHome();
  }catch(e){console.error(e);toast(`No se pudo cargar: ${e.message}`);}
};
clearSave=function(){[V026_SAVE_KEY,V025_SAVE_KEY,SAVE_KEY,'cyclingManager_v024plus','cyclingManager_v024','cyclingManager_v019'].forEach(safeStorageRemove);toast('Guardados del simulador borrados');};

/* Arranque: restaura la base íntegra 2026 y muestra únicamente el paso de modo. */
HistoricalV025.packCache[2026]=FULL_2026_PACK_V026;
TEAMS.splice(0,TEAMS.length,...clone(FULL_2026_PACK_V026.teams));RIDERS.splice(0,RIDERS.length,...clone(FULL_2026_PACK_V026.riders));RACES.splice(0,RACES.length,...clone(FULL_2026_PACK_V026.calendar));SEASON_RACE_IDS.splice(0,SEASON_RACE_IDS.length,...RACES.map(r=>r.id));Game.riders=clone(RIDERS);resetWizardV026();V026Runtime.catalogTeams=clone(FULL_2026_PACK_V026.teams);V026Runtime.catalogRiders=clone(FULL_2026_PACK_V026.riders);V026Runtime.catalogRaces=clone(FULL_2026_PACK_V026.calendar);V026Runtime.packYears=[2026];renderHome();

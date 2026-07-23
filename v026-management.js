/* ============================================================
   CYCLING MANAGER TOUR v0.26 — DIRECCIÓN DE EQUIPO
   Mercado de staff, infraestructura, vehículos, departamentos y cantera.
   ============================================================ */

const V026_BUS_CATALOG = [
  {id:"bus_club_compact",name:"Club Compact 12",tier:1,price:420000,annualCost:48000,capacity:14,recovery:1,kitchen:1,physio:0,data:0,sleep:1,morale:1,reliability:72,description:"Autobús compacto para calendarios regionales y plantillas pequeñas."},
  {id:"bus_pro_continental",name:"Pro Continental 18",tier:2,price:780000,annualCost:76000,capacity:18,recovery:3,kitchen:2,physio:1,data:1,sleep:2,morale:2,reliability:79,description:"Base profesional equilibrada con cocina, camillas y conectividad de carrera."},
  {id:"bus_endurance",name:"Endurance Grand Tour",tier:3,price:1250000,annualCost:118000,capacity:22,recovery:5,kitchen:4,physio:3,data:2,sleep:4,morale:4,reliability:86,description:"Diseñado para tres semanas: recuperación, nutrición y descanso de alta calidad."},
  {id:"bus_aero_lab",name:"AeroLab Performance Coach",tier:4,price:1860000,annualCost:168000,capacity:22,recovery:6,kitchen:4,physio:4,data:6,sleep:5,morale:5,reliability:91,description:"Centro móvil con telemetría, sala de análisis y laboratorio biomecánico."},
  {id:"bus_hyper_recovery",name:"HyperRecovery GT-X",tier:5,price:2750000,annualCost:240000,capacity:24,recovery:9,kitchen:7,physio:8,data:8,sleep:8,morale:7,reliability:96,description:"Autobús insignia con crioterapia, cocina de precisión, puestos de análisis y zonas de sueño."},
  {id:"bus_classics",name:"Classics Service Unit",tier:3,price:1380000,annualCost:132000,capacity:20,recovery:4,kitchen:3,physio:3,data:3,sleep:3,morale:4,reliability:94,description:"Configuración reforzada para pavé, lluvia y cambios rápidos de material."},
  {id:"bus_altitude",name:"Altitude Mobile Base",tier:4,price:2100000,annualCost:188000,capacity:22,recovery:8,kitchen:5,physio:6,data:5,sleep:7,morale:5,reliability:92,description:"Especializado en bloques de altura, recuperación respiratoria y análisis de carga."},
  {id:"bus_sprint",name:"Sprint Operations Coach",tier:4,price:1950000,annualCost:176000,capacity:22,recovery:5,kitchen:5,physio:4,data:5,sleep:4,morale:7,reliability:93,description:"Optimizado para trenes de sprint, vídeo táctico y recuperación neuromuscular."}
];

const V026_CAR_CATALOG = [
  {id:"car_cupra_terramar",brand:"CUPRA",model:"Terramar e-HYBRID",price:62000,annualCost:9000,reliability:90,storage:78,comfort:88,data:83,offroad:72,sponsorIncome:420000,sourceType:"real-partner",description:"Coche oficial de simulación con elevada conectividad y presencia de marca."},
  {id:"car_skoda_superb",brand:"Škoda",model:"Superb Combi",price:54000,annualCost:7800,reliability:94,storage:94,comfort:86,data:78,offroad:68,sponsorIncome:360000,sourceType:"simulation",description:"Gran capacidad para ruedas, bidones, radios y mecánicos."},
  {id:"car_volvo_v90",brand:"Volvo",model:"V90 Recharge",price:79000,annualCost:11200,reliability:92,storage:88,comfort:95,data:87,offroad:70,sponsorIncome:500000,sourceType:"simulation",description:"Familiar premium orientado a seguridad, confort y largas jornadas."},
  {id:"car_bmw_i5_touring",brand:"BMW",model:"i5 Touring",price:85000,annualCost:11800,reliability:89,storage:82,comfort:94,data:95,offroad:61,sponsorIncome:560000,sourceType:"simulation",description:"Plataforma eléctrica de alta conectividad para equipos tecnológicos."},
  {id:"car_mercedes_e",brand:"Mercedes-Benz",model:"E-Class Estate",price:82000,annualCost:11600,reliability:91,storage:86,comfort:96,data:93,offroad:64,sponsorIncome:550000,sourceType:"simulation",description:"Confort de gran vuelta y puesto de dirección avanzado."},
  {id:"car_toyota_corolla",brand:"Toyota",model:"Corolla Touring Sports",price:39000,annualCost:6100,reliability:97,storage:80,comfort:80,data:75,offroad:66,sponsorIncome:300000,sourceType:"simulation",description:"Fiabilidad extrema y coste operativo contenido."},
  {id:"car_audi_a6",brand:"Audi",model:"A6 Avant e-tron",price:89000,annualCost:12400,reliability:90,storage:84,comfort:95,data:97,offroad:64,sponsorIncome:590000,sourceType:"simulation",description:"Telemetría, conectividad y posicionamiento premium."},
  {id:"car_vw_passat",brand:"Volkswagen",model:"Passat Variant",price:51000,annualCost:7200,reliability:95,storage:93,comfort:85,data:80,offroad:67,sponsorIncome:340000,sourceType:"simulation",description:"Vehículo de servicio equilibrado y muy espacioso."},
  {id:"car_ford_kuga",brand:"Ford",model:"Kuga PHEV",price:48000,annualCost:7400,reliability:91,storage:84,comfort:83,data:79,offroad:82,sponsorIncome:330000,sourceType:"simulation",description:"SUV práctico para clásicas, caminos estrechos y logística mixta."},
  {id:"car_peugeot_508",brand:"Peugeot",model:"508 SW PSE",price:67000,annualCost:9600,reliability:88,storage:82,comfort:89,data:84,offroad:62,sponsorIncome:430000,sourceType:"simulation",description:"Familiar deportivo con buena imagen de patrocinio."}
];

const V026_DEPARTMENTS = [
  {id:"data",name:"Departamento de Datos",openCost:750000,levelCost:520000,max:5,effect:{forecast:2,pacing:2,opponents:1},description:"Centraliza telemetría, perfiles de potencia, modelos de fatiga y análisis de rivales."},
  {id:"ai",name:"Análisis de IA",openCost:1250000,levelCost:820000,max:5,effect:{aiRecommendation:3,forecast:2,tactics:1},description:"Modelos de predicción de fuga, recomendación táctica y detección de patrones rivales."},
  {id:"aero",name:"Rendimiento Aerodinámico",openCost:1650000,levelCost:1100000,max:5,effect:{ttt:3,pacing:2,reliability:1},description:"CFD, túnel de viento, ropa, cascos, ruedas y posición de CRI."},
  {id:"sports_science",name:"Ciencia del Rendimiento",openCost:1100000,levelCost:760000,max:5,effect:{training:3,form:2,recovery:1},description:"Planificación de carga, CP/W′, altura, calor y picos A/B/C."},
  {id:"nutrition_lab",name:"Laboratorio de Nutrición",openCost:680000,levelCost:430000,max:5,effect:{nutrition:3,recovery:1,heat:2},description:"Protocolos individualizados, entrenamiento gastrointestinal e hidratación."},
  {id:"medical",name:"Unidad Médica y Recuperación",openCost:950000,levelCost:650000,max:5,effect:{medical:3,recovery:2,fatigue:-1},description:"Prevención, diagnóstico, fisioterapia y retorno progresivo."},
  {id:"scouting",name:"Red Internacional de Scouting",openCost:720000,levelCost:480000,max:5,effect:{scouting:3,potential:2},description:"Ojeadores regionales, datos U23 y evaluación de carácter y progresión."},
  {id:"logistics",name:"Centro de Operaciones",openCost:560000,levelCost:360000,max:5,effect:{travel:3,recovery:1,budget:1},description:"Viajes, hoteles, flota, almacén y planificación de grandes vueltas."},
  {id:"equipment",name:"Fiabilidad de Material",openCost:880000,levelCost:590000,max:5,effect:{reliability:3,tires:2,cobbles:1},description:"Banco de pruebas de componentes, neumáticos y prevención de averías."},
  {id:"academy",name:"Academia de Desarrollo",openCost:900000,levelCost:620000,max:5,effect:{scouting:2,training:2,potential:1},description:"Programa U19/U23, mentoring y transición al WorldTour."}
];

const V026_TEAM_ASSET_DEFAULTS = {
  movistar:{bus:"bus_aero_lab",car:"car_cupra_terramar",sponsor:"CUPRA",verifiedCar:true,departments:{data:2,aero:2,sports_science:3,medical:2,academy:2}},
  uae:{bus:"bus_hyper_recovery",car:"car_audi_a6",sponsor:"Audi Simulation",departments:{data:4,ai:3,aero:4,sports_science:4,nutrition_lab:4,medical:4,scouting:4,logistics:3,equipment:4,academy:4}},
  visma:{bus:"bus_hyper_recovery",car:"car_skoda_superb",sponsor:"Škoda Simulation",departments:{data:5,ai:4,aero:4,sports_science:5,nutrition_lab:4,medical:4,scouting:4,logistics:4,equipment:4,academy:5}},
  ineos:{bus:"bus_aero_lab",car:"car_bmw_i5_touring",sponsor:"BMW Simulation",departments:{data:4,ai:3,aero:5,sports_science:4,medical:4,equipment:4,academy:3}},
  redbull:{bus:"bus_altitude",car:"car_audi_a6",sponsor:"Audi Simulation",departments:{data:4,ai:4,aero:4,sports_science:5,scouting:5,academy:5,medical:4}},
  soudal:{bus:"bus_classics",car:"car_peugeot_508",sponsor:"Peugeot Simulation",departments:{data:3,aero:3,sports_science:4,equipment:5,nutrition_lab:3,academy:4}},
  lidl:{bus:"bus_aero_lab",car:"car_vw_passat",sponsor:"Volkswagen Simulation",departments:{data:4,aero:4,sports_science:4,scouting:4,academy:4}},
  decathlon:{bus:"bus_endurance",car:"car_peugeot_508",sponsor:"Peugeot Simulation",departments:{data:3,sports_science:4,nutrition_lab:3,academy:4}},
  alpecin:{bus:"bus_sprint",car:"car_volvo_v90",sponsor:"Volvo Simulation",departments:{data:3,sports_science:4,equipment:4,academy:3}},
  bahrain:{bus:"bus_altitude",car:"car_bmw_i5_touring",sponsor:"BMW Simulation",departments:{data:3,sports_science:4,medical:3,aero:3}},
  ef:{bus:"bus_endurance",car:"car_ford_kuga",sponsor:"Ford Simulation",departments:{data:3,sports_science:3,scouting:4,academy:3}},
  groupama:{bus:"bus_endurance",car:"car_peugeot_508",sponsor:"Peugeot Simulation",departments:{data:3,sports_science:3,academy:4,medical:3}},
  lotto:{bus:"bus_sprint",car:"car_vw_passat",sponsor:"Volkswagen Simulation",departments:{data:3,sports_science:3,equipment:4,academy:4}},
  nsn:{bus:"bus_pro_continental",car:"car_toyota_corolla",sponsor:"Toyota Simulation",departments:{data:2,sports_science:3,academy:3}},
  jayco:{bus:"bus_endurance",car:"car_toyota_corolla",sponsor:"Toyota Simulation",departments:{data:3,sports_science:4,logistics:4,academy:3}},
  picnic:{bus:"bus_endurance",car:"car_volvo_v90",sponsor:"Volvo Simulation",departments:{data:3,sports_science:4,academy:4}},
  unox:{bus:"bus_pro_continental",car:"car_volvo_v90",sponsor:"Volvo Simulation",departments:{data:3,sports_science:3,academy:4}},
  astana:{bus:"bus_altitude",car:"car_audi_a6",sponsor:"Audi Simulation",departments:{data:3,sports_science:4,medical:3,scouting:3}}
};

const V026StaffUI = {search:"",profession:"all",team:"all",source:"all",page:0,pageSize:36};
const V026YouthUI = {search:"",role:"all",region:"all",source:"all",page:0,pageSize:30};

function ensureV026ManagementState() {
  Game.v026 ||= {};
  Game.v026.staffStatus ||= {};
  Game.v026.teamStaff ||= {};
  Game.v026.clubAssets ||= {};
  Game.v026.youthSigned ||= [];
  Game.v026.youthDismissed ||= [];
  Game.v026.infrastructureLog ||= [];
  STAFF_MARKET_V026.forEach(s => {
    if (!Game.v026.staffStatus[s.id]) Game.v026.staffStatus[s.id] = {teamId:s.currentTeamId || null,contractYears:s.contractYears || 1};
    const teamId=Game.v026.staffStatus[s.id].teamId;
    if (teamId) {
      Game.v026.teamStaff[teamId] ||= [];
      if (!Game.v026.teamStaff[teamId].includes(s.id)) Game.v026.teamStaff[teamId].push(s.id);
    }
  });
}

function historicalAssetDefaultsV026(team) {
  const year=Number(team?.season || 2026);
  const quality=team?.level === "WT" ? 3 : 2;
  return {
    bus: year < 2000 ? "bus_club_compact" : year < 2010 ? "bus_pro_continental" : quality>=3 ? "bus_endurance" : "bus_pro_continental",
    car: year < 2000 ? "car_toyota_corolla" : "car_vw_passat",
    sponsor: year < 2000 ? "Vehículo de equipo histórico" : "Patrocinador de movilidad simulado",
    departments:{data:year<2005?0:1,sports_science:year<2000?0:1,medical:1,equipment:1,academy:1}
  };
}

function ensureClubAssetsV026(teamId=Game.selectedTeamId) {
  ensureV026ManagementState();
  if (!teamId) return null;
  const team=getTeam(teamId);
  if (!Game.v026.clubAssets[teamId]) {
    const originalId=team?.originalId || teamId;
    const preset=V026_TEAM_ASSET_DEFAULTS[originalId] || historicalAssetDefaultsV026(team);
    Game.v026.clubAssets[teamId]={
      buses:[preset.bus],activeBusId:preset.bus,
      cars:[preset.car],activeCarId:preset.car,
      carSponsor:{brand:preset.sponsor,carId:preset.car,annualIncome:(V026_CAR_CATALOG.find(c=>c.id===preset.car)?.sponsorIncome||180000),verified:!!preset.verifiedCar},
      departments:Object.fromEntries(V026_DEPARTMENTS.map(d=>[d.id,Number(preset.departments?.[d.id]||0)])),
      annualOperatingCost:0
    };
  }
  return Game.v026.clubAssets[teamId];
}

function departmentEffectV026(key) {
  const assets=ensureClubAssetsV026(); if(!assets) return 0;
  return V026_DEPARTMENTS.reduce((sum,d)=>sum+toNum(d.effect?.[key],0)*toNum(assets.departments[d.id],0),0);
}

function activeBusV026() { const a=ensureClubAssetsV026(); return V026_BUS_CATALOG.find(x=>x.id===a?.activeBusId) || V026_BUS_CATALOG[0]; }
function activeCarV026() { const a=ensureClubAssetsV026(); return V026_CAR_CATALOG.find(x=>x.id===a?.activeCarId) || V026_CAR_CATALOG[0]; }

function staffCurrentTeamV026(staffId) { ensureV026ManagementState(); return Game.v026.staffStatus[staffId]?.teamId || null; }
function staffTeamLabelV026(staffId) { const id=staffCurrentTeamV026(staffId); if(!id) return "Libre"; return getTeam(id)?.name || HistoricalV025?.baseTeams?.find(t=>t.id===id)?.name || id; }

function seedInitialTeamStaffV026() {
  ensureV026ManagementState();
  ensureManagerSystemsBaseV026();
  const teamId=Game.selectedTeamId; if(!teamId || Game.v026.initialStaffSeededFor===teamId) return;
  let candidates=(Game.v026.teamStaff[teamId]||[]).map(id=>STAFF_MARKET_V026.find(s=>s.id===id)).filter(Boolean);
  const original=getTeam(teamId)?.originalId;
  if(original && original!==teamId) candidates=(Game.v026.teamStaff[original]||[]).map(id=>STAFF_MARKET_V026.find(s=>s.id===id)).filter(Boolean);
  const requiredDepartments=["Dirección","Rendimiento","Salud","Material","Datos e IA","Scouting"];
  const selected=[];
  requiredDepartments.forEach(dep=>{
    const s=candidates.filter(x=>x.department===dep && !selected.includes(x)).sort((a,b)=>b.experience-a.experience)[0];
    if(s) selected.push(s);
  });
  if(selected.length<4) {
    const free=STAFF_MARKET_V026.filter(s=>!staffCurrentTeamV026(s.id)).sort((a,b)=>Object.values(b.skills||{}).reduce((x,y)=>x+y,0)-Object.values(a.skills||{}).reduce((x,y)=>x+y,0));
    while(selected.length<6 && free.length) selected.push(free.shift());
  }
  selected.forEach(s=>{ Game.manager.staff[s.id]={hiredAt:Date.now(),name:s.name,initial:true}; Game.v026.staffStatus[s.id]={teamId,contractYears:Math.max(1,s.contractYears||2)}; });
  Game.v026.initialStaffSeededFor=teamId;
}

const ensureManagerSystemsBaseV026 = ensureManagerSystems;
ensureManagerSystems = function() {
  ensureManagerSystemsBaseV026();
  ensureV026ManagementState();
  ensureClubAssetsV026();
  if (Game.selectedTeamId && Game.manager && !Game.v026._seeding) {
    Game.v026._seeding=true;
    try { seedInitialTeamStaffV026(); } finally { Game.v026._seeding=false; }
  }
};

const staffEffectV019BaseV026 = staffEffectV019;
staffEffectV019 = function(key) { return staffEffectV019BaseV026(key) + departmentEffectV026(key) + (key==="recovery"?activeBusV026().recovery:0); };
const staffEffectAssignedV024BaseV026 = staffEffectAssignedV024;
staffEffectAssignedV024 = function(key,teamId=Game.selectedTeamId,raceId=Game.selectedRaceId) { return staffEffectAssignedV024BaseV026(key,teamId,raceId) + (teamId===Game.selectedTeamId?departmentEffectV026(key):0); };

STAFF_OPTIONS_V019.splice(0,STAFF_OPTIONS_V019.length,...STAFF_MARKET_V026);

function setStaffFilterV026(key,value){V026StaffUI[key]=value;V026StaffUI.page=0;renderRace();}
function setStaffPageV026(delta){V026StaffUI.page=Math.max(0,V026StaffUI.page+delta);renderRace();}
function staffRatingV026(s){const vals=Object.values(s.skills||{});return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):70;}
function filteredStaffV026(){
  const q=String(V026StaffUI.search||"").toLowerCase();
  return STAFF_MARKET_V026.filter(s=>{
    const team=staffTeamLabelV026(s.id);
    return (!q || `${s.name} ${s.profession} ${s.department} ${s.nationality} ${team}`.toLowerCase().includes(q)) &&
      (V026StaffUI.profession==="all" || s.department===V026StaffUI.profession) &&
      (V026StaffUI.team==="all" || (V026StaffUI.team==="free"?!staffCurrentTeamV026(s.id):staffCurrentTeamV026(s.id)===V026StaffUI.team)) &&
      (V026StaffUI.source==="all" || s.sourceType===V026StaffUI.source);
  }).sort((a,b)=>staffRatingV026(b)-staffRatingV026(a));
}
function renderStaffMarketV026(){
  ensureManagerSystems();
  const list=filteredStaffV026(); const pages=Math.max(1,Math.ceil(list.length/V026StaffUI.pageSize)); V026StaffUI.page=Math.min(V026StaffUI.page,pages-1);
  const page=list.slice(V026StaffUI.page*V026StaffUI.pageSize,(V026StaffUI.page+1)*V026StaffUI.pageSize);
  const departments=[...new Set(STAFF_MARKET_V026.map(s=>s.department))].sort();
  return `<section class="panel"><div class="section-heading"><div><h2>Mercado global de staff</h2><p class="muted">1.000 profesionales. Los perfiles reales están identificados; habilidades y cifras económicas son de simulación. Es posible pagar cláusulas y fichar personal de otros equipos.</p></div><span class="badge blue">${list.length} perfiles</span></div>
    <div class="market-filters"><label>Buscar<input value="${esc(V026StaffUI.search)}" oninput="setStaffFilterV026('search',this.value)" placeholder="Nombre, profesión, equipo…"></label><label>Departamento<select onchange="setStaffFilterV026('profession',this.value)"><option value="all">Todos</option>${departments.map(x=>`<option ${V026StaffUI.profession===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Situación<select onchange="setStaffFilterV026('team',this.value)"><option value="all">Todos</option><option value="free" ${V026StaffUI.team==='free'?'selected':''}>Agentes libres</option>${TEAMS.map(t=>`<option value="${t.id}" ${V026StaffUI.team===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label>Origen<select onchange="setStaffFilterV026('source',this.value)"><option value="all">Todos</option><option value="real-verified" ${V026StaffUI.source==='real-verified'?'selected':''}>Nombre/rol verificado</option><option value="fictional-generated" ${V026StaffUI.source==='fictional-generated'?'selected':''}>Generado</option></select></label></div>
    <div class="staff-market-grid">${page.map(renderStaffCardV026).join('')}</div><div class="pagination"><button class="secondary" ${V026StaffUI.page<=0?'disabled':''} onclick="setStaffPageV026(-1)">Anterior</button><strong>Página ${V026StaffUI.page+1}/${pages}</strong><button class="secondary" ${V026StaffUI.page>=pages-1?'disabled':''} onclick="setStaffPageV026(1)">Siguiente</button></div></section>`;
}
function renderStaffCardV026(s){
  const hired=!!Game.manager.staff[s.id]; const currentTeam=staffCurrentTeamV026(s.id); const poach=currentTeam && currentTeam!==Game.selectedTeamId; const total=s.cost+(poach?s.buyout:0);
  const skills=Object.entries(s.skills||{}).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return `<article class="staff-market-card ${hired?'hired':''}"><div class="badge-row"><span class="badge blue">${esc(s.department)}</span><span class="badge ${s.sourceType==='real-verified'?'green':'orange'}">${s.sourceType==='real-verified'?'Nombre/rol verificado':'Perfil generado'}</span><span class="badge">OVR ${staffRatingV026(s)}</span></div><h3>${esc(s.name)}</h3><p class="staff-role">${esc(s.profession)} · ${esc(s.nationality)} · ${s.experience} años exp.</p><p class="muted small">Situación: <strong>${esc(staffTeamLabelV026(s.id))}</strong>${poach?` · cláusula ${moneyV019(s.buyout)}`:''}</p><div class="staff-skill-grid">${skills.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${v}</strong><i><b style="width:${v}%"></b></i></div>`).join('')}</div><small>${formatEffects(s.effect)}</small><button ${hired?'disabled':''} onclick="hireStaffV019('${s.id}')">${hired?'En tu equipo':poach?`Fichar · ${moneyV019(total)}`:`Contratar · ${moneyV019(total)}`}</button>${hired?`<button class="secondary" onclick="releaseStaffV026('${s.id}')">Rescindir</button>`:''}</article>`;
}
renderStaffTabV019 = function(){ensureManagerSystems();return `<div class="grid two"><section class="panel"><h2>Staff contratado</h2><div class="staff-roster-list">${Object.keys(Game.manager.staff||{}).map(id=>{const s=STAFF_MARKET_V026.find(x=>x.id===id);return s?`<div><strong>${esc(s.name)}</strong><span>${esc(s.profession)} · OVR ${staffRatingV026(s)}</span></div>`:''}).join('')||'<p class="muted">Sin staff.</p>'}</div><h3>Bonificaciones</h3>${renderStaffEffectsV019()}</section><section class="panel"><h2>Resumen del mercado</h2><div class="kpi-strip"><div><span>Total</span><strong>1.000</strong></div><div><span>Verificados</span><strong>${STAFF_MARKET_V026.filter(s=>s.sourceType==='real-verified').length}</strong></div><div><span>Libres</span><strong>${STAFF_MARKET_V026.filter(s=>!staffCurrentTeamV026(s.id)).length}</strong></div></div></section></div>${renderStaffMarketV026()}`;};

hireStaffV019 = function(id){
  ensureManagerSystems(); const s=STAFF_MARKET_V026.find(x=>x.id===id); if(!s)return; if(Game.manager.staff[id])return toast('Ya está en tu equipo');
  const oldTeam=staffCurrentTeamV026(id); const poach=oldTeam&&oldTeam!==Game.selectedTeamId; const total=s.cost+(poach?s.buyout:0);
  if(Game.manager.budget<total)return toast('Presupuesto insuficiente');
  Game.manager.budget-=total; Game.manager.staff[id]={hiredAt:Date.now(),name:s.name,fromTeamId:oldTeam||null};
  if(oldTeam&&Game.v026.teamStaff[oldTeam])Game.v026.teamStaff[oldTeam]=Game.v026.teamStaff[oldTeam].filter(x=>x!==id);
  Game.v026.staffStatus[id]={teamId:Game.selectedTeamId,contractYears:Math.max(1,s.contractYears||2)};
  Game.v026.teamStaff[Game.selectedTeamId] ||= []; if(!Game.v026.teamStaff[Game.selectedTeamId].includes(id))Game.v026.teamStaff[Game.selectedTeamId].push(id);
  toast(`${s.name} se incorpora${poach?' tras pagar su cláusula':''}`); renderRace();
};
function releaseStaffV026(id){const s=STAFF_MARKET_V026.find(x=>x.id===id);if(!s||!Game.manager.staff[id])return;const severance=Math.round(s.annualSalary*.35);if(Game.manager.budget<severance)return toast('Presupuesto insuficiente para la rescisión');Game.manager.budget-=severance;delete Game.manager.staff[id];Game.v026.staffStatus[id]={teamId:null,contractYears:0};Game.v026.teamStaff[Game.selectedTeamId]=(Game.v026.teamStaff[Game.selectedTeamId]||[]).filter(x=>x!==id);toast(`${s.name} queda libre`);renderRace();}

function buyBusV026(id){ensureManagerSystems();const bus=V026_BUS_CATALOG.find(x=>x.id===id),a=ensureClubAssetsV026();if(!bus)return;if(a.buses.includes(id)){a.activeBusId=id;return renderRace();}if(Game.manager.budget<bus.price)return toast('Presupuesto insuficiente');Game.manager.budget-=bus.price;a.buses.push(id);a.activeBusId=id;Game.v026.infrastructureLog.push({type:'bus',id,date:Date.now(),cost:bus.price});toast(`${bus.name} adquirido`);renderRace();}
function buyCarV026(id){ensureManagerSystems();const car=V026_CAR_CATALOG.find(x=>x.id===id),a=ensureClubAssetsV026();if(!car)return;if(a.cars.includes(id)){a.activeCarId=id;return renderRace();}if(Game.manager.budget<car.price)return toast('Presupuesto insuficiente');Game.manager.budget-=car.price;a.cars.push(id);a.activeCarId=id;Game.v026.infrastructureLog.push({type:'car',id,date:Date.now(),cost:car.price});toast(`${car.brand} ${car.model} adquirido`);renderRace();}
function signCarSponsorV026(id){ensureManagerSystems();const car=V026_CAR_CATALOG.find(x=>x.id===id),a=ensureClubAssetsV026();if(!car)return;a.carSponsor={brand:car.brand,carId:id,annualIncome:car.sponsorIncome,verified:false};if(!a.cars.includes(id))a.cars.push(id);a.activeCarId=id;Game.manager.budget+=car.sponsorIncome;toast(`${car.brand} se convierte en vehículo oficial del equipo`);renderRace();}
function upgradeDepartmentV026(id){ensureManagerSystems();const d=V026_DEPARTMENTS.find(x=>x.id===id),a=ensureClubAssetsV026();if(!d)return;const level=a.departments[id]||0;if(level>=d.max)return toast('Departamento al máximo');const cost=level===0?d.openCost:Math.round(d.levelCost*Math.pow(1.28,level-1));if(Game.manager.budget<cost)return toast('Presupuesto insuficiente');Game.manager.budget-=cost;a.departments[id]=level+1;Game.v026.infrastructureLog.push({type:'department',id,level:level+1,date:Date.now(),cost});toast(`${d.name}: nivel ${level+1}`);renderRace();}

function renderInfrastructureV026(){
  ensureManagerSystems(); const a=ensureClubAssetsV026(),bus=activeBusV026(),car=activeCarV026();
  return `<div class="club-dashboard"><section class="panel"><div class="section-heading"><div><h2>Centro de operaciones del equipo</h2><p class="muted">Flota, movilidad patrocinada y departamentos especializados con efectos reales sobre entrenamiento, recuperación, estrategia y material.</p></div><span class="badge green">Presupuesto ${moneyV019(Game.manager.budget)}</span></div><div class="asset-summary"><div><span>Autobús activo</span><strong>${esc(bus.name)}</strong><small>Recuperación +${bus.recovery} · Datos ${bus.data} · Fiabilidad ${bus.reliability}</small></div><div><span>Coche de dirección</span><strong>${esc(car.brand)} ${esc(car.model)}</strong><small>Almacén ${car.storage} · Datos ${car.data} · Fiabilidad ${car.reliability}</small></div><div><span>Vehículo oficial</span><strong>${esc(a.carSponsor?.brand||'Sin contrato')}</strong><small>Ingreso anual ${moneyV019(a.carSponsor?.annualIncome||0)}${a.carSponsor?.verified?' · asociación verificada':' · acuerdo de simulación'}</small></div></div></section>
  <section class="panel"><h2>Autobuses de equipo</h2><div class="asset-market-grid">${V026_BUS_CATALOG.map(x=>`<article class="asset-card ${a.activeBusId===x.id?'active':''}"><div class="badge-row"><span class="badge blue">Nivel ${x.tier}</span><span class="badge">${x.capacity} plazas</span><span class="badge orange">${moneyV019(x.price)}</span></div><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="asset-stats"><span>Recuperación <b>${x.recovery}</b></span><span>Cocina <b>${x.kitchen}</b></span><span>Fisio <b>${x.physio}</b></span><span>Datos <b>${x.data}</b></span><span>Sueño <b>${x.sleep}</b></span><span>Fiabilidad <b>${x.reliability}</b></span></div><button onclick="buyBusV026('${x.id}')">${a.buses.includes(x.id)?(a.activeBusId===x.id?'Activo':'Activar'):'Comprar'}</button></article>`).join('')}</div></section>
  <section class="panel"><h2>Coches y patrocinio de movilidad</h2><div class="asset-market-grid">${V026_CAR_CATALOG.map(x=>`<article class="asset-card ${a.activeCarId===x.id?'active':''}"><div class="badge-row"><span class="badge blue">${esc(x.brand)}</span><span class="badge">${moneyV019(x.price)}</span><span class="badge green">Sponsor ${moneyV019(x.sponsorIncome)}</span></div><h3>${esc(x.model)}</h3><p>${esc(x.description)}</p><div class="asset-stats"><span>Fiabilidad <b>${x.reliability}</b></span><span>Almacén <b>${x.storage}</b></span><span>Confort <b>${x.comfort}</b></span><span>Datos <b>${x.data}</b></span></div><div class="button-row"><button onclick="buyCarV026('${x.id}')">${a.cars.includes(x.id)?(a.activeCarId===x.id?'Activo':'Activar'):'Comprar'}</button><button class="secondary" onclick="signCarSponsorV026('${x.id}')">Vehículo oficial</button></div></article>`).join('')}</div></section>
  <section class="panel"><h2>Departamentos</h2><div class="department-grid">${V026_DEPARTMENTS.map(d=>{const l=a.departments[d.id]||0,c=l===0?d.openCost:Math.round(d.levelCost*Math.pow(1.28,l-1));return `<article class="department-card"><div class="badge-row"><span class="badge ${l?'green':'orange'}">Nivel ${l}/${d.max}</span><span class="badge">${moneyV019(c)}</span></div><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p><small>${formatEffects(d.effect)} por nivel</small><div class="level-pips">${Array.from({length:d.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div><button ${l>=d.max?'disabled':''} onclick="upgradeDepartmentV026('${d.id}')">${l===0?'Abrir departamento':'Mejorar a nivel '+(l+1)}</button></article>`}).join('')}</div></section></div>`;
}

function setYouthFilterV026(key,value){V026YouthUI[key]=value;V026YouthUI.page=0;renderRace();}
function setYouthPageV026(delta){V026YouthUI.page=Math.max(0,V026YouthUI.page+delta);renderRace();}
function filteredYouthV026(){const q=String(V026YouthUI.search||'').toLowerCase();return YOUTH_MARKET_V026.filter(y=>!Game.v026.youthSigned.includes(y.id)&&(!q||`${y.name} ${y.nationality} ${y.developmentTeam}`.toLowerCase().includes(q))&&(V026YouthUI.role==='all'||y.roleKey===V026YouthUI.role)&&(V026YouthUI.region==='all'||y.nationality===V026YouthUI.region)&&(V026YouthUI.source==='all'||y.sourceType===V026YouthUI.source)).sort((a,b)=>b.potential-a.potential||b.base-a.base);}
function signYouthV026(id){ensureManagerSystems();const y=YOUTH_MARKET_V026.find(x=>x.id===id);if(!y||Game.v026.youthSigned.includes(id))return;const total=y.transferCost+y.askingSalary;if(Game.manager.budget<total)return toast('Presupuesto insuficiente');Game.manager.budget-=total;const rider={...clone(y),id:`signed_${Date.now()}_${slugV025(y.name)}`,teamId:Game.selectedTeamId,season:Game.historical?.selectedYear||2026,defaultOrder:'hold',defaultEffort:65,morale:76,fatigue:0,energy:100,totalTime:0,points:0,mountainPoints:0,uciPoints:0,stageWins:0,seasonStageWins:0,raceDays:0,abandoned:false,weightKg:y.roleKey==='climber'?61:y.roleKey==='sprinter'?76:69};Game.riders.push(rider);RIDERS.push(clone(rider));Game.manager.contracts[rider.id]={salary:y.askingSalary,years:3,role:'Desarrollo',promise:'Progresión U23'};Game.v026.youthSigned.push(id);toast(`${y.name} ficha por el equipo`);renderRace();}
function renderYouthMarketV026(){ensureManagerSystems();const list=filteredYouthV026();const pages=Math.max(1,Math.ceil(list.length/V026YouthUI.pageSize));V026YouthUI.page=Math.min(V026YouthUI.page,pages-1);const page=list.slice(V026YouthUI.page*V026YouthUI.pageSize,(V026YouthUI.page+1)*V026YouthUI.pageSize);const regions=[...new Set(YOUTH_MARKET_V026.map(y=>y.nationality))].sort();return `<section class="panel youth-market"><div class="section-heading"><div><h2>Mercado U23 y categorías inferiores</h2><p class="muted">1.000 talentos. Los nombres reales de academias están identificados, pero todos los ratings son de simulación. La capacidad inicial máxima es 77 y solo 1 de 1.000 perfiles alcanza potencial de superestrella.</p></div><span class="badge blue">${list.length} disponibles</span></div><div class="market-filters"><label>Buscar<input value="${esc(V026YouthUI.search)}" oninput="setYouthFilterV026('search',this.value)" placeholder="Nombre, país o academia"></label><label>Perfil<select onchange="setYouthFilterV026('role',this.value)"><option value="all">Todos</option>${[...new Set(YOUTH_MARKET_V026.map(y=>y.roleKey))].map(x=>`<option value="${x}" ${V026YouthUI.role===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>País<select onchange="setYouthFilterV026('region',this.value)"><option value="all">Todos</option>${regions.map(x=>`<option ${V026YouthUI.region===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label>Origen<select onchange="setYouthFilterV026('source',this.value)"><option value="all">Todos</option><option value="real-name-simulated-rating" ${V026YouthUI.source==='real-name-simulated-rating'?'selected':''}>Nombre real / rating simulado</option><option value="fictional-generated" ${V026YouthUI.source==='fictional-generated'?'selected':''}>Generado</option></select></label></div><div class="youth-grid">${page.map(y=>`<article class="youth-card"><div class="badge-row"><span class="badge green">${esc(y.role)}</span><span class="badge blue">Base ${y.base}</span><span class="badge orange">Pot. ${y.potential}</span><span class="badge">${y.age} años</span></div><h3>${esc(y.name)}</h3><p class="muted small">${esc(y.nationality)} · ${esc(y.developmentTeam)}</p><div class="mini-stats"><span>⛰ ${y.stats.mountain}</span><span>⚡ ${y.stats.sprint}</span><span>⏱ ${y.stats.tt}</span><span>🪨 ${y.stats.cobbles}</span><span>🫀 ${y.stats.stamina}</span></div><p class="small">${esc(y.personality)} · progresión ${esc(y.progression)} · confianza ${y.scoutConfidence}%</p><small>${y.sourceType==='real-name-simulated-rating'?'Nombre documentado; valoración simulada':'Perfil ficticio generado'}</small><button onclick="signYouthV026('${y.id}')">Fichar · ${moneyV019(y.transferCost+y.askingSalary)}</button></article>`).join('')}</div><div class="pagination"><button class="secondary" ${V026YouthUI.page<=0?'disabled':''} onclick="setYouthPageV026(-1)">Anterior</button><strong>Página ${V026YouthUI.page+1}/${pages}</strong><button class="secondary" ${V026YouthUI.page>=pages-1?'disabled':''} onclick="setYouthPageV026(1)">Siguiente</button></div></section>`;}

const renderContractsScoutingV024BaseV026=renderContractsScoutingV024;
renderContractsScoutingV024=function(){return renderContractsScoutingV024BaseV026()+renderYouthMarketV026();};

const renderOperationsV024BaseV026=renderOperationsV024;
renderOperationsV024=function(){return renderOperationsV024BaseV026();};

/* Reemplazo del render principal para añadir el centro del club sin perder pestañas anteriores. */
renderRace = function() {
  ensureV024State(); ensureManagerSystems();
  const race=getRace(),team=getTeam(Game.selectedTeamId);
  const tabs=[["director","Race Director"],["broadcast","TV"],["strategy","Estrategia"],["nutrition","Alimentación"],["material","Material"],["team","Equipo"],["class","Clasificaciones"],["objectives","Objetivos"],["season_plan","Plan anual"],["contracts","Contratos / Cantera"],["operations","Staff / Logística"],["club","Club / Infraestructura"],["analytics","Análisis"],["alerts","Alertas"],["records","Récords"],["history","Historial"]];
  app.innerHTML=`<div class="header"><div><h1>${esc(team.name)}</h1><p>v0.26 · ${Game.mode==='season'?`Temporada ${Game.seasonIndex+1}/${SEASON_RACE_IDS.length} · `:''}${esc(race.name)} · Etapa ${Game.currentStageIndex+1}/${race.stages.length} · ${TEAMS.length} equipos</p></div><div class="top-actions"><button class="secondary" onclick="saveGame()">Guardar</button><button class="danger" onclick="init()">Reiniciar</button></div></div>${renderManagerHeaderV019()}${renderLeaderStrip()}<div class="tabs">${tabs.map(([id,label])=>`<button class="tab ${Game.activeTab===id?'active':''}" onclick="setTab('${id}')">${label}</button>`).join('')}</div>
  ${Game.activeTab==='director'?renderDirectorTab():''}${Game.activeTab==='broadcast'?renderBroadcastTabV019():''}${Game.activeTab==='strategy'?renderStrategyTab(false):''}${Game.activeTab==='nutrition'?renderNutritionTab():''}${Game.activeTab==='material'?renderMaterialTab():''}${Game.activeTab==='team'?renderTeamTab():''}${Game.activeTab==='class'?renderClassTab():''}${Game.activeTab==='objectives'?renderObjectivesTabV019():''}${Game.activeTab==='season_plan'?renderSeasonPlanningV024():''}${Game.activeTab==='contracts'?renderContractsScoutingV024():''}${Game.activeTab==='operations'?renderOperationsV024():''}${Game.activeTab==='club'?renderInfrastructureV026():''}${Game.activeTab==='analytics'?renderAnalyticsV024():''}${Game.activeTab==='alerts'?renderAlertSettingsV024():''}${Game.activeTab==='records'?renderRecordsV024():''}${Game.activeTab==='history'?renderHistoryTab():''}`;
};

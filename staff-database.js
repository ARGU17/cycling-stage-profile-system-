/* ============================================================
   CYCLING MANAGER TOUR v0.25 HISTORICAL
   Staff nominal de ficción, creado para el simulador.
   Los nombres no pretenden representar plantillas reales.
   ============================================================ */

const NAMED_STAFF_V025 = [
  {id:"sd_marc_vidal",name:"Marc Vidal",profession:"Director deportivo",department:"Dirección",nationality:"España",age:48,experience:24,cost:920000,skills:{tactics:94,motivation:89,grandTours:93,classics:78,sprint:72,ttt:88,weather:86},effect:{tactics:10,aiRecommendation:11,sponsor:3},traits:["Estratega GC","Calma bajo presión"],description:"Director experto en grandes vueltas, control de fugas y decisiones de montaña."},
  {id:"sd_luc_van_der_meer",name:"Luc van der Meer",profession:"Director deportivo",department:"Dirección",nationality:"Países Bajos",age:52,experience:28,cost:880000,skills:{tactics:91,motivation:84,grandTours:78,classics:95,sprint:88,ttt:82,weather:94},effect:{tactics:9,aiRecommendation:9,cobbles:6},traits:["Clásicas del norte","Abanicos"],description:"Especialista en pavé, viento lateral, posicionamiento y trenes de sprint."},
  {id:"sd_giulia_rossi",name:"Giulia Rossi",profession:"Directora deportiva",department:"Dirección",nationality:"Italia",age:43,experience:18,cost:810000,skills:{tactics:90,motivation:92,grandTours:87,classics:86,sprint:75,ttt:84,weather:80},effect:{tactics:8,aiRecommendation:10,morale:4},traits:["Gestión humana","Ataques de largo alcance"],description:"Combina lectura táctica, gestión de líderes y ofensivas con corredores puente."},
  {id:"coach_anna_keller",name:"Anna Keller",profession:"Entrenadora de rendimiento",department:"Preparación",nationality:"Alemania",age:41,experience:17,cost:760000,skills:{periodization:95,load:94,recovery:88,altitude:82,sprint:74,tt:90},effect:{form:7,fatigue:-5,training:9},traits:["Periodización A/B/C","Control de carga"],description:"Planifica picos de forma y reduce el riesgo de sobreentrenamiento."},
  {id:"coach_mateo_saldana",name:"Mateo Saldaña",profession:"Entrenador de altura",department:"Preparación",nationality:"Colombia",age:46,experience:21,cost:610000,skills:{periodization:85,load:88,recovery:83,altitude:97,mountain:96,heat:82},effect:{mountain:6,recovery:4,form:4},traits:["Altitud","Escaladores"],description:"Especialista en Teide, Sierra Nevada, Andorra y aclimatación prolongada."},
  {id:"coach_sophie_laurent",name:"Sophie Laurent",profession:"Entrenadora de sprint",department:"Preparación",nationality:"Francia",age:39,experience:14,cost:560000,skills:{sprint:96,leadout:94,positioning:91,acceleration:93,load:82,recovery:78},effect:{sprint:6,positioning:5,training:5},traits:["Trenes de lanzamiento","Potencia neuromuscular"],description:"Mejora automatismos de sprint, colocación y selección de lanzadores."},
  {id:"coach_erik_lindholm",name:"Erik Lindholm",profession:"Entrenador de crono",department:"Preparación",nationality:"Suecia",age:44,experience:19,cost:640000,skills:{tt:97,ttt:96,aero:92,pacing:95,load:84,recovery:80},effect:{pacing:8,ttt:7,form:3},traits:["Pacing CRI","Rotaciones CRE"],description:"Optimiza potencia, aerodinámica, relevos y disciplina colectiva de crono."},
  {id:"nut_laura_bianchi",name:"Laura Bianchi",profession:"Nutricionista",department:"Salud",nationality:"Italia",age:37,experience:13,cost:430000,skills:{nutrition:96,hydration:94,heat:91,gutTraining:92,recovery:87},effect:{nutrition:11,heat:6},traits:["90-120 g CHO/h","Entrenamiento gastrointestinal"],description:"Ajusta carbohidratos, hidratación y cafeína por corredor y etapa."},
  {id:"nut_daniel_okafor",name:"Daniel Okafor",profession:"Nutricionista",department:"Salud",nationality:"Reino Unido",age:40,experience:16,cost:390000,skills:{nutrition:91,hydration:96,heat:95,gutTraining:85,recovery:89},effect:{nutrition:9,heat:8,recovery:2},traits:["Calor extremo","Balance electrolítico"],description:"Especialista en carreras calurosas, sudoración elevada y recuperación rápida."},
  {id:"doctor_elena_martin",name:"Elena Martín",profession:"Médica de equipo",department:"Salud",nationality:"España",age:45,experience:20,cost:590000,skills:{diagnosis:94,recovery:93,injuryPrevention:96,illness:91,travel:84},effect:{fatigue:-4,recovery:6,medical:9},traits:["Prevención","Retorno progresivo"],description:"Reduce lesiones, enfermedades y tiempos de recuperación entre carreras."},
  {id:"doctor_henrik_sorensen",name:"Henrik Sørensen",profession:"Médico de equipo",department:"Salud",nationality:"Dinamarca",age:50,experience:25,cost:620000,skills:{diagnosis:96,recovery:90,injuryPrevention:90,illness:95,travel:92},effect:{fatigue:-3,recovery:5,travel:5},traits:["Grandes vueltas","Jet lag"],description:"Especialista en salud durante vueltas de tres semanas y viajes intercontinentales."},
  {id:"mech_koen_de_wilde",name:"Koen De Wilde",profession:"Jefe de mecánicos",department:"Material",nationality:"Bélgica",age:47,experience:26,cost:510000,skills:{reliability:97,cobbles:98,tires:95,tt:82,wetWeather:96},effect:{reliability:11,cobbles:6,tires:5},traits:["Pavé","Tubeless y presiones"],description:"Reduce averías y optimiza neumáticos para pavé, barro y lluvia."},
  {id:"mech_takumi_nakamura",name:"Takumi Nakamura",profession:"Ingeniero de material",department:"Material",nationality:"Japón",age:42,experience:18,cost:560000,skills:{reliability:93,aero:97,tt:96,wheels:94,telemetry:91},effect:{reliability:8,ttt:6,pacing:3},traits:["Aero","Telemetría"],description:"Configura cuadros, ruedas y posición aero para CRI y CRE."},
  {id:"analyst_nora_becker",name:"Nora Becker",profession:"Analista de datos",department:"I+D",nationality:"Alemania",age:34,experience:10,cost:380000,skills:{forecast:96,pacing:94,opponents:92,weather:89,scouting:82},effect:{pacing:7,ttt:5,scouting:4,aiRecommendation:5},traits:["Modelos predictivos","Rivales GC"],description:"Mejora predicciones de fuga, pacing y lectura de amenazas tácticas."},
  {id:"analyst_pierre_moreau",name:"Pierre Moreau",profession:"Analista de carrera",department:"I+D",nationality:"Francia",age:38,experience:14,cost:350000,skills:{forecast:90,pacing:88,opponents:96,weather:91,scouting:80},effect:{aiRecommendation:7,tactics:4,weather:4},traits:["Análisis rival","Clima"],description:"Detecta patrones tácticos de equipos rivales y riesgos por meteorología."},
  {id:"scout_camilo_restrepo",name:"Camilo Restrepo",profession:"Ojeador",department:"Scouting",nationality:"Colombia",age:49,experience:23,cost:290000,skills:{scouting:94,climbers:98,potential:91,character:85,network:96},effect:{scouting:9,climbers:7},traits:["Andes","Escaladores U23"],description:"Red extensa en Colombia, Ecuador y Venezuela; identifica escaladores ligeros."},
  {id:"scout_eline_janssens",name:"Eline Janssens",profession:"Ojeadora",department:"Scouting",nationality:"Bélgica",age:36,experience:12,cost:280000,skills:{scouting:93,classics:97,potential:88,character:91,network:92},effect:{scouting:8,classics:7},traits:["Benelux","Ciclocross"],description:"Busca clasicómanos, rodadores y talentos de ciclocross adaptables a carretera."},
  {id:"scout_lars_nielsen",name:"Lars Nielsen",profession:"Ojeador",department:"Scouting",nationality:"Dinamarca",age:44,experience:18,cost:275000,skills:{scouting:90,tt:96,potential:90,character:84,network:90},effect:{scouting:8,ttt:5,pacing:3},traits:["Nórdicos","Croners"],description:"Especialista en talentos nórdicos de crono y potencia sostenida."},
  {id:"scout_marta_fernandez",name:"Marta Fernández",profession:"Ojeadora",department:"Scouting",nationality:"España",age:39,experience:15,cost:270000,skills:{scouting:92,puncheurs:94,climbers:88,potential:91,network:94},effect:{scouting:8,mountain:4},traits:["Península Ibérica","Puncheurs"],description:"Red en España y Portugal, con especialidad en escaladores y puncheurs."},
  {id:"psych_olivia_hart",name:"Olivia Hart",profession:"Psicóloga deportiva",department:"Salud",nationality:"Irlanda",age:40,experience:15,cost:330000,skills:{motivation:97,conflict:94,pressure:96,leadership:91,recovery:82},effect:{morale:8,sponsor:2,tactics:2},traits:["Conflictos de liderazgo","Presión mediática"],description:"Mejora moral, química del equipo y aceptación de roles prometidos."},
  {id:"logistics_ines_costa",name:"Inês Costa",profession:"Responsable de logística",department:"Operaciones",nationality:"Portugal",age:43,experience:19,cost:310000,skills:{travel:97,hotels:94,altitude:88,costControl:91,adaptation:95},effect:{travel:9,recovery:3,budget:2},traits:["Grandes vueltas","Viajes largos"],description:"Reduce fatiga de viaje, optimiza hoteles y llegada anticipada."},
  {id:"aero_michael_reed",name:"Michael Reed",profession:"Ingeniero aerodinámico",department:"I+D",nationality:"Estados Unidos",age:45,experience:20,cost:650000,skills:{aero:98,tt:96,position:94,wheels:92,simulation:95},effect:{pacing:6,ttt:7,reliability:2},traits:["Túnel de viento","CFD"],description:"Mejora rendimiento de material, postura y elección de ruedas en cronos."},
  {id:"physio_clara_meier",name:"Clara Meier",profession:"Fisioterapeuta",department:"Salud",nationality:"Suiza",age:38,experience:14,cost:360000,skills:{recovery:96,injuryPrevention:92,mobility:94,stageRace:91},effect:{fatigue:-5,recovery:5},traits:["Recuperación diaria","Movilidad"],description:"Acelera recuperación en carreras por etapas y previene sobrecargas."}
];

STAFF_OPTIONS_V019.splice(0, STAFF_OPTIONS_V019.length, ...NAMED_STAFF_V025);

function topStaffSkillsV025(staff) {
  return Object.entries(staff.skills || {}).sort((a,b)=>b[1]-a[1]).slice(0,6);
}

renderStaffCardV019 = function(s) {
  const hired = !!Game.manager.staff[s.id];
  return `<div class="staff-card named-staff-card ${hired?"hired":""}">
    <div class="badge-row"><span class="badge blue">${esc(s.profession || s.department)}</span><span class="badge">${esc(s.nationality || "")}</span><span class="badge orange">${s.experience || 0} años exp.</span><span class="badge">${moneyV019(s.cost)}</span></div>
    <h3>${esc(s.name)}</h3><p class="staff-meta">${s.age || "—"} años · ${esc((s.traits || []).join(" · "))}</p><p>${esc(s.description)}</p>
    <div class="staff-skill-grid">${topStaffSkillsV025(s).map(([key,value])=>`<div><span>${esc(key)}</span><strong>${value}</strong><i><b style="width:${value}%"></b></i></div>`).join("")}</div>
    <small>${formatEffects(s.effect)}</small><button ${hired?"disabled":""} onclick="hireStaffV019('${s.id}')">${hired?"Contratado":"Contratar"}</button>
  </div>`;
};

function staffFitsRoleV025(staff, role) {
  if (!staff || !role) return false;
  if (staff.effect && Number.isFinite(Number(staff.effect[role.requiredEffect]))) return true;
  const profession = String(staff.profession || "").toLowerCase();
  return ({director:"director",coach:"entrenador",nutrition:"nutric",mechanic:"mecán|ingeniero de material",analyst:"analista|aerodinámico",scout:"ojeador"}[role.id] || "").split("|").some(x=>profession.includes(x.replace("mecán","mecán")));
}

renderOperationsV024 = function() {
  ensureV024State();
  const teamId = Game.selectedTeamId;
  const race = getRace();
  ensureRaceOperationsV024(teamId, race.id);
  const assignments = Game.v024.staffAssignments[teamId][race.id];
  const logistics = Game.v024.logistics[teamId][race.id];
  return `<section class="panel"><h2>Operaciones de carrera: staff nominal y logística</h2><p class="muted">Selecciona profesionales por nombre, experiencia y especialidad. Solo el staff asignado aporta su efecto completo.</p>
    <div class="operations-grid">
      <div class="manager-card"><h3>Staff para ${esc(race.name)}</h3>${STAFF_RACE_ROLES_V024.map(role => {
        const candidates = Object.keys(Game.manager.staff || {}).map(id=>STAFF_OPTIONS_V019.find(x=>x.id===id)).filter(s=>staffFitsRoleV025(s,role));
        return `<label>${esc(role.name)}<select onchange="assignStaffV024('${role.id}',this.value)"><option value="">Sin asignar</option>${candidates.map(s=>`<option value="${s.id}" ${assignments[role.id]===s.id?"selected":""}>${esc(s.name)} · ${esc(s.profession)} · ${topStaffSkillsV025(s)[0]?.[1] || 0}</option>`).join("")}</select></label>`;
      }).join("")}<div class="effect-grid">${renderAssignedStaffEffectsV024()}</div></div>
      <div class="manager-card"><h3>Plan logístico</h3><label>Nivel de operación<select onchange="setLogisticsPlanV024(this.value)">${LOGISTICS_PLANS_V024.map(p=>`<option value="${p.id}" ${logistics.planId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label><label>Llegada<select onchange="setArrivalPlanV024(this.value)">${ARRIVAL_OPTIONS_V024.map(p=>`<option value="${p.id}" ${logistics.arrivalId===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select></label>${renderLogisticsSummaryV024(race,logistics)}<button class="secondary" onclick="payLogisticsV024()">Confirmar y pagar operación</button></div>
    </div><h2>Mercado de staff</h2>${renderStaffTabV019()}</section>`;
};

/* ============================================================
   CYCLING MANAGER TOUR
   data.js
   v0.19 Pro Peloton + Season Calendar + TT/TTT + Training Camps
   ============================================================ */

const SAVE_VERSION = "v0.24+";
const ROSTER_SIZE = 8;
const DEFAULT_RACE_ID = "santos";

function dataClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashNoise(seedText, scale = 1) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  const x = Math.sin(Math.abs(h)) * 10000;
  return ((x - Math.floor(x)) - 0.5) * scale;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ============================================================
   EQUIPOS 2026 WT + PRT
   PCS lista equipos y tamaños 2026. Los rosters se completan a
   esos tamaños para que el pelotón funcione entero en simulación.
   ============================================================ */

const TEAMS = [
  { id:"alpecin", name:"Alpecin - Premier Tech", level:"WT", country:"Belgium", size:30, archetype:"Clásicas / Sprint", visual:{primary:"#101827",secondary:"#00a6d6",accent:"#e11d48",logoText:"ALPECIN"}, material:{frame:"canyon",wheels:"shimano"}, ai:{gc:28,sprint:97,classics:98,breakaway:72,control:58}},
  { id:"bahrain", name:"Bahrain - Victorious", level:"WT", country:"Bahrain", size:28, archetype:"Montaña / Clásicas", visual:{primary:"#e31b23",secondary:"#ffffff",accent:"#111827",logoText:"BAHRAIN"}, material:{frame:"bianchi",wheels:"vision"}, ai:{gc:76,sprint:55,classics:74,breakaway:78,control:58}},
  { id:"decathlon", name:"Decathlon CMA CGM Team", level:"WT", country:"France", size:28, archetype:"Desarrollo / Montaña", visual:{primary:"#00b386",secondary:"#0f172a",accent:"#f97316",logoText:"DECATHLON"}, material:{frame:"vanrysel",wheels:"swissside"}, ai:{gc:78,sprint:75,classics:72,breakaway:80,control:60}},
  { id:"ef", name:"EF Education - EasyPost", level:"WT", country:"United States", size:29, archetype:"Etapas / Fugas", visual:{primary:"#ff4fa3",secondary:"#111827",accent:"#22c55e",logoText:"EF"}, material:{frame:"cannondale",wheels:"vision"}, ai:{gc:66,sprint:54,classics:76,breakaway:88,control:48}},
  { id:"groupama", name:"Groupama - FDJ United", level:"WT", country:"France", size:29, archetype:"Sprint / Desarrollo", visual:{primary:"#0f5fb3",secondary:"#ffffff",accent:"#ef4444",logoText:"FDJ"}, material:{frame:"wilier",wheels:"shimano"}, ai:{gc:52,sprint:82,classics:70,breakaway:78,control:50}},
  { id:"lidl", name:"Lidl - Trek", level:"WT", country:"Germany", size:30, archetype:"Sprint / Clásicas / GC", visual:{primary:"#0f172a",secondary:"#e11d48",accent:"#facc15",logoText:"LIDL TREK"}, material:{frame:"trek",wheels:"bontrager"}, ai:{gc:78,sprint:92,classics:90,breakaway:66,control:74}},
  { id:"lotto", name:"Lotto Intermarché", level:"WT", country:"Belgium", size:30, archetype:"Sprint / Fugas", visual:{primary:"#ef4444",secondary:"#facc15",accent:"#111827",logoText:"LOTTO"}, material:{frame:"cube",wheels:"newmen"}, ai:{gc:38,sprint:86,classics:78,breakaway:82,control:45}},
  { id:"movistar", name:"Movistar Team", level:"WT", country:"Spain", size:28, archetype:"Montaña / Etapas", visual:{primary:"#2563eb",secondary:"#22c55e",accent:"#ffffff",logoText:"MOVISTAR"}, material:{frame:"canyon",wheels:"zipp"}, ai:{gc:78,sprint:45,classics:64,breakaway:85,control:55}},
  { id:"ineos", name:"Netcompany INEOS", level:"WT", country:"Great Britain", size:29, archetype:"Crono / GC", visual:{primary:"#d91e36",secondary:"#111827",accent:"#ffffff",logoText:"INEOS"}, material:{frame:"pinarello",wheels:"shimano"}, ai:{gc:86,sprint:30,classics:62,breakaway:50,control:80}},
  { id:"nsn", name:"NSN Cycling Team", level:"WT", country:"Spain", size:31, archetype:"GC / Sprint", visual:{primary:"#7c3aed",secondary:"#111827",accent:"#22c55e",logoText:"NSN"}, material:{frame:"scott",wheels:"syncros"}, ai:{gc:82,sprint:82,classics:70,breakaway:62,control:68}},
  { id:"redbull", name:"Red Bull - BORA - hansgrohe", level:"WT", country:"Germany", size:30, archetype:"GC / Potencia", visual:{primary:"#0f172a",secondary:"#f59e0b",accent:"#ef4444",logoText:"RED BULL"}, material:{frame:"specialized",wheels:"roval"}, ai:{gc:94,sprint:60,classics:70,breakaway:58,control:84}},
  { id:"soudal", name:"Soudal Quick-Step", level:"WT", country:"Belgium", size:30, archetype:"Sprint / Crono", visual:{primary:"#2563eb",secondary:"#ffffff",accent:"#ef4444",logoText:"SOUDAL"}, material:{frame:"specialized",wheels:"roval"}, ai:{gc:74,sprint:90,classics:84,breakaway:58,control:70}},
  { id:"jayco", name:"Team Jayco AlUla", level:"WT", country:"Australia", size:29, archetype:"Sprint / Etapas", visual:{primary:"#0f4c81",secondary:"#f97316",accent:"#ffffff",logoText:"JAYCO"}, material:{frame:"giant",wheels:"cadex"}, ai:{gc:62,sprint:86,classics:72,breakaway:76,control:55}},
  { id:"picnic", name:"Team Picnic PostNL", level:"WT", country:"Netherlands", size:28, archetype:"Sprint / Desarrollo", visual:{primary:"#ffffff",secondary:"#111827",accent:"#fb7185",logoText:"PICNIC"}, material:{frame:"scott",wheels:"syncros"}, ai:{gc:50,sprint:82,classics:70,breakaway:80,control:48}},
  { id:"visma", name:"Team Visma | Lease a Bike", level:"WT", country:"Netherlands", size:29, archetype:"GC / Bloque", visual:{primary:"#facc15",secondary:"#111827",accent:"#2563eb",logoText:"VISMA"}, material:{frame:"cervelo",wheels:"reserve"}, ai:{gc:96,sprint:64,classics:80,breakaway:56,control:95}},
  { id:"uae", name:"UAE Team Emirates - XRG", level:"WT", country:"United Arab Emirates", size:30, archetype:"Superteam / GC", visual:{primary:"#00843d",secondary:"#ffffff",accent:"#d32f2f",logoText:"UAE"}, material:{frame:"colnago",wheels:"enve"}, ai:{gc:99,sprint:45,classics:76,breakaway:52,control:94}},
  { id:"unox", name:"Uno-X Mobility", level:"WT", country:"Norway", size:30, archetype:"Sprint / Fugas", visual:{primary:"#ef4444",secondary:"#facc15",accent:"#111827",logoText:"UNO-X"}, material:{frame:"dare",wheels:"dt_swiss"}, ai:{gc:42,sprint:84,classics:78,breakaway:88,control:42}},
  { id:"astana", name:"XDS Astana Team", level:"WT", country:"Kazakhstan", size:30, archetype:"Fugas / Experiencia", visual:{primary:"#38bdf8",secondary:"#111827",accent:"#facc15",logoText:"ASTANA"}, material:{frame:"xds",wheels:"vision"}, ai:{gc:48,sprint:70,classics:66,breakaway:86,control:40}},
  { id:"bardiani", name:"Bardiani CSF 7 Saber", level:"PRT", country:"Italy", size:23, archetype:"Fugas / Jóvenes", visual:{primary:"#16a34a",secondary:"#ffffff",accent:"#ef4444",logoText:"BARDIANI"}, material:{frame:"de_rosa",wheels:"fulcrum"}, ai:{gc:32,sprint:58,classics:58,breakaway:92,control:25}},
  { id:"burgos", name:"Burgos Burpellet BH", level:"PRT", country:"Spain", size:24, archetype:"Montaña / Fugas", visual:{primary:"#ffffff",secondary:"#ec4899",accent:"#7c3aed",logoText:"BURGOS BH"}, material:{frame:"bh",wheels:"vision"}, ai:{gc:42,sprint:48,classics:60,breakaway:94,control:28}},
  { id:"caja", name:"Caja Rural - Seguros RGA", level:"PRT", country:"Spain", size:26, archetype:"Sprint / Fugas", visual:{primary:"#0f7d45",secondary:"#ffffff",accent:"#d9a441",logoText:"CAJA RURAL"}, material:{frame:"mmr",wheels:"vision"}, ai:{gc:38,sprint:72,classics:58,breakaway:92,control:32}},
  { id:"cofidis", name:"Cofidis", level:"PRT", country:"France", size:30, archetype:"Sprint / Etapas", visual:{primary:"#dc2626",secondary:"#ffffff",accent:"#111827",logoText:"COFIDIS"}, material:{frame:"look",wheels:"corima"}, ai:{gc:45,sprint:80,classics:70,breakaway:82,control:45}},
  { id:"kern", name:"Equipo Kern Pharma", level:"PRT", country:"Spain", size:22, archetype:"Jóvenes / Fugas", visual:{primary:"#16a34a",secondary:"#ffffff",accent:"#0f172a",logoText:"KERN"}, material:{frame:"giant",wheels:"cadex"}, ai:{gc:46,sprint:54,classics:62,breakaway:94,control:28}},
  { id:"euskaltel", name:"Euskaltel - Euskadi", level:"PRT", country:"Spain", size:22, archetype:"Cantera / Fugas", visual:{primary:"#f97316",secondary:"#fb7185",accent:"#111827",logoText:"EUSKALTEL"}, material:{frame:"orbea",wheels:"orbea"}, ai:{gc:38,sprint:34,classics:64,breakaway:96,control:26}},
  { id:"mbh", name:"MBH Bank CSB Telecom Fort", level:"PRT", country:"Hungary", size:21, archetype:"Fugas", visual:{primary:"#0ea5e9",secondary:"#f8fafc",accent:"#ef4444",logoText:"MBH"}, material:{frame:"colnago",wheels:"fulcrum"}, ai:{gc:25,sprint:50,classics:52,breakaway:88,control:22}},
  { id:"modern", name:"Modern Adventure Pro Cycling", level:"PRT", country:"United States", size:21, archetype:"Desarrollo", visual:{primary:"#111827",secondary:"#22c55e",accent:"#facc15",logoText:"MODERN"}, material:{frame:"cannondale",wheels:"vision"}, ai:{gc:30,sprint:55,classics:55,breakaway:90,control:24}},
  { id:"q365", name:"Pinarello Q36.5 Pro Cycling Team", level:"PRT", country:"Switzerland", size:30, archetype:"Clásicas / Crono", visual:{primary:"#111827",secondary:"#94a3b8",accent:"#f97316",logoText:"Q36.5"}, material:{frame:"pinarello",wheels:"shimano"}, ai:{gc:62,sprint:60,classics:82,breakaway:82,control:50}},
  { id:"nippo", name:"Solution Tech NIPPO Rali", level:"PRT", country:"Portugal", size:23, archetype:"Fugas / Sprint", visual:{primary:"#2563eb",secondary:"#ffffff",accent:"#ef4444",logoText:"NIPPO"}, material:{frame:"aurum",wheels:"fulcrum"}, ai:{gc:30,sprint:62,classics:58,breakaway:90,control:24}},
  { id:"flanders", name:"Team Flanders - Baloise", level:"PRT", country:"Belgium", size:20, archetype:"Pavé / Desarrollo", visual:{primary:"#facc15",secondary:"#111827",accent:"#ef4444",logoText:"FLANDERS"}, material:{frame:"eddy_merckx",wheels:"dt_swiss"}, ai:{gc:22,sprint:58,classics:78,breakaway:90,control:25}},
  { id:"novo", name:"Team Novo Nordisk", level:"PRT", country:"United States", size:21, archetype:"Desarrollo / Fugas", visual:{primary:"#2563eb",secondary:"#ffffff",accent:"#22c55e",logoText:"NOVO"}, material:{frame:"colnago",wheels:"vision"}, ai:{gc:22,sprint:50,classics:50,breakaway:86,control:22}},
  { id:"polti", name:"Team Polti VisitMalta", level:"PRT", country:"Italy", size:24, archetype:"Sprint / Fugas", visual:{primary:"#ef4444",secondary:"#ffffff",accent:"#16a34a",logoText:"POLTI"}, material:{frame:"aurum",wheels:"fulcrum"}, ai:{gc:34,sprint:70,classics:60,breakaway:90,control:32}},
  { id:"total", name:"TotalEnergies", level:"PRT", country:"France", size:31, archetype:"Sprint / Clásicas", visual:{primary:"#ef4444",secondary:"#facc15",accent:"#111827",logoText:"TOTAL"}, material:{frame:"cube",wheels:"newmen"}, ai:{gc:36,sprint:76,classics:76,breakaway:86,control:40}},
  { id:"tudor", name:"Tudor Pro Cycling Team", level:"PRT", country:"Switzerland", size:31, archetype:"Clásicas / Crono", visual:{primary:"#e5e7eb",secondary:"#111827",accent:"#dc2626",logoText:"TUDOR"}, material:{frame:"bmc",wheels:"dt_swiss"}, ai:{gc:62,sprint:74,classics:84,breakaway:78,control:55}},
  { id:"unibet", name:"Unibet Rose Rockets", level:"PRT", country:"Belgium", size:30, archetype:"Sprint / Fugas", visual:{primary:"#22c55e",secondary:"#111827",accent:"#fb7185",logoText:"UNIBET"}, material:{frame:"de_rosa",wheels:"fulcrum"}, ai:{gc:32,sprint:68,classics:62,breakaway:90,control:30}}
];

const FRAME_BRANDS = [
  {id:"colnago",name:"Colnago",aero:96,weight:94,stiffness:97,comfort:88,handling:93,cobbles:84,tt:88,reliability:94},
  {id:"cervelo",name:"Cervélo",aero:98,weight:93,stiffness:95,comfort:87,handling:92,cobbles:83,tt:97,reliability:93},
  {id:"pinarello",name:"Pinarello",aero:97,weight:92,stiffness:98,comfort:87,handling:96,cobbles:84,tt:95,reliability:94},
  {id:"canyon",name:"Canyon",aero:97,weight:94,stiffness:95,comfort:88,handling:92,cobbles:86,tt:95,reliability:93},
  {id:"specialized",name:"Specialized",aero:99,weight:95,stiffness:96,comfort:90,handling:94,cobbles:86,tt:94,reliability:95},
  {id:"trek",name:"Trek",aero:95,weight:93,stiffness:94,comfort:91,handling:93,cobbles:89,tt:91,reliability:95},
  {id:"merida",name:"Merida",aero:94,weight:92,stiffness:94,comfort:89,handling:91,cobbles:86,tt:90,reliability:94},
  {id:"vanrysel",name:"Van Rysel",aero:93,weight:91,stiffness:92,comfort:88,handling:90,cobbles:84,tt:88,reliability:91},
  {id:"mmr",name:"MMR",aero:90,weight:93,stiffness:91,comfort:87,handling:89,cobbles:82,tt:85,reliability:90},
  {id:"bh",name:"BH",aero:91,weight:94,stiffness:92,comfort:88,handling:90,cobbles:83,tt:86,reliability:91},
  {id:"orbea",name:"Orbea",aero:92,weight:93,stiffness:92,comfort:89,handling:91,cobbles:84,tt:87,reliability:92},
  {id:"aurum",name:"Aurum",aero:92,weight:92,stiffness:92,comfort:88,handling:90,cobbles:83,tt:87,reliability:90},
  {id:"bianchi",name:"Bianchi",aero:92,weight:94,stiffness:93,comfort:88,handling:91,cobbles:83,tt:88,reliability:91},
  {id:"cannondale",name:"Cannondale",aero:94,weight:93,stiffness:92,comfort:90,handling:92,cobbles:85,tt:89,reliability:92},
  {id:"wilier",name:"Wilier",aero:96,weight:92,stiffness:94,comfort:87,handling:91,cobbles:83,tt:92,reliability:91},
  {id:"cube",name:"Cube",aero:94,weight:91,stiffness:93,comfort:87,handling:90,cobbles:84,tt:90,reliability:91},
  {id:"giant",name:"Giant",aero:94,weight:92,stiffness:93,comfort:89,handling:91,cobbles:85,tt:90,reliability:94},
  {id:"scott",name:"Scott",aero:95,weight:93,stiffness:94,comfort:88,handling:91,cobbles:84,tt:91,reliability:93},
  {id:"look",name:"LOOK",aero:93,weight:90,stiffness:94,comfort:86,handling:90,cobbles:82,tt:90,reliability:90},
  {id:"bmc",name:"BMC",aero:95,weight:92,stiffness:94,comfort:88,handling:92,cobbles:85,tt:92,reliability:92},
  {id:"xds",name:"XDS",aero:90,weight:88,stiffness:89,comfort:86,handling:87,cobbles:80,tt:84,reliability:86},
  {id:"dare",name:"Dare",aero:91,weight:89,stiffness:90,comfort:87,handling:88,cobbles:82,tt:85,reliability:88},
  {id:"de_rosa",name:"De Rosa",aero:90,weight:90,stiffness:91,comfort:86,handling:88,cobbles:81,tt:84,reliability:88},
  {id:"eddy_merckx",name:"Eddy Merckx",aero:88,weight:88,stiffness:90,comfort:88,handling:88,cobbles:86,tt:82,reliability:88}
];

const WHEEL_BRANDS = [
  {id:"enve",name:"ENVE",aero:96,weight:93,stiffness:95,crosswind:90,cobbles:87,tt:94,reliability:93},
  {id:"reserve",name:"Reserve",aero:97,weight:93,stiffness:95,crosswind:91,cobbles:85,tt:96,reliability:93},
  {id:"shimano",name:"Shimano Dura-Ace",aero:94,weight:93,stiffness:94,crosswind:92,cobbles:87,tt:91,reliability:96},
  {id:"zipp",name:"Zipp",aero:96,weight:92,stiffness:94,crosswind:88,cobbles:85,tt:95,reliability:92},
  {id:"roval",name:"Roval",aero:98,weight:95,stiffness:95,crosswind:90,cobbles:86,tt:96,reliability:94},
  {id:"bontrager",name:"Bontrager",aero:94,weight:92,stiffness:93,crosswind:91,cobbles:88,tt:90,reliability:95},
  {id:"vision",name:"Vision Metron",aero:95,weight:91,stiffness:94,crosswind:88,cobbles:84,tt:94,reliability:92},
  {id:"swissside",name:"Swiss Side",aero:93,weight:90,stiffness:91,crosswind:89,cobbles:84,tt:92,reliability:91},
  {id:"fulcrum",name:"Fulcrum",aero:92,weight:92,stiffness:92,crosswind:90,cobbles:86,tt:88,reliability:92},
  {id:"orbea",name:"Orbea Oquo",aero:90,weight:90,stiffness:90,crosswind:89,cobbles:84,tt:85,reliability:90},
  {id:"dt_swiss",name:"DT Swiss",aero:93,weight:94,stiffness:93,crosswind:92,cobbles:89,tt:90,reliability:96},
  {id:"mavic",name:"Mavic",aero:90,weight:91,stiffness:91,crosswind:91,cobbles:88,tt:86,reliability:93},
  {id:"cadex",name:"Cadex",aero:95,weight:94,stiffness:94,crosswind:90,cobbles:85,tt:92,reliability:93},
  {id:"syncros",name:"Syncros",aero:93,weight:92,stiffness:92,crosswind:91,cobbles:85,tt:89,reliability:92},
  {id:"corima",name:"Corima",aero:94,weight:90,stiffness:92,crosswind:87,cobbles:82,tt:95,reliability:89},
  {id:"newmen",name:"Newmen",aero:91,weight:92,stiffness:91,crosswind:91,cobbles:86,tt:87,reliability:91}
];

const EQUIPMENT_PRESETS = [
  {id:"auto",name:"Auto según etapa",frameType:"auto",wheelType:"auto"},
  {id:"flat",name:"Llano aero",frameType:"aero",wheelType:"deep"},
  {id:"mountain",name:"Montaña",frameType:"light",wheelType:"light"},
  {id:"hilly",name:"Media montaña",frameType:"light",wheelType:"mid"},
  {id:"cobbles",name:"Pavé",frameType:"endurance",wheelType:"cobbles"},
  {id:"tt",name:"Crono",frameType:"tt",wheelType:"disc"},
  {id:"safe",name:"Seguro lluvia",frameType:"endurance",wheelType:"mid"}
];

const ROLE_TEMPLATES = {
  gc:{label:"Líder GC",defaultOrder:"hold",defaultEffort:68,weightKg:64,stats:{flat:80,sprint:62,mountain:92,hills:86,cobbles:66,tt:85,ttt:84,stamina:92,recovery:90,acceleration:79,positioning:84,downhill:84}},
  co:{label:"Co-líder",defaultOrder:"hold",defaultEffort:66,weightKg:65,stats:{flat:79,sprint:62,mountain:88,hills:84,cobbles:64,tt:81,ttt:82,stamina:88,recovery:86,acceleration:77,positioning:80,downhill:81}},
  climber:{label:"Escalador",defaultOrder:"hold",defaultEffort:64,weightKg:61,stats:{flat:70,sprint:52,mountain:88,hills:81,cobbles:54,tt:68,ttt:70,stamina:87,recovery:84,acceleration:76,positioning:73,downhill:80}},
  tt:{label:"Croner",defaultOrder:"pull",defaultEffort:74,weightKg:73,stats:{flat:88,sprint:62,mountain:70,hills:74,cobbles:66,tt:91,ttt:91,stamina:86,recovery:80,acceleration:68,positioning:79,downhill:75}},
  sprinter:{label:"Sprinter",defaultOrder:"sit",defaultEffort:52,weightKg:76,stats:{flat:88,sprint:92,mountain:52,hills:66,cobbles:72,tt:66,ttt:75,stamina:77,recovery:74,acceleration:93,positioning:90,downhill:72}},
  classics:{label:"Clasicómano",defaultOrder:"hold",defaultEffort:66,weightKg:72,stats:{flat:84,sprint:80,mountain:70,hills:85,cobbles:88,tt:74,ttt:79,stamina:85,recovery:80,acceleration:85,positioning:89,downhill:79}},
  rouleur:{label:"Rodador",defaultOrder:"pull",defaultEffort:72,weightKg:75,stats:{flat:88,sprint:68,mountain:68,hills:74,cobbles:75,tt:82,ttt:85,stamina:85,recovery:80,acceleration:70,positioning:81,downhill:74}},
  domestique:{label:"Gregario",defaultOrder:"protect",defaultEffort:64,weightKg:69,stats:{flat:78,sprint:62,mountain:78,hills:76,cobbles:66,tt:74,ttt:79,stamina:84,recovery:81,acceleration:70,positioning:78,downhill:77}},
  puncheur:{label:"Puncheur",defaultOrder:"hold",defaultEffort:68,weightKg:68,stats:{flat:79,sprint:77,mountain:79,hills:88,cobbles:72,tt:73,ttt:76,stamina:83,recovery:79,acceleration:88,positioning:83,downhill:79}}
};

const CORE_RIDERS = {
  uae:[["Tadej Pogačar","Slovenia",27,"gc",99],["João Almeida","Portugal",27,"co",91],["Adam Yates","Great Britain",33,"climber",90],["Isaac del Toro","Mexico",22,"puncheur",90],["Brandon McNulty","United States",28,"tt",86],["Tim Wellens","Belgium",35,"classics",85],["Nils Politt","Germany",32,"rouleur",84],["Marc Soler","Spain",32,"climber",84],["Jay Vine","Australia",30,"climber",85],["Pavel Sivakov","France",29,"climber",83],["Jhonatan Narváez","Ecuador",29,"classics",86],["Mikkel Bjerg","Denmark",27,"tt",81]],
  visma:[["Jonas Vingegaard","Denmark",29,"gc",97],["Wout van Aert","Belgium",31,"classics",94],["Matteo Jorgenson","United States",27,"co",90],["Sepp Kuss","United States",31,"climber",88],["Olav Kooij","Netherlands",24,"sprinter",89],["Christophe Laporte","France",33,"classics",86],["Dylan van Baarle","Netherlands",34,"rouleur",84],["Tiesj Benoot","Belgium",32,"classics",84],["Edoardo Affini","Italy",30,"tt",84],["Cian Uijtdebroeks","Belgium",23,"gc",84],["Attila Valter","Hungary",28,"climber",82],["Ben Tulett","Great Britain",25,"climber",82]],
  redbull:[["Remco Evenepoel","Belgium",26,"gc",96],["Primož Roglič","Slovenia",36,"gc",94],["Jai Hindley","Australia",30,"climber",87],["Daniel Felipe Martínez","Colombia",30,"climber",87],["Aleksandr Vlasov","Russia",30,"co",86],["Florian Lipowitz","Germany",25,"climber",85],["Sam Welsford","Australia",30,"sprinter",86],["Danny van Poppel","Netherlands",33,"sprinter",82],["Nico Denz","Germany",32,"rouleur",80],["Ryan Mullen","Ireland",32,"tt",80],["Bob Jungels","Luxembourg",33,"rouleur",80],["Laurence Pithie","New Zealand",24,"classics",82]],
  ineos:[["Carlos Rodríguez","Spain",25,"gc",89],["Egan Bernal","Colombia",29,"gc",87],["Thymen Arensman","Netherlands",26,"climber",86],["Filippo Ganna","Italy",29,"tt",91],["Joshua Tarling","Great Britain",22,"tt",89],["Tom Pidcock","Great Britain",27,"puncheur",86],["Magnus Sheffield","United States",24,"rouleur",84],["Laurens De Plus","Belgium",30,"domestique",82],["Ben Turner","Great Britain",27,"classics",81],["Tobias Foss","Norway",29,"tt",82]],
  movistar:[["Enric Mas","Spain",31,"gc",88],["Nairo Quintana","Colombia",36,"climber",84],["Einer Rubio","Colombia",28,"climber",83],["Iván Romeo","Spain",23,"tt",82],["Alex Aranburu","Spain",30,"classics",83],["Fernando Gaviria","Colombia",31,"sprinter",84],["Pelayo Sánchez","Spain",26,"puncheur",82],["Oier Lazkano","Spain",26,"classics",83],["Davide Formolo","Italy",33,"domestique",80],["Rémi Cavagna","France",31,"tt",80]],
  lidl:[["Juan Ayuso","Spain",24,"gc",91],["Mads Pedersen","Denmark",30,"classics",91],["Jonathan Milan","Italy",26,"sprinter",90],["Giulio Ciccone","Italy",31,"climber",86],["Mattias Skjelmose","Denmark",26,"co",87],["Thibau Nys","Belgium",24,"puncheur",84],["Tao Geoghegan Hart","Great Britain",31,"climber",83],["Toms Skujiņš","Latvia",35,"classics",82],["Mathias Vacek","Czech Republic",24,"tt",81],["Daan Hoole","Netherlands",27,"tt",80]],
  alpecin:[["Mathieu van der Poel","Netherlands",31,"classics",96],["Jasper Philipsen","Belgium",28,"sprinter",93],["Kaden Groves","Australia",27,"sprinter",87],["Tibor Del Grosso","Netherlands",23,"puncheur",82],["Quinten Hermans","Belgium",31,"puncheur",81],["Gianni Vermeersch","Belgium",33,"classics",80],["Silvan Dillier","Switzerland",36,"rouleur",78],["Søren Kragh Andersen","Denmark",32,"rouleur",80]],
  bahrain:[["Santiago Buitrago","Colombia",26,"climber",86],["Antonio Tiberi","Italy",25,"co",85],["Lenny Martinez","France",23,"climber",86],["Pello Bilbao","Spain",36,"gc",84],["Matej Mohorič","Slovenia",31,"classics",86],["Alec Segaert","Belgium",23,"tt",83],["Phil Bauhaus","Germany",32,"sprinter",82],["Damiano Caruso","Italy",39,"climber",82],["Fred Wright","Great Britain",27,"classics",80]],
  decathlon:[["Paul Seixas","France",20,"gc",87],["Felix Gall","Austria",28,"climber",86],["Olav Kooij","Netherlands",24,"sprinter",89],["Paul Lapeira","France",26,"puncheur",83],["Benoît Cosnefroy","France",31,"puncheur",82],["Dorian Godon","France",30,"classics",81],["Bruno Armirail","France",32,"tt",81],["Aurélien Paret-Peintre","France",30,"climber",81]],
  soudal:[["Tim Merlier","Belgium",33,"sprinter",89],["Mikel Landa","Spain",36,"climber",86],["Jasper Stuyven","Belgium",34,"classics",85],["Ilan Van Wilder","Belgium",26,"co",83],["Yves Lampaert","Belgium",35,"tt",82],["Kasper Asgreen","Denmark",31,"rouleur",82],["Paul Magnier","France",22,"sprinter",82],["Mauri Vansevenant","Belgium",27,"puncheur",81]],
  jayco:[["Michael Matthews","Australia",36,"classics",86],["Dylan Groenewegen","Netherlands",33,"sprinter",86],["Eddie Dunbar","Ireland",30,"climber",82],["Ben O'Connor","Australia",30,"gc",86],["Luke Plapp","Australia",25,"tt",83],["Felix Engelhardt","Germany",26,"puncheur",80],["Pascal Ackermann","Germany",32,"sprinter",82]],
  ef:[["Richard Carapaz","Ecuador",33,"gc",87],["Ben Healy","Ireland",26,"puncheur",86],["Neilson Powless","United States",30,"classics",82],["Alberto Bettiol","Italy",32,"classics",82],["Marijn van den Berg","Netherlands",27,"sprinter",81],["Stefan Bissegger","Switzerland",28,"tt",81]],
  groupama:[["David Gaudu","France",29,"climber",84],["Romain Grégoire","France",23,"puncheur",84],["Paul Penhoët","France",25,"sprinter",80],["Valentin Madouas","France",30,"classics",82],["Stefan Küng","Switzerland",33,"tt",85]],
  picnic:[["Fabio Jakobsen","Netherlands",29,"sprinter",83],["Oscar Onley","Great Britain",23,"climber",84],["Pavel Bittner","Czech Republic",24,"sprinter",80],["John Degenkolb","Germany",37,"classics",78]],
  unox:[["Alexander Kristoff","Norway",39,"sprinter",82],["Søren Wærenskjold","Norway",26,"rouleur",84],["Tobias Halland Johannessen","Norway",27,"climber",83],["Magnus Cort","Denmark",33,"classics",82]],
  astana:[["Mark Cavendish","Great Britain",41,"sprinter",78],["Davide Ballerini","Italy",32,"classics",80],["Harold Tejada","Colombia",29,"climber",79],["Clément Champoussin","France",28,"puncheur",80]],
  tudor:[["Julian Alaphilippe","France",34,"puncheur",86],["Matteo Trentin","Italy",37,"classics",82],["Stefan Küng","Switzerland",33,"tt",85],["Marc Hirschi","Switzerland",28,"puncheur",84]],
  q365:[["Tom Pidcock","Great Britain",27,"puncheur",86],["David de la Cruz","Spain",37,"climber",78],["Matteo Moschetti","Italy",30,"sprinter",78]],
  total:[["Anthony Turgis","France",32,"classics",82],["Peter Sagan","Slovakia",36,"classics",78],["Emilien Jeannière","France",28,"sprinter",78]],
  cofidis:[["Bryan Coquard","France",34,"sprinter",80],["Ion Izagirre","Spain",37,"climber",80],["Simon Geschke","Germany",40,"climber",76]],
  caja:[["Fernando Gaviria","Colombia",31,"sprinter",84],["Orluis Aular","Venezuela",30,"sprinter",80],["Jefferson Cepeda","Ecuador",30,"climber",79],["Eduard Prades","Spain",39,"classics",80]],
  burgos:[["Jesús Herrada","Spain",36,"puncheur",82],["Pablo Castrillo","Spain",25,"puncheur",79],["Merhawi Kudus","Eritrea",32,"climber",80],["Aaron Gate","New Zealand",36,"rouleur",78]],
  euskaltel:[["Jonathan Lastra","Spain",33,"classics",78],["Mikel Bizkarra","Spain",37,"climber",77],["Gotzon Martín","Spain",30,"puncheur",77],["Urko Berrade","Spain",28,"puncheur",76]],
  polti:[["Giovanni Lonardi","Italy",30,"sprinter",80],["Mirco Maestri","Italy",34,"rouleur",79],["Davide De Pretto","Italy",24,"puncheur",78],["Alessandro Tonelli","Italy",34,"puncheur",78]],
  kern:[["Pau Miquel","Spain",26,"puncheur",78],["Urko Berrade","Spain",28,"puncheur",78],["José Félix Parra","Spain",29,"climber",78]]
};

const FILLER_NAMES = {
  Belgium:["Van der Linden","De Smet","Janssens","Verbeeck","Peeters","Vandenberghe","Maes","Goossens"],
  France:["Martin","Bernard","Petit","Moreau","Rousseau","Lefevre","Garnier","Chevalier"],
  Spain:["García","Martínez","Sánchez","López","Ruiz","Fernández","Moreno","Álvarez"],
  Italy:["Rossi","Bianchi","Ferrari","Ricci","Conti","Moretti","Gallo","Costa"],
  Netherlands:["Van Dijk","De Jong","Bakker","Visser","Smit","Meijer","Bos","Willems"],
  Germany:["Müller","Schmidt","Fischer","Weber","Wagner","Becker","Hoffmann","Koch"],
  Norway:["Hansen","Johansen","Olsen","Larsen","Nilsen","Berg","Solberg","Dahl"],
  Colombia:["Gómez","Herrera","Rojas","Castro","Morales","Vargas","Torres","Mendoza"],
  UnitedStates:["Miller","Johnson","Anderson","Taylor","Wilson","Moore","Clark","Hall"],
  Australia:["Smith","Brown","Taylor","Wilson","Walker","King","Scott","Hill"],
  Switzerland:["Meyer","Müller","Schmid","Keller","Huber","Weber","Frei","Steiner"],
  Default:["Rider","NeoPro","Domestique","Rouleur","Climber","Sprinter","Puncheur","Helper"]
};

const COUNTRY_POOL = ["Belgium","France","Spain","Italy","Netherlands","Germany","Norway","Colombia","United States","Australia","Switzerland","Denmark","Great Britain","Portugal","Poland","Ecuador","Slovenia","Austria"];
const ROLE_POOL = ["domestique","rouleur","climber","puncheur","classics","sprinter","tt"];

function makeFillerRider(team, index) {
  const country = team.country === "World" || team.country === "United Arab Emirates" ? COUNTRY_POOL[index % COUNTRY_POOL.length] : team.country;
  const key = country.replace(/\s/g, "");
  const names = FILLER_NAMES[key] || FILLER_NAMES.Default;
  const surname = names[index % names.length];
  const given = ["Alex","Lucas","Max","Nico","Leo","Tom","Milan","Victor","Daniel","Marco","Jon","Ander","Luca","Noah","Ben","Oscar"][index % 16];
  const role = ROLE_POOL[(index + team.id.length) % ROLE_POOL.length];
  const base = team.level === "WT" ? 72 + Math.round(hashNoise(team.id + index, 10)) : 68 + Math.round(hashNoise(team.id + index, 10));
  return [`${given} ${surname}`, country, 21 + ((index * 3 + team.id.length) % 17), role, dataClamp(base, 62, 80)];
}

function buildTeamRiderList(team) {
  const core = CORE_RIDERS[team.id] ? [...CORE_RIDERS[team.id]] : [];
  while (core.length < team.size) core.push(makeFillerRider(team, core.length));
  return core.slice(0, team.size);
}

const TEAM_RIDERS = Object.fromEntries(TEAMS.map(team => [team.id, buildTeamRiderList(team)]));

function buildStats(template, base, team, riderSeed) {
  const stats = {};
  const lift = (base - 74) * 0.58;
  Object.keys(template.stats).forEach(key => {
    let teamBonus = 0;
    if (key === "mountain") teamBonus = (team.ai.gc - 60) * 0.04;
    if (key === "sprint") teamBonus = (team.ai.sprint - 60) * 0.05;
    if (key === "cobbles" || key === "hills") teamBonus = (team.ai.classics - 60) * 0.04;
    if (key === "tt" || key === "ttt") teamBonus = (team.ai.control - 60) * 0.035;
    stats[key] = dataClamp(Math.round(template.stats[key] + lift + teamBonus + hashNoise(riderSeed + key, 7)), 42, 99);
  });
  stats.timeTrial = stats.tt;
  stats.teamTimeTrial = stats.ttt;
  return stats;
}

function riderId(teamId, name, index) {
  return `${teamId}_${String(index + 1).padStart(2, "0")}_${slugify(name)}`;
}

function buildRiders() {
  const riders = [];
  TEAMS.forEach((team, ti) => {
    TEAM_RIDERS[team.id].forEach((item, ri) => {
      const [name, nationality, age, roleKey, base] = item;
      const template = ROLE_TEMPLATES[roleKey] || ROLE_TEMPLATES.domestique;
      const seed = `${team.id}_${name}_${ri}`;
      const stats = buildStats(template, base, team, seed);
      const weightKg = dataClamp(Math.round(template.weightKg + hashNoise(seed + "kg", 8)), 55, 84);
      riders.push({
        id: riderId(team.id, name, ri), name, nationality, age, teamId: team.id,
        roleKey, role: template.label, base, weightKg,
        defaultOrder: template.defaultOrder, defaultEffort: template.defaultEffort,
        stats,
        form: dataClamp(Math.round(base + hashNoise(seed + "form", 8)), 50, 99),
        morale: dataClamp(Math.round(74 + hashNoise(seed + "morale", 18)), 35, 100),
        fatigue: 0, energy: 100,
        totalTime: 0, points: 0, mountainPoints: 0, uciPoints: 0,
        stageWins: 0, seasonStageWins: 0, raceDays: 0,
        abandoned: false
      });
    });
  });
  return riders;
}

const RIDERS = buildRiders();

const RIDER_ORDERS = [
  {id:"sit",name:"Ir a rueda",desc:"Ahorra energía, no trabaja.",pull:0,attack:0,energy:0.68,risk:0.82},
  {id:"hold",name:"Mantener posición",desc:"Rueda en grupo sin forzar.",pull:0.12,attack:0,energy:1.00,risk:1.00},
  {id:"protect",name:"Proteger líder",desc:"Ayuda al líder y evita cortes.",pull:0.30,attack:0,energy:1.18,risk:0.92},
  {id:"pull",name:"Tirar del grupo",desc:"Sube velocidad del grupo sin atacar.",pull:1.00,attack:0,energy:1.38,risk:1.05},
  {id:"catch",name:"Cazar fuga",desc:"Trabajo fuerte para recortar ventaja.",pull:1.28,attack:0,energy:1.55,risk:1.10},
  {id:"tempo",name:"Subir a tempo",desc:"Ritmo alto en subida para seleccionar.",pull:1.10,attack:0,energy:1.48,risk:1.12},
  {id:"attack",name:"Atacar",desc:"Intenta saltar hacia delante.",pull:0.12,attack:1.00,energy:1.82,risk:1.28},
  {id:"bridge",name:"Saltar a grupo",desc:"Intenta cruzar hacia un grupo delantero.",pull:0.25,attack:0.78,energy:1.68,risk:1.20},
  {id:"wait",name:"Esperar líder",desc:"Pierde posición para ayudar al líder.",pull:0,attack:0,energy:1.20,risk:0.95},
  {id:"sprint_train",name:"Tren de sprint",desc:"Lanza al sprinter en finales rápidos.",pull:0.95,attack:0,energy:1.42,risk:1.10}
];

const SMART_PRESETS = [
  {id:"protect_gc",name:"Proteger GC",description:"Líder protegido; gregarios y rodadores trabajan."},
  {id:"sprint",name:"Sprint masivo",description:"Sprinter guardado; tren fuerte al final."},
  {id:"breakaway",name:"Fuga del día",description:"Riders secundarios buscan la fuga."},
  {id:"mountain_attack",name:"Montaña agresiva",description:"Escaladores tempo y líder preparado para atacar."},
  {id:"survival",name:"Supervivencia",description:"Todos conservan para llegar sin cortes."},
  {id:"time_trial",name:"Crono a tope",description:"Croners y líderes maximizan intensidad."}
];

const TTT_SETTINGS = {
  relayIntensity: [
    {id:"soft",name:"Relevos suaves",power:0.92,dropRisk:0.70,desc:"Conservador, mantiene 6-8 corredores."},
    {id:"steady",name:"Relevos regulares",power:1.00,dropRisk:1.00,desc:"Equilibrado. Relevos sostenidos."},
    {id:"hard",name:"Relevos fuertes",power:1.10,dropRisk:1.28,desc:"Rápido. Riesgo de descolgar corredores débiles."},
    {id:"allout",name:"A bloque",power:1.20,dropRisk:1.65,desc:"Máximo tiempo, alto riesgo de dejar gente."}
  ],
  relayLength: [
    {id:"short",name:"Relevos cortos 20-30s",efficiency:1.03,dropRisk:0.90},
    {id:"medium",name:"Relevos medios 40-50s",efficiency:1.00,dropRisk:1.00},
    {id:"long",name:"Relevos largos 60-75s",efficiency:0.97,dropRisk:1.18}
  ],
  formation: [
    {id:"single",name:"Fila simple",aero:1.03,handling:0.95},
    {id:"smooth",name:"Rotación fluida",aero:1.00,handling:1.00},
    {id:"safe",name:"Formación segura",aero:0.96,handling:1.08}
  ]
};

const NUTRITION_ITEMS = [
  {id:"gel",name:"Gel",description:"Energía rápida.",energy:22,hydration:0,stomach:7,finalBonus:0},
  {id:"bar",name:"Barrita",description:"Energía sostenida.",energy:27,hydration:-1,stomach:13,finalBonus:0},
  {id:"iso",name:"Bidón isotónico",description:"Energía + hidratación.",energy:13,hydration:22,stomach:4,finalBonus:0},
  {id:"caf",name:"Gel cafeína",description:"Extra para final y ataques.",energy:18,hydration:-1,stomach:9,finalBonus:3},
  {id:"rice",name:"Rice cake",description:"Carga ligera y estable.",energy:18,hydration:0,stomach:8,finalBonus:0},
  {id:"water",name:"Bidón agua",description:"Hidratación pura.",energy:0,hydration:28,stomach:2,finalBonus:0}
];

const NUTRITION_PLANS = [
  {id:"balanced",name:"Coche equilibrado",stock:{gel:96,bar:72,iso:160,caf:40,rice:80,water:180}},
  {id:"mountain",name:"Coche montaña",stock:{gel:140,bar:60,iso:180,caf:58,rice:70,water:190}},
  {id:"hot",name:"Coche calor",stock:{gel:110,bar:60,iso:230,caf:40,rice:70,water:250}},
  {id:"sprint",name:"Coche sprint",stock:{gel:110,bar:72,iso:190,caf:55,rice:80,water:180}}
];

const AUTO_NUTRITION_MODES = [
  {id:"auto_smart",name:"Automático inteligente",description:"Geles/bidones para mantener energía e hidratación óptimas."},
  {id:"auto_conservative",name:"Automático conservador",description:"Come antes y evita pájaras casi a toda costa."},
  {id:"auto_aggressive",name:"Automático agresivo",description:"Reserva más cafeína y geles para finales y ataques."},
  {id:"manual",name:"Manual",description:"Solo come cuando tú lo ordenas."}
];

const TRAINING_OPTIONS = [
  {id:"recovery_home",name:"Recuperación en casa",destination:"Casa",days:5,description:"Descanso, fisio, sueño. Baja fatiga fuerte.",effects:{fatigue:-22,form:0,morale:2}},
  {id:"teide_altitude",name:"Training camp Teide",destination:"Tenerife · 2.150 m",days:14,description:"Altura para GC y escaladores.",effects:{mountain:2,stamina:2,recovery:1,form:4,fatigue:8,morale:2}},
  {id:"sierra_nevada",name:"Sierra Nevada",destination:"Granada · 2.300 m",days:12,description:"Altura, puertos largos y test de umbral.",effects:{mountain:2,tt:1,stamina:2,form:3,fatigue:7}},
  {id:"andorra_climbs",name:"Andorra escaladores",destination:"Andorra",days:10,description:"Puertos duros, bajadas técnicas, peso/potencia.",effects:{mountain:2,downhill:1,acceleration:1,form:3,fatigue:7}},
  {id:"girona_base",name:"Base Girona",destination:"Girona",days:9,description:"Base aeróbica para vuelta por etapas.",effects:{stamina:2,recovery:1,flat:1,form:2,fatigue:5}},
  {id:"flanders_cobbles",name:"Camp pavé Flandes",destination:"Oudenaarde / Roubaix",days:7,description:"Pavé, colocación y resistencia a vibraciones.",effects:{cobbles:2,positioning:2,hills:1,form:2,fatigue:6}},
  {id:"tt_windtunnel",name:"Bloque crono + túnel",destination:"Velódromo / túnel",days:6,description:"Posición aero, pacing y material CRI.",effects:{tt:2,ttt:1,flat:1,form:2,fatigue:5}},
  {id:"ttt_camp",name:"Camp CRE",destination:"Circuito cerrado",days:5,description:"Relevos, rotación, orden y ritmo de equipo.",effects:{ttt:2,positioning:1,flat:1,form:2,fatigue:4}},
  {id:"sprint_track",name:"Sprint + pista",destination:"Velódromo",days:5,description:"Arrancada, lanzamientos y colocación final.",effects:{sprint:2,acceleration:2,positioning:1,form:2,fatigue:5}},
  {id:"heat_acclimation",name:"Aclimatación al calor",destination:"Mallorca / Almería",days:8,description:"Adaptación a calor y deshidratación.",effects:{stamina:1,recovery:1,form:2,heatResistance:2,fatigue:5}},
  {id:"grand_tour_base",name:"Bloque Gran Vuelta",destination:"Alpes",days:16,description:"Volumen alto. Sube techo, pero carga fatiga.",effects:{stamina:3,recovery:2,mountain:1,form:4,fatigue:12}},
  {id:"race_sharpening",name:"Afinado competición",destination:"Concentración corta",days:4,description:"Baja fatiga, activa forma sin cargar demasiado.",effects:{form:3,fatigue:-6,morale:1}},
  {id:"young_development",name:"Desarrollo jóvenes",destination:"Centro rendimiento",days:18,description:"Sube base de jóvenes a medio plazo.",effects:{stamina:1,hills:1,tt:1,form:2,fatigue:8,youngBonus:1}},
  {id:"descending_skills",name:"Técnica de bajada",destination:"Dolomitas",days:5,description:"Bajadas, mojado y curvas rápidas.",effects:{downhill:2,positioning:1,form:1,fatigue:3}},
  {id:"leadout_drills",name:"Tren de sprint",destination:"Circuito llano",days:5,description:"Automatismos para sprinters y lanzadores.",effects:{sprint:1,flat:1,positioning:2,ttt:1,form:2,fatigue:4}}
];

const CLASSIFICATION_RULES = {
  youthMaxAge:25,
  teamClassificationBestRiders:3,
  finishBonuses:[10,6,4],
  pointsByStageType:{flat:[50,30,20,18,16,14,12,10,8,7],hilly:[35,25,20,17,15,13,11,9,7,6],mountain:[25,20,16,14,12,10,8,6,4,2],cobbles:[35,25,20,17,15,13,11,9,7,6],tt:[20,17,15,13,11,9,7,5,3,1],ttt:[20,17,15,13,11,9,7,5,3,1]},
  mountainPoints:{HC:[20,15,12,10,8,6,4,2],"1":[10,8,6,4,2,1],"2":[5,3,2,1],"3":[2,1],"4":[1]},
  uci:{grandTourStage:[120,50,25,15,5],grandTourFinalGC:[1300,1040,880,730,620,520,425,325,275,225,175,150,125,105,85],stageRaceGC:[500,400,325,275,225,175,150,125,100,85],oneDay:[500,400,325,275,225,175,150,125,100,85]}
};

function climb(name, category, km, length, gradient, altitude) { return {name, category, km, length, gradient, altitude: altitude || Math.round(400 + km * 8 + length * gradient * 8)}; }
function pave(name, from, to, severity) { return {name, from, to, severity}; }
function wall(name, km, length, gradient, maxGradient) { return {name, km, length, gradient, maxGradient: maxGradient || gradient + 4}; }

function raceWeather(month, climate, dayIndex = 0) {
  const baseTemp = {winter:10,spring:18,summer:28,autumn:17,desert:31}[climate] || 20;
  const rainBase = {winter:45,spring:28,summer:14,autumn:38,desert:3}[climate] || 25;
  const temp = Math.round(baseTemp + hashNoise(`${month}_${climate}_${dayIndex}`, 8));
  const rain = dataClamp(Math.round(rainBase + hashNoise(`${climate}_rain_${dayIndex}`, 35)), 0, 95);
  const wind = dataClamp(Math.round(22 + hashNoise(`${climate}_wind_${dayIndex}`, 36)), 5, 80);
  const crosswind = dataClamp(Math.round(wind * (0.35 + Math.abs(hashNoise(`${month}_cross_${dayIndex}`, 0.65)))), 0, 90);
  return {temp, rainChance: rain, roadWet: rain > 55 ? 80 : rain > 30 ? 45 : 12, wind, crosswind, label: rain > 55 ? "Lluvia" : temp > 30 ? "Calor" : crosswind > 50 ? "Viento lateral" : "Estable"};
}

function generateProfilePoints(distance, stageType, elevation, climbs = [], walls = [], paves = []) {
  const d = Math.max(1, Math.round(distance));
  const gradients = Array(d + 1).fill(0);

  for (let km = 0; km <= d; km++) {
    let base = 0;
    if (stageType === "flat") base = Math.sin(km / 9) * 0.35 + hashNoise(`flat_micro_${distance}_${km}`, 0.28);
    if (stageType === "hilly") base = Math.sin(km / 7) * 1.05 + Math.sin(km / 19) * 0.65 + hashNoise(`hill_micro_${distance}_${km}`, 0.55);
    if (stageType === "mountain") base = Math.sin(km / 8) * 0.80 + Math.sin(km / 21) * 0.55 + hashNoise(`mount_micro_${distance}_${km}`, 0.45);
    if (stageType === "cobbles") base = Math.sin(km / 6) * 0.65 + hashNoise(`cobbles_micro_${distance}_${km}`, 0.65);
    if (stageType === "tt" || stageType === "ttt") base = Math.sin(km / 12) * 0.45 + hashNoise(`tt_micro_${distance}_${km}`, 0.25);
    gradients[km] += base;
  }

  climbs.forEach((c, climbIndex) => {
    const summit = dataClamp(Math.round(c.km), 0, d);
    const start = dataClamp(Math.round(c.km - c.length), 0, d);
    const length = Math.max(1, summit - start);
    for (let km = start; km <= summit; km++) {
      const p = (km - start) / Math.max(1, length);
      const variable = 0.82 + 0.20 * Math.sin(p * Math.PI * 3.0) + 0.10 * Math.sin(p * Math.PI * 8.0) + hashNoise(`climb_${distance}_${climbIndex}_${km}`, 0.10);
      const ramp = p < 0.12 ? 0.72 + p * 2.2 : p > 0.88 ? 0.92 + (1 - p) * 0.70 : 1.0;
      gradients[km] += Math.max(2.2, c.gradient * variable * ramp);
    }

    const descentLen = Math.max(4, Math.round(length * 0.82));
    const descentEnd = dataClamp(summit + descentLen, 0, d);
    for (let km = summit + 1; km <= descentEnd; km++) {
      const p = (km - summit) / Math.max(1, descentLen);
      const variable = 0.75 + 0.18 * Math.sin(p * Math.PI * 4.0) + hashNoise(`descent_${distance}_${climbIndex}_${km}`, 0.08);
      gradients[km] -= Math.max(1.0, c.gradient * 0.58 * variable);
    }
  });

  walls.forEach((wallItem, wallIndex) => {
    const summit = dataClamp(Math.round(wallItem.km), 0, d);
    const start = dataClamp(Math.round(wallItem.km - wallItem.length), 0, d);
    for (let km = start; km <= summit; km++) {
      gradients[km] += wallItem.gradient * (0.95 + hashNoise(`wall_${distance}_${wallIndex}_${km}`, 0.12));
    }
    for (let km = summit + 1; km <= Math.min(d, summit + Math.max(2, Math.round(wallItem.length * 2))); km++) {
      gradients[km] -= wallItem.gradient * 0.35;
    }
  });

  paves.forEach((segment, index) => {
    for (let km = Math.max(0, Math.round(segment.from)); km <= Math.min(d, Math.round(segment.to)); km++) {
      gradients[km] += hashNoise(`pave_ripple_${distance}_${index}_${km}`, 0.45);
    }
  });

  let alt = stageType === "mountain" ? 420 : stageType === "hilly" ? 220 : stageType === "cobbles" ? 105 : 80;
  const points = [];
  let gain = 0;
  for (let km = 0; km <= d; km++) {
    if (km > 0) {
      const delta = gradients[km] * 10;
      alt += delta;
      if (delta > 0) gain += delta;
      if (stageType === "flat") alt = 65 + (alt - 65) * 0.88;
      alt = Math.max(8, alt);
    }
    points.push({ km, alt: Math.round(alt) });
  }

  const desiredGain = Math.max(200, elevation || gain);
  if (gain > 50 && desiredGain > 0) {
    const scale = dataClamp(desiredGain / gain, 0.55, 1.85);
    let scaledAlt = points[0].alt;
    for (let i = 1; i < points.length; i++) {
      const rawDelta = points[i].alt - points[i - 1].alt;
      const delta = rawDelta > 0 ? rawDelta * scale : rawDelta * dataClamp(scale * 0.85, 0.55, 1.45);
      scaledAlt = Math.max(8, scaledAlt + delta);
      points[i].alt = Math.round(scaledAlt);
    }
  }

  return points;
}

function buildSectors(stage) {
  const count = stage.distance > 230 ? 7 : stage.distance > 190 ? 6 : stage.distance > 130 ? 5 : stage.distance > 60 ? 4 : 3;
  const sectors = [];
  for (let i=0;i<count;i++) {
    const from = Math.round(stage.distance / count * i);
    const to = i === count - 1 ? stage.distance : Math.round(stage.distance / count * (i+1));
    const c = stage.climbs.find(x => x.km >= from && x.km <= to);
    const p = stage.paves.find(x => x.from <= to && x.to >= from);
    const w = stage.walls.find(x => x.km >= from && x.km <= to);
    const final = i === count - 1;
    let type = stage.type;
    if (stage.type === "tt" || stage.type === "ttt") type = "tt";
    else if (final) type = "final";
    else if (p) type = "cobbles";
    else if (w) type = "wall";
    else if (c || stage.type === "mountain") type = "climb";
    else if (stage.type === "hilly") type = "hilly";
    else type = "flat";
    sectors.push({
      id:`${stage.id}_s${i+1}`, from, to, type,
      name:type === "climb" ? `Subida ${c ? c.name : "larga"}` : type === "cobbles" ? `Pavé ${p ? p.name : ""}` : type === "wall" ? `Muro ${w ? w.name : ""}` : type === "final" ? "Final" : type === "tt" ? "Sector crono" : type === "hilly" ? "Media montaña" : "Llano / control",
      difficulty:dataClamp(stage.difficulty + (c?14:0) + (p?p.severity*6:0) + (w?15:0) + (final?8:0) + (stage.weather.roadWet>60?5:0), 15, 100),
      question:type === "flat" ? "¿Controlar fuga o ahorrar?" : type === "climb" ? "¿Subir a tempo o atacar?" : type === "cobbles" ? "¿Pasar delante o reducir riesgo?" : type === "wall" ? "¿Arrancar en el muro?" : type === "final" ? "¿Rematar o proteger?" : "¿Ritmo objetivo?"
    });
  }
  return sectors;
}

function makeStage(raceId, number, name, type, distance, difficulty, profile = {}, month = 6, climate = "spring") {
  const weather = raceWeather(month, climate, number);
  const climbs = profile.climbs || [];
  const paves = profile.paves || [];
  const walls = profile.walls || [];
  const elevation = profile.elevation || (type === "mountain" ? Math.round(distance * 24) : type === "hilly" ? Math.round(distance * 14) : type === "cobbles" ? Math.round(distance * 9) : Math.round(distance * 4));
  const stage = {id:`${raceId}_${String(number).padStart(2,"0")}`, number, name, type, label:{flat:"Llana",hilly:"Media montaña",mountain:"Alta montaña",cobbles:"Pavés y muros",tt:"CRI",ttt:"CRE"}[type], distance, difficulty, elevation, climbs, paves, walls, weather, finalClimb:!!profile.finalClimb, description:profile.description || "Etapa del calendario 2026."};
  stage.profilePoints = generateProfilePoints(distance, type, elevation, climbs, walls, paves);
  stage.sectors = buildSectors(stage);
  return stage;
}

function makeStagesForRace(race) {
  const m = race.month, c = race.climate;
  if (race.kind === "grand") {
    const arr = [];
    const types = ["flat","hilly","flat","ttt","cobbles","flat","mountain","hilly","mountain","flat","tt","flat","hilly","mountain","mountain","flat","mountain","mountain","tt","hilly","flat"];
    types.forEach((t,i) => {
      const n = i + 1;
      const dist = t === "tt" ? 34 + (i%3)*5 : t === "ttt" ? 42 : t === "mountain" ? 142 + (i%4)*16 : t === "hilly" ? 155 + (i%5)*12 : 170 + (i%6)*8;
      const diff = t === "flat" ? 35 + i%8 : t === "hilly" ? 68 + i%12 : t === "mountain" ? 84 + i%14 : t === "cobbles" ? 88 : t === "tt" ? 72 : 64;
      const climbs = t === "mountain" ? [climb("Puerto principal", n % 3 === 0 ? "HC" : "1", Math.round(dist*0.62), 11+n%7, 6.8+n%4, 1500+n*25), climb("Final en alto", n%2?"1":"HC", dist, 8+n%8, 7.4+n%3, 1650+n*30)] : t === "hilly" ? [climb("Cota selectiva", "3", Math.round(dist*0.72), 3+n%4, 5.5+n%3, 650+n*10)] : [];
      const paves = t === "cobbles" ? [pave("Sector 1", Math.round(dist*.33), Math.round(dist*.33)+4, 4), pave("Sector decisivo", Math.round(dist*.70), Math.round(dist*.70)+6, 5)] : [];
      const walls = t === "hilly" || t === "cobbles" ? [wall("Muro final", Math.round(dist*.92), 1.2+n%2, 8+n%5, 14+n%5)] : [];
      arr.push(makeStage(race.id,n,`${race.name} · Etapa ${n}`,t,dist,diff,{climbs,paves,walls,finalClimb:t==="mountain"&&n%2===1},m,c));
    });
    return arr;
  }
  if (race.kind === "week") {
    const arr = [];
    const types = race.stageTypes || ["flat","hilly","mountain","flat","tt","mountain","hilly"];
    types.forEach((t,i)=> {
      const n = i+1;
      const dist = t === "tt" ? 22 + i*2 : t === "ttt" ? 32 + i*3 : t === "mountain" ? 145 + i*8 : t === "hilly" ? 168 : 185;
      const climbs = t === "mountain" ? [climb("Subida reina", "1", Math.round(dist*.75), 9+i, 7.2, 1400)] : t === "hilly" ? [climb("Cota", "3", Math.round(dist*.65), 4, 6.2, 680)] : [];
      arr.push(makeStage(race.id,n,`${race.name} · Etapa ${n}`,t,dist,t==="mountain"?82:t==="hilly"?67:t==="tt"?66:t==="ttt"?64:35,{climbs,finalClimb:t==="mountain"&&i%2===0},m,c));
    });
    return arr;
  }
  const t = race.stageType || "hilly";
  const d = race.distance || (t === "cobbles" ? 260 : t === "flat" ? 210 : 245);
  const climbs = t === "mountain" || t === "hilly" ? [climb("Cota clave", "2", Math.round(d*.78), 5.5, 7.2, 760), climb("Última cota", "3", Math.round(d*.94), 2.2, 8.6, 420)] : [];
  const paves = t === "cobbles" ? [pave("Sector histórico", Math.round(d*.58), Math.round(d*.58)+3, 5), pave("Sector decisivo", Math.round(d*.88), Math.round(d*.88)+4, 5)] : [];
  const walls = t === "cobbles" || t === "hilly" ? [wall("Muro final", Math.round(d*.93), 1.1, 9.4, 17)] : [];
  return [makeStage(race.id,1,race.name,t,d,race.difficulty || 85,{climbs,paves,walls,finalClimb:false},m,c)];
}

const RACE_BLUEPRINTS = [
  {id:"santos",date:"2026-01-20",month:1,name:"Santos Tour Down Under",country:"Australia",kind:"week",stageTypes:["hilly","flat","hilly","flat","mountain","hilly"],climate:"summer",jersey:"Ocre",jerseyClass:"jersey-orange",type:"stage_race"},
  {id:"cadel",date:"2026-02-01",month:2,name:"Cadel Evans Great Ocean Road Race",country:"Australia",kind:"classic",stageType:"hilly",distance:176,climate:"summer",jersey:"Ganador",jerseyClass:"jersey-blue",type:"classic"},
  {id:"uae_tour",date:"2026-02-16",month:2,name:"UAE Tour",country:"United Arab Emirates",kind:"week",stageTypes:["flat","tt","flat","mountain","flat","mountain","flat"],climate:"desert",jersey:"Rojo",jerseyClass:"jersey-red",type:"stage_race"},
  {id:"omloop",date:"2026-02-28",month:2,name:"Omloop Het Nieuwsblad",country:"Belgium",kind:"classic",stageType:"cobbles",distance:202,climate:"winter",jersey:"Ganador",jerseyClass:"jersey-cobbles",type:"classic"},
  {id:"strade",date:"2026-03-07",month:3,name:"Strade Bianche",country:"Italy",kind:"classic",stageType:"hilly",distance:215,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-white",type:"classic"},
  {id:"paris_nice",date:"2026-03-08",month:3,name:"Paris-Nice",country:"France",kind:"week",stageTypes:["flat","hilly","ttt","flat","hilly","mountain","mountain","hilly"],climate:"spring",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"tirreno",date:"2026-03-09",month:3,name:"Tirreno-Adriatico",country:"Italy",kind:"week",stageTypes:["tt","flat","hilly","flat","mountain","hilly","flat"],climate:"spring",jersey:"Azul",jerseyClass:"jersey-blue",type:"stage_race"},
  {id:"sanremo",date:"2026-03-21",month:3,name:"Milano-Sanremo",country:"Italy",kind:"classic",stageType:"hilly",distance:294,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-green",type:"classic"},
  {id:"catalunya",date:"2026-03-23",month:3,name:"Volta Ciclista a Catalunya",country:"Spain",kind:"week",stageTypes:["hilly","mountain","mountain","flat","hilly","mountain","hilly"],climate:"spring",jersey:"Blanco-verde",jerseyClass:"jersey-green",type:"stage_race"},
  {id:"e3",date:"2026-03-27",month:3,name:"E3 Saxo Classic",country:"Belgium",kind:"classic",stageType:"cobbles",distance:204,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-cobbles",type:"classic"},
  {id:"gent",date:"2026-03-29",month:3,name:"Gent-Wevelgem",country:"Belgium",kind:"classic",stageType:"cobbles",distance:253,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-yellow",type:"classic"},
  {id:"dwars",date:"2026-04-01",month:4,name:"Dwars door Vlaanderen",country:"Belgium",kind:"classic",stageType:"cobbles",distance:184,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-cobbles",type:"classic"},
  {id:"flanders",date:"2026-04-05",month:4,name:"Ronde van Vlaanderen",country:"Belgium",kind:"classic",stageType:"cobbles",distance:273,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-yellow",type:"classic"},
  {id:"itzulia",date:"2026-04-06",month:4,name:"Itzulia Basque Country",country:"Spain",kind:"week",stageTypes:["hilly","hilly","mountain","hilly","mountain","hilly"],climate:"spring",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"roubaix",date:"2026-04-12",month:4,name:"Paris-Roubaix",country:"France",kind:"classic",stageType:"cobbles",distance:257,climate:"spring",jersey:"Pavé",jerseyClass:"jersey-cobbles",type:"classic"},
  {id:"amstel",date:"2026-04-19",month:4,name:"Amstel Gold Race",country:"Netherlands",kind:"classic",stageType:"hilly",distance:253,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-orange",type:"classic"},
  {id:"fleche",date:"2026-04-22",month:4,name:"La Flèche Wallonne",country:"Belgium",kind:"classic",stageType:"hilly",distance:199,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-red",type:"classic"},
  {id:"liege",date:"2026-04-26",month:4,name:"Liège-Bastogne-Liège",country:"Belgium",kind:"classic",stageType:"hilly",distance:259,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-red",type:"classic"},
  {id:"romandie",date:"2026-04-28",month:4,name:"Tour de Romandie",country:"Switzerland",kind:"week",stageTypes:["tt","hilly","flat","mountain","hilly","tt"],climate:"spring",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"eschborn",date:"2026-05-01",month:5,name:"Eschborn-Frankfurt",country:"Germany",kind:"classic",stageType:"flat",distance:202,climate:"spring",jersey:"Ganador",jerseyClass:"jersey-green",type:"classic"},
  {id:"giro",date:"2026-05-08",month:5,name:"Giro d'Italia",country:"Italy",kind:"grand",climate:"spring",jersey:"Maglia rosa",jerseyClass:"jersey-pink",type:"grand_tour"},
  {id:"dauphine",date:"2026-06-07",month:6,name:"Tour Auvergne - Rhône-Alpes",country:"France",kind:"week",stageTypes:["hilly","flat","tt","mountain","mountain","hilly","mountain","hilly"],climate:"summer",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"copenhagen",date:"2026-06-14",month:6,name:"Copenhagen Sprint",country:"Denmark",kind:"classic",stageType:"flat",distance:220,climate:"summer",jersey:"Ganador",jerseyClass:"jersey-blue",type:"classic"},
  {id:"suisse",date:"2026-06-17",month:6,name:"Tour de Suisse",country:"Switzerland",kind:"week",stageTypes:["hilly","mountain","tt","flat","mountain","mountain","hilly"],climate:"summer",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"tour",date:"2026-07-04",month:7,name:"Tour de France",country:"France",kind:"grand",climate:"summer",jersey:"Maillot amarillo",jerseyClass:"jersey-yellow",type:"grand_tour"},
  {id:"sansebastian",date:"2026-08-01",month:8,name:"Clásica Ciclista San Sebastián",country:"Spain",kind:"classic",stageType:"hilly",distance:236,climate:"summer",jersey:"Ganador",jerseyClass:"jersey-blue",type:"classic"},
  {id:"pologne",date:"2026-08-03",month:8,name:"Tour de Pologne",country:"Poland",kind:"week",stageTypes:["flat","hilly","flat","hilly","mountain","tt","flat"],climate:"summer",jersey:"Amarillo",jerseyClass:"jersey-yellow",type:"stage_race"},
  {id:"renewi",date:"2026-08-19",month:8,name:"Renewi Tour",country:"Belgium/Netherlands",kind:"week",stageTypes:["flat","tt","flat","cobbles","hilly"],climate:"summer",jersey:"Verde",jerseyClass:"jersey-green",type:"stage_race"},
  {id:"hamburg",date:"2026-08-23",month:8,name:"BEMER Cyclassics Hamburg",country:"Germany",kind:"classic",stageType:"flat",distance:205,climate:"summer",jersey:"Ganador",jerseyClass:"jersey-blue",type:"classic"},
  {id:"bretagne",date:"2026-08-30",month:8,name:"Bretagne Classic - Ouest-France",country:"France",kind:"classic",stageType:"hilly",distance:254,climate:"summer",jersey:"Ganador",jerseyClass:"jersey-green",type:"classic"},
  {id:"vuelta",date:"2026-08-22",month:8,name:"La Vuelta a España",country:"Spain",kind:"grand",climate:"summer",jersey:"Maillot rojo",jerseyClass:"jersey-red",type:"grand_tour"},
  {id:"quebec",date:"2026-09-11",month:9,name:"Grand Prix Cycliste de Québec",country:"Canada",kind:"classic",stageType:"hilly",distance:201,climate:"autumn",jersey:"Ganador",jerseyClass:"jersey-blue",type:"classic"},
  {id:"montreal",date:"2026-09-13",month:9,name:"Grand Prix Cycliste de Montréal",country:"Canada",kind:"classic",stageType:"hilly",distance:220,climate:"autumn",jersey:"Ganador",jerseyClass:"jersey-red",type:"classic"},
  {id:"worlds",date:"2026-09-27",month:9,name:"World Championships Road Race",country:"World",kind:"classic",stageType:"hilly",distance:268,climate:"autumn",jersey:"Arcoíris",jerseyClass:"jersey-rainbow",type:"classic"},
  {id:"lombardia",date:"2026-10-10",month:10,name:"Il Lombardia",country:"Italy",kind:"classic",stageType:"hilly",distance:253,climate:"autumn",jersey:"Ganador",jerseyClass:"jersey-pink",type:"classic"},
  {id:"guangxi",date:"2026-10-13",month:10,name:"Gree-Tour of Guangxi",country:"China",kind:"week",stageTypes:["flat","flat","hilly","mountain","flat","hilly"],climate:"autumn",jersey:"Rojo",jerseyClass:"jersey-red",type:"stage_race"}
];

const RACES = RACE_BLUEPRINTS.map(bp => ({...bp, stages: makeStagesForRace(bp)})).sort((a,b) => a.date.localeCompare(b.date));
const SEASON_RACE_IDS = RACES.map(r => r.id);


/* ============================================================
   v0.19 MANAGER SYSTEMS · objetivos, mercado, forma y broadcast
   Añadido sin romper datos v0.19.
   ============================================================ */

const MANAGER_OBJECTIVE_CATALOG_V019 = {
  gc_win: { label: "Ganar la general", category: "GC", difficulty: 95, reward: { budget: 1600000, prestige: 12, confidence: 10 } },
  gc_top_3: { label: "Top 3 en la general", category: "GC", difficulty: 84, reward: { budget: 950000, prestige: 8, confidence: 7 } },
  gc_top_5: { label: "Top 5 en la general", category: "GC", difficulty: 72, reward: { budget: 650000, prestige: 6, confidence: 5 } },
  gc_top_10: { label: "Top 10 en la general", category: "GC", difficulty: 55, reward: { budget: 350000, prestige: 4, confidence: 4 } },
  stage_win: { label: "Ganar una etapa", category: "Etapas", difficulty: 62, reward: { budget: 500000, prestige: 5, confidence: 5 } },
  stage_wins_2: { label: "Ganar 2 etapas", category: "Etapas", difficulty: 78, reward: { budget: 850000, prestige: 7, confidence: 6 } },
  points_top_3: { label: "Top 3 clasificación por puntos", category: "Regularidad", difficulty: 62, reward: { budget: 360000, prestige: 4, confidence: 4 } },
  mountain_top_3: { label: "Top 3 montaña", category: "Montaña", difficulty: 60, reward: { budget: 360000, prestige: 4, confidence: 4 } },
  youth_top_3: { label: "Top 3 joven", category: "Desarrollo", difficulty: 55, reward: { budget: 300000, prestige: 4, confidence: 4 } },
  teams_top_3: { label: "Top 3 por equipos", category: "Bloque", difficulty: 62, reward: { budget: 450000, prestige: 4, confidence: 5 } },
  monument_top_5: { label: "Top 5 en clásica/monumento", category: "Clásicas", difficulty: 70, reward: { budget: 450000, prestige: 5, confidence: 4 } },
  aggressive_breakaway: { label: "Presencia en fugas decisivas", category: "Combatividad", difficulty: 42, reward: { budget: 180000, prestige: 2, confidence: 3 } }
};

const STAFF_OPTIONS_V019 = [
  { id: "sport_director", name: "Director deportivo élite", department: "Dirección", cost: 850000, effect: { tactics: 8, aiRecommendation: 10, sponsor: 2 }, description: "Mejora recomendaciones, lectura de carrera y cumplimiento de objetivos." },
  { id: "performance_coach", name: "Entrenador de rendimiento", department: "Preparación", cost: 720000, effect: { form: 6, fatigue: -4, training: 8 }, description: "Mejor planificación de picos de forma y menor fatiga acumulada." },
  { id: "altitude_specialist", name: "Especialista en altura", department: "Preparación", cost: 420000, effect: { mountain: 5, recovery: 3 }, description: "Potencia training camps en altura y preparación de grandes vueltas." },
  { id: "nutritionist", name: "Nutricionista WorldTour", department: "Salud", cost: 380000, effect: { nutrition: 10, heat: 5 }, description: "Optimiza alimentación automática y reduce riesgo de pájara/GI." },
  { id: "head_mechanic", name: "Jefe de mecánicos", department: "Material", cost: 460000, effect: { reliability: 9, cobbles: 4, ttt: 3 }, description: "Reduce averías y mejora rendimiento del material en pavé/cronómetro." },
  { id: "scout_latam", name: "Ojeador Latinoamérica", department: "Scouting", cost: 240000, effect: { scouting: 7, climbers: 5 }, description: "Mejora aparición de escaladores jóvenes." },
  { id: "scout_benelux", name: "Ojeador Benelux", department: "Scouting", cost: 240000, effect: { scouting: 7, classics: 5 }, description: "Mejora aparición de clasicómanos y corredores de pavé." },
  { id: "data_analyst", name: "Analista de datos", department: "I+D", cost: 300000, effect: { pacing: 6, ttt: 5, scouting: 3 }, description: "Mejora pacing de CRI/CRE y predicciones del Race Director." }
];

const FORM_PLAN_PRESETS_V019 = [
  { id: "grand_tour_peak", name: "Pico Gran Vuelta", description: "Base + altura + tapering para llegar al Tour/Giro/Vuelta con forma alta.", focus: { stamina: 2, recovery: 2, mountain: 1, form: 4, fatigue: 6 } },
  { id: "classics_peak", name: "Pico Clásicas", description: "Explosividad, colocación, pavé y punch.", focus: { cobbles: 2, hills: 2, acceleration: 1, positioning: 2, form: 3, fatigue: 5 } },
  { id: "sprint_peak", name: "Pico Sprint", description: "Velocidad, tren de lanzamiento y colocación final.", focus: { sprint: 2, acceleration: 2, positioning: 2, flat: 1, form: 3, fatigue: 4 } },
  { id: "tt_peak", name: "Pico Crono", description: "Pacing, posición aero, umbral y CRE.", focus: { tt: 2, ttt: 2, flat: 1, stamina: 1, form: 3, fatigue: 4 } },
  { id: "development", name: "Desarrollo joven", description: "Progresión lenta con baja presión competitiva.", focus: { stamina: 1, hills: 1, recovery: 1, form: 2, youngBonus: 1, fatigue: 3 } },
  { id: "maintenance", name: "Mantenimiento", description: "Conservar forma y reducir fatiga durante calendario cargado.", focus: { form: 1, fatigue: -8, morale: 2 } }
];

const TRAINING_CAMPS_V019 = [
  { id: "teide_gc_supercamp", name: "Supercamp GC Teide", destination: "Tenerife · 2.150 m", days: 18, cost: 180000, target: "GC / escaladores", effects: { mountain: 3, stamina: 3, recovery: 2, form: 5, fatigue: 12 }, risk: 18, description: "Bloque premium para líderes de gran vuelta. Mucha carga, pico de forma alto." },
  { id: "sierra_altitude_threshold", name: "Sierra Nevada umbral", destination: "Granada · 2.300 m", days: 14, cost: 130000, target: "GC / crono", effects: { mountain: 2, tt: 2, stamina: 2, form: 4, fatigue: 9 }, risk: 14, description: "Altura + test de umbral. Muy útil antes de vueltas con CRI." },
  { id: "andorra_explosive_climbs", name: "Andorra puertos explosivos", destination: "Andorra", days: 11, cost: 100000, target: "Escaladores / puncheurs", effects: { mountain: 2, acceleration: 2, downhill: 1, form: 4, fatigue: 8 }, risk: 13, description: "Subidas duras, cambios de ritmo y bajadas técnicas." },
  { id: "girona_stage_race_base", name: "Base Girona vuelta por etapas", destination: "Girona", days: 10, cost: 70000, target: "Bloque completo", effects: { stamina: 2, recovery: 2, flat: 1, hills: 1, form: 3, fatigue: 6 }, risk: 8, description: "Base aeróbica, carreteras variadas y bajo riesgo." },
  { id: "flanders_roubaix_camp", name: "Camp Flandes/Roubaix", destination: "Oudenaarde + Arenberg", days: 8, cost: 90000, target: "Clasicómanos", effects: { cobbles: 3, positioning: 3, hills: 1, stamina: 1, form: 3, fatigue: 7 }, risk: 16, description: "Pavé real, colocación y tolerancia a vibraciones." },
  { id: "mallorca_sprint_leadout", name: "Mallorca sprint train", destination: "Mallorca", days: 7, cost: 80000, target: "Sprinters / lanzadores", effects: { sprint: 3, acceleration: 2, positioning: 2, flat: 1, form: 3, fatigue: 6 }, risk: 11, description: "Automatismos de tren y lanzamientos a alta velocidad." },
  { id: "velodrome_aero_lab", name: "Aero Lab + velódromo", destination: "Velódromo / túnel aero", days: 6, cost: 160000, target: "Croners / CRE", effects: { tt: 3, ttt: 2, flat: 1, positioning: 1, form: 3, fatigue: 5 }, risk: 7, description: "Pacing, posición, material y rotaciones CRE." },
  { id: "almeria_heat_adaptation", name: "Aclimatación calor Almería", destination: "Almería", days: 9, cost: 75000, target: "Grandes vueltas calurosas", effects: { stamina: 1, recovery: 1, heatResistance: 3, form: 3, fatigue: 6 }, risk: 10, description: "Mejora rendimiento con calor, hidratación y tolerancia térmica." },
  { id: "dolomites_descending", name: "Dolomitas técnica bajada", destination: "Dolomitas", days: 6, cost: 85000, target: "Bajadores / GC", effects: { downhill: 3, positioning: 1, mountain: 1, form: 2, fatigue: 5 }, risk: 18, description: "Técnica, mojado, curvas rápidas y gestión de riesgo." },
  { id: "recovery_medical_block", name: "Bloque médico recuperación", destination: "Centro rendimiento", days: 5, cost: 60000, target: "Corredores fatigados", effects: { fatigue: -24, recovery: 1, morale: 2, form: 0 }, risk: 2, description: "Fisio, sueño, nutrición, descarga y prevención de enfermedad." }
];

const SCOUTING_REGIONS_V019 = [
  { id: "colombia", name: "Colombia / Ecuador", bias: "climber", cost: 120000 },
  { id: "benelux", name: "Bélgica / Países Bajos", bias: "classics", cost: 110000 },
  { id: "spain", name: "España / Portugal", bias: "puncheur", cost: 95000 },
  { id: "france", name: "Francia", bias: "rouleur", cost: 105000 },
  { id: "italy", name: "Italia", bias: "climber", cost: 105000 },
  { id: "nordic", name: "Dinamarca / Noruega", bias: "tt", cost: 105000 },
  { id: "australia", name: "Australia / NZ", bias: "sprinter", cost: 115000 }
];

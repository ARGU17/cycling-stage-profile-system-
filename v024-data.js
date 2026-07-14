/* ============================================================
   CYCLING MANAGER TOUR v0.24
   v024-data.js
   Sistemas avanzados añadidos sobre la base v0.19.
   ============================================================ */

const V024_VERSION = "v0.24";

const PHYSIOLOGY_PROFILES_V024 = {
  gc:         { cpWkg: 5.55, wPrimeKJ: 23, vo2: 79, sprintReserve: 0.92, durability: 1.08 },
  co:         { cpWkg: 5.35, wPrimeKJ: 22, vo2: 77, sprintReserve: 0.94, durability: 1.06 },
  climber:    { cpWkg: 5.40, wPrimeKJ: 21, vo2: 78, sprintReserve: 0.90, durability: 1.05 },
  puncheur:   { cpWkg: 5.08, wPrimeKJ: 28, vo2: 75, sprintReserve: 1.08, durability: 1.00 },
  classics:   { cpWkg: 4.92, wPrimeKJ: 31, vo2: 73, sprintReserve: 1.12, durability: 1.04 },
  sprinter:   { cpWkg: 4.45, wPrimeKJ: 38, vo2: 70, sprintReserve: 1.30, durability: 0.93 },
  tt:         { cpWkg: 5.00, wPrimeKJ: 25, vo2: 74, sprintReserve: 0.94, durability: 1.05 },
  rouleur:    { cpWkg: 4.82, wPrimeKJ: 27, vo2: 72, sprintReserve: 1.00, durability: 1.06 },
  domestique: { cpWkg: 4.72, wPrimeKJ: 24, vo2: 71, sprintReserve: 0.97, durability: 1.08 }
};

const GROUP_FORMATIONS_V024 = [
  { id: "front", name: "Cabeza del grupo", draft: 0.96, risk: 0.72, response: 1.18, pull: 1.12, description: "Máxima capacidad de responder y entrar en cortes, pero mayor gasto." },
  { id: "rotation", name: "Zona de relevos", draft: 0.82, risk: 0.82, response: 1.08, pull: 1.28, description: "Participa activamente en relevos y persecuciones." },
  { id: "protected", name: "Centro protegido", draft: 0.66, risk: 0.58, response: 0.93, pull: 0.18, description: "Ahorra energía y reduce exposición, ideal para el líder." },
  { id: "middle", name: "Centro del grupo", draft: 0.72, risk: 0.70, response: 0.98, pull: 0.42, description: "Posición equilibrada para conservar y responder." },
  { id: "back", name: "Parte trasera", draft: 0.68, risk: 1.18, response: 0.72, pull: 0.12, description: "Ahorra algo, pero aumenta el riesgo de corte o caída." },
  { id: "struggling", name: "En dificultad", draft: 0.82, risk: 1.35, response: 0.48, pull: 0, description: "El corredor está al límite y puede perder contacto." }
];

const ATTACK_TYPES_V024 = [
  { id: "probe", name: "Ataque de prueba", durationSec: 35, powerFactor: 1.22, wPrimeCost: 0.72, gapPotential: 8, description: "Aceleración corta para medir rivales." },
  { id: "hard", name: "Ataque duro", durationSec: 75, powerFactor: 1.35, wPrimeCost: 1.05, gapPotential: 20, description: "Ataque serio para seleccionar el grupo." },
  { id: "all_in", name: "Ataque a bloque", durationSec: 150, powerFactor: 1.48, wPrimeCost: 1.38, gapPotential: 38, description: "Máximo riesgo y consumo anaeróbico." },
  { id: "long_range", name: "Ataque de largo alcance", durationSec: 260, powerFactor: 1.22, wPrimeCost: 1.10, gapPotential: 45, description: "Movimiento sostenido, ideal con corredor puente." },
  { id: "bridge", name: "Saltar a grupo", durationSec: 120, powerFactor: 1.31, wPrimeCost: 1.00, gapPotential: 26, description: "Intenta alcanzar fuga o grupo perseguidor." }
];

const RESPONSE_MODES_V024 = [
  { id: "instant", name: "Responder inmediatamente", powerFactor: 1.30, wPrimeFactor: 1.10, delaySec: 0, description: "Cierra el hueco en el momento." },
  { id: "progressive", name: "Cerrar progresivamente", powerFactor: 1.14, wPrimeFactor: 0.72, delaySec: 8, description: "Menor coste anaeróbico, pero puede abrirse hueco." },
  { id: "tempo", name: "Mantener ritmo", powerFactor: 1.04, wPrimeFactor: 0.30, delaySec: 18, description: "Confía en el ritmo sostenido del grupo." },
  { id: "delegate", name: "Mandar gregario", powerFactor: 1.08, wPrimeFactor: 0.45, delaySec: 10, description: "Un compañero responde por el líder." },
  { id: "let_go", name: "Dejar marchar", powerFactor: 0.96, wPrimeFactor: 0.05, delaySec: 40, description: "Conserva energía si el ataque no es peligroso." },
  { id: "counter", name: "Contraatacar", powerFactor: 1.38, wPrimeFactor: 1.22, delaySec: 5, description: "Respuesta ofensiva tras el primer ataque." }
];

const LONG_RANGE_PLANS_V024 = [
  { id: "none", name: "Sin plan", description: "Sin estrategia específica de largo alcance." },
  { id: "satellite", name: "Corredor satélite", description: "Enviar un gregario a fuga para ayudar al líder más tarde." },
  { id: "bridge_leader", name: "Puente del líder", description: "El líder ataca y enlaza con un compañero adelantado." },
  { id: "relay_valley", name: "Relevos en valle", description: "Guardar gregarios en fuga para trabajar en terreno llano." },
  { id: "double_attack", name: "Doble ataque", description: "Primer corredor obliga a responder; segundo contraataca." }
];

const DESCENT_MODES_V024 = [
  { id: "safe", name: "Seguro", speedBonus: -0.06, risk: 0.42, energy: 0.90, description: "Prioriza evitar caídas y recuperar energía." },
  { id: "normal", name: "Normal", speedBonus: 0, risk: 1.00, energy: 1.00, description: "Ritmo equilibrado." },
  { id: "aggressive", name: "Agresivo", speedBonus: 0.07, risk: 1.58, energy: 1.06, description: "Busca ganar tiempo en bajada con mayor riesgo." },
  { id: "attack", name: "Atacar bajando", speedBonus: 0.11, risk: 2.05, energy: 1.14, description: "Ataque técnico, solo recomendable para grandes bajadores." }
];

const TIRE_WIDTHS_V024 = [
  { id: "28", name: "28 mm", aero: 1.02, rolling: 1.02, comfort: 0.88, grip: 0.91, puncture: 1.12 },
  { id: "30", name: "30 mm", aero: 1.00, rolling: 1.04, comfort: 1.00, grip: 1.00, puncture: 1.00 },
  { id: "32", name: "32 mm", aero: 0.97, rolling: 1.02, comfort: 1.12, grip: 1.08, puncture: 0.88 },
  { id: "34", name: "34 mm", aero: 0.93, rolling: 0.98, comfort: 1.20, grip: 1.14, puncture: 0.78 }
];

const TIRE_SYSTEMS_V024 = [
  { id: "tubeless", name: "Tubeless", rolling: 1.04, puncture: 0.78, repair: 0.82, weight: 1.00 },
  { id: "tubular", name: "Tubular", rolling: 0.99, puncture: 0.98, repair: 1.28, weight: 0.96 },
  { id: "clincher", name: "Cubierta + cámara", rolling: 0.96, puncture: 1.14, repair: 0.90, weight: 1.04 }
];

const TIRE_COMPOUNDS_V024 = [
  { id: "fast", name: "Rápido", rolling: 1.06, grip: 0.90, wet: 0.86, wear: 1.20 },
  { id: "balanced", name: "Equilibrado", rolling: 1.00, grip: 1.00, wet: 1.00, wear: 1.00 },
  { id: "wet", name: "Lluvia", rolling: 0.94, grip: 1.10, wet: 1.20, wear: 0.92 },
  { id: "cobbles", name: "Pavé reforzado", rolling: 0.96, grip: 1.08, wet: 1.08, wear: 0.88 }
];

const TIRE_PROTECTION_V024 = [
  { id: "light", name: "Ligera", rolling: 1.04, puncture: 1.18, weight: 0.96 },
  { id: "standard", name: "Estándar", rolling: 1.00, puncture: 1.00, weight: 1.00 },
  { id: "reinforced", name: "Reforzada", rolling: 0.96, puncture: 0.68, weight: 1.06 },
  { id: "insert", name: "Inserto antipinchazos", rolling: 0.94, puncture: 0.48, weight: 1.10 }
];

const CALENDAR_PRESETS_V024 = [
  { id: "gc", name: "Líder de grandes vueltas", maxRaceDays: 64, priorities: ["paris_nice","tirreno","catalunya","liege","dauphine","tour","worlds","lombardia"] },
  { id: "giro_gc", name: "Objetivo Giro", maxRaceDays: 62, priorities: ["uae","tirreno","catalunya","giro","suisse","vuelta","lombardia"] },
  { id: "classics", name: "Clásicas primavera", maxRaceDays: 58, priorities: ["omloop","strade","sanremo","e3","gent","flanders","roubaix","amstel","fleche","liege","quebec","montreal","worlds","lombardia"] },
  { id: "sprinter", name: "Sprinter", maxRaceDays: 72, priorities: ["santos","uae","paris_nice","sanremo","gent","giro","tour","renewi","vuelta","guangxi"] },
  { id: "development", name: "Desarrollo", maxRaceDays: 50, priorities: ["santos","uae","catalunya","romandie","suisse","poland","renewi","quebec","montreal","guangxi"] },
  { id: "tt", name: "Croner", maxRaceDays: 56, priorities: ["uae","paris_nice","tirreno","romandie","dauphine","tour","worlds"] },
  { id: "custom", name: "Personalizado", maxRaceDays: 70, priorities: [] }
];

const PEAK_TYPES_V024 = [
  { id: "single_long", name: "Pico largo único", peakWidthDays: 28, buildDays: 70, maxBonus: 7.0, fatigueRisk: 0.82 },
  { id: "single_sharp", name: "Pico corto y agresivo", peakWidthDays: 12, buildDays: 45, maxBonus: 9.0, fatigueRisk: 1.20 },
  { id: "double", name: "Doble pico", peakWidthDays: 17, buildDays: 55, maxBonus: 6.3, fatigueRisk: 1.05 },
  { id: "classics_block", name: "Bloque de clásicas", peakWidthDays: 35, buildDays: 50, maxBonus: 5.8, fatigueRisk: 0.92 },
  { id: "development", name: "Desarrollo progresivo", peakWidthDays: 60, buildDays: 100, maxBonus: 3.2, fatigueRisk: 0.55 }
];

const CONTRACT_ROLES_V024 = [
  { id: "leader", name: "Líder absoluto", salaryFactor: 1.45, expectedRaceDays: 52 },
  { id: "co_leader", name: "Co-líder", salaryFactor: 1.22, expectedRaceDays: 58 },
  { id: "stage_hunter", name: "Cazador de etapas", salaryFactor: 1.05, expectedRaceDays: 64 },
  { id: "sprinter", name: "Sprinter principal", salaryFactor: 1.20, expectedRaceDays: 68 },
  { id: "protected", name: "Corredor protegido", salaryFactor: 1.10, expectedRaceDays: 58 },
  { id: "domestique", name: "Gregario", salaryFactor: 0.88, expectedRaceDays: 72 },
  { id: "development", name: "Joven en desarrollo", salaryFactor: 0.72, expectedRaceDays: 45 }
];

const CONTRACT_PROMISES_V024 = [
  { id: "tour_selection", name: "Participación en el Tour", happiness: 14, breach: 16 },
  { id: "grand_tour_leadership", name: "Liderazgo en una gran vuelta", happiness: 18, breach: 22 },
  { id: "classic_freedom", name: "Libertad en clásicas", happiness: 11, breach: 13 },
  { id: "sprint_train", name: "Tren de sprint dedicado", happiness: 13, breach: 15 },
  { id: "minimum_days", name: "Mínimo de días de competición", happiness: 9, breach: 11 },
  { id: "target_race", name: "Liderazgo en carrera objetivo", happiness: 15, breach: 18 },
  { id: "development_path", name: "Plan de desarrollo y mentor", happiness: 10, breach: 12 }
];

const SCOUTING_MISSIONS_V024 = [
  { id: "andes_climbers", name: "Escaladores andinos", region: "Colombia / Ecuador", focus: "climber", races: 2, cost: 160000, accuracy: 0.72, potentialBonus: 5 },
  { id: "benelux_cobbles", name: "Cantera del pavé", region: "Bélgica / Países Bajos", focus: "classics", races: 2, cost: 150000, accuracy: 0.76, potentialBonus: 4 },
  { id: "iberian_puncheurs", name: "Puncheurs ibéricos", region: "España / Portugal", focus: "puncheur", races: 2, cost: 125000, accuracy: 0.70, potentialBonus: 4 },
  { id: "nordic_engines", name: "Motores nórdicos", region: "Dinamarca / Noruega", focus: "tt", races: 3, cost: 145000, accuracy: 0.79, potentialBonus: 4 },
  { id: "italian_complete", name: "Talento italiano", region: "Italia", focus: "rouleur", races: 2, cost: 140000, accuracy: 0.73, potentialBonus: 5 },
  { id: "african_endurance", name: "Resistencia africana", region: "Eritrea / Rwanda", focus: "climber", races: 3, cost: 120000, accuracy: 0.62, potentialBonus: 7 },
  { id: "track_sprinters", name: "Velódromos y sprint", region: "Europa / Australia", focus: "sprinter", races: 2, cost: 170000, accuracy: 0.82, potentialBonus: 3 }
];

const DEVELOPMENT_CURVES_V024 = [
  { id: "precocious", name: "Precoz", agePeak: 24, growth: 1.25, decline: 1.10 },
  { id: "normal", name: "Normal", agePeak: 28, growth: 1.00, decline: 1.00 },
  { id: "late", name: "Tardío", agePeak: 31, growth: 0.78, decline: 0.78 },
  { id: "volatile", name: "Irregular", agePeak: 27, growth: 1.08, decline: 1.18 }
];

const MENTORSHIP_TYPES_V024 = [
  { id: "climbing", name: "Mentoría de escalador", statKeys: ["mountain","recovery","downhill"], bonus: 0.55 },
  { id: "tt", name: "Mentoría de crono", statKeys: ["tt","ttt","flat"], bonus: 0.55 },
  { id: "classics", name: "Mentoría de clásicas", statKeys: ["cobbles","hills","positioning"], bonus: 0.58 },
  { id: "sprint", name: "Mentoría de sprint", statKeys: ["sprint","acceleration","positioning"], bonus: 0.52 },
  { id: "leadership", name: "Mentoría de liderazgo", statKeys: ["stamina","recovery","positioning"], bonus: 0.45 },
  { id: "domestique", name: "Mentoría de gregario", statKeys: ["stamina","flat","recovery"], bonus: 0.48 }
];

const STAFF_RACE_ROLES_V024 = [
  { id: "director", name: "Director deportivo", requiredEffect: "tactics" },
  { id: "coach", name: "Entrenador", requiredEffect: "form" },
  { id: "nutrition", name: "Nutricionista", requiredEffect: "nutrition" },
  { id: "mechanic", name: "Mecánico jefe", requiredEffect: "reliability" },
  { id: "analyst", name: "Analista de datos", requiredEffect: "pacing" },
  { id: "scout", name: "Ojeador", requiredEffect: "scouting" }
];

const LOGISTICS_PLANS_V024 = [
  { id: "economy", name: "Logística económica", costFactor: 0.55, recovery: -2, jetLag: 1.25, morale: -1, equipment: -1, description: "Ahorra presupuesto, pero penaliza recuperación y adaptación." },
  { id: "standard", name: "Logística estándar", costFactor: 1.00, recovery: 0, jetLag: 1.00, morale: 0, equipment: 0, description: "Equilibrio entre coste y rendimiento." },
  { id: "performance", name: "Logística rendimiento", costFactor: 1.65, recovery: 3, jetLag: 0.68, morale: 2, equipment: 2, description: "Viaje temprano, hotel premium y apoyo completo." },
  { id: "elite", name: "Operación Gran Vuelta", costFactor: 2.35, recovery: 5, jetLag: 0.45, morale: 4, equipment: 3, description: "Máxima inversión para objetivos A." }
];

const ARRIVAL_OPTIONS_V024 = [
  { id: "late", name: "Llegada 1 día antes", days: 1, adaptation: -4, cost: 0.65 },
  { id: "normal", name: "Llegada 3 días antes", days: 3, adaptation: 0, cost: 1.00 },
  { id: "early", name: "Llegada 6 días antes", days: 6, adaptation: 3, cost: 1.28 },
  { id: "camp", name: "Concentración previa 10 días", days: 10, adaptation: 5, cost: 1.72 }
];

const CAMERA_OPTIONS_V024 = [
  { id: "auto", name: "Realización automática" },
  { id: "breakaway", name: "Fuga" },
  { id: "chase", name: "Grupo perseguidor" },
  { id: "favorites", name: "Favoritos" },
  { id: "peloton", name: "Pelotón" },
  { id: "leader", name: "Tu líder" },
  { id: "sprinter", name: "Tu sprinter" },
  { id: "bus", name: "Autobús" }
];

const ALERT_DEFINITIONS_V024 = [
  { id: "rival_attack", name: "Rival GC ataca", default: true, severity: "danger" },
  { id: "leader_energy", name: "Líder por debajo de 35% energía", default: true, severity: "danger" },
  { id: "break_gap", name: "Fuga supera 4 minutos", default: true, severity: "warning" },
  { id: "climb_start", name: "Comienza un puerto", default: true, severity: "info" },
  { id: "time_cut", name: "Autobús cerca del fuera de control", default: true, severity: "danger" },
  { id: "nutrition_low", name: "Stock de nutrición bajo", default: true, severity: "warning" },
  { id: "crosswind", name: "Riesgo alto de abanicos", default: true, severity: "warning" },
  { id: "pave", name: "Entrada en sector de pavé", default: true, severity: "warning" },
  { id: "wprime_low", name: "Reserva anaeróbica crítica", default: true, severity: "danger" },
  { id: "isolated_leader", name: "Líder aislado", default: true, severity: "warning" }
];

const RECORD_CATALOG_V024 = [
  { id: "most_stage_wins", name: "Más victorias de etapa", mode: "max" },
  { id: "most_race_wins", name: "Más carreras ganadas", mode: "max" },
  { id: "highest_wkg", name: "Mayor W/kg sostenido", mode: "max" },
  { id: "highest_speed", name: "Mayor velocidad media", mode: "max" },
  { id: "longest_solo", name: "Ataque solitario más largo", mode: "max" },
  { id: "most_days_leader", name: "Más días de líder", mode: "max" },
  { id: "highest_uci", name: "Mayor puntuación UCI", mode: "max" },
  { id: "youngest_winner", name: "Ganador más joven", mode: "min" },
  { id: "largest_gc_margin", name: "Mayor margen en una general", mode: "max" },
  { id: "best_team_ttt", name: "Mejor velocidad en CRE", mode: "max" }
];

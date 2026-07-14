/* ============================================================
   CYCLING MANAGER TOUR v0.24 · GPX ENGINE
   Applies real GPX geometry/elevation to Tour de France stages.
   Loaded after data.js and before game.js.
   ============================================================ */

const GPX_ENGINE_VERSION = "1.0.0";
const GPX_STAGE_SIMULATION_STEP_KM = 0.25;

function gpxClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function gpxPointAtKm(stage, km) {
  const points = stage?.gpx?.points;
  if (!points?.length) return null;
  const targetM = gpxClamp(Number(km) || 0, 0, stage.distance) * 1000;
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (points[mid][0] < targetM) lo = mid + 1;
    else hi = mid;
  }
  const rightIndex = lo;
  const leftIndex = Math.max(0, rightIndex - 1);
  const a = points[leftIndex];
  const b = points[rightIndex];
  const span = Math.max(1e-9, b[0] - a[0]);
  const t = gpxClamp((targetM - a[0]) / span, 0, 1);
  const lerp = (x, y) => x + (y - x) * t;
  const prev = points[Math.max(0, leftIndex - 1)];
  const next = points[Math.min(points.length - 1, rightIndex + 1)];
  return {
    index: t < 0.5 ? leftIndex : rightIndex,
    distanceM: targetM,
    km: targetM / 1000,
    elevationM: lerp(a[1], b[1]),
    gradePct: lerp(a[2], b[2]),
    lat: lerp(a[3], b[3]),
    lon: lerp(a[4], b[4]),
    bearingDeg: gpxBearingDeg(prev[3], prev[4], next[3], next[4])
  };
}

function gpxBearingDeg(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function gpxStatsBetween(stage, fromKm, toKm) {
  const points = stage.gpx.points;
  const fromM = Math.max(0, fromKm * 1000);
  const toM = Math.min(stage.distance * 1000, toKm * 1000);
  let startIndex = 0;
  while (startIndex < points.length - 1 && points[startIndex][0] < fromM) startIndex++;
  let endIndex = startIndex;
  while (endIndex < points.length - 1 && points[endIndex][0] <= toM) endIndex++;
  const slice = points.slice(Math.max(0, startIndex - 1), Math.min(points.length, endIndex + 1));
  if (!slice.length) return { ascentM: 0, descentM: 0, avgGrade: 0, maxGrade: 0, minGrade: 0 };
  let ascentM = 0;
  let descentM = 0;
  for (let i = 1; i < slice.length; i++) {
    const delta = slice[i][1] - slice[i - 1][1];
    if (delta > 0) ascentM += delta;
    else descentM -= delta;
  }
  const start = gpxPointAtKm(stage, fromKm);
  const end = gpxPointAtKm(stage, toKm);
  const distanceM = Math.max(1, (toKm - fromKm) * 1000);
  return {
    ascentM,
    descentM,
    avgGrade: (end.elevationM - start.elevationM) / distanceM * 100,
    maxGrade: Math.max(...slice.map(p => p[2])),
    minGrade: Math.min(...slice.map(p => p[2]))
  };
}

function gpxDetectClimbs(stage) {
  const pts = stage.gpx.points;
  const climbs = [];
  let start = null;
  let lastPositive = null;
  let negativeDistance = 0;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const grade = p[2];
    if (grade >= 2.2) {
      if (start === null) start = i;
      lastPositive = i;
      negativeDistance = 0;
    } else if (start !== null) {
      negativeDistance += i > 0 ? p[0] - pts[i - 1][0] : 0;
      if (grade < -1.5 || negativeDistance > 500) {
        const end = Math.max(start, lastPositive ?? i - 1);
        const first = pts[start];
        const last = pts[end];
        const lengthKm = (last[0] - first[0]) / 1000;
        let gain = 0;
        for (let j = start + 1; j <= end; j++) gain += Math.max(0, pts[j][1] - pts[j - 1][1]);
        const avgGradient = lengthKm > 0 ? (last[1] - first[1]) / (lengthKm * 10) : 0;
        if (lengthKm >= 1.25 && gain >= 70 && avgGradient >= 2.3) {
          const score = lengthKm * Math.max(0, avgGradient) + gain / 25;
          const category = score >= 165 ? "HC" : score >= 110 ? "1" : score >= 72 ? "2" : score >= 42 ? "3" : "4";
          climbs.push({
            name: `Ascensión km ${(last[0] / 1000).toFixed(1)}`,
            category,
            km: Math.round(last[0] / 100) / 10,
            length: Math.round(lengthKm * 10) / 10,
            gradient: Math.round(avgGradient * 10) / 10,
            altitude: Math.round(last[1]),
            gain: Math.round(gain),
            score
          });
        }
        start = null;
        lastPositive = null;
        negativeDistance = 0;
      }
    }
  }

  // Keep the most relevant climbs, then restore course order.
  return climbs
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .sort((a, b) => a.km - b.km)
    .map(({ score, ...climb }) => climb);
}

function gpxStageType(stageNumber, meta) {
  if (stageNumber === 1) return "ttt";
  if (stageNumber === 16) return "tt";
  const density = meta.totalAscentM / Math.max(1, meta.distanceKm);
  if (density >= 16 || meta.maxElevationM - meta.minElevationM >= 1050) return "mountain";
  if (density >= 7.5) return "hilly";
  return "flat";
}

function gpxStageDifficulty(meta, type) {
  const density = meta.totalAscentM / Math.max(1, meta.distanceKm);
  const relief = meta.maxElevationM - meta.minElevationM;
  const typeBase = type === "mountain" ? 38 : type === "hilly" ? 25 : type === "tt" || type === "ttt" ? 28 : 15;
  return Math.round(gpxClamp(typeBase + density * 1.45 + relief / 85 + meta.distanceKm / 18, 28, 99));
}

function gpxSectorType(stats, isFinal) {
  if (isFinal && stats.avgGrade > 2.5) return "final";
  if (stats.avgGrade > 4.0 || stats.ascentM > 260) return "climb";
  if (stats.maxGrade > 9 && stats.ascentM > 90) return "wall";
  if (stats.avgGrade < -2.5 || stats.descentM > 260) return "hilly";
  if (stats.ascentM < 110 && Math.abs(stats.avgGrade) < 1.2) return "flat";
  return "hilly";
}

function gpxSectorQuestion(type, stats) {
  if (type === "climb") return `Gestiona el ritmo en una subida real: ${Math.round(stats.ascentM)} m+ y ${stats.maxGrade.toFixed(1)}% máx.`;
  if (type === "wall") return `Tramo explosivo GPX: máxima pendiente ${stats.maxGrade.toFixed(1)}%.`;
  if (type === "final") return `Final real sobre GPX. Decide protección, persecución o ataque.`;
  if (stats.avgGrade < -2.5) return `Descenso real: técnica, riesgo y recuperación.`;
  if (type === "flat") return `Control del pelotón, viento, colocación y alimentación.`;
  return `Terreno quebrado real: vigila cortes, gasto y colocación.`;
}

function gpxBuildSectors(stage) {
  const distance = stage.distance;
  const targetLength = distance <= 45 ? 4 : distance <= 135 ? 10 : 15;
  const boundaries = new Set([0, distance]);

  for (let km = targetLength; km < distance; km += targetLength) boundaries.add(km);
  for (const climb of stage.climbs) {
    boundaries.add(Math.max(0, climb.km - climb.length));
    boundaries.add(Math.min(distance, climb.km));
  }

  const sorted = [...boundaries].sort((a, b) => a - b);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];
    if (current - previous < 2.5 && current < distance) continue;
    merged.push(current);
  }
  if (merged[merged.length - 1] !== distance) merged.push(distance);

  return merged.slice(0, -1).map((from, index) => {
    const to = merged[index + 1];
    const stats = gpxStatsBetween(stage, from, to);
    const isFinal = index === merged.length - 2;
    const type = gpxSectorType(stats, isFinal);
    const label = type === "climb" ? "Ascensión GPX" :
      type === "wall" ? "Muro GPX" :
      isFinal ? "Final GPX" :
      stats.avgGrade < -2.5 ? "Descenso GPX" :
      type === "flat" ? "Llano GPX" : "Terreno quebrado GPX";
    return {
      id: `${stage.id}_gpx_${String(index + 1).padStart(2, "0")}`,
      name: `${label} · km ${from.toFixed(1)}-${to.toFixed(1)}`,
      type,
      from: Math.round(from * 10) / 10,
      to: Math.round(to * 10) / 10,
      difficulty: Math.round(gpxClamp(25 + stats.ascentM / Math.max(1, to - from) * 1.2 + Math.max(0, stats.maxGrade) * 3, 20, 99)),
      question: gpxSectorQuestion(type, stats),
      gpx: {
        avgGradient: Math.round(stats.avgGrade * 10) / 10,
        maxGradient: Math.round(stats.maxGrade * 10) / 10,
        minGradient: Math.round(stats.minGrade * 10) / 10,
        ascentM: Math.round(stats.ascentM),
        descentM: Math.round(stats.descentM)
      }
    };
  });
}

function gpxBuildCompatibilityProfile(stage) {
  const output = [];
  const end = Math.ceil(stage.distance);
  for (let km = 0; km <= end; km++) {
    const point = gpxPointAtKm(stage, Math.min(stage.distance, km));
    output.push({
      km: Math.min(stage.distance, km),
      alt: Math.round(point.elevationM),
      gradient: Math.round(point.gradePct * 10) / 10
    });
  }
  if (output[output.length - 1].km < stage.distance) {
    const point = gpxPointAtKm(stage, stage.distance);
    output.push({ km: stage.distance, alt: Math.round(point.elevationM), gradient: Math.round(point.gradePct * 10) / 10 });
  }
  return output;
}

function applyGpxTourStages2026() {
  if (!globalThis.GPX_TOUR_STAGE_DATA_2026 || typeof RACES === "undefined") return;
  const tour = RACES.find(r => r.id === "tour");
  if (!tour) return;

  Object.entries(globalThis.GPX_TOUR_STAGE_DATA_2026).forEach(([stageNumberText, source]) => {
    const stageNumber = Number(stageNumberText);
    const stage = tour.stages[stageNumber - 1];
    if (!stage) return;

    const type = gpxStageType(stageNumber, source.meta);
    stage.gpx = {
      version: GPX_ENGINE_VERSION,
      sourceFile: source.meta.sourceFile,
      pointSpacingM: source.meta.pointSpacingM,
      gradeWindowM: source.meta.gradeWindowM,
      points: source.points
    };
    stage.gpxAvailable = true;
    stage.distance = source.meta.distanceKm;
    stage.elevation = source.meta.totalAscentM;
    stage.type = type;
    stage.label = {
      flat: "Llana · GPX real",
      hilly: "Media montaña · GPX real",
      mountain: "Alta montaña · GPX real",
      tt: "CRI · GPX real",
      ttt: "CRE · GPX real"
    }[type] || "Etapa GPX real";
    stage.difficulty = gpxStageDifficulty(source.meta, type);
    stage.description = `Recorrido calculado desde ${source.meta.sourceFile}, remuestreado cada ${source.meta.pointSpacingM} m.`;
    stage.climbs = gpxDetectClimbs(stage);
    stage.walls = [];
    stage.paves = stage.paves || [];
    stage.finalClimb = stage.climbs.some(c => stage.distance - c.km < 1.2);
    stage.profilePoints = gpxBuildCompatibilityProfile(stage);
    stage.sectors = gpxBuildSectors(stage);
    stage.gpxMeta = { ...source.meta };
  });

  tour.gpxIntegration = {
    version: GPX_ENGINE_VERSION,
    availableStages: Object.keys(globalThis.GPX_TOUR_STAGE_DATA_2026).map(Number).sort((a, b) => a - b),
    missingStages: [3, 4, 5],
    simulationStepKm: GPX_STAGE_SIMULATION_STEP_KM
  };

  // GPX-only race: every stage used by this event comes from an uploaded GPX.
  // The original Tour remains available for backward compatibility.
  if (!RACES.some(r => r.id === "tour_gpx_2026")) {
    RACES.push({
      ...tour,
      id: "tour_gpx_2026",
      name: "Tour de France 2026 · GPX reales",
      stages: tour.stages.filter(stage => stage.gpxAvailable),
      gpxOnly: true,
      description: "Edición compuesta exclusivamente por los 18 recorridos GPX disponibles."
    });
  }
}

applyGpxTourStages2026();

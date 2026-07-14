import { GRADE_BANDS } from './colors.js';
import { ProfileViewer } from './profile-viewer.js';
import { RouteMiniMap } from './route-mini-map.js';

const stageSelect = document.getElementById('stageSelect');
const routeTitle = document.getElementById('routeTitle');
const routeSummary = document.getElementById('routeSummary');
const distanceSlider = document.getElementById('distanceSlider');
const gradeLegend = document.getElementById('gradeLegend');

const metricDistance = document.getElementById('metricDistance');
const metricAscent = document.getElementById('metricAscent');
const metricElevation = document.getElementById('metricElevation');
const metricGrade = document.getElementById('metricGrade');
const metricKm = document.getElementById('metricKm');
const metricToGo = document.getElementById('metricToGo');

const profileViewer = new ProfileViewer(
  document.getElementById('profileCanvas'),
  document.getElementById('profileTooltip')
);
const routeMiniMap = new RouteMiniMap(document.getElementById('routeCanvas'));

let manifest = [];
let currentStage = null;

function renderLegend() {
  gradeLegend.innerHTML = GRADE_BANDS.map(band => `
    <div class="legend-item">
      <span class="legend-swatch" style="background:${band.color}"></span>
      <span>${band.label}</span>
    </div>
  `).join('');
}

function formatKm(value) {
  return `${value.toFixed(1)} km`;
}

function updateMetrics(pointIndex = 0) {
  if (!currentStage) return;
  const point = currentStage.points[pointIndex];
  const distanceKm = point[0] / 1000;
  const distanceToGo = currentStage.meta.distanceKm - distanceKm;
  const elevation = point[1];
  const grade = point[2];

  metricDistance.textContent = `${currentStage.meta.distanceKm.toFixed(1)} km`;
  metricAscent.textContent = `+${Math.round(currentStage.meta.totalAscentM)} m`;
  metricElevation.textContent = `${Math.round(elevation)} m`;
  metricGrade.textContent = `${grade >= 0 ? '+' : ''}${grade.toFixed(1)}%`;
  metricKm.textContent = formatKm(distanceKm);
  metricToGo.textContent = formatKm(distanceToGo);
  routeSummary.textContent = `+${Math.round(currentStage.meta.totalAscentM)} m · ${currentStage.points.length.toLocaleString('es-ES')} muestras`; 
  distanceSlider.max = String(currentStage.points.length - 1);
  distanceSlider.value = String(pointIndex);
}

async function loadStage(stageFile) {
  const response = await fetch(`./data/${stageFile}`);
  if (!response.ok) throw new Error(`No se pudo cargar ${stageFile}`);
  currentStage = await response.json();

  routeTitle.textContent = `${currentStage.meta.name} · ${currentStage.meta.distanceKm.toFixed(1)} km`;
  profileViewer.setData(currentStage);
  routeMiniMap.setRoute(currentStage.route, 0);
  updateMetrics(0);
}

async function init() {
  renderLegend();
  const response = await fetch('./data/manifest.json');
  const data = await response.json();
  manifest = data.stages || [];

  stageSelect.innerHTML = manifest.map(stage => {
    return `<option value="${stage.file}">${stage.name} · ${stage.distanceKm.toFixed(1)} km · +${stage.totalAscentM} m</option>`;
  }).join('');

  stageSelect.addEventListener('change', async () => {
    await loadStage(stageSelect.value);
  });

  distanceSlider.addEventListener('input', () => {
    const index = Number(distanceSlider.value);
    profileViewer.setCurrentIndex(index, false);
    routeMiniMap.setCurrentIndex(Math.round(index / 2));
    updateMetrics(index);
  });

  profileViewer.onPointChange = (_point, index) => {
    distanceSlider.value = String(index);
    routeMiniMap.setCurrentIndex(Math.round(index / 2));
    updateMetrics(index);
  };

  if (manifest.length) {
    await loadStage(manifest[0].file);
  }
}

init().catch((error) => {
  console.error(error);
  alert('Error cargando el sistema de perfiles. Revisa la consola.');
});

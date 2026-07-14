import { getGradeColor } from './colors.js';

export class ProfileViewer {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tooltip = tooltip;
    this.points = [];
    this.meta = null;
    this.currentIndex = 0;
    this.onPointChange = null;
    this.isDragging = false;

    this.resize();
    this.attachEvents();
    window.addEventListener('resize', () => this.resize());
  }

  setData(stageData) {
    this.meta = stageData.meta;
    this.points = stageData.points || [];
    this.currentIndex = 0;
    this.draw();
  }

  setCurrentIndex(index, emit = false) {
    if (!this.points.length) return;
    const clamped = Math.max(0, Math.min(this.points.length - 1, index));
    this.currentIndex = clamped;
    this.draw();
    if (emit && typeof this.onPointChange === 'function') {
      this.onPointChange(this.getCurrentPoint(), clamped);
    }
  }

  getCurrentPoint() {
    return this.points[this.currentIndex];
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  attachEvents() {
    const updateFromPointer = (event, emit = true) => {
      if (!this.points.length) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const index = Math.round((x / rect.width) * (this.points.length - 1));
      this.setCurrentIndex(index, emit);
      this.showTooltip(event.clientX - rect.left, event.clientY - rect.top);
    };

    this.canvas.addEventListener('mousemove', (event) => {
      if (!this.points.length) return;
      updateFromPointer(event, true);
    });

    this.canvas.addEventListener('mouseenter', (event) => {
      this.tooltip.classList.remove('hidden');
      updateFromPointer(event, true);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.classList.add('hidden');
    });

    this.canvas.addEventListener('mousedown', (event) => {
      this.isDragging = true;
      updateFromPointer(event, true);
    });
    window.addEventListener('mouseup', () => { this.isDragging = false; });
    window.addEventListener('mousemove', (event) => {
      if (this.isDragging) updateFromPointer(event, true);
    });

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const step = Math.max(1, Math.round(this.points.length / 400));
      const direction = event.deltaY > 0 ? 1 : -1;
      this.setCurrentIndex(this.currentIndex + direction * step, true);
      const rect = this.canvas.getBoundingClientRect();
      this.showTooltip(event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (event) => {
      if (!event.touches.length) return;
      this.tooltip.classList.remove('hidden');
      const touch = event.touches[0];
      updateFromPointer(touch, true);
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (event) => {
      if (!event.touches.length) return;
      const touch = event.touches[0];
      updateFromPointer(touch, true);
    }, { passive: true });
    this.canvas.addEventListener('touchend', () => this.tooltip.classList.add('hidden'));
  }

  showTooltip(x, y) {
    if (!this.points.length) return;
    const [distanceM, elevationM, gradePct] = this.getCurrentPoint();
    const distanceKm = distanceM / 1000;
    const distanceToGo = (this.meta.distanceKm * 1000 - distanceM) / 1000;
    this.tooltip.classList.remove('hidden');
    this.tooltip.style.left = `${Math.min(this.canvas.clientWidth - 140, Math.max(10, x))}px`;
    this.tooltip.style.top = `${Math.max(90, y)}px`;
    this.tooltip.innerHTML = `
      <div class="row"><span>Km actual</span><strong>${distanceKm.toFixed(1)} km</strong></div>
      <div class="row"><span>Km a meta</span><strong>${distanceToGo.toFixed(1)} km</strong></div>
      <div class="row"><span>Altitud</span><strong>${Math.round(elevationM)} m</strong></div>
      <div class="row"><span>Pendiente</span><strong style="color:${getGradeColor(gradePct)}">${gradePct >= 0 ? '+' : ''}${gradePct.toFixed(1)}%</strong></div>
    `;
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    if (!this.points.length) return;

    const padding = { top: 24, right: 22, bottom: 42, left: 18 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const elevations = this.points.map(p => p[1]);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const rangeEle = Math.max(1, maxEle - minEle);
    const totalDistanceM = this.points[this.points.length - 1][0];

    const xForIndex = (index) => padding.left + (index / (this.points.length - 1)) * plotWidth;
    const yForElevation = (elev) => padding.top + (1 - (elev - minEle) / rangeEle) * plotHeight;
    const distanceForIndex = (index) => this.points[index][0];

    // horizontal grid
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.fillStyle = 'rgba(220,230,255,0.55)';
    ctx.font = '12px Inter, sans-serif';
    for (let i = 0; i <= 4; i++) {
      const frac = i / 4;
      const y = padding.top + frac * plotHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      const eleLabel = Math.round(maxEle - frac * rangeEle);
      ctx.fillText(`${eleLabel}m`, padding.left + 6, y - 6);
    }
    ctx.restore();

    // clipping path for the profile silhouette
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    this.points.forEach((point, idx) => {
      const x = xForIndex(idx);
      const y = yForElevation(point[1]);
      if (idx === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.closePath();
    ctx.clip();

    // high frequency color bars
    for (let i = 0; i < this.points.length - 1; i++) {
      const x = xForIndex(i);
      const nextX = xForIndex(i + 1);
      ctx.fillStyle = getGradeColor(this.points[i][2]);
      ctx.fillRect(x, padding.top, Math.max(1, nextX - x + 0.2), plotHeight + 4);
    }

    // subtle overlay gradient like Radial
    const overlay = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    overlay.addColorStop(0, 'rgba(255,255,255,0.04)');
    overlay.addColorStop(1, 'rgba(8,17,30,0.18)');
    ctx.fillStyle = overlay;
    ctx.fillRect(padding.left, padding.top, plotWidth, plotHeight);
    ctx.restore();

    // profile outline
    ctx.beginPath();
    this.points.forEach((point, idx) => {
      const x = xForIndex(idx);
      const y = yForElevation(point[1]);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(236,246,255,0.92)';
    ctx.stroke();

    // current cursor line
    const cx = xForIndex(this.currentIndex);
    ctx.beginPath();
    ctx.moveTo(cx, padding.top - 2);
    ctx.lineTo(cx, height - padding.bottom);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(214, 224, 255, 0.95)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, padding.top - 2, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,212,255,1)';
    ctx.fill();

    // x-axis labels = distance remaining, like Radial
    ctx.fillStyle = 'rgba(220,230,255,0.75)';
    ctx.font = '13px Inter, sans-serif';
    ctx.textBaseline = 'top';
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      const frac = i / tickCount;
      const x = padding.left + frac * plotWidth;
      const distanceAtTick = frac * totalDistanceM;
      const remainingKm = (totalDistanceM - distanceAtTick) / 1000;
      const label = i === tickCount ? '0m' : `${remainingKm.toFixed(0)}km`;
      ctx.fillText(label, x - 10, height - padding.bottom + 10);
    }

    // dark baseline
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
}

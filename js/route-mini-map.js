export class RouteMiniMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.route = [];
    this.currentIndex = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setRoute(route, currentIndex = 0) {
    this.route = route || [];
    this.currentIndex = currentIndex;
    this.draw();
  }

  setCurrentIndex(index) {
    this.currentIndex = index;
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  projectRoute() {
    if (!this.route.length) return [];
    const padding = 30;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const lats = this.route.map(p => p[0]);
    const lons = this.route.map(p => p[1]);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const lonRange = Math.max(1e-9, maxLon - minLon);
    const latRange = Math.max(1e-9, maxLat - minLat);
    const scale = Math.min((width - padding * 2) / lonRange, (height - padding * 2) / latRange);
    const projected = this.route.map(([lat, lon]) => {
      const x = padding + (lon - minLon) * scale;
      const y = height - padding - (lat - minLat) * scale;
      return [x, y];
    });
    return projected;
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(28, 60, 94, 0.5)');
    gradient.addColorStop(1, 'rgba(5, 12, 24, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const projected = this.projectRoute();
    if (!projected.length) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, height - 16);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(width - 16, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.beginPath();
    projected.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4d7cff';
    ctx.stroke();

    // start / finish markers
    const start = projected[0];
    const finish = projected[projected.length - 1];
    this.drawMarker(start[0], start[1], '#ffffff', '#071525', 'S');
    this.drawMarker(finish[0], finish[1], '#ffdd5c', '#071525', 'F');

    const idx = Math.max(0, Math.min(projected.length - 1, this.currentIndex));
    const [cx, cy] = projected[idx];
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#d0fb33';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10213d';
    ctx.stroke();
  }

  drawMarker(x, y, fill, textColor, label) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);
  }
}

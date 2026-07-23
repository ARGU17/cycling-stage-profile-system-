(function () {
  'use strict';

  let chart = null;
  let element = null;
  let elementId = null;
  let currentStage = null;
  let hoverCallback = null;
  let renderer = 'fallback';

  const gradePieces = [
    { lte: -9, color: '#1a4bff' },
    { gt: -9, lte: -6, color: '#2c7cff' },
    { gt: -6, lte: -3, color: '#2bb2ff' },
    { gt: -3, lte: -1, color: '#24c6c6' },
    { gt: -1, lte: 1.5, color: '#14b81f' },
    { gt: 1.5, lte: 3, color: '#63cf15' },
    { gt: 3, lte: 5, color: '#b5c718' },
    { gt: 5, lte: 7, color: '#e4c625' },
    { gt: 7, lte: 9, color: '#ee9430' },
    { gt: 9, color: '#dd5a22' }
  ];

  function gradeColor(grade) {
    const g = Number(grade) || 0;
    if (g <= -9) return '#1a4bff';
    if (g <= -6) return '#2c7cff';
    if (g <= -3) return '#2bb2ff';
    if (g <= -1) return '#24c6c6';
    if (g <= 1.5) return '#14b81f';
    if (g <= 3) return '#63cf15';
    if (g <= 5) return '#b5c718';
    if (g <= 7) return '#e4c625';
    if (g <= 9) return '#ee9430';
    return '#dd5a22';
  }

  function init(id, onHover) {
    elementId = id;
    element = document.getElementById(id);
    hoverCallback = onHover || null;
    if (!element) return;
    element.classList.add('profile-render-root');
    upgrade();
    window.addEventListener('resize', resize);
  }

  function upgrade() {
    if (!element && elementId) element = document.getElementById(elementId);
    if (!element || !window.echarts?.init || chart) return false;
    try {
      element.innerHTML = '';
      chart = window.echarts.init(element, null, { renderer: 'canvas' });
      renderer = 'echarts';
      bindChartEvents();
      if (currentStage) renderECharts(currentStage);
      return true;
    } catch (error) {
      console.warn('[Grand Tour Stage Lab] ECharts no pudo inicializarse; se mantiene el perfil SVG.', error);
      chart = null;
      renderer = 'fallback';
      if (currentStage) renderFallback(currentStage);
      return false;
    }
  }

  function bindChartEvents() {
    if (!chart) return;
    chart.on('showTip', (event) => {
      if (!currentStage || !hoverCallback) return;
      const index = Number(event.dataIndex);
      if (Number.isFinite(index) && currentStage.points[index]) hoverCallback(currentStage.points[index]);
    });
    chart.on('globalout', () => hoverCallback?.(null));
    chart.getZr().on('mousemove', (event) => {
      if (!currentStage || !hoverCallback || !chart) return;
      const pixel = [event.offsetX, event.offsetY];
      if (!chart.containPixel({ gridIndex: 0 }, pixel)) return;
      const value = chart.convertFromPixel({ gridIndex: 0 }, pixel);
      if (!value || !Number.isFinite(value[0])) return;
      hoverCallback(pointAtKm(currentStage, value[0]));
    });
  }

  function pointAtKm(stage, km) {
    let low = 0;
    let high = stage.points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (stage.points[mid].distanceKm < km) low = mid + 1;
      else high = mid;
    }
    return stage.points[low];
  }

  function climbMarkData(stage) {
    return (stage.climbs || []).map((climb) => ({
      name: `${climb.name} · Cat. ${climb.category}`,
      coord: [climb.summitKm, climb.summitEle],
      value: climb.category,
      symbol: 'pin',
      symbolSize: 34,
      itemStyle: { color: climb.category === 'HC' || climb.category === '1' ? '#ff5c5c' : '#ff9f43' },
      label: { show: true, formatter: climb.category, color: '#071018', fontWeight: 900, fontSize: 9 }
    }));
  }

  function render(stage) {
    if (!element || !stage?.points?.length) return;
    currentStage = stage;
    if (chart && renderer === 'echarts') renderECharts(stage);
    else renderFallback(stage);
  }

  function renderECharts(stage) {
    if (!chart) return;
    const data = stage.points.map((point) => [
      Number(point.distanceKm.toFixed(3)),
      Number(point.ele.toFixed(1)),
      Number(point.grade.toFixed(2))
    ]);
    const minimum = Math.max(0, Math.floor((stage.minEleM - 80) / 100) * 100);
    const maximum = Math.ceil((stage.maxEleM + 130) / 100) * 100;
    const marks = climbMarkData(stage);
    if (stage.sprint) {
      marks.push({
        name: stage.sprint.label,
        coord: [stage.sprint.km, stage.sprint.ele],
        value: 'S',
        symbol: 'diamond',
        symbolSize: 23,
        itemStyle: { color: '#72f0a8' },
        label: { show: true, formatter: 'S', color: '#071018', fontWeight: 900, fontSize: 9 }
      });
    }

    chart.setOption({
      animationDurationUpdate: 350,
      backgroundColor: 'transparent',
      grid: { left: 55, right: 25, top: 31, bottom: 52 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,.52)', width: 1 } },
        backgroundColor: 'rgba(5, 12, 18, .95)',
        borderColor: 'rgba(142,180,205,.28)',
        textStyle: { color: '#f1f6f9', fontSize: 11 },
        formatter(params) {
          const item = params?.find?.(entry => entry.seriesName === 'Perfil') || params?.[0];
          if (!item) return '';
          const [km, elevation, grade] = item.value;
          return [`<strong>km ${Number(km).toFixed(1)}</strong>`, `Altitud: <b>${Math.round(elevation)} m</b>`, `Pendiente: <b>${Number(grade).toFixed(1)} %</b>`, `A meta: <b>${Math.max(0, stage.distanceKm - km).toFixed(1)} km</b>`].join('<br>');
        }
      },
      xAxis: {
        type: 'value', min: 0, max: Math.ceil(stage.distanceKm), name: 'DISTANCIA (KM)', nameLocation: 'middle', nameGap: 34,
        nameTextStyle: { color: '#607586', fontSize: 9, fontWeight: 700 },
        axisLine: { lineStyle: { color: 'rgba(142,180,205,.25)' } }, axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(142,180,205,.08)' } }, axisLabel: { color: '#8ba1b2', fontSize: 9 }
      },
      yAxis: {
        type: 'value', min: minimum, max: maximum, name: 'M', nameLocation: 'end', nameGap: 8,
        nameTextStyle: { color: '#607586', fontSize: 9 }, axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(142,180,205,.08)' } }, axisLabel: { color: '#8ba1b2', fontSize: 9 }
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none', zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: 'slider', xAxisIndex: 0, filterMode: 'none', height: 16, bottom: 8, borderColor: 'rgba(142,180,205,.16)', backgroundColor: 'rgba(255,255,255,.018)', fillerColor: 'rgba(114,240,168,.11)', handleStyle: { color: '#72f0a8', borderColor: '#72f0a8' }, textStyle: { color: '#607586', fontSize: 8 }, showDetail: false }
      ],
      series: [
        {
          name: 'Color de pendiente',
          type: 'custom',
          silent: true,
          data: data.map((item, index) => [item[0], item[1], item[2], data[index + 1]?.[0] ?? stage.distanceKm]),
          renderItem(params, api) {
            const km = api.value(0);
            const elevation = api.value(1);
            const grade = api.value(2);
            const nextKm = Math.max(km + 0.002, api.value(3));
            const top = api.coord([km, elevation]);
            const bottom = api.coord([km, minimum]);
            const right = api.coord([nextKm, minimum]);
            return {
              type: 'rect',
              shape: {
                x: top[0],
                y: top[1],
                width: Math.max(1, right[0] - top[0] + 0.4),
                height: Math.max(0, bottom[1] - top[1])
              },
              style: { fill: gradeColor(grade), opacity: 0.96 }
            };
          },
          encode: { x: [0, 3], y: 1 }
        },
        {
          name: 'Perfil', type: 'line', data, showSymbol: false, smooth: 0.12, sampling: 'lttb',
          lineStyle: { width: 2.2, color: 'rgba(235,246,255,.96)' },
          areaStyle: { opacity: 0 },
          emphasis: { disabled: true }, markPoint: { silent: true, data: marks },
          markLine: { silent: true, symbol: ['none', 'none'], lineStyle: { color: 'rgba(255,255,255,.16)', type: 'dashed' }, label: { color: '#8ba1b2', fontSize: 8 }, data: [{ xAxis: 0, label: { formatter: 'SALIDA', position: 'insideStartTop' } }, { xAxis: stage.distanceKm, label: { formatter: 'META', position: 'insideEndTop' } }] }
        }
      ]
    }, true);
  }

  function samplePoints(points, maximum) {
    if (points.length <= maximum) return points;
    const step = Math.ceil(points.length / maximum);
    const sampled = points.filter((_, index) => index % step === 0);
    if (sampled[sampled.length - 1] !== points[points.length - 1]) sampled.push(points[points.length - 1]);
    return sampled;
  }

  function renderFallback(stage) {
    renderer = 'fallback';
    if (chart) {
      try { chart.dispose(); } catch (_) { /* noop */ }
      chart = null;
    }
    const W = 1200;
    const H = 330;
    const pad = { l: 62, r: 25, t: 28, b: 48 };
    const pw = W - pad.l - pad.r;
    const ph = H - pad.t - pad.b;
    const minEle = Math.max(0, Math.floor((stage.minEleM - 60) / 100) * 100);
    const maxEle = Math.max(minEle + 100, Math.ceil((stage.maxEleM + 90) / 100) * 100);
    const points = samplePoints(stage.points, 700);
    const x = (p) => pad.l + (p.distanceKm / Math.max(0.1, stage.distanceKm)) * pw;
    const y = (p) => pad.t + ((maxEle - p.ele) / Math.max(1, maxEle - minEle)) * ph;
    const linePoints = points.map((p) => `${x(p).toFixed(2)},${y(p).toFixed(2)}`).join(' ');
    const areaPoints = `${pad.l},${pad.t + ph} ${linePoints} ${pad.l + pw},${pad.t + ph}`;
    const profileClipId = `pfClip-${String(stage.id || 'stage').replace(/[^a-z0-9_-]/gi, '')}`;

    const horizontalGrid = Array.from({ length: 5 }, (_, i) => {
      const yy = pad.t + (ph * i / 4);
      const ele = Math.round(maxEle - ((maxEle - minEle) * i / 4));
      return `<line x1="${pad.l}" y1="${yy}" x2="${pad.l + pw}" y2="${yy}" class="pf-grid"/><text x="${pad.l - 10}" y="${yy + 4}" class="pf-axis" text-anchor="end">${ele}</text>`;
    }).join('');
    const verticalGrid = Array.from({ length: 6 }, (_, i) => {
      const xx = pad.l + (pw * i / 5);
      const km = stage.distanceKm * i / 5;
      return `<line x1="${xx}" y1="${pad.t}" x2="${xx}" y2="${pad.t + ph}" class="pf-grid"/><text x="${xx}" y="${H - 20}" class="pf-axis" text-anchor="middle">${km.toFixed(0)}</text>`;
    }).join('');
    const coloredSegments = points.slice(0, -1).map((p, i) => {
      const next = points[i + 1];
      const x1 = x(p);
      const x2 = x(next);
      return `<rect x="${x1.toFixed(2)}" y="${pad.t}" width="${Math.max(1, x2 - x1 + .5).toFixed(2)}" height="${ph}" fill="${gradeColor(p.grade)}"/>`;
    }).join('');
    const climbMarks = (stage.climbs || []).slice(0, 8).map((climb) => {
      const point = pointAtKm(stage, climb.summitKm);
      const xx = x(point);
      const yy = y(point);
      return `<line x1="${xx}" y1="${yy}" x2="${xx}" y2="${pad.t + ph}" class="pf-climb-line"/><circle cx="${xx}" cy="${yy}" r="9" class="pf-climb-dot"/><text x="${xx}" y="${yy + 3}" class="pf-climb-cat" text-anchor="middle">${climb.category}</text>`;
    }).join('');
    let sprintMark = '';
    if (stage.sprint) {
      const point = pointAtKm(stage, stage.sprint.km);
      sprintMark = `<line x1="${x(point)}" y1="${y(point)}" x2="${x(point)}" y2="${pad.t + ph}" class="pf-sprint-line"/><rect x="${x(point) - 8}" y="${y(point) - 8}" width="16" height="16" rx="3" class="pf-sprint-dot"/><text x="${x(point)}" y="${y(point) + 3}" class="pf-sprint-label" text-anchor="middle">S</text>`;
    }

    element.innerHTML = `
      <div class="profile-fallback">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Perfil de ${escapeHtml(stage.routeLabel)}">
          <defs>
            <clipPath id="${profileClipId}"><polygon points="${areaPoints}"/></clipPath>
          </defs>
          ${horizontalGrid}${verticalGrid}
          <g clip-path="url(#${profileClipId})">${coloredSegments}<rect x="${pad.l}" y="${pad.t}" width="${pw}" height="${ph}" fill="url(#none)" opacity="0"/></g>
          <polyline points="${linePoints}" class="pf-outline"/>
          ${climbMarks}${sprintMark}
          <line id="pfHoverLine" x1="0" y1="${pad.t}" x2="0" y2="${pad.t + ph}" class="pf-hover-line" visibility="hidden"/>
          <circle id="pfHoverDot" cx="0" cy="0" r="6" class="pf-hover-dot" visibility="hidden"/>
          <rect id="pfOverlay" x="${pad.l}" y="${pad.t}" width="${pw}" height="${ph}" fill="transparent"/>
          <text x="${W / 2}" y="${H - 3}" class="pf-axis-title" text-anchor="middle">DISTANCIA (KM)</text>
        </svg>
        <div id="pfTooltip" class="profile-fallback-tooltip" hidden></div>
        <span class="fallback-mode-label">PERFIL LOCAL</span>
      </div>`;

    const overlay = element.querySelector('#pfOverlay');
    const hoverLine = element.querySelector('#pfHoverLine');
    const hoverDot = element.querySelector('#pfHoverDot');
    const tooltip = element.querySelector('#pfTooltip');
    if (!overlay || !hoverLine || !hoverDot || !tooltip) return;

    overlay.addEventListener('mousemove', (event) => {
      const rect = overlay.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const point = pointAtKm(stage, ratio * stage.distanceKm);
      const xx = x(point);
      const yy = y(point);
      hoverLine.setAttribute('x1', xx);
      hoverLine.setAttribute('x2', xx);
      hoverLine.setAttribute('visibility', 'visible');
      hoverDot.setAttribute('cx', xx);
      hoverDot.setAttribute('cy', yy);
      hoverDot.setAttribute('visibility', 'visible');
      tooltip.hidden = false;
      tooltip.innerHTML = `<strong>km ${point.distanceKm.toFixed(1)}</strong><span>${Math.round(point.ele)} m · ${point.grade.toFixed(1)} %</span>`;
      const rootRect = element.getBoundingClientRect();
      tooltip.style.left = `${Math.min(rootRect.width - 130, Math.max(8, event.clientX - rootRect.left + 12))}px`;
      tooltip.style.top = `${Math.max(8, event.clientY - rootRect.top - 48)}px`;
      hoverCallback?.(point);
    });
    overlay.addEventListener('mouseleave', () => {
      hoverLine.setAttribute('visibility', 'hidden');
      hoverDot.setAttribute('visibility', 'hidden');
      tooltip.hidden = true;
      hoverCallback?.(null);
    });
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function resize() {
    chart?.resize();
  }

  window.ProfileView = { init, render, resize, upgrade };
})();

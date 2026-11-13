/* ============ Mascote do Muvi: fantasminha com degradê vivo nas cores Moove atrás da logo; os olhos seguem o dedo/mouse e piscam ============ */
(function () {
  const logo = document.querySelector('.hero-logo img'); if (!logo || document.querySelector('.mascot')) return;
  const SHAPE = new Path2D('M230.809 115.385V249.411C230.809 269.923 214.985 287.282 194.495 288.411C184.544 288.949 175.364 285.718 168.26 280C159.746 273.154 147.769 273.461 139.178 280.23C132.638 285.384 124.381 288.462 115.379 288.462C106.377 288.462 98.1451 285.384 91.6055 280.23C82.912 273.385 70.9353 273.385 62.2415 280.23C55.7532 285.334 47.598 288.411 38.7246 288.462C17.4132 288.615 0 270.667 0 249.359V115.385C0 51.6667 51.6756 0 115.404 0C179.134 0 230.809 51.6667 230.809 115.385Z');
  const VW = 231, VH = 289, COLORS = ['#D44CFF', '#6E52FF', '#00D2FF', '#356CFF', '#FFB3EC'];
  const wrap = document.createElement('span'); wrap.className = 'mascot'; wrap.setAttribute('aria-hidden', 'true');
  const cv = document.createElement('canvas'); wrap.append(cv); logo.before(wrap);
  const box = document.createElement('span'); box.className = 'mascot-box'; logo.before(box); box.append(wrap, logo);
  const x = cv.getContext('2d'), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dpr = 1, cw = 0, ch = 0;
  function size() { dpr = Math.min(3, devicePixelRatio || 1); const r = wrap.getBoundingClientRect(); cw = Math.round(r.width * dpr); ch = Math.round(r.height * dpr); if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; } }
  /* olhar: segue o ponteiro; sem ponteiro, passeia sozinho */
  const look = { x: 0, y: 0, tx: 0, ty: 0, last: -9 };
  addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); if (!r.width) return; const cx = r.left + r.width / 2, cy = r.top + r.height * .42;
    look.tx = clamp((e.clientX - cx) * .08, -8, 8); look.ty = clamp((e.clientY - cy) * .08, -8, 8); look.last = performance.now() / 1000; }, { passive: true });
  addEventListener('pointerdown', e => { look.last = performance.now() / 1000; }, { passive: true });
  function frame(now) {
    const t = now / 1000; if (!cw) size();
    if (t - look.last > 2.5) { look.tx = Math.sin(t * .7) * 6; look.ty = Math.sin(t * 1.1) * 3; }
    look.x += (look.tx - look.x) * .12; look.y += (look.ty - look.y) * .12;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch);
    /* respira: sobe um pouco e estica (como o original) */
    const k = calm ? 0 : (1 - Math.cos(t * 2 * Math.PI / 2.8)) / 2, s = Math.min(cw / VW, ch / (VH * 1.1));
    x.translate(cw / 2, ch * .04 + (-8 * k) * s); x.scale(s, s * (1 + .08 * k)); x.translate(-VW / 2, 0);
    x.save(); x.clip(SHAPE);
    /* degradê "mesh": manchas de cor girando devagar sobre fundo escuro */
    x.fillStyle = '#1A1A2E'; x.fillRect(0, 0, VW, VH);
    COLORS.forEach((c, i) => { const a = t * (.35 + i * .07) + i * 1.7, bx = VW * (.5 + .38 * Math.cos(a)), by = VH * (.45 + .35 * Math.sin(a * 1.3 + i)), r = VW * (.55 + .12 * Math.sin(t * .5 + i));
      const g = x.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, c + 'ee'); g.addColorStop(1, c + '00'); x.globalCompositeOperation = 'source-over'; x.globalAlpha = .78; x.fillStyle = g; x.fillRect(0, 0, VW, VH); });
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    const sh = x.createLinearGradient(0, 0, VW, VH); sh.addColorStop(0, 'rgba(255,255,255,.14)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = sh; x.fillRect(0, 0, VW, VH);
    x.restore();
    /* olhos que piscam */
    const ph = (t % 3.2) / 3.2, blink = calm ? 1 : ph > .9 && ph < 1 ? Math.max(.1, Math.abs(ph - .95) / .05) : 1;
    x.fillStyle = '#0B0F1C';
    for (const ex of [80, 150]) { x.beginPath(); x.ellipse(ex + look.x, 120 + look.y, 20, 30 * blink, 0, 0, 7); x.fill();
      if (blink > .5) { x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(ex + look.x + 6, 108 + look.y, 5, 7 * blink, 0, 0, 7); x.fill(); x.fillStyle = '#0B0F1C'; } }
    if (!document.hidden && wrap.isConnected && wrap.offsetParent) requestAnimationFrame(frame); else setTimeout(() => requestAnimationFrame(frame), 400);
  }
  new ResizeObserver(size).observe(wrap); size(); requestAnimationFrame(frame);
})();

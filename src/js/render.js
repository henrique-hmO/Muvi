/* ============ RENDER: one pure-ish function draws any frame ============ */
const FALLBACK = '"Instrument Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
function F(L, role, size) {
  const fam = role === 'display' ? L.display : role === 'mono' ? 'JetBrains Mono' : L.body;
  const w = role === 'display' ? L.dW : role === 'mono' ? 500 : role === 'bold' ? 700 : L.bW;
  return `${w} ${Math.round(size)}px "${fam}", ${role === 'mono' ? 'ui-monospace, monospace' : FALLBACK}`;
}
function look(P) { return LOOKS[P.look] || LOOKS.moove; }

/* ---------- rich text: *word* marks accent ---------- */
function tokens(text, upper) {
  const out = []; let acc = false;
  String(text ?? '').split(/(\*)/).forEach(part => {
    if (part === '*') { acc = !acc; return; }
    part.split(/(\s+)/).forEach(w => { if (w && !/^\s+$/.test(w)) out.push({ t: upper ? w.toUpperCase() : w, acc }); });
  });
  return out;
}
function layoutWords(ctx, toks, maxW, lineH) {
  const space = ctx.measureText(' ').width, lines = [[]]; let x = 0;
  for (const tk of toks) {
    const w = ctx.measureText(tk.t).width;
    if (x > 0 && x + w > maxW) { lines.push([]); x = 0; }
    lines[lines.length - 1].push({ ...tk, x, w });
    x += w + space;
  }
  return lines.map(l => ({ toks: l, w: l.length ? l[l.length - 1].x + l[l.length - 1].w : 0, h: lineH }));
}
/* largest size (<= max) whose wrap fits in maxLines and box height */
function fitText(ctx, L, role, text, maxW, maxSize, minSize, maxLines, maxH = 1e9, lh = 1.08) {
  const toks = tokens(text, role === 'display' && L.upper);
  let size = maxSize;
  for (; size > minSize; size *= 0.94) {
    ctx.font = F(L, role, size);
    const lines = layoutWords(ctx, toks, maxW, size * lh);
    if (lines.length <= maxLines && lines.length * size * lh <= maxH && lines.every(l => l.w <= maxW + 1)) return { size, lines };
  }
  ctx.font = F(L, role, minSize);
  return { size: minSize, lines: layoutWords(ctx, toks, maxW, minSize * lh) };
}
function wrapPlain(ctx, text, maxW) {
  return layoutWords(ctx, tokens(text, false), maxW, 0).map(l => l.toks.map(t => t.t).join(' '));
}

/* ---------- geometry helpers ---------- */
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function grad(ctx, L, x0, y0, x1, y1) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, L.a1); g.addColorStop(1, L.a2); return g; }

/* ---------- noise texture (deterministic) ---------- */
let NOISE = null;
function noiseCanvas() {
  if (NOISE) return NOISE;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), d = x.createImageData(256, 256);
  let s = 1337; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
  x.putImageData(d, 0, 0); NOISE = c; return c;
}

/* ---------- backgrounds ---------- */
function drawBackground(ctx, L, W, H, t) {
  ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H);
  const m = Math.min(W, H);
  if (L.bg2 === 'blobs') {
    const blobs = [[L.a1, .25 + .12 * Math.sin(t * .31), .2 + .1 * Math.cos(t * .23), .9], [L.a2, .8 + .1 * Math.cos(t * .27), .85 + .08 * Math.sin(t * .19), 1], ...(L === LOOKS.moove ? [['#356CFF', .55 + .1 * Math.sin(t * .17), .55, .8]] : [])];
    ctx.globalCompositeOperation = 'lighter';
    for (const [c, px, py, r] of blobs) {
      const g = ctx.createRadialGradient(px * W, py * H, 0, px * W, py * H, m * r);
      g.addColorStop(0, c + '38'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = L.line; ctx.lineWidth = 1; const step = m / 9, off = (t * 6) % step;
    ctx.globalAlpha = .45; ctx.beginPath();
    for (let x = -step + off; x < W + step; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -step + off; y < H + step; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke(); ctx.globalAlpha = 1;
  } else if (L.bg2 === 'dots') {
    ctx.fillStyle = L.line; const step = m / 22;
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) { ctx.beginPath(); ctx.arc(x, y, m * .0022, 0, 7); ctx.fill(); }
    const g = ctx.createRadialGradient(W * .85, H * .1, 0, W * .85, H * .1, m * .9); g.addColorStop(0, L.a1 + '18'); g.addColorStop(1, L.a1 + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (L.bg2 === 'scan') {
    const g = ctx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, m * 1.1); g.addColorStop(0, '#2a2420'); g.addColorStop(1, L.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
    ctx.strokeStyle = L.line; ctx.lineWidth = m * .003; const c = m * .05, M = m * .045;
    for (const [x, y, sx, sy] of [[M, M, 1, 1], [W - M, M, -1, 1], [M, H - M, 1, -1], [W - M, H - M, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(x, y + sy * c); ctx.lineTo(x, y); ctx.lineTo(x + sx * c, y); ctx.stroke();
    }
  } else if (L.bg2 === 'chalk') {
    const g = ctx.createRadialGradient(W / 2, H / 2, m * .2, W / 2, H / 2, m * 1.2); g.addColorStop(0, '#24453a'); g.addColorStop(1, '#16291f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = m * .05;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(W * (.1 + i * .2), H * .1); ctx.bezierCurveTo(W * .3, H * .4, W * .7, H * .2, W * (.9 - i * .15), H * .9); ctx.stroke(); }
    ctx.fillStyle = '#5b3a1f'; ctx.fillRect(0, H - m * .025, W, m * .025);
  } else if (L.bg2 === 'paper') {
    ctx.strokeStyle = L.line; ctx.lineWidth = 1;
    for (let y = m * .12; y < H; y += m * .06) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = L.a1 + '55'; ctx.beginPath(); ctx.moveTo(m * .08, 0); ctx.lineTo(m * .08, H); ctx.stroke();
  }
  ctx.save(); ctx.globalAlpha = L.bg2 === 'clean' ? .5 : 1; ctx.fillStyle = ctx.createPattern(noiseCanvas(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
}

/* ---------- shared bits ---------- */
function kicker(ctx, L, text, x, y, size, k, align = 'left') {
  if (!text) return;
  ctx.save(); ctx.globalAlpha = k; ctx.font = F(L, 'mono', size);
  const label = String(text).toUpperCase(); const w = ctx.measureText(label).width;
  const bar = size * 1.6 * ease.out(k);
  let x0 = align === 'center' ? x - (w + bar + size * .6) / 2 : x;
  ctx.fillStyle = L.a1; ctx.fillRect(x0, y - size * .38, bar, size * .16);
  ctx.fillStyle = L.a1; ctx.textBaseline = 'middle'; ctx.fillText(label, x0 + bar + size * .6, y);
  ctx.restore();
}
/* draws laid-out lines; per-word animation via fn(i) -> {a, dy, s} */
function drawLines(ctx, L, fit, x, y, maxW, role, align, wordAnim, colors = {}) {
  ctx.font = F(L, role, fit.size); ctx.textBaseline = 'alphabetic';
  let wi = 0; const lh = fit.lines[0]?.h || fit.size;
  fit.lines.forEach((ln, li) => {
    const lx = align === 'center' ? x + (maxW - ln.w) / 2 : x;
    const by = y + li * lh + fit.size * .82;
    for (const tk of ln.toks) {
      const an = wordAnim ? wordAnim(wi, li) : { a: 1, dy: 0, s: 1 };
      wi++;
      if (an.a <= 0) continue;
      ctx.save(); ctx.globalAlpha = an.a;
      const cx = lx + tk.x + tk.w / 2;
      ctx.translate(cx, by + (an.dy || 0)); if (an.s && an.s !== 1) ctx.scale(an.s, an.s);
      if (colors.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = fit.size * .16; ctx.strokeStyle = colors.stroke; ctx.strokeText(tk.t, -tk.w / 2, 0); }
      ctx.fillStyle = tk.acc ? (colors.acc || L.a1) : (colors.ink || L.ink);
      ctx.fillText(tk.t, -tk.w / 2, 0); ctx.restore();
    }
  });
  return fit.lines.length * lh;
}
const wordIn = (t, start, stagger, d = .45, rise = 40) => (i) => {
  const k = pr(t, start + i * stagger, d); return { a: ease.out(k), dy: (1 - ease.out(k)) * rise, s: 1 };
};
/* fade/slide everything out over the scene's final 0.35s */
function outro(t, dur) { return 1 - ease.inOut(pr(t, dur - .35, .35)); }

/* ---------- SCENE TEMPLATES ---------- */
const DRAW = {};

DRAW.hook = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const fit = fitText(ctx, L, 'display', p.text || '', cw, m * .19, m * .06, 5, H * .6, 1.02);
  const h = fit.lines.length * fit.lines[0].h, y = (H - h) / 2;
  kicker(ctx, L, p.kicker, W / 2, y - m * .08, m * .03, ease.out(pr(t, 0, .4)), 'center');
  drawLines(ctx, L, fit, M, y, cw, 'display', 'center', i => {
    const k = pr(t, .1 + i * .14, .38); return { a: k > 0 ? 1 : 0, s: lerp(1.6, 1, ease.back(k)), dy: 0 };
  });
};

DRAW.title = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const fit = fitText(ctx, L, 'display', p.title || '', cw, m * .14, m * .05, 4, H * .45);
  ctx.font = F(L, 'body', m * .042); const subLines = p.sub ? wrapPlain(ctx, p.sub, cw * .9) : [];
  const th = fit.lines.length * fit.lines[0].h, total = th + m * .1 + subLines.length * m * .058;
  const y = (H - total) / 2;
  kicker(ctx, L, p.kicker, M, y - m * .06, m * .03, ease.out(pr(t, 0, .5)));
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - m * .02, W, th + m * .04); ctx.clip();
  drawLines(ctx, L, fit, M, y, cw, 'display', 'left', (i, li) => { const k = ease.out(pr(t, .15 + li * .12, .6)); return { a: 1, dy: (1 - k) * fit.size * 1.2 }; });
  ctx.restore();
  const uk = ease.inOut(pr(t, .7, .6)); ctx.fillStyle = grad(ctx, L, M, 0, M + cw * .4, 0);
  ctx.fillRect(M, y + th + m * .025, cw * .35 * uk, m * .012);
  ctx.font = F(L, 'body', m * .042); ctx.fillStyle = L.muted; ctx.textBaseline = 'alphabetic';
  subLines.forEach((ln, i) => { const k = ease.out(pr(t, .9 + i * .1, .5)); ctx.globalAlpha = k; ctx.fillText(ln, M, y + th + m * .12 + i * m * .058 + (1 - k) * 20); });
  ctx.globalAlpha = 1;
};

DRAW.bullets = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const items = (p.items || []).slice(0, 7);
  const tf = fitText(ctx, L, 'display', p.title || '', cw, m * .09, m * .045, 2);
  const fs = m * (items.length > 5 ? .042 : .05);
  ctx.font = F(L, 'body', fs);
  const wrapped = items.map(it => wrapPlain(ctx, it, cw - fs * 2.2));
  const itemsH = wrapped.reduce((a, l) => a + l.length * fs * 1.25 + fs * .9, 0);
  const th = tf.lines.length * tf.lines[0].h, total = th + m * .07 + itemsH;
  let y = Math.max(M, (H - total) / 2);
  drawLines(ctx, L, tf, M, y, cw, 'display', 'left', wordIn(t, 0, .06));
  y += th + m * .07;
  const per = Math.max(.35, Math.min(.9, (d - 1.6) / Math.max(1, items.length)));
  wrapped.forEach((lines, i) => {
    const k = pr(t, .5 + i * per, .45), e = ease.out(k);
    ctx.save(); ctx.globalAlpha = e; ctx.translate((1 - e) * -m * .04, 0);
    const r = fs * .42, cx = M + r, cy = y + fs * .55;
    ctx.fillStyle = L.a1; ctx.beginPath(); ctx.arc(cx, cy, r * (0.6 + .4 * ease.back(k)), 0, 7); ctx.fill();
    const ck = pr(t, .65 + i * per, .3);
    if (ck > 0) { ctx.strokeStyle = L.onA; ctx.lineWidth = r * .3; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(cx - r * .45, cy); ctx.lineTo(cx - r * .45 + r * .3 * Math.min(1, ck * 2), cy + r * .3 * Math.min(1, ck * 2));
      if (ck > .5) ctx.lineTo(cx - r * .15 + r * .65 * (ck - .5) * 2, cy + r * .3 - r * .7 * (ck - .5) * 2); ctx.stroke(); }
    ctx.font = F(L, 'body', fs); ctx.fillStyle = L.ink; ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, j) => ctx.fillText(ln, M + fs * 1.6, y + fs * .9 + j * fs * 1.25));
    ctx.restore();
    y += lines.length * fs * 1.25 + fs * .9;
  });
};

DRAW.stat = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const v = Number(p.value) || 0, dec = Math.abs(v) < 10 && v % 1 ? 1 : 0;
  const k = ease.expo(pr(t, .2, 1.3));
  const txt = `${p.prefix || ''}${fmtNum(v * k, dec)}${p.suffix || ''}`;
  const finalTxt = `${p.prefix || ''}${fmtNum(v, dec)}${p.suffix || ''}`;
  let size = Math.min(m * .34, H * .26); ctx.font = F(L, 'display', size);
  while (ctx.measureText(finalTxt).width > cw * .92 && size > m * .08) { size *= .94; ctx.font = F(L, 'display', size); }
  const cy = H * .42, RR = Math.min(cw * .5, size * 1.15, H * .3);
  if (String(p.suffix).trim() === '%' && v <= 100) {
    const R = RR;
    ctx.lineWidth = m * .022; ctx.strokeStyle = L.line; ctx.beginPath(); ctx.arc(W / 2, cy, R, 0, 7); ctx.stroke();
    ctx.strokeStyle = grad(ctx, L, W / 2 - R, cy, W / 2 + R, cy); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(W / 2, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (v / 100) * k); ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = L.ink;
  ctx.save(); ctx.translate(W / 2, cy); const s = lerp(.85, 1, ease.back(pr(t, 0, .5))); ctx.scale(s, s);
  ctx.fillText(txt, 0, size * .04); ctx.restore();
  const R2 = String(p.suffix).trim() === '%' ? RR : size * .6;
  const lk = ease.out(pr(t, .9, .5)); ctx.globalAlpha = lk;
  ctx.font = F(L, 'bold', m * .052); ctx.fillStyle = L.a1; ctx.fillText(p.label || '', W / 2, cy + R2 + m * .1 + (1 - lk) * 20);
  ctx.font = F(L, 'body', m * .04); ctx.fillStyle = L.muted;
  wrapPlain(ctx, p.note || '', cw).forEach((ln, i) => ctx.fillText(ln, W / 2, cy + R2 + m * .17 + i * m * .055 + (1 - lk) * 20));
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
};

DRAW.compare = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .08, cw = W - M * 2, vertical = H > W * 1.2;
  const tf = fitText(ctx, L, 'display', p.title || '', cw, m * .085, m * .045, 2);
  const th = tf.lines.length * tf.lines[0].h;
  let y = vertical ? H * .1 : M * 1.1;
  drawLines(ctx, L, tf, M, y, cw, 'display', vertical ? 'left' : 'center', wordIn(t, 0, .06));
  y += th + m * .06;
  const gap = m * .05, vh = H - y - M - m * .12;
  const boxes = vertical ? [[M, y, cw, (vh - gap) / 2], [M, y + (vh - gap) / 2 + gap, cw, (vh - gap) / 2]]
    : [[M, y, (cw - gap) / 2, vh], [M + (cw - gap) / 2 + gap, y, (cw - gap) / 2, vh]];
  [[p.leftLabel, p.left, L.muted, .3], [p.rightLabel, p.right, L.a1, .8]].forEach(([label, items, col, st], i) => {
    const [bx, by, bw, bh] = boxes[i], k = ease.out(pr(t, st, .5));
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * m * .04);
    rr(ctx, bx, by, bw, bh, m * .03); ctx.fillStyle = L.surface; ctx.fill();
    ctx.lineWidth = m * .004; ctx.strokeStyle = i ? L.a1 : L.line; ctx.stroke();
    const pad = m * .045; ctx.font = F(L, 'mono', m * .032); ctx.fillStyle = col; ctx.textBaseline = 'top';
    ctx.fillText(String(label || '').toUpperCase(), bx + pad, by + pad);
    const fs = m * .045; ctx.font = F(L, 'body', fs); ctx.fillStyle = L.ink; let iy = by + pad + m * .075;
    (items || []).slice(0, 5).forEach((it, j) => {
      const kk = ease.out(pr(t, st + .3 + j * .3, .4)); ctx.globalAlpha = k * kk;
      for (const ln of wrapPlain(ctx, '— ' + it, bw - pad * 2)) { if (iy + fs < by + bh - pad / 2) ctx.fillText(ln, bx + pad, iy); iy += fs * 1.25; }
      iy += fs * .3;
    });
    ctx.restore();
  });
  const vk = ease.back(pr(t, .6, .45));
  if (vk > 0) {
    const cx = vertical ? W / 2 : W / 2, cy = vertical ? boxes[1][1] - gap / 2 : boxes[0][1] + boxes[0][3] / 2, r = m * .055 * vk;
    ctx.fillStyle = L.a1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    ctx.fillStyle = L.onA; ctx.font = F(L, 'display', m * .045 * vk); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VS', cx, cy + 2); ctx.textAlign = 'left';
  }
  if (p.verdict) {
    const k = ease.out(pr(t, Math.min(d - 1.2, 2.2), .5)); ctx.globalAlpha = k;
    ctx.font = F(L, 'bold', m * .042); ctx.fillStyle = L.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(p.verdict, W / 2, H - M - m * .02 + (1 - k) * 20); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }
};

DRAW.steps = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2, steps = (p.steps || []).slice(0, 6), n = steps.length || 1;
  const tf = fitText(ctx, L, 'display', p.title || '', cw, m * .085, m * .045, 2), th = tf.lines.length * tf.lines[0].h;
  const vertical = H >= W;
  const per = Math.max(.4, (d - 1.8) / n);
  if (vertical) {
    const fs = m * .048; ctx.font = F(L, 'body', fs);
    const wrapped = steps.map(s => wrapPlain(ctx, s, cw - m * .2));
    const rowH = wrapped.map(l => Math.max(m * .16, l.length * fs * 1.2 + m * .06));
    const total = th + m * .08 + rowH.reduce((a, b) => a + b, 0);
    let y = Math.max(M, (H - total) / 2);
    drawLines(ctx, L, tf, M, y, cw, 'display', 'left', wordIn(t, 0, .06)); y += th + m * .08;
    const r = m * .04, x = M + r;
    const lineK = ease.inOut(pr(t, .4, per * n));
    const y0 = y + r, y1 = y + rowH.slice(0, -1).reduce((a, b) => a + b, 0) + r;
    ctx.strokeStyle = L.line; ctx.lineWidth = m * .006; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.strokeStyle = L.a1; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, lerp(y0, y1, lineK)); ctx.stroke();
    wrapped.forEach((lines, i) => {
      const k = pr(t, .4 + i * per, .4), e = ease.back(k);
      ctx.fillStyle = k > 0 ? L.a1 : L.bg; ctx.strokeStyle = L.a1; ctx.lineWidth = m * .005;
      ctx.beginPath(); ctx.arc(x, y + r, r * Math.max(.4, e), 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = L.onA; ctx.font = F(L, 'mono', m * .034); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (k > 0) ctx.fillText(String(i + 1), x, y + r + 1);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = ease.out(k);
      ctx.font = F(L, 'body', fs); ctx.fillStyle = L.ink;
      lines.forEach((ln, j) => ctx.fillText(ln, x + r + m * .05, y + r + fs * .35 + j * fs * 1.2 + (1 - ease.out(k)) * 16));
      ctx.globalAlpha = 1; y += rowH[i];
    });
  } else {
    drawLines(ctx, L, tf, M, M * 1.2, cw, 'display', 'center', wordIn(t, 0, .06));
    const cy = H * .52, r = m * .05, gapX = cw / n, fs = m * .04;
    const lineK = ease.inOut(pr(t, .4, per * n));
    ctx.strokeStyle = L.line; ctx.lineWidth = m * .006; ctx.beginPath(); ctx.moveTo(M + gapX / 2, cy); ctx.lineTo(M + cw - gapX / 2, cy); ctx.stroke();
    ctx.strokeStyle = L.a1; ctx.beginPath(); ctx.moveTo(M + gapX / 2, cy); ctx.lineTo(lerp(M + gapX / 2, M + cw - gapX / 2, lineK), cy); ctx.stroke();
    steps.forEach((s, i) => {
      const cx = M + gapX * (i + .5), k = pr(t, .4 + i * per, .4), e = ease.back(k);
      ctx.fillStyle = k > 0 ? L.a1 : L.bg; ctx.strokeStyle = L.a1; ctx.lineWidth = m * .005;
      ctx.beginPath(); ctx.arc(cx, cy, r * Math.max(.4, e), 0, 7); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = L.onA; ctx.font = F(L, 'mono', m * .04);
      if (k > 0) ctx.fillText(String(i + 1), cx, cy + 1);
      ctx.globalAlpha = ease.out(k); ctx.fillStyle = L.ink; ctx.font = F(L, 'body', fs); ctx.textBaseline = 'top';
      wrapPlain(ctx, s, gapX * .9).forEach((ln, j) => ctx.fillText(ln, cx, cy + r + m * .05 + j * fs * 1.2));
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    });
  }
};

DRAW.chart = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2, bars = (p.bars || []).slice(0, 7), n = bars.length || 1;
  const tf = fitText(ctx, L, 'display', p.title || '', cw, m * .08, m * .045, 2), th = tf.lines.length * tf.lines[0].h;
  const max = Math.max(1, ...bars.map(b => Number(b.value) || 0));
  const fs = m * .04, bh = Math.min(m * .1, (H * .55) / n * .62), gap = bh * .7;
  const total = th + m * .09 + n * (bh + gap + fs * 1.4);
  let y = Math.max(M, (H - total) / 2);
  drawLines(ctx, L, tf, M, y, cw, 'display', 'left', wordIn(t, 0, .06)); y += th + m * .09;
  const best = bars.reduce((bi, b, i) => (Number(b.value) > Number(bars[bi]?.value) ? i : bi), 0);
  bars.forEach((b, i) => {
    const k = ease.out(pr(t, .5 + i * .22, 1.1)), v = Number(b.value) || 0;
    ctx.font = F(L, 'body', fs); ctx.fillStyle = L.muted; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = Math.min(1, k * 2);
    ctx.fillText(b.label, M, y + fs);
    const by = y + fs * 1.4, bw = (cw * .82) * (v / max) * k;
    rr(ctx, M, by, Math.max(bh * .2, bw), bh, bh * .18);
    ctx.fillStyle = i === best ? grad(ctx, L, M, 0, M + cw, 0) : L.a1 + '40'; ctx.fill();
    if (i !== best) { ctx.strokeStyle = L.a1 + '80'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.font = F(L, 'mono', fs * 1.05); ctx.fillStyle = L.ink; ctx.textBaseline = 'middle';
    ctx.fillText(`${fmtNum(v * k, v % 1 ? 1 : 0)}${p.unit ? ' ' + p.unit : ''}`, M + Math.max(bh * .2, bw) + m * .025, by + bh / 2);
    ctx.globalAlpha = 1; y += fs * 1.4 + bh + gap;
  });
};

DRAW.quote = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .1, cw = W - M * 2;
  const fit = fitText(ctx, L, 'display', p.quote || '', cw, m * .085, m * .04, 7, H * .55, 1.18);
  const h = fit.lines.length * fit.lines[0].h, y = (H - h) / 2;
  const qk = ease.back(pr(t, 0, .5));
  ctx.save(); ctx.globalAlpha = .9 * pr(t, 0, .3); ctx.fillStyle = L.a1; ctx.font = F(L, 'display', m * .35 * qk);
  ctx.textBaseline = 'alphabetic'; ctx.fillText('“', M - m * .02, y + m * .12); ctx.restore();
  const nW = fit.lines.reduce((a, l) => a + l.toks.length, 0), per = Math.min(.12, (d * .55) / Math.max(1, nW));
  drawLines(ctx, L, fit, M, y + m * .03, cw, 'display', 'left', i => { const k = pr(t, .35 + i * per, .25); return { a: ease.out(k), dy: (1 - ease.out(k)) * 10 }; });
  const ak = ease.out(pr(t, .4 + nW * per, .5));
  ctx.globalAlpha = ak; ctx.fillStyle = L.a1; ctx.fillRect(M, y + h + m * .09, m * .06 * ak, m * .006);
  ctx.font = F(L, 'mono', m * .034); ctx.fillStyle = L.muted; ctx.textBaseline = 'middle';
  ctx.fillText(String(p.author || '').toUpperCase(), M + m * .085, y + h + m * .093); ctx.globalAlpha = 1;
};

DRAW.definition = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const tf = fitText(ctx, L, 'display', p.term || '', cw, m * .15, m * .06, 2);
  const th = tf.lines.length * tf.lines[0].h, fs = m * .048;
  ctx.font = F(L, 'body', fs); const full = String(p.text || '');
  const lines = wrapPlain(ctx, full, cw);
  const y = (H - (th + m * .14 + lines.length * fs * 1.3)) / 2;
  drawLines(ctx, L, tf, M, y, cw, 'display', 'left', i => { const k = pr(t, i * .1, .5); return { a: ease.out(k), dy: (1 - ease.out(k)) * 30 }; });
  const kk = ease.out(pr(t, .4, .4)); ctx.globalAlpha = kk;
  ctx.font = `italic ${F(L, 'body', m * .036)}`; ctx.fillStyle = L.a1; ctx.textBaseline = 'alphabetic';
  ctx.fillText(p.kind ? `(${p.kind})` : '', M, y + th + m * .055); ctx.globalAlpha = 1;
  const chars = Math.floor(clamp((t - .7) / Math.max(.8, d * .55)) * full.length);
  let left = chars; ctx.font = F(L, 'body', fs); ctx.fillStyle = L.ink;
  lines.forEach((ln, i) => {
    const show = ln.slice(0, Math.max(0, left)); left -= ln.length + 1;
    ctx.fillText(show, M, y + th + m * .14 + i * fs * 1.3);
    if (left < 0 && left > -ln.length - 2 && Math.floor(t * 2.5) % 2 === 0) { const w = ctx.measureText(show).width; ctx.fillStyle = L.a1; ctx.fillRect(M + w + 4, y + th + m * .14 + i * fs * 1.3 - fs * .8, fs * .08, fs * .95); ctx.fillStyle = L.ink; }
  });
};

DRAW.chat = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .08, cw = Math.min(W - M * 2, m * 1.1), x0 = (W - cw) / 2;
  const msgs = (p.messages || []).slice(0, 6), fs = m * .042, pad = fs * .75;
  const tf = fitText(ctx, L, 'display', p.title || '', cw, m * .075, m * .04, 2), th = tf.lines.length * tf.lines[0].h;
  ctx.font = F(L, 'body', fs);
  const laid = msgs.map(mm => { const lines = wrapPlain(ctx, mm.text, cw * .68 - pad * 2); const w = Math.max(...lines.map(l => ctx.measureText(l).width), fs * 2); return { ...mm, lines, w: w + pad * 2, h: lines.length * fs * 1.25 + pad * 1.5 }; });
  const total = th + m * .06 + laid.reduce((a, b) => a + b.h + fs * .6, 0);
  let y = Math.max(M, (H - total) / 2);
  drawLines(ctx, L, tf, x0, y, cw, 'display', 'left', wordIn(t, 0, .06)); y += th + m * .06;
  const per = Math.max(.7, (d - 1.2) / Math.max(1, laid.length));
  laid.forEach((mm, i) => {
    const st = .5 + i * per, typing = t > st - .45 && t < st, k = ease.back(pr(t, st, .35));
    const right = mm.from === 'b', bx = right ? x0 + cw - mm.w : x0;
    if (typing) {
      rr(ctx, bx, y, fs * 3, fs * 1.6, fs * .8); ctx.fillStyle = right ? L.a1 : L.surface; ctx.fill();
      for (let j = 0; j < 3; j++) { ctx.fillStyle = right ? L.onA : L.muted; ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 6 + j)); ctx.beginPath(); ctx.arc(bx + fs * (.8 + j * .7), y + fs * .8, fs * .14, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (k > 0) {
      ctx.save(); ctx.translate(right ? bx + mm.w : bx, y + mm.h); ctx.scale(k, k); ctx.translate(-(right ? mm.w : 0), -mm.h);
      rr(ctx, 0, 0, mm.w, mm.h, fs * .7); ctx.fillStyle = right ? L.a1 : L.surface; ctx.fill();
      if (!right) { ctx.strokeStyle = L.line; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = right ? L.onA : L.ink; ctx.font = F(L, 'body', fs); ctx.textBaseline = 'top';
      mm.lines.forEach((ln, j) => ctx.fillText(ln, pad, pad * .75 + j * fs * 1.25));
      ctx.restore();
    }
    y += mm.h + fs * .6;
  });
};

DRAW.cta = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), M = m * .09, cw = W - M * 2;
  const fit = fitText(ctx, L, 'display', p.title || '', cw, m * .12, m * .05, 4, H * .4);
  const h = fit.lines.length * fit.lines[0].h, y = H * .42 - h / 2;
  drawLines(ctx, L, fit, M, y, cw, 'display', 'center', wordIn(t, 0, .08, .5, 50));
  const bk = ease.back(pr(t, .6, .5)); const pulse = 1 + .03 * Math.sin(Math.max(0, t - 1.2) * 5);
  ctx.font = F(L, 'bold', m * .048); const label = p.action || 'Saiba mais'; const bw = ctx.measureText(label).width + m * .14, bh = m * .11;
  ctx.save(); ctx.translate(W / 2, y + h + m * .14); ctx.scale(bk * pulse, bk * pulse);
  rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fillStyle = grad(ctx, L, -bw / 2, 0, bw / 2, 0); ctx.fill();
  ctx.fillStyle = L.onA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 2); ctx.restore();
  const hk = ease.out(pr(t, 1, .5)); ctx.globalAlpha = hk; ctx.font = F(L, 'mono', m * .036); ctx.fillStyle = L.muted;
  ctx.textAlign = 'center'; ctx.fillText(p.handle || '', W / 2, y + h + m * .29); ctx.globalAlpha = 1; ctx.textAlign = 'left';
};

/* ---------- transition: accent wipe at each scene start ---------- */
function drawWipe(ctx, L, W, H, local) {
  const k = pr(local, 0, .42); if (k >= 1) return;
  const e = ease.inOut(k); ctx.fillStyle = grad(ctx, L, 0, 0, W, H);
  ctx.save(); ctx.beginPath();
  const x0 = lerp(-W * .2, W * 1.2, e), sk = W * .25;
  ctx.moveTo(x0 - sk, 0); ctx.lineTo(x0 + W * .18, 0); ctx.lineTo(x0 + W * .18 - sk * .5, H); ctx.lineTo(x0 - sk * 1.5, H); ctx.closePath();
  ctx.globalAlpha = 1 - e * .3; ctx.fill(); ctx.restore();
}

/* ---------- chrome: chapter counter + title (designed frame) ---------- */
function drawChrome(ctx, L, W, H, P, loc, total) {
  const m = Math.min(W, H), M = m * .055;
  ctx.save(); ctx.font = F(L, 'mono', m * .024); ctx.fillStyle = L.muted; ctx.globalAlpha = .85; ctx.textBaseline = 'top';
  const n = P.scenes.length;
  ctx.fillText(`${String(loc.index + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`, M, M);
  ctx.textAlign = 'right'; const ttl = (P.title || '').toUpperCase().slice(0, 32); ctx.fillText(ttl, W - M, M);
  ctx.restore();
}
function drawProgress(ctx, L, W, H, t, total) {
  const m = Math.min(W, H); ctx.fillStyle = L.line; ctx.fillRect(0, 0, W, m * .008);
  ctx.fillStyle = grad(ctx, L, 0, 0, W, 0); ctx.fillRect(0, 0, W * clamp(t / Math.max(.01, total)), m * .008);
}

/* ---------- footage: video frame placement ---------- */
function drawVideoFrame(ctx, video, W, H, fit, zoom) {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); return; }
  const cover = Math.max(W / vw, H / vh), contain = Math.min(W / vw, H / vh);
  if (fit === 'blur') {
    ctx.save(); ctx.filter = 'blur(40px) brightness(.55)';
    ctx.drawImage(video, (W - vw * cover * 1.1) / 2, (H - vh * cover * 1.1) / 2, vw * cover * 1.1, vh * cover * 1.1); ctx.restore();
  }
  const s = (fit === 'blur' ? contain : cover) * zoom;
  ctx.drawImage(video, (W - vw * s) / 2, (H - vh * s) / 2 - (zoom - 1) * H * .05, vw * s, vh * s);
}

/* ---------- footage overlays ---------- */
const OVL = {};
OVL.headline = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), cw = W - m * .16;
  const fit = fitText(ctx, L, 'display', p.text || '', cw - m * .08, m * .075, m * .04, 3);
  const h = fit.lines.length * fit.lines[0].h + m * .06;
  const k = ease.back(pr(t, 0, .4)) * outro(t, d);
  ctx.save(); ctx.translate(W / 2, H * .12 + h / 2); ctx.scale(k, k); ctx.translate(-W / 2, -(H * .12 + h / 2));
  rr(ctx, (W - cw) / 2, H * .12, cw, h, m * .03); ctx.fillStyle = 'rgba(8,8,12,.78)'; ctx.fill();
  drawLines(ctx, { ...L, ink: '#fff' }, fit, (W - cw) / 2 + m * .04, H * .12 + m * .03, cw - m * .08, 'display', 'center', null, { ink: '#ffffff', acc: L.a1 });
  ctx.restore();
};
OVL.lower = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), x = m * .07, y = H * (H > W ? .62 : .72);
  const k = ease.out(pr(t, 0, .5)) * outro(t, d);
  ctx.font = F(L, 'bold', m * .05); const w1 = ctx.measureText(p.name || '').width;
  ctx.font = F(L, 'body', m * .033); const w2 = ctx.measureText(p.role || '').width;
  const bw = Math.max(w1, w2) + m * .1;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y - m * .02, bw * k + m * .02, m * .2); ctx.clip();
  ctx.fillStyle = L.a1; ctx.fillRect(x, y, m * .012, m * .15);
  rr(ctx, x + m * .02, y, bw, m * .15, m * .012); ctx.fillStyle = 'rgba(8,8,12,.82)'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = F(L, 'bold', m * .05); ctx.textBaseline = 'top'; ctx.fillText(p.name || '', x + m * .06, y + m * .022);
  ctx.fillStyle = L.a1; ctx.font = F(L, 'body', m * .033); ctx.fillText(p.role || '', x + m * .06, y + m * .088);
  ctx.restore();
};
OVL.stat = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), v = Number(p.value) || 0, k = ease.expo(pr(t, .1, 1)), a = ease.back(pr(t, 0, .4)) * outro(t, d);
  const txt = `${p.prefix || ''}${fmtNum(v * k, v % 1 ? 1 : 0)}${p.suffix || ''}`;
  ctx.font = F(L, 'display', m * .13); const w = Math.max(ctx.measureText(`${p.prefix || ''}${fmtNum(v)}${p.suffix || ''}`).width, m * .3) + m * .1;
  const x = W - w - m * .07, y = H * .2, h = m * .26;
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(a, a); ctx.translate(-(x + w / 2), -(y + h / 2));
  rr(ctx, x, y, w, h, m * .03); ctx.fillStyle = L.a1; ctx.fill();
  ctx.fillStyle = L.onA; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(txt, x + w / 2, y + m * .15);
  ctx.font = F(L, 'bold', m * .032); ctx.fillText(String(p.label || '').toUpperCase(), x + w / 2, y + m * .215); ctx.restore();
};
OVL.bullets = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), w = Math.min(W * .78, m * .8), x = (W - w) / 2, fs = m * .042, items = (p.items || []).slice(0, 5);
  const h = m * .1 + items.length * fs * 1.6 + m * .04, y = H * .14;
  const k = ease.out(pr(t, 0, .4)) * outro(t, d);
  ctx.save(); ctx.globalAlpha = k; rr(ctx, x, y, w, h, m * .03); ctx.fillStyle = 'rgba(8,8,12,.82)'; ctx.fill();
  ctx.font = F(L, 'mono', m * .03); ctx.fillStyle = L.a1; ctx.textBaseline = 'top'; ctx.fillText(String(p.title || '').toUpperCase(), x + m * .045, y + m * .04);
  ctx.font = F(L, 'body', fs); ctx.fillStyle = '#fff';
  items.forEach((it, i) => { const kk = ease.out(pr(t, .3 + i * .35, .35)); ctx.globalAlpha = k * kk; ctx.fillStyle = L.a1; ctx.fillRect(x + m * .045, y + m * .1 + i * fs * 1.6 + fs * .4, fs * .35, fs * .35); ctx.fillStyle = '#fff'; ctx.fillText(wrapPlain(ctx, it, w - m * .15)[0] || '', x + m * .045 + fs * .8, y + m * .1 + i * fs * 1.6); });
  ctx.restore();
};

/* ---------- captions ---------- */
function captionGroups(words, n) {
  const groups = []; let cur = [];
  for (const w of words) {
    const last = cur[cur.length - 1];
    if (cur.length && (cur.length >= n || w.t0 - last.t1 > .6 || /[.!?]$/.test(last.text))) { groups.push(cur); cur = []; }
    cur.push(w);
  }
  if (cur.length) groups.push(cur);
  return groups.map(g => ({ words: g, t0: g[0].t0, t1: g[g.length - 1].t1 }));
}
let CAP_CACHE = { key: '', groups: [] };
function drawCaptions(ctx, L, W, H, P, t) {
  const C = P.captions; if (!C.on) return;
  const words = timelineWords(P); if (!words.length) return;
  const n = C.preset === 'big' ? 1 : C.words;
  const key = `${words.length}|${n}|${words[0]?.t0}|${words[words.length - 1]?.t1}|${P.cuts.length}`;
  if (CAP_CACHE.key !== key) CAP_CACHE = { key, groups: captionGroups(words, n) };
  const g = CAP_CACHE.groups.find(g => t >= g.t0 - .05 && t <= g.t1 + .25);
  if (!g) return;
  const m = Math.min(W, H), acc = C.accent || L.a1, y = H * C.pos, maxW = W * .86;
  const up = s => (C.upper || C.preset === 'pop' || C.preset === 'big' || C.preset === 'doc') ? s.toUpperCase() : s;
  const active = g.words.findIndex(w => t >= w.t0 && t < w.t1 + .05);
  const popIn = ease.back(pr(t, g.t0, .18));
  ctx.save(); ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (C.preset === 'big') {
    const w = g.words[0]; const s = m * .14; ctx.font = `900 ${s}px "Poppins", ${FALLBACK}`;
    let size = s; while (ctx.measureText(up(w.text)).width > maxW && size > m * .05) { size *= .92; ctx.font = `900 ${size}px "Poppins", ${FALLBACK}`; }
    ctx.translate(W / 2, y); ctx.scale(popIn, popIn); ctx.textAlign = 'center';
    ctx.lineWidth = size * .16; ctx.strokeStyle = '#000'; ctx.strokeText(up(w.text), 0, 0);
    ctx.fillStyle = acc; ctx.fillText(up(w.text), 0, 0); ctx.restore(); return;
  }
  if (C.preset === 'toon') {
    const items = g.words.map(w => ({ ...w, s: w.text.replace(/\*/g, '').toUpperCase() }));
    let size = m * .078; ctx.font = `900 ${size}px "Poppins", ${FALLBACK}`; const spc = () => ctx.measureText(' ').width;
    const width = () => items.reduce((a, it) => a + ctx.measureText(it.s).width, 0) + spc() * (items.length - 1);
    while (width() > maxW && size > m * .04) { size *= .93; ctx.font = `900 ${size}px "Poppins", ${FALLBACK}`; }
    const tw = width(); let x = (W - tw) / 2; const sc = lerp(.82, 1, popIn);
    ctx.translate(W / 2, y); ctx.scale(sc, sc); ctx.translate(-W / 2, -y); ctx.textAlign = 'left';
    items.forEach((it, i) => {
      const raw = it.text, first = i === 0 && g.words === CAP_CACHE.groups[0]?.words;
      const col = /\*/.test(raw) ? '#ff4b4b' : /\d|R\$|%/.test(raw) ? '#ffd23f' : (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+/.test(raw) && i > 0) ? '#7cc7ff' : (C.accent && i === active ? C.accent : '#ffffff');
      const w = ctx.measureText(it.s).width;
      ctx.lineWidth = size * .24; ctx.strokeStyle = '#111'; ctx.strokeText(it.s, x, y + size * .06); ctx.strokeText(it.s, x, y);
      ctx.fillStyle = col; ctx.fillText(it.s, x, y); x += w + spc();
    });
    ctx.restore(); return;
  }
  const size = C.preset === 'minimal' ? m * .042 : C.preset === 'doc' ? m * .095 : C.preset === 'news' ? m * .072 : m * .062;
  const fam = C.preset === 'minimal' ? `600 ${size}px "Instrument Sans", ${FALLBACK}` : C.preset === 'doc' ? `400 ${size}px "Anton", "Big Shoulders Display", Impact, sans-serif` : C.preset === 'news' ? `700 ${size}px "Instrument Sans", "Inter", ${FALLBACK}` : `800 ${size}px "Poppins", ${FALLBACK}`;
  ctx.font = fam; const sp = ctx.measureText(' ').width;
  const items = g.words.map(w => ({ ...w, s: up(w.text), w: ctx.measureText(up(w.text)).width }));
  /* wrap into lines */
  const lines = [[]]; let lw = 0;
  for (const it of items) { if (lw > 0 && lw + it.w > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push(it); lw += it.w + sp; }
  const lh = size * (C.preset === 'doc' ? 1.08 : 1.28), totalH = lines.length * lh;
  ctx.translate(W / 2, y); const sc = C.preset === 'minimal' || C.preset === 'news' ? 1 : lerp(.85, 1, popIn); ctx.scale(sc, sc); ctx.translate(-W / 2, -y);
  let wi = 0;
  lines.forEach((ln, li) => {
    const w = ln.reduce((a, it) => a + it.w, 0) + sp * (ln.length - 1); let x = (W - w) / 2; const cy = y - totalH / 2 + lh * (li + .5);
    if (C.preset === 'box') { const pad = size * .35; rr(ctx, x - pad, cy - lh / 2 - pad * .2, w + pad * 2, lh + pad * .4, size * .25); ctx.fillStyle = 'rgba(10,10,14,.86)'; ctx.fill(); }
    if (C.preset === 'minimal') { ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = size * .4; }
    for (const it of ln) {
      const isAct = wi === active, spoken = t >= it.t0;
      if (C.preset === 'box' && isAct) { rr(ctx, x - size * .12, cy - lh * .42, it.w + size * .24, lh * .84, size * .18); ctx.fillStyle = acc; ctx.fill(); }
      if (C.preset === 'pop') { ctx.lineWidth = size * .2; ctx.strokeStyle = '#000'; ctx.save(); if (isAct) { ctx.translate(x + it.w / 2, cy); ctx.scale(1.12, 1.12); ctx.translate(-(x + it.w / 2), -cy); } ctx.strokeText(it.s, x, cy); ctx.fillStyle = isAct ? acc : '#fff'; ctx.fillText(it.s, x, cy); ctx.restore(); }
      else if (C.preset === 'box') { ctx.fillStyle = isAct ? '#0b0b0f' : '#fff'; ctx.fillText(it.s, x, cy); }
      else if (C.preset === 'doc') { const gg = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2); gg.addColorStop(0, '#ffffff'); gg.addColorStop(1, '#b9b9bd'); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = size * .25; ctx.fillStyle = isAct ? (C.accent || DOC_RED) : gg; ctx.fillText(it.s, x, cy); ctx.shadowBlur = 0; }
      else if (C.preset === 'news') { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = size * .3; ctx.fillStyle = spoken ? '#f3f1ec' : 'rgba(243,241,236,.55)'; ctx.fillText(it.s, x, cy); ctx.shadowBlur = 0; }
      else if (C.preset === 'karaoke') { ctx.lineWidth = size * .14; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(it.s, x, cy); ctx.fillStyle = spoken ? (isAct ? acc : '#fff') : 'rgba(255,255,255,.45)'; ctx.fillText(it.s, x, cy); }
      else { ctx.fillStyle = '#fff'; ctx.fillText(it.s, x, cy); }
      x += it.w + sp; wi++;
    }
    ctx.shadowBlur = 0;
  });
  ctx.restore();
}

/* ---------- master frame ---------- */
function drawFrame(ctx, P, t, opts = {}) {
  const [W, H] = ASPECTS[P.aspect]; const L = look(P);
  ctx.save(); S.__drawP = P;
  const loc = locate(P, t);
  if (!loc) { drawBackground(ctx, L, W, H, t); ctx.restore(); return; }
  const s = loc.scene, total = opts.total ?? projectDuration(P);
  if (s.kind === 'clip') {
    const video = opts.video || S.video;
    const z = s.zoom ? (s.zoom === 2 ? 1.18 : lerp(1, 1.12, ease.inOut(clamp(loc.local / Math.max(1, loc.dur))))) : 1;
    if (video) drawVideoFrame(ctx, video, W, H, P.fit, z); else drawBackground(ctx, L, W, H, t);
    const o = s.overlay;
    if (o && o.kind) {
      const ot = loc.local - (o.at || 0), od = Math.min(o.dur || 3.5, loc.dur - (o.at || 0));
      if (ot >= 0 && ot <= od) {
        if (o.kind === 'broll' && DRAW[o.p?.kind]) {
          drawBackground(ctx, L, W, H, t); DRAW[o.p.kind](ctx, L, W, H, ot, od, o.p); drawWipe(ctx, L, W, H, ot);
        } else if (OVL[o.kind]) OVL[o.kind](ctx, L, W, H, ot, od, o.p || {});
      }
    }
  } else {
    drawBackground(ctx, L, W, H, t);
    const fn = DRAW[s.kind] || DRAW.title;
    const flat = s.kind === 'story' || s.kind === 'talk' || s.kind === 'obj' || s.kind === 'doc' || s.kind === 'photo';
    const out = flat ? 1 : outro(loc.local, loc.dur);
    ctx.save(); ctx.globalAlpha = out; ctx.translate(0, (1 - out) * -Math.min(W, H) * .03);
    if (flat && loc.index > 0 && loc.local < .26) { const e = ease.out(clamp(loc.local / .26)), sty = loc.index % 4; if (sty === 1 || sty === 3) ctx.translate((1 - e) * W * .28 * (sty === 1 ? 1 : -1), 0); else if (sty === 2) { ctx.translate(W / 2, H / 2); ctx.scale(1 + (1 - e) * .18, 1 + (1 - e) * .18); ctx.rotate((1 - e) * .03); ctx.translate(-W / 2, -H / 2); } }
    try { fn(ctx, L, W, H, loc.local, loc.dur, s.p || {}); } catch (e) { console.warn('scene draw', e); }
    ctx.restore();
    if (P.chrome && !flat) drawChrome(ctx, L, W, H, P, loc, total);
    if (loc.index > 0 && !flat) drawWipe(ctx, L, W, H, loc.local);
    if (loc.index === 0 && P.mode !== 'footage') { const f = 1 - clamp(loc.local / .18); if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${(f * .55).toFixed(3)})`; ctx.fillRect(0, 0, W, H); } }
    if (loc.index > 0 && flat) { const sty = loc.index % 4, f = 1 - clamp(loc.local / (sty === 0 ? .12 : .2)); if (f > 0) { if (sty === 0) { ctx.fillStyle = `rgba(255,255,255,${(f * .35).toFixed(3)})`; ctx.fillRect(0, 0, W, H); } else if (sty !== 2) { ctx.save(); ctx.globalAlpha = f * .7; ctx.fillStyle = '#fff'; const r = seeded(loc.index); for (let i = 0; i < 14; i++) ctx.fillRect(0, r() * H, W, Math.max(2, H * .004)); ctx.restore(); } else { ctx.fillStyle = `rgba(0,0,0,${(f * .25).toFixed(3)})`; ctx.fillRect(0, 0, W, H); } } }
  }
  drawCaptions(ctx, L, W, H, P, t);
  if (P.progressBar) drawProgress(ctx, L, W, H, t, total);
  ctx.restore();
}

/* thumbnail for a single scene at local time */
function drawSceneThumb(canvas, P, idx, local) {
  const [W, H] = ASPECTS[P.aspect]; const q = canvas.width / W;
  const ctx = canvas.getContext('2d'); ctx.setTransform(q, 0, 0, q, 0, 0);
  const t = sceneStart(P, idx) + local;
  drawFrame(ctx, P, t);
}

/* ============ DOC: documentary infographic scenes + real photo scenes ============ */
const ASSETS = new Map(); /* id -> {name, img} (session only) */
const DOC_FONT = '"Anton", "Big Shoulders Display", Impact, "Arial Narrow", sans-serif';
const DOC_ITEM_TYPES = ['calendar', 'screen', 'lock', 'people', 'card', 'stat', 'photo', 'icon'];
const DOC_SYMBOLS = ['R$', 'phone', 'doc', 'house', 'card', 'mail', 'car', 'law'];
const DOC_ICONS = ['money', 'law', 'doc', 'alert', 'chart', 'house', 'phone', 'clock', 'gavel', 'globe', 'user'];
const DOC_SHOWS = ['debate', 'news', 'chart', 'crowd', 'person', 'map'];
const DOC_TONES = { amber: ['#f2b33d', '#3a2a10'], blue: ['#6d8cff', '#18213f'], red: ['#d9533f', '#3a1712'], gray: ['#b8bcc4', '#24272d'] };
const DOC_RED = '#cf4e3c';

function docFont(size, w = 400) { return `${w} ${Math.round(size)}px ${DOC_FONT}`; }
function monoFont(size, w = 600) { return `${w} ${Math.round(size)}px "JetBrains Mono", ui-monospace, monospace`; }
function sansFont(size, w = 700) { return `${w} ${Math.round(size)}px "Instrument Sans", "Inter", system-ui, sans-serif`; }
function spaced(ctx, text, x, y, sp) { let cx = x; for (const ch of String(text)) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } return cx - x; }
function spacedW(ctx, text, sp) { let w = 0; for (const ch of String(text)) w += ctx.measureText(ch).width + sp; return w - sp; }

/* ---------- backgrounds ---------- */
function docBackground(ctx, W, H, bg, t) {
  const m = Math.min(W, H);
  if (bg === 'night') {
    ctx.fillStyle = '#0a0c13'; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r, c] of [[.5, .14, .55, 'rgba(242,170,60,.22)'], [.42, .62, .5, 'rgba(242,160,50,.16)'], [.86, .36, .45, 'rgba(70,100,220,.22)']]) {
      const g = ctx.createRadialGradient(W * x + Math.sin(t * .3) * 10, H * y, 0, W * x, H * y, m * r * 1.6); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  } else {
    ctx.fillStyle = '#121316'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H * .42, 0, W / 2, H * .42, Math.max(W, H) * .6); g.addColorStop(0, 'rgba(70,72,78,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const step = W / (W > H ? 9.5 : 5.5);
    for (let x = step * .6; x < W; x += step) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, 0, 3, H * .8); ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(x + 3, 0, 1.5, H * .8); }
    const fy = H * .8; ctx.fillStyle = '#0b0c0e'; ctx.fillRect(0, fy, W, H - fy);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, fy, W, 2.5); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, fy + 2.5, W, 4);
  }
  ctx.save(); ctx.fillStyle = ctx.createPattern(noiseCanvas(), 'repeat'); ctx.globalAlpha = .9; ctx.fillRect(0, 0, W, H); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, m * .35, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

/* ---------- small vector icons (drawn inside a unit box centered at 0,0, size s) ---------- */
function docIcon(ctx, name, s, col) {
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * .08; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (name) {
    case 'money': ctx.beginPath(); ctx.arc(0, 0, s * .4, 0, 7); ctx.stroke(); ctx.font = `800 ${s * .5}px "Instrument Sans", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, s * .02); break;
    case 'law': case 'gavel': ctx.save(); ctx.rotate(-.6); ctx.fillRect(-s * .3, -s * .12, s * .6, s * .24); ctx.fillRect(-s * .04, 0, s * .08, s * .5); ctx.restore(); ctx.fillRect(-s * .35, s * .36, s * .5, s * .08); break;
    case 'doc': ctx.strokeRect(-s * .28, -s * .36, s * .56, s * .72); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-s * .16, -s * .16 + i * s * .16); ctx.lineTo(s * .16, -s * .16 + i * s * .16); ctx.stroke(); } break;
    case 'alert': ctx.beginPath(); ctx.moveTo(0, -s * .36); ctx.lineTo(s * .38, s * .3); ctx.lineTo(-s * .38, s * .3); ctx.closePath(); ctx.stroke(); ctx.fillRect(-s * .03, -s * .12, s * .06, s * .22); ctx.fillRect(-s * .03, s * .16, s * .06, s * .06); break;
    case 'chart': ctx.beginPath(); ctx.moveTo(-s * .38, s * .3); ctx.lineTo(-s * .12, 0); ctx.lineTo(s * .06, s * .12); ctx.lineTo(s * .36, -s * .28); ctx.stroke(); break;
    case 'house': ctx.beginPath(); ctx.moveTo(-s * .36, -s * .02); ctx.lineTo(0, -s * .36); ctx.lineTo(s * .36, -s * .02); ctx.stroke(); ctx.strokeRect(-s * .26, -s * .04, s * .52, s * .38); break;
    case 'phone': rr(ctx, -s * .2, -s * .38, s * .4, s * .76, s * .08); ctx.stroke(); ctx.fillRect(-s * .06, s * .26, s * .12, s * .04); break;
    case 'clock': ctx.beginPath(); ctx.arc(0, 0, s * .38, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * .22); ctx.moveTo(0, 0); ctx.lineTo(s * .16, s * .08); ctx.stroke(); break;
    case 'globe': ctx.beginPath(); ctx.arc(0, 0, s * .38, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, s * .16, s * .38, 0, 0, 7); ctx.moveTo(-s * .38, 0); ctx.lineTo(s * .38, 0); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.arc(0, -s * .14, s * .16, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, s * .26, s * .28, s * .18, 0, Math.PI, 0); ctx.fill();
  }
  ctx.restore();
}
function personIcon(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - s * .62, s * .26, 0, 7); ctx.fill(); rr(ctx, x - s * .32, y - s * .32, s * .64, s * .62, s * .2); ctx.fill(); }
function silhouette(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - s * .72, s * .2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - s * .2, y - s * .72, s * .04, s * .07, 0, 0, 7); ctx.ellipse(x + s * .2, y - s * .72, s * .04, s * .07, 0, 0, 7); ctx.fill(); rr(ctx, x - s * .3, y - s * .5, s * .6, s * .5, s * .14); ctx.fill(); }

/* ---------- photos ---------- */
function drawCover(ctx, img, x, y, w, h, z = 1, dx = 0, dy = 0) {
  const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight; if (!iw) return;
  const s = Math.max(w / iw, h / ih) * z; ctx.drawImage(img, x + (w - iw * s) / 2 + dx, y + (h - ih * s) / 2 + dy, iw * s, ih * s);
}
function photoSlot(ctx, x, y, w, h, want, r) {
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill(); ctx.setLineDash([10, 8]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = Math.max(14, Math.min(w, h) * .09); ctx.font = monoFont(fs * .9); ctx.fillText('FOTO', x + w / 2, y + h / 2 - fs * .9);
  ctx.font = sansFont(fs, 600); const lines = wrapPlain(ctx, want || 'envie uma imagem', w * .85).slice(0, 3);
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + h / 2 + fs * .5 + i * fs * 1.2)); ctx.restore();
}
function gradeImage(ctx, x, y, w, h, grade) {
  if (grade === 'bw') { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#888'; ctx.fillRect(x, y, w, h); ctx.restore(); }
  if (grade === 'warm') { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,160,60,.45)'; ctx.fillRect(x, y, w, h); ctx.restore(); }
  if (grade === 'doc') { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,.55)'; ctx.fillRect(x, y, w, h); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,60,80,.25)'; ctx.fillRect(x, y, w, h); ctx.restore(); }
}

/* ---------- items ---------- */
const DOC_ITEM = {};
DOC_ITEM.calendar = (ctx, it, x, y, w, h, k, t, A) => {
  const cw = Math.min(w, h * .9), ch = cw * 1.12, cx = x + (w - cw) / 2, cy = y + (h - ch) / 2, r = cw * .07;
  rr(ctx, cx, cy, cw, ch, r); ctx.fillStyle = '#d9d8d4'; ctx.fill();
  ctx.save(); rr(ctx, cx, cy, cw, ch, r); ctx.clip(); ctx.fillStyle = DOC_RED; ctx.fillRect(cx, cy, cw, ch * .28); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#efe9e4'; ctx.font = docFont(ch * .14); ctx.fillText(String(it.weekday || 'DOMINGO').toUpperCase(), cx + cw / 2, cy + ch * .145);
  const dn = String(it.day ?? '18'); const flip = ease.out(clamp((t - .15) / .4));
  ctx.fillStyle = '#121212'; ctx.font = docFont(ch * .46 * (.7 + .3 * flip)); ctx.fillText(dn, cx + cw / 2, cy + ch * .57);
  ctx.fillStyle = '#6a6a6a'; ctx.font = docFont(ch * .11); ctx.fillText(String(it.month || 'OUTUBRO').toUpperCase(), cx + cw / 2, cy + ch * .87);
};
DOC_ITEM.screen = (ctx, it, x, y, w, h, k, t, A) => {
  const sw = Math.min(w, h * 1.6), sh = sw / 1.6, sx = x + (w - sw) / 2, sy = y + (h - sh) / 2, b = sw * .03;
  rr(ctx, sx, sy, sw, sh, sw * .035); ctx.fillStyle = '#0d0e10'; ctx.fill();
  const ix = sx + b, iy = sy + b, iw = sw - b * 2, ih = sh - b * 2;
  ctx.save(); rr(ctx, ix, iy, iw, ih, sw * .02); ctx.clip();
  const g = ctx.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, '#3a3f4c'); g.addColorStop(1, '#262a33'); ctx.fillStyle = g; ctx.fillRect(ix, iy, iw, ih);
  const show = it.show || 'debate', base = iy + ih * .98;
  ctx.fillStyle = 'rgba(255,255,255,.05)';
  for (const px of [.2, .8]) { ctx.beginPath(); ctx.moveTo(ix + iw * px, iy + ih * .35); ctx.lineTo(ix + iw * (px - .18), base); ctx.lineTo(ix + iw * (px + .18), base); ctx.closePath(); ctx.fill(); }
  if (show === 'debate') for (const px of [.26, .74]) { silhouette(ctx, ix + iw * px, iy + ih * .73, ih * .42, '#121316'); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(ix + iw * (px - .08), iy + ih * .66, iw * .16, ih * .34); }
  if (show === 'person' || show === 'news') { silhouette(ctx, ix + iw * .5, iy + ih * .9, ih * .62, '#121316'); if (show === 'news') { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(ix + iw * .25, iy + ih * .78, iw * .5, ih * .22); } }
  if (show === 'crowd') for (let i = 0; i < 9; i++) silhouette(ctx, ix + iw * (.08 + i * .105), iy + ih * (1.02 - (i % 2) * .04), ih * .45, i % 2 ? '#15161a' : '#1c1d22');
  if (show === 'chart') { ctx.strokeStyle = DOC_RED; ctx.lineWidth = ih * .03; ctx.beginPath(); const pts = [.1, .3, .25, .5, .45, .4, .7, .75, .9]; const n = Math.floor(pts.length * clamp(t / 1.4)) + 1; pts.slice(0, n).forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](ix + iw * (.1 + i * .1), iy + ih * (.85 - v * .6))); ctx.stroke(); }
  if (show === 'map') { ctx.fillStyle = '#4a5468'; ctx.beginPath(); ctx.ellipse(ix + iw * .5, iy + ih * .5, iw * .22, ih * .32, .3, 0, 7); ctx.fill(); ctx.fillStyle = DOC_RED; ctx.beginPath(); ctx.arc(ix + iw * .55, iy + ih * .45, ih * .04 * (1 + .3 * Math.sin(t * 5)), 0, 7); ctx.fill(); }
  if (it.badge !== '') { const bw = iw * .17, bh = ih * .1; rr(ctx, ix + iw * .025, iy + ih * .04, bw, bh, bh * .12); ctx.fillStyle = DOC_RED; ctx.fill(); ctx.fillStyle = '#f2ece6'; ctx.font = docFont(bh * .62); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.badge || 'AO VIVO').toUpperCase(), ix + iw * .025 + bw / 2, iy + ih * .04 + bh / 2 + 1); }
  ctx.fillStyle = DOC_RED; ctx.globalAlpha = Math.floor(t * 1.6) % 2 ? .25 : .9; ctx.beginPath(); ctx.arc(ix + iw * .955, iy + ih * .085, ih * .018, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  if (it.caption) { const cw = iw * .5, chh = ih * .11; rr(ctx, ix + (iw - cw) / 2, iy + ih * .8, cw, chh, chh * .12); ctx.fillStyle = '#dedcd8'; ctx.fill(); ctx.fillStyle = '#121212'; ctx.font = docFont(chh * .62); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.caption).toUpperCase(), ix + iw / 2, iy + ih * .8 + chh / 2 + 1); }
  ctx.restore();
};
DOC_ITEM.lock = (ctx, it, x, y, w, h, k, t, A) => {
  const s = Math.min(w, h * .8), bx = x + (w - s) / 2, by = y + (h - s * 1.18) / 2;
  rr(ctx, bx, by, s, s, s * .08); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill();
  const sym = it.symbol || 'R$', cx = bx + s / 2, cy = by + s * .55;
  ctx.fillStyle = '#9b9ea6'; ctx.strokeStyle = '#9b9ea6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (sym === 'R$') { ctx.font = docFont(s * .42); ctx.fillText('R$', cx, cy); }
  else if (sym === 'phone') { rr(ctx, cx - s * .16, cy - s * .24, s * .32, s * .5, s * .04); ctx.fillStyle = '#c3c6cc'; ctx.fill(); ctx.fillStyle = '#2b3240'; rr(ctx, cx - s * .13, cy - s * .2, s * .26, s * .4, s * .03); ctx.fill(); }
  else ctx.save(), ctx.translate(cx, cy), docIcon(ctx, { doc: 'doc', house: 'house', card: 'money', mail: 'doc', car: 'chart', law: 'law' }[sym] || 'doc', s * .5, '#9b9ea6'), ctx.restore();
  if (it.locked !== false) {
    const drop = ease.back(clamp((t - .45) / .35)), ly = lerp(by - s * .5, by + s * .02, drop);
    ctx.save(); ctx.globalAlpha = clamp((t - .4) / .1); const lw = s * .36, lh = s * .3, lx = cx - lw / 2;
    ctx.strokeStyle = '#b14a3c'; ctx.lineWidth = s * .065; ctx.beginPath(); ctx.arc(cx, ly + lh * .02, lw * .32, Math.PI, 0); ctx.lineTo(cx + lw * .32, ly + lh * .4); ctx.moveTo(cx - lw * .32, ly + lh * .02); ctx.lineTo(cx - lw * .32, ly + lh * .4); ctx.stroke();
    rr(ctx, lx, ly + lh * .35, lw, lh, s * .03); ctx.fillStyle = '#b84d3d'; ctx.fill(); ctx.fillStyle = '#1a0c09'; ctx.beginPath(); ctx.arc(cx, ly + lh * .6, s * .03, 0, 7); ctx.fill(); ctx.fillRect(cx - s * .01, ly + lh * .6, s * .02, lh * .2);
    ctx.restore();
  }
  if (it.label) { ctx.fillStyle = '#d6d6d6'; ctx.font = docFont(s * .11); ctx.textAlign = 'center'; ctx.fillText(String(it.label).toUpperCase(), cx, by + s * 1.12); }
};
DOC_ITEM.people = (ctx, it, x, y, w, h, k, t, A) => {
  const n = clamp(Math.round(it.count || 3), 1, 4), s = Math.min(w / (n * .8 + .3), h * .55), cy = y + h * .58;
  for (let i = 0; i < n; i++) { const sc = 1 - i * .16, px = x + w / 2 + (i - (n - 1) / 2) * s * .72; personIcon(ctx, px, cy - (1 - sc) * s * .2, s * sc, '#8a8c91'); }
  if (it.label) { ctx.fillStyle = '#d6d6d6'; ctx.font = docFont(s * .22); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.label).toUpperCase(), x + w / 2, cy + s * .55); }
};
DOC_ITEM.icon = (ctx, it, x, y, w, h, k, t, A) => {
  const s = Math.min(w, h) * .6; ctx.save(); ctx.translate(x + w / 2, y + h * .42); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(0, 0, s * .6, 0, 7); ctx.fill(); docIcon(ctx, it.name || 'alert', s * .8, A); ctx.restore();
  if (it.label) { ctx.fillStyle = '#d6d6d6'; ctx.font = docFont(s * .2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.label).toUpperCase(), x + w / 2, y + h * .42 + s * .82); }
};
DOC_ITEM.stat = (ctx, it, x, y, w, h, k, t, A) => {
  const v = Number(it.value), isNum = Number.isFinite(v) && String(it.value).trim() !== '';
  const kk = ease.expo(clamp((t - .1) / 1)); const txt = isNum ? `${it.prefix || ''}${fmtNum(v * kk, v % 1 ? 1 : 0)}${it.suffix || ''}` : String(it.value);
  let size = h * .7; ctx.font = sansFont(size, 800); while (ctx.measureText(txt).width > w * .5 && size > 20) { size *= .92; ctx.font = sansFont(size, 800); }
  const lines = String(it.label || '').toUpperCase().split(/\n| (?=\S+$)/).slice(0, 2);
  ctx.font = monoFont(size * .16); const lw = Math.max(...lines.map(l => spacedW(ctx, l, size * .03)), 0);
  ctx.font = sansFont(size, 800); const nw = ctx.measureText(txt).width, tot = nw + size * .15 + lw, x0 = x + (w - tot) / 2;
  ctx.fillStyle = A; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(txt, x0, y + h / 2);
  ctx.fillStyle = '#e9e9ec'; ctx.font = monoFont(size * .16); lines.forEach((l, i) => spaced(ctx, l, x0 + nw + size * .15, y + h / 2 - size * .12 + i * size * .24, size * .03));
};
DOC_ITEM.card = (ctx, it, x, y, w, h, k, t, A) => {
  const [tc, tb] = DOC_TONES[it.tone] || DOC_TONES.amber, u = Math.min(w, h * .92), r = u * .05, tabW = w * .4, tabH = h * .07;
  ctx.save();
  rr(ctx, x + w * .04, y, tabW, tabH + r, r * .6); ctx.fillStyle = shade(tb, .1); ctx.fill();
  const g = ctx.createRadialGradient(x + w * .4, y + h * .35, 0, x + w * .5, y + h * .5, w); g.addColorStop(0, shade(tb, .25)); g.addColorStop(1, shade(tb, -.35));
  rr(ctx, x, y + tabH, w, h - tabH, r); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = tc + '66'; ctx.lineWidth = 2; ctx.stroke();
  const pad = u * .07; let cy = y + tabH + pad * .9; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const fs = u * .058; ctx.fillStyle = tc; ctx.font = monoFont(fs); spaced(ctx, String(it.kicker || '').toUpperCase(), x + pad, cy, fs * .12); cy += fs * 2;
  const ir = u * .14; const icx = x + pad + ir, icy = cy + ir;
  const img = it.img && ASSETS.get(it.img)?.img;
  ctx.save(); ctx.beginPath(); ctx.arc(icx, icy, ir, 0, 7); ctx.clip();
  if (img) { drawCover(ctx, img, icx - ir, icy - ir, ir * 2, ir * 2); } else { ctx.fillStyle = tc + '22'; ctx.fillRect(icx - ir, icy - ir, ir * 2, ir * 2); if (it.want) { ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = monoFont(ir * .28); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FOTO', icx, icy); } else { ctx.translate(icx, icy); docIcon(ctx, it.icon || 'money', ir * 1.1, tc); } }
  ctx.restore(); if (img) { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(icx, icy, ir, 0, 7); ctx.stroke(); }
  cy += ir * 2 + fs * .8;
  ctx.fillStyle = '#f2f2f4'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.font = sansFont(u * .085, 800);
  wrapPlain(ctx, it.title || '', w - pad * 2).slice(0, 2).forEach(l => { ctx.fillText(l, x + pad, cy); cy += u * .1; });
  ctx.fillStyle = 'rgba(232,232,236,.82)'; ctx.font = sansFont(u * .058, 500); cy += u * .01;
  wrapPlain(ctx, it.text || '', w - pad * 2).slice(0, 2).forEach(l => { ctx.fillText(l, x + pad, cy); cy += u * .074; });
  if (it.footer) { ctx.fillStyle = 'rgba(200,200,206,.6)'; ctx.font = monoFont(u * .045, 500); ctx.textBaseline = 'bottom'; spaced(ctx, String(it.footer).toUpperCase(), x + pad, y + h - pad * .7, u * .006); }
  ctx.restore();
};
DOC_ITEM.photo = (ctx, it, x, y, w, h, k, t, A) => {
  const img = it.img && ASSETS.get(it.img)?.img, r = Math.min(w, h) * .04;
  if (!img) { photoSlot(ctx, x, y, w, h * .86, it.want, r); }
  else { ctx.save(); rr(ctx, x, y, w, h * .86, r); ctx.clip(); drawCover(ctx, img, x, y, w, h * .86, 1 + .05 * clamp(t / 6)); gradeImage(ctx, x, y, w, h * .86, it.grade || 'doc'); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; rr(ctx, x, y, w, h * .86, r); ctx.stroke(); }
  if (it.label) { ctx.fillStyle = '#d6d6d6'; ctx.font = docFont(h * .08); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.label).toUpperCase(), x + w / 2, y + h * .94); }
};

/* ---------- the doc scene ---------- */
DRAW.doc = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), vertical = H > W * 1.2, night = p.bg === 'night', A = night ? '#f2b33d' : DOC_RED;
  const z = p.camera === 'still' ? 1 : lerp(1, 1.05, ease.inOut(clamp(t / Math.max(1, d))));
  docBackground(ctx, W, H, p.bg, t);
  ctx.save(); ctx.translate(W / 2, H * .45); ctx.scale(z, z); ctx.translate(-W / 2, -H * .45);
  /* kicker */
  if (p.kicker) { ctx.globalAlpha = ease.out(clamp(t / .4)); ctx.fillStyle = night ? '#5f7cff' : A; ctx.beginPath(); ctx.arc(m * .055, m * .055, m * .009, 0, 7); ctx.fill(); ctx.fillStyle = '#e9e9ec'; ctx.font = monoFont(m * .03); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; spaced(ctx, String(p.kicker).toUpperCase(), m * .08, m * .056, m * .004); ctx.globalAlpha = 1; }
  let top = vertical ? H * .09 : H * .1;
  if (p.big && (p.big.value ?? '') !== '') { const bh = vertical ? H * .12 : H * .2; ctx.save(); const kk = ease.back(clamp(t / .45)); ctx.translate(W / 2, top + bh / 2); ctx.scale(kk, kk); ctx.translate(-W / 2, -(top + bh / 2)); DOC_ITEM.stat(ctx, p.big, W * .1, top, W * .8, bh, kk, t, A); ctx.restore(); top += bh + m * .04; }
  const items = (p.items || []).slice(0, 4), n = items.length;
  const floor = H * .8, bottom = vertical ? H * (p.crowd ? .62 : .66) : H * (p.crowd ? .62 : .74);
  if (n) {
    const weight = it => (it.type === 'screen' ? 2 : 1);
    let rows;
    if (!vertical) rows = [items];
    else { rows = []; let cur = []; let wsum = 0; for (const it of items) { const wv = weight(it); if (wsum + wv > 2 && cur.length) { rows.push(cur); cur = []; wsum = 0; } cur.push(it); wsum += wv; } if (cur.length) rows.push(cur); }
    const gap = m * .045, areaH = bottom - top, rowH = Math.min((areaH - gap * (rows.length - 1)) / rows.length, vertical ? H * .3 : H * .55);
    const totalH = rows.length * rowH + (rows.length - 1) * gap; let ry = top + (areaH - totalH) / 2;
    let idx = 0;
    for (const row of rows) {
      const ws = row.reduce((a, it) => a + weight(it), 0), availW = W * (vertical ? .9 : .84) - gap * (row.length - 1), unit = availW / ws;
      let rx = (W - (availW + gap * (row.length - 1))) / 2;
      for (const it of row) {
        const iw = unit * weight(it), st = .15 + idx * .28, kk = ease.back(clamp((t - st) / .4)), lt = t - st;
        if (kk > 0) { ctx.save(); ctx.globalAlpha = clamp((t - st) / .2); ctx.translate(rx + iw / 2, ry + rowH / 2); ctx.scale(.85 + .15 * kk, .85 + .15 * kk); ctx.translate(-(rx + iw / 2), -(ry + rowH / 2)); try { (DOC_ITEM[it.type] || DOC_ITEM.icon)(ctx, it, rx, ry, iw, rowH, kk, lt, A); } catch (e) { console.warn(e); } ctx.restore(); }
        rx += iw + gap; idx++;
      }
      ry += rowH + gap;
    }
  }
  if (p.crowd) { const c = clamp(Math.round(p.crowd), 1, 16), s = Math.min(W * .8 / c / .82, m * .1); for (let i = 0; i < c; i++) { const kk = ease.out(clamp((t - .3 - i * .05) / .3)); if (kk <= 0) continue; ctx.globalAlpha = kk; personIcon(ctx, W / 2 + (i - (c - 1) / 2) * s * .82, floor - (vertical ? s * .35 : -s * .32) + (1 - kk) * 20, s, '#4a4c52'); } ctx.globalAlpha = 1; }
  if (p.source) { ctx.fillStyle = 'rgba(200,200,206,.55)'; ctx.font = monoFont(m * .022, 500); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; const sy = vertical ? H * .675 : H * .86; spaced(ctx, String(p.source).toUpperCase(), m * .045, sy, m * .003); }
  ctx.restore();
};

/* ---------- full-screen real photo ---------- */
DRAW.photo = (ctx, L, W, H, t, d, p) => {
  const m = Math.min(W, H), img = p.img && ASSETS.get(p.img)?.img, k = clamp(t / Math.max(1, d));
  ctx.fillStyle = '#0b0c0f'; ctx.fillRect(0, 0, W, H);
  if (img) {
    const mv = p.move || 'in'; const z = mv === 'out' ? lerp(1.18, 1.04, ease.inOut(k)) : lerp(1.04, 1.18, ease.inOut(k));
    const dx = mv === 'left' ? lerp(W * .04, -W * .04, k) : mv === 'right' ? lerp(-W * .04, W * .04, k) : 0;
    drawCover(ctx, img, 0, 0, W, H, mv === 'left' || mv === 'right' ? 1.12 : z, dx, 0);
    gradeImage(ctx, 0, 0, W, H, p.grade || 'doc');
  } else photoSlot(ctx, W * .08, H * .12, W * .84, H * .6, p.want, m * .03);
  const v = ctx.createLinearGradient(0, H * .45, 0, H); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.fillStyle = ctx.createPattern(noiseCanvas(), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  if (p.kicker) { ctx.fillStyle = DOC_RED; ctx.beginPath(); ctx.arc(m * .055, m * .055, m * .009, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = monoFont(m * .03); ctx.textBaseline = 'middle'; spaced(ctx, String(p.kicker).toUpperCase(), m * .08, m * .056, m * .004); }
  if (p.label) { const fs = m * .06; ctx.font = docFont(fs); const tw = ctx.measureText(String(p.label).toUpperCase()).width; const lk = ease.out(clamp((t - .3) / .4)); ctx.save(); ctx.beginPath(); ctx.rect(m * .05, H * .6 - fs, (tw + fs) * lk, fs * 1.6); ctx.clip(); ctx.fillStyle = DOC_RED; ctx.fillRect(m * .05, H * .6 - fs * .85, fs * .18, fs * 1.3); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(String(p.label).toUpperCase(), m * .05 + fs * .4, H * .6 - fs * .2); ctx.restore(); }
  if (p.source) { ctx.fillStyle = 'rgba(230,230,234,.6)'; ctx.font = monoFont(m * .02, 500); ctx.textBaseline = 'middle'; spaced(ctx, String(p.source).toUpperCase(), m * .05, H * .64, m * .003); }
};

/* ---------- normalization ---------- */
function normDoc(p) {
  const pick = (v, list, d) => (list.includes(v) ? v : d), S = (v, n) => String(v ?? '').slice(0, n);
  const items = (Array.isArray(p.items) ? p.items : []).slice(0, 4).map(it => {
    const type = pick(it.type, DOC_ITEM_TYPES, 'icon'), o = { type };
    if (type === 'calendar') Object.assign(o, { weekday: S(it.weekday || 'DOMINGO', 14), day: S(it.day ?? '1', 4), month: S(it.month || 'JANEIRO', 12) });
    if (type === 'screen') Object.assign(o, { badge: it.badge === '' ? '' : S(it.badge || 'AO VIVO', 14), caption: S(it.caption, 30), show: pick(it.show, DOC_SHOWS, 'news') });
    if (type === 'lock') Object.assign(o, { symbol: pick(it.symbol, DOC_SYMBOLS, 'doc'), label: S(it.label, 20), locked: it.locked !== false });
    if (type === 'people') Object.assign(o, { count: clamp(Math.round(Number(it.count) || 3), 1, 4), label: S(it.label, 20) });
    if (type === 'icon') Object.assign(o, { name: pick(it.name, DOC_ICONS, 'alert'), label: S(it.label, 22) });
    if (type === 'stat') Object.assign(o, { value: S(it.value, 10), prefix: S(it.prefix, 4), suffix: S(it.suffix, 6), label: S(it.label, 40) });
    if (type === 'card') Object.assign(o, { kicker: S(it.kicker, 28), title: S(it.title, 40), text: S(it.text, 110), footer: S(it.footer, 40), icon: pick(it.icon, DOC_ICONS, 'doc'), tone: pick(it.tone, Object.keys(DOC_TONES), 'amber'), want: S(it.want, 80), img: S(it.img, 20) });
    if (type === 'photo') Object.assign(o, { want: S(it.want, 80), label: S(it.label, 24), grade: pick(it.grade, ['doc', 'bw', 'warm', 'none'], 'doc'), img: S(it.img, 20) });
    return o;
  });
  const big = p.big && (p.big.value ?? '') !== '' ? { value: S(p.big.value, 10), prefix: S(p.big.prefix, 4), suffix: S(p.big.suffix, 6), label: S(p.big.label, 40) } : null;
  return { bg: pick(p.bg, ['wall', 'night'], 'wall'), kicker: S(p.kicker, 30), big, items, crowd: clamp(Math.round(Number(p.crowd) || 0), 0, 16), source: S(p.source, 80), camera: pick(p.camera, ['push', 'still'], 'push') };
}
function normPhoto(p) {
  const pick = (v, list, d) => (list.includes(v) ? v : d), S = (v, n) => String(v ?? '').slice(0, n);
  return { want: S(p.want, 100), img: S(p.img, 20), label: S(p.label, 30), kicker: S(p.kicker, 30), source: S(p.source, 80), grade: pick(p.grade, ['doc', 'bw', 'warm', 'none'], 'doc'), move: pick(p.move, ['in', 'out', 'left', 'right'], 'in') };
}
/* every place a scene asks for a photo: [{scene, path, want, img}] */
function photoSlots(P) {
  const out = [];
  P.scenes.forEach((s, i) => {
    if (s.kind === 'photo') out.push({ i, ref: s.p, want: s.p.want, img: s.p.img });
    if (s.kind === 'doc') (s.p.items || []).forEach(it => { if (it.type === 'photo' || (it.type === 'card' && (it.want || it.img))) out.push({ i, ref: it, want: it.want, img: it.img }); });
  });
  return out;
}
async function addAsset(file) {
  const img = await createImageBitmap(file); const id = 'a' + uid();
  ASSETS.set(id, { name: file.name, img }); return id;
}

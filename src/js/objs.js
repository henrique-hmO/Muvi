/* ============ OBJ: explainer scenes that SHOW things (receipt, wallet, phone chat, price, choice…) in the toon style ============ */
const OBJ_TYPES = { receipt: 'Orçamento / recibo', wallet: 'Carteira com dinheiro', price: 'Produto com preço', phone_chat: 'Celular: conversa', phone_post: 'Celular: post', phone_call: 'Celular: chamada', question: 'Mistério (?)', choice: 'Escolha A ou B', progress: 'Barra de progresso', map: 'Mapa com rota', board: 'Quadro de preços', big_number: 'Número grande', checklist: 'Lista de itens', compare: 'Antes x depois', lock: 'Celular: tela de bloqueio', part2: 'Cartela "Parte 2"' };
const OBJ_BG = { stripes: 'Listras', wood: 'Madeira', paper: 'Papel', dark: 'Escuro', red: 'Vermelho', blue: 'Azul', yellow: 'Amarelo' };

function toonKit(ctx, m) {
  const lw = Math.max(2, m * .007);
  const fs = (fill, w = lw) => { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.stroke(); };
  const box = (x, y, w, h, r, fill, rot = 0) => { ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); rr(ctx, -w / 2, -h / 2, w, h, r); fs(fill); ctx.restore(); };
  const txt = (s, x, y, size, col = INK0, weight = 800, align = 'left', font = 'Poppins') => { ctx.font = `${weight} ${size}px "${font}", ${FALLBACK}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); return ctx.measureText(s).width; };
  const fit = (s, maxW, size, weight = 800) => { let z = size; ctx.font = `${weight} ${z}px "Poppins", ${FALLBACK}`; while (ctx.measureText(s).width > maxW && z > size * .4) { z *= .92; ctx.font = `${weight} ${z}px "Poppins", ${FALLBACK}`; } return z; };
  return { lw, fs, box, txt, fit };
}
function objBackground(ctx, W, H, bg, t) {
  const C = { stripes: ['#a9c9c9', '#9dbfbf'], wood: ['#8a5f3e', '#80573a'], paper: ['#f3ecd9', '#ebe2cc'], dark: ['#1d2338', '#1a1f33'], red: ['#d9483b', '#cf3f33'], blue: ['#3f6fb0', '#3a67a5'], yellow: ['#f2c94c', '#ebc040'] }[bg] || ['#a9c9c9', '#9dbfbf'];
  ctx.fillStyle = C[0]; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C[1]; const s = H / 18;
  if (bg === 'wood') { for (let y = 0; y < H; y += s * 1.6) { ctx.fillRect(0, y, W, 3); } ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse((i * 137) % W, (i * 311) % H, 18, 5, 0, 0, 7); ctx.fill(); } }
  else if (bg === 'paper') { ctx.strokeStyle = 'rgba(0,0,0,.05)'; for (let y = s; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
  else if (bg === 'dark') { const g = ctx.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .45, H * .7); g.addColorStop(0, '#2a3352'); g.addColorStop(1, '#141828'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  else for (let y = 0; y < H; y += s * 2) ctx.fillRect(0, y, W, s);
}

DRAW.obj = (ctx, L, W, H, t, d, p) => {
  const P = S.__drawP || S.project, m = Math.min(W, H), K = toonKit(ctx, m), vertical = H > W;
  objBackground(ctx, W, H, p.bg || 'stripes', t);
  const k = ease.back(clamp(t / .4)), float = Math.sin(t * 1.8) * m * .006;
  const cx = W / 2 - (p.who ? (p.who.side === 'left' ? -1 : 1) * W * .06 : 0), cy = H * (p.who ? .36 : .47) + float;
  const shrink = p.who ? .82 : 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k * shrink, k * shrink); ctx.rotate((1 - clamp(t / .4)) * -.08);
  OBJ_DRAW[p.item?.type || 'receipt']?.(ctx, K, m, W, H, p.item || {}, t, d, P, L);
  if (p.item?.brand && BRANDS[p.item.brand] && !['receipt', 'choice', 'map'].includes(p.item.type)) drawBrandBadge(ctx, p.item.brand, 0, -m * .52, m * .07);
  ctx.restore();
  if (p.cross) { const a = ease.back(clamp((t - d * .55) / .25)); if (a > 0) { ctx.save(); ctx.translate(cx, cy); ctx.scale(a, a); ctx.lineCap = 'round'; for (const [c, w] of [[INK, m * .075], ['#e53935', m * .055]]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-m * .3, -m * .3); ctx.lineTo(m * .3, m * .3); ctx.moveTo(m * .3, -m * .3); ctx.lineTo(-m * .3, m * .3); ctx.stroke(); } ctx.restore(); } }
  if (p.who && p.who.who !== 'none') { /* character peeking from the bottom corner, toon close-up */
    const side = p.who.side === 'left' ? -1 : 1, e = ease.out(clamp((t - .15) / .35));
    const cn = P.charStyle === 'cine', hh0 = H * (vertical ? .78 : 1.1), hh = cn ? hh0 * 2.3 : hh0; ctx.save(); ctx.translate(W / 2 + side * W * (vertical ? .26 : .3), (cn ? H * (vertical ? .62 : .66) + hh * .92 : H * (vertical ? .8 : .85) + hh * .55) + (1 - e) * H * .2);
    drawPerson(ctx, castOf(P, p.who.who), { h: hh, facing: -side, emotion: p.who.emotion || 'shocked', pose: 'stand', talking: !!p.who.talking, style: P.charStyle === 'cine' ? 'cine' : 'toon' }, t);
    ctx.restore();
  }
  if (p.title) objTitle(ctx, K, W, H, m, p.title, t);
};
function objTitle(ctx, K, W, H, m, s, t) {
  const a = ease.back(clamp((t - .05) / .3)); if (a <= 0) return;
  const parts = String(s).split('*'), size = K.fit(String(s).replace(/\*/g, '').toUpperCase(), W * .74, m * .07, 900);
  ctx.font = `900 ${size}px "Poppins", ${FALLBACK}`; const tw = ctx.measureText(String(s).replace(/\*/g, '').toUpperCase()).width;
  const h = size * 1.6, w = tw + size * 1.2, y = H * (H > W ? .1 : .08);
  ctx.save(); ctx.translate(W / 2, y + h / 2); ctx.scale(a, a); ctx.rotate(-.02);
  rr(ctx, -w / 2, -h / 2, w, h, h * .22); ctx.fillStyle = '#141826'; ctx.fill(); ctx.lineWidth = m * .008; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  let x = -tw / 2; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  parts.forEach((pt, i) => { const u = pt.toUpperCase(); ctx.fillStyle = i % 2 ? '#ffd23f' : '#ffffff'; ctx.fillText(u, x, 2); x += ctx.measureText(u).width; });
  ctx.restore();
}
const pop = (t, at, dur = .3) => ease.back(clamp((t - at) / dur));
const OBJ_DRAW = {
  receipt(ctx, K, m, W, H, it, t) {
    const w = m * .62, h = m * .72; ctx.rotate(-.03);
    K.box(-w / 2, -h / 2, w, h, m * .01, '#fbf9f2');
    if (it.brand && BRANDS[it.brand]) drawBrandBadge(ctx, it.brand, 0, -h / 2 - m * .06, m * .075);
    else if (it.brand) { K.box(-w * .32, -h / 2 - m * .1, w * .64, m * .085, m * .015, '#eef1f2'); K.txt(String(it.brand).toUpperCase(), 0, -h / 2 - m * .058, K.fit(String(it.brand).toUpperCase(), w * .55, m * .045), '#3d5a73', 900, 'center'); }
    K.txt(String(it.title || 'ORÇAMENTO').toUpperCase(), -w * .4, -h * .36, K.fit(String(it.title || 'ORÇAMENTO').toUpperCase(), w * .8, m * .055), INK0, 900);
    ctx.fillStyle = '#d9dcdf'; for (let i = 0; i < 3; i++) { rr(ctx, -w * .4, -h * .22 + i * m * .05, w * (.7 - i * .1), m * .018, m * .009); ctx.fill(); }
    const lines = (it.lines || []).slice(0, 3); lines.forEach((l, i) => K.txt(l, -w * .4, h * .02 + i * m * .05, K.fit(l, w * .8, m * .036, 500), '#333', 500));
    ctx.setLineDash([m * .012, m * .01]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w * .4, h * .2); ctx.lineTo(w * .4, h * .2); ctx.stroke(); ctx.setLineDash([]);
    const a = pop(t, .45); if (a > 0) { ctx.save(); ctx.translate(w * .1, h * .33); ctx.scale(a, a); K.txt(String(it.total || 'R$ 0'), 0, 0, K.fit(String(it.total || ''), w * .75, m * .1, 900), '#d23a3a', 900, 'center'); ctx.restore(); }
  },
  wallet(ctx, K, m, W, H, it, t) {
    const w = m * .86, h = m * .6;
    K.box(-w / 2, -h / 2, w, h, m * .03, '#6b4630'); ctx.strokeStyle = 'rgba(255,230,200,.5)'; ctx.setLineDash([m * .012, m * .01]); ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + m * .02, -h / 2 + m * .02, w - m * .04, h - m * .04); ctx.setLineDash([]);
    ctx.strokeStyle = INK; ctx.lineWidth = K.lw; ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.stroke();
    const cards = (it.cards || ['CARTÃO', 'DOCUMENTO']).slice(0, 3), cc = ['#3e6f9e', '#c9573c', '#ece6d6'];
    cards.forEach((c, i) => { const y = -h * .32 + i * h * .24; K.box(-w * .45, y, w * .38, h * .14, m * .01, cc[i % 3]); K.txt(String(c).toUpperCase(), -w * .26, y + h * .05, K.fit(String(c).toUpperCase(), w * .33, m * .026, 800), i === 2 ? INK0 : '#fff', 800, 'center'); K.box(-w * .46, y + h * .09, w * .4, h * .13, m * .008, '#5a3a26'); });
    (it.notes || [100, 10]).slice(0, 3).forEach((n, i) => { const a = pop(t, .25 + i * .15); if (a <= 0) return; ctx.save(); ctx.translate(w * .22, -h * .22 + i * h * .12); ctx.rotate(-.06 + i * .05); ctx.scale(a, a); K.box(-w * .2, -h * .12, w * .4, h * .24, m * .01, n >= 100 ? '#7fb2d9' : n >= 50 ? '#e6a74a' : n >= 20 ? '#e8b14a' : '#e58aa6'); K.txt(String(n), w * .17, -h * .04, m * .055, '#fff', 900, 'right'); ctx.restore(); });
    K.box(w * .03, h * .02, w * .44, h * .44, m * .01, '#7a5238');
    for (let i = 0; i < (it.coins ?? 3); i++) { const a = pop(t, .55 + i * .1); if (a <= 0) continue; ctx.save(); ctx.translate(w * (.1 + i * .1), h * .14); ctx.scale(a, a); ctx.beginPath(); ctx.arc(0, 0, m * .035, 0, 7); K.fs(i === 2 ? '#d9dadc' : '#e9c64a'); K.txt(i === 2 ? '5' : '1', 0, 0, m * .03, '#7a6420', 900, 'center'); ctx.restore(); }
    if (it.money) { const a = pop(t, .1); ctx.save(); ctx.translate(0, -h / 2 - m * .14); ctx.scale(a, a); const s = K.fit(it.money, w * .6, m * .085, 900); ctx.font = `900 ${s}px Poppins`; const tw = ctx.measureText(it.money).width; K.box(-tw / 2 - m * .04, -s * .75, tw + m * .08, s * 1.5, m * .02, '#141826'); K.txt(it.money, 0, 0, s, '#ffd23f', 900, 'center'); ctx.restore(); }
  },
  price(ctx, K, m, W, H, it, t) {
    const w = m * .46, h = m * .56; ctx.rotate(-.04);
    K.box(-w / 2, -h / 2, w, h, m * .012, '#3f6f9a'); K.txt(String(it.name || 'PRODUTO').toUpperCase(), -w * .4, -h * .38, K.fit(String(it.name || 'PRODUTO').toUpperCase(), w * .8, m * .045, 900), '#fff', 900);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = m * .012; ctx.beginPath(); rr(ctx, -w * .18, -h * .2, w * .36, h * .35, m * .01); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-w * .1 + i * w * .065, h * .17); ctx.lineTo(-w * .12 + i * w * .065, h * .27); ctx.stroke(); }
    if (it.sub) K.txt(it.sub, 0, h * .4, m * .028, '#dfe9f2', 600, 'center');
    const a = pop(t, .35); if (a > 0) { ctx.save(); ctx.translate(w * .5, -h * .42); ctx.rotate(.18); ctx.scale(a, a); const s = K.fit(it.price || 'R$ 0', m * .3, m * .055, 900); ctx.font = `900 ${s}px Poppins`; const tw = ctx.measureText(it.price || '').width; ctx.beginPath(); ctx.moveTo(-m * .04, 0); ctx.lineTo(0, -s * .8); ctx.lineTo(tw + m * .04, -s * .8); ctx.lineTo(tw + m * .04, s * .8); ctx.lineTo(0, s * .8); ctx.closePath(); K.fs('#fbf9f2'); K.txt(it.price || '', m * .015, 0, s, '#d23a3a', 900); ctx.restore(); }
    if (it.result) { const b = pop(t, .8); if (b > 0) { ctx.save(); ctx.translate(0, h / 2 + m * .16); ctx.scale(b, b); const s = K.fit(it.result, m * .6, m * .07, 900); ctx.font = `900 ${s}px Poppins`; const tw = ctx.measureText(it.result).width; K.box(-tw / 2 - m * .04, -s * .8, tw + m * .08, s * 1.6, m * .02, '#141826'); K.txt(it.result, 0, 0, s, '#fff', 900, 'center'); ctx.restore(); } }
  },
  phone_chat(ctx, K, m, W, H, it, t, d) { phoneFrame(ctx, K, m, W, H, it.name, (pw, ph) => {
    const msgs = (it.msgs || []).slice(0, 6), step = Math.max(.35, (d * .8) / Math.max(1, msgs.length));
    let y = ph * .32 - msgs.length * ph * .1;
    msgs.forEach((g, i) => { const a = pop(t, .2 + i * step, .25); if (a <= 0) return; const me = !!g.me, s = pw * .068; ctx.font = `500 ${s}px Inter, ${FALLBACK}`; const lines = wrapTxt(ctx, g.text, pw * .62), bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + pw * .08, bh = lines.length * s * 1.3 + pw * .05; const x = me ? pw * .44 - bw : -pw * .44;
      ctx.save(); ctx.translate(x + (me ? bw : 0), y); ctx.scale(a, a); ctx.translate(-(me ? bw : 0), 0); rr(ctx, 0, 0, bw, bh, pw * .04); ctx.fillStyle = me ? '#3d7bf2' : '#eceef1'; ctx.fill(); ctx.fillStyle = me ? '#fff' : '#222'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; lines.forEach((l, j) => ctx.fillText(l, pw * .04, pw * .025 + j * s * 1.3)); ctx.restore(); y += bh + pw * .03; });
  }); },
  phone_post(ctx, K, m, W, H, it, t) { phoneFrame(ctx, K, m, W, H, it.name, (pw, ph) => {
    const iy = -ph * .32, ih = ph * .42; const g = ctx.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, '#f7a55a'); g.addColorStop(.6, '#f6d37a'); g.addColorStop(.61, '#5ab8d6'); g.addColorStop(1, '#3a8fb8'); ctx.fillStyle = g; ctx.fillRect(-pw * .46, iy, pw * .92, ih);
    ctx.fillStyle = '#ffe48a'; ctx.beginPath(); ctx.arc(pw * .2, iy + ih * .4, pw * .08, 0, 7); ctx.fill();
    const lk = pop(t, .5); ctx.save(); ctx.translate(-pw * .38, iy + ih + ph * .05); ctx.scale(lk, lk); ctx.fillStyle = '#ff3b5c'; ctx.font = `${pw * .09}px sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText('♥', 0, 0); ctx.restore();
    K.txt(it.likes || '88 curtidas', -pw * .42, iy + ih + ph * .1, pw * .05, '#111', 700); ctx.font = `500 ${pw * .045}px Inter`; wrapTxt(ctx, it.caption || '', pw * .84).slice(0, 3).forEach((l, i) => K.txt(l, -pw * .42, iy + ih + ph * .15 + i * pw * .06, pw * .045, '#333', 500, 'left', 'Inter'));
  }); },
  phone_call(ctx, K, m, W, H, it, t) { phoneFrame(ctx, K, m, W, H, '', (pw, ph) => {
    ctx.fillStyle = '#1b2235'; ctx.fillRect(-pw * .46, -ph * .44, pw * .92, ph * .88);
    const r = pw * .16, pul = 1 + .06 * Math.sin(t * 6); ctx.beginPath(); ctx.arc(0, -ph * .18, r * pul, 0, 7); K.fs('#e9b48a'); K.txt(it.name || '', 0, -ph * .02, pw * .07, '#fff', 700, 'center'); K.txt(it.state || 'chamando…', 0, ph * .04, pw * .05, '#aab', 500, 'center');
    for (const [x, c] of [[-pw * .2, '#e53935'], [pw * .2, '#2ecc71']]) { ctx.beginPath(); ctx.arc(x, ph * .3, pw * .08, 0, 7); K.fs(c); }
  }, true); },
  question(ctx, K, m, W, H, it, t) {
    if (it.label) { const s = K.fit(String(it.label).toUpperCase(), m * .6, m * .055, 900); ctx.font = `900 ${s}px Poppins`; const tw = ctx.measureText(String(it.label).toUpperCase()).width; K.box(-tw / 2 - m * .04, -m * .46, tw + m * .08, s * 1.6, m * .015, '#f4f1ea'); K.txt(String(it.label).toUpperCase(), 0, -m * .46 + s * .8, s, '#2d3b55', 900, 'center'); }
    const r = m * .24 * (1 + .03 * Math.sin(t * 4)); ctx.beginPath(); ctx.arc(0, m * .05, r + m * .025, 0, 7); K.fs('#f4f1ea'); ctx.beginPath(); ctx.arc(0, m * .05, r, 0, 7); K.fs('#f5c53a'); K.txt('?', 0, m * .07, r * 1.4, INK0, 900, 'center');
  },
  choice(ctx, K, m, W, H, it, t, d, P) {
    ctx.restore(); ctx.save(); /* full-frame layout */
    ctx.fillStyle = '#f2c94c'; ctx.fillRect(0, 0, W / 2, H); ctx.fillStyle = '#d9483b'; ctx.beginPath(); ctx.moveTo(W * .56, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W * .44, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = m * .012; ctx.beginPath(); ctx.moveTo(W * .56, 0); ctx.lineTo(W * .44, H); ctx.stroke();
    if (it.cta) { const s = K.fit(String(it.cta).toUpperCase(), W * .7, m * .05, 900); ctx.font = `900 ${s}px Poppins`; const tw = ctx.measureText(String(it.cta).toUpperCase()).width; K.box(W / 2 - tw / 2 - m * .03, H * .2, tw + m * .06, s * 1.6, m * .012, '#fbf9f2'); K.txt(String(it.cta).toUpperCase(), W / 2, H * .2 + s * .8, s, INK0, 900, 'center'); }
    [[it.a, it.subA, W * .25], [it.b, it.subB, W * .75]].forEach(([lab, sub, x], i) => {
      const a = pop(t, .15 + i * .15); ctx.save(); ctx.translate(x, H * .33); ctx.scale(a, a);
      const s = K.fit(String(lab || '').toUpperCase(), W * .4, m * .09, 900); ctx.font = `900 ${s}px Poppins`; ctx.lineWidth = s * .2; ctx.strokeStyle = INK0; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.strokeText(String(lab || '').toUpperCase(), 0, 0); ctx.fillStyle = '#fff'; ctx.fillText(String(lab || '').toUpperCase(), 0, 0);
      if (sub) K.txt(String(sub).toUpperCase(), 0, s * .8, m * .03, '#fff', 800, 'center');
      ctx.restore();
      const cn = P.charStyle === 'cine', ph = cn ? H * 1.45 : H * .62; ctx.save(); ctx.translate(x, cn ? H * .56 + ph * .92 : H * 1.08); drawPerson(ctx, castOf(P, it.who || 'hero'), { h: ph, facing: i ? -1 : 1, emotion: i ? 'worried' : 'happy', style: cn ? 'cine' : 'toon' }, t + i); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(W / 2, H * .4, m * .05, 0, 7); K.fs('#141826'); K.txt('OU', W / 2, H * .4, m * .04, '#ffd23f', 900, 'center');
  },
  progress(ctx, K, m, W, H, it, t) {
    const w = m * .8, h = m * .1, v = clamp(+it.value || 0, 0, 100) * ease.out(clamp((t - .2) / .8));
    K.txt(String(it.label || 'PROGRESSO').toUpperCase(), -w / 2, -h, K.fit(String(it.label || '').toUpperCase(), w, m * .04, 800), '#fff', 800);
    K.box(-w / 2, -h / 2, w, h, h / 2, '#141826'); ctx.save(); rr(ctx, -w / 2 + 4, -h / 2 + 4, Math.max(h, (w - 8) * v / 100), h - 8, (h - 8) / 2); ctx.fillStyle = '#e53935'; ctx.fill(); ctx.restore();
    K.txt(`${Math.round(v)}%`, w / 2 - m * .02, 0, h * .55, '#ffd23f', 900, 'right');
    if (it.delta) { const a = pop(t, .9); ctx.save(); ctx.translate(w / 2, -h * 1.3); ctx.rotate(.1); ctx.scale(a, a); K.box(-m * .08, -m * .035, m * .16, m * .07, m * .015, '#2ecc71'); K.txt(it.delta, 0, 0, m * .04, '#fff', 900, 'center'); ctx.restore(); }
  },
  map(ctx, K, m, W, H, it, t) {
    ctx.restore(); ctx.save(); ctx.fillStyle = '#2f7fb0'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#4caf6a'; ctx.beginPath(); ctx.moveTo(0, H * .7); ctx.quadraticCurveTo(W * .3, H * .62, W * .45, H * .85); ctx.lineTo(W * .5, H); ctx.lineTo(0, H); ctx.fill(); ctx.beginPath(); ctx.ellipse(W * .2, H * .25, W * .06, H * .02, 0, 0, 7); ctx.fill();
    const k = ease.inOut(clamp((t - .2) / 1.4)), pts = [[W * .78, H * .18], [W * .6, H * .4], [W * .42, H * .55], [W * .25, H * .72]];
    ctx.setLineDash([m * .02, m * .015]); ctx.strokeStyle = '#fff'; ctx.lineWidth = m * .008; ctx.beginPath(); ctx.moveTo(...pts[0]); const n = Math.max(1, Math.floor(k * 3) + 1); for (let i = 1; i <= Math.min(3, n); i++) ctx.lineTo(...pts[i]); ctx.stroke(); ctx.setLineDash([]);
    ctx.save(); ctx.translate(pts[3][0], pts[3][1] - m * .04); ctx.beginPath(); ctx.arc(0, 0, m * .03, 0, 7); K.fs('#e53935'); ctx.restore();
    if (it.to) K.txt(String(it.to).toUpperCase(), pts[3][0], pts[3][1] + m * .03, m * .04, '#fff', 900, 'center');
    if (it.label) objTitle(ctx, K, W, H * 1.6, m, it.label, t);
  },
  board(ctx, K, m, W, H, it, t) {
    const w = m * .7, rows = (it.rows || []).slice(0, 5), h = m * (.2 + rows.length * .09);
    K.box(-w / 2, -h / 2, w, h, m * .015, '#24302b'); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = m * .015; ctx.strokeRect(-w / 2, -h / 2, w, h);
    K.txt(String(it.title || 'PREÇOS').toUpperCase(), 0, -h / 2 + m * .08, K.fit(String(it.title || '').toUpperCase(), w * .85, m * .055, 900), '#f2d14b', 900, 'center');
    rows.forEach(([a, b], i) => { const al = pop(t, .2 + i * .12); if (al <= 0) return; ctx.globalAlpha = al; const y = -h / 2 + m * .18 + i * m * .09; K.txt(String(a).toUpperCase(), -w * .42, y, m * .042, '#f4f1ea', 800); K.txt(String(b), w * .42, y, m * .042, '#f4f1ea', 800, 'right'); ctx.globalAlpha = 1; });
  },
  big_number(ctx, K, m, W, H, it, t) {
    const v = String(it.value || ''), a = pop(t, .1, .35), s = K.fit(v, m * .85, m * .22, 900);
    if (it.top) K.txt(String(it.top).toUpperCase(), 0, -s * .9, m * .045, '#fff', 800, 'center');
    ctx.save(); ctx.scale(a, a); ctx.font = `900 ${s}px Poppins`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = s * .14; ctx.strokeStyle = INK0; ctx.strokeText(v, 0, 0); ctx.fillStyle = it.color || '#ffd23f'; ctx.fillText(v, 0, 0); ctx.restore();
    if (it.bottom) K.txt(String(it.bottom).toUpperCase(), 0, s * .85, m * .045, '#fff', 800, 'center');
  },
  checklist(ctx, K, m, W, H, it, t, d) {
    const items = (it.items || []).slice(0, 5), w = m * .78, h = m * (.14 + items.length * .1);
    K.box(-w / 2, -h / 2, w, h, m * .02, '#fbf9f2'); if (it.title) K.txt(String(it.title).toUpperCase(), -w * .42, -h / 2 + m * .065, K.fit(String(it.title).toUpperCase(), w * .84, m * .048, 900), INK0, 900);
    items.forEach((s, i) => { const at = .3 + i * Math.max(.35, d * .7 / items.length), a = pop(t, at); const y = -h / 2 + m * .15 + i * m * .1; ctx.beginPath(); rr(ctx, -w * .42, y - m * .025, m * .05, m * .05, m * .008); K.fs('#fff'); if (a > 0) { ctx.strokeStyle = (it.bad ? '#e53935' : '#2e9d55'); ctx.lineWidth = m * .012; ctx.beginPath(); if (it.bad) { ctx.moveTo(-w * .41, y - m * .015); ctx.lineTo(-w * .41 + m * .03 * a, y + m * .015); } else { ctx.moveTo(-w * .41, y); ctx.lineTo(-w * .4 + m * .01, y + m * .015); ctx.lineTo(-w * .4 + m * .03 * a, y - m * .02); } ctx.stroke(); } K.txt(String(s), -w * .32, y, K.fit(String(s), w * .7, m * .04, 600), '#222', 600); });
  },
  lock(ctx, K, m, W, H, it, t) {
    const pw = m * .6, ph = m * 1.2, buzz = t > .45 && t < .85 ? Math.sin(t * 90) * m * .006 : 0;
    ctx.save(); ctx.translate(buzz, 0); ctx.rotate(-.04);
    ctx.fillStyle = '#0b0b0d'; rr(ctx, -pw / 2, -ph / 2, pw, ph, pw * .13); ctx.fill(); ctx.strokeStyle = '#2c2c31'; ctx.lineWidth = m * .006; ctx.stroke();
    ctx.save(); rr(ctx, -pw / 2 + m * .016, -ph / 2 + m * .016, pw - m * .032, ph - m * .032, pw * .11); ctx.clip();
    const g = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); g.addColorStop(0, '#131318'); g.addColorStop(.55, '#1c0e11'); g.addColorStop(1, '#55101a'); ctx.fillStyle = g; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = '#000'; rr(ctx, -pw * .12, -ph * .47, pw * .24, ph * .032, ph * .016); ctx.fill();
    K.txt(it.date || 'quinta-feira, 5 de novembro', 0, -ph * .33, pw * .055, 'rgba(255,255,255,.82)', 500, 'center', 'Inter');
    K.txt(it.time || '03:00', 0, -ph * .22, pw * .3, '#fff', 400, 'center', 'Inter');
    const a = ease.out(clamp((t - .45) / .3));
    if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, -ph * .04 - (1 - a) * ph * .03); const nw = pw * .86, nh = ph * .12; ctx.fillStyle = 'rgba(62,62,70,.92)'; rr(ctx, -nw / 2, -nh / 2, nw, nh, nh * .28); ctx.fill();
      ctx.fillStyle = '#e0252b'; rr(ctx, -nw / 2 + nh * .18, -nh * .3, nh * .6, nh * .6, nh * .14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-nw / 2 + nh * .48, -nh * .02, nh * .17, nh * .13, 0, 0, 7); ctx.fill();
      K.txt(it.name || 'Mãe', -nw / 2 + nh * .95, -nh * .16, nh * .2, '#fff', 700, 'left', 'Inter'); K.txt(String(it.text || 'Abre o portão.').slice(0, 40), -nw / 2 + nh * .95, nh * .16, nh * .18, 'rgba(255,255,255,.9)', 400, 'left', 'Inter'); K.txt('agora', nw / 2 - nh * .2, -nh * .16, nh * .15, 'rgba(255,255,255,.55)', 400, 'right', 'Inter'); ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; rr(ctx, -pw * .18, ph * .45, pw * .36, ph * .008, ph * .004); ctx.fill();
    ctx.restore(); ctx.restore();
  },
  part2(ctx, K, m, W, H, it, t) {
    const sh = H > W ? H / W : 1;
    K.txt(String(it.top || '').toUpperCase(), 0, -m * .52 * sh, m * .03, 'rgba(255,255,255,.55)', 700, 'center');
    K.txt(String(it.label || 'PARTE').toUpperCase(), 0, -m * .36 * sh, m * .14, '#fff', 900, 'center');
    const k = ease.out(clamp(t / .5)), pu = 1 + .03 * Math.sin(t * 4); ctx.save(); ctx.scale(lerp(1.35, 1, k) * pu, lerp(1.35, 1, k) * pu); ctx.globalAlpha *= k; ctx.shadowColor = 'rgba(240,30,40,.9)'; ctx.shadowBlur = m * .07; K.txt(String(it.value || '2'), 0, 0, m * .44, '#e0252b', 900, 'center'); ctx.restore();
    const b = clamp((t - .4) / .4); ctx.save(); ctx.globalAlpha *= b; K.txt(String(it.bottom || 'EM BREVE').toUpperCase(), 0, m * .34 * sh, m * .085, '#fff', 900, 'center'); K.txt(String(it.sub || 'SEGUE PRA NÃO PERDER').toUpperCase(), 0, m * .42 * sh, m * .028, 'rgba(255,255,255,.6)', 700, 'center'); ctx.restore();
  },
  compare(ctx, K, m, W, H, it, t) {
    const w = m * .42, h = m * .5;
    [[it.a || 'ANTES', it.av, -w * .56, '#e53935'], [it.b || 'DEPOIS', it.bv, w * .56, '#2e9d55']].forEach(([lab, val, x, col], i) => { const a = pop(t, .1 + i * .35); if (a <= 0) return; ctx.save(); ctx.translate(x, 0); ctx.scale(a, a); K.box(-w / 2, -h / 2, w, h, m * .02, '#fbf9f2'); K.box(-w / 2, -h / 2, w, m * .09, m * .02, col); K.txt(String(lab).toUpperCase(), 0, -h / 2 + m * .045, K.fit(String(lab).toUpperCase(), w * .85, m * .045, 900), '#fff', 900, 'center'); K.txt(String(val || ''), 0, m * .04, K.fit(String(val || ''), w * .85, m * .08, 900), col, 900, 'center'); ctx.restore(); });
  },
};
function wrapTxt(ctx, s, maxW) { const out = []; let line = ''; for (const w of String(s).split(/\s+/)) { const tr = line ? line + ' ' + w : w; if (ctx.measureText(tr).width > maxW && line) { out.push(line); line = w; } else line = tr; } if (line) out.push(line); return out; }
function phoneFrame(ctx, K, m, W, H, name, inner, dark) {
  const ph = Math.min(H * .66, m * 1.25), pw = ph * .5;
  ctx.beginPath(); rr(ctx, -pw / 2 - m * .02, -ph / 2 - m * .02, pw + m * .04, ph + m * .04, pw * .14); K.fs('#16181d');
  ctx.save(); rr(ctx, -pw / 2, -ph / 2, pw, ph, pw * .11); ctx.clip(); ctx.fillStyle = dark ? '#1b2235' : '#ffffff'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  if (name) { ctx.fillStyle = '#f4f5f7'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph * .12); ctx.beginPath(); ctx.arc(-pw * .3, -ph * .41, pw * .045, 0, 7); ctx.fillStyle = '#e9b48a'; ctx.fill(); K.txt(name, -pw * .22, -ph * .41, pw * .05, '#111', 700, 'left', 'Inter'); }
  inner(pw, ph); ctx.restore();
  ctx.fillStyle = '#16181d'; rr(ctx, -pw * .15, -ph / 2 + m * .008, pw * .3, ph * .025, ph * .012); ctx.fill();
}
function normObj(p) {
  const pick = (v, list, d) => (list.includes(v) ? v : d), it = p.item || {}, type = pick(it.type, Object.keys(OBJ_TYPES), 'receipt');
  const S_ = (v, n) => String(v ?? '').slice(0, n), arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  const item = { type };
  for (const k of ['title', 'total', 'money', 'name', 'price', 'sub', 'result', 'caption', 'likes', 'state', 'label', 'a', 'b', 'subA', 'subB', 'cta', 'to', 'top', 'bottom', 'delta', 'av', 'bv', 'who', 'time', 'date', 'text']) if (it[k] != null) item[k] = S_(it[k], 120);
  if (it.brand) item.brand = brandOf(it.brand) || String(it.brand).slice(0, 24);
  if (it.value != null) item.value = type === 'progress' ? clamp(Number(it.value) || 0, 0, 100) : S_(it.value, 16);
  if (it.lines) item.lines = arr(it.lines, 3).map(x => S_(x, 60));
  if (it.cards) item.cards = arr(it.cards, 3).map(x => S_(x, 24));
  if (it.notes) item.notes = arr(it.notes, 3).map(Number).filter(Number.isFinite);
  if (it.coins != null) item.coins = clamp(+it.coins || 0, 0, 4);
  if (it.msgs) item.msgs = arr(it.msgs, 6).map(g => ({ me: !!g.me, text: S_(g.text, 90) }));
  if (it.rows) item.rows = arr(it.rows, 5).map(r => [S_(r[0], 24), S_(r[1], 14)]);
  if (it.items) item.items = arr(it.items, 5).map(x => S_(x, 50));
  if (it.bad) item.bad = true;
  const w = p.who && p.who.who ? { who: S_(p.who.who, 20), emotion: pick(p.who.emotion, EMOTIONS, 'shocked'), side: p.who.side === 'left' ? 'left' : 'right' } : null;
  return { bg: pick(p.bg, Object.keys(OBJ_BG), 'stripes'), title: S_(p.title, 40), item, who: w, cross: !!p.cross };
}
const OBJ_GUIDE = `Cena de OBJETO explicativo (kind "obj"): mostra a coisa de que a narração fala, desenhada grande na tela. Use bastante: a cada 2 ou 3 cenas, mostre um objeto concreto (preço, recibo, conversa, comparação), não só personagem.
{"kind":"obj","say":"narração","p":{"bg":"${Object.keys(OBJ_BG).join('|')}","title":"rótulo curto no topo com *destaque*","cross":false,"who":{"who":"<id>","emotion":"shocked"},"item":{"type":"...", ...campos}}}
Tipos de item e campos:
receipt {title,brand,lines:[..],total:"R$ 800"} · wallet {money:"R$ 192",notes:[100,10],coins:3,cards:["BILHETE ÚNICO","CARTÃO VENCIDO"]} · price {name,price:"R$ 150",sub,result:"SOBRA R$ 42"} · phone_chat {name,msgs:[{"me":false,"text":".."},{"me":true,"text":".."}]} · phone_post {name,likes,caption} · phone_call {name,state} · question {label} · choice {a,b,subA,subB,cta:"COMENTE UMA PALAVRA"} · progress {label,value:0-100,delta:"+9%"} · map {to,label} · board {title,rows:[["CORTE","R$ 50"]]} · big_number {top,value,bottom} · checklist {title,items:[..],bad:false} · compare {a,av,b,bv}.
lock {time:"03:00",date:"quinta-feira, 5 de novembro",name:"Mãe",text:"Filha, abre o portão."} (tela de bloqueio com notificação: ótimo gancho de suspense) · part2 {top:"NOME DA HISTÓRIA",value:"2",bottom:"EM BREVE",sub:"SEGUE PRA NÃO PERDER"} (última cena de história em partes, use bg "dark").
"who" (opcional) põe o personagem em close no canto reagindo. "cross":true carimba um X vermelho (algo que deu errado).`;
const OBJ_FIELDS = {
  receipt: [['brand', 'Marca no topo (id ou nome)'], ['title', 'Título'], ['lines', 'Linhas (uma por linha)', 'list'], ['total', 'Total']],
  wallet: [['money', 'Valor no topo'], ['notes', 'Notas (ex.: 100, 10)', 'nums'], ['coins', 'Moedas', 'num'], ['cards', 'Cartões (um por linha)', 'list']],
  price: [['name', 'Produto'], ['price', 'Preço'], ['sub', 'Detalhe'], ['result', 'Resultado embaixo']],
  phone_chat: [['name', 'Contato'], ['msgs', 'Mensagens (comece com "eu:" para as suas)', 'msgs']],
  phone_post: [['name', 'Perfil'], ['likes', 'Curtidas'], ['caption', 'Legenda']],
  phone_call: [['name', 'Quem liga'], ['state', 'Estado']],
  question: [['label', 'Rótulo']],
  choice: [['a', 'Opção A'], ['subA', 'Detalhe A'], ['b', 'Opção B'], ['subB', 'Detalhe B'], ['cta', 'Chamada']],
  progress: [['label', 'Rótulo'], ['value', 'Valor (0 a 100)', 'num'], ['delta', 'Variação']],
  map: [['label', 'Rótulo'], ['to', 'Destino']],
  board: [['title', 'Título'], ['rows', 'Linhas "ITEM: valor"', 'rows']],
  big_number: [['top', 'Texto acima'], ['value', 'Número'], ['bottom', 'Texto abaixo']],
  checklist: [['title', 'Título'], ['items', 'Itens (um por linha)', 'list']],
  lock: [['time', 'Hora'], ['date', 'Data'], ['name', 'Quem mandou'], ['text', 'Mensagem']],
  part2: [['top', 'Texto pequeno (título)'], ['value', 'Número da parte'], ['bottom', 'Texto embaixo'], ['sub', 'Chamada']],
  compare: [['a', 'Lado A'], ['av', 'Valor A'], ['b', 'Lado B'], ['bv', 'Valor B']],
};
function objPaneHTML(P, s) {
  const p = s.p, it = p.item || {}, val = ([k, , t]) => t === 'list' || t === 'nums' ? (it[k] || []).join('\n') : t === 'msgs' ? (it.msgs || []).map(g => (g.me ? 'eu: ' : '') + g.text).join('\n') : t === 'rows' ? (it.rows || []).map(r => `${r[0]}: ${r[1]}`).join('\n') : (it[k] ?? '');
  const castOpts = (P.cast || DEFAULT_CAST).map(c => `<option value="${esc(c.id)}" ${p.who?.who === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<div class="group"><label class="field"><span>Narração</span><textarea class="input" data-k="scene" data-f="say" data-t="text" style="min-height:70px">${esc(s.say || '')}</textarea></label>
    <label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".1" min="1" data-k="scene" data-f="dur" data-t="number" value="${s.dur}"></label></div>
  <div class="group"><h4>O que aparece</h4><label class="field"><span>Objeto</span><select class="input" data-act="objType">${opt(OBJ_TYPES, it.type)}</select></label>
    ${(OBJ_FIELDS[it.type] || []).map(f => f[2] && f[2] !== 'num' ? `<label class="field"><span>${f[1]}</span><textarea class="input" data-k="oi" data-f="${f[0]}" data-t="${f[2]}">${esc(val(f))}</textarea></label>` : `<label class="field"><span>${f[1]}</span><input class="input" data-k="oi" data-f="${f[0]}" data-t="${f[2] || 'text'}" value="${esc(val(f))}"></label>`).join('')}</div>
  <div class="group"><h4>Tela</h4><div class="row2"><label class="field"><span>Fundo</span><select class="input" data-k="sp" data-f="bg">${opt(OBJ_BG, p.bg)}</select></label>
    <label class="field"><span>Título no topo (*destaque*)</span><input class="input" data-k="sp" data-f="title" value="${esc(p.title || '')}"></label></div>
    <label class="toggle"><span>Carimbar X vermelho (deu errado)</span><input type="checkbox" data-k="sp" data-f="cross" ${p.cross ? 'checked' : ''}></label>
    <div class="row2"><label class="field"><span>Personagem reagindo no canto</span><select class="input" data-k="ow" data-f="who"><option value="">Ninguém</option>${castOpts}</select></label>
    <label class="field"><span>Reação</span><select class="input" data-k="ow" data-f="emotion">${opt(EMO_NAMES, p.who?.emotion || 'shocked')}</select></label></div></div>
  <div class="group"><h4>Refazer com o Claude</h4><input class="input" id="paneRedo" placeholder="Ex.: mostre o boleto em vez do recibo"><button class="btn ai sm" data-act="redo" type="button">Refazer cena</button>${s.versions?.length ? `<button class="btn sm" data-act="prev" type="button">Voltar à versão anterior (${s.versions.length})</button>` : ''}</div>`;
}
function objEdit(k, f, v, s) {
  if (k === 'oi') {
    const t = (OBJ_FIELDS[s.p.item.type] || []).find(x => x[0] === f)?.[2], L = String(v).split('\n').map(x => x.trim()).filter(Boolean);
    s.p.item[f] = t === 'list' ? L : t === 'nums' ? String(v).split(/[\s,;]+/).map(Number).filter(Number.isFinite) : t === 'num' ? Number(v) || 0 : t === 'msgs' ? L.map(x => /^eu\s*:/i.test(x) ? { me: true, text: x.replace(/^eu\s*:\s*/i, '') } : { me: false, text: x }) : t === 'rows' ? L.map(x => { const [a, ...b] = x.split(':'); return [a.trim(), b.join(':').trim()]; }) : v;
    return true;
  }
  if (k === 'ow') { if (f === 'who') s.p.who = v ? { ...(s.p.who || { emotion: 'shocked', side: 'right' }), who: v } : null; else if (s.p.who) s.p.who[f] = v; return true; }
  return false;
}

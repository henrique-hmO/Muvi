/* ============ CINE: estilo cinemático — personagem com proporção real, sem contorno, sombreado suave + luz de cena ============ */
const INK_CINE = 'rgba(20,16,14,0.16)';
const CINE_FX = new Set(['rain', 'storm', 'money_rain', 'confetti', 'hearts', 'zzz', 'sweat', 'question', 'smoke', 'fire', 'boom']);
const isCine = P => (P || S.__drawP)?.charStyle === 'cine';

/* ---------- soft shading layer: draws into an offscreen box, then lights it from the top-left ---------- */
const CL_POOL = []; let CL_DEPTH = 0;
function cineLayer(ctx, box, draw, k = 1, sat = 1) {
  const T = ctx.getTransform(), cw = ctx.canvas.width, ch = ctx.canvas.height;
  const pts = [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]]].map(([x, y]) => [T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f]);
  let x0 = Math.floor(Math.max(0, Math.min(...pts.map(p => p[0])))), y0 = Math.floor(Math.max(0, Math.min(...pts.map(p => p[1]))));
  const x1 = Math.ceil(Math.min(cw, Math.max(...pts.map(p => p[0])))), y1 = Math.ceil(Math.min(ch, Math.max(...pts.map(p => p[1]))));
  const bw = x1 - x0, bh = y1 - y0; if (bw < 2 || bh < 2) return;
  const CL = CL_POOL[CL_DEPTH] || (CL_POOL[CL_DEPTH] = { cv: document.createElement('canvas') }); if (!CL.c) CL.c = CL.cv.getContext('2d');
  if (CL.cv.width < bw || CL.cv.height < bh) { CL.cv.width = Math.max(bw, CL.cv.width); CL.cv.height = Math.max(bh, CL.cv.height); }
  const o = CL.c; o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, bw, bh);
  o.setTransform(T.a, T.b, T.c, T.d, T.e - x0, T.f - y0);
  CL_DEPTH++; try { draw(o); } finally { CL_DEPTH--; }
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-atop'; o.globalAlpha = 1;
  const g = o.createLinearGradient(0, 0, bw, bh);
  g.addColorStop(0, `rgba(255,246,232,${.16 * k})`); g.addColorStop(.42, 'rgba(255,246,232,0)'); g.addColorStop(.62, 'rgba(25,12,6,0)'); g.addColorStop(1, `rgba(25,12,6,${.34 * k})`);
  o.fillStyle = g; o.fillRect(0, 0, bw, bh);
  const v = o.createLinearGradient(0, 0, 0, bh); v.addColorStop(.7, 'rgba(20,10,5,0)'); v.addColorStop(1, `rgba(20,10,5,${.18 * k})`); o.fillStyle = v; o.fillRect(0, 0, bw, bh);
  o.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (sat < 1 && 'filter' in ctx) ctx.filter = `saturate(${sat})`; ctx.drawImage(CL.cv, 0, 0, bw, bh, x0, y0, bw, bh); ctx.restore();
}

/* ---------- realistic rig: feet at (0,0), 100 units tall, facing right ---------- */
function drawCinePerson(ctx, look, o, t) {
  const draw = c => drawCineBody(c, look, o, t);
  if (o.silhouette) return draw(ctx);
  const h = o.h || 300; cineLayer(ctx, [-h * .5, -h * 1.12, h * .5, h * .06], draw, o.dim ? .7 : 1);
}
function drawCineBody(ctx, look, o, t) {
  const { pose = 'stand', emotion = 'neutral', prop = 'none', facing = 1, h = 300, dim = 0, silhouette = false, talking = false } = o;
  const ph = t + (o.phase || 0), u = h / 100, A = poseAngles(pose, ph); const prevTL = TL; TL = clamp(6.5 / u, .45, 2.4) / 2.4;
  const skin = SKINS[look.skin] || look.skin || SKINS.s3, top = look.topColor || '#3b4a6b', pants = look.pants || '#2b2f38';
  const sil = c => (silhouette ? '#0f1116' : dim ? shade(c, -dim) : c);
  const cap = (x1, y1, x2, y2, w, col) => { ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const ell = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); };
  const limbPts = (x, y, a1, l1, a2, l2) => { const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1, a = a1 + a2; return [ex, ey, ex + Math.sin(a) * l2, ey + Math.cos(a) * l2, a]; };
  ctx.save(); ctx.scale(facing * u, u);
  if (pose !== 'fall' && !silhouette) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 0, 16, 2.6); ctx.fill(); }
  if (talking && (pose === 'stand' || pose === 'cross')) { A.uaF = -.55 + Math.sin(ph * 4.3) * .3; A.faF = -1.05 + Math.sin(ph * 5.7) * .3; A.head += Math.sin(ph * 3.1) * .035; }
  const sitDrop = A.lift ? 25 : 0; ctx.translate(0, A.bob * .7 + sitDrop); ctx.rotate(A.lean * .7);
  const hipY = -50, shY = -80, longSleeve = ['hoodie', 'suit', 'uniform', 'jacket'].includes(look.top);
  if (A.lift && !PLACE_FX.cabin) { ctx.fillStyle = sil('#5a4434'); rrp(ctx, -13, -46 - 0, 28, 4.5, 1.5); ctx.fill(); ctx.fillStyle = sil('#3e2f25'); ctx.fillRect(-11, -42, 2.4, 17); ctx.fillRect(11, -42, 2.4, 17); }
  if (look.accessory === 'backpack') { ctx.fillStyle = sil('#3b5a40'); rrp(ctx, -16, shY + 3, 8, 22, 3); ctx.fill(); }
  /* legs */
  for (const [lx, th, sh, back] of [[-3.6, A.thB, A.shB, 1], [3.6, A.thF, A.shF, 0]]) {
    const [kx, ky, fx, fy, fa] = limbPts(lx, hipY, th * .9, 24, sh * .9, 23);
    const col = sil(back ? shade(pants, -.16) : pants);
    cap(lx, hipY, kx, ky, 8, col); cap(kx, ky, fx, fy - 1.5, 6.4, col);
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(-fa * .5); ctx.fillStyle = sil(back ? '#1e1e22' : '#2a2a30'); rrp(ctx, -3.6, -3.4, 10.5, 4.4, 2); ctx.fill(); ctx.fillStyle = sil('#d8d6d0'); ctx.fillRect(-3.6, -.6, 10.5, 1); ctx.restore();
  }
  /* pelvis */
  ctx.fillStyle = sil(pants); ctx.beginPath(); ctx.moveTo(-9, -57); ctx.lineTo(9, -57); ctx.quadraticCurveTo(10, -50, 7.5, -46); ctx.lineTo(-7.5, -46); ctx.quadraticCurveTo(-10, -50, -9, -57); ctx.fill();
  /* back arm */
  const sleeveB = sil(longSleeve ? shade(top, -.18) : shade(skin, -.14));
  { const [ex, ey, hx, hy, ha2] = limbPts(-8.8, shY + 2.5, A.uaB, 16, A.faB, 14.5); cap(-8.8, shY + 2.5, ex, ey, 5.2, sleeveB); cap(ex, ey, hx, hy, 4.4, longSleeve ? sleeveB : sil(shade(skin, -.14)));
    if (look.top === 'tshirt') cap(-8.8, shY + 2.5, -8.8 + (ex + 8.8) * .42, shY + 2.5 + (ey - shY - 2.5) * .42, 6.4, sil(shade(top, -.18)));
    cineHand(ctx, hx, hy, ha2, sil(shade(skin, -.14))); }
  /* neck */
  ctx.fillStyle = sil(shade(skin, -.14)); ctx.fillRect(-2.6, shY - 6, 5.2, 7.5);
  /* torso */
  ctx.beginPath(); ctx.moveTo(-10.8, shY + 1.5); ctx.quadraticCurveTo(-11.8, shY + 12, -9, -57); ctx.quadraticCurveTo(-9.6, -53, -9.2, -52); ctx.lineTo(9.2, -52); ctx.quadraticCurveTo(9.6, -53, 9, -57); ctx.quadraticCurveTo(11.8, shY + 12, 10.8, shY + 1.5); ctx.quadraticCurveTo(6, shY - 1.6, 0, shY - 1.2); ctx.quadraticCurveTo(-6, shY - 1.6, -10.8, shY + 1.5); ctx.closePath();
  if (look.top === 'tank') { ctx.fillStyle = sil(skin); ctx.fill(); ctx.beginPath(); ctx.moveTo(-7, shY); ctx.quadraticCurveTo(-9.5, shY + 10, -9, -57); ctx.lineTo(-9.2, -52); ctx.lineTo(9.2, -52); ctx.lineTo(9, -57); ctx.quadraticCurveTo(9.5, shY + 10, 7, shY); ctx.quadraticCurveTo(0, shY + 7, -7, shY); ctx.closePath(); }
  ctx.fillStyle = sil(top); ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = sil(shade(top, -.14)); ctx.fillRect(-12, shY - 2, 5, 32); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-12, -58, 24, 6); ctx.restore();
  const det = c => { ctx.strokeStyle = c; ctx.lineWidth = .6; };
  if (look.top === 'tshirt' || look.top === 'hoodie') { det('rgba(0,0,0,.25)'); ctx.beginPath(); ctx.moveTo(-3.2, shY - .9); ctx.quadraticCurveTo(0, shY + 2.6, 3.2, shY - .9); ctx.stroke(); }
  if (look.top === 'suit') { ctx.fillStyle = sil('#f2f2f2'); ctx.beginPath(); ctx.moveTo(-3.5, shY - 1); ctx.lineTo(0, shY + 11); ctx.lineTo(3.5, shY - 1); ctx.fill(); ctx.fillStyle = sil('#9e2a32'); ctx.beginPath(); ctx.moveTo(-1, shY); ctx.lineTo(1, shY); ctx.lineTo(1.5, shY + 9); ctx.lineTo(0, shY + 11); ctx.lineTo(-1.5, shY + 9); ctx.fill(); ctx.fillStyle = sil(shade(top, -.25)); ctx.beginPath(); ctx.moveTo(-3.5, shY - 1); ctx.lineTo(-6, shY + 6); ctx.lineTo(0, shY + 13); ctx.closePath(); ctx.moveTo(3.5, shY - 1); ctx.lineTo(6, shY + 6); ctx.lineTo(0, shY + 13); ctx.closePath(); ctx.fill(); }
  if (look.top === 'hoodie') { ctx.fillStyle = sil(shade(top, -.12)); rrp(ctx, -6, -63, 12, 6, 2); ctx.fill(); ctx.fillStyle = sil(shade(top, -.2)); ctx.beginPath(); ctx.ellipse(0, shY - 1, 8, 3, 0, Math.PI, 0); ctx.fill(); det(sil('#e8e4dc')); ctx.beginPath(); ctx.moveTo(-1.6, shY + 1); ctx.lineTo(-1.6, shY + 9); ctx.moveTo(1.6, shY + 1); ctx.lineTo(1.6, shY + 8); ctx.stroke(); }
  if (look.top === 'uniform') { det('rgba(0,0,0,.35)'); ctx.beginPath(); ctx.moveTo(0, shY); ctx.lineTo(0, -52); ctx.stroke(); ctx.fillStyle = sil('#d9b444'); ctx.beginPath(); ctx.moveTo(4.5, shY + 6); ctx.lineTo(8, shY + 6); ctx.lineTo(8.4, shY + 9.5); ctx.lineTo(6.2, shY + 11.5); ctx.lineTo(4.1, shY + 9.5); ctx.fill(); }
  if (look.top === 'jacket') { ctx.fillStyle = sil('#ecebe6'); ctx.beginPath(); ctx.moveTo(-2.6, shY - .5); ctx.lineTo(2.6, shY - .5); ctx.lineTo(1.8, -52); ctx.lineTo(-1.8, -52); ctx.fill(); }
  if (look.shirtBrand && BRANDS[look.shirtBrand] && look.top !== 'suit') { ctx.save(); ctx.translate(-1, shY + 12); drawBrandBadge(ctx, look.shirtBrand, 0, 0, 4.6, { noText: look.top === 'uniform' }); ctx.restore(); }
  else if (look.print && ['tshirt', 'tank', 'hoodie'].includes(look.top)) { ctx.save(); ctx.fillStyle = sil(shade(top, top === '#ffffff' ? -.5 : .55)); ctx.font = `900 3.2px Poppins, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; String(look.print).toUpperCase().split(/\s*\/\s*|\n/).slice(0, 2).forEach((l, i) => ctx.fillText(l.slice(0, 10), -1, shY + 11 + i * 4, 15)); ctx.restore(); }
  if (look.accessory === 'chain') { ctx.strokeStyle = sil('#e0bf55'); ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(0, shY - 1, 4.4, .35, Math.PI - .35); ctx.stroke(); }
  if (look.accessory === 'badge' && look.top !== 'uniform') { ctx.fillStyle = sil('#d9b444'); ell(5.5, shY + 7, 1.6, 1.6); ctx.fill(); }
  /* head */
  ctx.save(); ctx.translate(0, shY - 4); ctx.rotate(A.head * .8); ctx.translate(.6, -6.4); ctx.scale(.034, .034);
  cineHead(ctx, look, emotion, ph, sil, skin, talking, silhouette);
  ctx.restore();
  /* front arm + prop */
  const [ex, ey, hx, hy, ha] = limbPts(8.8, shY + 2.5, A.uaF, 16, A.faF, 14.5);
  const sleeveF = sil(longSleeve ? top : skin);
  cap(8.8, shY + 2.5, ex, ey, 5.2, sleeveF); cap(ex, ey, hx, hy, 4.4, longSleeve ? sleeveF : sil(skin));
  if (look.top === 'tshirt') cap(8.8, shY + 2.5, 8.8 + (ex - 8.8) * .42, shY + 2.5 + (ey - shY - 2.5) * .42, 6.4, sil(top));
  if (look.accessory === 'watch') { ctx.fillStyle = sil('#c9ccd3'); ell(hx - Math.sin(ha) * 3, hy - Math.cos(ha) * 3, 2.2, 1.3, -ha); ctx.fill(); }
  drawProp(ctx, prop, hx, hy, ha, sil, pose);
  cineHand(ctx, hx, hy, ha, sil(skin));
  ctx.restore(); TL = prevTL;
}

function cineHand(ctx, x, y, a, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(-a); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(0, 1.4, 1.75, 1.9, 0, 0, 7); ctx.fill(); ctx.lineWidth = .85; for (const [fx, l] of [[-1.15, 2.3], [-.4, 2.8], [.38, 2.7], [1.1, 2.2]]) { ctx.beginPath(); ctx.moveTo(fx, 2.4); ctx.lineTo(fx * 1.08, 2.4 + l); ctx.stroke(); } ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(1.4, .6); ctx.lineTo(2.5, 2.6); ctx.stroke(); ctx.strokeStyle = 'rgba(60,25,15,.25)'; ctx.lineWidth = .18; for (const fx of [-.78, 0, .76]) { ctx.beginPath(); ctx.moveTo(fx, 3); ctx.lineTo(fx * 1.08, 4.6); ctx.stroke(); } ctx.restore(); }
/* face in "F" units (face ~300 wide, chin at +196, skull top at -235); scaled down by the body */
function cineHead(ctx, look, emotion, t, sil, skin, talking, silhouette) {
  const hc = sil(look.hairColor || '#2a1d16'), sk = sil(skin), skd = sil(shade(skin, -.16)), f = look.g === 'f';
  const P = new Path2D(); P.moveTo(-150, -60); P.bezierCurveTo(-150, -235, 150, -235, 150, -60); P.bezierCurveTo(150, 60, f ? 108 : 122, 168, 0, 196); P.bezierCurveTo(f ? -108 : -122, 168, -150, 60, -150, -60);
  const fill = (c, path) => { ctx.fillStyle = c; ctx.fill(path); };
  /* back hair */
  if (look.hair === 'long') { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-178, -40); ctx.bezierCurveTo(-190, -250, 190, -250, 178, -40); ctx.bezierCurveTo(192, 110, 205, 230, 190, 330); ctx.lineTo(-190, 330); ctx.bezierCurveTo(-205, 230, -192, 110, -178, -40); ctx.fill(); }
  if (look.hair === 'bun') { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(20, -250, 70, 0, 7); ctx.fill(); }
  /* ears */
  if (look.hair !== 'long') for (const s of [-1, 1]) { ctx.fillStyle = skd; ctx.beginPath(); ctx.ellipse(s * 148, -10, 26, 44, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(80,35,25,.25)'; ctx.beginPath(); ctx.ellipse(s * 150, -8, 11, 24, 0, 0, 7); ctx.fill(); }
  fill(sk, P);
  if (silhouette) { if (look.hair && look.hair !== 'bald') { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(0, -150, 165, 100, 0, Math.PI, 0); ctx.fill(); } return; }
  ctx.save(); ctx.clip(P);
  { const g = ctx.createLinearGradient(-20, 0, 155, 0); g.addColorStop(0, 'rgba(70,30,20,0)'); g.addColorStop(1, 'rgba(70,30,20,.3)'); ctx.fillStyle = g; ctx.fillRect(-20, -240, 180, 450); }
  ctx.fillStyle = 'rgba(70,30,20,.12)'; ctx.beginPath(); ctx.ellipse(0, 196, 130, 40, 0, 0, 7); ctx.fill();
  const blushA = emotion === 'happy' || f ? .2 : .1;
  for (const s of [-1, 1]) { const g = ctx.createRadialGradient(s * 92, 55, 0, s * 92, 55, 60); g.addColorStop(0, `rgba(210,95,85,${blushA})`); g.addColorStop(1, 'rgba(210,95,85,0)'); ctx.fillStyle = g; ctx.fillRect(s * 92 - 60, -5, 120, 120); }
  /* stubble / beard shadow */
  if (look.beard === 'stubble' || look.beard === 'beard') { ctx.fillStyle = look.beard === 'beard' ? hc : 'rgba(40,25,20,.28)'; ctx.beginPath(); ctx.moveTo(-152, 10); ctx.bezierCurveTo(-140, 150, -60, 200, 0, 205); ctx.bezierCurveTo(60, 200, 140, 150, 152, 10); ctx.quadraticCurveTo(120, 70, 70, 72); ctx.quadraticCurveTo(0, 60, -70, 72); ctx.quadraticCurveTo(-120, 70, -152, 10); ctx.fill(); if (look.beard === 'beard') { ctx.beginPath(); ctx.moveTo(-58, 92); ctx.quadraticCurveTo(0, 62, 58, 92); ctx.quadraticCurveTo(0, 82, -58, 92); ctx.fill(); } }
  ctx.restore();
  /* expression parameters */
  const E = { neutral: [1, 0, 0, 'line'], happy: [.86, .25, 0, 'smile'], confident: [.78, .1, -.2, 'smirk'], worried: [1.05, .45, .9, 'frown'], sad: [.8, .1, 1, 'frown'], angry: [.8, -.35, -2.2, 'tight'], scared: [1.35, 1, .8, 'open'], shocked: [1.45, 1.4, .3, 'open'] }[emotion] || [1, 0, 0, 'line'];
  const blink = (t % 3.6) < .1 ? .06 : 1, op = E[0] * blink, raise = E[1], inner = E[2], look2 = Math.sin(t * .6) * .3 + .4;
  /* brows */
  ctx.fillStyle = sil(shade(look.hairColor || '#2a1d16', -.1));
  for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); const yo = -raise * 14, yi = -raise * 16 - inner * 14; ctx.beginPath(); ctx.moveTo(118, -54 + yo); ctx.quadraticCurveTo(84, -86 + yo + yi * .3, 36, -70 + yi); ctx.lineTo(35, -59 + yi); ctx.quadraticCurveTo(82, -73 + yo + yi * .3, 116, -47 + yo); ctx.fill(); ctx.restore(); }
  /* eyes */
  for (const s of [-1, 1]) {
    const hh = 18 * op; ctx.save(); ctx.translate(72 * s, -18);
    ctx.strokeStyle = 'rgba(90,45,30,.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-32, -6 - hh * .4); ctx.quadraticCurveTo(0, -hh - 15, 32, -6 - hh * .4); ctx.stroke();
    if (op > .1) {
      const eye = new Path2D(); eye.moveTo(-36, 0); eye.quadraticCurveTo(0, -hh * 2, 36, -2); eye.quadraticCurveTo(0, hh * 1.45, -36, 0);
      fill('#efe8e2', eye); ctx.save(); ctx.clip(eye);
      const ir = emotion === 'scared' || emotion === 'shocked' ? 13 : 16, lx = look2 * 8;
      const g = ctx.createRadialGradient(lx, -3, 2, lx, -3, ir); g.addColorStop(0, '#5a3522'); g.addColorStop(1, '#24140c'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, -3, ir, 0, 7); ctx.fill();
      ctx.fillStyle = '#0b0605'; ctx.beginPath(); ctx.arc(lx, -3, ir * .45, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(lx - 5, -9, 4, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(80,40,30,.22)'; ctx.fillRect(-40, -hh * 2, 80, hh * .8); ctx.restore();
    }
    ctx.strokeStyle = '#150d0b'; ctx.lineCap = 'round'; ctx.lineWidth = f ? 7 : 5.5; ctx.beginPath(); ctx.moveTo(-37, 1); ctx.quadraticCurveTo(0, op > .1 ? -hh * 2 : 4, 37, -2); ctx.stroke();
    if (f) { ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(s > 0 ? 36 : -36, -2); ctx.lineTo(s > 0 ? 47 : -47, -11); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,45,30,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-27, hh * .72 + 3); ctx.quadraticCurveTo(0, hh + 6, 29, hh * .68 + 2); ctx.stroke();
    ctx.restore();
  }
  /* nose */
  ctx.strokeStyle = 'rgba(95,45,30,.5)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(12, -6); ctx.quadraticCurveTo(24, 34, 17, 54); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, 58); ctx.quadraticCurveTo(-8, 68, 0, 64); ctx.quadraticCurveTo(8, 68, 18, 58); ctx.stroke();
  ctx.fillStyle = 'rgba(255,230,210,.16)'; ctx.beginPath(); ctx.ellipse(-6, 28, 7, 22, 0, 0, 7); ctx.fill();
  /* mouth */
  const lipU = f ? '#9c4c45' : '#8a4a40', lipL = f ? '#b2584f' : '#9c5a4c', my = 106;
  const openM = (w, hgt) => { ctx.fillStyle = '#2a0e0c'; ctx.beginPath(); ctx.ellipse(0, my + hgt * .45, w, Math.max(4, hgt * .55), 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f0ebe5'; ctx.beginPath(); ctx.ellipse(0, my - hgt * .02, w * .7, Math.min(6, hgt * .18), 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = lipL; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, my + hgt * .45, w + 2, Math.max(5, hgt * .55) + 2, 0, 0, 7); ctx.stroke(); };
  if (talking) { const k = Math.abs(Math.sin(t * 12)) * .7 + Math.abs(Math.sin(t * 6.7)) * .4; openM(20 + k * 6, 8 + k * 26); }
  else if (E[3] === 'open') openM(emotion === 'shocked' ? 24 : 19, emotion === 'shocked' ? 46 : 32);
  else if (E[3] === 'smile') { ctx.fillStyle = '#3a1210'; ctx.beginPath(); ctx.moveTo(-44, my - 6); ctx.quadraticCurveTo(0, my + 34, 44, my - 6); ctx.quadraticCurveTo(0, my + 4, -44, my - 6); ctx.fill(); ctx.fillStyle = '#f2ede7'; ctx.beginPath(); ctx.moveTo(-36, my - 3); ctx.quadraticCurveTo(0, my + 12, 36, my - 3); ctx.quadraticCurveTo(0, my + 4, -36, my - 3); ctx.fill(); ctx.strokeStyle = lipU; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-46, my - 8); ctx.quadraticCurveTo(0, my + 36, 46, my - 8); ctx.stroke(); }
  else {
    const c = E[3] === 'frown' ? 10 : E[3] === 'smirk' ? -8 : 0, sm = E[3] === 'smirk';
    ctx.fillStyle = lipU; ctx.beginPath(); ctx.moveTo(-36, my + c); ctx.quadraticCurveTo(-16, my - 11, 0, my - 6); ctx.quadraticCurveTo(16, my - 11, 36, my + (sm ? -14 : c)); ctx.quadraticCurveTo(0, my + 4, -36, my + c); ctx.fill();
    ctx.fillStyle = lipL; ctx.beginPath(); ctx.moveTo(-31, my + 1 + c * .8); ctx.quadraticCurveTo(0, my + 22, 31, my + 1 + (sm ? -10 : c * .8)); ctx.quadraticCurveTo(0, my + 5, -31, my + 1 + c * .8); ctx.fill();
    ctx.strokeStyle = '#5a2620'; ctx.lineWidth = E[3] === 'tight' ? 5 : 3; ctx.beginPath(); ctx.moveTo(-36, my + c); ctx.quadraticCurveTo(0, my + 6, 36, my + (sm ? -14 : c)); ctx.stroke();
  }
  /* hair on top */
  ctx.fillStyle = hc;
  const capTop = () => { ctx.beginPath(); ctx.moveTo(-172, 30); ctx.bezierCurveTo(-182, -175, -62, -248, 0, -240); ctx.bezierCurveTo(62, -248, 182, -175, 172, 30); ctx.bezierCurveTo(160, -50, 150, -120, 70, -160); ctx.quadraticCurveTo(30, -178, 3, -176); ctx.quadraticCurveTo(-30, -178, -70, -160); ctx.bezierCurveTo(-150, -120, -160, -50, -172, 30); ctx.fill(); };
  const shortTop = () => { ctx.beginPath(); ctx.moveTo(-154, -20); ctx.bezierCurveTo(-166, -190, -70, -250, 6, -246); ctx.bezierCurveTo(86, -246, 166, -192, 154, -20); ctx.lineTo(146, -20); ctx.quadraticCurveTo(144, -96, 118, -128); ctx.quadraticCurveTo(84, -150, 40, -146); ctx.quadraticCurveTo(0, -158, -30, -150); ctx.quadraticCurveTo(-90, -150, -122, -124); ctx.quadraticCurveTo(-146, -96, -146, -20); ctx.closePath(); ctx.fill(); ctx.save(); ctx.strokeStyle = 'rgba(255,240,230,.06)'; ctx.lineWidth = 6; for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 26, -232); ctx.quadraticCurveTo(i * 30 + 10, -195, i * 34 + 4, -160); ctx.stroke(); } ctx.restore(); };
  if (look.hair === 'long') { capTop(); ctx.beginPath(); ctx.moveTo(-150, -20); ctx.bezierCurveTo(-160, 120, -168, 220, -150, 320); ctx.lineTo(-195, 300); ctx.bezierCurveTo(-200, 200, -192, 80, -176, -30); ctx.fill(); ctx.beginPath(); ctx.moveTo(150, -20); ctx.bezierCurveTo(160, 120, 168, 220, 150, 320); ctx.lineTo(195, 300); ctx.bezierCurveTo(200, 200, 192, 80, 176, -30); ctx.fill(); }
  if (look.hair === 'bun') capTop();
  if (look.hair === 'short') shortTop();
  if (look.hair === 'buzz') { ctx.save(); ctx.globalAlpha *= .8; ctx.beginPath(); ctx.moveTo(-154, -50); ctx.bezierCurveTo(-160, -230, 160, -230, 154, -50); ctx.quadraticCurveTo(140, -140, 0, -160); ctx.quadraticCurveTo(-140, -140, -154, -50); ctx.fill(); ctx.restore(); }
  if (look.hair === 'curly') for (const [x, y, r] of [[-130, -110, 62], [-80, -185, 66], [0, -210, 70], [80, -190, 66], [135, -120, 60], [-165, -40, 48], [165, -40, 48]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  if (look.hair === 'bald') { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-50, -170, 50, 22, -.4, 0, 7); ctx.fill(); }
  if (look.hair && look.hair !== 'bald' && look.hair !== 'cap') { ctx.strokeStyle = 'rgba(255,240,230,.07)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(-50, -110, 110, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); }
  if (look.hair === 'cap') {
    const cc = sil(look.topColor ? shade(look.topColor, .05) : '#b8383a');
    ctx.fillStyle = cc; ctx.beginPath(); ctx.moveTo(-168, -70); ctx.bezierCurveTo(-176, -300, 176, -300, 168, -70); ctx.quadraticCurveTo(0, -100, -168, -70); ctx.fill();
    ctx.fillStyle = sil(shade(look.topColor || '#b8383a', -.2)); ctx.beginPath(); ctx.moveTo(60, -86); ctx.quadraticCurveTo(250, -100, 268, -52); ctx.quadraticCurveTo(160, -40, 60, -62); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-168, -84, 336, 14);
    if (look.capBrand && BRANDS[look.capBrand]) { ctx.save(); ctx.translate(-10, -175); drawBrandBadge(ctx, look.capBrand, 0, 0, 70, { noText: false }); ctx.restore(); }
    else if (look.capText) { ctx.save(); ctx.translate(-10, -170); ctx.fillStyle = '#f2ede2'; rrp(ctx, -95, -32, 190, 64, 12); ctx.fill(); ctx.fillStyle = INK0; ctx.font = '900 40px Poppins, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(look.capText).toUpperCase().slice(0, 10), 0, 3, 170); ctx.restore(); }
  }
  if (look.accessory === 'glasses') { ctx.strokeStyle = '#1a1614'; ctx.lineWidth = 8; for (const s of [-1, 1]) { rrp(ctx, s * 72 - 50, -52, 100, 66, 22); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-22, -26); ctx.lineTo(22, -26); ctx.stroke(); }
  if (emotion === 'worried' || emotion === 'scared' || emotion === 'shocked') { const k = (t * .9) % 1; ctx.save(); ctx.globalAlpha *= 1 - k * .6; ctx.fillStyle = 'rgba(190,225,245,.85)'; ctx.translate(165, -90 + k * 70); ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(20, 6, 0, 18); ctx.quadraticCurveTo(-20, 6, 0, -26); ctx.fill(); ctx.restore(); }
}

/* ---------- scene light: clear for normal videos, low-key only for mystery / horror ---------- */
const CINE_DARK = { mystery: .84, tense: .5, danger: .5 };
const CINE_INDOOR = new Set(['office', 'room', 'prison', 'school', 'hospital', 'shop', 'bank', 'market', 'kitchen', 'living', 'mansion', 'church', 'court', 'police', 'gym', 'club', 'restaurant', 'classroom', 'lab', 'bedroom', 'barber', 'salon', 'bathroom', 'dentist', 'market2', 'cafe', 'homeoffice', 'cabin', 'airport', 'car']);
const CINE_OPEN = new Set(['sky', 'sea', 'space', 'underwater', 'void']);
const CM = { cv: null, c: null };
function cineLights(ctx, W, H, list, dark) {
  const q = 4, mw = Math.ceil(W / q), mh = Math.ceil(H / q);
  if (!CM.cv) { CM.cv = document.createElement('canvas'); CM.c = CM.cv.getContext('2d'); }
  if (CM.cv.width !== mw || CM.cv.height !== mh) { CM.cv.width = mw; CM.cv.height = mh; }
  const M = CM.c; M.setTransform(1, 0, 0, 1, 0, 0); M.globalCompositeOperation = 'source-over'; M.clearRect(0, 0, mw, mh);
  M.fillStyle = `rgba(0,0,0,${dark})`; M.fillRect(0, 0, mw, mh);
  M.setTransform(1 / q, 0, 0, 1 / q, 0, 0); M.globalCompositeOperation = 'destination-out';
  if ('filter' in M) M.filter = 'blur(5px)';
  for (const L of list) {
    if (L.r) { const g = M.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r); g.addColorStop(0, `rgba(0,0,0,${L.k})`); g.addColorStop(.55, `rgba(0,0,0,${L.k * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)'); M.fillStyle = g; M.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2); }
    if (L.cone) { const [x, y, x2, y2, w1] = L.cone, ang = Math.atan2(y2 - y, x2 - x), len = Math.hypot(x2 - x, y2 - y); M.save(); M.translate(x, y); M.rotate(ang); const g = M.createLinearGradient(0, 0, len, 0); g.addColorStop(0, `rgba(0,0,0,${L.k})`); g.addColorStop(.7, `rgba(0,0,0,${L.k * .75})`); g.addColorStop(1, 'rgba(0,0,0,0)'); M.fillStyle = g; M.beginPath(); M.moveTo(0, -(L.w0 || 20)); M.lineTo(len, -w1); M.lineTo(len, w1); M.lineTo(0, L.w0 || 20); M.closePath(); M.fill(); M.restore(); }
  }
  if ('filter' in M) M.filter = 'none';
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(CM.cv, 0, 0, mw, mh, 0, 0, W, H); ctx.restore();
}
function cineGlow(ctx, x, y, r, rgb, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); }
const CG = { cv: null };
function cineGrain(ctx, W, H, t) {
  if (!CG.cv) { CG.cv = document.createElement('canvas'); CG.cv.width = CG.cv.height = 192; const g = CG.cv.getContext('2d'), d = g.createImageData(192, 192); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); CG.pat = null; }
  ctx.save(); ctx.globalAlpha = .035; ctx.globalCompositeOperation = 'overlay'; const ox = (t * 997) % 192, oy = (t * 613) % 192; ctx.translate(-ox, -oy); CG.pat = CG.pat || ctx.createPattern(CG.cv, 'repeat'); ctx.fillStyle = CG.pat; ctx.fillRect(0, 0, W + 192, H + 192); ctx.restore();
}
function cinePost(ctx, W, H, s, t) {
  const p = s.p || {}, mood = p.mood || 'normal', dark = CINE_DARK[mood] || 0;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${dark ? .4 : .1})`; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = dark ? 'rgba(70,45,30,.35)' : 'rgba(255,226,190,.2)'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  if (!dark) { const g = ctx.createLinearGradient(0, 0, 0, H * .55); g.addColorStop(0, 'rgba(255,250,240,.07)'); g.addColorStop(1, 'rgba(255,250,240,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  if (dark) {
    const place = p.place || '', close = p.shot === 'close', fx = W * (s.kind === 'story' ? clamp(p.hero?.x ?? .5, .15, .85) : .5), fy = H * (close ? .42 : s.kind === 'obj' ? .42 : .56);
    const fl = mood === 'mystery' && (Math.sin(t * 37) > .94) ? .55 : 1, L = [], G = [];
    if (s.kind === 'obj' || CINE_OPEN.has(place) || close) L.push({ x: fx, y: fy, r: H * .55, k: .95 });
    else if (CINE_INDOOR.has(place)) { L.push({ cone: [fx, -H * .04, fx, H * 1.02, W * .44], w0: W * .04, k: .92 * fl }, { x: fx, y: fy, r: H * .3, k: .45 }); G.push([fx, H * .01, W * .14, '255,236,200', .4 * fl]); }
    else { const lx = fx > W / 2 ? W * .14 : W * .86; L.push({ cone: [lx, H * .13, fx, H * .98, W * .42], w0: W * .03, k: .9 * fl }, { x: fx, y: fy, r: H * .28, k: .4 }); G.push([lx, H * .13, W * .12, '255,222,170', .5 * fl]); }
    cineLights(ctx, W, H, L, dark); for (const g of G) cineGlow(ctx, ...g);
  }
  const vg = ctx.createRadialGradient(W / 2, H * .46, Math.min(W, H) * (dark ? .3 : .45), W / 2, H * .46, Math.max(W, H) * .78);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${dark ? .7 : .22})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  cineGrain(ctx, W, H, t);
}

/* ---------- captions: heavy white caps, key word in a red box, next word blurred in ---------- */
function drawCineCaptions(ctx, g, W, H, y, t, m, maxW) {
  const items = g.words.map(w => ({ ...w, hot: /\*/.test(w.text), s: w.text.replace(/\*/g, '').replace(/[,.;:]+$/, '').toUpperCase() })).filter(it => it.s);
  let size = m * .07; const font = z => `900 ${z}px "Poppins", ${FALLBACK}`; ctx.font = font(size);
  const pad = () => size * .22, spc = () => size * .28;
  const width = () => items.reduce((a, it) => a + ctx.measureText(it.s).width + (it.hot ? pad() * 2 : 0), 0) + spc() * (items.length - 1);
  while (width() > maxW && size > m * .035) { size *= .93; ctx.font = font(size); }
  const pop = ease.out(clamp((t - g.t0) / .12)), sc = .92 + .08 * pop;
  ctx.translate(W / 2, y); ctx.scale(sc, sc); ctx.translate(-W / 2, -y);
  let x = (W - width()) / 2; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const it of items) {
    const on = t >= it.t0 - .03, w = ctx.measureText(it.s).width + (it.hot ? pad() * 2 : 0);
    ctx.save();
    if (!on) { if ('filter' in ctx) ctx.filter = `blur(${(size * .11).toFixed(1)}px)`; ctx.globalAlpha *= .5; }
    if (it.hot && on) { rr(ctx, x - size * .03, y - size * .62, w + size * .06, size * 1.2, size * .2); ctx.fillStyle = '#e0252b'; ctx.fill(); }
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = it.hot && on ? 0 : size * .18; ctx.shadowOffsetY = size * .05;
    ctx.fillStyle = '#fff'; ctx.fillText(it.s, x + (it.hot ? pad() : 0), y + size * .04);
    ctx.restore(); x += w + spc();
  }
}

const CINE_GUIDE = `Estilo cinemático (padrão do app): personagens com proporção real, sem contorno, luz de cinema.
Iluminação: histórias normais (humor, dinheiro, dia a dia, motivação, curiosidade, notícia) usam mood "normal" ou "hope" e ficam CLARAS. Só use mood "mystery" (cena escura com feixe de luz, poste, lanterna) em terror, mistério, crime pesado ou suspense de verdade; "tense"/"danger" escurecem um pouco.
Em suspense/terror: abra com um gancho visual forte (obj "lock" com a notificação estranha, ou close assustado), use "shot":"close" nas reações, objetos como celular/porta/portão; perto do fim faça a pergunta para o público com obj "choice" (ex.: a:"PORTÃO", b:"QUARTO", cta:"QUAL VOCÊ DEIXARIA ENTRAR?") e, se for série, termine com obj "part2" (bg "dark").
Legendas: em cada fala marque UMA palavra-chave com *asteriscos* (vira uma caixa vermelha na tela).`;

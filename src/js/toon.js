/* ============ TOON: thick-outline cartoon characters (big head, expressive face) + illustrated objects ============ */
const INK = '#1c1b22';
let TL = 1; /* line scale: keeps outlines ~7px on a 1080p frame at any shot size */

function drawPerson(ctx, look, o, t) {
  const style = o.style || S.__drawP?.charStyle || 'toon';
  return style === 'classic' ? drawPersonClassic(ctx, look, o, t) : drawToon(ctx, look, o, t);
}

/* origin at the feet, 100 units tall, facing right */
function drawToon(ctx, look, o, t) {
  const { pose = 'stand', emotion = 'neutral', prop = 'none', facing = 1, h = 300, dim = 0, silhouette = false, talking = false } = o;
  const ph = t + (o.phase || 0), u = h / 100, A = poseAngles(pose, ph); const prevTL = TL; TL = clamp(6.5 / u, .45, 2.4) / 2.4;
  const skin = SKINS[look.skin] || look.skin || SKINS.s3, top = look.topColor || '#3b4a6b', pants = look.pants || '#2b2f38';
  const sil = c => (silhouette ? '#0f1116' : dim ? shade(c, -dim) : c), ink = silhouette ? '#0f1116' : dim ? shade(INK, -dim) : INK, OL = 2.4;
  const fillStroke = (fill, w = OL) => { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = w * TL; ctx.strokeStyle = ink; ctx.stroke(); };
  const ell = (x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); };
  const cap = (x1, y1, x2, y2, w, col) => { /* outlined capsule */
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink; ctx.lineWidth = w + OL * 2 * TL; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  const limbPts = (x, y, a1, l1, a2, l2) => { const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1, a = a1 + a2; return [ex, ey, ex + Math.sin(a) * l2, ey + Math.cos(a) * l2, a]; };
  ctx.save(); ctx.scale(facing * u, u);
  if (pose !== 'fall') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 0, 19, 3.4); ctx.fill(); }
  if (talking && (pose === 'stand' || pose === 'cross')) { A.uaF = -.55 + Math.sin(ph * 4.3) * .35; A.faF = -1.05 + Math.sin(ph * 5.7) * .35; A.head += Math.sin(ph * 3.1) * .04; }
  const sitDrop = A.lift ? 14 : 0; ctx.translate(0, A.bob * .8 + sitDrop); ctx.rotate(A.lean * .7);
  if (A.lift && !PLACE_FX.cabin) { ctx.beginPath(); rrp(ctx, -16, -14 - sitDrop + 14, 30, 14, 3); fillStroke(sil('#7a5a3a')); }
  const hipY = -26, shY = -50, longSleeve = ['hoodie', 'suit', 'uniform', 'jacket'].includes(look.top);
  const shoe = (x, y) => { ctx.beginPath(); rrp(ctx, x - 4, y - 2.6, 11, 5.6, 2.6); fillStroke(sil('#2a2a30')); };
  /* legs */
  for (const [lx, th, sh, back] of [[-4, A.thB, A.shB, 1], [4, A.thF, A.shF, 0]]) {
    const [kx, ky, fx, fy] = limbPts(lx, hipY, th * .9, 12, sh * .9, 12);
    const col = sil(back ? shade(pants, -.18) : pants); cap(lx, hipY, kx, ky, 8.5, col); cap(kx, ky, fx, fy, 8, col); shoe(fx, fy + 1);
  }
  /* back arm */
  const armW = 6.6, sleeve = sil(longSleeve ? shade(top, -.15) : shade(skin, -.12));
  { const [ex, ey, hx, hy] = limbPts(-9, shY + 3, A.uaB, 11, A.faB, 11); cap(-9, shY + 3, ex, ey, armW, sleeve); cap(ex, ey, hx, hy, armW - .4, sleeve); ell(hx, hy, 3.4, 3.4); fillStroke(sil(shade(skin, -.12))); }
  /* torso */
  ctx.beginPath(); ctx.moveTo(-12, shY + 2); ctx.quadraticCurveTo(-13.5, hipY - 6, -11, hipY + 2); ctx.lineTo(11, hipY + 2); ctx.quadraticCurveTo(13.5, hipY - 6, 12, shY + 2); ctx.quadraticCurveTo(0, shY - 3, -12, shY + 2); ctx.closePath();
  fillStroke(sil(top));
  ctx.save(); ctx.clip(); ctx.fillStyle = sil(shade(top, -.16)); ctx.fillRect(-14, shY, 7, 30); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(4, shY, 6, 30); ctx.restore();
  ctx.lineWidth = 1.4 * TL; ctx.strokeStyle = ink;
  if (look.top === 'suit') { ctx.beginPath(); ctx.moveTo(-5, shY); ctx.lineTo(0, shY + 12); ctx.lineTo(5, shY); ctx.closePath(); ctx.fillStyle = sil('#f2f2f2'); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-1.3, shY + 2); ctx.lineTo(1.3, shY + 2); ctx.lineTo(2, shY + 13); ctx.lineTo(0, shY + 16); ctx.lineTo(-2, shY + 13); ctx.closePath(); ctx.fillStyle = sil('#b8323a'); ctx.fill(); ctx.stroke(); }
  if (look.top === 'hoodie') { ctx.beginPath(); rrp(ctx, -7, hipY - 9, 14, 7, 2.5); fillStroke(sil(shade(top, -.1)), 1.4); ctx.beginPath(); ctx.moveTo(-2, shY + 2); ctx.lineTo(-2, shY + 10); ctx.moveTo(2, shY + 2); ctx.lineTo(2, shY + 9); ctx.stroke(); }
  if (look.top === 'uniform') { ctx.beginPath(); ctx.moveTo(0, shY + 1); ctx.lineTo(0, hipY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5, shY + 6); ctx.lineTo(9, shY + 6); ctx.lineTo(9.5, shY + 10); ctx.lineTo(7, shY + 12.5); ctx.lineTo(4.5, shY + 10); ctx.closePath(); ctx.fillStyle = sil('#e2bd4a'); ctx.fill(); ctx.stroke(); }
  if (look.top === 'jacket') { ctx.beginPath(); ctx.moveTo(-3, shY); ctx.lineTo(3, shY); ctx.lineTo(2, hipY + 2); ctx.lineTo(-2, hipY + 2); ctx.closePath(); ctx.fillStyle = sil('#f1efe9'); ctx.fill(); ctx.stroke(); }
  if (look.top === 'tshirt' || look.top === 'tank') { ctx.beginPath(); ctx.arc(0, shY + 1, 4.5, 0, Math.PI); ctx.stroke(); }
  if (look.shirtBrand && BRANDS[look.shirtBrand] && look.top !== 'suit') { ctx.save(); ctx.translate(-1, shY + 15); drawBrandBadge(ctx, look.shirtBrand, 0, 0, 5.2, { noText: look.top === 'uniform' }); ctx.restore(); }
  else if (look.print && (look.top === 'tshirt' || look.top === 'tank' || look.top === 'hoodie')) { ctx.save(); ctx.fillStyle = sil(shade(top, top === '#ffffff' ? -.5 : .55)); ctx.font = `900 3.8px Poppins, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; String(look.print).toUpperCase().split(/\s*\/\s*|\n/).slice(0, 2).forEach((l, i) => ctx.fillText(l.slice(0, 10), -1.5, shY + 13 + i * 4.6, 15)); ctx.restore(); }

  if (look.accessory === 'chain') { ctx.strokeStyle = sil('#e8c55a'); ctx.lineWidth = 1.6 * TL; ctx.beginPath(); ctx.arc(0, shY + 1, 6.5, .3, Math.PI - .3); ctx.stroke(); }
  if (look.accessory === 'badge' && look.top !== 'uniform') { ell(6, shY + 9, 2.2, 2.2); fillStroke(sil('#e2bd4a'), 1.2); }
  if (look.accessory === 'backpack') { ctx.beginPath(); rrp(ctx, -17, shY + 3, 7, 20, 3); fillStroke(sil('#3b5a40')); }
  /* head */
  ctx.save(); ctx.translate(0, shY - 1); ctx.rotate(A.head * .8);
  ell(0, -1, 4.5, 4); fillStroke(sil(shade(skin, -.12)));
  drawToonHead(ctx, look, emotion, ph, sil, skin, talking, ink, ell, fillStroke);
  ctx.restore();
  /* front arm + prop */
  const fsleeve = sil(longSleeve ? top : skin);
  const [ex, ey, hx, hy, ha] = limbPts(9, shY + 3, A.uaF, 11, A.faF, 11);
  cap(9, shY + 3, ex, ey, armW, fsleeve); cap(ex, ey, hx, hy, armW - .4, longSleeve ? fsleeve : sil(skin));
  if (look.top === 'tshirt') { ctx.save(); ctx.beginPath(); ctx.arc(9, shY + 3, 5.2, 0, 7); fillStroke(sil(top), 1.6); ctx.restore(); }
  if (look.accessory === 'watch') { ell(hx - Math.sin(ha) * 3.5, hy - Math.cos(ha) * 3.5, 2.2, 1.6); fillStroke(sil('#d0d3da'), 1); }
  drawProp(ctx, prop, hx, hy, ha, sil, pose);
  ell(hx, hy, 3.6, 3.6); fillStroke(sil(skin));
  ctx.restore(); TL = prevTL;
}

function drawToonHead(ctx, look, emotion, t, sil, skin, talking, ink, ell, fillStroke) {
  const cy = -20, hairC = sil(look.hairColor || '#2a1d16'), g = look.g === 'f' || ['long', 'bun'].includes(look.hair);
  /* back hair */
  if (look.hair === 'long') { ctx.beginPath(); ctx.moveTo(-15, cy - 4); ctx.quadraticCurveTo(-19, cy + 18, -11, cy + 24); ctx.lineTo(11, cy + 24); ctx.quadraticCurveTo(19, cy + 18, 15, cy - 4); ctx.closePath(); fillStroke(hairC); }
  if (look.hair === 'bun') { ell(0, cy - 21, 6, 5.5); fillStroke(hairC); }
  /* ears */
  for (const sx of [-1, 1]) { ell(sx * 15, cy + 2, 3.4, 4.4); fillStroke(sil(shade(skin, -.06))); }
  /* face: a tall rounded bean, wider jaw */
  ctx.beginPath(); ctx.moveTo(0, cy - 19); ctx.bezierCurveTo(13, cy - 19, 16, cy - 6, 15.5, cy + 4); ctx.bezierCurveTo(15, cy + 15, 8, cy + 19, 0, cy + 19); ctx.bezierCurveTo(-8, cy + 19, -15, cy + 15, -15.5, cy + 4); ctx.bezierCurveTo(-16, cy - 6, -13, cy - 19, 0, cy - 19); ctx.closePath();
  fillStroke(sil(skin));
  ctx.save(); ctx.clip(); ctx.fillStyle = sil(shade(skin, -.1)); ctx.beginPath(); ctx.ellipse(-12, cy + 6, 6, 14, 0, 0, 7); ctx.fill(); ctx.restore();
  /* stubble / beard */
  /* stubble: short hand-drawn hatch marks on jaw, chin and upper lip */
  if (look.beard === 'stubble' || look.beard === 'beard') {
    ctx.save(); ctx.strokeStyle = sil(shade(look.hairColor || '#2a1d16', .05)); ctx.lineCap = 'round'; ctx.lineWidth = .8 * TL;
    const r = seeded(11 + (look.skin || '').length);
    for (let i = 0; i < 44; i++) { const a = Math.PI * (.08 + r() * .84), rr = 9 + r() * 6.5, x = Math.cos(a) * rr * 1.02, y = cy + 4 + Math.sin(a) * rr * .95; if (Math.abs(x) < 3.5 && y < cy + 9) continue; const ang = a + Math.PI / 2 + (r() - .5) * .6, l = .7 + r() * .6; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * l * .5, y - Math.sin(ang) * l * .5); ctx.lineTo(x + Math.cos(ang) * l * .5, y + Math.sin(ang) * l * .5); ctx.stroke(); }
    for (let i = 0; i < 10; i++) { const x = -5 + i * 1.2 + (r() - .5), y = cy + 9.2 + (r() - .5) * .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .2, y + .8); ctx.stroke(); }
    ctx.restore();
  }
  if (look.beard === 'beard') {
    const bc = sil(look.hairColor || '#2a1d16');
    ctx.beginPath(); ctx.moveTo(-15.4, cy + 2); ctx.bezierCurveTo(-15, cy + 15, -8, cy + 20.5, 0, cy + 20.5); ctx.bezierCurveTo(8, cy + 20.5, 15, cy + 15, 15.4, cy + 2); ctx.quadraticCurveTo(12, cy + 8.5, 7, cy + 8); ctx.quadraticCurveTo(3, cy + 7.6, 0, cy + 8.6); ctx.quadraticCurveTo(-3, cy + 7.6, -7, cy + 8); ctx.quadraticCurveTo(-12, cy + 8.5, -15.4, cy + 2); ctx.closePath(); fillStroke(bc, 1.6);
    ctx.save(); ctx.clip(); ctx.strokeStyle = sil(shade(look.hairColor || '#2a1d16', .28)); ctx.lineWidth = .7 * TL; ctx.lineCap = 'round'; const r = seeded(5);
    for (let i = 0; i < 60; i++) { const x = (r() - .5) * 30, y = cy + 6 + r() * 16, a = Math.atan2(y - cy, x) + Math.PI / 2 * .2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * .2, y + 1.1); ctx.stroke(); }
    ctx.restore();
  }
  if (emotion === 'happy' || emotion === 'confident' || g) { ctx.fillStyle = 'rgba(232,96,96,.22)'; ell(-9.5, cy + 6, 3.4, 2); ctx.fill(); ell(10.5, cy + 6, 3.4, 2); ctx.fill(); }
  /* eyes */
  const wide = emotion === 'scared' || emotion === 'shocked', blink = (t % 3.4) < .1;
  const look2 = Math.sin(t * .7) * .6 + 1.2;
  for (const ex of [-6, 6.5]) {
    const rx = wide ? 5.4 : 4.6, ry = blink ? .7 : wide ? 6.6 : 5.6;
    ell(ex, cy - 2, rx, ry); fillStroke(sil('#ffffff'), 1.5);
    if (!blink) {
      const pr = wide ? 1.9 : 2.6; ctx.fillStyle = ink; ell(ex + look2, cy - 1.2, pr, pr); ctx.fill(); ctx.fillStyle = '#fff'; ell(ex + look2 + .6, cy - 1.9, .55, .55); ctx.fill();
      if (emotion === 'sad' || emotion === 'confident' || emotion === 'angry') { ctx.save(); ell(ex, cy - 2, rx, ry); ctx.clip(); ctx.fillStyle = sil(skin); ctx.fillRect(ex - 7, cy - 10, 14, emotion === 'confident' ? 6 : 5.5); ctx.lineWidth = 1.6 * TL; ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(ex - 7, cy - 4.5 + (emotion === 'confident' ? .5 : 0)); ctx.lineTo(ex + 7, cy - 4.5 + (emotion === 'confident' ? .5 : 0)); ctx.stroke(); ctx.restore(); }
    }
    if (g && !blink) { ctx.strokeStyle = ink; ctx.lineWidth = 1.2 * TL; ctx.beginPath(); ctx.moveTo(ex + (ex > 0 ? 3.6 : -3.6), cy - 6); ctx.lineTo(ex + (ex > 0 ? 5.6 : -5.6), cy - 8); ctx.stroke(); }
  }
  /* brows */
  const B = { neutral: [0, 0], happy: [-1, .3], confident: [.5, -.6], worried: [-1.4, 1.6], sad: [-1, 1.4], angry: [1.6, -2.2], scared: [-2.2, 1.4], shocked: [-3, 0] }[emotion] || [0, 0];
  ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = 2.6 * TL;
  for (const [x0, x1, s] of [[-10, -2.5, -1], [3, 10.5, 1]]) { ctx.beginPath(); ctx.moveTo(x0, cy - 10 + B[0] + (s < 0 ? -B[1] : 0)); ctx.lineTo(x1, cy - 10 + B[0] + (s > 0 ? -B[1] : 0)); ctx.stroke(); }
  /* nose */
  ctx.beginPath(); ctx.ellipse(2.5, cy + 4.5, 4, 3.2, 0, 0, 7); fillStroke(sil(shade(skin, -.08)), 1.8);

  /* mouth */
  const my = cy + 11.5; ctx.lineWidth = 2 * TL; ctx.strokeStyle = ink;
  const open = (w, hgt, teeth = true) => {
    ctx.beginPath(); ctx.moveTo(-w, my - .5); ctx.quadraticCurveTo(0, my - 1.5, w, my - .5); ctx.quadraticCurveTo(w * .9, my + hgt, 0, my + hgt); ctx.quadraticCurveTo(-w * .9, my + hgt, -w, my - .5); ctx.closePath();
    fillStroke(sil('#5a1e22'), 2);
    ctx.save(); ctx.clip();
    if (teeth) { ctx.fillStyle = '#fbfbf6'; ctx.fillRect(-w, my - 2, w * 2, Math.min(2.6, hgt * .4)); }
    ctx.fillStyle = sil('#e0606a'); ell(0, my + hgt, w * .7, hgt * .45); ctx.fill(); ctx.restore();
  };
  if (talking) { const k = Math.abs(Math.sin(t * 12)) * .7 + Math.abs(Math.sin(t * 6.7)) * .4; open(4.5 + k, 1.5 + k * 4.5); }
  else if (emotion === 'shocked' || emotion === 'scared') open(5.5, emotion === 'shocked' ? 8 : 5);
  else if (emotion === 'happy') open(6.5, 4.5);
  else if (emotion === 'angry') { ctx.beginPath(); rrp(ctx, -5, my - 1, 10, 4, 1.5); fillStroke('#fbfbf6', 1.8); ctx.lineWidth = 1 * TL; ctx.beginPath(); ctx.moveTo(-5, my + 1); ctx.lineTo(5, my + 1); for (let x = -2.5; x < 5; x += 2.5) { ctx.moveTo(x, my - 1); ctx.lineTo(x, my + 3); } ctx.stroke(); }
  else if (emotion === 'sad' || emotion === 'worried') { ctx.beginPath(); ctx.moveTo(-4.5, my + 2.5); ctx.quadraticCurveTo(0, my - 1.5, 4.5, my + 2.5); ctx.stroke(); }
  else if (emotion === 'confident') { ctx.beginPath(); ctx.moveTo(-4, my + .5); ctx.quadraticCurveTo(1, my + 3, 5.5, my - 1.5); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(-4, my); ctx.quadraticCurveTo(0, my + 2.2, 4, my); ctx.stroke(); }
  /* hair on top */
  const hairTop = () => { ctx.beginPath(); ctx.moveTo(-15.5, cy - 1); ctx.bezierCurveTo(-17, cy - 22, 15, cy - 26, 16, cy - 4); ctx.quadraticCurveTo(10, cy - 12, 2, cy - 12); ctx.quadraticCurveTo(-8, cy - 12, -12, cy - 5); ctx.quadraticCurveTo(-13.5, cy - 3, -15.5, cy - 1); ctx.closePath(); fillStroke(hairC); };
  if (look.hair === 'short' || look.hair === 'long' || look.hair === 'bun') { hairTop(); }
  if (look.hair === 'buzz') { ctx.save(); ctx.beginPath(); ctx.moveTo(-15, cy - 3); ctx.bezierCurveTo(-15, cy - 21, 15, cy - 21, 15, cy - 3); ctx.quadraticCurveTo(0, cy - 13, -15, cy - 3); ctx.closePath(); ctx.fillStyle = hairC; ctx.globalAlpha *= .85; ctx.fill(); ctx.restore(); }
  if (look.hair === 'curly') { for (const [x, y, r] of [[-12, cy - 8, 5], [-7, cy - 15, 5.5], [0, cy - 18, 5.8], [7, cy - 16, 5.5], [12.5, cy - 10, 5], [-14.5, cy - 1, 4]]) { ell(x, y, r, r); fillStroke(hairC, 1.8); } }
  if (look.hair === 'bald') { ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(-5, cy - 14, 4, 2, -.4); ctx.fill(); }
  if (look.hair === 'cap') {
    const cc = sil(look.topColor ? shade(look.topColor, .05) : '#c0393b');
    ctx.beginPath(); ctx.moveTo(-16.5, cy - 7); ctx.bezierCurveTo(-17, cy - 28, 17, cy - 28, 16.5, cy - 7); ctx.closePath(); fillStroke(cc);
    ctx.beginPath(); ctx.moveTo(8, cy - 8); ctx.quadraticCurveTo(24, cy - 10, 26, cy - 5); ctx.quadraticCurveTo(16, cy - 4, 8, cy - 5); ctx.closePath(); fillStroke(sil(shade(look.topColor || '#c0393b', -.15)));
    ell(0, cy - 21.5, 2.2, 1.4); fillStroke(cc, 1.4);
    if (look.capBrand && BRANDS[look.capBrand]) { ctx.save(); ctx.translate(-1, cy - 15); ctx.rotate(-.08); drawBrandBadge(ctx, look.capBrand, 0, 0, 6.4); ctx.restore(); }
    else if (look.capText) { ctx.save(); ctx.translate(-1, cy - 14); ctx.rotate(-.08); ctx.beginPath(); rrp(ctx, -9, -3, 18, 6, 1); fillStroke(sil('#f4efe2'), 1.2); ctx.fillStyle = INK; ctx.font = `900 3.4px Poppins, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(look.capText).toUpperCase().slice(0, 10), 0, .3, 16); ctx.restore(); }
  }
  if (look.accessory === 'glasses') { ctx.lineWidth = 1.6 * TL; ctx.strokeStyle = ink; ell(-6, cy - 2, 5.6, 5); ctx.stroke(); ell(6.5, cy - 2, 5.6, 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-.4, cy - 2); ctx.lineTo(.9, cy - 2); ctx.stroke(); }
  /* sweat when nervous */
  if (emotion === 'worried' || emotion === 'scared' || emotion === 'shocked') {
    for (const [x, y, d] of [[17, cy - 6, 0], [-17.5, cy + 2, .5]]) { const k = ((t * .9 + d) % 1); ctx.save(); ctx.translate(x, y + k * 6); ctx.globalAlpha *= 1 - k * .6; ctx.beginPath(); ctx.moveTo(0, -3.2); ctx.quadraticCurveTo(2.6, 1, 0, 2.4); ctx.quadraticCurveTo(-2.6, 1, 0, -3.2); fillStroke('#9fd3f0', 1.2); ctx.restore(); }
  }
}

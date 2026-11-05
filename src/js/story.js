/* ============ STORY: narrated illustrated scenes (character rig + places + camera) ============ */
const SKINS = { s1: '#f3d2b5', s2: '#e2b48f', s3: '#c98e64', s4: '#9a6542', s5: '#6b4429' };
const HAIRS = ['short', 'buzz', 'curly', 'long', 'bald', 'cap', 'bun'];
const TOPS = ['tshirt', 'hoodie', 'suit', 'tank', 'uniform', 'jacket'];
const ACCS = ['none', 'chain', 'glasses', 'watch', 'backpack', 'badge'];
const PROPS = ['none', 'phone', 'money', 'briefcase', 'bag', 'radio', 'book', 'coffee', 'clipboard', 'box'];
const POSES = ['stand', 'walk', 'run', 'point', 'think', 'cross', 'celebrate', 'phone', 'sad', 'scared', 'sit', 'hold'];
const EMOTIONS = ['neutral', 'happy', 'confident', 'worried', 'sad', 'angry', 'scared', 'shocked'];
const PLACES = ['city', 'favela', 'street', 'office', 'room', 'prison', 'school', 'hospital', 'shop', 'field', 'void', 'bank'];
const PLACE_NAMES = { city: 'Cidade', favela: 'Comunidade no morro', street: 'Rua', office: 'Escritório', room: 'Quarto', prison: 'Cela', school: 'Escola', hospital: 'Hospital', shop: 'Comércio / bar', field: 'Estrada / campo', void: 'Fundo dramático', bank: 'Cofre / dinheiro' };
const MOODS = ['normal', 'tense', 'danger', 'flashback', 'hope'];
const CAMERAS = ['push', 'pull', 'panL', 'panR', 'shake', 'still'];
const ICONS = ['', 'money', 'clock', 'alert', 'heart', 'x', 'check', 'arrow', 'question'];
const TIMES = ['day', 'dusk', 'night'];

const DEFAULT_CAST = [
  { id: 'hero', name: 'Protagonista', skin: 's3', hair: 'short', hairColor: '#2a1d16', beard: 'stubble', top: 'hoodie', topColor: '#3b4a6b', pants: '#2b2f38', accessory: 'none' },
  { id: 'boss', name: 'Chefe', skin: 's2', hair: 'buzz', hairColor: '#1b1612', beard: 'beard', top: 'suit', topColor: '#1f2228', pants: '#1a1c20', accessory: 'watch' },
  { id: 'friend', name: 'Amigo', skin: 's4', hair: 'curly', hairColor: '#120d0a', beard: 'none', top: 'tshirt', topColor: '#c2553b', pants: '#33415c', accessory: 'chain' },
  { id: 'woman', name: 'Mulher', skin: 's1', hair: 'long', hairColor: '#5a3622', beard: 'none', top: 'jacket', topColor: '#7a3b52', pants: '#22252c', accessory: 'none', g: 'f' },
  { id: 'officer', name: 'Policial', skin: 's2', hair: 'cap', hairColor: '#1f2433', beard: 'none', top: 'uniform', topColor: '#26324a', pants: '#1c2333', accessory: 'badge' },
];
function castOf(P, who) { const c = (P.cast || DEFAULT_CAST); return c.find(x => x.id === who) || c[0] || DEFAULT_CAST[0]; }

/* ---------- color helpers ---------- */
function shade(hex, k) {
  let r, g, b; const m = String(hex).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) { r = +m[1]; g = +m[2]; b = +m[3]; } else { const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function seeded(n) { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

/* ---------- pose library: angles in radians (0 = straight down, + = toward facing) ---------- */
function poseAngles(pose, t) {
  const br = Math.sin(t * 2.2) * .02;
  const A = { uaB: .12 + br, faB: .18, uaF: -.06 - br, faF: .2, thB: .02, shB: .02, thF: -.04, shF: .03, lean: 0, head: 0, lift: 0, bob: Math.sin(t * 2.2) * .4 };
  const w = t * Math.PI * 2 * 1.5;
  switch (pose) {
    case 'walk': Object.assign(A, { thF: Math.sin(w) * .42, thB: -Math.sin(w) * .42, shF: Math.max(0, -Math.cos(w)) * .55, shB: Math.max(0, Math.cos(w)) * .55, uaF: -Math.sin(w) * .4, uaB: Math.sin(w) * .4, faF: .35, faB: .35, bob: Math.abs(Math.cos(w)) * -1.4, lean: .04 }); break;
    case 'run': { const r = t * Math.PI * 2 * 2.3; Object.assign(A, { thF: Math.sin(r) * .8, thB: -Math.sin(r) * .8, shF: Math.max(0, -Math.cos(r)) * 1.3, shB: Math.max(0, Math.cos(r)) * 1.3, uaF: -Math.sin(r) * .9, uaB: Math.sin(r) * .9, faF: 1.5, faB: 1.5, bob: Math.abs(Math.cos(r)) * -2.6, lean: .16 }); break; }
    case 'point': Object.assign(A, { uaF: -1.45 + Math.sin(t * 3) * .03, faF: .05, head: .04 }); break;
    case 'think': Object.assign(A, { uaF: .5, faF: -2.45, head: -.08, uaB: .55, faB: -1.5 }); break;
    case 'cross': Object.assign(A, { uaF: .45, faF: -1.75, uaB: .42, faB: -1.85 }); break;
    case 'celebrate': { const j = Math.abs(Math.sin(t * 5)); Object.assign(A, { uaF: -2.75 + j * .2, faF: -.2, uaB: -2.6 + j * .2, faB: -.25, bob: -j * 4, head: -.1 }); break; }
    case 'phone': Object.assign(A, { uaF: .2, faF: -2.6, head: .06 }); break;
    case 'sad': Object.assign(A, { uaF: .02, faF: .05, uaB: .03, faB: .05, lean: .1, head: .28, bob: Math.sin(t * 1.4) * .3 }); break;
    case 'scared': { const tr = Math.sin(t * 38) * .03; Object.assign(A, { uaF: -.75 + tr, faF: -1.55, uaB: -.6 - tr, faB: -1.5, lean: -.08, head: -.06, thF: -.12, thB: .1 }); break; }
    case 'sit': Object.assign(A, { thF: -1.5, shF: 1.45, thB: -1.45, shB: 1.4, uaF: .35, faF: -.9, uaB: .3, faB: -.8, lift: 1 }); break;
    case 'hold': Object.assign(A, { uaF: .32, faF: -1.25, uaB: .3, faB: -1.15 }); break;
  }
  return A;
}

/* ---------- character rig: draws at feet (0,0), 100 units tall, facing right ---------- */
function drawPersonClassic(ctx, look, o, t) {
  const { pose = 'stand', emotion = 'neutral', prop = 'none', facing = 1, h = 300, dim = 0, silhouette = false } = o;
  const u = h / 100, A = poseAngles(pose, t + (o.phase || 0));
  const skin = SKINS[look.skin] || look.skin || SKINS.s3, top = look.topColor || '#3b4a6b', pants = look.pants || '#2b2f38';
  const sil = c => (silhouette ? '#0f1116' : dim ? shade(c, -dim) : c);
  ctx.save(); ctx.scale(facing * u, u);
  /* ground shadow */
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 3.2, 0, 0, 7); ctx.fill();
  const sitDrop = A.lift ? 24 : 0;
  ctx.translate(0, A.bob + sitDrop);
  if (A.lift) { ctx.fillStyle = sil('#5a4632'); rrp(ctx, -16, -26 - sitDrop + 26, 26, 26 - 0.01, 2); ctx.fill(); ctx.fillStyle = sil('#4a3a2a'); ctx.fillRect(-16, -sitDrop + 22, 26, 4); }
  const hipY = -50, shY = -78;
  const limb = (x, y, a1, l1, a2, l2, w1, w2, col, endFn) => {
    const ex = x + Math.sin(a1) * l1, ey = y + Math.cos(a1) * l1, a = a1 + a2, wx = ex + Math.sin(a) * l2, wy = ey + Math.cos(a) * l2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
    ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(wx, wy); ctx.stroke();
    endFn?.(wx, wy, a); return [wx, wy, a];
  };
  const shoe = (x, y, a) => { ctx.fillStyle = sil('#1a1a1d'); ctx.save(); ctx.translate(x, y); ctx.rotate(-a * .3); rrp(ctx, -3, -1.5, 9, 4, 1.8); ctx.fill(); ctx.fillStyle = sil('#e9e9ec'); ctx.fillRect(-3, 1.6, 9, .9); ctx.restore(); };
  const longSleeve = ['hoodie', 'suit', 'uniform', 'jacket'].includes(look.top);
  const armCol = longSleeve ? top : skin;
  const hand = (x, y) => { ctx.fillStyle = sil(skin); ctx.beginPath(); ctx.arc(x, y, 2.7, 0, 7); ctx.fill(); };
  /* back limbs */
  ctx.save(); ctx.translate(0, 0); ctx.rotate(A.lean);
  limb(-2.5, hipY, A.thB, 24, A.shB, 23, 8.2, 6.6, sil(shade(pants, -.25)), shoe);
  const backArmTop = look.top === 'tshirt' ? shade(top, -.2) : shade(armCol, -.2);
  if (look.top === 'tshirt') { limb(-7, shY + 2, A.uaB, 15, A.faB, 14, 6.4, 5.2, sil(shade(skin, -.18)), (x, y) => { ctx.fillStyle = sil(shade(skin, -.18)); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }); ctx.strokeStyle = sil(backArmTop); ctx.lineWidth = 7.2; ctx.beginPath(); ctx.moveTo(-7, shY + 2); ctx.lineTo(-7 + Math.sin(A.uaB) * 7, shY + 2 + Math.cos(A.uaB) * 7); ctx.stroke(); }
  else limb(-7, shY + 2, A.uaB, 15, A.faB, 14, look.top === 'tank' ? 5.6 : 6.8, look.top === 'tank' ? 5 : 5.8, sil(backArmTop), (x, y) => { ctx.fillStyle = sil(shade(skin, -.18)); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); });
  if (look.accessory === 'backpack') { ctx.fillStyle = sil('#2d3a2f'); rrp(ctx, -15, shY + 2, 9, 22, 3); ctx.fill(); }
  /* front leg */
  limb(2.5, hipY, A.thF, 24, A.shF, 23, 8.4, 6.8, sil(pants), shoe);
  /* torso */
  const tg = ctx.createLinearGradient(-11, 0, 11, 0); tg.addColorStop(0, sil(shade(top, -.18))); tg.addColorStop(.55, sil(top)); tg.addColorStop(1, sil(shade(top, .1)));
  ctx.fillStyle = tg; ctx.beginPath();
  ctx.moveTo(-10, shY); ctx.quadraticCurveTo(0, shY - 2.5, 10.5, shY); ctx.lineTo(9, hipY + 2); ctx.quadraticCurveTo(0, hipY + 4, -9, hipY + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = sil(shade(pants, .05)); rrp(ctx, -9, hipY - 1, 18, 6, 2); ctx.fill();
  if (look.top === 'suit') { ctx.fillStyle = sil('#eef0f3'); ctx.beginPath(); ctx.moveTo(-3, shY - 1); ctx.lineTo(3.5, shY - 1); ctx.lineTo(.3, shY + 13); ctx.closePath(); ctx.fill(); ctx.fillStyle = sil('#8a1f2a'); ctx.beginPath(); ctx.moveTo(-.6, shY); ctx.lineTo(1.4, shY); ctx.lineTo(1.6, shY + 12); ctx.lineTo(.3, shY + 14); ctx.lineTo(-.8, shY + 12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = sil(shade(top, -.35)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-3, shY); ctx.lineTo(.3, shY + 16); ctx.lineTo(3.5, shY); ctx.stroke(); }
  if (look.top === 'hoodie') { ctx.fillStyle = sil(shade(top, -.12)); ctx.beginPath(); ctx.ellipse(-2, shY + 1, 7, 3.4, 0, 0, 7); ctx.fill(); ctx.strokeStyle = sil('#e8e8ea'); ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(1, shY + 2); ctx.lineTo(1.5, shY + 10); ctx.moveTo(3.5, shY + 2); ctx.lineTo(4, shY + 9); ctx.stroke(); ctx.fillStyle = sil(shade(top, -.1)); rrp(ctx, -5, hipY - 12, 12, 7, 2); ctx.fill(); }
  if (look.top === 'uniform') { ctx.strokeStyle = sil(shade(top, -.3)); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(1, shY); ctx.lineTo(1, hipY); ctx.stroke(); ctx.fillStyle = sil('#d9b54a'); ctx.beginPath(); ctx.moveTo(4, shY + 7); ctx.lineTo(7, shY + 7); ctx.lineTo(7.5, shY + 10); ctx.lineTo(5.5, shY + 12); ctx.lineTo(3.5, shY + 10); ctx.closePath(); ctx.fill(); }
  if (look.top === 'jacket') { ctx.fillStyle = sil(shade(top, .5)); ctx.beginPath(); ctx.moveTo(-1, shY); ctx.lineTo(4, shY); ctx.lineTo(2.5, hipY + 1); ctx.lineTo(-.5, hipY + 1); ctx.closePath(); ctx.fill(); }
  if (look.accessory === 'chain') { ctx.strokeStyle = sil('#e3c15a'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(1, shY - 2, 6, .35, Math.PI - .35); ctx.stroke(); }
  if (look.accessory === 'badge' && look.top !== 'uniform') { ctx.fillStyle = sil('#d9b54a'); ctx.beginPath(); ctx.arc(5, shY + 9, 1.8, 0, 7); ctx.fill(); }
  /* neck + head */
  ctx.save(); ctx.translate(1, shY - 1); ctx.rotate(A.head);
  ctx.fillStyle = sil(shade(skin, -.12)); rrp(ctx, -2.6, -6, 5.6, 7, 2); ctx.fill();
  drawHead(ctx, look, emotion, t + (o.phase || 0), sil, skin, o.talking);
  ctx.restore();
  /* front arm + prop */
  const frontArm = look.top === 'tank' ? skin : armCol;
  const [hx, hy, ha] = limb(7.5, shY + 2, A.uaF, 15, A.faF, 14, look.top === 'tank' ? 5.8 : 7, look.top === 'tank' ? 5.2 : 6, sil(look.top === 'tshirt' ? skin : frontArm));
  if (look.top === 'tshirt') { ctx.strokeStyle = sil(shade(top, .02)); ctx.lineWidth = 7.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(7.5, shY + 2); ctx.lineTo(7.5 + Math.sin(A.uaF) * 7, shY + 2 + Math.cos(A.uaF) * 7); ctx.stroke(); }
  if (look.accessory === 'watch') { ctx.fillStyle = sil('#c9ccd3'); ctx.beginPath(); ctx.arc(hx - Math.sin(ha) * 3, hy - Math.cos(ha) * 3, 1.6, 0, 7); ctx.fill(); }
  drawProp(ctx, prop, hx, hy, ha, sil, pose);
  hand(hx, hy);
  ctx.restore();
  ctx.restore();
}
function rrp(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function drawHead(ctx, look, emotion, t, sil, skin, talking) {
  const hy = -12; /* head center relative to neck top */
  const hairC = look.hairColor || '#2a1d16';
  /* back hair */
  if (look.hair === 'long') { ctx.fillStyle = sil(shade(hairC, -.1)); ctx.beginPath(); ctx.moveTo(-7, hy - 2); ctx.quadraticCurveTo(-9, hy + 10, -6, hy + 16); ctx.lineTo(3, hy + 12); ctx.lineTo(3, hy); ctx.closePath(); ctx.fill(); }
  if (look.hair === 'bun') { ctx.fillStyle = sil(hairC); ctx.beginPath(); ctx.arc(-6, hy - 6, 3.4, 0, 7); ctx.fill(); }
  /* ear + face */
  const fg = ctx.createRadialGradient(2, hy - 2, 1, 0, hy, 9); fg.addColorStop(0, sil(shade(skin, .08))); fg.addColorStop(1, sil(shade(skin, -.12)));
  ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, hy, 6.4, 7.6, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4.5, hy + 3); ctx.quadraticCurveTo(6.8, hy + 6.5, 2.5, hy + 7.4); ctx.lineTo(0, hy + 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = sil(shade(skin, -.2)); ctx.beginPath(); ctx.ellipse(-4.4, hy + .6, 1.4, 2.1, 0, 0, 7); ctx.fill();
  /* beard */
  if (look.beard === 'beard') { ctx.fillStyle = sil(hairC); ctx.beginPath(); ctx.moveTo(-4.8, hy + 1); ctx.quadraticCurveTo(-4, hy + 8.5, 1.5, hy + 8.2); ctx.quadraticCurveTo(5.8, hy + 7, 6.2, hy + 2.5); ctx.lineTo(5, hy + 3); ctx.quadraticCurveTo(2, hy + 6, -3, hy + 2); ctx.closePath(); ctx.fill(); }
  if (look.beard === 'stubble') { ctx.fillStyle = sil(hairC); ctx.globalAlpha *= .28; ctx.beginPath(); ctx.ellipse(1.2, hy + 4.6, 5, 3.2, 0, 0, Math.PI); ctx.fill(); ctx.globalAlpha /= .28; }
  /* eyes (3/4 view, facing right) */
  const blink = (t % 3.7) < .12 ? .15 : 1;
  const wide = emotion === 'scared' || emotion === 'shocked' ? 1.35 : 1;
  for (const ex of [1.2, 4.7]) {
    ctx.fillStyle = sil('#fbfbfb'); ctx.beginPath(); ctx.ellipse(ex, hy - .8, 1.35 * wide, 1.15 * wide * blink, 0, 0, 7); ctx.fill();
    ctx.fillStyle = sil('#2a1c14'); ctx.beginPath(); ctx.arc(ex + .35, hy - .7, .8 * Math.min(1, wide) * (blink < 1 ? .3 : 1), 0, 7); ctx.fill();
  }
  /* brows */
  const br = { neutral: [0, 0], happy: [-.3, .1], confident: [.25, -.15], worried: [-.6, .5], sad: [-.5, .55], angry: [.75, -.6], scared: [-.9, .4], shocked: [-1.1, 0] }[emotion] || [0, 0];
  ctx.strokeStyle = sil(shade(hairC, .05)); ctx.lineWidth = .85; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-.2, hy - 3 + br[0] * .4 - br[1]); ctx.lineTo(2.4, hy - 3.1 + br[0]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3.6, hy - 3.1 + br[0]); ctx.lineTo(6, hy - 3 + br[0] * .4 - br[1]); ctx.stroke();
  /* nose */
  ctx.strokeStyle = sil(shade(skin, -.3)); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(4.2, hy - .2); ctx.quadraticCurveTo(6.6, hy + 2.6, 4.6, hy + 2.9); ctx.stroke();
  /* mouth */
  ctx.strokeStyle = sil('#5b2a22'); ctx.lineWidth = .75; ctx.fillStyle = sil('#4a1f1a');
  const mx = 3.2, my = hy + 4.8;
  ctx.beginPath();
  if (talking) { const o = Math.abs(Math.sin(t * 13)) * .7 + Math.abs(Math.sin(t * 7.3)) * .5; ctx.ellipse(mx, my + .2, 1.5 + o * .3, .25 + o * 1.25, 0, 0, 7); ctx.fill(); }
  else if (emotion === 'happy') { ctx.moveTo(mx - 2.1, my - .4); ctx.quadraticCurveTo(mx, my + 2, mx + 2, my - .6); ctx.stroke(); }
  else if (emotion === 'confident') { ctx.moveTo(mx - 1.8, my); ctx.quadraticCurveTo(mx, my + .6, mx + 2, my - .8); ctx.stroke(); }
  else if (emotion === 'sad' || emotion === 'worried') { ctx.moveTo(mx - 1.8, my + .7); ctx.quadraticCurveTo(mx, my - .8, mx + 1.8, my + .6); ctx.stroke(); }
  else if (emotion === 'angry') { ctx.moveTo(mx - 1.8, my + .4); ctx.lineTo(mx + 1.8, my); ctx.stroke(); }
  else if (emotion === 'scared' || emotion === 'shocked') { ctx.ellipse(mx, my + .2, emotion === 'shocked' ? 1.4 : 1.1, emotion === 'shocked' ? 1.8 : 1.1, 0, 0, 7); ctx.fill(); }
  else { ctx.moveTo(mx - 1.7, my + .1); ctx.lineTo(mx + 1.7, my); ctx.stroke(); }
  /* hair on top */
  ctx.fillStyle = sil(hairC);
  if (look.hair === 'short' || look.hair === 'long' || look.hair === 'bun') { ctx.beginPath(); ctx.moveTo(-6.6, hy + 1); ctx.quadraticCurveTo(-7.6, hy - 9.5, 1, hy - 8.6); ctx.quadraticCurveTo(7.2, hy - 8, 6.6, hy - 3.2); ctx.quadraticCurveTo(3, hy - 6.2, -3.6, hy - 3.6); ctx.quadraticCurveTo(-4.5, hy - 1, -4.9, hy + 1.2); ctx.closePath(); ctx.fill(); }
  if (look.hair === 'buzz') { ctx.globalAlpha *= .85; ctx.beginPath(); ctx.ellipse(-.5, hy - 3.3, 6.5, 4.8, 0, Math.PI * .98, Math.PI * 2.02); ctx.fill(); ctx.globalAlpha /= .85; }
  if (look.hair === 'curly') { for (const [x, y, r] of [[-5, hy - 4, 3], [-2.5, hy - 7, 3.2], [1, hy - 8, 3.2], [4.4, hy - 6.6, 2.8], [-6, hy - .5, 2.4], [6.2, hy - 4, 2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); } }
  if (look.hair === 'cap') { ctx.fillStyle = sil(shade(look.topColor || '#26324a', -.1)); ctx.beginPath(); ctx.ellipse(0, hy - 4.2, 6.9, 4.8, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-6.9, hy - 4.6, 13.8, 1.5); ctx.beginPath(); ctx.moveTo(5, hy - 3.6); ctx.quadraticCurveTo(11, hy - 3.4, 11.4, hy - 2.2); ctx.lineTo(5, hy - 2.4); ctx.closePath(); ctx.fill(); }
  if (look.accessory === 'glasses') { ctx.strokeStyle = sil('#15161a'); ctx.lineWidth = .7; ctx.beginPath(); ctx.ellipse(1.2, hy - .8, 1.9, 1.6, 0, 0, 7); ctx.moveTo(6.6, hy - .8); ctx.ellipse(4.8, hy - .8, 1.9, 1.6, 0, 0, 7); ctx.moveTo(3.1, hy - 1); ctx.lineTo(2.9, hy - 1); ctx.moveTo(-.7, hy - 1); ctx.lineTo(-5, hy - 1.6); ctx.stroke(); }
}

function drawProp(ctx, prop, x, y, a, sil, pose) {
  if (!prop || prop === 'none') return;
  ctx.save(); ctx.translate(x, y);
  const r = pose === 'phone' ? -0.3 : -a * .2; ctx.rotate(r);
  switch (prop) {
    case 'gun': ctx.fillStyle = sil('#17181b'); ctx.fillRect(-1.5, -2.2, 9, 2.6); ctx.fillRect(-1.5, -1, 2.6, 5); ctx.fillStyle = sil('#3a3c40'); ctx.fillRect(6, -2.2, 1.6, 1.2); break;
    case 'knife': ctx.fillStyle = sil('#3a2a1e'); ctx.fillRect(-1, -1, 2, 4); ctx.fillStyle = sil('#cfd3d8'); ctx.beginPath(); ctx.moveTo(-1, -1); ctx.lineTo(0, -9); ctx.lineTo(1.2, -1); ctx.fill(); break;
    case 'cash': ctx.fillStyle = sil('#2e8b57'); ctx.fillRect(-4, -2, 8, 4.5); ctx.fillStyle = sil('#9fe0b4'); ctx.fillRect(-1, -1, 2, 2.5); break;
    case 'bottle': ctx.fillStyle = sil('#2f6f3a'); ctx.fillRect(-1.6, -7, 3.2, 8); ctx.fillRect(-.7, -10, 1.4, 3); break;
    case 'key': ctx.strokeStyle = sil('#d9b54a'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -3, 1.6, 0, 7); ctx.moveTo(0, -1.4); ctx.lineTo(0, 3); ctx.lineTo(1.4, 3); ctx.stroke(); break;
    case 'envelope': ctx.fillStyle = sil('#f2ede2'); ctx.fillRect(-4.5, -3, 9, 6); ctx.strokeStyle = sil('#b9b2a2'); ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-4.5, -3); ctx.lineTo(0, .5); ctx.lineTo(4.5, -3); ctx.stroke(); break;
    case 'laptop': ctx.fillStyle = sil('#2a2c30'); ctx.fillRect(-6, 0, 12, 1.4); ctx.fillStyle = sil('#3a3d42'); ctx.fillRect(-5.5, -7, 11, 7); ctx.fillStyle = sil('#5fb6e6'); ctx.fillRect(-4.6, -6.2, 9.2, 5.4); break;
    case 'phone': ctx.fillStyle = sil('#121418'); rrp(ctx, -1.6, -4.5, 3.6, 7, .9); ctx.fill(); ctx.fillStyle = sil('#5fb6e6'); ctx.fillRect(-1, -3.8, 2.4, 5.4); break;
    case 'money': for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(-.5 + i * .28); ctx.fillStyle = sil(i % 2 ? '#5aa86b' : '#6fc27f'); ctx.fillRect(-1, -9, 4.4, 9); ctx.fillStyle = sil('#3e7f4c'); ctx.fillRect(.3, -6, 1.8, 1.8); ctx.restore(); } break;
    case 'briefcase': ctx.fillStyle = sil('#4a3020'); rrp(ctx, -6, 1.5, 12, 9, 1.4); ctx.fill(); ctx.strokeStyle = sil('#2e1d14'); ctx.lineWidth = 1; ctx.strokeRect(-2, -.5, 4, 2.4); break;
    case 'bag': ctx.fillStyle = sil('#c9b28a'); ctx.beginPath(); ctx.moveTo(-5, 2); ctx.quadraticCurveTo(-7, 13, 0, 13.5); ctx.quadraticCurveTo(7, 13, 5, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = sil('#3c7a48'); ctx.font = '700 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 10.5); break;
    case 'radio': ctx.fillStyle = sil('#1c1e22'); rrp(ctx, -1.8, -6, 4, 9, 1); ctx.fill(); ctx.fillRect(1, -10, 1, 5); break;
    case 'book': ctx.fillStyle = sil('#8a2f2f'); ctx.fillRect(-4, -2, 9, 6.5); ctx.fillStyle = sil('#f2ede2'); ctx.fillRect(-3.6, -1.6, 8.2, 1); break;
    case 'coffee': ctx.fillStyle = sil('#f2efe9'); rrp(ctx, -2.4, -5, 5, 6.5, 1); ctx.fill(); ctx.fillStyle = sil('#7a4b2a'); ctx.fillRect(-2.4, -2.4, 5, 2.2); break;
    case 'clipboard': ctx.fillStyle = sil('#8a6a3f'); ctx.fillRect(-4, -6, 8.5, 11); ctx.fillStyle = sil('#fafafa'); ctx.fillRect(-3.2, -4.4, 7, 8.6); break;
    case 'box': ctx.fillStyle = sil('#b88a4f'); ctx.fillRect(-7, -6, 14, 11); ctx.strokeStyle = sil('#8a6434'); ctx.lineWidth = .8; ctx.strokeRect(-7, -6, 14, 11); ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 5); ctx.stroke(); break;
  }
  ctx.restore();
}

/* ---------- places ---------- */
const SKY = {
  day: ['#7fb6e3', '#cfe6f2'], dusk: ['#3b2f5c', '#f08a5d'], night: ['#070b1a', '#1b2442'],
};
function drawPlaceBase(ctx, W, H, place, time, t, cam) {
  const R = seeded(place.length * 31 + (time === 'night' ? 7 : time === 'dusk' ? 3 : 1));
  const gy = H * .8, night = time === 'night', dusk = time === 'dusk';
  const layer = (par, fn) => { ctx.save(); ctx.translate(W / 2, gy); ctx.scale(cam.z * (1 - par * .5) + par * .5, cam.z * (1 - par * .5) + par * .5); ctx.translate(-W / 2 - cam.x * (1 - par), -gy); fn(); ctx.restore(); };
  const sky = (a, b) => { const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); };
  const win = (x, y, w, h, lit) => { ctx.fillStyle = lit ? (night ? '#ffd27a' : '#bcd6e8') : (night ? '#1a2033' : '#7f97a8'); ctx.fillRect(x, y, w, h); };
  const indoor = ['office', 'room', 'prison', 'school', 'hospital', 'shop', 'bank'].includes(place);
  if (place === 'void') {
    ctx.fillStyle = '#07080b'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, gy, 10, W / 2, gy - H * .2, H * .6); g.addColorStop(0, 'rgba(255,240,210,.28)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,240,210,.12)'; ctx.beginPath(); ctx.ellipse(W / 2, gy, W * .3, H * .03, 0, 0, 7); ctx.fill();
    return {};
  }
  if (!indoor) {
    layer(1, () => sky(...SKY[time] || SKY.day));
    if (night) layer(.98, () => { const r = seeded(9); ctx.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { ctx.globalAlpha = .3 + r() * .6; ctx.fillRect(r() * W * 1.4 - W * .2, r() * gy * .6, 2, 2); } ctx.globalAlpha = 1; ctx.fillStyle = '#f3efe0'; ctx.beginPath(); ctx.arc(W * .78, H * .12, Math.min(W, H) * .045, 0, 7); ctx.fill(); });
    else layer(.97, () => { ctx.fillStyle = dusk ? 'rgba(255,190,120,.9)' : 'rgba(255,250,225,.95)'; ctx.beginPath(); ctx.arc(W * .8, dusk ? gy * .62 : H * .12, Math.min(W, H) * .06, 0, 7); ctx.fill(); });
  }
  const tone = night ? -.55 : dusk ? -.28 : 0;
  switch (place) {
    case 'city': case 'street': {
      layer(.8, () => { for (let x = -W * .3; x < W * 1.3;) { const w = W * (.06 + R() * .08), h = H * (.18 + R() * .32); ctx.fillStyle = shade('#5f6f86', tone - .1); ctx.fillRect(x, gy - h, w, h); for (let wy = gy - h + 10; wy < gy - 14; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 14) win(wx, wy, 6, 8, R() > .55); x += w + 4; } });
      layer(.5, () => { for (let x = -W * .2; x < W * 1.2;) { const w = W * (.12 + R() * .1), h = H * (.12 + R() * .16); ctx.fillStyle = shade(['#8a6b5a', '#6e7f73', '#7b6f8f', '#9a8a6a'][Math.floor(R() * 4)], tone); ctx.fillRect(x, gy - h, w, h); for (let wy = gy - h + 14; wy < gy - 30; wy += 30) for (let wx = x + 10; wx < x + w - 20; wx += 26) win(wx, wy, 14, 16, R() > .5); x += w + 2; } });
      layer(0, () => { ctx.fillStyle = shade('#4a4e56', tone); ctx.fillRect(-W, gy, W * 3, H); ctx.fillStyle = shade('#6c707a', tone); ctx.fillRect(-W, gy, W * 3, H * .025); ctx.strokeStyle = shade('#d8c27a', tone); ctx.lineWidth = H * .006; ctx.setLineDash([W * .06, W * .05]); ctx.beginPath(); ctx.moveTo(-W, gy + H * .11); ctx.lineTo(W * 2, gy + H * .11); ctx.stroke(); ctx.setLineDash([]);
        if (place === 'street' || night) for (const lx of [W * .12, W * .88]) { ctx.fillStyle = '#2a2d33'; ctx.fillRect(lx - 3, gy - H * .32, 6, H * .32); ctx.fillRect(lx - 3, gy - H * .32, W * .05 * (lx < W / 2 ? 1 : -1), 6); if (night) { const g = ctx.createRadialGradient(lx, gy - H * .31, 4, lx, gy, H * .3); g.addColorStop(0, 'rgba(255,215,130,.35)'); g.addColorStop(1, 'rgba(255,215,130,0)'); ctx.fillStyle = g; ctx.fillRect(lx - H * .3, gy - H * .32, H * .6, H * .36); } } });
      break;
    }
    case 'favela': {
      layer(.85, () => { ctx.fillStyle = shade('#4f7a52', tone - .1); ctx.beginPath(); ctx.moveTo(-W * .3, gy); ctx.quadraticCurveTo(W * .2, gy - H * .55, W * .65, gy - H * .42); ctx.quadraticCurveTo(W * 1.1, gy - H * .3, W * 1.4, gy); ctx.closePath(); ctx.fill(); });
      layer(.55, () => {
        const cols = ['#d8a35a', '#b4583f', '#7a9cc0', '#e0d3b8', '#9c6b4c', '#c7c06a', '#e3e0d8'];
        for (let row = 0; row < 7; row++) { const yb = gy - row * H * .055; const span = W * (1.4 - row * .15); for (let x = W / 2 - span / 2 + R() * 30; x < W / 2 + span / 2; x += W * (.07 + R() * .05)) {
          const w = W * (.06 + R() * .05), h = H * (.05 + R() * .03); ctx.fillStyle = shade(cols[Math.floor(R() * cols.length)], tone - row * .03); ctx.fillRect(x, yb - h, w, h);
          ctx.fillStyle = shade('#3a3a3a', tone); ctx.fillRect(x, yb - h - 3, w, 3); win(x + w * .2, yb - h * .7, w * .2, h * .35, R() > .5);
          if (R() > .7) { ctx.fillStyle = shade('#2f5d9a', tone); ctx.fillRect(x + w * .6, yb - h - 10, 10, 7); } } }
        ctx.strokeStyle = 'rgba(20,20,20,.5)'; ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-W * .2, gy - H * (.25 + i * .06)); ctx.quadraticCurveTo(W / 2, gy - H * (.2 + i * .06), W * 1.2, gy - H * (.28 + i * .05)); ctx.stroke(); }
      });
      layer(0, () => { ctx.fillStyle = shade('#6e665c', tone); ctx.fillRect(-W, gy, W * 3, H); ctx.fillStyle = shade('#8a8174', tone); ctx.fillRect(-W, gy, W * 3, H * .02); ctx.fillStyle = shade('#b2694a', tone); ctx.fillRect(-W * .2, gy - H * .2, W * .22, H * .2); win(-W * .14, gy - H * .14, W * .08, H * .07, night); });
      break;
    }
    case 'field': {
      layer(.8, () => { ctx.fillStyle = shade('#6e9a64', tone - .15); ctx.beginPath(); ctx.moveTo(-W, gy); for (let x = -W; x <= W * 2; x += W * .25) ctx.lineTo(x, gy - H * (.06 + R() * .1)); ctx.lineTo(W * 2, gy); ctx.fill(); });
      layer(0, () => { ctx.fillStyle = shade('#7fae5e', tone); ctx.fillRect(-W, gy, W * 3, H); ctx.fillStyle = shade('#55575d', tone); ctx.beginPath(); ctx.moveTo(W * .44, gy); ctx.lineTo(W * .56, gy); ctx.lineTo(W * 1.1, H); ctx.lineTo(-W * .1, H); ctx.fill(); });
      break;
    }
    default: { /* interiors */
      const wall = { office: '#cfd6dc', room: '#d9c7b0', prison: '#8d8f8c', school: '#d7d3c4', hospital: '#dfe9ea', shop: '#6a3f35', bank: '#3d3a33' }[place];
      const floor = { office: '#8b8f95', room: '#9b7350', prison: '#5e605e', school: '#a58256', hospital: '#b9c6c6', shop: '#4a2e24', bank: '#2b2924' }[place];
      const it = night ? -.35 : 0;
      layer(.6, () => {
        ctx.fillStyle = shade(wall, it); ctx.fillRect(-W, -H, W * 3, gy + H);
        ctx.fillStyle = shade(wall, it - .08); ctx.fillRect(-W, gy - H * .06, W * 3, H * .06);
        if (place === 'office' || place === 'room' || place === 'hospital') { const wx = W * .58, wy = H * .18, ww = W * .32, wh = H * .3; const g = ctx.createLinearGradient(0, wy, 0, wy + wh); const sk = SKY[time] || SKY.day; g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh); ctx.fillStyle = shade('#4f5866', tone); for (let i = 0; i < 6; i++) { const bh = wh * (.3 + R() * .5); ctx.fillRect(wx + i * ww / 6, wy + wh - bh, ww / 6 - 3, bh); } ctx.strokeStyle = '#f4f4f2'; ctx.lineWidth = 8; ctx.strokeRect(wx, wy, ww, wh); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke(); }
        if (place === 'school') { ctx.fillStyle = '#2f4a3a'; ctx.fillRect(W * .15, H * .2, W * .7, H * .26); ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 8; ctx.strokeRect(W * .15, H * .2, W * .7, H * .26); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W * .22, H * .27); ctx.lineTo(W * .5, H * .27); ctx.moveTo(W * .22, H * .32); ctx.lineTo(W * .62, H * .32); ctx.stroke(); }
        if (place === 'shop') { for (let s = 0; s < 3; s++) { ctx.fillStyle = '#3a221c'; ctx.fillRect(W * .1, H * (.22 + s * .1), W * .8, 6); for (let b = 0; b < 12; b++) { ctx.fillStyle = ['#3e7a5c', '#8a2f2f', '#c49a3a', '#2f5d9a'][b % 4]; ctx.fillRect(W * .12 + b * W * .065, H * (.22 + s * .1) - H * .06, W * .03, H * .06); } } ctx.fillStyle = '#ff5fa2'; ctx.shadowColor = '#ff5fa2'; ctx.shadowBlur = 20; ctx.font = `700 ${H * .04}px sans-serif`; ctx.fillText('ABERTO', W * .62, H * .14); ctx.shadowBlur = 0; }
        if (place === 'bank') { ctx.fillStyle = '#6f6a5c'; ctx.beginPath(); ctx.arc(W * .7, H * .42, H * .17, 0, 7); ctx.fill(); ctx.strokeStyle = '#a49c84'; ctx.lineWidth = 10; ctx.stroke(); ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * .2; ctx.beginPath(); ctx.moveTo(W * .7, H * .42); ctx.lineTo(W * .7 + Math.cos(a) * H * .1, H * .42 + Math.sin(a) * H * .1); ctx.stroke(); } }
        if (place === 'prison') { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (let y = 0; y < gy; y += H * .04) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.stroke(); } ctx.fillStyle = '#d9d6c7'; ctx.fillRect(W * .66, H * .2, W * .12, H * .08); ctx.fillStyle = '#2a2b2a'; for (let i = 0; i < 4; i++) ctx.fillRect(W * .67 + i * W * .03, H * .2, 4, H * .08); }
      });
      layer(.3, () => {
        if (place === 'office') { ctx.fillStyle = '#5b4636'; ctx.fillRect(W * .55, gy - H * .14, W * .4, H * .025); ctx.fillRect(W * .58, gy - H * .12, 8, H * .12); ctx.fillRect(W * .9, gy - H * .12, 8, H * .12); ctx.fillStyle = '#1d2026'; ctx.fillRect(W * .66, gy - H * .25, W * .16, H * .1); ctx.fillStyle = '#5fb6e6'; ctx.fillRect(W * .67, gy - H * .24, W * .14, H * .08); ctx.fillStyle = '#2e6b3c'; ctx.beginPath(); ctx.ellipse(W * .1, gy - H * .12, W * .05, H * .08, 0, 0, 7); ctx.fill(); }
        if (place === 'room') { ctx.fillStyle = '#5a4a7a'; ctx.fillRect(W * .58, gy - H * .1, W * .4, H * .1); ctx.fillStyle = '#efe8dc'; ctx.fillRect(W * .58, gy - H * .12, W * .4, H * .03); ctx.fillStyle = '#c75b3b'; ctx.fillRect(W * .12, H * .22, W * .12, H * .15); }
        if (place === 'hospital') { ctx.fillStyle = '#eef3f3'; ctx.fillRect(W * .55, gy - H * .1, W * .4, H * .04); ctx.fillStyle = '#9aa7ab'; ctx.fillRect(W * .55, gy - H * .06, W * .4, 6); ctx.fillStyle = '#16201f'; ctx.fillRect(W * .82, gy - H * .32, W * .12, H * .1); ctx.strokeStyle = '#5fe08a'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = W * .825 + i * W * .0027, ph = (i / 40 + t * .6) % 1; ctx.lineTo(x, gy - H * .27 - (ph > .45 && ph < .5 ? H * .03 : ph > .5 && ph < .53 ? -H * .015 : 0)); } ctx.stroke(); }
        if (place === 'shop') { ctx.fillStyle = '#2a1712'; ctx.fillRect(-W * .1, gy - H * .12, W * .7, H * .12); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-W * .1, gy - H * .13, W * .7, H * .015); }
        if (place === 'bank') { for (let i = 0; i < 4; i++) { ctx.fillStyle = '#d9b54a'; ctx.fillRect(W * (.08 + i * .05), gy - H * .03 * (1 + (i % 2)), W * .045, H * .028); ctx.fillStyle = '#5aa86b'; ctx.fillRect(W * (.82 - i * .04), gy - H * .02 - i * H * .012, W * .06, H * .012); } }
        if (place === 'school') { ctx.fillStyle = '#8a6a3f'; for (const x of [W * .08, W * .72]) { ctx.fillRect(x, gy - H * .08, W * .2, H * .015); ctx.fillRect(x + 6, gy - H * .07, 6, H * .07); ctx.fillRect(x + W * .2 - 12, gy - H * .07, 6, H * .07); } }
      });
      layer(0, () => { ctx.fillStyle = shade(floor, it); ctx.fillRect(-W, gy, W * 3, H); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-W, gy, W * 3, H * .015); });
      if (night) { ctx.fillStyle = 'rgba(10,14,30,.25)'; ctx.fillRect(0, 0, W, H); }
      return place === 'prison' ? { fg: () => layer(-.2, () => { const g = ctx.createLinearGradient(0, 0, 18, 0); g.addColorStop(0, '#2a2c2e'); g.addColorStop(.5, '#7b7f84'); g.addColorStop(1, '#2a2c2e'); ctx.fillStyle = g; for (let x = -W * .1; x < W * 1.2; x += W * .1) { ctx.save(); ctx.translate(x, 0); ctx.fillRect(0, -H, 18, H * 3); ctx.restore(); } ctx.fillStyle = '#3a3c3f'; ctx.fillRect(-W, H * .1, W * 3, 20); }) } : {};
    }
  }
  return {};
}

/* ---------- icons & overlays ---------- */
function drawIcon(ctx, kind, x, y, s, t, L) {
  if (!kind) return;
  const k = ease.back(clamp(t / .4)); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * s * .05); ctx.scale(k, k);
  ctx.fillStyle = '#0d0f14'; ctx.beginPath(); ctx.arc(0, 0, s * .62, 0, 7); ctx.fill();
  ctx.lineWidth = s * .08; ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const c = { money: '#6fd28a', clock: '#ffd166', alert: '#ff5d5d', heart: '#ff6b8b', x: '#ff5d5d', check: '#6fd28a', arrow: L.a1, question: '#ffd166' }[kind] || '#fff';
  ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = s * .1;
  switch (kind) {
    case 'money': ctx.font = `900 ${s * .7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', 0, s * .03); break;
    case 'clock': ctx.beginPath(); ctx.arc(0, 0, s * .36, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * .22); ctx.moveTo(0, 0); ctx.lineTo(s * .16, s * .08); ctx.stroke(); break;
    case 'alert': ctx.beginPath(); ctx.moveTo(0, -s * .34); ctx.lineTo(s * .34, s * .28); ctx.lineTo(-s * .34, s * .28); ctx.closePath(); ctx.stroke(); ctx.fillRect(-s * .03, -s * .12, s * .06, s * .2); ctx.fillRect(-s * .03, s * .14, s * .06, s * .06); break;
    case 'heart': ctx.beginPath(); ctx.moveTo(0, s * .3); ctx.bezierCurveTo(-s * .5, -s * .05, -s * .2, -s * .4, 0, -s * .12); ctx.bezierCurveTo(s * .2, -s * .4, s * .5, -s * .05, 0, s * .3); ctx.fill(); break;
    case 'x': ctx.beginPath(); ctx.moveTo(-s * .24, -s * .24); ctx.lineTo(s * .24, s * .24); ctx.moveTo(s * .24, -s * .24); ctx.lineTo(-s * .24, s * .24); ctx.stroke(); break;
    case 'check': ctx.beginPath(); ctx.moveTo(-s * .26, 0); ctx.lineTo(-s * .06, s * .2); ctx.lineTo(s * .28, -s * .2); ctx.stroke(); break;
    case 'arrow': ctx.beginPath(); ctx.moveTo(-s * .24, s * .2); ctx.lineTo(s * .22, -s * .22); ctx.moveTo(0, -s * .24); ctx.lineTo(s * .24, -s * .24); ctx.lineTo(s * .24, 0); ctx.stroke(); break;
    case 'question': ctx.font = `900 ${s * .7}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, s * .03); break;
  }
  ctx.restore();
}
function drawMood(ctx, W, H, mood, t) {
  if (mood === 'flashback') { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#d8c39a'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const vig = (c, a) => { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, c + '0'); g.addColorStop(1, c + a); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  if (mood === 'danger') { const p = .55 + .25 * Math.sin(t * 6); ctx.save(); ctx.globalAlpha = p; vig('rgba(200,20,30,', '.85)'); ctx.restore(); }
  else if (mood === 'tense') vig('rgba(0,0,0,', '.75)');
  else if (mood === 'hope') { const g = ctx.createRadialGradient(W * .8, H * .1, 10, W * .8, H * .1, Math.max(W, H)); g.addColorStop(0, 'rgba(255,214,140,.35)'); g.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  else vig('rgba(0,0,0,', '.38)');
}

/* ---------- the story scene ---------- */
DRAW.story = (ctx, L, W, H, t, d, p) => {
  const P = S.__drawP || S.project; const m = Math.min(W, H);
  const k = clamp(t / Math.max(.5, d));
  const cam = { z: 1, x: 0 };
  switch (p.camera) {
    case 'push': cam.z = lerp(1, 1.16, ease.inOut(k)); break;
    case 'pull': cam.z = lerp(1.18, 1, ease.out(k)); break;
    case 'panL': cam.x = lerp(W * .07, -W * .07, ease.inOut(k)); cam.z = 1.08; break;
    case 'panR': cam.x = lerp(-W * .07, W * .07, ease.inOut(k)); cam.z = 1.08; break;
    case 'shake': cam.z = 1.06; cam.x = Math.sin(t * 31) * W * .006; break;
  }
  const punch = 1 + .07 * (1 - ease.out(clamp(t / .3))); cam.z *= punch;
  const shot = p.hero?.shot || 'wide', near = shot !== 'wide' && p.hero?.who !== 'none';
  PLACE_FX.fall = p.hero?.pose === 'fall'; PLACE_FX.cabin = p.place === 'cabin'; PLACE_FX.drive = p.hero?.pose === 'drive' || (p.things || []).some(x => x.anim === 'drive');
  const env = near ? drawPlaceBlur(ctx, W, H, p.place || 'city', p.time || 'day', t, cam, p, shot === 'close' ? 7 : 4) : drawPlace(ctx, W, H, p.place || 'city', p.time || 'day', t, cam, p);
  drawThings(ctx, W, H, p.things, t, d, 'back');
  /* characters live in the world layer (parallax 0); close/medium frame the face like a cartoon close-up */
  const vertical = H > W, ch = shot === 'close' ? (vertical ? H * 1.25 : H * 1.9) : shot === 'medium' ? (vertical ? H * .82 : H * 1.15) : (vertical ? H * .44 : H * .66);
  const gy = shot === 'close' ? H * .42 + ch * .71 : shot === 'medium' ? H * .36 + ch * .71 : H * .8;
  ctx.save(); ctx.translate(W / 2, gy); ctx.scale(cam.z, cam.z); ctx.translate(-W / 2 - cam.x, -gy);
  if (p.crowd && !near) { const r = seeded(5); for (let i = 0; i < 9; i++) { ctx.save(); ctx.translate(W * (r() * 1.1 - .05), gy - H * .01); drawPerson(ctx, castOf(P, 'friend'), { h: ch * (.62 + r() * .1), facing: r() > .5 ? 1 : -1, silhouette: true, pose: 'stand', phase: i }, t); ctx.restore(); } }
  const extras = shot === 'close' ? [] : (p.extras || []).slice(0, shot === 'medium' ? 1 : 3);
  extras.forEach((e, i) => {
    const ex = Number.isFinite(+e.x) ? +e.x : (i % 2 ? .78 : .22);
    ctx.save(); ctx.translate(W * ex, gy + H * .01); drawPerson(ctx, castOf(P, e.who || 'friend'), { h: ch * .92, facing: e.facing === 'left' ? -1 : e.facing === 'right' ? 1 : (ex > .5 ? -1 : 1), pose: e.pose || 'stand', emotion: e.emotion || 'neutral', prop: e.prop, dim: .12, phase: i * 1.3 }, t); ctx.restore();
  });
  const hero = p.hero || {};
  if (hero.who !== 'none') {
    let hx = Number.isFinite(+hero.x) ? +hero.x : .5; if (shot === 'close') hx = .5; else if (shot === 'medium') hx = clamp(hx, .38, .62); const face = hero.facing === 'left' ? -1 : 1;
    if (hero.pose === 'walk') hx += (k - .5) * .16 * face; if (hero.pose === 'run') hx += (k - .5) * .34 * face;
    ctx.save(); ctx.translate(W * hx, gy + H * .02);
    const ein = ease.back(clamp(t / .4)); ctx.translate((1 - ein) * -face * W * .14, 0);
    if (hero.pose === 'fall') { ctx.translate(0, -H * (shot === 'wide' ? .32 : .1) + Math.sin(t * 2) * H * .01); ctx.rotate(Math.sin(t * 1.7) * .35); }
    drawPerson(ctx, castOf(P, hero.who || 'hero'), { h: ch, facing: face, pose: hero.pose || 'stand', emotion: hero.emotion || 'neutral', prop: hero.prop || 'none' }, t);
    ctx.restore();
    if (p.icon) drawIcon(ctx, p.icon, W / 2 + (W * hx - W / 2 - cam.x) * cam.z + m * .16 * face, Math.max(m * .14, gy - (ch * .97) * cam.z), m * .1, t - .3, L);
    if (p.money) {
      const mk = ease.back(clamp((t - .5) / .4)); if (mk > 0) {
        const mx = W / 2 + (W * hx - W / 2 - cam.x) * cam.z - m * .22 * face, my = gy - ch * .6 * cam.z;
        ctx.save(); ctx.translate(mx, my); ctx.scale(mk, mk); ctx.font = `800 ${m * .05}px "Poppins", ${FALLBACK}`; const tw = ctx.measureText(p.money).width;
        rr(ctx, -tw / 2 - m * .03, -m * .045, tw + m * .06, m * .09, m * .02); ctx.fillStyle = '#1c7a3e'; ctx.fill(); ctx.strokeStyle = '#7ee39c'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#eafff0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.money, 0, 2); ctx.restore();
      }
    }
  }
  ctx.restore();
  env.fg?.();
  drawThings(ctx, W, H, p.things, t, d, 'front');
  drawMood(ctx, W, H, p.mood || 'normal', t);
  /* stage label: "NÍVEL 3 · GERENTE" */
  if (p.label) {
    const lk = ease.out(clamp(t / .4)); ctx.save(); ctx.globalAlpha = lk;
    const [a, b] = String(p.label).split('·').map(s => s.trim());
    ctx.font = `800 ${m * .042}px "Poppins", ${FALLBACK}`; const wa = ctx.measureText(a.toUpperCase()).width;
    ctx.font = `600 ${m * .036}px "Poppins", ${FALLBACK}`; const wb = b ? ctx.measureText(b.toUpperCase()).width : 0;
    const x = (W - (wa + wb + m * (b ? .12 : .06))) / 2, y = H * (vertical ? .1 : .08) - (1 - lk) * 20, h = m * .08;
    rr(ctx, x, y, wa + m * .06, h, h * .22); ctx.fillStyle = L.a1; ctx.fill();
    ctx.fillStyle = L.onA; ctx.font = `800 ${m * .042}px "Poppins", ${FALLBACK}`; ctx.textBaseline = 'middle'; ctx.fillText(a.toUpperCase(), x + m * .03, y + h / 2 + 2);
    if (b) { rr(ctx, x + wa + m * .06, y, wb + m * .06, h, h * .22); ctx.fillStyle = 'rgba(8,9,12,.82)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `600 ${m * .036}px "Poppins", ${FALLBACK}`; ctx.fillText(b.toUpperCase(), x + wa + m * .09, y + h / 2 + 2); }
    ctx.restore();
  }
  if (p.text) {
    const top = H * (vertical ? (p.label ? .18 : .11) : (p.label ? .18 : .08));
    const fit = fitText(ctx, { ...L, display: 'Poppins', dW: 900, upper: true }, 'display', p.text, W * .86, m * .085, m * .045, 3, H * .2, 1.05);
    ctx.save(); ctx.lineJoin = 'round';
    drawLines(ctx, { ...L, display: 'Poppins', dW: 900 }, fit, W * .07, top, W * .86, 'display', 'center', i => { const kk = clamp((t - .15 - i * .07) / .25); return { a: kk > 0 ? 1 : 0, s: lerp(1.35, 1, ease.back(kk)) }; }, { ink: '#ffffff', acc: L.a1, stroke: '#0b0c10' });
    ctx.restore();
  }
};

/* ---------- normalization of a story scene coming from Claude ---------- */
function normStory(p) {
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const h = p.hero || {};
  return {
    place: pick(p.place, PLACES, 'city'), time: pick(p.time, TIMES, 'day'), camera: pick(p.camera, CAMERAS, 'push'), mood: pick(p.mood, MOODS, 'normal'), icon: pick(p.icon || '', ICONS, ''),
    label: String(p.label || '').slice(0, 40), text: String(p.text || '').slice(0, 70), money: String(p.money || '').slice(0, 24), crowd: !!p.crowd,
    hero: { who: String(h.who || 'hero'), shot: ['close', 'medium', 'wide'].includes(h.shot) ? h.shot : 'wide', pose: pick(h.pose, POSES, 'stand'), emotion: pick(h.emotion, EMOTIONS, 'neutral'), prop: pick(h.prop, PROPS, 'none'), x: clamp(Number(h.x ?? .5), .1, .9), facing: h.facing === 'left' ? 'left' : 'right' },
    ...normSet(p), brand: brandOf(p.brand), things: normThings(p.things),
    extras: (Array.isArray(p.extras) ? p.extras : []).slice(0, 3).map(e => ({ who: String(e.who || 'friend'), pose: pick(e.pose, POSES, 'stand'), emotion: pick(e.emotion, EMOTIONS, 'neutral'), prop: pick(e.prop, PROPS, 'none'), x: clamp(Number(e.x ?? .75), .05, .95), facing: e.facing })),
  };
}
function normCast(c, fill = true) {
  const pick = (v, list, d) => (list.includes(v) ? v : d); const hex = v => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
  const list = (Array.isArray(c) ? c : []).slice(0, 6).map((x, i) => ({
    id: String(x.id || (i ? 'p' + i : 'hero')).slice(0, 20), name: String(x.name || '').slice(0, 30) || DEFAULT_CAST[i % 5].name,
    skin: pick(x.skin, Object.keys(SKINS), 's3'), hair: pick(x.hair, HAIRS, 'short'), hairColor: hex(x.hairColor) || '#2a1d16', beard: pick(x.beard, ['none', 'stubble', 'beard'], 'none'),
    top: pick(x.top, TOPS, 'tshirt'), topColor: hex(x.topColor) || DEFAULT_CAST[i % 5].topColor, pants: hex(x.pants) || '#2b2f38', accessory: pick(x.accessory, ACCS, 'none'),
    g: x.g === 'f' || x.g === 'm' ? x.g : (['long', 'bun'].includes(x.hair) ? 'f' : 'm'), voice: String(x.voice || ''), about: String(x.about || '').slice(0, 200), print: String(x.print || '').slice(0, 24), capText: String(x.capText || '').slice(0, 12), capBrand: brandOf(x.capBrand), shirtBrand: brandOf(x.shirtBrand),
  }));
  if (!fill) { if (!list.length) list.push({ ...DEFAULT_CAST[0] }); return list; }
  if (!list.find(x => x.id === 'hero')) list.unshift({ ...DEFAULT_CAST[0] });
  for (const d of DEFAULT_CAST) if (!list.find(x => x.id === d.id)) list.push({ ...d });
  return list;
}

/* ============ PLACES: more specific sets, per-scene variation and set dressing (all drawn locally, zero AI cost) ============ */
const PLACES2 = {
  beach: 'Praia', alley: 'Beco / viela', rooftop: 'Laje', construction: 'Obra', farm: 'Roça / fazenda', market: 'Feira de rua', parking: 'Estacionamento / garagem',
  kitchen: 'Cozinha', living: 'Sala de casa', mansion: 'Mansão', church: 'Igreja', court: 'Tribunal', police: 'Delegacia', gym: 'Academia', club: 'Balada / baile', restaurant: 'Restaurante', classroom: 'Sala de aula', lab: 'Laboratório / TI', car: 'Dentro do carro',
};
PLACES.push(...Object.keys(PLACES2)); Object.assign(PLACE_NAMES, PLACES2);
PROPS.push('gun', 'knife', 'cash', 'bottle', 'key', 'envelope', 'laptop');
const SETS = { police_car: 'Viatura', car: 'Carro', moto: 'Moto', trash: 'Lixo / entulho', graffiti: 'Pichação', tape: 'Fita de isolamento', barricade: 'Barricada', tv: 'TV', sofa: 'Sofá', bed: 'Cama', plant: 'Planta', shelf: 'Estante', computer: 'Computador', table: 'Mesa', cash_pile: 'Pilha de dinheiro', boxes: 'Caixas', guns_table: 'Armas na mesa', drugs_bag: 'Pacotes suspeitos', camera: 'Câmera de segurança', flag: 'Bandeira', lamp: 'Poste', tree: 'Árvore', sign: 'Fachada / outdoor da marca', bag: 'Sacola da marca', crowd_signs: 'Faixas de protesto', bottles: 'Garrafas', candles: 'Velas', trophy: 'Troféu', safe: 'Cofre', ambulance: 'Ambulância', helicopter: 'Helicóptero', news_cam: 'Imprensa' };

function kit(ctx, W, H, time, cam) {
  const gy = H * .8, night = time === 'night', dusk = time === 'dusk', tone = night ? -.55 : dusk ? -.28 : 0;
  const layer = (par, fn) => { ctx.save(); ctx.translate(W / 2, gy); const z = cam.z * (1 - par * .5) + par * .5; ctx.scale(z, z); ctx.translate(-W / 2 - cam.x * (1 - par), -gy); fn(); ctx.restore(); };
  const sky = () => layer(1, () => { const [a, b] = SKY[time] || SKY.day; const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); });
  const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const ground = (c, line) => layer(0, () => { rect(shade(c, tone), -W, gy, W * 3, H); rect('rgba(0,0,0,.14)', -W, gy, W * 3, H * .012); if (line) rect(shade(line, tone), -W, gy + H * .07, W * 3, H * .01); });
  const wall = (c, base) => layer(.6, () => { rect(shade(c, night ? -.35 : 0), -W, -H, W * 3, gy + H); rect(shade(base || c, (night ? -.35 : 0) - .1), -W, gy - H * .05, W * 3, H * .05); });
  const wnd = (x, y, w, h) => { const [a, b] = SKY[time] || SKY.day; const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#eceae4'; ctx.lineWidth = Math.max(4, W * .008); ctx.strokeRect(x, y, w, h); };
  return { gy, night, dusk, tone, layer, sky, rect, ground, wall, wnd, it: night ? -.35 : 0 };
}
const PAL = (v, list) => list[((v | 0) % list.length + list.length) % list.length];

const PLACE_DRAW = {
  beach(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.9, () => { const g = ctx2(c).createLinearGradient(0, gy - H * .16, 0, gy); g.addColorStop(0, shade('#2f8fb8', tone)); g.addColorStop(1, shade('#5ec2d6', tone)); c.fillStyle = g; c.fillRect(-W, gy - H * .16, W * 3, H * .16);
      c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 5; i++) { const y = gy - H * .03 - i * H * .028, o = Math.sin(t * 1.4 + i) * W * .02; c.fillRect(-W + o, y, W * 3, 2); } });
    layer(.4, () => { for (const x of [W * (v % 2 ? .12 : .82)]) { c.strokeStyle = shade('#6b4a2e', tone); c.lineWidth = W * .018; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + W * .04, gy - H * .2, x - W * .02, gy - H * .36); c.stroke(); c.fillStyle = shade('#3f8a4a', tone); for (let a = 0; a < 6; a++) { c.save(); c.translate(x - W * .02, gy - H * .36); c.rotate(a * 1.05 + Math.sin(t) * .05); c.beginPath(); c.ellipse(W * .07, 0, W * .08, H * .012, 0, 0, 7); c.fill(); c.restore(); } } });
    layer(0, () => { rect(shade('#e8cf98', tone), -W, gy, W * 3, H); if (v % 3 === 1) { c.fillStyle = shade(PAL(v, ['#e2574c', '#f2b134', '#4c8be2']), tone); c.beginPath(); c.moveTo(W * .3, gy - H * .16); c.arc(W * .3, gy - H * .12, W * .12, Math.PI, 0); c.fill(); rect('#ddd', W * .3 - 2, gy - H * .16, 4, H * .17); } });
  },
  alley(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.6, () => { for (const [x, w, col] of [[-W * .2, W * .5, '#7a6a5a'], [W * .7, W * .5, '#6c5f62']]) { rect(shade(col, tone - .1), x, -H, w, gy + H); for (let r = 0; r < 6; r++) for (let k = 0; k < 2; k++) { const lit = (r + k + v) % 3 === 0; rect(lit && K.night ? '#ffd27a' : shade('#3c3f4a', tone), x + w * (.2 + k * .4), gy - H * (.18 + r * .11), w * .18, H * .06); } }
      c.strokeStyle = 'rgba(15,15,15,.6)'; c.lineWidth = 1.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(W * .3, gy - H * (.42 + i * .04)); c.quadraticCurveTo(W * .5, gy - H * (.36 + i * .04), W * .7, gy - H * (.44 + i * .03)); c.stroke(); } });
    layer(.3, () => { rect(shade('#55524c', tone), W * .3, gy - H * .5, W * .4, H * .5); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(W * .3, gy - H * .5, W * .4, H * .5); });
    K.ground('#5b5852');
  },
  rooftop(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.85, () => { const R = seeded(31 + v); for (let row = 0; row < 5; row++) for (let x = -W * .3; x < W * 1.3;) { const w = W * (.07 + R() * .05), h = H * (.04 + R() * .03), y = gy - H * (.12 + row * .05); rect(shade(PAL(Math.floor(R() * 9), ['#d8a35a', '#b4583f', '#7a9cc0', '#e0d3b8', '#9c6b4c', '#c7c06a']), tone - .15 - row * .04), x, y - h, w, h); x += w + 2; } });
    layer(.3, () => { rect(shade('#2f5d9a', tone), W * (v % 2 ? .08 : .74), gy - H * .2, W * .16, H * .1); rect(shade('#9a9a96', tone), W * .02, gy - H * .06, W * .96, H * .06); c.strokeStyle = shade('#666', tone); c.lineWidth = 2; c.beginPath(); c.moveTo(0, gy - H * .3); c.lineTo(W, gy - H * .33); c.stroke(); for (let i = 0; i < 5; i++) rect(PAL(i + v, ['#e94b4b', '#f2d14b', '#4b8be9', '#fff']), W * (.15 + i * .15), gy - H * .32 + i * 1.5, W * .05, H * .04); });
    K.ground('#8a8a84');
  },
  construction(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.7, () => { c.strokeStyle = shade('#d9a52b', tone); c.lineWidth = W * .012; const x = W * (v % 2 ? .2 : .78); c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy - H * .62); c.lineTo(x - W * .5, gy - H * .62); c.moveTo(x, gy - H * .62); c.lineTo(x + W * .15, gy - H * .62); c.stroke(); c.strokeStyle = '#333'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - W * .35, gy - H * .62); c.lineTo(x - W * .35, gy - H * .4 + Math.sin(t) * 6); c.stroke(); });
    layer(.45, () => { for (let f = 0; f < 4; f++) { rect(shade('#9a9690', tone), W * .25, gy - H * (.1 + f * .1), W * .5, H * .015); for (let k = 0; k < 4; k++) rect(shade('#8a8680', tone), W * (.26 + k * .155), gy - H * (.1 + f * .1), W * .02, H * .1); } rect(shade('#b8664a', tone), W * .26, gy - H * .1, W * .3, H * .1); });
    layer(.15, () => { c.fillStyle = shade('#c9b48a', tone); c.beginPath(); c.moveTo(W * .02, gy); c.quadraticCurveTo(W * .1, gy - H * .08, W * .2, gy); c.fill(); for (let i = 0; i < 3; i++) { rect('#f07a1a', W * (.6 + i * .1), gy - H * .05, W * .03, H * .05); rect('#fff', W * (.6 + i * .1), gy - H * .035, W * .03, H * .008); } });
    K.ground('#8f7a5e');
  },
  farm(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.85, () => { c.fillStyle = shade('#7aa35e', tone - .1); c.beginPath(); c.moveTo(-W, gy); c.quadraticCurveTo(W * .3, gy - H * .3, W * 2, gy); c.fill(); });
    layer(.5, () => { const x = W * (v % 2 ? .12 : .62); rect(shade('#a8452f', tone), x, gy - H * .2, W * .26, H * .2); c.fillStyle = shade('#7a2f20', tone); c.beginPath(); c.moveTo(x - W * .02, gy - H * .2); c.lineTo(x + W * .13, gy - H * .3); c.lineTo(x + W * .28, gy - H * .2); c.fill(); rect('#f0e6d0', x + W * .1, gy - H * .12, W * .06, H * .12);
      c.strokeStyle = shade('#8a6a40', tone); c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(W * (i * .12 - .05), gy); c.lineTo(W * (i * .12 - .05), gy - H * .05); c.stroke(); } c.beginPath(); c.moveTo(-W * .1, gy - H * .035); c.lineTo(W * 1.1, gy - H * .035); c.stroke(); });
    K.ground('#8a7a4e');
  },
  market(c, K, W, H, v, t) {
    K.sky(); const { gy, tone, layer, rect } = K;
    layer(.7, () => { for (let x = -W * .2; x < W * 1.2; x += W * .18) rect(shade('#8c8070', tone - .1), x, gy - H * .3, W * .16, H * .3); });
    layer(.3, () => { for (let i = 0; i < 3; i++) { const x = W * (-.05 + i * .38), col = PAL(i + v, ['#d9443b', '#2f7fc1', '#e8a23b', '#3a9a5b']); for (let s = 0; s < 6; s++) rect(s % 2 ? '#f4efe6' : shade(col, tone), x + s * W * .05, gy - H * .26, W * .05, H * .04); rect(shade('#6b4a2e', tone), x, gy - H * .22, 4, H * .22); rect(shade('#6b4a2e', tone), x + W * .29, gy - H * .22, 4, H * .22); rect(shade('#7a5a3a', tone), x, gy - H * .08, W * .3, H * .02);
      for (let f = 0; f < 7; f++) { c.fillStyle = shade(PAL(f + i, ['#e94b3c', '#f2b134', '#7cc24a', '#f07a1a', '#9b59b6']), tone); c.beginPath(); c.arc(x + W * (.03 + f * .04), gy - H * .09, W * .016, 0, 7); c.fill(); } } });
    K.ground('#7d776e');
  },
  parking(c, K, W, H, v, t) {
    const { gy, layer, rect } = K; K.wall('#6f7276', '#55585c');
    layer(.6, () => { for (let i = 0; i < 4; i++) rect('#4c4f53', W * (.05 + i * .27), -H, W * .06, gy + H); c.fillStyle = K.night ? 'rgba(255,240,190,.9)' : 'rgba(240,245,255,.8)'; for (let i = 0; i < 3; i++) c.fillRect(W * (.15 + i * .3), H * .08, W * .14, H * .012); rect('#e7c43a', -W, gy - H * .12, W * 3, H * .02); });
    K.ground('#55575b', '#e7e3d0');
  },
  kitchen(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; const wc = PAL(v, ['#e8dfcf', '#cfe0d8', '#f0d9c4', '#d6dce8']); K.wall(wc);
    layer(.6, () => { for (let y = gy - H * .38; y < gy - H * .2; y += H * .03) for (let x = -W * .2; x < W * 1.2; x += W * .05) { c.strokeStyle = 'rgba(0,0,0,.06)'; c.strokeRect(x, y, W * .05, H * .03); }
      for (let i = 0; i < 4; i++) rect(shade(PAL(v + 1, ['#7a5a3f', '#f4f1ea', '#3f5a6b', '#a33f36']), it), W * (.04 + i * .16), gy - H * .56, W * .15, H * .14); K.wnd(W * (v % 2 ? .1 : .66), gy - H * .5, W * .24, H * .18); });
    layer(.3, () => { rect(shade('#b9b4aa', it), -W * .1, gy - H * .17, W * 1.2, H * .02); rect(shade(PAL(v + 1, ['#7a5a3f', '#f4f1ea', '#3f5a6b', '#a33f36']), it - .05), -W * .1, gy - H * .15, W * 1.2, H * .15); rect('#2a2c30', W * .4, gy - H * .2, W * .16, H * .03); rect('#d8dadc', W * .72, gy - H * .32, W * .16, H * .32); rect('#c4c7ca', W * .72, gy - H * .2, W * .16, 2);
      c.fillStyle = 'rgba(255,255,255,.35)'; for (let s = 0; s < 3; s++) { c.beginPath(); c.arc(W * .46 + s * 8, gy - H * (.24 + ((t * .3 + s * .33) % 1) * .08), 5, 0, 7); c.fill(); } });
    K.ground(PAL(v, ['#a89b88', '#8f8f8f', '#c2a27e', '#7a8a96']));
  },
  living(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall(PAL(v, ['#c9b79c', '#9fb3a5', '#d4b8b0', '#b7bfd0']));
    layer(.6, () => { K.wnd(W * (v % 2 ? .62 : .08), gy - H * .5, W * .26, H * .26); rect(shade('#6b4a2e', it), W * (v % 2 ? .12 : .6), gy - H * .48, W * .2, H * .14); rect(shade(PAL(v, ['#c45a3c', '#3c6ac4', '#3ca06a', '#a03c8a']), it), W * (v % 2 ? .13 : .61), gy - H * .47, W * .18, H * .12); });
    layer(.3, () => { const x = W * (v % 2 ? .5 : .05); rect(shade(PAL(v + 2, ['#5a6b8a', '#7a4a3a', '#4a6a4a', '#6a5a7a']), it), x, gy - H * .14, W * .45, H * .1); rect(shade(PAL(v + 2, ['#5a6b8a', '#7a4a3a', '#4a6a4a', '#6a5a7a']), it - .12), x, gy - H * .2, W * .45, H * .07); rect('#1a1c20', W * (v % 2 ? .1 : .62), gy - H * .3, W * .26, H * .15); c.fillStyle = `rgba(90,160,230,${.25 + .15 * Math.sin(t * 7)})`; c.fillRect(W * (v % 2 ? .11 : .63), gy - H * .29, W * .24, H * .13); rect('#3a2e24', W * (v % 2 ? .12 : .64), gy - H * .15, W * .22, H * .15); });
    K.ground(PAL(v, ['#8c6a4a', '#a58a6a', '#6e5a48', '#b19a7c']));
  },
  mansion(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall(PAL(v, ['#efe7d6', '#e6e2dc', '#2f3438', '#f2ece2']), '#d4c8b0');
    layer(.6, () => { for (const x of [W * .06, W * .86]) { rect(shade('#f6f2ea', it), x, -H, W * .08, gy + H); rect(shade('#d9d0bd', it), x - 6, gy - H * .06, W * .08 + 12, H * .06); }
      c.fillStyle = shade('#d4af37', it); c.beginPath(); c.arc(W / 2, H * .12, W * .06, 0, 7); c.fill(); for (let i = 0; i < 8; i++) { c.fillStyle = `rgba(255,236,170,${.5 + .3 * Math.sin(t * 2 + i)})`; c.beginPath(); c.arc(W / 2 + Math.cos(i) * W * .07, H * .16 + Math.sin(i) * 6, 3, 0, 7); c.fill(); }
      rect(shade('#a8853a', it), W * .36, gy - H * .5, W * .28, H * .2); rect(shade(PAL(v, ['#4a6a8a', '#8a5a4a', '#5a7a5a']), it), W * .37, gy - H * .49, W * .26, H * .18); });
    layer(.3, () => { c.fillStyle = shade('#8a1f2a', it); c.beginPath(); c.moveTo(W * .3, gy); c.lineTo(W * .7, gy); c.lineTo(W * .64, gy - H * .02); c.lineTo(W * .36, gy - H * .02); c.fill(); });
    K.ground(PAL(v, ['#e7e1d6', '#2b2b2e', '#d9cdb8']));
  },
  church(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall('#d9cfbf', '#bfb3a0');
    layer(.6, () => { for (const x of [W * .1, W * .78]) { const g = c.createLinearGradient(x, 0, x + W * .12, 0); g.addColorStop(0, '#c0392b'); g.addColorStop(.5, '#2e86de'); g.addColorStop(1, '#f1c40f'); c.fillStyle = g; c.beginPath(); c.moveTo(x, gy - H * .28); c.lineTo(x, gy - H * .5); c.arc(x + W * .06, gy - H * .5, W * .06, Math.PI, 0); c.lineTo(x + W * .12, gy - H * .28); c.fill(); }
      rect(shade('#8a6a3a', it), W * .48, gy - H * .62, W * .04, H * .22); rect(shade('#8a6a3a', it), W * .43, gy - H * .56, W * .14, H * .03); });
    layer(.3, () => { for (let r = 0; r < 2; r++) for (const x of [W * .02, W * .62]) rect(shade('#6b4a2e', it - r * .1), x, gy - H * (.1 - r * .04), W * .36, H * .03); rect('#f3efe6', W * .38, gy - H * .14, W * .24, H * .1); for (let i = 0; i < 3; i++) { rect('#f6efe0', W * (.42 + i * .07), gy - H * .2, 6, H * .05); c.fillStyle = `rgba(255,190,90,${.7 + .3 * Math.sin(t * 9 + i)})`; c.beginPath(); c.ellipse(W * (.42 + i * .07) + 3, gy - H * .205, 3, 6, 0, 0, 7); c.fill(); } });
    K.ground('#8a7a66');
  },
  court(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall('#c8b28e', '#8a6a44');
    layer(.6, () => { for (let x = -W * .1; x < W * 1.1; x += W * .08) rect('rgba(90,60,30,.25)', x, -H, 3, gy + H); c.fillStyle = '#d4af37'; c.beginPath(); c.arc(W / 2, H * .2, W * .07, 0, 7); c.fill(); rect('#2a5a3a', W * .2, H * .1, W * .08, H * .16); rect('#e9c84a', W * .2, H * .15, W * .08, H * .04); });
    layer(.3, () => { rect(shade('#5a3a20', it), W * .25, gy - H * .26, W * .5, H * .26); rect(shade('#4a2e18', it), W * .22, gy - H * .28, W * .56, H * .025); rect('#6b4a2e', W * .47, gy - H * .3, W * .06, H * .02); rect(shade('#5a3a20', it), -W * .05, gy - H * .12, W * .22, H * .12); rect(shade('#5a3a20', it), W * .83, gy - H * .12, W * .22, H * .12); });
    K.ground('#6e5236');
  },
  police(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall('#b9c3cc', '#8994a0');
    layer(.6, () => { rect('#1f3a6b', W * .08, H * .12, W * .2, H * .06); c.fillStyle = '#fff'; c.font = `800 ${W * .03}px sans-serif`; c.textBaseline = 'middle'; c.fillText('POLÍCIA', W * .1, H * .15); rect('#f4f4f2', W * .62, gy - H * .52, W * .3, H * .22); for (let i = 0; i < 4; i++) { rect('#d6dadf', W * (.64 + (i % 2) * .14), gy - H * (.5 - Math.floor(i / 2) * .1), W * .12, H * .08); rect('#555', W * (.67 + (i % 2) * .14), gy - H * (.49 - Math.floor(i / 2) * .1), W * .06, H * .05); } c.strokeStyle = '#c0392b'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * .7, gy - H * .46); c.lineTo(W * .84, gy - H * .36); c.stroke(); });
    layer(.3, () => { rect(shade('#6a6e74', it), W * .05, gy - H * .14, W * .4, H * .14); rect('#2a2c30', W * .12, gy - H * .2, W * .1, H * .06); rect(shade('#5a8ac0', it), W * .13, gy - H * .195, W * .08, H * .05); });
    K.ground('#7d848c');
  },
  gym(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall(PAL(v, ['#2b2f36', '#3a2f2f', '#2f3a33']), '#1c1f24');
    layer(.6, () => { rect('#a8c4d8', W * .55, gy - H * .5, W * .4, H * .3); c.strokeStyle = '#888'; c.lineWidth = 2; c.strokeRect(W * .55, gy - H * .5, W * .4, H * .3); rect(PAL(v, ['#e94b3c', '#f2c12e', '#2ecc71']), W * .05, H * .14, W * .3, H * .04); });
    layer(.3, () => { rect('#222', W * .08, gy - H * .3, 6, H * .3); rect('#222', W * .32, gy - H * .3, 6, H * .3); rect('#999', W * .05, gy - H * .26, W * .32, 4); for (const x of [W * .07, W * .33]) { c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(x, gy - H * .26, W * .035, 0, 7); c.fill(); } rect('#3a3a3a', W * .6, gy - H * .08, W * .3, H * .08); for (let i = 0; i < 5; i++) { c.fillStyle = '#444'; c.beginPath(); c.arc(W * (.62 + i * .06), gy - H * .1, W * .02, 0, 7); c.fill(); } });
    K.ground('#3a3d42');
  },
  club(c, K, W, H, v, t) {
    const { gy, layer, rect } = K; layer(.6, () => { rect('#0b0812', -W, -H, W * 3, gy + H); for (let i = 0; i < 6; i++) { const a = t * 1.2 + i, col = PAL(i + v, ['rgba(212,76,255,', 'rgba(0,210,255,', 'rgba(255,80,120,', 'rgba(255,220,60,']); const g = c.createLinearGradient(W / 2, 0, W / 2 + Math.sin(a) * W * .6, gy); g.addColorStop(0, col + '.55)'); g.addColorStop(1, col + '0)'); c.fillStyle = g; c.beginPath(); c.moveTo(W / 2 - 4, 0); c.lineTo(W / 2 + Math.sin(a) * W * .6 - W * .08, gy); c.lineTo(W / 2 + Math.sin(a) * W * .6 + W * .08, gy); c.lineTo(W / 2 + 4, 0); c.fill(); }
      for (const x of [W * .04, W * .8]) { rect('#15121c', x, gy - H * .3, W * .16, H * .3); for (const y of [.22, .1]) { c.fillStyle = '#2a2633'; c.beginPath(); c.arc(x + W * .08, gy - H * y, W * .05, 0, 7); c.fill(); c.fillStyle = '#0b0812'; c.beginPath(); c.arc(x + W * .08, gy - H * y, W * .025 * (1 + .15 * Math.abs(Math.sin(t * 8))), 0, 7); c.fill(); } } });
    layer(.2, () => { const r = seeded(4 + v); for (let i = 0; i < 12; i++) { c.save(); c.translate(W * (r() * 1.1 - .05), gy - H * .01); drawPerson(c, { skin: 's' + (1 + (i % 5)), hair: PAL(i, HAIRS), top: 'tshirt', topColor: '#222' }, { h: H * .3, silhouette: true, pose: i % 3 ? 'celebrate' : 'stand', phase: i }, t); c.restore(); } });
    K.ground('#141019');
  },
  restaurant(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall(PAL(v, ['#7a3b2e', '#2f4a3a', '#d9c6a5', '#3a3550']));
    layer(.6, () => { for (let i = 0; i < 3; i++) { const x = W * (.18 + i * .32); c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H * .16); c.stroke(); c.fillStyle = '#e8b54a'; c.beginPath(); c.arc(x, H * .18, W * .03, Math.PI, 0); c.fill(); c.fillStyle = 'rgba(255,214,140,.18)'; c.beginPath(); c.arc(x, H * .2, W * .12, 0, 7); c.fill(); } rect(shade('#3a2a1e', it), W * .55, gy - H * .5, W * .35, H * .2); for (let i = 0; i < 5; i++) rect(PAL(i, ['#2f6f3a', '#7a1f2a', '#c9a24a', '#2a4a7a']), W * (.57 + i * .065), gy - H * .48, W * .04, H * .08); });
    layer(.3, () => { for (const x of [W * .02, W * .66]) { rect('#f4f1ea', x, gy - H * .14, W * .3, H * .02); rect(shade('#5a3a20', it), x + W * .02, gy - H * .12, 5, H * .12); rect(shade('#5a3a20', it), x + W * .26, gy - H * .12, 5, H * .12); rect('#7a1f2a', x + W * .12, gy - H * .19, W * .015, H * .05); } });
    K.ground(PAL(v, ['#6b4a32', '#3b3632', '#9c8466']));
  },
  classroom(c, K, W, H, v, t) {
    const { gy, layer, rect, it } = K; K.wall(PAL(v, ['#e9e2c9', '#cfe0e6', '#e6d4c4']));
    layer(.6, () => { rect('#2f4a3a', W * .12, H * .16, W * .76, H * .26); rect('#7a5a3a', W * .1, H * .42, W * .8, H * .015); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * .18, H * .24); c.lineTo(W * .5, H * .24); c.moveTo(W * .18, H * .3); c.lineTo(W * .42, H * .3); c.stroke(); c.beginPath(); c.arc(W * .9, H * .09, W * .04, 0, 7); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#222'; c.stroke(); });
    layer(.3, () => { for (let i = 0; i < 4; i++) { const x = W * (-.02 + i * .28); rect(shade('#c98f4a', it), x, gy - H * .11, W * .18, H * .015); rect('#555', x + 4, gy - H * .1, 3, H * .1); rect('#555', x + W * .18 - 7, gy - H * .1, 3, H * .1); } });
    K.ground('#b89b72');
  },
  lab(c, K, W, H, v, t) {
    const { gy, layer, rect } = K; layer(.6, () => { rect('#0f1622', -W, -H, W * 3, gy + H); for (let i = 0; i < 4; i++) { const x = W * (.02 + i * .25); rect('#1b2433', x, gy - H * .55, W * .2, H * .48); for (let k = 0; k < 10; k++) { c.fillStyle = Math.sin(t * 6 + k * 1.7 + i) > 0 ? '#3ce07a' : '#1e5a3a'; c.fillRect(x + W * .03, gy - H * (.52 - k * .045), 4, 4); c.fillStyle = '#2b3a50'; c.fillRect(x + W * .06, gy - H * (.52 - k * .045), W * .11, 3); } } });
    layer(.3, () => { rect('#2a3446', W * .05, gy - H * .14, W * .9, H * .02); for (const x of [W * .15, W * .55]) { rect('#111', x, gy - H * .3, W * .26, H * .16); const g = c.createLinearGradient(x, 0, x + W * .26, 0); g.addColorStop(0, '#356CFF'); g.addColorStop(1, '#00D2FF'); c.fillStyle = g; c.globalAlpha = .65; c.fillRect(x + 4, gy - H * .3 + 4, W * .26 - 8, H * .16 - 8); c.globalAlpha = 1; } });
    K.ground('#1a2230');
  },
  car(c, K, W, H, v, t) {
    K.sky(); const { gy, layer, rect } = K;
    layer(.95, () => { const off = (t * W * .5) % (W * .4); for (let i = -1; i < 5; i++) { rect(K.night ? '#1d2436' : '#7f97a8', W * (i * .4) - off, gy - H * .5, W * .2, H * .3); rect('#55606e', W * (i * .4) - off + W * .22, gy - H * .3, W * .12, H * .1); } });
    layer(0, () => { const col = shade(PAL(v, ['#2a2d33', '#4a2a2a', '#d9d4c8']), K.night ? -.4 : 0); c.fillStyle = col; c.beginPath(); c.moveTo(-W, -H); c.lineTo(W * 2, -H); c.lineTo(W * 2, H * .14); c.quadraticCurveTo(W / 2, H * .04, -W, H * .14); c.fill(); rect(col, -W, gy - H * .14, W * 3, H); rect('#1a1b1f', W * .1, gy - H * .2, W * .8, H * .08); c.strokeStyle = '#111'; c.lineWidth = W * .02; c.beginPath(); c.arc(W * .3, gy - H * .08, W * .1, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); rect('#0d0e10', W * .48, H * .04, W * .14, H * .03); });
  },
};
function ctx2(c) { return c; }

/* ---------- set dressing: background objects that match the script ---------- */
function drawSet(c, K, W, H, item, x, t, v, brand) {
  const { gy, layer, rect, tone } = K, s = (H > W ? H * .47 : H * .68) / 200, X = W * x;
  layer(.15, () => {
    c.save(); c.translate(X, gy);
    switch (item) {
      case 'police_car': case 'car': case 'ambulance': {
        const body = item === 'police_car' ? '#f4f4f2' : item === 'ambulance' ? '#f6f6f2' : shade(PAL(v, ['#b8322a', '#2f5d9a', '#2a2d33', '#d9b54a']), tone);
        c.fillStyle = body; rrp(c, -60 * s, -34 * s, 120 * s, 24 * s, 6 * s); c.fill(); c.beginPath(); c.moveTo(-36 * s, -34 * s); c.lineTo(-24 * s, -52 * s); c.lineTo(26 * s, -52 * s); c.lineTo(40 * s, -34 * s); c.fill();
        c.fillStyle = '#9fc3dc'; c.fillRect(-20 * s, -49 * s, 18 * s, 13 * s); c.fillRect(2 * s, -49 * s, 20 * s, 13 * s);
        if (item === 'police_car') { c.fillStyle = '#1f3a6b'; c.fillRect(-60 * s, -26 * s, 120 * s, 6 * s); const on = Math.sin(t * 12) > 0; c.fillStyle = on ? '#ff2b2b' : '#5a1010'; c.fillRect(-12 * s, -58 * s, 11 * s, 6 * s); c.fillStyle = on ? '#123a8a' : '#2f7bff'; c.fillRect(1 * s, -58 * s, 11 * s, 6 * s); c.fillStyle = `rgba(${on ? '255,40,40' : '40,110,255'},.18)`; c.beginPath(); c.arc(0, -56 * s, 70 * s, 0, 7); c.fill(); }
        if (item === 'ambulance') { c.fillStyle = '#d63031'; c.fillRect(-60 * s, -24 * s, 120 * s, 4 * s); c.fillRect(30 * s, -32 * s, 4 * s, 12 * s); c.fillRect(26 * s, -28 * s, 12 * s, 4 * s); }
        c.fillStyle = '#16171a'; for (const wx of [-36, 36]) { c.beginPath(); c.arc(wx * s, -10 * s, 11 * s, 0, 7); c.fill(); } break;
      }
      case 'sign': { const id = brand || 'mercadao', b = BRANDS[id]; c.fillStyle = '#5a5d63'; c.fillRect(-4 * s, -190 * s, 8 * s, 190 * s); c.beginPath(); rr(c, -70 * s, -250 * s, 140 * s, 70 * s, 8 * s); c.fillStyle = b ? b.c[0] : '#333'; c.fill(); c.lineWidth = 4 * s; c.strokeStyle = INK; c.stroke(); c.save(); c.translate(0, -215 * s); drawBrandBadge(c, id, 0, 0, 34 * s); c.restore(); if (K.night) { c.fillStyle = 'rgba(255,255,220,.18)'; c.beginPath(); c.arc(0, -215 * s, 90 * s, 0, 7); c.fill(); } break; }
      case 'bag': { const id = brand || 'mercadao', b = BRANDS[id]; c.beginPath(); rr(c, -22 * s, -44 * s, 44 * s, 44 * s, 4 * s); c.fillStyle = '#f4efe2'; c.fill(); c.lineWidth = 3 * s; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, -44 * s, 12 * s, Math.PI, 0); c.stroke(); c.save(); c.translate(0, -22 * s); drawBrandBadge(c, id, 0, 0, 16 * s, { noText: true }); c.restore(); break; }
      case 'moto': c.strokeStyle = '#16171a'; c.lineWidth = 4 * s; for (const wx of [-22, 22]) { c.beginPath(); c.arc(wx * s, -10 * s, 10 * s, 0, 7); c.stroke(); } c.fillStyle = shade('#b8322a', tone); c.beginPath(); c.moveTo(-18 * s, -18 * s); c.lineTo(14 * s, -22 * s); c.lineTo(20 * s, -12 * s); c.lineTo(-10 * s, -10 * s); c.fill(); c.fillStyle = '#222'; c.fillRect(14 * s, -34 * s, 3 * s, 14 * s); break;
      case 'trash': c.fillStyle = shade('#3c5a3a', tone); c.fillRect(-14 * s, -34 * s, 28 * s, 34 * s); c.fillStyle = shade('#2a2a2a', tone); for (let i = 0; i < 4; i++) { c.beginPath(); c.arc((20 + i * 9) * s, -6 * s, 8 * s, 0, 7); c.fill(); } break;
      case 'graffiti': { c.lineWidth = 5 * s; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.strokeStyle = PAL(i + v, ['#e94b3c', '#2ecc71', '#f1c40f', '#9b59b6', '#3498db']); c.beginPath(); c.moveTo((-50 + i * 30) * s, -120 * s); c.bezierCurveTo((-30 + i * 30) * s, -160 * s, (-10 + i * 30) * s, -90 * s, (10 + i * 30) * s, -130 * s); c.stroke(); } break; }
      case 'tape': c.translate(-X, 0); for (let k = 0; k < 2; k++) { c.fillStyle = '#f1c40f'; c.fillRect(-W, -40 * s - k * 30 * s, W * 3, 9 * s); c.fillStyle = '#111'; for (let i = -W; i < W * 2; i += 40 * s) c.fillRect(i, -40 * s - k * 30 * s, 16 * s, 9 * s); } break;
      case 'barricade': for (let i = 0; i < 3; i++) { c.fillStyle = shade(PAL(i, ['#6b4a2e', '#3a3a3a', '#8a2a1a']), tone); c.beginPath(); c.ellipse((i - 1) * 26 * s, -12 * s, 16 * s, 12 * s, 0, 0, 7); c.fill(); } c.fillStyle = `rgba(255,140,40,${.6 + .3 * Math.sin(t * 9)})`; c.beginPath(); c.moveTo(-10 * s, -20 * s); c.quadraticCurveTo(0, -60 * s, 10 * s, -20 * s); c.fill(); c.fillStyle = 'rgba(60,60,60,.35)'; c.beginPath(); c.arc(0, (-80 - (t * 20) % 40) * s, 20 * s, 0, 7); c.fill(); break;
      case 'tv': c.fillStyle = '#16171a'; c.fillRect(-40 * s, -90 * s, 80 * s, 48 * s); c.fillStyle = `rgba(80,150,230,${.6 + .2 * Math.sin(t * 6)})`; c.fillRect(-36 * s, -86 * s, 72 * s, 40 * s); c.fillStyle = '#3a2e24'; c.fillRect(-30 * s, -42 * s, 60 * s, 42 * s); break;
      case 'sofa': c.fillStyle = shade(PAL(v, ['#5a6b8a', '#7a4a3a', '#4a6a4a']), tone); c.fillRect(-60 * s, -30 * s, 120 * s, 22 * s); c.fillRect(-60 * s, -52 * s, 120 * s, 24 * s); c.fillRect(-66 * s, -40 * s, 12 * s, 32 * s); c.fillRect(54 * s, -40 * s, 12 * s, 32 * s); break;
      case 'bed': c.fillStyle = '#6b4a2e'; c.fillRect(-70 * s, -60 * s, 8 * s, 60 * s); c.fillStyle = '#efe8dc'; c.fillRect(-64 * s, -30 * s, 130 * s, 18 * s); c.fillStyle = shade(PAL(v, ['#5a4a7a', '#3a6a8a', '#8a4a4a']), tone); c.fillRect(-30 * s, -32 * s, 96 * s, 22 * s); c.fillStyle = '#fff'; c.fillRect(-60 * s, -40 * s, 26 * s, 10 * s); break;
      case 'plant': c.fillStyle = '#8a5a3a'; c.fillRect(-10 * s, -24 * s, 20 * s, 24 * s); c.fillStyle = shade('#3f8a4a', tone); for (let i = 0; i < 6; i++) { c.save(); c.translate(0, -24 * s); c.rotate(-1.2 + i * .48 + Math.sin(t * 1.5 + i) * .04); c.beginPath(); c.ellipse(0, -22 * s, 6 * s, 22 * s, 0, 0, 7); c.fill(); c.restore(); } break;
      case 'shelf': c.fillStyle = '#6b4a2e'; c.fillRect(-36 * s, -140 * s, 72 * s, 140 * s); for (let r = 0; r < 4; r++) for (let b = 0; b < 7; b++) { c.fillStyle = PAL(b + r + v, ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#ecf0f1']); c.fillRect((-32 + b * 9) * s, (-132 + r * 34) * s, 7 * s, 26 * s); } break;
      case 'computer': case 'table': c.fillStyle = shade('#6b4a2e', tone); c.fillRect(-50 * s, -40 * s, 100 * s, 6 * s); c.fillRect(-46 * s, -34 * s, 5 * s, 34 * s); c.fillRect(41 * s, -34 * s, 5 * s, 34 * s); if (item === 'computer') { c.fillStyle = '#16171a'; c.fillRect(-24 * s, -76 * s, 48 * s, 32 * s); c.fillStyle = '#356CFF'; c.globalAlpha = .7; c.fillRect(-21 * s, -73 * s, 42 * s, 26 * s); c.globalAlpha = 1; c.fillStyle = '#16171a'; c.fillRect(-3 * s, -44 * s, 6 * s, 4 * s); } break;
      case 'cash_pile': for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#2e8b57' : '#3fa66a'; c.fillRect((-30 + (i % 3) * 20) * s, (-10 - Math.floor(i / 3) * 9) * s, 18 * s, 8 * s); } break;
      case 'boxes': for (let i = 0; i < 3; i++) { c.fillStyle = shade('#b08a5a', tone - i * .05); c.fillRect((-30 + i * 22 - (i === 2 ? 22 : 0)) * s, (-26 - (i === 2 ? 26 : 0)) * s, 26 * s, 26 * s); c.strokeStyle = 'rgba(0,0,0,.2)'; c.strokeRect((-30 + i * 22 - (i === 2 ? 22 : 0)) * s, (-26 - (i === 2 ? 26 : 0)) * s, 26 * s, 26 * s); } break;
      case 'guns_table': c.fillStyle = shade('#4a3a2a', tone); c.fillRect(-50 * s, -36 * s, 100 * s, 6 * s); c.fillRect(-46 * s, -30 * s, 5 * s, 30 * s); c.fillRect(41 * s, -30 * s, 5 * s, 30 * s); c.fillStyle = '#1a1b1e'; for (const gx of [-30, 4]) { c.save(); c.translate(gx * s, -40 * s); c.fillRect(0, 0, 22 * s, 4 * s); c.fillRect(2 * s, 2 * s, 5 * s, 8 * s); c.restore(); } c.fillRect(-40 * s, -44 * s, 36 * s, 3 * s); break;
      case 'drugs_bag': c.fillStyle = shade('#4a3a2a', tone); c.fillRect(-40 * s, -30 * s, 80 * s, 5 * s); c.fillRect(-36 * s, -25 * s, 4 * s, 25 * s); c.fillRect(32 * s, -25 * s, 4 * s, 25 * s); c.fillStyle = '#e8e2d0'; for (let i = 0; i < 5; i++) c.fillRect((-32 + i * 13) * s, -38 * s, 11 * s, 8 * s); break;
      case 'camera': c.translate(0, -H * .5); c.fillStyle = '#d9dcdf'; c.fillRect(-14 * s, -6 * s, 26 * s, 12 * s); c.fillStyle = Math.sin(t * 4) > 0 ? '#ff2b2b' : '#5a1010'; c.beginPath(); c.arc(-9 * s, 0, 2.4 * s, 0, 7); c.fill(); c.fillStyle = '#888'; c.fillRect(10 * s, -2 * s, 10 * s, 3 * s); break;
      case 'flag': c.fillStyle = '#888'; c.fillRect(-2 * s, -150 * s, 4 * s, 150 * s); c.fillStyle = '#009c3b'; c.beginPath(); c.moveTo(2 * s, -150 * s); for (let i = 0; i <= 10; i++) c.lineTo((2 + i * 6) * s, (-150 + Math.sin(t * 4 + i * .6) * 3) * s); c.lineTo(62 * s, -110 * s); c.lineTo(2 * s, -110 * s); c.fill(); c.fillStyle = '#ffdf00'; c.beginPath(); c.moveTo(8 * s, -130 * s); c.lineTo(32 * s, -144 * s); c.lineTo(56 * s, -130 * s); c.lineTo(32 * s, -116 * s); c.fill(); c.fillStyle = '#002776'; c.beginPath(); c.arc(32 * s, -130 * s, 7 * s, 0, 7); c.fill(); break;
      case 'lamp': c.fillStyle = '#2a2d33'; c.fillRect(-3 * s, -170 * s, 6 * s, 170 * s); c.fillRect(-3 * s, -170 * s, 30 * s, 5 * s); c.fillStyle = K.night ? '#ffe7a3' : '#cfd3d6'; c.fillRect(20 * s, -166 * s, 14 * s, 5 * s); if (K.night) { c.fillStyle = 'rgba(255,231,163,.14)'; c.beginPath(); c.moveTo(20 * s, -160 * s); c.lineTo(-20 * s, 0); c.lineTo(80 * s, 0); c.fill(); } break;
      case 'tree': c.fillStyle = shade('#6b4a2e', tone); c.fillRect(-6 * s, -80 * s, 12 * s, 80 * s); c.fillStyle = shade('#3f7a3a', tone); for (const [dx, dy, r] of [[0, -100, 36], [-26, -82, 24], [26, -84, 26]]) { c.beginPath(); c.arc(dx * s, dy * s, r * s, 0, 7); c.fill(); } break;
      case 'crowd_signs': for (let i = 0; i < 4; i++) { c.fillStyle = '#ddd'; c.fillRect((-60 + i * 36) * s, -150 * s, 3 * s, 60 * s); c.fillStyle = PAL(i + v, ['#f4f1ea', '#f1c40f', '#e74c3c']); c.fillRect((-74 + i * 36) * s, -170 * s, 32 * s, 22 * s); c.fillStyle = '#222'; c.fillRect((-70 + i * 36) * s, -163 * s, 24 * s, 3 * s); c.fillRect((-70 + i * 36) * s, -157 * s, 16 * s, 3 * s); } break;
      case 'bottles': c.fillStyle = shade('#4a3a2a', tone); c.fillRect(-40 * s, -32 * s, 80 * s, 5 * s); for (let i = 0; i < 5; i++) { c.fillStyle = PAL(i, ['#2f6f3a', '#7a4a1f', '#e8e2d0', '#2f4f7a']); c.fillRect((-32 + i * 14) * s, -56 * s, 8 * s, 24 * s); c.fillRect((-30 + i * 14) * s, -64 * s, 4 * s, 8 * s); } break;
      case 'candles': for (let i = 0; i < 5; i++) { c.fillStyle = '#f6efe0'; c.fillRect((-30 + i * 14) * s, (-20 - (i % 2) * 8) * s, 6 * s, (20 + (i % 2) * 8) * s); c.fillStyle = `rgba(255,190,90,${.7 + .3 * Math.sin(t * 9 + i)})`; c.beginPath(); c.ellipse((-27 + i * 14) * s, (-24 - (i % 2) * 8) * s, 3 * s, 6 * s, 0, 0, 7); c.fill(); } break;
      case 'trophy': c.fillStyle = '#d4af37'; c.beginPath(); c.moveTo(-14 * s, -60 * s); c.lineTo(14 * s, -60 * s); c.quadraticCurveTo(12 * s, -36 * s, 0, -34 * s); c.quadraticCurveTo(-12 * s, -36 * s, -14 * s, -60 * s); c.fill(); c.fillRect(-3 * s, -34 * s, 6 * s, 14 * s); c.fillRect(-12 * s, -20 * s, 24 * s, 6 * s); c.fillStyle = '#4a3a2a'; c.fillRect(-20 * s, -14 * s, 40 * s, 14 * s); break;
      case 'safe': c.fillStyle = '#4a4d52'; c.fillRect(-30 * s, -60 * s, 60 * s, 60 * s); c.strokeStyle = '#2a2c30'; c.lineWidth = 3 * s; c.strokeRect(-26 * s, -56 * s, 52 * s, 52 * s); c.fillStyle = '#c9ccd3'; c.beginPath(); c.arc(0, -30 * s, 10 * s, 0, 7); c.fill(); break;
      case 'helicopter': { c.translate(0, -H * .55 + Math.sin(t * 2) * 6); c.fillStyle = '#2a2d33'; c.beginPath(); c.ellipse(0, 0, 34 * s, 14 * s, 0, 0, 7); c.fill(); c.fillRect(20 * s, -3 * s, 50 * s, 5 * s); c.strokeStyle = '#2a2d33'; c.lineWidth = 3 * s; const r = Math.sin(t * 40) * 60 * s; c.beginPath(); c.moveTo(-r, -18 * s); c.lineTo(r, -18 * s); c.stroke(); c.fillStyle = 'rgba(255,255,220,.12)'; c.beginPath(); c.moveTo(-6 * s, 10 * s); c.lineTo(-60 * s, H * .55); c.lineTo(40 * s, H * .55); c.fill(); break; }
      case 'news_cam': c.fillStyle = '#222'; c.fillRect(-2 * s, -70 * s, 4 * s, 70 * s); c.fillRect(-14 * s, -88 * s, 30 * s, 18 * s); c.fillStyle = '#444'; c.fillRect(16 * s, -84 * s, 10 * s, 10 * s); c.fillStyle = Math.sin(t * 3) > 0 ? '#ff2b2b' : '#5a1010'; c.beginPath(); c.arc(-9 * s, -84 * s, 2.5 * s, 0, 7); c.fill(); break;
    }
    c.restore();
  });
}

/* ---------- entry point used by story + dialogue scenes ---------- */
function drawPlace(ctx, W, H, place, time, t, cam, p = {}) {
  const v = Number.isFinite(+p.v) ? +p.v : 0, K = kit(ctx, W, H, time, cam);
  let env = {};
  if (PLACE_DRAW[place]) PLACE_DRAW[place](ctx, K, W, H, v, t);
  else {
    /* original sets: mirror and re-tint by variant so two offices never look identical */
    if (v % 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); env = drawPlaceBase(ctx, W, H, place, time, t, { z: cam.z, x: -cam.x }); ctx.restore(); }
    else env = drawPlaceBase(ctx, W, H, place, time, t, cam);
    if (v >= 2 && place !== 'void') { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = PAL(v, ['#000', '#000', '#5a7ab8', '#c8875a']); ctx.globalAlpha = .35; ctx.fillRect(0, 0, W, H * .82); ctx.restore(); }
  }
  const set = Array.isArray(p.set) ? p.set.slice(0, 3) : [];
  set.forEach((it, i) => { let x = set.length === 1 ? (v % 2 ? .16 : .84) : [.12, .88, .5][i]; if (it === 'sign') x = clamp(x, .24, .76); drawSet(ctx, K, W, H, it, x, t, v + i, p.brand); });
  return env;
}
function normSet(p) { return { v: Number.isFinite(+p.v) ? clamp(Math.round(+p.v), 0, 3) : Math.floor(Math.random() * 4), set: (Array.isArray(p.set) ? p.set : []).filter(x => SETS[x]).slice(0, 3) }; }
let SET_GUIDE = `Cenário ("place") tem que ser LITERAL ao que a fala/narração diz naquele momento: crime → favela, alley, police, prison; escritório → office; casa → living, kitchen, room; rico → mansion; julgamento → court; fé → church; praia → beach. Troque de cenário quando a história muda de lugar; não repita o mesmo cenário em mais de 2 cenas seguidas sem motivo.
Lugares: ${PLACES.join('|')}.
"set": até 3 objetos de fundo que reforçam o roteiro: ${Object.keys(SETS).join('|')}. Ex.: operação policial → ["police_car","tape","helicopter"]; tráfico → ["drugs_bag","guns_table"]; escritório → ["computer","plant"].`;
function setPaneHTML(p) {
  const on = new Set(p.set || []);
  return `<div class="group"><h4>Objetos de cena</h4><div class="chips">${Object.entries(SETS).map(([k, l]) => `<button type="button" class="chip" data-act="setTog" data-v="${k}" aria-pressed="${on.has(k)}">${esc(l)}</button>`).join('')}</div>
    <p class="muted" style="margin:0;font-size:12px">Até 3 por cena.</p><button class="btn sm" data-act="varyPlace" type="button">Variar o cenário (${(p.v | 0) + 1}/4)</button></div>`;
}
function setClick(a, b, s) {
  if (thingClick(a, b, s)) return true;
  if (a === 'setTog') { const k = b.dataset.v, cur = s.p.set || []; pushHistory('objeto de cena'); s.p.set = cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k].slice(-3); afterChange(); return true; }
  if (a === 'varyPlace') { pushHistory('variar cenário'); s.p.v = ((s.p.v | 0) + 1) % 4; afterChange(); return true; }
  return false;
}

/* soft background for close-ups: render small, scale up (cheap blur that works on every browser) */
const BLUR = { c: null };
function drawPlaceBlur(ctx, W, H, place, time, t, cam, p, k = 6) {
  const w = Math.max(8, Math.round(W / k)), h = Math.max(8, Math.round(H / k));
  if (!BLUR.c) BLUR.c = document.createElement('canvas');
  const c = BLUR.c; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const x = c.getContext('2d'); x.setTransform(w / W, 0, 0, h / H, 0, 0); x.clearRect(0, 0, W, H);
  const env = drawPlace(x, W, H, place, time, t, { z: cam.z * 1.15, x: cam.x }, p);
  if (env.fg) env.fg();
  x.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c, 0, 0, W, H); ctx.restore();
  return {};
}

/* ---------- toon sets: flat colors with ink outlines, lots of story props (matches the cartoon characters) ---------- */
const TOON_PLACES = { bedroom: 'Quarto bagunçado', barber: 'Barbearia', salon: 'Salão de beleza', bathroom: 'Banheiro', houses: 'Rua de casinhas', dentist: 'Consultório', market2: 'Mercadinho', busstop: 'Ponto de ônibus', cafe: 'Padaria / café', homeoffice: 'Home office' };
PLACES.push(...Object.keys(TOON_PLACES)); Object.assign(PLACE_NAMES, TOON_PLACES);
function tk(c, W, H) {
  const lw = Math.max(2, H * .0035);
  const R = (x, y, w, h, fill, r = 0) => { c.beginPath(); if (r) rr(c, x, y, w, h, r); else c.rect(x, y, w, h); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
  const E = (x, y, rx, ry, fill) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
  const T = (s, x, y, size, col = INK, w = 900) => { c.font = `${w} ${size}px Poppins, sans-serif`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  const window_ = (x, y, w, h, time) => { const [a, b] = SKY[time] || SKY.day; const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, a); g.addColorStop(1, b); R(x, y, w, h, g); c.fillStyle = 'rgba(70,80,110,.35)'; for (let i = 0; i < 4; i++) c.fillRect(x + i * w / 4 + 4, y + h * (.45 + (i % 2) * .15), w / 4 - 8, h * (.55 - (i % 2) * .15)); c.lineWidth = lw; c.strokeStyle = '#f4f1ea'; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke(); c.strokeStyle = INK; c.strokeRect(x, y, w, h); };
  const curtain = (x, y, h, col) => { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 18, y + h / 2, x + 6, y + h); c.lineTo(x + 34, y + h); c.quadraticCurveTo(x + 40, y + h / 2, x + 34, y); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
  const floorBoards = (y, col) => { c.fillStyle = col; c.fillRect(-W, y, W * 3, H); c.strokeStyle = shade(col, -.25); c.lineWidth = lw * .6; for (let yy = y + H * .03; yy < H * 1.2; yy += H * .045) { c.beginPath(); c.moveTo(-W, yy); c.lineTo(W * 2, yy); c.stroke(); } c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.moveTo(-W, y); c.lineTo(W * 2, y); c.stroke(); };
  return { lw, R, E, T, window_, curtain, floorBoards };
}
Object.assign(PLACE_DRAW, {
  bedroom(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = shade(PAL(v, ['#5f7fa8', '#7a6a9a', '#6a8f7a', '#a8775f']), K.it); c.fillRect(-W, -H, W * 3, gy + H); c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 3; for (let x = -W; x < W * 2; x += W * .05) { c.beginPath(); c.moveTo(x, -H); c.lineTo(x, gy); c.stroke(); }
      k.window_(W * .58, H * .14, W * .3, H * .2, K.night ? 'night' : 'dusk'); k.curtain(W * .55, H * .12, H * .26, '#b8433a'); k.curtain(W * .84, H * .12, H * .26, '#b8433a');
      k.R(W * .06, H * .26, W * .2, H * .14, '#e8c14e'); c.fillStyle = '#e06a3a'; c.beginPath(); c.arc(W * .16, H * .31, W * .045, 0, 7); c.fill(); c.fillStyle = '#3d4a5c'; c.beginPath(); c.moveTo(W * .08, H * .39); c.lineTo(W * .14, H * .33); c.lineTo(W * .2, H * .38); c.lineTo(W * .24, H * .35); c.lineTo(W * .24, H * .39); c.fill();
      k.R(W * .04, H * .17, W * .2, H * .012, '#7a5236'); k.R(W * .07, H * .13, W * .06, H * .04, '#d9cbb0');
      k.E(W * .33, H * .33, W * .028, W * .028, '#e8c14e'); k.T('5K', W * .33, H * .33, W * .02); });
    layer(.25, () => { k.R(W * .62, gy - H * .15, W * .34, H * .015, '#8a5a36'); k.R(W * .64, gy - H * .135, W * .04, H * .135, '#7a4e2e'); k.R(W * .8, gy - H * .135, W * .14, H * .1, '#8a5a36'); k.E(W * .87, gy - H * .085, 4, 4, '#e8c14e'); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(W * .7, gy - H * .15); c.lineTo(W * .73, gy - H * .22); c.lineTo(W * .78, gy - H * .2); c.stroke(); k.R(W * .76, gy - H * .225, W * .05, H * .03, '#e0644a', 3); k.R(W * .65, gy - H * .19, W * .06, H * .04, '#3d8f8a', 4);
      k.R(-W * .05, gy - H * .12, W * .32, H * .12, '#3a3f66'); k.R(-W * .05, gy - H * .16, W * .08, H * .05, '#efe8dc', 6); });
    K.ground && (c.save(), k.floorBoards(gy, shade('#9a6a44', K.it)), c.restore());
    layer(.05, () => { c.beginPath(); c.ellipse(W * .45, gy + H * .07, W * .25, H * .03, 0, 0, 7); c.fillStyle = '#9a4a4a'; c.fill(); c.lineWidth = k.lw; c.strokeStyle = INK; c.stroke(); c.setLineDash([8, 6]); c.strokeStyle = '#d98a8a'; c.beginPath(); c.ellipse(W * .45, gy + H * .07, W * .2, H * .022, 0, 0, 7); c.stroke(); c.setLineDash([]); c.save(); c.translate(W * .82, gy + H * .05); c.rotate(-.12); k.R(-W * .08, -H * .012, W * .16, H * .024, '#e8d6b0'); c.restore(); });
  },
  barber(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#2f5a55'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .55, H * .1, W * .36, H * .16, '#1f2a28'); k.T('BARBEARIA', W * .73, H * .13, W * .04, '#f2d14b'); [['CORTE', 'R$ 40'], ['BARBA', 'R$ 35'], ['PEZINHO', 'R$ 15']].forEach(([a, b], i) => { c.font = `700 ${W * .028}px Poppins`; c.fillStyle = '#f4f1ea'; c.textAlign = 'left'; c.fillText(a, W * .58, H * (.17 + i * .03)); c.textAlign = 'right'; c.fillText(b, W * .88, H * (.17 + i * .03)); });
      for (const x of [W * .06]) { k.R(x, H * .14, W * .04, H * .3, '#f4f1ea', 8); c.save(); c.beginPath(); c.rect(x, H * .14, W * .04, H * .3); c.clip(); c.strokeStyle = '#d23a3a'; c.lineWidth = W * .015; for (let y = -H * .1 + (t * 30) % 40; y < H * .5; y += 40) { c.beginPath(); c.moveTo(x - 10, H * .14 + y); c.lineTo(x + W * .05, H * .14 + y - 30); c.stroke(); } c.restore(); }
      k.R(W * .2, H * .3, W * .3, H * .22, '#cfe3ea'); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(W * .23, H * .5); c.lineTo(W * .3, H * .32); c.lineTo(W * .34, H * .32); c.lineTo(W * .27, H * .5); c.fill(); });
    layer(0, () => { const s = W * .08; for (let y = gy; y < H * 1.2; y += s) for (let x = -W; x < W * 2; x += s) { c.fillStyle = ((x / s + y / s) | 0) % 2 ? '#f4f1ea' : '#2a2a2e'; c.fillRect(x + ((y - gy) / s % 2 ? s / 2 : 0), y, s, s); } c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  salon(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#f2c4c9'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .3, H * .1, W * .4, H * .08, '#f6e7b0'); k.T('SALÃO', W * .5, H * .14, W * .05, '#a0424f');
      c.beginPath(); c.arc(W * .5, H * .38, W * .16, 0, 7); c.fillStyle = '#e8b54a'; c.fill(); c.lineWidth = k.lw; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(W * .5, H * .38, W * .13, 0, 7); c.fillStyle = '#cfe3ea'; c.fill(); c.stroke();
      k.window_(W * .04, H * .14, W * .16, H * .12, 'day'); k.R(W * .8, H * .22, W * .14, H * .015, '#8a5a36'); for (let i = 0; i < 4; i++) k.R(W * (.81 + i * .033), H * .18, W * .025, H * .04, PAL(i, ['#d9483b', '#3f6fb0', '#e8b54a', '#5aa36a']), 3); });
    layer(.2, () => { for (const x of [W * .78]) { c.beginPath(); c.arc(x, gy - H * .22, W * .07, Math.PI, 0); c.fillStyle = '#f08fb0'; c.fill(); c.lineWidth = k.lw; c.strokeStyle = INK; c.stroke(); k.R(x - 3, gy - H * .22, 6, H * .22, '#888'); } k.R(W * .3, gy - H * .12, W * .4, H * .12, '#d9406a', 10); k.R(W * .32, gy - H * .2, W * .36, H * .09, '#e05a80', 10); });
    layer(0, () => { c.fillStyle = '#f4ece6'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  bathroom(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#eef3f5'; c.fillRect(-W, -H, W * 3, gy + H); c.strokeStyle = '#cfdde3'; c.lineWidth = 2; for (let x = -W; x < W * 2; x += W * .06) { c.beginPath(); c.moveTo(x, -H); c.lineTo(x, gy); c.stroke(); } for (let y = 0; y < gy; y += W * .06) { c.beginPath(); c.moveTo(-W, y); c.lineTo(W * 2, y); c.stroke(); }
      k.R(W * .25, H * .14, W * .5, H * .3, '#cfe3ea', 10); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(W * .3, H * .4); c.lineTo(W * .38, H * .17); c.lineTo(W * .43, H * .17); c.lineTo(W * .35, H * .4); c.fill(); k.E(W * .5, H * .1, W * .05, W * .05, '#f2d14b');
      k.R(W * .82, H * .12, W * .12, H * .6, '#f2d14b'); for (let y = H * .15; y < H * .7; y += H * .06) { c.fillStyle = '#fff'; c.beginPath(); c.arc(W * .86, y, 5, 0, 7); c.arc(W * .91, y + H * .03, 5, 0, 7); c.fill(); } });
    layer(.2, () => { k.R(W * .22, gy - H * .14, W * .56, H * .04, '#f4f6f8', 6); k.R(W * .28, gy - H * .1, W * .44, H * .1, '#dfe6ea'); k.R(W * .3, gy - H * .19, W * .05, H * .05, '#3d7bf2', 4); k.R(W * .62, gy - H * .2, W * .04, H * .06, '#e8b54a', 4); });
    layer(0, () => { c.fillStyle = '#7fa6b8'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  houses(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K; K.sky();
    layer(.5, () => { const cols = ['#e8a23b', '#5b9bd5', '#e06a8a', '#7cc27a', '#f2d14b', '#c9573c']; for (let i = -1; i < 6; i++) { const x = i * W * .28 + (v % 2) * W * .1, w = W * .26, h = H * (.18 + (i % 3) * .04), col = cols[(i + 6 + v) % cols.length]; k.R(x, gy - h, w, h, shade(col, K.tone)); c.beginPath(); c.moveTo(x - 8, gy - h); c.lineTo(x + w / 2, gy - h - H * .08); c.lineTo(x + w + 8, gy - h); c.closePath(); c.fillStyle = shade('#8a4a3a', K.tone); c.fill(); c.lineWidth = k.lw; c.strokeStyle = INK; c.stroke(); k.R(x + w * .15, gy - h * .7, w * .25, h * .25, K.night ? '#ffd27a' : '#cfe3ea'); k.R(x + w * .55, gy - h * .55, w * .25, h * .55, shade('#6b4a2e', K.tone)); }
      c.strokeStyle = INK; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-W * .1, gy - H * (.42 + i * .02)); c.quadraticCurveTo(W * .5, gy - H * (.36 + i * .02), W * 1.1, gy - H * (.43 + i * .02)); c.stroke(); } k.R(W * .9, gy - H * .48, W * .025, H * .48, '#7a6a5a'); });
    layer(0, () => { c.fillStyle = shade('#9a9a96', K.tone); c.fillRect(-W, gy, W * 3, H * .04); c.fillStyle = shade('#55575d', K.tone); c.fillRect(-W, gy + H * .04, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.moveTo(-W, gy + H * .04); c.lineTo(W * 2, gy + H * .04); c.stroke(); });
  },
  dentist(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#d6eef0'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .3, H * .08, W * .4, H * .07, '#f4f6f8', 8); k.T('SORRISO+', W * .5, H * .115, W * .045, '#3d6f8a'); k.R(W * .06, H * .22, W * .2, H * .2, '#f4f6f8'); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(W * .12, H * .27); c.quadraticCurveTo(W * .16, H * .24, W * .2, H * .27); c.lineTo(W * .19, H * .36); c.lineTo(W * .17, H * .33); c.lineTo(W * .15, H * .36); c.closePath(); c.fill(); c.lineWidth = k.lw; c.strokeStyle = INK; c.stroke(); k.window_(W * .64, H * .2, W * .28, H * .16, 'day'); });
    layer(.2, () => { c.save(); c.translate(W * .62, gy - H * .12); c.rotate(-.25); k.R(-W * .2, -H * .03, W * .4, H * .05, '#3d9fb0', 14); c.restore(); k.R(W * .55, gy - H * .1, W * .06, H * .1, '#9aa7ab'); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(W * .3, gy - H * .4); c.lineTo(W * .4, gy - H * .3); c.stroke(); k.E(W * .3, gy - H * .41, W * .05, W * .03, '#f4f6f8'); });
    layer(0, () => { c.fillStyle = '#b9cfd3'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  market2(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#f3ead7'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .2, H * .06, W * .6, H * .07, '#d9483b', 6); k.T('MERCADINHO', W * .5, H * .095, W * .05, '#fff'); for (let s = 0; s < 4; s++) { k.R(-W * .05, H * (.2 + s * .1), W * 1.1, H * .012, '#8a5a36'); for (let b = 0; b < 12; b++) k.R(W * (-.03 + b * .09), H * (.2 + s * .1) - H * .06, W * .07, H * .06, PAL(b + s + v, ['#e8a23b', '#5b9bd5', '#e06a8a', '#7cc27a', '#f2d14b', '#c9573c']), 3); } });
    layer(.2, () => { k.R(W * .55, gy - H * .14, W * .4, H * .14, '#c9b48a'); k.R(W * .6, gy - H * .2, W * .1, H * .06, '#2a2c30'); c.fillStyle = '#3ce07a'; c.fillRect(W * .61, gy - H * .195, W * .08, H * .02); });
    layer(0, () => { c.fillStyle = '#d8d2c6'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  busstop(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K; K.sky();
    layer(.6, () => { for (let i = 0; i < 6; i++) k.R(W * (-.1 + i * .22), gy - H * (.25 + (i % 3) * .07), W * .2, H * (.25 + (i % 3) * .07), shade(PAL(i, ['#c9b9a6', '#a8b8c8', '#d9c7a0']), K.tone - .1)); });
    layer(.15, () => { k.R(W * .1, gy - H * .3, W * .5, H * .025, '#3d4a5c'); k.R(W * .12, gy - H * .28, W * .015, H * .28, '#3d4a5c'); k.R(W * .57, gy - H * .28, W * .015, H * .28, '#3d4a5c'); c.fillStyle = 'rgba(200,230,240,.4)'; c.fillRect(W * .135, gy - H * .275, W * .43, H * .2); k.R(W * .2, gy - H * .08, W * .3, H * .02, '#8a5a36'); k.R(W * .78, gy - H * .32, W * .1, H * .06, '#2f7fb0', 4); k.T('ÔNIBUS', W * .83, gy - H * .29, W * .022, '#fff'); k.R(W * .825, gy - H * .26, W * .01, H * .26, '#666'); });
    layer(0, () => { c.fillStyle = shade('#9a9a96', K.tone); c.fillRect(-W, gy, W * 3, H * .04); c.fillStyle = shade('#55575d', K.tone); c.fillRect(-W, gy + H * .04, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  cafe(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#e9d9bd'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .25, H * .08, W * .5, H * .07, '#6b4a2e', 6); k.T('PADARIA', W * .5, H * .115, W * .05, '#f2d14b'); k.R(W * .05, H * .22, W * .9, H * .2, '#f4ece0'); for (let i = 0; i < 6; i++) { c.fillStyle = '#d99a4a'; c.beginPath(); c.ellipse(W * (.13 + i * .14), H * .3, W * .045, H * .018, 0, 0, 7); c.fill(); c.lineWidth = k.lw * .7; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#c86a8a'; c.beginPath(); c.arc(W * (.13 + i * .14), H * .37, W * .025, 0, 7); c.fill(); c.stroke(); } });
    layer(.2, () => { k.R(-W * .05, gy - H * .14, W * 1.1, H * .14, '#8a5a36'); k.R(-W * .05, gy - H * .16, W * 1.1, H * .025, '#b98a5a'); k.R(W * .7, gy - H * .22, W * .06, H * .06, '#f4f1ea', 4); c.fillStyle = 'rgba(255,255,255,.6)'; for (let s = 0; s < 3; s++) { c.beginPath(); c.arc(W * .73 + s * 5, gy - H * (.24 + ((t * .3 + s * .33) % 1) * .05), 4, 0, 7); c.fill(); } });
    layer(0, () => { c.fillStyle = '#c9b8a0'; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); });
  },
  homeoffice(c, K, W, H, v, t) { const k = tk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = shade(PAL(v, ['#d8dde6', '#e6dccf', '#d3e2d6']), K.it); c.fillRect(-W, -H, W * 3, gy + H); k.window_(W * .08, H * .14, W * .3, H * .2, K.night ? 'night' : 'day'); k.R(W * .55, H * .18, W * .38, H * .015, '#6b4a2e'); for (let i = 0; i < 6; i++) k.R(W * (.57 + i * .055), H * .13, W * .04, H * .05, PAL(i, ['#c0392b', '#2980b9', '#27ae60', '#f39c12']), 2); k.R(W * .6, H * .24, W * .14, H * .1, '#f4f1ea'); c.strokeStyle = '#3d7bf2'; c.lineWidth = 3; c.beginPath(); c.moveTo(W * .62, H * .32); c.lineTo(W * .66, H * .28); c.lineTo(W * .69, H * .3); c.lineTo(W * .72, H * .26); c.stroke(); });
    layer(.2, () => { k.R(W * .45, gy - H * .14, W * .5, H * .015, '#8a5a36'); k.R(W * .47, gy - H * .125, W * .02, H * .125, '#6b4a2e'); k.R(W * .9, gy - H * .125, W * .02, H * .125, '#6b4a2e'); k.R(W * .55, gy - H * .26, W * .26, H * .12, '#16171a', 6); const g = c.createLinearGradient(W * .56, 0, W * .8, 0); g.addColorStop(0, '#356CFF'); g.addColorStop(1, '#00D2FF'); c.fillStyle = g; c.fillRect(W * .565, gy - H * .25, W * .23, H * .1); k.R(W * .66, gy - H * .14, W * .04, H * .01, '#16171a'); k.R(W * .84, gy - H * .17, W * .04, H * .03, '#f4f1ea', 4); });
    layer(0, () => { c.save(); tk(c, W, H).floorBoards(gy, shade('#a8825a', K.it)); c.restore(); });
  },
});
SET_GUIDE += `\nCenários no estilo cartoon (preferidos em histórias do dia a dia): ${Object.keys(TOON_PLACES).join('|')}.`;

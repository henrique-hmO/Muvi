/* ============ PLACES 3: mais cenários do dia a dia (casa, prédio, transporte, comércio) ============ */
const HOME_PLACES = {
  dining: 'Sala de jantar / almoço de família', backyard: 'Quintal com churrasqueira', laundry: 'Área de serviço', hallway: 'Corredor de casa', balcony: 'Varanda / sacada',
  elevator: 'Elevador', lobby: 'Portaria de prédio', pool: 'Piscina', party: 'Festa de aniversário', hotel: 'Quarto de hotel',
  bus_in: 'Dentro do ônibus', subway: 'Metrô', mall: 'Shopping', pharmacy: 'Farmácia', gas: 'Posto de gasolina',
  garage2: 'Oficina mecânica', podcast: 'Estúdio de podcast', hosproom: 'Quarto de hospital (leito)', lottery: 'Lotérica', wake: 'Velório',
};
PLACES.push(...Object.keys(HOME_PLACES)); Object.assign(PLACE_NAMES, HOME_PLACES);
['dining', 'laundry', 'hallway', 'elevator', 'lobby', 'party', 'hotel', 'bus_in', 'subway', 'mall', 'pharmacy', 'garage2', 'podcast', 'hosproom', 'lottery', 'wake'].forEach(p => CINE_INDOOR.add(p));

function hk(c, W, H) {
  const k = tk(c, W, H);
  const wall = (gy, col, stripe) => { c.fillStyle = col; c.fillRect(-W, -H, W * 3, gy + H); if (stripe) { c.fillStyle = 'rgba(0,0,0,.05)'; for (let x = -W; x < W * 2; x += W * .06) c.fillRect(x, -H, W * .03, gy + H); } c.fillStyle = shade(col, -.12); c.fillRect(-W, gy - H * .025, W * 3, H * .025); };
  const tiles = (gy, a, b, s = W * .1) => { for (let y = gy; y < H * 1.3; y += s * .6) for (let x = -W, i = 0; x < W * 2; x += s, i++) { c.fillStyle = ((i + Math.round((y - gy) / (s * .6))) % 2) ? a : b; c.fillRect(x, y, s, s * .6); } c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); };
  const plain = (gy, col) => { c.fillStyle = col; c.fillRect(-W, gy, W * 3, H * 1.3); c.strokeStyle = INK; c.lineWidth = k.lw; c.beginPath(); c.moveTo(-W, gy); c.lineTo(W * 2, gy); c.stroke(); };
  const door = (x, y, w, h, col = '#8a6a4a') => { k.R(x - w * .06, y - h * .03, w * 1.12, h * 1.03, '#e8e2d8'); k.R(x, y, w, h, col); k.E(x + w * .82, y + h * .55, w * .05, w * .05, '#d8c27a'); };
  const frame = (x, y, w, h, col = '#c9a46a') => { k.R(x, y, w, h, '#2e2a26'); k.R(x + w * .1, y + h * .1, w * .8, h * .8, col); };
  const lamp = (x, y, r) => { k.E(x, y, r, r * .45, '#f4ecd6'); c.fillStyle = 'rgba(255,240,200,.18)'; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x - r * 3, y + r * 6); c.lineTo(x + r * 3, y + r * 6); c.lineTo(x + r, y); c.fill(); };
  const plant = (x, gy, s) => { k.R(x - s * .3, gy - s * .6, s * .6, s * .6, '#b8653e', 4); for (const [dx, dy, r] of [[0, -1.2, .45], [-.35, -.95, .35], [.35, -.95, .35], [0, -.85, .4]]) k.E(x + dx * s, gy + dy * s, r * s, r * s * 1.1, '#5a8a52'); };
  return { ...k, wall, tiles, plain, door, frame, lamp, plant };
}

Object.assign(PLACE_DRAW, {
  dining(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, shade(PAL(v, ['#e6d6bd', '#cfd9cf', '#e3c9b8']), K.it), true); k.window_(W * .6, H * .14, W * .3, H * .22, K.night ? 'night' : 'day'); k.frame(W * .12, H * .18, W * .22, H * .14); k.lamp(W * .5, H * .1, W * .04);
      k.R(W * .06, gy - H * .2, W * .2, H * .2, '#7a5236'); for (let i = 0; i < 3; i++) k.E(W * (.1 + i * .06), gy - H * .22, W * .02, W * .02, PAL(i, ['#f4f1ea', '#e0c27a', '#c66a4a'])); });
    K.ground && (c.save(), k.floorBoards(gy, shade('#a5774f', K.it)), c.restore());
    layer(.05, () => { k.R(W * .18, gy - H * .11, W * .64, H * .02, '#8a5a36'); k.R(W * .22, gy - H * .09, W * .02, H * .09, '#6a4428'); k.R(W * .76, gy - H * .09, W * .02, H * .09, '#6a4428'); c.fillStyle = '#f4f1ea'; c.fillRect(W * .18, gy - H * .115, W * .64, H * .008);
      for (const [x, col] of [[.32, '#f4f1ea'], [.5, '#d99a3a'], [.68, '#f4f1ea']]) { k.E(W * x, gy - H * .12, W * .05, H * .01, '#e9e6e0'); k.E(W * x, gy - H * .125, W * .03, H * .008, col === '#d99a3a' ? '#8a4a2a' : '#f2f0e8'); }
      k.E(W * .5, gy - H * .135, W * .06, H * .02, '#c9853f'); c.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(W * (.48 + i * .02), gy - H * (.16 + Math.sin(t * 2 + i) * .01), W * .006, 0, 7); c.fill(); } });
  },
  backyard(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.7, () => { const [a, b] = SKY[K.night ? 'night' : K.dusk ? 'dusk' : 'day'] || SKY.day; const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-W, -H, W * 3, gy + H); });
    layer(.45, () => { k.R(-W * .1, gy - H * .32, W * 1.2, H * .32, '#d9cbb3'); c.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < W; x += W * .08) c.fillRect(x, gy - H * .32, 2, H * .32); for (let i = 0; i < 6; i++) k.E(W * (.05 + i * .18), gy - H * .33, W * .08, H * .05, '#5f8f52'); c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, gy - H * .26); c.quadraticCurveTo(W * .3, gy - H * .22, W * .55, gy - H * .27); c.stroke(); for (let i = 0; i < 4; i++) k.R(W * (.08 + i * .1), gy - H * .25, W * .05, H * .06, PAL(i, ['#c6503a', '#3f6fb0', '#e8c14e', '#f4f1ea'])); });
    layer(.15, () => { k.R(W * .62, gy - H * .3, W * .28, H * .3, '#b9654a'); k.R(W * .6, gy - H * .32, W * .32, H * .03, '#8a4a36'); k.R(W * .66, gy - H * .2, W * .2, H * .06, '#2a2624'); for (let i = 0; i < 4; i++) k.R(W * (.67 + i * .045), gy - H * .215, W * .03, H * .01, '#8a3a2a', 2);
      c.fillStyle = 'rgba(220,220,220,.35)'; for (let i = 0; i < 4; i++) { const y = gy - H * (.25 + ((t * .15 + i * .1) % .35)); c.beginPath(); c.arc(W * (.76 + Math.sin(t + i) * .02), y, W * (.03 + i * .006), 0, 7); c.fill(); } k.R(W * .05, gy - H * .12, W * .12, H * .12, '#3a6ab0', 4); k.R(W * .05, gy - H * .14, W * .12, H * .025, '#f4f1ea'); });
    layer(0, () => k.tiles(gy, '#b9b0a3', '#aaa194', W * .12));
  },
  laundry(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#dfe3e2'); for (let y = gy - H * .3; y < gy; y += H * .04) for (let x = -W; x < W * 2; x += W * .08) { c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 2; c.strokeRect(x, y, W * .08, H * .04); }
      k.window_(W * .1, H * .14, W * .22, H * .16, K.night ? 'night' : 'day'); c.strokeStyle = '#777'; c.lineWidth = 2; c.beginPath(); c.moveTo(W * .4, H * .2); c.lineTo(W * .95, H * .2); c.stroke(); for (let i = 0; i < 4; i++) k.R(W * (.43 + i * .13), H * .2, W * .1, H * (.1 + (i % 2) * .04), PAL(i, ['#f4f1ea', '#3f6fb0', '#d9483b', '#e8c14e'])); });
    layer(.1, () => { k.R(W * .1, gy - H * .2, W * .26, H * .2, '#f0f0ee', 8); k.E(W * .23, gy - H * .1, W * .08, W * .08, '#cfd8de'); k.E(W * .23, gy - H * .1, W * .06, W * .06, `rgba(80,120,170,${.4 + .2 * Math.sin(t * 6)})`); k.R(W * .12, gy - H * .19, W * .22, H * .02, '#d9d9d6');
      k.R(W * .5, gy - H * .16, W * .3, H * .16, '#c9ccd0', 4); k.R(W * .52, gy - H * .15, W * .26, H * .05, '#9aa6b0'); k.R(W * .84, gy - H * .12, W * .1, H * .12, '#3a6ab0', 6); });
    layer(0, () => k.tiles(gy, '#c8c3ba', '#bdb8af'));
  },
  hallway(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, shade('#d9cbb7', K.it), true); k.door(W * .08, gy - H * .32, W * .2, H * .32); k.door(W * .72, gy - H * .32, W * .2, H * .32, '#7a5a3e'); k.frame(W * .4, H * .2, W * .2, H * .13, '#7a8a9a'); k.lamp(W * .5, H * .06, W * .035); });
    K.ground && (c.save(), k.floorBoards(gy, shade('#8f6a4a', K.it)), c.restore());
    layer(0, () => { c.fillStyle = '#7a3a34'; c.beginPath(); c.moveTo(W * .3, gy); c.lineTo(W * .7, gy); c.lineTo(W * .85, H); c.lineTo(W * .15, H); c.fill(); });
  },
  balcony(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.8, () => { const [a, b] = SKY[K.night ? 'night' : K.dusk ? 'dusk' : 'day'] || SKY.day; const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-W, -H, W * 3, gy + H); });
    layer(.6, () => { for (let i = 0; i < 9; i++) { const x = W * (-.05 + i * .13), h = H * (.2 + ((i * 37) % 5) * .05); k.R(x, gy - h - H * .08, W * .11, h, PAL(i, ['#8a93a3', '#a3988a', '#7f8a9a', '#9aa39a'])); c.fillStyle = K.night ? 'rgba(255,220,140,.7)' : 'rgba(255,255,255,.35)'; for (let y = gy - h - H * .06; y < gy - H * .1; y += H * .04) c.fillRect(x + W * .02, y, W * .025, H * .02); } });
    layer(.1, () => { k.R(-W, gy - H * .14, W * 3, H * .02, '#2e2e32'); for (let x = -W; x < W * 2; x += W * .05) k.R(x, gy - H * .12, W * .008, H * .12, '#2e2e32'); k.plant(W * .1, gy, W * .1); k.plant(W * .88, gy, W * .08); });
    layer(0, () => k.tiles(gy, '#c9b9a3', '#bba991'));
  },
  elevator(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.3, () => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#9aa0a8'); g.addColorStop(.5, '#d6d9dd'); g.addColorStop(1, '#9aa0a8'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, gy + H); c.fillStyle = 'rgba(0,0,0,.08)'; for (let x = -W; x < W * 2; x += W * .2) c.fillRect(x, -H, 3, gy + H);
      k.R(W * .78, H * .3, W * .1, H * .2, '#2a2c30', 6); for (let i = 0; i < 6; i++) k.E(W * (.81 + (i % 2) * .04), H * (.33 + Math.floor(i / 2) * .05), W * .012, W * .012, i === 3 ? '#f2b33d' : '#c9ccd2');
      k.R(W * .38, H * .06, W * .24, H * .06, '#16181c', 6); k.T(String(Math.min(12, 1 + Math.floor(t * 1.5))), W * .5, H * .09, W * .05, '#ff5a3a'); k.R(W * .2, H * .2, W * .4, H * .25, '#bfc8d0'); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(W * .25, H * .22, W * .05, H * .2); });
    layer(0, () => k.plain(gy, '#5a5550'));
  },
  lobby(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#cfc6b8'); k.R(-W, H * .08, W * 3, H * .04, '#8a7a66'); k.T('RESIDENCIAL', W * .5, H * .1, W * .035, '#f4f1ea'); k.R(W * .62, H * .18, W * .32, H * .35, '#9ec2d6'); c.strokeStyle = '#2e2e32'; c.lineWidth = k.lw * 2; c.strokeRect(W * .62, H * .18, W * .32, H * .35); c.beginPath(); c.moveTo(W * .78, H * .18); c.lineTo(W * .78, H * .53); c.stroke();
      for (let i = 0; i < 12; i++) k.R(W * (.06 + (i % 4) * .07), H * (.2 + Math.floor(i / 4) * .06), W * .06, H * .045, '#b59a6a', 2); k.plant(W * .52, gy, W * .07); });
    layer(.05, () => { k.R(W * .02, gy - H * .14, W * .42, H * .14, '#5a4636'); k.R(W * 0, gy - H * .155, W * .46, H * .02, '#3a2e24'); k.R(W * .14, gy - H * .22, W * .12, H * .07, '#2a2c30', 4); k.R(W * .15, gy - H * .215, W * .1, H * .055, '#5a8aaa'); });
    layer(0, () => k.tiles(gy, '#e6e0d6', '#d6cfc3', W * .16));
  },
  pool(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.7, () => { const [a, b] = SKY[K.night ? 'night' : K.dusk ? 'dusk' : 'day'] || SKY.day; const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-W, -H, W * 3, gy + H); for (let i = 0; i < 3; i++) { const x = W * (.15 + i * .35); k.R(x - 4, gy - H * .42, 8, H * .3, '#7a5a3a'); for (let j = 0; j < 5; j++) { c.save(); c.translate(x, gy - H * .42); c.rotate(-1.2 + j * .6 + Math.sin(t + j) * .04); k.E(W * .1, 0, W * .1, H * .015, '#4f8a4a'); c.restore(); } } });
    layer(.3, () => { k.R(-W, gy - H * .12, W * 3, H * .12, '#e6dccb'); k.R(W * .55, gy - H * .17, W * .3, H * .025, '#f4f1ea', 6); k.R(W * .58, gy - H * .145, W * .02, H * .04, '#bbb'); k.R(W * .8, gy - H * .145, W * .02, H * .04, '#bbb'); c.beginPath(); c.arc(W * .3, gy - H * .2, W * .12, Math.PI, 0); c.fillStyle = '#d9483b'; c.fill(); k.R(W * .3 - 3, gy - H * .2, 6, H * .1, '#888'); });
    layer(0, () => { const g = c.createLinearGradient(0, gy, 0, H); g.addColorStop(0, '#5fc4d9'); g.addColorStop(1, '#2a8aaa'); c.fillStyle = g; c.fillRect(-W, gy, W * 3, H); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = gy + H * (.03 + i * .025); c.beginPath(); for (let x = -W; x < W * 2; x += 20) c.lineTo(x, y + Math.sin(x * .02 + t * 2 + i) * 4); c.stroke(); } c.fillStyle = '#f4f1ea'; c.fillRect(-W, gy - 6, W * 3, 12); });
  },
  party(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, shade(PAL(v, ['#f2d7d9', '#d9e6f2', '#f2ead0']), K.it)); c.strokeStyle = '#999'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, H * .1); c.quadraticCurveTo(W / 2, H * .2, W, H * .1); c.stroke();
      for (let i = 0; i < 11; i++) { const x = W * (i / 10), y = H * .1 + Math.sin(Math.PI * i / 10) * H * .08; c.fillStyle = PAL(i, ['#d9483b', '#3f6fb0', '#e8c14e', '#5aa36a', '#b45ab0']); c.beginPath(); c.moveTo(x - W * .025, y); c.lineTo(x + W * .025, y); c.lineTo(x, y + H * .045); c.fill(); }
      k.T('PARABÉNS!', W * .5, H * .3, W * .08, '#d9483b'); for (const [x, col] of [[.1, '#d9483b'], [.9, '#3f6fb0'], [.18, '#e8c14e']]) { const y = H * (.32 + Math.sin(t * 1.5 + x * 9) * .01); k.E(W * x, y, W * .045, W * .055, col); c.strokeStyle = '#888'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W * x, y + W * .055); c.lineTo(W * x, y + H * .14); c.stroke(); } });
    K.ground && (c.save(), k.floorBoards(gy, shade('#a5774f', K.it)), c.restore());
    layer(.05, () => { k.R(W * .25, gy - H * .12, W * .5, H * .12, '#f4f1ea'); for (let i = 0; i < 7; i++) k.E(W * (.3 + i * .065), gy - H * .125, W * .022, H * .01, PAL(i, ['#8a4a2a', '#e8c14e', '#d9483b'])); k.R(W * .44, gy - H * .2, W * .12, H * .075, '#f2c4d0', 6); k.R(W * .44, gy - H * .2, W * .12, H * .015, '#fff'); c.fillStyle = '#f2b33d'; c.beginPath(); c.ellipse(W * .5, gy - H * (.215 + Math.sin(t * 12) * .002), 4, 8, 0, 0, 7); c.fill(); });
  },
  hotel(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#d8cdbd'); k.R(W * .25, H * .14, W * .5, H * .3, '#5a4636'); c.fillStyle = 'rgba(255,255,255,.06)'; for (let x = W * .27; x < W * .75; x += W * .06) c.fillRect(x, H * .15, 4, H * .28); k.frame(W * .38, H * .2, W * .24, H * .1, '#9ab0c4'); k.lamp(W * .12, H * .3, W * .03); k.lamp(W * .88, H * .3, W * .03); k.window_(W * .8, H * .12, W * .16, H * .2, K.night ? 'night' : 'day'); });
    layer(.05, () => { k.R(W * .18, gy - H * .14, W * .64, H * .14, '#f4f2ee', 6); k.R(W * .18, gy - H * .08, W * .64, H * .08, '#c9b79a'); k.R(W * .22, gy - H * .19, W * .2, H * .06, '#fff', 10); k.R(W * .58, gy - H * .19, W * .2, H * .06, '#fff', 10); k.R(W * .02, gy - H * .12, W * .12, H * .12, '#5a4636'); k.R(W * .86, gy - H * .12, W * .12, H * .12, '#5a4636'); });
    layer(0, () => k.plain(gy, '#8a7a6a'));
  },
  bus_in(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K, sh = Math.sin(t * 9) * 2;
    layer(.6, () => { const [a, b] = SKY[K.night ? 'night' : K.dusk ? 'dusk' : 'day'] || SKY.day; c.fillStyle = a; c.fillRect(-W, -H, W * 3, gy + H); for (let i = 0; i < 8; i++) { const x = ((i * W * .3 - t * W * .8) % (W * 2.4) + W * 2.4) % (W * 2.4) - W * .4; k.R(x, H * .2, W * .2, H * .2, PAL(i, ['#8a93a3', '#a3988a', '#7f8a9a'])); } });
    layer(.3, () => { c.save(); c.translate(0, sh); c.fillStyle = '#d9d4c8'; c.fillRect(-W, -H, W * 3, H * .16 + H); c.fillRect(-W, H * .44, W * 3, gy); for (let x = -W; x < W * 2; x += W * .34) { c.fillRect(x, H * .1, W * .06, H * .36); } c.strokeStyle = '#a0a4aa'; c.lineWidth = 8; c.beginPath(); c.moveTo(-W, H * .08); c.lineTo(W * 2, H * .08); c.stroke(); for (let i = 0; i < 5; i++) { const x = W * (.1 + i * .22); c.beginPath(); c.moveTo(x, H * .08); c.lineTo(x, H * .14); c.stroke(); k.E(x, H * .16, W * .02, W * .02, '#e8c14e'); } c.restore(); });
    layer(.05, () => { for (const x of [-.05, .62]) { k.R(W * x, gy - H * .2, W * .4, H * .06, '#3f5a8a', 8); k.R(W * x, gy - H * .14, W * .4, H * .14, '#2e4470', 4); } });
    layer(0, () => k.plain(gy, '#4a4a4e'));
  },
  subway(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#d9dcdf'; c.fillRect(-W, -H, W * 3, gy + H); for (const x of [.08, .58]) { k.R(W * x, H * .14, W * .34, H * .16, '#1d2229'); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(W * x + (t * 200) % (W * .34), H * .14, W * .06, H * .16); } k.R(-W, H * .04, W * 3, H * .04, '#e2312b'); k.R(W * .4, H * .32, W * .2, H * .04, '#1d2229', 4); k.T('LINHA 1', W * .5, H * .34, W * .025, '#f2b33d'); c.strokeStyle = '#9aa0a8'; c.lineWidth = 7; c.beginPath(); c.moveTo(-W, H * .1); c.lineTo(W * 2, H * .1); c.stroke(); });
    layer(.05, () => { k.R(-W * .1, gy - H * .14, W * .5, H * .14, '#3a6a9a', 6); k.R(W * .6, gy - H * .14, W * .5, H * .14, '#3a6a9a', 6); k.R(W * .47, gy - H * .5, W * .02, H * .5, '#b0b5bb'); });
    layer(0, () => k.plain(gy, '#6a6e74'));
  },
  mall(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#ecebe8'; c.fillRect(-W, -H, W * 3, gy + H); for (let i = 0; i < 3; i++) { const x = W * (-.05 + i * .38); k.R(x, H * .16, W * .34, H * .44, '#f8f7f4'); k.R(x + W * .02, H * .24, W * .3, H * .34, '#b9d2de'); k.R(x, H * .16, W * .34, H * .06, PAL(i, ['#d9483b', '#1f3a6b', '#2e7d5b'])); k.T(['MODA', 'TECH', 'SPORT'][i], x + W * .17, H * .19, W * .035, '#fff'); for (let j = 0; j < 3; j++) k.R(x + W * (.05 + j * .09), H * .36, W * .06, H * .14, PAL(i + j, ['#e8c14e', '#d9483b', '#3f6fb0', '#2a2a2e']), 4); } k.R(-W, H * .1, W * 3, H * .02, '#c9c6c0'); });
    layer(0, () => k.tiles(gy, '#efece6', '#e3dfd7', W * .2));
  },
  pharmacy(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#f2f4f3'; c.fillRect(-W, -H, W * 3, gy + H); k.R(W * .3, H * .06, W * .4, H * .07, '#2e9d55', 6); k.T('FARMÁCIA', W * .5, H * .095, W * .045, '#fff'); c.fillStyle = '#2e9d55'; c.fillRect(W * .12, H * .07, W * .02, W * .06); c.fillRect(W * .1, H * .07 + W * .02, W * .06, W * .02);
      for (let r = 0; r < 4; r++) { k.R(W * .02, H * (.2 + r * .1), W * .96, H * .012, '#c9ccd0'); for (let i = 0; i < 14; i++) k.R(W * (.03 + i * .068), H * (.2 + r * .1) - H * .055, W * .05, H * .055, PAL(i + r * 3, ['#f4f1ea', '#d9483b', '#3f6fb0', '#e8c14e', '#2e9d55', '#e7a0b8']), 3); } });
    layer(.05, () => { k.R(W * .2, gy - H * .14, W * .6, H * .14, '#e9ecef'); k.R(W * .18, gy - H * .155, W * .64, H * .02, '#2e9d55'); k.R(W * .62, gy - H * .22, W * .12, H * .07, '#2a2c30', 4); });
    layer(0, () => k.tiles(gy, '#e8ebe9', '#dde1df', W * .16));
  },
  gas(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.7, () => { const [a, b] = SKY[K.night ? 'night' : K.dusk ? 'dusk' : 'day'] || SKY.day; const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-W, -H, W * 3, gy + H); });
    layer(.35, () => { k.R(-W, H * .12, W * 3, H * .06, '#f2f2f0'); k.R(-W, H * .17, W * 3, H * .015, '#d9483b'); for (const x of [.08, .9]) k.R(W * x, H * .18, W * .03, gy - H * .18, '#e9e9e6'); k.R(W * .78, H * .22, W * .18, H * .2, '#1f3a6b', 6); k.T('GASOLINA', W * .87, H * .25, W * .022, '#fff'); k.T('R$ 6,49', W * .87, H * .3, W * .035, '#f2b33d'); k.T('ETANOL', W * .87, H * .35, W * .022, '#fff'); k.T('R$ 4,29', W * .87, H * .39, W * .035, '#f2b33d'); });
    layer(.1, () => { for (const x of [.25, .55]) { k.R(W * x, gy - H * .22, W * .12, H * .22, '#f2f2f0', 6); k.R(W * x, gy - H * .22, W * .12, H * .05, '#d9483b', 6); k.R(W * (x + .02), gy - H * .15, W * .08, H * .04, '#1d2229'); k.T('00,0', W * (x + .06), gy - H * .13, W * .022, '#7fe08a'); c.strokeStyle = '#1d1d20'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * (x + .12), gy - H * .12); c.quadraticCurveTo(W * (x + .18), gy - H * .05, W * (x + .14), gy - H * .02); c.stroke(); } });
    layer(0, () => k.plain(gy, '#6a6a6e'));
  },
  garage2(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#bdb6aa'); k.R(-W, H * .06, W * 3, H * .05, '#2a2c30'); k.T('AUTO MECÂNICA', W * .5, H * .085, W * .04, '#f2b33d'); k.R(W * .05, H * .18, W * .4, H * .22, '#5a5f66'); for (let i = 0; i < 10; i++) { c.strokeStyle = '#d9dcdf'; c.lineWidth = 4; c.beginPath(); c.moveTo(W * (.08 + i * .035), H * .22); c.lineTo(W * (.08 + i * .035), H * (.3 + (i % 3) * .02)); c.stroke(); }
      for (let i = 0; i < 4; i++) { k.E(W * (.6 + i * .09), gy - H * .06, W * .045, W * .045, '#1d1d20'); k.E(W * (.6 + i * .09), gy - H * .06, W * .02, W * .02, '#8a8f97'); } k.R(W * .55, H * .2, W * .4, H * .2, '#c9483a', 4); });
    layer(0, () => { k.plain(gy, '#7a7670'); c.fillStyle = 'rgba(30,25,20,.25)'; c.beginPath(); c.ellipse(W * .35, gy + H * .06, W * .12, H * .02, 0, 0, 7); c.fill(); });
  },
  podcast(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { c.fillStyle = '#23262c'; c.fillRect(-W, -H, W * 3, gy + H); c.fillStyle = '#2c3038'; for (let x = -W; x < W * 2; x += W * .08) for (let y = -H; y < gy; y += W * .08) if (((x + y) / (W * .08)) % 2 < 1) c.fillRect(x, y, W * .078, W * .078);
      k.R(W * .3, H * .1, W * .4, H * .1, '#111', 8); c.fillStyle = `hsl(${(t * 40) % 360},70%,60%)`; c.font = `900 ${W * .05}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PODCAST', W * .5, H * .15); k.E(W * .5, H * .15 - 2, 0, 0, '#000');
      c.fillStyle = 'rgba(255,60,60,.9)'; c.beginPath(); c.arc(W * .12, H * .12, W * .015, 0, 7); c.fill(); k.T('AO VIVO', W * .2, H * .12, W * .025, '#fff'); });
    layer(.05, () => { k.R(W * .1, gy - H * .12, W * .8, H * .02, '#5a3e2a'); k.R(W * .48, gy - H * .1, W * .04, H * .1, '#3a2a1e'); for (const x of [.28, .72]) { c.strokeStyle = '#1d1d20'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * x, gy - H * .12); c.lineTo(W * x, gy - H * .18); c.lineTo(W * (x + (x < .5 ? .05 : -.05)), gy - H * .22); c.stroke(); k.R(W * (x + (x < .5 ? .03 : -.07)), gy - H * .25, W * .04, H * .05, '#2a2c30', 10); } });
    layer(0, () => k.plain(gy, '#3a3530'));
  },
  hosproom(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#dfe9e6'); k.window_(W * .64, H * .14, W * .28, H * .2, K.night ? 'night' : 'day'); k.R(W * .06, H * .16, W * .24, H * .16, '#1d2229', 6); c.strokeStyle = '#4fe07a'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x < W * .22; x += 4) { const p = ((x + t * 120) % (W * .1)) / (W * .1); c.lineTo(W * .07 + x, H * .25 - (p > .45 && p < .5 ? H * .05 : p > .5 && p < .55 ? -H * .02 : 0)); } c.stroke(); k.T(String(72 + Math.round(Math.sin(t) * 3)), W * .26, H * .19, W * .025, '#4fe07a');
      c.strokeStyle = '#b0b5bb'; c.lineWidth = 4; c.beginPath(); c.moveTo(W * .4, H * .1); c.lineTo(W * .4, gy); c.stroke(); k.R(W * .37, H * .12, W * .06, H * .08, 'rgba(200,230,255,.8)', 6); });
    layer(.05, () => { k.R(W * .3, gy - H * .16, W * .62, H * .05, '#f4f6f8', 8); k.R(W * .3, gy - H * .11, W * .62, H * .02, '#9aa6b0'); k.R(W * .32, gy - H * .09, W * .02, H * .09, '#9aa6b0'); k.R(W * .88, gy - H * .09, W * .02, H * .09, '#9aa6b0'); k.R(W * .82, gy - H * .26, W * .02, H * .12, '#9aa6b0'); k.R(W * .34, gy - H * .2, W * .14, H * .045, '#fff', 10); k.R(W * .45, gy - H * .17, W * .45, H * .02, '#7fa8c9', 6); });
    layer(0, () => k.tiles(gy, '#e7ece9', '#dce3df', W * .14));
  },
  lottery(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#f2f2ee'); k.R(-W, H * .05, W * 3, H * .08, '#1f5fa8'); k.T('LOTÉRICA', W * .5, H * .09, W * .06, '#f2c33d'); k.R(W * .55, H * .18, W * .4, H * .18, '#1f5fa8', 6); k.T('ACUMULOU!', W * .75, H * .23, W * .04, '#f2c33d'); k.T('R$ 85 MILHÕES', W * .75, H * .3, W * .045, '#fff');
      for (let i = 0; i < 6; i++) k.E(W * (.1 + i * .065), H * .28, W * .028, W * .028, PAL(i, ['#2e9d55', '#f2c33d', '#d9483b', '#1f5fa8'])); });
    layer(.05, () => { k.R(W * .02, gy - H * .16, W * .96, H * .16, '#d9dde2'); for (let i = 0; i < 3; i++) { k.R(W * (.06 + i * .32), gy - H * .3, W * .26, H * .14, 'rgba(190,215,230,.7)'); k.T(`CAIXA ${i + 1}`, W * (.19 + i * .32), gy - H * .28, W * .02, '#1f5fa8'); } });
    layer(0, () => k.tiles(gy, '#e2ddd3', '#d6d0c4', W * .16));
  },
  wake(c, K, W, H, v, t) { const k = hk(c, W, H), { gy, layer } = K;
    layer(.5, () => { k.wall(gy, '#cfc8bf'); k.R(W * .44, H * .1, W * .12, H * .03, '#6a5a4a'); k.R(W * .485, H * .05, W * .03, H * .13, '#6a5a4a'); for (const x of [.15, .85]) { k.R(W * x - 6, H * .22, 12, gy - H * .22, '#c9a85a'); c.fillStyle = `rgba(255,200,120,${.5 + .2 * Math.sin(t * 7 + x * 9)})`; c.beginPath(); c.ellipse(W * x, H * .2, 7, 14, 0, 0, 7); c.fill(); } });
    layer(.05, () => { k.R(W * .22, gy - H * .14, W * .56, H * .06, '#5a3a26', 6); k.R(W * .24, gy - H * .08, W * .52, H * .08, '#3a2a1e'); for (let i = 0; i < 9; i++) k.E(W * (.24 + i * .065), gy - H * .15, W * .03, W * .03, PAL(i, ['#f4f1ea', '#e7c6d4', '#f2e6b0'])); for (let i = 0; i < 9; i++) k.E(W * (.24 + i * .065), gy - H * .15, W * .01, W * .01, '#e8c14e'); });
    layer(0, () => k.plain(gy, '#7a7066'));
  },
});

const HOME_GUIDE = `Cenários do dia a dia (use os que combinam com a fala, variando a cada cena): ${Object.entries(HOME_PLACES).map(([k, v]) => `"${k}" (${v})`).join(', ')}.`;

/* ---------- household / everyday elements (cinematic style, used in both styles) ---------- */
const HOME_THINGS = { fridge: 'Geladeira', stove: 'Fogão com panela', microwave: 'Micro-ondas', sofa: 'Sofá', door: 'Porta (abrindo)', plate: 'Prato de comida', bill: 'Conta / boleto', cart: 'Carrinho de mercado', package: 'Caixa de entrega', cctv: 'Câmera de segurança', safe: 'Cofre', contract: 'Contrato', keys: 'Chaves', pills: 'Remédios', trash: 'Saco de lixo', glass: 'Copo de bebida' };
Object.assign(THINGS, HOME_THINGS);
Object.assign(THING_GROUND, { fridge: [.5, .95], stove: [.3, .6], sofa: [.22, 1.2], door: [.5, .62], cart: [.32, .6], safe: [.28, .5], trash: [.2, .35], package: [.16, .3] });
const HOME_DRAW = {
  fridge(c, s, t, a) { const k = cineKit(c, s); k.shadow(.5, .24); k.R(-.2, -.5, .4, 1, .04, k.hgrad('#e9ebee', -.2, .2)); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-.2 * s, -.18 * s, .4 * s, .008 * s); k.R(.13, -.44, .02, .2, .01, '#9aa0a8'); k.R(.13, -.12, .02, .26, .01, '#9aa0a8');
    if (a === 'shake') { const o = clamp((t % 4) / .5); c.fillStyle = 'rgba(255,248,220,.5)'; c.beginPath(); c.moveTo(-.2 * s, -.16 * s); c.lineTo((-.2 - .3 * o) * s, -.2 * s); c.lineTo((-.2 - .3 * o) * s, .55 * s); c.lineTo(-.2 * s, .5 * s); c.fill(); } },
  stove(c, s, t) { const k = cineKit(c, s); k.shadow(.3, .3); k.R(-.3, -.18, .6, .48, .02, k.hgrad('#d9dcdf', -.3, .3)); k.R(-.24, -.04, .48, .26, .02, '#2a2c30'); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(-.22 * s, -.02 * s, .1 * s, .22 * s); k.R(-.3, -.22, .6, .04, .01, '#1d1f22');
    for (const x of [-.2, -.08, .04, .16]) k.E(x, -.12, .02, .02, '#5a5f66'); k.P([[-.2, -.22], [.06, -.22], [.04, -.38], [-.18, -.38]], k.grad('#8f959d', -.38, -.22), false); k.R(-.22, -.4, .3, .03, .01, '#5a5f66'); k.R(.06, -.33, .1, .02, .01, '#2a2c30');
    c.fillStyle = 'rgba(235,235,235,.4)'; for (let i = 0; i < 3; i++) { const y = -.45 - ((t * .3 + i * .12) % .35); c.beginPath(); c.arc((-.07 + Math.sin(t * 2 + i) * .03) * s, y * s, (.03 + i * .01) * s, 0, 7); c.fill(); } },
  microwave(c, s, t) { const k = cineKit(c, s); k.R(-.28, -.16, .56, .32, .03, k.hgrad('#d9dcdf', -.28, .28)); k.R(-.24, -.12, .36, .24, .02, '#1d2229'); c.fillStyle = `rgba(255,210,120,${.25 + .1 * Math.sin(t * 5)})`; c.fillRect(-.23 * s, -.11 * s, .34 * s, .22 * s); k.R(.15, -.12, .1, .06, .01, '#16181c'); c.fillStyle = '#7fe08a'; c.font = `700 ${.04 * s}px monospace`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`0:${String(30 - Math.floor(t) % 30).padStart(2, '0')}`, .2 * s, -.09 * s); },
  sofa(c, s) { const k = cineKit(c, s), col = '#6a7a8a'; k.shadow(.22, .55); k.R(-.55, -.3, 1.1, .3, .06, k.grad(shade(col, -.06), -.3, 0)); k.R(-.5, -.04, 1.0, .18, .04, k.grad(col, -.04, .14)); k.R(-.6, -.16, .14, .3, .05, k.grad(col, -.16, .14)); k.R(.46, -.16, .14, .3, .05, k.grad(col, -.16, .14)); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-.02 * s, -.04 * s, .01 * s, .18 * s); k.R(-.5, .14, .04, .08, .01, '#3a2a1e'); k.R(.46, .14, .04, .08, .01, '#3a2a1e'); k.R(-.35, -.22, .2, .14, .05, '#c9853f'); },
  door(c, s, t, a) { const k = cineKit(c, s), o = a === 'idle' ? .25 : clamp((t % 5) / 1.2); k.R(-.32, -.5, .64, 1, .01, '#e8e2d8'); k.R(-.28, -.47, .56, .97, 0, '#0c0a09'); c.fillStyle = 'rgba(255,236,200,.35)'; c.beginPath(); c.moveTo(-.28 * s, .5 * s); c.lineTo((-.28 + .56 * o) * s, .5 * s); c.lineTo((-.28 + .9 * o) * s, .7 * s); c.lineTo(-.4 * s, .7 * s); c.fill();
    const w = .56 * (1 - o * .75); k.P([[-.28, -.47], [-.28 + w, -.47 + o * .04], [-.28 + w, .5 - o * .04], [-.28, .5]], k.hgrad('#8a6a4a', -.28, -.28 + w), false); k.E(-.28 + w * .85, .02, .018, .018, '#d8c27a'); },
  plate(c, s, t) { const k = cineKit(c, s); k.E(0, .02, .3, .07, '#d9d6d0'); k.E(0, 0, .28, .06, '#f4f2ee'); k.E(-.08, -.02, .12, .04, '#f2efe6'); k.E(.08, -.02, .1, .035, '#5a2e1e'); k.E(.02, -.05, .06, .025, '#c9853f'); k.E(-.14, -.04, .05, .02, '#5a9a4a');
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc((-.06 + i * .06) * s, (-.12 - ((t * .2 + i * .1) % .2)) * s, .015 * s, 0, 7); c.fill(); } },
  bill(c, s, t, a, W, H, th) { const k = cineKit(c, s); c.rotate(-.05); k.R(-.22, -.3, .44, .6, .01, '#f6f4ee'); k.R(-.22, -.3, .44, .07, .01, '#2e6fb0'); c.fillStyle = '#fff'; c.font = `800 ${.035 * s}px Inter, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(th.label || 'CONTA DE LUZ', -.19 * s, -.265 * s);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 6; i++) c.fillRect(-.18 * s, (-.18 + i * .045) * s, (.2 + (i % 3) * .06) * s, .012 * s); c.fillStyle = '#c4302b'; c.font = `900 ${.06 * s}px Inter, sans-serif`; c.fillText(th.value || 'R$ 487,90', -.18 * s, .14 * s); c.fillStyle = '#16161a'; for (let i = 0; i < 22; i++) c.fillRect((-.18 + i * .016) * s, .2 * s, (i % 3 ? .006 : .01) * s, .06 * s);
    if (a === 'shake') { c.strokeStyle = '#c4302b'; c.lineWidth = .02 * s; c.strokeRect(-.2 * s, .07 * s, .3 * s, .11 * s); } },
  cart(c, s, t, a) { const k = cineKit(c, s), mv = go(a) ? 1 : 0; k.shadow(.32, .3); c.strokeStyle = '#9aa0a8'; c.lineWidth = .014 * s; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo((-.26 + i * .08) * s, -.2 * s); c.lineTo((-.22 + i * .065) * s, .12 * s); c.stroke(); } for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-.27 * s, (-.2 + i * .1) * s); c.lineTo(.24 * s, (-.2 + i * .1) * s); c.stroke(); }
    k.L([[.24, -.22], [.36, -.32]], .02, '#c4302b'); k.L([[-.24, .14], [.22, .14]], .02, '#7a8088'); for (const x of [-.2, .18]) k.wheel(x, .26, .05, t, mv); k.R(-.2, -.3, .12, .12, .01, '#e8c14e'); k.R(-.05, -.34, .1, .16, .01, '#c4302b'); k.E(.12, -.26, .06, .06, '#5a9a4a'); },
  package(c, s) { const k = cineKit(c, s); k.shadow(.16, .22); k.P([[-.22, -.12], [.18, -.12], [.24, -.06], [.24, .16], [-.22, .16]], k.grad('#c8965f', -.12, .16), false); k.P([[-.22, -.12], [.18, -.12], [.24, -.06], [-.16, -.06]], '#d9a874', false); k.R(-.03, -.12, .06, .28, 0, 'rgba(230,220,190,.75)'); k.R(-.18, .02, .12, .08, .005, '#f4f2ee'); c.fillStyle = '#16161a'; for (let i = 0; i < 8; i++) c.fillRect((-.17 + i * .012) * s, .07 * s, .005 * s, .025 * s); },
  cctv(c, s, t) { const k = cineKit(c, s), pan = Math.sin(t * .8) * .25; k.R(-.04, -.3, .08, .12, .01, '#2a2c30'); c.save(); c.rotate(pan); k.R(-.22, -.2, .4, .14, .04, k.grad('#e9ebee', -.2, -.06)); k.E(.18, -.13, .05, .05, '#16181c'); k.E(.18, -.13, .025, .025, '#3a5a7a'); if (Math.sin(t * 4) > 0) k.E(-.16, -.16, .015, .015, '#ff3030'); c.restore(); },
  safe(c, s, t, a) { const k = cineKit(c, s); k.shadow(.28, .26); k.R(-.25, -.28, .5, .56, .03, k.hgrad('#4a4f57', -.25, .25)); k.R(-.21, -.24, .42, .48, .02, '#3a3f46'); k.E(0, -.02, .1, .1, '#9aa0a8'); c.save(); c.translate(0, -.02 * s); c.rotate(a === 'shake' ? t * 6 : 0); c.strokeStyle = '#2a2c30'; c.lineWidth = .012 * s; for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(.08 * s, 0); c.stroke(); } c.restore(); k.R(.14, -.1, .04, .16, .01, '#c9a85a'); },
  contract(c, s, t, a, W, H, th) { const k = cineKit(c, s); c.rotate(.04); k.R(-.22, -.3, .44, .6, .01, '#f6f4ee'); c.fillStyle = '#16161a'; c.font = `800 ${.04 * s}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(th.label || 'CONTRATO', 0, -.24 * s); c.fillStyle = 'rgba(0,0,0,.22)'; for (let i = 0; i < 9; i++) c.fillRect(-.18 * s, (-.17 + i * .04) * s, (.3 + (i % 2) * .06) * s, .01 * s);
    const p = clamp((t % 4) / 1.5); c.strokeStyle = '#1f3a6b'; c.lineWidth = .008 * s; c.beginPath(); for (let i = 0; i <= 30 * p; i++) { const x = -.1 + i * .007; c.lineTo(x * s, (.22 + Math.sin(i * .9) * .02) * s); } c.stroke(); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-.16 * s, .25 * s, .3 * s, .006 * s); },
  keys(c, s, t) { const k = cineKit(c, s); c.rotate(Math.sin(t * 2) * .2); c.strokeStyle = '#9aa0a8'; c.lineWidth = .015 * s; c.beginPath(); c.arc(0, -.12 * s, .06 * s, 0, 7); c.stroke(); for (const [r, col] of [[-.3, '#c9a85a'], [.25, '#b8bcc4']]) { c.save(); c.translate(0, -.06 * s); c.rotate(r); k.E(0, .03, .04, .04, col); k.R(-.012, .06, .024, .18, .005, col); k.R(.0, .18, .04, .015, .004, col); k.R(.0, .21, .03, .015, .004, col); c.restore(); } },
  pills(c, s) { const k = cineKit(c, s); k.R(-.08, -.2, .16, .3, .03, k.hgrad('#d97a3a', -.08, .08)); k.R(-.09, -.26, .18, .07, .02, '#f4f2ee'); k.R(-.07, -.12, .14, .1, .005, '#f4f2ee'); for (const [x, y, col] of [[.16, .08, '#f4f2ee'], [.24, .1, '#e8c14e'], [.2, .04, '#f4f2ee']]) { c.save(); c.translate(x * s, y * s); c.rotate(.5); k.R(-.03, -.012, .06, .024, .012, col); c.restore(); } },
  trash(c, s) { const k = cineKit(c, s); k.shadow(.2, .2); k.P([[-.18, .2], [-.22, -.02], [-.1, -.18], [.1, -.18], [.22, -.02], [.18, .2]], k.grad('#2a2c30', -.18, .2), true); k.P([[-.05, -.18], [.0, -.28], [.05, -.18]], '#2a2c30', false); c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(-.08 * s, -.02 * s, .04 * s, .1 * s, .3, 0, 7); c.fill(); },
  glass(c, s, t, a, W, H, th) { const k = cineKit(c, s), col = th.color || '#e8a33a'; k.P([[-.08, -.18], [.08, -.18], [.065, .16], [-.065, .16]], 'rgba(220,235,245,.35)', false); k.P([[-.075, -.08], [.075, -.08], [.065, .15], [-.065, .15]], col, false); k.E(0, -.08, .075, .015, shade(col, .2)); c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc((-.03 + (i % 2) * .05) * s, (.1 - ((t * .2 + i * .07) % .2)) * s, .008 * s, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-.06 * s, -.16 * s, .012 * s, .3 * s); },
};
Object.assign(THING_DRAW, HOME_DRAW); Object.assign(CINE_DRAW, HOME_DRAW);
THING_GUIDE = THING_GUIDE.replace(/Tipos: [^\n]*\./, 'Tipos: ' + Object.keys(THINGS).join(', ') + '.') + '\nObjetos de casa e do dia a dia: fridge (anim "shake" = abre com luz), stove (panela fumegando), door (anim "drive" = abrindo devagar com luz saindo), bill (conta com "label" e "value", anim "shake" destaca o valor), contract (assinatura sendo feita), cctv (câmera vigiando), cart, package, safe, keys, pills, plate, glass, sofa, microwave, trash.';

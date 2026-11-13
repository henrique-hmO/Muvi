/* ============ Cidade e rua realistas (estilo cine): profundidade, luz do sol, neblina, vidro refletindo o céu, sombras e vida na rua.
   Camadas fixas são pintadas uma vez num canvas guardado (cache) e só deslizam com a câmera; o que mexe (nuvens, carros, poeira, luzes) é desenhado a cada quadro. ============ */
const CITY_SKY = {
  day: ['#4f8fd6', '#9cc7ea', '#e9f1f2'], dusk: ['#2c2850', '#c4627a', '#ffb070'], night: ['#03060f', '#0b1530', '#1f2a4a'],
};
const CITY_HAZE = { day: '#d9e6ee', dusk: '#f2a77c', night: '#1d2846' };
const CITY_CACHE = new Map();
function cityCanvas(key, w, h, paint) {
  let c = CITY_CACHE.get(key);
  if (c) { CITY_CACHE.delete(key); CITY_CACHE.set(key, c); return c; }
  c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); paint(c.getContext('2d'));
  CITY_CACHE.set(key, c); while (CITY_CACHE.size > 8) CITY_CACHE.delete(CITY_CACHE.keys().next().value);
  return c;
}
const cmix = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

function cityReal(c, K, W, H, v, t, street) {
  const { gy, night, dusk, layer } = K, time = night ? 'night' : dusk ? 'dusk' : 'day';
  const sky = CITY_SKY[time], haze = CITY_HAZE[time], sunX = W * (v % 2 ? .22 : .8), sunY = dusk ? gy * .72 : H * .13, sunSide = sunX > W / 2 ? 1 : -1;
  const X0 = -W * .55, CW = W * 2.1, S = Math.min(1, 1400 / Math.max(W, H));   /* cached strip covers the pan range; capped resolution keeps memory low on the phone */
  const base = `${street ? 'st' : 'ct'}|${time}|${v % 4}|${W}x${H}`;

  /* --- céu: degradê em 3 tons, brilho do sol, nuvens em camadas --- */
  layer(1, () => {
    const g = c.createLinearGradient(0, -H * .2, 0, gy); g.addColorStop(0, sky[0]); g.addColorStop(.55, sky[1]); g.addColorStop(1, sky[2]); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3);
    if (night) {
      const st = cityCanvas(base + '|stars', W * 1.4, gy, x => { const r = seeded(77 + v); for (let i = 0; i < 160; i++) { x.globalAlpha = .2 + r() * .7; const s = r() < .08 ? 2.2 : 1.2; x.fillStyle = '#fff'; x.fillRect(r() * W * 1.4, r() * gy * .65, s, s); } });
      c.drawImage(st, -W * .2, 0); c.fillStyle = '#f3efe0'; c.beginPath(); c.arc(sunX, H * .12, Math.min(W, H) * .035, 0, 7); c.fill();
      const mg = c.createRadialGradient(sunX, H * .12, 2, sunX, H * .12, H * .16); mg.addColorStop(0, 'rgba(220,230,255,.28)'); mg.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = mg; c.fillRect(sunX - H * .2, 0, H * .4, H * .3);
    } else {
      const R = Math.max(W, H) * (dusk ? .55 : .42), sg = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, R);
      sg.addColorStop(0, dusk ? 'rgba(255,214,150,.95)' : 'rgba(255,252,235,.95)'); sg.addColorStop(.06, dusk ? 'rgba(255,190,120,.55)' : 'rgba(255,250,225,.5)'); sg.addColorStop(1, 'rgba(255,240,210,0)');
      c.fillStyle = sg; c.fillRect(sunX - R, sunY - R, R * 2, R * 2);
    }
    const cl = cityCanvas(base + '|clouds', W * 2.4, gy * .7, x => { const r = seeded(31 + v); const col = night ? 'rgba(120,130,170,' : dusk ? 'rgba(255,190,170,' : 'rgba(255,255,255,';
      for (let i = 0; i < 9; i++) { const cx = r() * W * 2.4, cy = gy * (.08 + r() * .45), s = W * (.08 + r() * .12);
        for (let j = 0; j < 7; j++) { const g2 = x.createRadialGradient(cx + (j - 3) * s * .45, cy + Math.sin(j) * s * .12, 0, cx + (j - 3) * s * .45, cy + Math.sin(j) * s * .12, s * (.5 + r() * .4)); g2.addColorStop(0, col + (night ? .12 : .55) + ')'); g2.addColorStop(1, col + '0)'); x.fillStyle = g2; x.fillRect(0, 0, W * 2.4, gy); } } });
    c.drawImage(cl, -W * .7 + ((t * W * .006) % (W * .4)), 0);
  });

  /* --- horizonte distante: muitos prédios em silhueta azulada pela distância, levemente desfocados --- */
  layer(.88, () => {
    const far = cityCanvas(base + '|far', CW * S, gy * S, x => {
      x.scale(S, S); x.translate(-X0, 0); const r = seeded(11 + v), col = cmix(night ? '#0d1426' : dusk ? '#5b4a6a' : '#7d95ad', haze, night ? .1 : .45);
      for (let bx = X0; bx < X0 + CW;) { const w = W * (.035 + r() * .06), h = H * (.12 + r() * .3) * (street ? .8 : 1);
        x.fillStyle = col; x.fillRect(bx, gy - h, w, h);
        if (r() > .6) x.fillRect(bx + w * .4, gy - h - H * .03, w * .2, H * .03); if (r() > .8) x.fillRect(bx + w * .48, gy - h - H * .07, 2, H * .04);
        if (night) for (let wy = gy - h + 6; wy < gy - 6; wy += 9) for (let wx = bx + 3; wx < bx + w - 3; wx += 7) if (r() > .72) { x.fillStyle = r() > .3 ? 'rgba(255,214,140,.75)' : 'rgba(200,230,255,.6)'; x.fillRect(wx, wy, 2.5, 3); x.fillStyle = col; }
        bx += w + W * .004; }
      const hz = x.createLinearGradient(0, gy - H * .3, 0, gy); hz.addColorStop(0, haze + '00'); hz.addColorStop(1, haze + (night ? '66' : 'cc')); x.fillStyle = hz; x.fillRect(X0, gy - H * .32, CW, H * .32);
    });
    c.save(); c.filter = 'blur(1.2px)'; c.drawImage(far, X0, 0, CW, gy); c.restore();
    if (night) { const lp = c.createLinearGradient(0, gy - H * .25, 0, gy); lp.addColorStop(0, 'rgba(255,150,80,0)'); lp.addColorStop(1, 'rgba(255,150,80,.18)'); c.fillStyle = lp; c.fillRect(X0, gy - H * .25, CW, H * .25); }
  });

  /* --- prédios do meio: frente + lateral (volume), vidro refletindo o céu, marquises, lojas no térreo, caixa d'água --- */
  layer(street ? .35 : .55, () => {
    const mid = cityCanvas(base + '|mid', CW * S, gy * S, x => {
      x.scale(S, S); x.translate(-X0, 0); const r = seeded(23 + v * 7);
      const pals = [['#c9b59a', '#a8927a'], ['#9fa9b4', '#7d8792'], ['#d8cdb9', '#b9ab93'], ['#8e7a6c', '#6f5e52'], ['#b8c2c9', '#8f9aa3'], ['#a35f4a', '#7f4838'], ['#e2dccf', '#c2baa9']];
      const lightK = night ? -.62 : dusk ? -.18 : 0;
      for (let bx = X0; bx < X0 + CW;) {
        const w = W * (street ? .26 + r() * .16 : .14 + r() * .12), h = H * (street ? .34 + r() * .3 : .22 + r() * .34), [fc, sc] = pals[Math.floor(r() * pals.length)];
        const side = w * .14, sx = sunSide > 0 ? bx : bx + w, glass = r() > .55, top = gy - h;
        /* lateral escura do lado oposto ao sol (dá volume) */
        x.fillStyle = shade(sc, lightK - .12); x.beginPath(); x.moveTo(sx, top); x.lineTo(sx - side * sunSide, top + side * .35); x.lineTo(sx - side * sunSide, gy); x.lineTo(sx, gy); x.closePath(); x.fill();
        /* fachada com luz caindo do alto */
        const fg = x.createLinearGradient(0, top, 0, gy); fg.addColorStop(0, shade(fc, lightK + .1)); fg.addColorStop(1, shade(fc, lightK - .14)); x.fillStyle = fg; x.fillRect(bx, top, w, h);
        const eg = x.createLinearGradient(bx, 0, bx + w, 0); eg.addColorStop(sunSide > 0 ? 0 : 1, 'rgba(0,0,0,.16)'); eg.addColorStop(.5, 'rgba(0,0,0,0)'); x.fillStyle = eg; x.fillRect(bx, top, w, h);
        /* cornija e topo */
        x.fillStyle = shade(fc, lightK + .2); x.fillRect(bx - 3, top - 5, w + 6, 6); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(bx, top + 1, w, 4);
        if (r() > .45) { const tw = w * .22, tx = bx + w * (.15 + r() * .5); x.fillStyle = shade('#6d7378', lightK); x.fillRect(tx, top - H * .035, tw, H * .03); x.fillStyle = shade('#55595d', lightK); x.fillRect(tx + 3, top - H * .006, 3, H * .006); x.fillRect(tx + tw - 6, top - H * .006, 3, H * .006); }
        if (r() > .7) { x.fillStyle = shade('#3d4146', lightK); x.fillRect(bx + w * .8, top - H * .06, 2, H * .055); }
        /* janelas: vidro com o céu refletido; à noite algumas acesas com cortina */
        const rows = Math.max(3, Math.round(h / (H * .045))), cols = Math.max(2, Math.round(w / (W * (glass ? .045 : .06)))), gw = w / cols, gh = (h - H * .09) / rows;
        for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
          const wx = bx + j * gw + gw * .18, wy = top + H * .02 + i * gh + gh * .16, ww = gw * .64, wh = gh * .62, lit = night && r() > .66;
          if (lit) { x.fillStyle = r() > .2 ? '#ffcf86' : '#cfe7ff'; x.fillRect(wx, wy, ww, wh); x.fillStyle = 'rgba(120,60,20,.25)'; x.fillRect(wx, wy, ww * (.2 + r() * .4), wh); }
          else { const rg = x.createLinearGradient(wx, wy, wx + ww * .6, wy + wh); rg.addColorStop(0, shade(sky[1], lightK - .05)); rg.addColorStop(.55, shade(sky[0], lightK - .25)); rg.addColorStop(1, shade('#1c2430', lightK)); x.fillStyle = rg; x.fillRect(wx, wy, ww, wh);
            if (!night && r() > .6) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(wx + ww * .2, wy); x.lineTo(wx + ww * .45, wy); x.lineTo(wx + ww * .15, wy + wh); x.lineTo(wx, wy + wh); x.lineTo(wx, wy + wh * .7); x.closePath(); x.fill(); } }
          x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(wx, wy + wh, ww, 2); if (!glass) { x.fillStyle = shade(fc, lightK + .14); x.fillRect(wx - 2, wy + wh + 2, ww + 4, 3); }
        }
        /* térreo: loja com toldo e letreiro */
        const sh = H * .085, sy = gy - sh; x.fillStyle = shade('#2a2e33', lightK); x.fillRect(bx, sy, w, sh);
        const vg = x.createLinearGradient(0, sy, 0, gy); vg.addColorStop(0, night ? '#c89a62' : shade(sky[1], -.3)); vg.addColorStop(1, night ? '#5a3c22' : '#2a3038'); x.fillStyle = vg; x.fillRect(bx + w * .08, sy + sh * .3, w * .84, sh * .7);
        const aw = ['#b8423a', '#2f6e5c', '#2f4f8a', '#c9902f', '#5a3a6a'][Math.floor(r() * 5)]; x.fillStyle = shade(aw, lightK); x.beginPath(); x.moveTo(bx + w * .04, sy + sh * .05); x.lineTo(bx + w * .96, sy + sh * .05); x.lineTo(bx + w * 1.0, sy + sh * .3); x.lineTo(bx, sy + sh * .3); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,255,.18)'; for (let s = 0; s < 8; s++) x.fillRect(bx + w * (.04 + s * .12), sy + sh * .05, w * .06, sh * .25);
        if (night) { const gl = x.createRadialGradient(bx + w / 2, gy, 0, bx + w / 2, gy, w * .7); gl.addColorStop(0, 'rgba(255,200,130,.18)'); gl.addColorStop(1, 'rgba(255,200,130,0)'); x.fillStyle = gl; x.fillRect(bx - w * .2, gy - w * .7, w * 1.4, w * .9); }
        /* sombra de contato no pé do prédio */
        const ao = x.createLinearGradient(0, gy - H * .04, 0, gy); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = ao; x.fillRect(bx, gy - H * .04, w, H * .04);
        bx += w + (r() > .7 ? W * .03 : W * .006);
      }
      /* neblina leve por cima do meio (perspectiva atmosférica) */
      const hz = x.createLinearGradient(0, gy - H * .5, 0, gy); hz.addColorStop(0, haze + '00'); hz.addColorStop(1, haze + (night ? '22' : '40')); x.fillStyle = hz; x.fillRect(X0, gy - H * .5, CW, H * .5);
    });
    c.drawImage(mid, X0, 0, CW, gy);
    /* raios de sol entre os prédios no fim da tarde */
    if (dusk || (!night && v % 2)) { c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 4; i++) { const a = .05 + .03 * Math.sin(t * .6 + i), x0 = sunX + (i - 1.5) * W * .14; const rg = c.createLinearGradient(x0, sunY, x0 - sunSide * W * .25, gy); rg.addColorStop(0, `rgba(255,200,140,${a})`); rg.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = rg; c.beginPath(); c.moveTo(x0 - W * .02, sunY); c.lineTo(x0 + W * .02, sunY); c.lineTo(x0 - sunSide * W * .3 + W * .1, gy); c.lineTo(x0 - sunSide * W * .3 - W * .06, gy); c.closePath(); c.fill(); } c.restore(); }
  });

  /* --- calçada, meio-fio e asfalto com textura; sombras longas; postes, árvores, carros passando --- */
  layer(0, () => {
    const swH = H * .055, roadY = gy + swH;
    const grd = cityCanvas(base + '|ground', CW * S, (H - gy + H * .02) * S, x => {
      x.scale(S, S); x.translate(-X0, -gy); const r = seeded(5 + v), lk = night ? -.6 : dusk ? -.2 : 0;
      const sw = x.createLinearGradient(0, gy, 0, roadY); sw.addColorStop(0, shade('#b9b3a7', lk)); sw.addColorStop(1, shade('#9d978c', lk)); x.fillStyle = sw; x.fillRect(X0, gy, CW, swH);
      x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1; for (let px = X0; px < X0 + CW; px += W * .05) { x.beginPath(); x.moveTo(px, gy); x.lineTo(px - W * .015, roadY); x.stroke(); } x.beginPath(); x.moveTo(X0, gy + swH * .5); x.lineTo(X0 + CW, gy + swH * .5); x.stroke();
      x.fillStyle = shade('#d6d0c4', lk); x.fillRect(X0, roadY - H * .006, CW, H * .006); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(X0, roadY, CW, H * .005);
      const rd = x.createLinearGradient(0, roadY, 0, H); rd.addColorStop(0, shade('#3e4247', lk)); rd.addColorStop(1, shade('#2b2e33', lk)); x.fillStyle = rd; x.fillRect(X0, roadY, CW, H - roadY + H * .02);
      for (let i = 0; i < 2600; i++) { x.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; x.fillRect(X0 + r() * CW, roadY + r() * (H - roadY), 1.6, 1.6); }
      x.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(X0 + r() * CW, roadY + (H - roadY) * (.2 + r() * .7), W * (.04 + r() * .06), H * .006, 0, 0, 7); x.fill(); }
      x.fillStyle = shade('#e8e2cf', lk - .05); const ly = roadY + (H - roadY) * .48; for (let lx = X0; lx < X0 + CW; lx += W * .13) x.fillRect(lx, ly, W * .07, H * .007);
    });
    c.drawImage(grd, X0, gy, CW, H - gy + H * .02);
    /* sombras longas dos prédios projetadas na calçada (inclinadas pelo sol) */
    if (!night) { c.save(); c.fillStyle = `rgba(20,24,40,${dusk ? .3 : .18})`; const r = seeded(41 + v); for (let i = 0; i < 6; i++) { const x0 = X0 + r() * CW, sw = W * (.08 + r() * .14), dx = -sunSide * W * (dusk ? .4 : .15); c.beginPath(); c.moveTo(x0, gy); c.lineTo(x0 + sw, gy); c.lineTo(x0 + sw + dx, roadY + H * .02); c.lineTo(x0 + dx, roadY + H * .02); c.closePath(); c.fill(); } c.restore(); }
    /* carros passando lá no fundo da rua (desfocados, dão vida) */
    const lane = roadY + (H - roadY) * .22;
    for (let i = 0; i < 3; i++) { const sp = W * (.18 + i * .07), dir = i % 2 ? -1 : 1, cx = X0 + ((t * sp * dir + i * W * .8) % CW + CW) % CW, cw = W * .2, chh = H * .045, col = ['#c8ccd2', '#202329', '#9b2f2f', '#f5c518'][(i + v) % 4];
      c.save(); c.globalAlpha = .9; c.filter = 'blur(1.5px)'; c.translate(cx, lane); c.scale(dir, 1);
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(0, chh * .5, cw * .55, chh * .18, 0, 0, 7); c.fill();
      c.fillStyle = shade(col, night ? -.5 : 0); c.beginPath(); rr(c, -cw / 2, -chh * .2, cw, chh * .6, chh * .2); c.fill(); c.beginPath(); rr(c, -cw * .28, -chh * .7, cw * .5, chh * .55, chh * .2); c.fill();
      c.fillStyle = night ? '#ffe9b0' : shade(sky[1], -.35); c.fillRect(-cw * .22, -chh * .62, cw * .18, chh * .38); c.fillRect(0, -chh * .62, cw * .16, chh * .38);
      c.fillStyle = '#111'; for (const wx of [-cw * .3, cw * .3]) { c.beginPath(); c.arc(wx, chh * .4, chh * .2, 0, 7); c.fill(); }
      if (night) { c.fillStyle = 'rgba(255,240,200,.9)'; c.beginPath(); c.arc(cw * .48, 0, 3, 0, 7); c.fill(); const hb = c.createLinearGradient(cw * .5, 0, cw * 1.6, 0); hb.addColorStop(0, 'rgba(255,240,200,.35)'); hb.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = hb; c.beginPath(); c.moveTo(cw * .5, -2); c.lineTo(cw * 1.6, -chh * .5); c.lineTo(cw * 1.6, chh * .7); c.lineTo(cw * .5, 4); c.fill(); c.fillStyle = 'rgba(255,40,40,.9)'; c.fillRect(-cw * .5, -chh * .1, 3, 5); }
      c.restore(); }
    /* postes e árvores da calçada */
    const r = seeded(61 + v);
    for (let i = 0; i < 4; i++) {
      const px = X0 + W * .3 + i * W * .55 + r() * W * .1;
      if (i % 2 === 0) {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px + W * .03, gy + swH * .4, W * .06, H * .006, 0, 0, 7); c.fill();
        c.fillStyle = night ? '#16181c' : '#2b2f35'; c.fillRect(px - 3, gy - H * .36, 6, H * .36 + swH * .4); c.fillRect(px - 3, gy - H * .36, W * .07, 5); c.fillStyle = night ? '#ffe6a8' : '#d8dde2'; c.fillRect(px + W * .055, gy - H * .356, W * .02, 5);
        if (night) { const lx = px + W * .065, ly = gy - H * .35, cone = c.createLinearGradient(0, ly, 0, gy + swH); cone.addColorStop(0, 'rgba(255,214,140,.32)'); cone.addColorStop(1, 'rgba(255,214,140,.06)'); c.fillStyle = cone; c.beginPath(); c.moveTo(lx - 6, ly); c.lineTo(lx + 6, ly); c.lineTo(lx + W * .16, gy + swH); c.lineTo(lx - W * .16, gy + swH); c.closePath(); c.fill();
          const pool = c.createRadialGradient(lx, gy + swH * .5, 0, lx, gy + swH * .5, W * .18); pool.addColorStop(0, 'rgba(255,214,140,.35)'); pool.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = pool; c.fillRect(lx - W * .2, gy - H * .05, W * .4, H * .14);
          const bulb = c.createRadialGradient(lx, ly + 3, 0, lx, ly + 3, H * .03); bulb.addColorStop(0, 'rgba(255,240,200,.95)'); bulb.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = bulb; c.fillRect(lx - H * .03, ly - H * .03, H * .06, H * .06); }
      } else {
        const TW = W * .34, TH = H * .42;
        const tr = cityCanvas(base + '|tree' + i, TW * S, TH * S, x => { x.scale(S, S); const rr2 = seeded(90 + i + v), lk = night ? -.55 : dusk ? -.15 : 0;
          x.fillStyle = shade('#3e2f22', lk); x.beginPath(); x.moveTo(TW / 2 - 6, TH); x.lineTo(TW / 2 - 3, TH * .42); x.lineTo(TW / 2 + 3, TH * .42); x.lineTo(TW / 2 + 6, TH); x.fill();
          x.strokeStyle = shade('#3e2f22', lk); x.lineWidth = 3; for (const a of [-.7, .6, -.2]) { x.beginPath(); x.moveTo(TW / 2, TH * .55); x.lineTo(TW / 2 + Math.sin(a) * TW * .2, TH * .32); x.stroke(); }
          const blobs = []; for (let k = 0; k < 70; k++) { const a = rr2() * 6.28, d = Math.sqrt(rr2()) * TW * .34; blobs.push([TW / 2 + Math.cos(a) * d, TH * .3 + Math.sin(a) * d * .62, TW * (.035 + rr2() * .045)]); }
          blobs.sort((a, b) => a[1] - b[1]);
          for (const [bx2, by, s2] of blobs) { const lit = .5 + .5 * (-(by - TH * .3) / (TH * .25)) + .25 * sunSide * (bx2 - TW / 2) / (TW * .35);
            x.fillStyle = shade(cmix('#2c5a2a', '#8fbf5f', clamp(lit, 0, 1)), lk); x.beginPath(); x.arc(bx2, by, s2, 0, 7); x.fill(); }
          const sh = x.createLinearGradient(0, TH * .1, 0, TH * .55); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,20,0,.3)'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = sh; x.fillRect(0, 0, TW, TH); });
        const sway = Math.sin(t * 1.2 + i) * W * .003; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px, gy + swH * .45, W * .13, H * .01, 0, 0, 7); c.fill();
        c.save(); c.translate(px + sway, 0); c.drawImage(tr, -TW / 2, gy + swH * .4 - TH, TW, TH); c.restore();
      }
    }
    /* poeira no ar pegando luz */
    if (!night) { c.fillStyle = dusk ? 'rgba(255,210,160,.5)' : 'rgba(255,255,255,.45)'; const r2 = seeded(3 + v); for (let i = 0; i < 26; i++) { const px = (r2() * W + t * W * .01 * (r2() + .3)) % W, py = H * (.25 + r2() * .55) + Math.sin(t + i) * H * .01; c.globalAlpha = .25 + .35 * Math.sin(t * 1.7 + i * 2); c.fillRect(px, py, 2, 2); } c.globalAlpha = 1; }
  });
}
PLACE_DRAW.city = function (c, K, W, H, v, t) { if (isCine()) return cityReal(c, K, W, H, v, t, false); return PLACE_DRAW_OLD(c, K, W, H, v, t, 'city'); };
PLACE_DRAW.street = function (c, K, W, H, v, t) { if (isCine()) return cityReal(c, K, W, H, v, t, true); return PLACE_DRAW_OLD(c, K, W, H, v, t, 'street'); };
/* outros estilos continuam com o desenho antigo */
function PLACE_DRAW_OLD(c, K, W, H, v, t, place) { const time = K.night ? 'night' : K.dusk ? 'dusk' : 'day'; const cam = K.__cam || { z: 1, x: 0 }; if (v % 2) { c.save(); c.translate(W, 0); c.scale(-1, 1); drawPlaceBase(c, W, H, place, time, t, { z: cam.z, x: -cam.x }); c.restore(); } else drawPlaceBase(c, W, H, place, time, t, cam); }
const _kitCity = kit; kit = function (ctx, W, H, time, cam) { const K = _kitCity(ctx, W, H, time, cam); K.__cam = cam; return K; };

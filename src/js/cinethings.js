/* ============ CINE THINGS: elementos redesenhados no padrão cinemático (proporção real, sem contorno, sombreado suave) ============ */
function cineKit(c, s) {
  const S = v => v * s;
  const grad = (col, y0, y1, lt = .16, dk = -.3) => { const g = c.createLinearGradient(0, S(y0), 0, S(y1)); g.addColorStop(0, shade(col, lt)); g.addColorStop(.45, col); g.addColorStop(1, shade(col, dk)); return g; };
  const hgrad = (col, x0, x1, lt = .12, dk = -.25) => { const g = c.createLinearGradient(S(x0), 0, S(x1), 0); g.addColorStop(0, shade(col, dk)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, lt)); return g; };
  const path = (pts, smooth) => {
    c.beginPath(); const n = pts.length;
    if (!smooth) { pts.forEach(([x, y], i) => (i ? c.lineTo(S(x), S(y)) : c.moveTo(S(x), S(y)))); c.closePath(); return; }
    const rad = S(smooth === true ? .035 : smooth), mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]); c.moveTo(S(m0[0]), S(m0[1]));
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m = mid(p, q); c.arcTo(S(p[0]), S(p[1]), S(m[0]), S(m[1]), rad); } c.closePath();
  };
  const P = (pts, f, smooth = true) => { path(pts, smooth); c.fillStyle = f; c.fill(); };
  const E = (x, y, rx, ry, f, rot = 0) => { c.beginPath(); c.ellipse(S(x), S(y), Math.max(.1, S(rx)), Math.max(.1, S(ry)), rot, 0, 7); c.fillStyle = f; c.fill(); };
  const R = (x, y, w, h, r, f) => { c.beginPath(); rr(c, S(x), S(y), S(w), S(h), S(r)); c.fillStyle = f; c.fill(); };
  const L = (pts, w, col, cap = 'round') => { c.lineCap = cap; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = S(w); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(S(x), S(y)) : c.moveTo(S(x), S(y)))); c.stroke(); };
  const eye = (x, y, r) => { E(x, y, r, r, '#120c0a'); E(x - r * .3, y - r * .35, r * .34, r * .34, 'rgba(255,255,255,.85)'); };
  const shadow = (y, rx) => E(0, y, rx, rx * .07, 'rgba(0,0,0,.2)');
  const glass = (pts, y0, y1, smooth = true) => { const g = c.createLinearGradient(0, S(y0), 0, S(y1)); g.addColorStop(0, '#6f8798'); g.addColorStop(1, '#1f2a33'); P(pts, g, smooth); };
  const wheel = (x, y, r, t, spin) => {
    E(x, y, r, r, '#17171a'); E(x, y, r * .86, r * .86, '#232327');
    const g = c.createRadialGradient(S(x - r * .15), S(y - r * .15), 0, S(x), S(y), S(r * .6)); g.addColorStop(0, '#d9dce1'); g.addColorStop(1, '#868b94'); E(x, y, r * .6, r * .6, g);
    c.save(); c.translate(S(x), S(y)); c.rotate(t * 14 * spin); c.strokeStyle = '#5d626b'; c.lineWidth = S(r * .11); c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; c.beginPath(); c.moveTo(Math.cos(a) * S(r * .14), Math.sin(a) * S(r * .14)); c.lineTo(Math.cos(a) * S(r * .52), Math.sin(a) * S(r * .52)); c.stroke(); }
    c.restore(); E(x, y, r * .15, r * .15, '#4a4e55');
  };
  const leg = (x, y, len, w, ang, col, knee = 0) => { const kx = x + Math.sin(ang) * len * .5, ky = y + Math.cos(ang) * len * .5, a2 = ang + knee; L([[x, y], [kx, ky], [kx + Math.sin(a2) * len * .5, ky + Math.cos(a2) * len * .5]], w, col); return [kx + Math.sin(a2) * len * .5, ky + Math.cos(a2) * len * .5]; };
  return { S, grad, hgrad, path, P, E, R, L, eye, shadow, glass, wheel, leg };
}
const go = a => a === 'drive' || a === 'run';

function drawCarCine(c, s, t, a, th) {
  const P = CAR_PROFILES[th.__type], k = cineKit(c, s), col = th.color || P.c, mv = go(a), bump = mv ? Math.abs(Math.sin(t * 14)) * .006 : 0;
  const top = Math.min(...P.b.map(p => p[1])), front = Math.max(...P.b.map(p => p[0])), back = Math.min(...P.b.map(p => p[0])), r = P.r * .95;
  k.shadow(.06 + r, (front - back) * .55);
  c.save(); c.translate(0, -bump * s); if (P.rust) c.rotate(Math.sin(t * 9) * .008);
  /* body */
  k.P(P.b, k.grad(col, top, .08));
  c.save(); k.path(P.b, true); c.clip();
  c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(back * s, (top + .02) * s, (front - back) * s, .025 * s);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(back * s, .0 * s, (front - back) * s, .1 * s);
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .006 * s; const midx = (P.g[0][0] + P.g[3][0]) / 2;
  c.beginPath(); c.moveTo(midx * s, P.g[0][1] * s); c.lineTo(midx * s, .02 * s); c.moveTo(P.g[0][0] * s, P.g[0][1] * s); c.lineTo(P.g[0][0] * s - .01 * s, .02 * s); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.35)'; for (const x of [P.g[0][0] + .06, midx + .06]) c.fillRect(x * s, (P.g[0][1] + .035) * s, .045 * s, .008 * s);
  if (P.rust) { c.fillStyle = 'rgba(110,60,25,.55)'; for (const [x, y] of [[-.3, -.05], [.2, -.02], [.35, -.07]]) { c.beginPath(); c.arc(x * s, y * s, .03 * s, 0, 7); c.fill(); } }
  c.restore();
  /* glass with pillar */
  k.glass(P.g, P.g[1][1], P.g[0][1], false);
  c.fillStyle = col; c.fillRect((midx - .012) * s, P.g[1][1] * s, .024 * s, (P.g[0][1] - P.g[1][1]) * s);
  c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo((P.g[1][0] + .04) * s, (P.g[1][1] + .005) * s); c.lineTo((P.g[1][0] + .08) * s, (P.g[1][1] + .005) * s); c.lineTo((P.g[0][0] + .06) * s, (P.g[0][1] - .005) * s); c.lineTo((P.g[0][0] + .02) * s, (P.g[0][1] - .005) * s); c.fill();
  k.E(P.g[3][0] + .01, P.g[3][1] + .005, .018, .012, shade(col, -.2));
  /* lights + bumpers */
  k.P([[front - .06, -.07], [front - .005, -.065], [front - .005, -.035], [front - .07, -.04]], '#f3ecd0', false);
  k.P([[back + .005, -.075], [back + .05, -.075], [back + .05, -.045], [back + .005, -.045]], '#b3262c', false);
  k.R(front - .07, .02, .075, .03, .01, '#26262a'); k.R(back - .005, .02, .07, .03, .01, '#26262a');
  if (P.spoiler) { k.R(back - .04, top + .02, .14, .025, .008, '#1c1c20'); k.R(back + .02, top + .04, .015, .05, .004, '#1c1c20'); }
  if (P.sign) { k.R(-.08, top - .07, .16, .06, .012, '#f4f1e8'); c.fillStyle = INK0; c.font = `900 ${.04 * s}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(P.sign, 0, (top - .04) * s); }
  if (P.siren) { k.R(-.12, top - .05, .24, .045, .012, '#2a2a2e'); const on = Math.sin(t * 12) > 0; k.R(-.11, top - .045, .1, .035, .008, on ? '#ff3030' : '#5a1212'); k.R(.01, top - .045, .1, .035, .008, on ? '#16357a' : '#3b82ff'); c.fillStyle = '#23365c'; c.fillRect(back * s, -.06 * s, (front - back) * s, .025 * s); }
  if (P.rust && mv) THING_DRAW.smoke(c, s * .3, t, a);
  if (th.__type === 'convertible' && th.who !== false) { c.save(); c.translate(-.05 * s, -.04 * s); drawPerson(c, castOf(S.__drawP || S.project, 'hero'), { h: s * .5, pose: 'drive', emotion: 'happy', facing: 1, style: 'cine' }, t); c.restore(); }
  c.restore();
  for (const x of P.w) { k.E(x, .04, r * 1.22, r * 1.12, '#0f0f11'); k.wheel(x, .06, r, t, mv ? 1 : 0); }
}

const CINE_DRAW = {
  plane(c, s, t) { const k = cineKit(c, s);
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 2; i++) c.fillRect((-1.1 - (t * 1.5 % .3)) * s, (-.01 + i * .03) * s, .5 * s, .008 * s);
    k.P([[.04, -.05], [.14, -.05], [-.1, -.17], [-.17, -.17]], '#9aa3ad', false);
    k.P([[-.56, -.03], [-.42, -.07], [.4, -.07], [.54, -.05], [.6, -.01], [.58, .03], [.5, .06], [-.42, .06], [-.56, .02]], k.grad('#f1f2f4', -.07, .06, .05, -.22));
    k.P([[-.54, -.02], [-.44, -.04], [-.36, -.36], [-.46, -.36], [-.56, -.03]], k.grad('#26406a', -.36, -.02), false);
    k.P([[-.5, -.02], [-.38, -.02], [-.46, -.12], [-.54, -.12]], '#c9d0d8', false);
    c.fillStyle = '#9c2b31'; c.fillRect(-.46 * s, .022 * s, .96 * s, .014 * s);
    c.fillStyle = '#2a3440'; for (let i = 0; i < 16; i++) { c.beginPath(); c.arc((-.34 + i * .05) * s, -.025 * s, .012 * s, 0, 7); c.fill(); }
    k.P([[.5, -.05], [.56, -.04], [.58, -.015], [.52, -.02]], '#26323d', false);
    k.P([[.06, .03], [.2, .03], [-.12, .17], [-.22, .17]], k.grad('#d5dbe2', .03, .17), false);
    k.R(-.06, .07, .16, .05, .025, k.grad('#9aa2ac', .07, .12)); k.E(.1, .095, .012, .024, '#2b2f35');
  },
  jet(c, s, t) { const k = cineKit(c, s);
    k.P([[-.5, -.02], [-.38, -.06], [.36, -.06], [.52, -.03], [.56, 0], [.5, .04], [-.38, .05], [-.5, .02]], k.grad('#eef0f2', -.06, .05, .05, -.2));
    k.P([[-.46, -.03], [-.38, -.05], [-.42, -.3], [-.5, -.3]], k.grad('#1f2733', -.3, 0), false); k.P([[-.52, -.3], [-.36, -.3], [-.38, -.27], [-.5, -.27]], '#1f2733', false);
    k.E(-.3, -.08, .09, .035, k.grad('#9aa2ac', -.11, -.05)); k.E(-.22, -.08, .015, .03, '#26292e');
    k.P([[-.04, .02], [.12, .02], [-.12, .2], [-.2, .2]], k.grad('#c5ccd4', 0, .2));
    c.fillStyle = '#c8a24a'; c.fillRect(-.38 * s, .015 * s, .86 * s, .01 * s);
    c.fillStyle = '#2a3440'; for (let i = 0; i < 6; i++) { c.beginPath(); rr(c, (-.18 + i * .07) * s, -.04 * s, .035 * s, .025 * s, .01 * s); c.fill(); }
    k.P([[.44, -.045], [.5, -.035], [.53, -.012], [.47, -.016]], '#26323d', false);
  },
  helicopter2(c, s, t) { const k = cineKit(c, s), col = '#2d4c6e';
    k.R(-.62, -.05, .5, .035, .015, k.grad(col, -.05, -.015)); k.P([[-.64, -.12], [-.6, -.12], [-.58, -.02], [-.63, -.02]], col, false);
    c.save(); c.translate(-.62 * s, -.08 * s); c.rotate(t * 30); k.R(-.002, -.09, .004, .18, .002, 'rgba(40,40,45,.55)'); c.restore();
    k.P([[-.18, -.14], [.12, -.16], [.3, -.08], [.32, .02], [.2, .08], [-.16, .08], [-.24, -.02]], k.grad(col, -.16, .08));
    k.glass([[.12, -.14], [.28, -.08], [.3, .0], [.14, .0]], -.14, 0, true);
    k.R(-.06, -.21, .1, .05, .02, '#2a2d33'); k.R(-.015, -.25, .02, .05, .006, '#2a2d33');
    const blur = Math.sin(t * 40) * .02; k.E(0, -.26, .62, .014 + Math.abs(blur) * .2, 'rgba(30,30,34,.45)');
    k.L([[-.14, .1], [-.14, .16]], .015, '#2a2d33'); k.L([[.16, .1], [.16, .16]], .015, '#2a2d33'); k.L([[-.26, .16], [.3, .16]], .02, '#2a2d33');
  },
  bus2(c, s, t, a) { const k = cineKit(c, s), col = '#e2b63e';
    k.shadow(.2, .5); k.P([[-.52, -.32], [.46, -.32], [.52, -.26], [.53, .1], [-.52, .1]], k.grad(col, -.32, .1), true);
    k.glass([[-.48, -.26], [.44, -.26], [.47, -.08], [-.48, -.08]], -.26, -.08, false);
    c.fillStyle = col; for (let i = 0; i < 6; i++) c.fillRect((-.34 + i * .15) * s, -.26 * s, .018 * s, .18 * s);
    k.R(.36, -.06, .1, .14, .01, k.grad('#2a3440', -.06, .08)); c.fillStyle = '#7a5a1a'; c.fillRect(-.52 * s, -.02 * s, 1.05 * s, .025 * s);
    k.E(.5, .04, .02, .015, '#f3ecd0');
    for (const x of [-.32, .3]) { k.E(x, .09, .105, .1, '#121214'); k.wheel(x, .11, .085, t, a === 'drive' ? 1 : 0); }
  },
  truck(c, s, t, a) { const k = cineKit(c, s), mv = a === 'drive' ? 1 : 0;
    k.shadow(.2, .52); k.R(-.55, -.36, .74, .4, .02, k.grad('#e8e4da', -.36, .04)); c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 1; i < 6; i++) c.fillRect((-.55 + i * .12) * s, -.36 * s, .006 * s, .4 * s);
    k.P([[.21, -.28], [.4, -.28], [.5, -.12], [.53, .06], [.21, .06]], k.grad('#2e5f93', -.28, .06), true);
    k.glass([[.3, -.24], [.4, -.24], [.47, -.12], [.3, -.12]], -.24, -.12, false); k.E(.51, .0, .02, .015, '#f3ecd0');
    k.R(-.55, .04, 1.08, .03, .01, '#26262a');
    for (const x of [-.4, -.24, .38]) { k.E(x, .09, .1, .1, '#121214'); k.wheel(x, .11, .085, t, mv); }
  },
  moto2(c, s, t, a) { const k = cineKit(c, s), mv = go(a) ? 1 : 0;
    k.shadow(.24, .38);
    for (const x of [-.28, .28]) { k.E(x, .1, .14, .14, '#17171a'); k.E(x, .1, .1, .1, '#2b2b30'); c.save(); c.translate(x * s, .1 * s); c.rotate(t * 14 * mv); c.strokeStyle = '#9aa0a8'; c.lineWidth = .008 * s; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i) * .09 * s, Math.sin(i) * .09 * s); c.stroke(); } c.restore(); k.E(x, .1, .025, .025, '#6a6f77'); }
    k.L([[-.28, .1], [-.05, -.02], [.2, -.1], [.28, .1]], .03, '#3a3c42');
    k.P([[-.12, -.06], [.12, -.12], [.2, -.08], [.12, -.02], [-.1, .0]], k.grad('#a8302f', -.12, 0));
    k.R(-.26, -.07, .2, .04, .02, '#1c1c1f'); k.L([[.18, -.1], [.26, -.2], [.32, -.21]], .02, '#2a2a2e'); k.E(.3, -.12, .03, .03, '#f3ecd0');
    k.L([[-.08, .06], [-.36, .04]], .025, '#8d929b');
  },
  bike(c, s, t, a) { const k = cineKit(c, s), mv = go(a) ? 1 : 0;
    for (const x of [-.26, .26]) { c.strokeStyle = '#1b1b1e'; c.lineWidth = .025 * s; c.beginPath(); c.arc(x * s, .1 * s, .14 * s, 0, 7); c.stroke(); c.save(); c.translate(x * s, .1 * s); c.rotate(t * 10 * mv); c.strokeStyle = 'rgba(160,165,172,.8)'; c.lineWidth = .004 * s; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * .785) * .13 * s, Math.sin(i * .785) * .13 * s); c.stroke(); } c.restore(); }
    k.L([[-.26, .1], [-.06, .1], [.16, -.1], [-.1, -.1], [-.06, .1]], .022, '#2f6f9a'); k.L([[.16, -.1], [.26, .1]], .022, '#2f6f9a'); k.L([[-.1, -.1], [-.26, .1]], .02, '#2f6f9a');
    k.L([[-.12, -.13], [-.06, -.13]], .03, '#1c1c1f'); k.L([[.14, -.1], [.12, -.17], [.2, -.18]], .018, '#2a2a2e');
  },
  boat(c, s, t) { const k = cineKit(c, s); c.translate(0, Math.sin(t * 1.6) * .012 * s); c.rotate(Math.sin(t * 1.2) * .03);
    k.P([[-.4, -.02], [.44, -.04], [.3, .12], [-.32, .12]], k.grad('#f2efe8', -.04, .12), true); c.fillStyle = '#7a3b2a'; c.fillRect(-.4 * s, .0, .84 * s, .025 * s);
    k.L([[0, -.02], [0, -.62]], .014, '#6b5a4a');
    k.P([[.01, -.6], [.01, -.06], [.32, -.08]], k.hgrad('#eee7d8', .01, .3, .05, -.15), false); k.P([[-.01, -.55], [-.01, -.07], [-.26, -.07]], k.hgrad('#d8d0c0', -.26, -.01, .05, -.15), false);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(-.5 * s, .12 * s, .3 * s, .008 * s);
  },
  ship(c, s, t) { const k = cineKit(c, s); c.translate(0, Math.sin(t * 1.1) * .008 * s);
    k.P([[-.58, -.06], [.6, -.08], [.48, .14], [-.52, .14]], k.grad('#1f2c44', -.08, .14), false); c.fillStyle = '#8f2a2a'; c.fillRect(-.56 * s, .08 * s, 1.08 * s, .06 * s);
    k.R(-.42, -.2, .74, .14, .02, k.grad('#f2f3f5', -.2, -.06)); k.R(-.32, -.31, .5, .11, .02, k.grad('#eef0f2', -.31, -.2)); k.R(-.2, -.39, .26, .08, .02, '#e9ebee');
    c.fillStyle = '#2a3747'; for (let r = 0; r < 2; r++) for (let i = 0; i < 12 - r * 4; i++) c.fillRect((-.38 + r * .1 + i * .06) * s, (-.16 - r * .11) * s, .035 * s, .025 * s);
    k.P([[.08, -.39], [.16, -.39], [.18, -.5], [.06, -.5]], k.grad('#b3332f', -.5, -.39), false); c.fillStyle = '#1c1c20'; c.fillRect(.06 * s, -.52 * s, .12 * s, .025 * s);
  },
  train(c, s, t, a) { const k = cineKit(c, s), mv = go(a) ? 1 : 0;
    k.shadow(.16, .56); k.P([[-.6, -.3], [.36, -.3], [.56, -.16], [.6, .06], [-.6, .06]], k.grad('#d9dde2', -.3, .06), true);
    k.glass([[-.56, -.23], [.32, -.23], [.32, -.12], [-.56, -.12]], -.23, -.12, false); k.glass([[.38, -.25], [.52, -.15], [.54, -.1], [.38, -.1]], -.25, -.1, true);
    c.fillStyle = '#c0392b'; c.fillRect(-.6 * s, -.06 * s, 1.18 * s, .03 * s); c.fillStyle = 'rgba(0,0,0,.25)'; for (const x of [-.36, -.04]) c.fillRect(x * s, -.23 * s, .008 * s, .29 * s);
    k.E(.57, .0, .02, .015, '#f3ecd0');
    for (const x of [-.48, -.36, .3, .42]) k.wheel(x, .1, .05, t, mv);
  },
  yacht(c, s, t) { const k = cineKit(c, s); c.translate(0, Math.sin(t * 1.4) * .01 * s); c.rotate(Math.sin(t * 1.1) * .012);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(-.5 * s, .12 * s); c.quadraticCurveTo(-.8 * s, .1 * s, -1.05 * s, .15 * s); c.lineTo(-1.05 * s, .17 * s); c.quadraticCurveTo(-.8 * s, .13 * s, -.5 * s, .15 * s); c.fill();
    k.P([[-.56, -.05], [.4, -.07], [.62, -.1], [.42, .13], [-.5, .13]], k.grad('#f4f5f6', -.1, .13, .03, -.2), false);
    c.fillStyle = '#1d2738'; c.beginPath(); c.moveTo(-.52 * s, .06 * s); c.lineTo(.5 * s, .03 * s); c.lineTo(.44 * s, .07 * s); c.lineTo(-.5 * s, .1 * s); c.fill();
    k.P([[-.42, -.05], [-.36, -.17], [.22, -.17], [.38, -.06]], k.grad('#f4f5f6', -.17, -.05), false); k.P([[-.3, -.17], [-.24, -.27], [.08, -.27], [.18, -.17]], k.grad('#eef0f2', -.27, -.17), false);
    k.glass([[-.33, -.15], [.2, -.15], [.3, -.08], [-.34, -.08]], -.15, -.08, false); k.glass([[-.22, -.25], [.06, -.25], [.13, -.19], [-.23, -.19]], -.25, -.19, false);
    k.L([[-.06, -.27], [-.06, -.38]], .012, '#9aa2ac'); k.E(-.06, -.39, .02, .01, '#9aa2ac');
  },
  speedboat(c, s, t, a) { const k = cineKit(c, s); c.translate(0, Math.sin(t * 6) * .01 * s); c.rotate(-.05);
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse((-.5 - i * .1) * s, (.09 - Math.abs(Math.sin(t * 9 + i)) * .03) * s, .05 * s, .025 * s, 0, 0, 7); c.fill(); }
    k.P([[-.48, -.05], [.36, -.05], [.56, -.03], [.32, .1], [-.42, .1]], k.grad('#f2f3f5', -.05, .1), false); c.fillStyle = '#9c2b31'; c.fillRect(-.46 * s, .01 * s, .9 * s, .025 * s);
    k.glass([[-.06, -.05], [.06, -.15], [.14, -.15], [.12, -.05]], -.15, -.05, false); k.R(-.3, -.09, .2, .04, .015, '#d9cdb5');
  },
  rocket(c, s, t, a) { const k = cineKit(c, s); const fl = .14 + Math.abs(Math.sin(t * 30)) * .06;
    k.P([[-.04, .26], [.04, .26], [0, .26 + fl]], '#f0a83a', false); k.P([[-.025, .26], [.025, .26], [0, .26 + fl * .6]], '#fff1c4', false);
    k.P([[0, -.42], [.08, -.24], [.08, .24], [-.08, .24], [-.08, -.24]], k.hgrad('#eceef1', -.08, .08), true);
    k.P([[-.08, .1], [-.16, .26], [-.08, .24]], '#9c2b31', false); k.P([[.08, .1], [.16, .26], [.08, .24]], '#7e2227', false);
    k.E(0, -.1, .035, .035, '#2a3440'); k.E(-.01, -.11, .012, .012, 'rgba(255,255,255,.5)');
  },
  dog(c, s, t, a) { const k = cineKit(c, s), run = a === 'run' || a === 'fly', w = t * (run ? 14 : 3), bark = a === 'shake', col = '#b47b4a', dk = '#94613a';
    k.shadow(.24, .32);
    for (const [x, ph, far] of [[-.2, 0, 1], [.16, Math.PI, 1], [-.14, Math.PI, 0], [.22, 0, 0]]) { const sw = run ? Math.sin(w + ph) * .5 : Math.sin(w + ph) * .03; const [fx, fy] = k.leg(x, .0, .24, .05, sw, far ? dk : col, run ? -Math.max(0, Math.sin(w + ph)) * .6 : 0); k.E(fx + .015, fy, .03, .016, far ? dk : col); }
    const wag = Math.sin(t * (run ? 18 : 9)) * .35; c.save(); c.translate(-.3 * s, -.06 * s); c.rotate(-.9 + wag); k.P([[-.015, 0], [.015, 0], [.008, -.2], [-.01, -.2]], col, true); c.restore();
    k.P([[-.32, -.05], [-.2, -.13], [.1, -.13], [.27, -.1], [.3, .02], [.16, .06], [-.22, .05]], k.grad(col, -.13, .06));
    c.save(); c.translate(.27 * s, -.14 * s); c.rotate(run ? Math.sin(w) * .05 : Math.sin(t) * .03);
    k.P([[-.06, .06], [-.08, -.06], [0, -.12], [.1, -.1], [.2, -.05], [.22, .02], [.12, .05], [.02, .1]], k.grad(col, -.12, .1));
    k.E(.2, -.03, .03, .022, '#1c1412'); k.eye(.07, -.06, .016);
    k.P([[-.05, -.1], [.02, -.11], [.0, .04], [-.06, .03]], k.grad(dk, -.1, .04), true);
    if (bark || run) k.P([[.12, .03], [.21, .04], [.14, .07]], '#8c3a33', false);
    c.restore(); k.R(.16, -.11, .03, .1, .01, '#9c2b31');
    if (bark && Math.sin(t * 8) > 0) { c.save(); c.font = `900 ${.14 * s}px Poppins`; c.fillStyle = '#fff'; c.strokeStyle = INK0; c.lineWidth = .02 * s; c.strokeText('AU!', .45 * s, -.32 * s); c.fillText('AU!', .45 * s, -.32 * s); c.restore(); }
  },
  cat(c, s, t, a) { const k = cineKit(c, s), col = '#7d7873', dk = '#5f5a56';
    k.shadow(.2, .2); const wag = Math.sin(t * 2.5) * .25;
    c.save(); c.translate(-.16 * s, .1 * s); c.rotate(-1.4 + wag); k.L([[0, 0], [0, -.14], [.05, -.26]], .035, dk); c.restore();
    k.P([[-.18, .2], [-.2, .02], [-.08, -.1], [.08, -.1], [.14, .04], [.12, .2]], k.grad(col, -.1, .2));
    for (const x of [-.04, .08]) k.R(x - .02, .1, .045, .11, .02, x < 0 ? dk : col);
    k.E(.08, -.16, .1, .09, k.grad(col, -.25, -.07)); k.P([[.0, -.2], [.02, -.32], [.07, -.23]], col, false); k.P([[.1, -.23], [.15, -.33], [.17, -.2]], col, false);
    k.P([[.02, -.22], [.03, -.28], [.06, -.23]], '#c98d84', false);
    for (const x of [.05, .12]) { k.E(x, -.17, .017, .012, '#9db35a'); k.E(x, -.17, .005, .011, '#121212'); }
    k.E(.15, -.13, .01, .007, '#b36e66'); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = .003 * s; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(.16 * s, -.125 * s); c.lineTo(.26 * s, (-.125 + d * .02) * s); c.stroke(); }
    c.fillStyle = 'rgba(40,35,32,.25)'; for (let i = 0; i < 3; i++) c.fillRect((-.12 + i * .07) * s, -.08 * s, .02 * s, .12 * s);
  },
  bird(c, s, t) { const k = cineKit(c, s), f = Math.sin(t * 16);
    k.P([[-.22, .0], [-.32, .04], [-.3, -.02]], '#4a5566', false);
    k.E(0, 0, .17, .085, k.grad('#6f7f92', -.085, .085)); k.E(.03, .03, .1, .045, '#c9b8a2'); k.E(.15, -.05, .07, .06, '#5b6a7c');
    k.P([[.21, -.06], [.29, -.04], [.21, -.03]], '#d4a24a', false); k.eye(.17, -.065, .012);
    c.save(); c.scale(1, f); k.P([[-.1, 0], [.06, 0], [-.06, -.26], [-.14, -.22]], k.grad('#4f5e71', -.26, 0), true); c.restore();
  },
  horse(c, s, t, a) { const k = cineKit(c, s), run = a === 'run', w = t * (run ? 11 : 2.5), col = '#7a4b2c', dk = '#5c361f';
    k.shadow(.36, .4);
    for (const [x, ph, far] of [[-.26, 0, 1], [.2, Math.PI, 1], [-.2, Math.PI, 0], [.26, 0, 0]]) { const sw = run ? Math.sin(w + ph) * .5 : 0; const [fx, fy] = k.leg(x, .02, .34, .045, sw, far ? dk : col, run ? -Math.max(0, Math.sin(w + ph)) * .7 : 0); k.R(fx - .025, fy - .01, .05, .025, .006, '#2a211c'); }
    c.save(); c.translate(-.36 * s, -.05 * s); c.rotate(.5 + (run ? Math.sin(w) * .2 : Math.sin(t) * .05)); k.P([[-.02, 0], [.03, 0], [.02, .26], [-.04, .24]], '#2a1e18', true); c.restore();
    k.P([[-.38, -.05], [-.3, -.14], [.16, -.15], [.32, -.1], [.34, .04], [.2, .08], [-.3, .08]], k.grad(col, -.15, .08));
    k.P([[.18, -.1], [.3, -.34], [.4, -.42], [.46, -.38], [.36, -.2], [.32, -.04]], k.grad(col, -.42, -.04));
    k.P([[.38, -.44], [.48, -.43], [.6, -.33], [.6, -.28], [.52, -.27], [.4, -.32]], k.grad(col, -.44, -.27));
    k.P([[.4, -.44], [.42, -.5], [.45, -.44]], dk, false); k.eye(.47, -.39, .014); k.E(.58, -.3, .012, .008, '#1c1412');
    k.P([[.2, -.12], [.3, -.36], [.39, -.45], [.36, -.36], [.27, -.12]], '#2a1e18', false);
  },
  cow(c, s, t, a) { const k = cineKit(c, s), col = '#ecebe6';
    k.shadow(.32, .4);
    for (const [x, far] of [[-.28, 1], [.2, 1], [-.22, 0], [.26, 0]]) { k.L([[x, 0], [x, .3]], .055, far ? '#cfcdc6' : col); k.R(x - .03, .28, .06, .03, .008, '#2b2420'); }
    k.L([[-.38, -.08], [-.46, .12]], .015, '#c9c6bd'); k.E(-.46, .14, .02, .03, '#2b2420');
    k.P([[-.38, -.12], [-.3, -.18], [.24, -.18], [.32, -.1], [.32, .06], [-.36, .06]], k.grad(col, -.18, .06));
    c.save(); k.path([[-.38, -.12], [-.3, -.18], [.24, -.18], [.32, -.1], [.32, .06], [-.36, .06]], true); c.clip(); c.fillStyle = '#26211e'; for (const [x, y, r] of [[-.2, -.1, .09], [.05, -.02, .07], [.2, -.14, .06], [-.3, .02, .05]]) { c.beginPath(); c.ellipse(x * s, y * s, r * s, r * .8 * s, .4, 0, 7); c.fill(); } c.restore();
    k.E(.06, .07, .06, .035, '#d9a4a0');
    k.P([[.3, -.16], [.44, -.2], [.5, -.06], [.42, .0], [.32, -.04]], k.grad(col, -.2, 0)); k.E(.47, -.04, .045, .035, '#d9a4a0');
    k.L([[.34, -.19], [.3, -.26]], .016, '#d8cfb8'); k.L([[.4, -.2], [.42, -.27]], .016, '#d8cfb8'); k.eye(.42, -.14, .013);
  },
  fish(c, s, t) { const k = cineKit(c, s); c.rotate(Math.sin(t * 4) * .08); const col = '#d9823a';
    k.P([[-.22, 0], [-.4, -.13], [-.36, 0], [-.4, .13]], shade(col, -.15), true);
    k.P([[-.26, 0], [-.1, -.13], [.12, -.12], [.27, -.02], [.27, .02], [.12, .11], [-.1, .12]], k.grad(col, -.13, .12));
    k.P([[-.04, -.12], [.06, -.2], [.1, -.11]], shade(col, -.1), true); c.strokeStyle = 'rgba(80,30,10,.25)'; c.lineWidth = .006 * s; c.beginPath(); c.arc(.14 * s, 0, .07 * s, -1.2, 1.2); c.stroke();
    k.eye(.19, -.03, .018);
  },
  shark(c, s, t) { const k = cineKit(c, s); c.rotate(Math.sin(t * 2) * .04);
    k.P([[-.42, 0], [-.56, -.16], [-.52, 0], [-.58, .12]], '#4f5d6b', true);
    k.P([[-.46, 0], [-.2, -.1], [.2, -.1], [.46, -.02], [.5, .02], [.3, .07], [-.2, .07]], k.grad('#6a7a8a', -.1, .07, .1, -.2));
    c.save(); k.path([[-.46, 0], [-.2, -.1], [.2, -.1], [.46, -.02], [.5, .02], [.3, .07], [-.2, .07]], true); c.clip(); c.fillStyle = '#e7e9eb'; c.beginPath(); c.ellipse(.05 * s, .07 * s, .45 * s, .045 * s, 0, 0, 7); c.fill(); c.restore();
    k.P([[-.04, -.09], [.04, -.26], [.1, -.1]], '#5a6878', false); k.P([[.02, .04], [.14, .14], [.12, .05]], '#56636f', false);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = .006 * s; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo((.24 + i * .025) * s, -.04 * s); c.lineTo((.23 + i * .025) * s, .03 * s); c.stroke(); }
    k.eye(.38, -.03, .012); k.L([[.36, .03], [.46, .02]], .006, '#2a2e33');
  },
  snake(c, s, t) { const k = cineKit(c, s), pts = []; for (let i = 0; i <= 24; i++) { const x = -.42 + i * .035; pts.push([x, Math.sin(i * .5 - t * 4) * .06]); }
    k.L(pts, .07, '#4f6a3a'); c.strokeStyle = 'rgba(210,190,120,.35)'; c.setLineDash([.03 * s, .04 * s]); c.lineWidth = .03 * s; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * s, y * s) : c.moveTo(x * s, y * s))); c.stroke(); c.setLineDash([]);
    const [hx, hy] = pts[pts.length - 1]; k.E(hx + .03, hy, .06, .04, k.grad('#4f6a3a', hy - .04, hy + .04)); k.eye(hx + .05, hy - .015, .01);
    if (Math.sin(t * 6) > .3) k.L([[hx + .09, hy + .01], [hx + .14, hy + .01], [hx + .16, hy - .01]], .006, '#a33a3a');
  },
  pig(c, s, t) { const k = cineKit(c, s), col = '#e3a9a1';
    k.shadow(.2, .28); for (const x of [-.18, -.1, .1, .18]) k.R(x - .025, .04, .05, .15, .015, shade(col, x < 0 ? -.12 : 0));
    k.E(0, -.02, .26, .15, k.grad(col, -.17, .13)); k.E(.26, -.06, .1, .09, k.grad(col, -.15, .03)); k.E(.35, -.05, .035, .04, shade(col, -.1));
    k.E(.35, -.055, .006, .01, '#6b3b36'); k.E(.35, -.035, .006, .01, '#6b3b36'); k.P([[.2, -.14], [.24, -.2], [.28, -.13]], shade(col, -.12), false); k.eye(.29, -.09, .011);
    k.L([[-.26, -.04], [-.31, -.08], [-.3, -.12], [-.27, -.1]], .012, shade(col, -.1));
  },
  chicken(c, s, t) { const k = cineKit(c, s), peck = Math.max(0, Math.sin(t * 3)) * .1;
    k.shadow(.24, .15); k.L([[-.02, .08], [-.03, .22]], .012, '#d4a24a'); k.L([[.05, .08], [.06, .22]], .012, '#c49442');
    k.P([[-.22, -.12], [-.14, .0], [.0, .1], [.12, .06], [.14, -.06], [.02, -.04], [-.12, -.1]], k.grad('#efece5', -.12, .1)); k.P([[-.22, -.12], [-.28, -.24], [-.16, -.1]], '#dedad2', false);
    c.save(); c.translate(.12 * s, -.08 * s); c.rotate(peck); k.E(0, -.07, .055, .06, '#f2efe8'); k.P([[.04, -.08], [.1, -.06], [.04, -.05]], '#d4a24a', false); k.E(.02, -.02, .015, .022, '#b8312f'); k.P([[-.03, -.12], [-.01, -.16], [.01, -.13], [.03, -.16], [.04, -.12]], '#b8312f', true); k.eye(.025, -.085, .01); c.restore();
  },
  rat(c, s, t, a) { const k = cineKit(c, s), run = go(a), w = t * 18;
    k.shadow(.1, .15); k.L([[-.14, .02], [-.26, .0], [-.36, .04]], .01, '#c99a94');
    k.E(0, 0, .15, .07, k.grad('#7b7b80', -.07, .07)); k.P([[.1, -.05], [.22, .0], [.1, .05]], '#7b7b80', true); k.E(.07, -.06, .03, .03, '#c99a94'); k.eye(.13, -.02, .01); k.E(.22, 0, .008, .008, '#2a1e1e');
    for (const [x, ph] of [[-.07, 0], [.06, Math.PI]]) k.L([[x, .05], [x + (run ? Math.sin(w + ph) * .03 : 0), .09]], .015, '#5f5f64');
  },
  monkey(c, s, t) { const k = cineKit(c, s), col = '#6a4a33', sw = Math.sin(t * 2) * .06;
    k.L([[-.08, .08], [-.18, .02], [-.2, -.12], [-.14, -.16]], .025, col);
    k.P([[-.1, .16], [-.12, -.02], [0, -.08], [.12, -.02], [.1, .16]], k.grad(col, -.08, .16)); k.E(0, .05, .06, .07, '#c8a17f');
    k.L([[.08, -.02], [.16 + sw, .08], [.12, .16]], .03, col); k.L([[-.08, -.02], [-.14, .1], [-.1, .16]], .03, shade(col, -.15));
    k.E(-.1, -.17, .035, .035, '#c8a17f'); k.E(.1, -.17, .035, .035, '#c8a17f'); k.E(0, -.17, .1, .09, col); k.E(0, -.14, .07, .06, '#d4b08e');
    k.eye(-.03, -.17, .012); k.eye(.03, -.17, .012); k.L([[-.02, -.11], [.02, -.11]], .005, '#5a3a2a');
  },
  lion(c, s, t) { const k = cineKit(c, s), col = '#c8964f';
    k.shadow(.3, .38); for (const [x, far] of [[-.26, 1], [.16, 1], [-.2, 0], [.22, 0]]) { k.L([[x, -.02], [x, .27]], .06, far ? shade(col, -.15) : col); k.E(x + .015, .28, .04, .02, shade(col, -.1)); }
    k.L([[-.34, -.05], [-.48, .04], [-.52, -.08]], .018, col); k.E(-.52, -.09, .03, .035, '#5a3418');
    k.P([[-.36, -.04], [-.26, -.14], [.14, -.14], [.26, -.06], [.24, .06], [-.32, .06]], k.grad(col, -.14, .06));
    k.E(.27, -.15, .16, .17, k.grad('#6b3d1c', -.32, .02)); k.E(.32, -.13, .09, .1, k.grad(col, -.23, -.03)); k.E(.4, -.1, .04, .035, '#d8b483'); k.E(.42, -.12, .015, .01, '#3a2418'); k.eye(.34, -.17, .012);
  },
  phone_ring(c, s, t) { const k = cineKit(c, s), sh = Math.sin(t * 40) * .02;
    c.save(); c.rotate(sh); k.R(-.14, -.28, .28, .56, .05, '#0d0d10'); const g = c.createLinearGradient(0, -.26 * s, 0, .26 * s); g.addColorStop(0, '#1b2a3c'); g.addColorStop(1, '#4b6f8f'); k.R(-.125, -.265, .25, .53, .04, g);
    k.R(-.04, -.255, .08, .02, .01, '#000'); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `600 ${.06 * s}px Inter, sans-serif`; c.textAlign = 'center'; c.fillText('Chamada', 0, -.12 * s); k.E(-.06, .17, .03, .03, '#c0392b'); k.E(.06, .17, .03, .03, '#2e9d55'); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = .012 * s; c.lineCap = 'round'; for (const d of [-1, 1]) for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0, 0, (.22 + i * .07) * s, d > 0 ? -.5 : Math.PI - .5, d > 0 ? .5 : Math.PI + .5); c.stroke(); }
  },
  suitcase(c, s, t) { const k = cineKit(c, s); k.shadow(.3, .18); k.L([[-.06, -.24], [-.06, -.32], [.06, -.32], [.06, -.24]], .018, '#2a2a2e');
    k.R(-.17, -.25, .34, .5, .04, k.hgrad('#3b4a5c', -.17, .17)); c.fillStyle = 'rgba(0,0,0,.18)'; for (const x of [-.08, 0, .08]) c.fillRect(x * s, -.23 * s, .012 * s, .46 * s);
    k.E(-.12, .27, .025, .025, '#18181b'); k.E(.12, .27, .025, .025, '#18181b'); },
  coffin(c, s, t) { const k = cineKit(c, s); k.shadow(.42, .2); k.P([[-.1, -.4], [.1, -.4], [.18, -.2], [.12, .4], [-.12, .4], [-.18, -.2]], k.hgrad('#5a3a26', -.18, .18), false);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-.12 * s, -.14 * s, .24 * s, .01 * s); k.R(-.012, -.3, .024, .2, .005, '#c9a85a'); k.R(-.06, -.24, .12, .022, .005, '#c9a85a'); },
  tv2(c, s, t) { const k = cineKit(c, s); k.R(-.42, -.28, .84, .5, .02, '#141417'); const g = c.createLinearGradient(-.4 * s, -.26 * s, .4 * s, .2 * s); g.addColorStop(0, '#2a3a4c'); g.addColorStop(1, '#0d1218'); k.R(-.4, -.26, .8, .46, .01, g);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.moveTo(-.4 * s, -.26 * s); c.lineTo(-.1 * s, -.26 * s); c.lineTo(-.3 * s, .2 * s); c.lineTo(-.4 * s, .2 * s); c.fill(); k.R(-.03, .22, .06, .06, .01, '#1c1c20'); k.R(-.16, .27, .32, .025, .01, '#1c1c20'); },
  laptop2(c, s, t) { const k = cineKit(c, s); k.P([[-.3, -.24], [.3, -.24], [.3, .1], [-.3, .1]], '#2b2d33', false); const g = c.createLinearGradient(0, -.22 * s, 0, .08 * s); g.addColorStop(0, '#3d5a78'); g.addColorStop(1, '#16222f'); k.R(-.28, -.22, .56, .3, .01, g);
    k.P([[-.36, .1], [.36, .1], [.4, .15], [-.4, .15]], k.grad('#b9bec6', .1, .15), false); },
  jetski(c, s, t, a) { const k = cineKit(c, s); c.translate(0, Math.sin(t * 6) * .01 * s); c.rotate(-.04);
    c.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse((-.32 - i * .09) * s, (.07 - Math.abs(Math.sin(t * 9 + i)) * .03) * s, .045 * s, .02 * s, 0, 0, 7); c.fill(); }
    c.save(); c.translate(-.02 * s, -.02 * s); const pc = PLACE_FX.cabin; PLACE_FX.cabin = true; drawPerson(c, castOf(S.__drawP || S.project, 'hero'), { h: s * .55, pose: 'sit', emotion: 'happy', facing: 1, style: 'cine' }, t); PLACE_FX.cabin = pc; c.restore();
    k.P([[-.3, -.02], [.18, -.04], [.34, -.02], [.24, .08], [-.28, .08]], k.grad('#e9ecef', -.04, .08), false); c.fillStyle = '#c0392b'; c.fillRect(-.28 * s, .01 * s, .55 * s, .02 * s);
    k.P([[.08, -.04], [.16, -.12], [.2, -.11], [.16, -.04]], '#26292e', false); k.L([[.14, -.1], [.08, -.16]], .015, '#26292e'); },
  cash_case(c, s, t) { const k = cineKit(c, s); k.shadow(.18, .3); k.R(-.3, -.12, .6, .3, .03, k.grad('#2b2b30', -.12, .18)); k.R(-.27, -.1, .54, .14, .01, '#3e6b45');
    c.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 1; i < 6; i++) c.fillRect((-.27 + i * .09) * s, -.1 * s, .006 * s, .14 * s); k.L([[-.08, -.12], [-.08, -.18], [.08, -.18], [.08, -.12]], .02, '#1c1c20'); },
};
for (const id of Object.keys(CAR_PROFILES)) CINE_DRAW[id] = (c, s, t, a, W, H, th) => drawCarCine(c, s, t, a, { ...th, __type: id });
CINE_DRAW.car2 = (c, s, t, a, W, H, th) => drawCarCine(c, s, t, a, { ...th, __type: 'hatch' });

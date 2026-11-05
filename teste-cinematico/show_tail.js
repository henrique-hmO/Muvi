function cap(c, txt) {
  const ws = txt.split(' ').map(w => ({ w: w.replace(/\*/g, ''), hot: w.includes('*') }));
  c.save(); c.font = '900 76px Inter'; const sp = 22, pad = 18;
  ws.forEach(w => w.wd = c.measureText(w.w).width + (w.hot ? pad * 2 : 0));
  const tot = ws.reduce((n, w) => n + w.wd, 0) + sp * (ws.length - 1); const sc = Math.min(1, 980 / tot);
  c.translate(540, 1560); c.scale(sc, sc); let x = -tot / 2;
  ws.forEach((w, i) => { c.save(); if (i === ws.length - 1 && !w.hot) { c.filter = 'blur(9px)'; c.globalAlpha = .55; }
    if (w.hot) { c.fillStyle = RED; rr(c, x - 2, -70, w.wd + 4, 92, 16); c.fill(); }
    c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = w.hot ? 0 : 14; c.shadowOffsetY = 4; c.fillText(w.w, x + (w.hot ? pad : 0), 0); c.restore(); x += w.wd + sp; });
  c.restore();
}
return { figFront, lights, grain, vignette, glow, cap, SKIN, SKIN2 };
})();
INK = 'rgba(20,16,14,0.22)';
const __dp = drawPerson;
drawPerson = function (ctx, look, o, t) {
  if (o.silhouette) return __dp(ctx, look, o, t);
  const sk = { s1: ['#e9c4a6', '#c99f82'], s2: ['#d9a77f', '#b88560'], s3: ['#c99272', '#a9725a'], s4: ['#9a6448', '#7a4a33'], s5: ['#6b4330', '#4e2f20'] }[look.skin] || CINE.SKIN;
  ctx.save();
  CINE.figFront(ctx, 0, 0, o.h * 1.08, { hair: look.g === 'f' ? 'long' : 'short', shirt: look.topColor || '#3b4a6b', shirtD: '#1c2230', pants: look.pants || '#2b2f38', skin: sk, sway: Math.sin(t) });
  ctx.restore();
};
window.__cine = true;

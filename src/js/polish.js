/* ============ POLISH: boca sincronizada com a voz, reação nas palavras fortes, câmera viva, figurantes variados ============ */
let CINE_AMP = null, CINE_REACT = 0;
const ENV = { buf: null, data: null, rate: 60 };
/* loudness envelope of the narration (60 values per second, normalised) */
function voiceEnvelope(buf) {
  if (ENV.buf === buf) return ENV.data;
  const ch = buf.getChannelData(0), step = Math.round(buf.sampleRate / ENV.rate), n = Math.ceil(ch.length / step), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; const a = i * step, b = Math.min(ch.length, a + step); for (let j = a; j < b; j += 4) s += ch[j] * ch[j]; out[i] = Math.sqrt(s / Math.max(1, (b - a) / 4)); }
  const sorted = Array.from(out).filter(v => v > .002).sort((x, y) => x - y), ref = sorted[Math.floor(sorted.length * .95)] || .1;
  for (let i = 0; i < n; i++) out[i] = Math.min(1, out[i] / ref);
  ENV.buf = buf; ENV.data = out; return out;
}
function ampAt(P, t) {
  const buf = P?.narration?.buffer; if (!buf || typeof buf.getChannelData !== 'function') return null;
  const e = voiceEnvelope(buf), i = t * ENV.rate, i0 = Math.floor(i); if (i0 < 0 || i0 >= e.length) return 0;
  const a = e[i0], b = e[Math.min(e.length - 1, i0 + 1)]; return a + (b - a) * (i - i0);
}
function reactAt(P, t) { if (typeof punchAt !== 'function') return 0; punchAt(P, t); let r = 0; for (const t0 of PUNCH.times) { const d = t - t0; if (d >= 0 && d < .7) r = Math.max(r, d < .12 ? d / .12 : 1 - (d - .12) / .58); } return r; }
const _drawFrame = drawFrame;
drawFrame = function (ctx, P, t, opts) { CINE_AMP = ampAt(P, t); CINE_REACT = reactAt(P, t); try { return _drawFrame(ctx, P, t, opts); } finally { CINE_AMP = null; CINE_REACT = 0; } };

/* living camera: slow handheld drift + shake when a carimbo hits or in danger */
function camFx(ctx, W, H, P, s, t, local) {
  if (P.mode === 'footage') return;
  const m = Math.min(W, H), drift = m * .004, dx = Math.sin(t * .9) * drift + Math.sin(t * 2.3) * drift * .4, dy = Math.cos(t * .7) * drift * .8, rot = Math.sin(t * .5) * .0025;
  let sh = 0; if (s.fx?.carimbo && local > .35 && local < .6) sh = (1 - (local - .35) / .25) * m * .012; if (s.p?.mood === 'danger') sh = Math.max(sh, m * .0025);
  const sx = sh ? Math.sin(t * 91) * sh : 0, sy = sh ? Math.cos(t * 77) * sh : 0;
  ctx.translate(W / 2 + dx + sx, H / 2 + dy + sy); ctx.rotate(rot); ctx.translate(-W / 2, -H / 2);
  const z = 1.012; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
}

/* varied background people (skin, hair, clothes) instead of identical silhouettes */
const CROWD_TOPS = ['#3b4a6b', '#7a3b3b', '#2e6b4f', '#8a6a2e', '#5a4a7a', '#2a2a2e', '#b8653e', '#4a7a8a', '#c9b79a'], CROWD_HAIR = ['short', 'long', 'curly', 'bun', 'buzz', 'bald', 'cap'], CROWD_SKIN = ['s1', 's2', 's3', 's4', 's5'];
function crowdLook(i) { const r = seeded(i * 7 + 3); return { g: r() > .5 ? 'f' : 'm', skin: CROWD_SKIN[Math.floor(r() * 5)], hair: CROWD_HAIR[Math.floor(r() * 7)], hairColor: ['#2a1d16', '#1a1412', '#5a3a22', '#8a6a3a', '#b9b3ad'][Math.floor(r() * 5)], top: ['tshirt', 'hoodie', 'jacket', 'tank'][Math.floor(r() * 4)], topColor: CROWD_TOPS[Math.floor(r() * CROWD_TOPS.length)], pants: ['#2b2f38', '#3a3632', '#4a5a7a', '#5a4a3a'][Math.floor(r() * 4)] }; }

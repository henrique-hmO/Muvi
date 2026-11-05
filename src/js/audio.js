/* ============ AUDIO: generated music bed, transitions, silence detection, offline mix ============ */
const AU = { ctx: null, live: [], timer: null };
function audioCtx() { if (!AU.ctx) AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); return AU.ctx; }

let NOISE_BUF = null;
function noiseBuffer(ctx) {
  if (NOISE_BUF && NOISE_BUF.sampleRate === ctx.sampleRate) return NOISE_BUF;
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0);
  let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
  return (NOISE_BUF = b);
}
const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G

/* schedule the generated bed for [from, to) of the timeline, starting at ctx time `at` */
function scheduleBed(ctx, dest, from, to, at, vol, nodes) {
  const bpm = 92, beat = 60 / bpm, bar = beat * 4;
  const master = ctx.createGain(); master.gain.value = vol; master.connect(dest); nodes.push(master);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.connect(master);
  const firstBar = Math.floor(from / bar);
  for (let b = firstBar; b * bar < to; b++) {
    const bt = b * bar, chord = PROG[b % 4];
    /* pad */
    for (const n of chord) for (const det of [-6, 6]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det;
      const s = at + Math.max(0, bt - from), e = at + (bt + bar - from);
      if (e <= at) continue;
      g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.022, s + .4); g.gain.setValueAtTime(.022, e - .3); g.gain.linearRampToValueAtTime(0, e);
      o.connect(g); g.connect(lp); o.start(s); o.stop(e + .05); nodes.push(o);
    }
    for (let k = 0; k < 8; k++) {
      const tt = bt + k * beat / 2; if (tt < from || tt >= to) continue; const s = at + (tt - from);
      if (k % 4 === 0) { /* kick */
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, s); o.frequency.exponentialRampToValueAtTime(42, s + .18);
        g.gain.setValueAtTime(.55, s); g.gain.exponentialRampToValueAtTime(.001, s + .32); o.connect(g); g.connect(master); o.start(s); o.stop(s + .35); nodes.push(o);
      }
      if (k % 4 === 2) { /* snare-ish */
        const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = noiseBuffer(ctx); f.type = 'bandpass'; f.frequency.value = 1800;
        g.gain.setValueAtTime(.16, s); g.gain.exponentialRampToValueAtTime(.001, s + .16); n.connect(f); f.connect(g); g.connect(master); n.start(s, k * .05); n.stop(s + .18); nodes.push(n);
      }
      { /* hat */
        const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = noiseBuffer(ctx); f.type = 'highpass'; f.frequency.value = 7000;
        g.gain.setValueAtTime(k % 2 ? .05 : .03, s); g.gain.exponentialRampToValueAtTime(.001, s + .05); n.connect(f); f.connect(g); g.connect(master); n.start(s, .3); n.stop(s + .06); nodes.push(n);
      }
      if (k % 2 === 0) { /* bass */
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = midi(chord[0] - 24);
        g.gain.setValueAtTime(.14, s); g.gain.exponentialRampToValueAtTime(.001, s + beat * .9); o.connect(g); g.connect(master); o.start(s); o.stop(s + beat); nodes.push(o);
      }
    }
  }
}
function scheduleWhoosh(ctx, dest, when, vol = .25, nodes) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noiseBuffer(ctx); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(400, when); f.frequency.exponentialRampToValueAtTime(3200, when + .35);
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .12); g.gain.exponentialRampToValueAtTime(.001, when + .45);
  n.connect(f); f.connect(g); g.connect(dest); n.start(when); n.stop(when + .5); nodes?.push(n);
}

/* everything except the footage's own sound, for the window [from, to) */
function scheduleProjectAudio(ctx, dest, P, from, to, at, nodes) {
  const footage = P.mode === 'footage', nb = P.narration?.buffer, duck = footage ? .5 : nb ? .55 : 1;
  if (nb && from < nb.duration) {
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = nb; g.gain.value = P.narration.vol ?? 1;
    src.connect(g); g.connect(dest); src.start(at, from, Math.min(to, nb.duration) - from); nodes.push(src);
  }
  if (P.music.kind === 'pulse') scheduleBed(ctx, dest, from, to, at, P.music.vol * duck, nodes);
  else if (P.music.kind === 'upload' && P.music.buffer) {
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = P.music.buffer; src.loop = true;
    g.gain.value = P.music.vol * (footage ? .45 : duck);
    const end = at + (to - from);
    g.gain.setValueAtTime(g.gain.value, Math.max(at, end - 1.5)); g.gain.linearRampToValueAtTime(0, end);
    src.connect(g); g.connect(dest); src.start(at, from % P.music.buffer.duration); src.stop(end + .05); nodes.push(src);
  }
  if (P.sfx) {
    let acc = 0;
    if (P.mode !== 'footage' && from <= 0.01) scheduleWhoosh(ctx, dest, at, .3, nodes);
    P.scenes.forEach((s, i) => { if (i > 0 && acc >= from && acc < to) scheduleWhoosh(ctx, dest, at + (acc - from), .22, nodes); acc += sceneDur(P, s); });
  }
}

/* ---------- live preview ---------- */
function startLiveAudio(P, t) {
  stopLiveAudio(); const ctx = audioCtx(); if (ctx.state === 'suspended') ctx.resume();
  const total = projectDuration(P), at = ctx.currentTime + .05;
  /* schedule in windows of 20 s so long projects do not build thousands of nodes up front */
  let cursor = t;
  const pump = () => {
    if (cursor >= total) return;
    const elapsed = ctx.currentTime - at, ahead = cursor - (t + elapsed);
    if (ahead < 8) { const nxt = Math.min(total, cursor + 20); scheduleProjectAudio(ctx, ctx.destination, P, cursor, nxt, at + (cursor - t), AU.live); cursor = nxt; }
  };
  pump(); AU.timer = setInterval(pump, 1000);
}
function stopLiveAudio() {
  clearInterval(AU.timer); AU.timer = null;
  for (const n of AU.live) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { } try { n.disconnect(); } catch (e) { } }
  AU.live = [];
}

/* ---------- analysis ---------- */
function rmsEnvelope(buf, win = .02) {
  const sr = buf.sampleRate, n = Math.floor(buf.duration / win), out = new Float32Array(n);
  const chs = [...Array(buf.numberOfChannels)].map((_, i) => buf.getChannelData(i)), step = Math.floor(sr * win);
  for (let i = 0; i < n; i++) {
    let s = 0; const o = i * step;
    for (let j = 0; j < step; j += 2) { let v = 0; for (const c of chs) v += c[o + j] || 0; v /= chs.length; s += v * v; }
    out[i] = Math.sqrt(s / (step / 2));
  }
  return { env: out, win };
}
function detectSilences(buf, minDur = .45) {
  const { env, win } = rmsEnvelope(buf);
  const sorted = [...env].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * .1)] || 0, speech = sorted[Math.floor(sorted.length * .9)] || 0;
  const thr = Math.max(.004, floor + (speech - floor) * .16);
  const out = []; let st = null;
  for (let i = 0; i <= env.length; i++) {
    const quiet = i < env.length && env[i] < thr;
    if (quiet && st == null) st = i;
    if (!quiet && st != null) { const a = st * win, b = i * win; if (b - a >= minDur) out.push([a, b]); st = null; }
  }
  return out;
}
/* peaks (loud emphasis) used for auto-zoom suggestions */
function loudMoments(buf, count = 12) {
  const { env, win } = rmsEnvelope(buf, .25);
  const idx = [...env.keys()].sort((a, b) => env[b] - env[a]);
  const picked = [];
  for (const i of idx) { if (picked.every(p => Math.abs(p - i) > 24)) picked.push(i); if (picked.length >= count) break; }
  return picked.map(i => i * win).sort((a, b) => a - b);
}
function waveformPeaks(buf, n) {
  const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / n)), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let mx = 0; for (let j = 0; j < step; j += 16) { const v = Math.abs(d[i * step + j] || 0); if (v > mx) mx = v; } out[i] = mx; }
  return out;
}

/* ---------- offline mix for export ---------- */
async function renderMix(P, sr = 48000) {
  const total = projectDuration(P), len = Math.max(1, Math.ceil(total * sr));
  const ctx = new OfflineAudioContext(2, len, sr), nodes = [];
  if (P.mode === 'footage' && P.source?.audio) {
    let acc = 0;
    for (const s of P.scenes) {
      if (s.kind === 'clip') {
        for (const [x, y] of keptSegs(P, s)) {
          const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = P.source.audio;
          const d = y - x, f = Math.min(.008, d / 4);
          g.gain.setValueAtTime(0, acc); g.gain.linearRampToValueAtTime(1, acc + f); g.gain.setValueAtTime(1, acc + d - f); g.gain.linearRampToValueAtTime(0, acc + d);
          src.connect(g); g.connect(ctx.destination); src.start(acc, x, d); acc += d;
        }
      } else acc += sceneDur(P, s);
    }
  }
  scheduleProjectAudio(ctx, ctx.destination, P, 0, total, 0, nodes);
  return ctx.startRendering();
}

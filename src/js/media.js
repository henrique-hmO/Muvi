/* ============ MEDIA: footage loading, transcription, alignment, subtitles ============ */
const FILLERS = new Set(['é', 'éé', 'ééé', 'eh', 'ehh', 'ã', 'ãh', 'ah', 'ahn', 'an', 'hum', 'hm', 'hmm', 'uh', 'uhm', 'um', 'humm']);
const SOFT_FILLERS = new Set(['tipo', 'né', 'tá', 'assim']);
function markFillers(words) {
  for (const w of words) { const k = w.text.toLowerCase().replace(/[^\p{L}]/gu, ''); w.filler = FILLERS.has(k) ? 1 : SOFT_FILLERS.has(k) ? 2 : 0; }
  return words;
}

async function loadFootage(file, onStep) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url; video.playsInline = true; video.setAttribute('aria-hidden', 'true');
  video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1'; document.body.append(video); video.preload = 'auto'; video.crossOrigin = 'anonymous';
  onStep('read', 'run');
  await new Promise((res, rej) => { video.onloadedmetadata = res; video.onerror = () => rej(new Error('Esse arquivo de vídeo não abriu no navegador. Tente MP4 (H.264) ou WebM.')); });
  await new Promise(res => { if (video.readyState >= 2) res(); else video.onloadeddata = res; });
  onStep('read', 'done', `${video.videoWidth}×${video.videoHeight} · ${tc(video.duration)}`);
  onStep('audio', 'run');
  let audio = null;
  try {
    const buf = await file.arrayBuffer();
    audio = await audioCtx().decodeAudioData(buf);
    onStep('audio', 'done', `${audio.numberOfChannels === 1 ? 'mono' : 'estéreo'} · ${Math.round(audio.sampleRate / 1000)} kHz`);
  } catch (e) { onStep('audio', 'warn', 'Sem faixa de áudio legível. A edição segue sem som.'); }
  return { file, url, video, audio, duration: video.duration, w: video.videoWidth, h: video.videoHeight, name: file.name };
}

/* ---------- speech recognition from the video's own audio track ---------- */
function speechSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition) && !!HTMLMediaElement.prototype.captureStream; }
function transcribeLive(video, lang, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let stream, track;
    try { stream = video.captureStream(); track = stream.getAudioTracks()[0]; } catch (e) { return reject({ code: 'nocapture' }); }
    if (!track) return reject({ code: 'notrack' });
    const rec = new SR(); rec.lang = lang; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    const words = []; const starts = {}; let stopped = false, restarts = 0;
    rec.onresult = ev => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]; const key = `${restarts}:${i}`;
        if (starts[key] == null) starts[key] = Math.max(0, video.currentTime - 1.0);
        if (r.isFinal) {
          const text = r[0].transcript.trim(); const t1 = video.currentTime, t0 = Math.min(starts[key], t1 - .2);
          const ws = text.split(/\s+/).filter(Boolean); const tot = ws.reduce((a, w) => a + w.length + 1, 0); let c = 0;
          for (const w of ws) { const a = t0 + (c / tot) * (t1 - t0); c += w.length + 1; words.push({ text: w, t0: a, t1: t0 + (c / tot) * (t1 - t0) }); }
          onProgress(video.currentTime / video.duration, words.length, text);
        }
      }
    };
    rec.onerror = e => { if (e.error === 'no-speech' || e.error === 'aborted') return; stopped = true; cleanup(); reject({ code: e.error }); };
    rec.onend = () => { if (!stopped && !video.ended) { restarts++; try { rec.start(track); } catch (e) { } } };
    const tick = setInterval(() => onProgress(video.currentTime / video.duration, words.length), 500);
    const cleanup = () => { clearInterval(tick); video.pause(); try { rec.stop(); } catch (e) { } };
    video.onended = () => { stopped = true; setTimeout(() => { try { rec.stop(); } catch (e) { } clearInterval(tick); resolve(refineWithEnergy(words)); }, 1200); };
    signal?.addEventListener('abort', () => { stopped = true; cleanup(); resolve(refineWithEnergy(words)); });
    video.currentTime = 0; video.muted = false; video.volume = 1;
    try { rec.start(track); } catch (e) { return reject({ code: 'track-unsupported' }); }
    video.play().catch(err => { cleanup(); reject({ code: 'play' }); });
  });
}
/* tighten recognizer phrase timings using the silence map */
function refineWithEnergy(words) {
  words.sort((a, b) => a.t0 - b.t0);
  for (let i = 1; i < words.length; i++) if (words[i].t0 < words[i - 1].t1) words[i].t0 = words[i - 1].t1;
  return words.filter(w => w.t1 > w.t0);
}

/* ---------- align pasted text to the speech (no recognizer needed) ---------- */
function alignText(text, duration, silences) {
  const toks = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!toks.length) return [];
  /* voiced regions = complement of silences */
  const voiced = []; let last = 0;
  for (const [a, b] of silences) { if (a > last + .05) voiced.push([last, a]); last = b; }
  if (duration > last + .05) voiced.push([last, duration]);
  const vTotal = voiced.reduce((s, [a, b]) => s + (b - a), 0) || duration;
  const weights = toks.map(w => w.length + 1.5), wTotal = weights.reduce((a, b) => a + b, 0);
  const mapV = x => { let rem = x; for (const [a, b] of voiced) { if (rem <= b - a) return a + rem; rem -= b - a; } return duration; };
  const out = []; let c = 0;
  toks.forEach((w, i) => { const a = mapV((c / wTotal) * vTotal); c += weights[i]; const b = mapV((c / wTotal) * vTotal); out.push({ text: w, t0: a, t1: Math.max(a + .08, b) }); });
  return out;
}

/* ---------- SRT in/out ---------- */
function parseSRT(txt) {
  const words = [];
  const toSec = s => { const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0; };
  for (const block of txt.replace(/\r/g, '').split(/\n\n+/)) {
    const lines = block.split('\n'); const ti = lines.findIndex(l => l.includes('-->')); if (ti < 0) continue;
    const [a, b] = lines[ti].split('-->').map(toSec); const text = lines.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    const ws = text.split(/\s+/).filter(Boolean), tot = ws.reduce((s, w) => s + w.length + 1, 0); let c = 0;
    for (const w of ws) { const t0 = a + (c / tot) * (b - a); c += w.length + 1; words.push({ text: w, t0, t1: a + (c / tot) * (b - a) }); }
  }
  return words;
}
function buildSRT(P) {
  const groups = captionGroups(timelineWords(P), Math.max(3, P.captions.words + 2));
  const f = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
  return groups.map((g, i) => `${i + 1}\n${f(g.t0)} --> ${f(g.t1)}\n${g.words.map(w => w.text).join(' ')}\n`).join('\n');
}

/* ---------- footage thumbnails per scene ---------- */
const THUMBS = new Map();
async function seekTo(video, t) {
  if (Math.abs(video.currentTime - t) < .001 && video.readyState >= 2) return;
  await new Promise(res => { const on = () => { video.removeEventListener('seeked', on); res(); }; video.addEventListener('seeked', on); video.currentTime = t; });
}
async function captureThumbs(P, scenes) {
  const v = S.video; if (!v) return;
  const was = v.currentTime;
  for (const s of scenes) {
    if (s.kind !== 'clip' || THUMBS.has(s.id)) continue;
    await seekTo(v, Math.min(v.duration - .05, s.src.in + Math.min(1, (s.src.out - s.src.in) / 2)));
    const c = document.createElement('canvas'); const w = 320, h = Math.round(w * v.videoHeight / v.videoWidth) || 180;
    c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h);
    THUMBS.set(s.id, c);
  }
  await seekTo(v, was);
}

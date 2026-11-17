/* ============ EXPORT: frame-accurate MP4 via WebCodecs + mp4-muxer ============ */
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* waits until the user comes back to the app (iPhone pauses pages in the background) */
function whenVisible(signal) {
  if (!document.hidden) return Promise.resolve();
  return new Promise((res, rej) => { const on = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', on); setTimeout(res, 250); } };
    document.addEventListener('visibilitychange', on); signal?.addEventListener?.('abort', () => { document.removeEventListener('visibilitychange', on); rej({ code: 'cancelled' }); }, { once: true }); });
}
function exportSupported() { return 'VideoEncoder' in window && 'VideoFrame' in window && !!window.Mp4Muxer; }

async function pickVideoCodec(w, h, fps, bitrate) {
  for (const codec of ['avc1.640034', 'avc1.640033', 'avc1.640028', 'avc1.4d0028', 'avc1.42e01f']) {
    const cfg = { codec, width: w, height: h, bitrate, framerate: fps, latencyMode: 'quality' };
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return cfg; } catch (e) { }
  }
  return null;
}
function aacConfig(sr, ch) {
  const idx = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000].indexOf(sr);
  const v = (2 << 11) | ((idx < 0 ? 3 : idx) << 7) | (ch << 3); /* objectType 2 = AAC-LC */
  return new Uint8Array([v >> 8, v & 255]);
}
async function pickAudioCfg(sr, ch) {
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate: sr, numberOfChannels: ch, bitrate: 160000 };
    try { const r = await AudioEncoder.isConfigSupported(cfg); if (r.supported) return { cfg, mux }; } catch (e) { }
  }
  return null;
}

async function exportMP4(P, { quality = 1080, speed = 1, onProgress, signal }) {
  if (!exportSupported()) throw new Error('Este navegador não exporta MP4. Use Chrome, Edge ou Safari atualizados.');
  const [BW, BH] = ASPECTS[P.aspect];
  const scale = quality >= 1080 ? 1 : quality / Math.min(BW, BH);
  const W = Math.round(BW * scale / 2) * 2, H = Math.round(BH * scale / 2) * 2, fps = P.fps || 30;
  const total = projectDuration(P), nFrames = Math.max(1, Math.ceil(total * fps));
  const bitrate = Math.round(W * H * fps * 0.11);

  onProgress({ stage: 'Preparando o áudio', k: 0 });
  let mix = null, aCfg = null;
  try { mix = await renderMix(P, 48000); aCfg = 'AudioEncoder' in window ? await pickAudioCfg(48000, 2) : null; } catch (e) { console.warn('audio mix', e); }
  if (signal?.aborted) throw { code: 'cancelled' };

  const vCfg = await pickVideoCodec(W, H, fps, bitrate);
  if (!vCfg) throw new Error('O codificador H.264 deste navegador não aceita esse tamanho. Tente 720p.');
  const target = new Mp4Muxer.ArrayBufferTarget();
  const muxer = new Mp4Muxer.Muxer({
    target, fastStart: 'in-memory', firstTimestampBehavior: 'offset',
    video: { codec: 'avc', width: W, height: H, frameRate: fps },
    ...(aCfg && mix ? { audio: { codec: aCfg.mux, sampleRate: 48000, numberOfChannels: 2 } } : {}),
  });
  let encErr = null, lastOut = -1, venc = null, recovered = 0;
  /* the encoder can be lost when the iPhone puts the page in the background; we rebuild it and continue from the last frame it delivered */
  const makeEnc = () => { const e = new VideoEncoder({ output: (c, m) => { lastOut = Math.max(lastOut, Math.round(c.timestamp / (1e6 / fps))); muxer.addVideoChunk(c, m); }, error: err => (encErr = err) }); e.configure(vCfg); return e; };
  venc = makeEnc();
  const healthy = () => !encErr && venc.state === 'configured';

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { alpha: false }); ctx.setTransform(W / BW, 0, 0, H / BH, 0, 0);
  const frameDur = 1e6 / fps; let fi = 0;
  let forceKey = false;
  const emit = async (t) => {
    if (signal?.aborted) throw { code: 'cancelled' };
    if (document.hidden) { onProgress({ stage: 'Pausado: volte para o Muvi para continuar', k: fi / nFrames }); await whenVisible(signal); }
    if (!healthy()) {
      if (recovered++ > 4) throw encErr || new Error('O codificador parou. Tente exportar de novo.');
      try { if (venc.state !== 'closed') venc.close(); } catch (e) { }
      encErr = null; venc = makeEnc(); forceKey = true;
      const back = lastOut + 1; if (back < fi) fi = back;
      throw { code: 'rewind', fi };
    }
    drawFrame(ctx, P, t, { total, video: S.video });
    const f = new VideoFrame(cv, { timestamp: Math.round(fi * frameDur), duration: Math.round(frameDur) });
    venc.encode(f, { keyFrame: forceKey || fi % (fps * 2) === 0 }); forceKey = false; f.close(); fi++;
    while (venc.encodeQueueSize > 8) { await sleep(4); if (!healthy()) break; }
  };

  const v = S.video;
  if (v) { v.pause(); v.muted = true; }
  const t0 = performance.now();
  const report = (stage) => { const k = fi / nFrames, el = (performance.now() - t0) / 1000; onProgress({ stage, k, eta: k > .02 ? el / k - el : null }); };

  const starts = []; { let a = 0; for (const s of P.scenes) { starts.push(a); a += sceneDur(P, s); } }
  const sceneAt = t => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= t + 1e-6) i++; return i; };
  const runAll = async () => { let si = sceneAt(fi / fps);
  while (si < P.scenes.length) {
    const s = P.scenes[si], acc = starts[si], end = acc + sceneDur(P, s);
    try {
      if (s.kind === 'clip' && v) {
        let segAcc = acc;
        for (const [x, y] of keptSegs(P, s)) {
          const segStart = segAcc, segEnd = segAcc + (y - x); segAcc = segEnd;
          if (fi / fps >= segEnd - 1e-6) continue;                     /* already recorded (after a resume) */
          const from = x + Math.max(0, fi / fps - segStart);
          await seekTo(v, from);
          if ('requestVideoFrameCallback' in v) {
            v.playbackRate = speed;
            await new Promise((res, rej) => {
              let done = false;
              const wake = () => { if (!document.hidden && !done && v.paused) v.play().catch(() => { }); };
              document.addEventListener('visibilitychange', wake);
              const out = fn => (...a) => { document.removeEventListener('visibilitychange', wake); fn(...a); };
              res = out(res); rej = out(rej);
              const finish = async () => { if (done) return; done = true; v.pause(); try { while (fi / fps < segEnd - 1e-6) await emit(fi / fps); res(); } catch (e) { rej(e); } };
              const onFrame = async (_, meta) => {
                if (done) return;
                const tl = segStart + (meta.mediaTime - x);
                try { while (fi / fps <= tl + .5 / fps && fi / fps < segEnd - 1e-6) await emit(fi / fps); } catch (e) { done = true; v.pause(); return rej(e); }
                report('Gravando o vídeo');
                if (meta.mediaTime >= y - .5 / fps || v.ended) return finish();
                v.requestVideoFrameCallback(onFrame);
              };
              v.requestVideoFrameCallback(onFrame);
              v.onended = finish;
              v.play().catch(e => { if (document.hidden) return; done = true; rej(e); });
            });
            v.playbackRate = 1;
          } else {
            while (fi / fps < segEnd - 1e-6) { await seekTo(v, x + (fi / fps - segStart)); await emit(fi / fps); report('Gravando o vídeo'); }
          }
        }
      } else {
        while (fi / fps < end - 1e-6) { await emit(fi / fps); if (fi % 15 === 0) { report('Renderizando as cenas'); await sleep(0); } }
      }
    } catch (e) {
      if (e?.code !== 'rewind') throw e;
      report('Retomando de onde parou'); si = sceneAt(fi / fps); continue;   /* encoder was rebuilt: continue from the last good frame */
    }
    si++;
  }
  };
  await runAll();
  if (v) { v.muted = false; v.onended = null; }

  onProgress({ stage: 'Finalizando o vídeo', k: 1 });
  /* flush; if the encoder was lost meanwhile (app in background), rebuild it and redo only the missing tail */
  for (let tries = 0; ; tries++) {
    await whenVisible(signal);
    try { await venc.flush(); } catch (e) { encErr = encErr || e; }
    if (healthy() && lastOut >= fi - 1) break;
    if (tries > 3) throw encErr || new Error('O codificador parou. Tente exportar de novo.');
    try { if (venc.state !== 'closed') venc.close(); } catch (e) { }
    encErr = null; venc = makeEnc(); forceKey = true; fi = lastOut + 1;
    if (v) v.muted = true;
    await runAll();
    if (v) v.muted = false;
  }
  venc.close();

  if (aCfg && mix) {
    await whenVisible(signal);
    onProgress({ stage: 'Codificando o áudio', k: 1 });
    /* Safari (iOS 26 / macOS 26) hands back a wrong AAC config, which leaves the MP4 silent on iPhone, TikTok and Instagram.
       We always write the correct AudioSpecificConfig ourselves (AAC-LC, 48 kHz, 2 ch). */
    const asc = aCfg.mux === 'aac' ? aacConfig(48000, 2) : null;
    let firstA = true;
    const aenc = new AudioEncoder({ output: (c, m) => { if (asc && firstA) m = { ...(m || {}), decoderConfig: { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, ...(m?.decoderConfig || {}), description: asc } }; firstA = false; muxer.addAudioChunk(c, m); }, error: e => (encErr = e) });
    aenc.configure(aCfg.cfg);
    const L = mix.getChannelData(0), R = mix.getChannelData(1), CH = 4096;
    for (let off = 0; off < mix.length; off += CH) {
      const n = Math.min(CH, mix.length - off), data = new Float32Array(n * 2);
      data.set(L.subarray(off, off + n), 0); data.set(R.subarray(off, off + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(off / 48000 * 1e6), data });
      aenc.encode(ad); ad.close();
      if (aenc.encodeQueueSize > 20) await sleep(2);
    }
    await aenc.flush(); aenc.close();
  }
  if (encErr) throw encErr;
  muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}

async function saveFile(filename, data, mime) {
  if (S.downloads) {
    try { await S.downloads.save({ filename, data }); return 'saved'; }
    catch (e) { if (e?.code === 'declined') return 'declined'; if (e?.code !== 'unavailable') throw e; }
  }
  /* outside a viewer: plain download link */
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); a.remove();
  return 'saved';
}

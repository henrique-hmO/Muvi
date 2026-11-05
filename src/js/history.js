/* ============ HISTORY: every video saved to the person's account, AI voice kept so it is never paid twice ============ */
const HIST = { list: [], loaded: false, busy: new Set() };
const CHUNK = 200000;
const userColl = () => NV.db.collection(`data/users/${NV.uid}`);
const userDoc = id => NV.db.doc(`data/users/${NV.uid}/${id}`);

async function putChunks(base, str) {
  const n = Math.max(1, Math.ceil(str.length / CHUNK));
  for (let i = 0; i < n; i++) await NV.db.doc(`${base}/parts/p${i}`).set({ s: str.slice(i * CHUNK, (i + 1) * CHUNK) });
  return n;
}
async function getChunks(base, n) {
  const out = await Promise.all(Array.from({ length: n }, (_, i) => NV.db.doc(`${base}/parts/p${i}`).get().then(s => s.exists ? s.data().s : null)));
  if (out.some(x => x == null)) throw { code: 'missing' };
  return out.join('');
}
async function dropChunks(base, n) { for (let i = 0; i < n; i++) try { await NV.db.doc(`${base}/parts/p${i}`).delete(); } catch (e) { } }

/* ---------- voice: compress once (AAC/Opus in MP4), keep in the artifact's storage ---------- */
async function encodeVoice(buf) {
  if (!('AudioEncoder' in window) || !window.Mp4Muxer) throw { code: 'no_encoder' };
  const sr = 48000, oc = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * sr)), sr);
  const src = oc.createBufferSource(); src.buffer = buf; src.connect(oc.destination); src.start(); const r = await oc.startRendering();
  let pick = null;
  for (const [codec, mux] of [['mp4a.40.2', 'aac'], ['opus', 'opus']]) { const cfg = { codec, sampleRate: sr, numberOfChannels: 1, bitrate: 64000 }; try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) { pick = { cfg, mux }; break; } } catch (e) { } }
  if (!pick) throw { code: 'no_encoder' };
  const target = new Mp4Muxer.ArrayBufferTarget();
  const muxer = new Mp4Muxer.Muxer({ target, fastStart: 'in-memory', firstTimestampBehavior: 'offset', audio: { codec: pick.mux, sampleRate: sr, numberOfChannels: 1 } });
  let err = null; const enc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => (err = e) }); enc.configure(pick.cfg);
  const d = r.getChannelData(0), F = 9600;
  for (let i = 0; i < d.length; i += F) {
    const len = Math.min(F, d.length - i); const ad = new AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: len, numberOfChannels: 1, timestamp: Math.round(i / sr * 1e6), data: d.slice(i, i + len) });
    enc.encode(ad); ad.close(); if (err) throw err; if (enc.encodeQueueSize > 20) await sleep(2);
  }
  await enc.flush(); enc.close(); muxer.finalize();
  return new Blob([target.buffer], { type: 'video/mp4' });
}
const blobB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
async function storeVoice(P) {
  const N = P.narration; if (!N?.buffer || N.store || HIST.busy.has(N)) return;
  HIST.busy.add(N);
  try {
    await nvInit(); const blob = await encodeVoice(N.buffer); let ref = null;
    const assets = await window.claude?.use?.('assets');
    if (assets) { try { const r = await assets.upload(blob, { type: 'video/mp4' }); ref = { asset: r.id }; } catch (e) { console.warn('voice asset', e); } }
    if (!ref && NV.db) { const key = 'vz_' + uid(), b = await blobB64(blob); const n = await putChunks(`data/users/${NV.uid}/${key}`, b); await userDoc(key).set({ kind: 'voice', n, at: Date.now() }); ref = { key, n }; }
    if (!ref || P.narration !== N) return;
    const old = P.voiceStore; N.store = ref; P.voiceStore = ref;
    if (old && JSON.stringify(old) !== JSON.stringify(ref)) dropVoice(old);
    if (S.project === P) saveDraft();
  } catch (e) { console.warn('storeVoice', e); }
  finally { HIST.busy.delete(N); }
}
async function loadVoice(ref) {
  let ab;
  if (ref.asset) { const r = await fetch('/_blob/' + ref.asset); if (!r.ok) throw { code: 'missing' }; ab = await r.arrayBuffer(); }
  else { await nvInit(); if (!NV.db) throw { code: 'no_db' }; const b = await getChunks(`data/users/${NV.uid}/${ref.key}`, ref.n); ab = b64ToBuf(b); }
  return audioCtx().decodeAudioData(ab);
}
async function dropVoice(ref) {
  try {
    if (ref.asset) { const a = await window.claude?.use?.('assets'); await a?.delete(ref.asset); }
    else if (ref.key && NV.db) { await dropChunks(`data/users/${NV.uid}/${ref.key}`, ref.n); await userDoc(ref.key).delete(); }
  } catch (e) { console.warn('dropVoice', e); }
}
async function restoreVoice(P) {
  const N = P.narration; if (!N?.store || N.buffer) return;
  try { N.buffer = await loadVoice(N.store); if (S.project === P) { markDirty(); if (S.view === 'studio' && TAB === 'audio') renderPane(); toast('Voz restaurada, sem gerar de novo'); } }
  catch (e) { console.warn(e); if (P.narration === N) { P.narration = null; if (S.project === P) { afterChange(); toast('Não achei a voz salva deste vídeo. Gere de novo em Áudio.'); } } }
}

/* ---------- history entries ---------- */
let HIST_T = null;
function histQueue(P) {
  if (!P || P.mode === 'footage') return;
  if (P.narration?.buffer && !P.narration.store) storeVoice(P);
  clearTimeout(HIST_T); HIST_T = setTimeout(() => histSave(P), 2500);
}
async function histSave(P) {
  await nvInit(); if (!NV.db) return;
  const id = 'h_' + P.id, meta = { kind: 'hist', id: P.id, title: P.title, mode: P.mode, aspect: P.aspect, saved: Date.now(), dur: +projectDuration(P).toFixed(1), scenes: P.scenes.length, voice: !!P.narration?.store, series: P.series ? { id: P.series.id, n: P.series.n } : null };
  try {
    if (!P.series) meta.parts = await putChunks(`data/users/${NV.uid}/${id}`, snapshot(P));
    await userDoc(id).set(meta);
    const i = HIST.list.findIndex(x => x.id === P.id); if (i >= 0) HIST.list[i] = meta; else HIST.list.unshift(meta);
  } catch (e) { console.warn('histSave', e); }
}
async function histLoadAll() {
  await nvInit();
  if (NV.db) { try { const s = await userColl().where('kind', '==', 'hist').get(); HIST.list = s.docs.map(d => d.data()).filter(Boolean); } catch (e) { console.warn(e); } }
  HIST.loaded = true; return HIST.list;
}
const MODE_NAMES = { explainer: 'Explicativo', story: 'Narração com imagem', footage: 'Meu vídeo' };
function renderHistory() {
  const local = loadDrafts().filter(d => d.data && !HIST.list.find(h => h.id === d.id)).map(d => ({ ...d, local: true }));
  const all = [...HIST.list.map(h => ({ ...h })), ...local].sort((a, b) => (b.saved || 0) - (a.saved || 0));
  $('#recent').hidden = !all.length;
  $('#recentLabel').textContent = NV.db ? 'Histórico · salvo na sua conta' : 'Rascunhos neste navegador';
  $('#recentList').innerHTML = all.map(d => `<div class="recent-item" data-id="${esc(d.id)}" role="button" tabindex="0"><strong>${esc(d.title)}</strong>
    <small>${d.series ? `Novela · Ep ${d.series.n}` : esc(MODE_NAMES[d.mode] || '')} · ${d.aspect} · ${fmtDur(d.dur)} · ${new Date(d.saved).toLocaleDateString('pt-BR')}</small>
    <span class="recent-tags">${d.voice ? '<span class="pill">voz salva</span>' : ''}${d.local ? '<span class="pill">só neste navegador</span>' : ''}<button type="button" class="btn sm ghost danger" data-del="${esc(d.id)}" aria-label="Apagar do histórico">Apagar</button></span></div>`).join('');
}
async function openHistory(id) {
  const h = HIST.list.find(x => x.id === id);
  if (h?.series) { if (!NV.loaded) await nvLoadAll(); return openEpisode(h.series.id, h.series.n); }
  let P = null;
  if (h?.parts) { try { P = JSON.parse(await getChunks(`data/users/${NV.uid}/h_${id}`, h.parts)); } catch (e) { console.warn(e); } }
  if (!P) { const d = loadDrafts().find(x => x.id === id); if (d?.data) P = JSON.parse(d.data); }
  if (!P) return toast('Não consegui abrir esse vídeo');
  P.music.buffer = null; if (P.music.kind === 'upload') P.music.kind = 'pulse'; P.source = null; P.manualCuts ??= [];
  openProject(P, 'board');
}
async function deleteHistory(id, btn) {
  if (btn.dataset.sure !== '1') { btn.dataset.sure = '1'; btn.textContent = 'Confirmar'; setTimeout(() => { btn.dataset.sure = ''; btn.textContent = 'Apagar'; }, 3000); return; }
  const h = HIST.list.find(x => x.id === id);
  try {
    if (h && NV.db) {
      if (h.parts) { try { const P = JSON.parse(await getChunks(`data/users/${NV.uid}/h_${id}`, h.parts)); if (P.narration?.store) await dropVoice(P.narration.store); } catch (e) { } await dropChunks(`data/users/${NV.uid}/h_${id}`, h.parts); }
      await userDoc('h_' + id).delete();
    }
    HIST.list = HIST.list.filter(x => x.id !== id);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(loadDrafts().filter(d => d.id !== id))); } catch (e) { }
    renderHistory(); toast(h?.series ? 'Removido do histórico (o episódio continua na novela)' : 'Vídeo apagado do histórico');
  } catch (e) { toast('Não deu para apagar agora'); }
}
function initHistory() {
  $('#recentList').onclick = e => { const del = e.target.closest('[data-del]'); if (del) { e.stopPropagation(); return deleteHistory(del.dataset.del, del); } const it = e.target.closest('[data-id]'); if (it) openHistory(it.dataset.id); };
  $('#recentList').onkeydown = e => { if (e.key === 'Enter' && e.target.matches('[data-id]')) openHistory(e.target.dataset.id); };
  renderHistory(); histLoadAll().then(renderHistory);
}

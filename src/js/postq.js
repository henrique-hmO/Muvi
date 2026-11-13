/* ============ POSTAR: botão "Postar no TikTok" + exportar vários de uma vez (fila de postagem) ============ */
function postCaption(P) {
  const X = P?.post; if (!X) return '';
  return `${X.caption || ''}\n\n${fixTags(X.hashtags).map(h => '#' + h).join(' ')}`.trim();
}
/* synchronous copy keeps the tap "fresh" so the share sheet can still open afterwards (iPhone rule) */
function copySync(text) {
  if (!text) return false; let ok = false;
  try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'; document.body.append(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length); ok = document.execCommand('copy'); ta.remove(); } catch (e) { }
  try { navigator.clipboard?.writeText(text).catch(() => { }); ok = true; } catch (e) { }
  return ok;
}
/* one tap: copy caption + hashtags, then open the iPhone/Android share sheet with the video (pick TikTok) */
async function postToTikTok(blob, P, title) {
  const cap = postCaption(P), copied = copySync(cap), name = `${slug(title || P?.title || 'video')}.mp4`;
  let file = null; try { file = new File([blob], name, { type: 'video/mp4' }); } catch (e) { }
  if (file && navigator.canShare && navigator.share) {
    let can = false; try { can = navigator.canShare({ files: [file] }); } catch (e) { }
    if (can) {
      try { await navigator.share({ files: [file] }); toast(copied && cap ? 'Legenda copiada: no TikTok é só colar' : 'Escolha o TikTok'); return 'shared'; }
      catch (e) { if (e?.name === 'AbortError') return 'cancel'; console.warn('share', e); }
    }
  }
  const r = await saveFile(name, blob);
  if (r === 'saved') toast(cap ? (copied ? 'Vídeo salvo e legenda copiada. Abra o TikTok e cole.' : 'Vídeo salvo. Copie a legenda no pacote de publicação.') : 'Vídeo salvo');
  return r;
}

/* ---------- button inside the normal export window ---------- */
const _openExport = openExport;
openExport = function () {
  _openExport();
  const go = $('#exGo'); if (!go) return; const P = S.project;
  const btn = document.createElement('button'); btn.className = 'btn'; btn.id = 'exTik'; btn.textContent = '📲 Postar no TikTok'; btn.hidden = true; go.before(btn);
  const obs = new MutationObserver(() => { btn.hidden = !/Salvar MP4/.test(go.textContent); }); obs.observe(go, { childList: true, characterData: true, subtree: true });
  window.__lastExport = null;
  btn.onclick = () => { const b = window.__lastExport; if (b) postToTikTok(b, P); };
};
const _exportMP4 = exportMP4;
exportMP4 = async function (P, o) { const b = await _exportMP4(P, o); window.__lastExport = b; return b; };

/* ---------- batch export → posting queue ---------- */
const POSTQ = { items: [], busy: false };
async function loadHistoryP(id) {
  const h = HIST.list.find(x => x.id === id);
  if (h?.series) { if (!NV.loaded) await nvLoadAll(); const nv = nvOf(h.series.id); const P = nv && await nvLoadEpisode(nv, h.series.n); if (P) { P.music.buffer = null; if (P.music.kind === 'upload') P.music.kind = 'pulse'; P.source = null; } return prepP(P); }
  let P = null;
  if (h?.parts) { try { P = JSON.parse(await getChunks(`data/users/${NV.uid}/h_${id}`, h.parts)); } catch (e) { console.warn(e); } }
  if (!P) { const d = loadDrafts().find(x => x.id === id); if (d?.data) P = JSON.parse(d.data); }
  if (P) { P.music.buffer = null; if (P.music.kind === 'upload') P.music.kind = 'pulse'; P.source = null; }
  return prepP(P);
}
/* same defaults openProject applies, without touching the open editor */
function prepP(P) {
  if (!P) return P; P.manualCuts ??= []; P.pauseCut ??= false; P.pauseMin ??= .6; P.voice ??= { preview: true };
  if (P.mode === 'story') P.cast = normCast(P.cast, !P.series); return P;
}
function postqRows() {
  if (!POSTQ.items.length) return '<p class="muted" style="margin:0">Nada na fila ainda.</p>';
  return POSTQ.items.map((it, i) => `<div class="post-row" style="gap:8px;align-items:center"><span style="min-width:0;overflow-wrap:anywhere"><b>${esc(it.title)}</b><br><small class="muted">${it.status}</small></span>
    <span style="display:flex;gap:6px;flex-shrink:0">${it.blob ? `<button class="btn sm primary" data-pq="post" data-i="${i}">📲 Postar</button><button class="btn sm ghost" data-pq="save" data-i="${i}">Salvar</button>` : ''}</span></div>`).join('');
}
function openPostQueue() {
  const local = loadDrafts().filter(d => d.data && !HIST.list.find(h => h.id === d.id));
  const all = [...HIST.list, ...local].filter(h => h.title && h.mode !== 'footage').sort((a, b) => (b.saved || 0) - (a.saved || 0)).slice(0, 30);
  const ov = modal(`<h3>Exportar vários e postar</h3>
    <p class="muted" style="margin:0;font-size:13px">Marque os vídeos. O Muvi exporta um atrás do outro sozinho e monta a fila. Depois é só tocar em <b>Postar</b> em cada um: a legenda com as hashtags já vai copiada e o TikTok abre com o vídeo. Deixe esta tela aberta enquanto exporta.</p>
    <div id="pqPick" style="display:grid;gap:6px;max-height:34vh;overflow:auto">${all.length ? all.map(h => `<label class="toggle" style="justify-content:flex-start;gap:10px"><input type="checkbox" value="${esc(h.id)}"><span style="min-width:0;overflow-wrap:anywhere">${esc(h.title)} <small class="muted">· ${fmtDur(h.dur)}${h.voice ? ' · voz salva' : ''}</small></span></label>`).join('') : '<p class="muted">Nenhum vídeo salvo no histórico ainda.</p>'}</div>
    <div class="field"><span>Qualidade</span><div class="chips" id="pqQ"><button class="chip" data-v="1080" aria-pressed="true">1080p</button><button class="chip" data-v="720" aria-pressed="false">720p (mais rápido)</button></div></div>
    <div id="pqProg" hidden style="display:grid;gap:6px"><div class="bar"><i id="pqBar"></i></div><div class="mono muted" id="pqStage" style="font-size:12px"></div></div>
    <div id="pqList" style="display:grid;gap:8px">${postqRows()}</div>
    <div class="modal-foot"><button class="btn ghost" data-x>Fechar</button><button class="btn primary" id="pqGo">Exportar selecionados</button></div>`);
  let quality = 1080;
  ov.querySelector('#pqQ').onclick = e => { const b = e.target.closest('button'); if (!b) return; quality = +b.dataset.v; ov.querySelectorAll('#pqQ button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  ov.querySelector('#pqList').onclick = e => { const b = e.target.closest('[data-pq]'); if (!b) return; const it = POSTQ.items[+b.dataset.i]; if (!it?.blob) return;
    if (b.dataset.pq === 'post') { postToTikTok(it.blob, it.P, it.title); it.status = 'enviado para postar'; } else saveFile(`${slug(it.title)}.mp4`, it.blob).then(r => r === 'saved' && toast('Vídeo salvo'));
  };
  ov.querySelector('#pqGo').onclick = async () => {
    if (POSTQ.busy) return; const ids = [...ov.querySelectorAll('#pqPick input:checked')].map(x => x.value); if (!ids.length) return toast('Marque pelo menos um vídeo');
    if (!exportSupported()) return toast('Este navegador não exporta MP4. Use Safari ou Chrome atualizados.');
    POSTQ.busy = true; const go = ov.querySelector('#pqGo'); go.disabled = true; ov.querySelector('#pqProg').hidden = false;
    let wake = null; try { wake = await navigator.wakeLock?.request('screen'); } catch (e) { }
    const prev = S.project;
    for (let n = 0; n < ids.length; n++) {
      const h = all.find(x => x.id === ids[n]); const item = { id: ids[n], title: h?.title || 'Vídeo', status: 'na fila', blob: null, P: null }; POSTQ.items.unshift(item); ov.querySelector('#pqList').innerHTML = postqRows();
      try {
        item.status = 'abrindo…'; const P = await loadHistoryP(ids[n]); if (!P) throw new Error('não consegui abrir');
        if (P.narration?.store && !P.narration.buffer) { try { P.narration.buffer = await loadVoice(P.narration.store); } catch (e) { P.narration = null; } }
        if (P.mode === 'footage') throw new Error('vídeo próprio: exporte pelo editor');
        await fontsReady(); item.P = P;
        item.blob = await exportMP4(P, { quality, speed: 1, onProgress: ({ stage, k }) => { ov.querySelector('#pqBar').style.width = `${(((n + k) / ids.length) * 100).toFixed(1)}%`; ov.querySelector('#pqStage').textContent = `${n + 1}/${ids.length} · ${item.title.slice(0, 40)} · ${stage} ${Math.round(k * 100)}%`; } });
        item.status = `pronto · ${(item.blob.size / 1048576).toFixed(1)} MB${P.post ? ' · legenda pronta' : ' · sem legenda (gere no editor)'}`;
      } catch (e) { item.status = `falhou: ${e?.message || e}`; console.warn(e); }
      ov.querySelector('#pqList').innerHTML = postqRows();
    }
    S.project = prev; wake?.release?.(); POSTQ.busy = false; go.disabled = false; ov.querySelector('#pqStage').textContent = 'Tudo pronto. Toque em Postar em cada um.'; toast('Fila de postagem pronta');
  };
}
/* entry button on the home screen, next to the history */
function addPostQueueButton() {
  const lab = $('#recentLabel'); if (!lab || $('#pqOpen')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.id = 'pqOpen'; b.textContent = '📲 Exportar vários e postar'; b.style.marginLeft = '8px';
  b.onclick = openPostQueue; lab.after(b);
}
const _renderHistory = renderHistory;
renderHistory = function () { _renderHistory(); addPostQueueButton(); };

/* ---------- "Postar no TikTok" inside the Publicar tab ---------- */
const TIK = { id: null, blob: null, busy: false, ctl: null };
exportMP4 = (f => async function (P, o) { const b = await f(P, o); if (P === S.project) { TIK.id = P.id; TIK.blob = b; } return b; })(exportMP4);
function tikBlockHTML(P) {
  const ready = TIK.id === P.id && TIK.blob;
  return `<div class="post-block" id="tikBox" style="margin-bottom:10px"><button class="btn primary" type="button" data-post="tik" style="width:100%">${TIK.busy ? 'Exportando… toque para cancelar' : ready ? '📲 Postar no TikTok' : '📲 Exportar e postar no TikTok'}</button>
    <small class="muted" id="tikMsg" style="display:block;margin-top:6px;font-size:12px">${ready ? 'Toque: a legenda e as 5 hashtags vão copiadas e o TikTok abre com o vídeo. Lá é só colar.' : 'Exporta o vídeo e depois você toca de novo para enviar ao TikTok.'}${P.post ? '' : ' Gere o pacote abaixo para ir com legenda e hashtags.'}</small></div>`;
}
postHTML = (f => function (P) { return P.mode === 'footage' ? f(P) : tikBlockHTML(P) + f(P); })(postHTML);
function tikRefresh() { const box = $('#tikBox'); if (box && S.project) box.outerHTML = tikBlockHTML(S.project); }
onPostClick = (f => async function (e) {
  const b = e.target.closest('[data-post]'); if (b?.dataset.post !== 'tik') return f(e);
  const P = S.project; if (!P) return;
  if (TIK.busy) { TIK.ctl?.abort(); return; }
  if (TIK.id === P.id && TIK.blob) return postToTikTok(TIK.blob, P);
  if (!exportSupported()) return toast('Este navegador não exporta MP4. Use Safari ou Chrome atualizados.');
  if (P.narration?.store && !P.narration.buffer) { try { P.narration.buffer = await loadVoice(P.narration.store); } catch (err) { } }
  TIK.busy = true; TIK.ctl = new AbortController(); tikRefresh();
  let wake = null; try { wake = await navigator.wakeLock?.request('screen'); } catch (err) { }
  try {
    await fontsReady();
    await exportMP4(P, { quality: 1080, speed: 1, signal: TIK.ctl.signal, onProgress: ({ stage, k }) => { const m = $('#tikMsg'); if (m) m.textContent = `${stage} ${Math.round(k * 100)}%`; } });
    TIK.busy = false; tikRefresh(); toast('Vídeo pronto. Toque em Postar no TikTok');
  } catch (err) { TIK.busy = false; tikRefresh(); if (err?.code !== 'cancelled') toast('Não deu para exportar: ' + (err?.message || err)); }
  wake?.release?.();
})(onPostClick);
/* any edit makes the exported file stale */
afterChange = (f => function (...a) { if (TAB !== 'post' && S.project && TIK.id === S.project.id && !TIK.busy) { TIK.id = null; TIK.blob = null; } return f(...a); })(afterChange);

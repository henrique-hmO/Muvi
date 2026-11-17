/* ============ Segundo plano: o iPhone pausa páginas quando você sai do app. O Muvi salva na hora, pausa com segurança e continua sozinho quando você volta ============ */
const KEEP = { n: 0, lock: null, hiddenAt: 0 };
async function keepAwake() { if (KEEP.lock || document.hidden || !KEEP.n) return; try { KEEP.lock = await navigator.wakeLock?.request('screen'); KEEP.lock?.addEventListener?.('release', () => { KEEP.lock = null; }); } catch (e) { KEEP.lock = null; } }
function busyStart() { KEEP.n++; keepAwake(); }
function busyEnd() { KEEP.n = Math.max(0, KEEP.n - 1); if (!KEEP.n) { try { KEEP.lock?.release(); } catch (e) { } KEEP.lock = null; } }

/* salvar na hora em que a pessoa sai (o salvamento normal espera 2,5 s e poderia não acontecer) */
function flushSave() {
  try { if (S.project) saveDraft(); } catch (e) { }
  try { if (typeof HIST_T !== 'undefined' && S.project && !S.project.series) { clearTimeout(HIST_T); histSave(S.project); } } catch (e) { }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { KEEP.hiddenAt = Date.now(); flushSave(); return; }
  keepAwake();
  if (KEEP.n && Date.now() - KEEP.hiddenAt > 1500) toast('Você voltou. Continuando de onde parou…');
});
addEventListener('pagehide', flushSave);

/* tarefas longas seguram a tela acesa e contam como "ocupado" */
exportMP4 = (f => async function (...a) { busyStart(); try { return await f.apply(this, a); } finally { busyEnd(); } })(exportMP4);
/* IA: se a resposta se perdeu porque o app foi para o fundo, espera voltar e tenta de novo uma vez */
ask = (f => async function (prompt, opts = {}) {
  busyStart(); let wasHidden = document.hidden; const mark = () => { if (document.hidden) wasHidden = true; };
  document.addEventListener('visibilitychange', mark);
  try { return await f(prompt, opts); }
  catch (e) {
    if (!wasHidden || e?.code === 'cancelled' || ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'unavailable'].includes(e?.code)) throw e;
    await whenVisible(); return await f(prompt, opts);
  }
  finally { document.removeEventListener('visibilitychange', mark); busyEnd(); }
})(ask);

/* aviso discreto nas telas de espera */
const KEEP_NOTE = 'Pode sair rapidinho: o Muvi salva tudo, pausa e continua sozinho quando você voltar. Para não pausar, deixe esta tela aberta (a tela não apaga sozinha enquanto trabalha).';
function keepNote(where) { if (!where || where.querySelector('.keep-note')) return; const p = document.createElement('p'); p.className = 'keep-note'; p.textContent = KEEP_NOTE; where.append(p); }
openExport = (f => function (...a) { const r = f.apply(this, a); keepNote(document.querySelector('#exProg')?.parentElement); return r; })(openExport);
pipeline = (f => function (...a) { const r = f.apply(this, a); keepNote(document.querySelector('#v-process .process')); return r; })(pipeline);

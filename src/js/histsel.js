/* ============ Histórico: selecionar vários e apagar em massa + selo "Desenvolvido por Moove IA" no fim da página ============ */
const HSEL = { on: false, ids: new Set(), busy: false };

/* apaga um item sem pedir confirmação (a confirmação é feita uma vez para o lote) */
async function removeHistoryItem(id) {
  const h = HIST.list.find(x => x.id === id);
  if (h && NV.db) {
    if (h.parts) { try { const P = JSON.parse(await getChunks(`data/users/${NV.uid}/h_${id}`, h.parts)); if (P.narration?.store) await dropVoice(P.narration.store); } catch (e) { } await dropChunks(`data/users/${NV.uid}/h_${id}`, h.parts); }
    await userDoc('h_' + id).delete();
  }
  HIST.list = HIST.list.filter(x => x.id !== id);
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(loadDrafts().filter(d => d.id !== id))); } catch (e) { }
}

function histSelBar() {
  let bar = $('#histSel'); const lab = $('#recentLabel'); if (!lab) return;
  if (!bar) {
    const head = document.createElement('div'); head.className = 'recent-head'; lab.before(head); head.append(lab);
    const pq = $('#pqOpen'); if (pq) head.append(pq);
    bar = document.createElement('div'); bar.id = 'histSel'; bar.className = 'hist-sel'; head.append(bar);
    bar.onclick = histSelClick;
  }
  const n = HSEL.ids.size, total = $('#recentList')?.querySelectorAll('[data-id]').length || 0;
  bar.innerHTML = HSEL.on
    ? `<span class="hist-count" aria-live="polite">${n ? `${n} selecionado${n > 1 ? 's' : ''}` : 'Toque nos vídeos'}</span>
       <button type="button" class="btn sm ghost" data-hs="all">${n === total && total ? 'Limpar seleção' : 'Selecionar tudo'}</button>
       <button type="button" class="btn sm danger" data-hs="del" ${n && !HSEL.busy ? '' : 'disabled'}>${HSEL.busy ? 'Apagando…' : `Apagar${n ? ` (${n})` : ''}`}</button>
       <button type="button" class="btn sm ghost" data-hs="off">Cancelar</button>`
    : `<button type="button" class="btn sm ghost" data-hs="on">Selecionar</button>`;
}
function histSelPaint() {
  const list = $('#recentList'); if (!list) return;
  list.classList.toggle('selecting', HSEL.on);
  list.querySelectorAll('.recent-item[data-id]').forEach(it => {
    const on = HSEL.ids.has(it.dataset.id); it.classList.toggle('picked', on); it.setAttribute('aria-pressed', HSEL.on ? String(on) : 'false');
    let ck = it.querySelector('.pick'); if (HSEL.on && !ck) { ck = document.createElement('span'); ck.className = 'pick'; ck.setAttribute('aria-hidden', 'true'); it.prepend(ck); }
    if (!HSEL.on && ck) ck.remove();
  });
  histSelBar();
}
async function histSelClick(e) {
  const b = e.target.closest('[data-hs]'); if (!b) return; const a = b.dataset.hs;
  if (a === 'on') { HSEL.on = true; HSEL.ids.clear(); }
  else if (a === 'off') { HSEL.on = false; HSEL.ids.clear(); }
  else if (a === 'all') { const ids = [...$('#recentList').querySelectorAll('[data-id]')].map(x => x.dataset.id); if (HSEL.ids.size === ids.length) HSEL.ids.clear(); else ids.forEach(id => HSEL.ids.add(id)); }
  else if (a === 'del') {
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = `Confirmar: apagar ${HSEL.ids.size}`; setTimeout(() => { if (b.isConnected) histSelBar(); }, 3500); return; }
    HSEL.busy = true; histSelBar(); const ids = [...HSEL.ids]; let ok = 0;
    for (const id of ids) { try { await removeHistoryItem(id); ok++; HSEL.ids.delete(id); } catch (err) { console.warn(err); } }
    HSEL.busy = false; HSEL.on = HSEL.ids.size > 0; renderHistory();
    toast(ok === ids.length ? `${ok} vídeo${ok > 1 ? 's' : ''} apagado${ok > 1 ? 's' : ''} do histórico` : `Apaguei ${ok} de ${ids.length}. Tente de novo os que ficaram.`);
    return;
  }
  histSelPaint();
}
/* no modo seleção, tocar no cartão marca/desmarca em vez de abrir */
document.addEventListener('click', e => {
  if (!HSEL.on) return; const it = e.target.closest('#recentList [data-id]'); if (!it) return;
  e.stopPropagation(); e.preventDefault(); const id = it.dataset.id; HSEL.ids.has(id) ? HSEL.ids.delete(id) : HSEL.ids.add(id); histSelPaint();
}, true);
document.addEventListener('keydown', e => {
  if (!HSEL.on || (e.key !== 'Enter' && e.key !== ' ')) return; const it = e.target.closest?.('#recentList [data-id]'); if (!it) return;
  e.stopPropagation(); e.preventDefault(); const id = it.dataset.id; HSEL.ids.has(id) ? HSEL.ids.delete(id) : HSEL.ids.add(id); histSelPaint();
}, true);

/* ---------- selo holográfico "Desenvolvido por Moove IA" (inclina com o dedo/mouse, brilho que gira) ---------- */
function mooveBadge() {
  if ($('#mooveBadge')) return; const after = $('#recent'); if (!after) return;
  const old = document.querySelector('#v-home .made-by'); old?.remove();
  const logo = document.querySelector('.hero-logo img')?.src || '';
  const a = document.createElement('a'); a.id = 'mooveBadge'; a.className = 'moove-badge'; a.href = 'https://moove-ia.com'; a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', 'Muvi, desenvolvido por Moove IA');
  a.innerHTML = `<span class="mb-card"><span class="mb-inner"></span>${logo ? `<img src="${logo}" alt="">` : ''}<span class="mb-txt"><small>MUVI · DESENVOLVIDO POR</small><b>Moove IA</b></span>
    <span class="mb-holo" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</span><span class="mb-shine" aria-hidden="true"></span></span>`;
  const wrap = document.createElement('div'); wrap.className = 'moove-badge-wrap'; wrap.append(a); after.after(wrap);
  const card = a.querySelector('.mb-card');
  const tilt = (cx, cy) => { const r = a.getBoundingClientRect(), px = clamp((cx - r.left) / r.width), py = clamp((cy - r.top) / r.height);
    card.style.setProperty('--rx', ((.5 - py) * 18).toFixed(2) + 'deg'); card.style.setProperty('--ry', ((px - .5) * 22).toFixed(2) + 'deg');
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); card.style.setProperty('--my', (py * 100).toFixed(1) + '%'); card.style.setProperty('--hr', ((px - .5) * 90 + (py - .5) * 60).toFixed(1) + 'deg'); a.classList.add('hover'); };
  const reset = () => { a.classList.remove('hover'); ['--rx', '--ry', '--hr'].forEach(p => card.style.setProperty(p, '0deg')); card.style.setProperty('--mx', '50%'); card.style.setProperty('--my', '50%'); };
  a.addEventListener('pointermove', e => tilt(e.clientX, e.clientY)); a.addEventListener('pointerleave', reset); a.addEventListener('pointercancel', reset);
  a.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) tilt(t.clientX, t.clientY); }, { passive: true }); a.addEventListener('touchend', () => setTimeout(reset, 250));
  reset();
}

const _renderHistorySel = renderHistory;
renderHistory = function () { _renderHistorySel(); for (const id of [...HSEL.ids]) if (!$('#recentList')?.querySelector(`[data-id="${CSS.escape(id)}"]`)) HSEL.ids.delete(id); histSelPaint(); mooveBadge(); };
mooveBadge();

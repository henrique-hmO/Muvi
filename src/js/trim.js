/* ============ Título com "corte": "vídeo pronto." dentro de um trecho da timeline com alças arrastáveis ============ */
(function () {
  const h1 = document.querySelector('.home h1'), em = h1?.querySelector('em'); if (!em || h1.querySelector('.trim')) return;
  const dot = em.nextSibling; if (dot && dot.nodeType === 3 && dot.textContent.trim() === '.') dot.remove();
  const label = em.textContent + '.';
  const T = document.createElement('span'); T.className = 'trim'; T.setAttribute('role', 'group'); T.setAttribute('aria-label', label);
  T.innerHTML = `<span class="trim-ghost" aria-hidden="true">${label}</span><span class="trim-sel" aria-hidden="true"></span><span class="trim-text" aria-hidden="true">${label}</span>
    <button type="button" class="trim-h" data-h="l" aria-label="Ajustar início"><i></i></button><button type="button" class="trim-h" data-h="r" aria-label="Ajustar fim"><i></i></button>`;
  em.replaceWith(T);
  const BASE = -2.76, MIN = 46, th = BASE * Math.PI / 180, C = Math.cos(th), Sn = Math.sin(th);
  const sel = T.querySelector('.trim-sel'), txt = T.querySelector('.trim-text'), hl = T.querySelector('[data-h="l"]'), hr = T.querySelector('[data-h="r"]');
  let W = 0, L = 0, R = 0, drag = null;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  function apply() {
    const hw = hl.offsetWidth || 22;
    sel.style.left = L + 'px'; sel.style.width = Math.max(0, R - L) + 'px';
    hl.style.left = L + 'px'; hr.style.left = (R - hw) + 'px';
    txt.style.clipPath = `inset(0 ${W - R + hw * .5}px 0 ${L + hw * .5}px round .28em)`;
    const dev = W ? ((L + R) / 2 - W / 2) / (W / 2) : 0;
    T.style.setProperty('--rot', (BASE + dev * 3).toFixed(2) + 'deg');
  }
  function measure() { const was = W; W = T.offsetWidth; if (!was || R >= was - 1) R = W; R = Math.min(R, W); L = Math.min(L, R - MIN); apply(); }
  const start = e => { const b = e.target.closest('.trim-h'); if (!b) return; e.preventDefault(); b.setPointerCapture?.(e.pointerId); drag = { h: b.dataset.h, x: e.clientX, y: e.clientY, L, R }; T.classList.add('dragging'); b.classList.add('on'); };
  const move = e => { if (!drag) return; const p = (e.clientX - drag.x) * C + (e.clientY - drag.y) * Sn;
    if (drag.h === 'l') L = clamp(drag.L + p, 0, R - MIN); else R = clamp(drag.R + p, L + MIN, W); apply(); };
  const end = () => { if (!drag) return; drag = null; T.classList.remove('dragging'); T.querySelectorAll('.trim-h.on').forEach(b => b.classList.remove('on')); };
  T.addEventListener('pointerdown', start); addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
  T.addEventListener('keydown', e => { const b = e.target.closest('.trim-h'); if (!b || !/Arrow(Left|Right)/.test(e.key)) return; e.preventDefault(); const d = e.key === 'ArrowLeft' ? -10 : 10;
    if (b.dataset.h === 'l') L = clamp(L + d, 0, R - MIN); else R = clamp(R + d, L + MIN, W); apply(); });
  T.addEventListener('dblclick', () => { L = 0; R = W; T.classList.add('ease'); apply(); setTimeout(() => T.classList.remove('ease'), 400); });
  new ResizeObserver(measure).observe(T); document.fonts?.ready.then(measure); measure();
  /* abertura: as alças começam juntas no meio e abrem, como quem corta o trecho certo do vídeo */
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const mid = W / 2; L = mid - MIN / 2; R = mid + MIN / 2; apply();
    const t0 = performance.now() + 750, dur = 1100, ease = k => 1 - Math.pow(1 - k, 4);
    const step = now => { const k = clamp((now - t0) / dur, 0, 1), e = ease(k), m = W / 2; L = (m - MIN / 2) * (1 - e); R = (m + MIN / 2) + (W - m - MIN / 2) * e; apply(); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
})();

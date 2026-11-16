/* ============ Carregando: orbe nas cores Moove com "Criando seu vídeo" letra por letra (tela de montagem) ============ */
(function () {
  const proc = document.querySelector('#v-process .process'); if (!proc || proc.querySelector('.mv-loader')) return;
  const txt = 'Criando seu vídeo';
  const box = document.createElement('div'); box.className = 'mv-loader'; box.setAttribute('role', 'status'); box.setAttribute('aria-label', txt);
  box.innerHTML = `<div class="mv-orb" aria-hidden="true"><div class="mv-ring"></div><div class="mv-letters">${[...txt].map((ch, i) => `<span style="--d:${(i * .1).toFixed(1)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</div></div>`;
  proc.prepend(box);
  /* para a animação se algum passo deu erro, e some quando tudo terminou */
  const list = document.getElementById('pipeline');
  const sync = () => { const lis = [...(list?.children || [])]; const err = lis.some(li => li.dataset.s === 'err'), done = lis.length && lis.every(li => /done|warn|skip/.test(li.dataset.s || ''));
    box.classList.toggle('err', err); box.classList.toggle('done', !err && !!done); };
  if (list) new MutationObserver(sync).observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-s'] });
})();

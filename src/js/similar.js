/* ============ "Mais assim": a partir de um vídeo do histórico que deu certo, a IA cria novas ideias do mesmo assunto e do mesmo formato ============ */
const SIM = { cache: {}, seen: {} };

function simScript(P) {
  const lines = (P.scenes || []).map(s => String(s.say || sceneLabel(s) || '').trim()).filter(Boolean);
  return lines.join(' ').replace(/\s+/g, ' ').slice(0, 2600);
}
function simPrompt(P, h, n, extra) {
  const avoid = [...new Set([...(HIST.list || []).map(x => x.title), ...(SIM.seen[h.id] || [])].filter(Boolean))].slice(0, 60);
  return `Você é roteirista de vídeos virais curtos (TikTok, Reels, Shorts) em português do Brasil.
Este vídeo do usuário DEU CERTO e ele quer mais vídeos parecidos:
- Título: "${P.title}"
- Formato: ${P.mode === 'story' ? 'narração com imagem (história narrada com personagem)' : 'explicativo animado'}, ${P.aspect}, cerca de ${Math.round(projectDuration(P))} s
- Roteiro (narração): "${simScript(P)}"
${P.post?.caption ? `- Legenda usada: "${P.post.caption}"` : ''}

1) Descubra o NICHO e o PADRÃO que fez esse vídeo funcionar: tipo de gancho (ex.: "sinais que...", "seu cérebro faz X sem você perceber", pergunta, número, revelação), estrutura (lista, história, antes/depois), promessa e emoção.
2) Crie ${n} ideias NOVAS do MESMO nicho e do MESMO formato, cada uma sobre um assunto RELACIONADO mas diferente (ex.: se o vídeo é "sinais que seu cérebro dá ao ver perigo", ideias como "o que seu cérebro faz quando você mente", "por que seu cérebro esquece nomes" etc.). ${extra || ''}
Regras para viralizar de verdade:
- Gancho de até 12 palavras que cria curiosidade ou toca na pessoa ("você", "seu"), com promessa clara; nada genérico.
- Só fatos reais e conhecidos (ciência, psicologia, comportamento, história). Nada inventado nem exagerado.
- Assuntos com apelo amplo, que fazem a pessoa assistir até o fim, comentar ou mandar para alguém.
- Varie os ângulos: mistério, alerta, "você faz isso todo dia", número/lista, curiosidade chocante.
- Não repita estes títulos: ${avoid.map(t => `"${t}"`).join(', ') || '(nenhum)'}.
Para cada ideia dê também uma nota de 0 a 10 para a força do gancho (seja exigente).
Responda só JSON: {"nicho": string, "padrao": string (1 frase: o que fez o vídeo funcionar), "ideias": [{"titulo": string, "gancho": string, "angulo": string (1 frase do que o vídeo mostra), "porque": string (por que vai prender, até 14 palavras), "nota": number}]}`;
}
function simNorm(r) {
  const ideias = (Array.isArray(r?.ideias) ? r.ideias : []).map(x => ({ titulo: String(x.titulo || '').trim(), gancho: String(x.gancho || '').trim(), angulo: String(x.angulo || '').trim(), porque: String(x.porque || '').trim(), nota: clamp(+x.nota || 0, 0, 10) })).filter(x => x.titulo);
  ideias.sort((a, b) => b.nota - a.nota);
  return { nicho: String(r?.nicho || '').trim(), padrao: String(r?.padrao || '').trim(), ideias };
}
function simBrief(P, R, it) {
  return `${it.titulo}
Gancho de abertura: "${it.gancho}"
O vídeo mostra: ${it.angulo}
Mesmo estilo do vídeo "${P.title}", que deu certo (${R.padrao || R.nicho}). Mantenha a estrutura, o ritmo e o tipo de gancho, mas com conteúdo novo. Use só fatos reais.`;
}
function simCardsHTML(R) {
  return R.ideias.map((it, i) => `<div class="sim-card">
    <div class="sim-top"><b>${esc(it.titulo)}</b><span class="sim-score" title="Força do gancho">${it.nota ? it.nota.toFixed(0) + '/10' : ''}</span></div>
    ${it.gancho ? `<p class="sim-hook">“${esc(it.gancho)}”</p>` : ''}
    ${it.angulo ? `<p class="muted sim-sub">${esc(it.angulo)}</p>` : ''}
    ${it.porque ? `<p class="sim-why">⚡ ${esc(it.porque)}</p>` : ''}
    <div class="sim-acts"><button type="button" class="btn sm primary" data-sim="go" data-i="${i}">Gerar agora</button><button type="button" class="btn sm ghost" data-sim="edit" data-i="${i}">Ajustar antes</button></div>
  </div>`).join('');
}
async function openSimilar(id) {
  const h = HIST.list.find(x => x.id === id) || loadDrafts().find(x => x.id === id);
  if (!aiAvailable()) return toast('A IA não está disponível agora para criar ideias.');
  const ov = modal(`<h3>Mais vídeos como este</h3>
    <p class="muted" style="margin:0;font-size:13px">Baseado em <b>${esc(h?.title || 'vídeo')}</b>: mesmo assunto, mesmo formato e o mesmo tipo de gancho, com temas novos.</p>
    <div id="simHead" class="sim-head"></div>
    <div id="simList" class="sim-list"><div class="sim-wait"><span class="dot-spin"></span> Lendo o que fez esse vídeo funcionar…</div></div>
    <div class="modal-foot"><button class="btn ghost" data-x>Fechar</button><button class="btn" id="simSeries" disabled>Fazer como série (Parte 2, 3…)</button><button class="btn" id="simMore" disabled>Outras ideias</button></div>`);
  let P = null, R = null;
  const head = ov.querySelector('#simHead'), list = ov.querySelector('#simList'), more = ov.querySelector('#simMore'), series = ov.querySelector('#simSeries');
  async function run(extra) {
    more.disabled = series.disabled = true; list.innerHTML = '<div class="sim-wait"><span class="dot-spin"></span> Criando ideias…</div>';
    try {
      if (!P) P = await loadHistoryP(id); if (!P) throw new Error('não consegui abrir o vídeo');
      R = simNorm(await ask(simPrompt(P, { id }, 6, extra), { effort: 'low' }));
      if (!R.ideias.length) throw new Error('a IA não devolveu ideias');
      SIM.cache[id] = R; (SIM.seen[id] ||= []).push(...R.ideias.map(x => x.titulo));
      head.innerHTML = `${R.nicho ? `<span class="pill">${esc(R.nicho)}</span>` : ''}${R.padrao ? `<p class="muted" style="margin:6px 0 0;font-size:13px"><b>O que funcionou:</b> ${esc(R.padrao)}</p>` : ''}`;
      list.innerHTML = simCardsHTML(R);
    } catch (e) { console.warn(e); list.innerHTML = `<p class="muted">Não deu para criar agora: ${esc(e?.code ? aiErr(e) : e?.message || 'erro')}. Tente de novo.</p>`; }
    more.disabled = series.disabled = false;
  }
  more.onclick = () => run('Traga ângulos diferentes dos anteriores.');
  series.onclick = () => run('Monte como SÉRIE continuando o vídeo original: títulos no formato "<tema> — Parte 2", "Parte 3"..., cada parte com um assunto novo do mesmo tema, e o gancho pode citar a parte anterior ("Na parte 1 você viu..., agora...").');
  list.onclick = e => {
    const b = e.target.closest('[data-sim]'); if (!b || !R || !P) return; const it = R.ideias[+b.dataset.i]; if (!it) return;
    ov.querySelector('[data-x]')?.click();
    simFill(P, R, it);
    if (b.dataset.sim === 'go') startExplainer(true);
    else { toast('Ideia carregada. Ajuste o texto ou as opções e toque em gerar.'); $('#brief').focus(); }
  };
  run();
}
/* abre a home já com o mesmo modo, formato, duração e clima do vídeo original */
function simFill(P, R, it) {
  show('home');
  const tab = P.mode === 'story' ? '#tab-story' : '#tab-explainer'; $(tab)?.click();
  const pick = (opt, v) => { const box = $(`[data-opt="${opt}"]`); const b = box && [...box.querySelectorAll('button')].find(x => String(x.dataset.v) === String(v)); b?.click(); };
  pick('aspect', P.aspect);
  const d = projectDuration(P), near = DUR_CHOICES.filter(([v]) => v).reduce((a, b) => Math.abs(b[0] - d) < Math.abs(a[0] - d) ? b : a);
  pick('seconds', near[0]);
  if (P.cineDark != null) pick('clima', P.cineDark ? 'escuro' : 'claro');
  $('#brief').value = simBrief(P, R, it);
}

/* botão "✨ Mais assim" em cada vídeo do histórico (menos novelas e vídeos próprios) */
function simButtons() {
  $('#recentList')?.querySelectorAll('.recent-item[data-id]').forEach(it => {
    if (it.querySelector('[data-more]')) return; const id = it.dataset.id;
    const h = HIST.list.find(x => x.id === id) || loadDrafts().find(x => x.id === id);
    if (!h || h.series || h.mode === 'footage' || h.mode === 'novela') return;
    const tags = it.querySelector('.recent-tags'); if (!tags) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm ghost sim-btn'; b.dataset.more = id; b.textContent = '✨ Mais assim'; b.setAttribute('aria-label', 'Criar mais vídeos como este');
    tags.prepend(b);
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('#recentList [data-more]'); if (!b || HSEL.on) return;
  e.stopPropagation(); e.preventDefault(); openSimilar(b.dataset.more);
}, true);
const _renderHistorySim = renderHistory;
renderHistory = function () { _renderHistorySim(); simButtons(); };
/* o histórico da nuvem chega depois que o app abre e é desenhado pela função original (sem os extras);
   observar a lista garante que "Mais assim", seleção e "Exportar vários" apareçam sempre */
(function () {
  const list = $('#recentList'); if (!list) return;
  const decorate = () => { try { addPostQueueButton(); } catch (e) { } try { histSelPaint(); } catch (e) { } try { simButtons(); } catch (e) { } try { mooveBadge(); } catch (e) { } };
  new MutationObserver(decorate).observe(list, { childList: true });
  decorate();
})();

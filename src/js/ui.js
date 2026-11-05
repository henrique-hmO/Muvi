/* ============ UI: views, player, board, studio, timeline ============ */
const OPT = { mode: 'explainer', aspect: '9:16', seconds: 60, tone: 'Didático', look: 'moove', aspectF: '9:16', capPreset: 'box', lookF: 'moove' };
const EXAMPLES = [
  'Explique em 1 minuto o que é um atendente de IA no WhatsApp e por que clínicas estão usando',
  'Os 4 passos para criar uma landing page que converte, para pequenos negócios',
  'Diferença entre automação e inteligência artificial, com exemplos do dia a dia',
  'Como funciona a coleta e o tratamento de resíduos hospitalares, em 90 segundos',
];
const DUR_CHOICES = [[15, '15 s'], [30, '30 s'], [60, '1 min'], [120, '2 min'], [300, '5 min'], [600, '10 min'], [0, 'Outra']];
const STORY_EXAMPLES = [
  'Como é ser cada cargo dentro de uma grande empresa, do estagiário ao CEO',
  'O que acontece com o seu corpo se você ficar 7 dias sem dormir',
  'Como é a vida em cada classe social no Brasil',
  'Por que 9 em cada 10 restaurantes fecham antes de completar 2 anos',
];
const TONES = ['Didático', 'Energético', 'Direto', 'Divertido', 'Sério'];

let toastTimer = null;
function toast(msg, action) {
  const el = $('#toast'); el.innerHTML = esc(msg) + (action ? ` <button class="btn sm ghost" style="margin-left:8px;color:var(--accent)">${esc(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.classList.remove('show'); };
  el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 6000 : 3200);
}
function updateAiBadge() {
  const b = $('#aiBadge'); if (!b) return;
  const s = S.aiState; b.dataset.s = s;
  b.textContent = s === 'ready' ? 'Claude conectado' : s === 'checking' ? 'Claude…' : s === 'denied' ? 'Claude bloqueado' : 'Sem Claude';
  b.title = s === 'ready' ? 'Os pedidos usam a sua conta do Claude' : 'Abra este app pelo claude.ai para usar a IA. O modo sem IA continua funcionando.';
}

/* ---------- views ---------- */
function show(view) {
  S.view = view;
  for (const v of ['home', 'process', 'board', 'studio']) $(`#v-${v}`).hidden = v !== view;
  const has = !!S.project;
  $$('#steps button').forEach(b => { const g = b.dataset.go; b.disabled = g !== 'home' && !has; b.setAttribute('aria-current', g === view ? 'page' : 'false'); });
  $('#exportBtn').hidden = !has || view === 'home' || view === 'process';
  $('#undoBtn').hidden = $('#exportBtn').hidden;
  $('#projTitle').hidden = !has || view === 'home';
  if (has) $('#projTitle').value = S.project.title;
  if (view === 'board') { mountPlayer('#boardPlayerSlot'); renderBoard(); renderChat(); renderPosts(); }
  if (view === 'studio') { mountPlayer('#studioPlayerSlot'); setupTabs(); renderPane(); fitZoom(); renderTimeline(); }
  if (view === 'home') { pause(); renderRecent(); }
  if (view !== 'board' && view !== 'studio') pause();
  window.scrollTo(0, 0); markDirty();
}

/* ---------- home ---------- */
function chipSet(sel, items, key, onPick) {
  const box = $(sel); box.innerHTML = items.map(([v, l]) => `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${String(OPT[key]) === String(v)}">${esc(l)}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; OPT[key] = v; $$('button', box).forEach(x => x.setAttribute('aria-pressed', x === b)); onPick?.(v); };
}
function swatchSet(sel, key) {
  const box = $(sel);
  box.innerHTML = Object.entries(LOOKS).map(([id, L]) => `<button type="button" class="swatch" data-v="${id}" aria-pressed="${OPT[key] === id}"><i style="background:linear-gradient(135deg,${L.bg} 0 45%,${L.a1} 45% 72%,${L.a2} 72%)"></i>${esc(L.name)}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; OPT[key] = b.dataset.v; $$('button', box).forEach(x => x.setAttribute('aria-pressed', x === b)); if (key === 'look') { DEMO.look = b.dataset.v; } };
}
function initHome() {
  chipSet('[data-opt="aspect"]', Object.keys(ASPECTS).map(a => [a, a]), 'aspect', v => { DEMO.aspect = v; sizeDemo(); });
  chipSet('[data-opt="seconds"]', DUR_CHOICES.map(([v, l]) => [v, l]), 'seconds', v => { $('#customSec').hidden = v !== 0; if (v === 0) $('#customSec').focus(); });
  chipSet('[data-opt="tone"]', TONES.map(t => [t, t]), 'tone');
  chipSet('[data-opt="aspectF"]', Object.keys(ASPECTS).map(a => [a, a]), 'aspectF');
  chipSet('[data-opt="capPreset"]', Object.entries(CAPTION_PRESETS).map(([k, v]) => [k, v.name]), 'capPreset');
  swatchSet('[data-opt="look"]', 'look'); swatchSet('[data-opt="lookF"]', 'lookF');
  $('#examples').innerHTML = EXAMPLES.map(e => `<button type="button">${esc(e)}</button>`).join('');
  $('#examples').onclick = e => { const b = e.target.closest('button'); if (b) { $('#brief').value = b.textContent; $('#brief').focus(); } };
  $$('.modes [role=tab]').forEach(tab => tab.onclick = () => {
    $$('.modes [role=tab]').forEach(t => t.setAttribute('aria-selected', t === tab));
    OPT.mode = tab.id === 'tab-footage' ? 'footage' : tab.id === 'tab-story' ? 'story' : tab.id === 'tab-novela' ? 'novela' : 'explainer';
    $('#panel-explainer').hidden = OPT.mode === 'footage' || OPT.mode === 'novela'; $('#panel-footage').hidden = OPT.mode !== 'footage'; $('#panel-novela').hidden = OPT.mode !== 'novela';
    if (OPT.mode === 'novela') { renderNovelas(); return; }
    const story = OPT.mode === 'story';
    $('#briefLabel').textContent = story ? 'Qual é o tema da história?' : 'O que o vídeo deve explicar?';
    $('#brief').placeholder = story ? 'Ex.: Como é ser cada cargo dentro de um restaurante, do lavador de pratos ao dono. Mostre quanto cada um ganha e o preço de cada degrau.' : 'Ex.: Explique em 1 minuto como um atendente de IA no WhatsApp responde clientes de uma clínica a qualquer hora, para donos de pequenos negócios.';
    $('#examples').innerHTML = (story ? STORY_EXAMPLES : EXAMPLES).map(e => `<button type="button">${esc(e)}</button>`).join('');
    $('#genBtn').textContent = story ? 'Gerar história narrada' : 'Gerar roteiro';
  });
  $('#genBtn').onclick = () => startExplainer(true);
  $('#genLocalBtn').onclick = () => startExplainer(false);
  $('#brief').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) startExplainer(true); });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => { const f = e.dataTransfer.files?.[0]; if (f) startFootage(f); });
  $('#fileIn').onchange = e => { const f = e.target.files?.[0]; if (f) startFootage(f); e.target.value = ''; };
  initNovelaHome(); initViral(); initChannels();
  $('#openDemo').onclick = () => { const P = demoProject(); P.title = 'Exemplo: atendimento com IA'; P.id = uid(); openProject(P, 'studio'); };
}
function renderRecent() { renderHistory(); }

/* ---------- demo monitor ---------- */
let DEMO = null;
function demoProject() {
  const P = newProject('explainer', OPT.aspect); P.look = OPT.look; P.title = 'Atendimento com IA'; P.music.kind = 'pulse';
  P.scenes = [
    newScene('hook', { kicker: 'Clínicas, prestem atenção', text: 'Seu cliente não espera *amanhã*' }, 3),
    newScene('stat', { value: 62, suffix: '%', label: 'das mensagens', note: 'chegam fora do horário comercial (exemplo)' }, 4.5),
    newScene('chat', { title: 'Às 23h de um domingo', messages: [{ from: 'a', text: 'Vocês têm horário amanhã cedo?' }, { from: 'b', text: 'Temos às 8h e às 9h30. Posso reservar?' }, { from: 'a', text: '8h, por favor!' }] }, 6),
    newScene('compare', { title: 'O que muda', leftLabel: 'Sem IA', left: ['Resposta no dia seguinte', 'Paciente agenda no concorrente'], rightLabel: 'Com IA', right: ['Resposta em segundos', 'Agenda cheia na segunda'], verdict: 'Atendimento 24h sem contratar' }, 6.5),
    newScene('steps', { title: 'Como implantar', steps: ['Mapeie as perguntas comuns', 'Conecte a agenda', 'Teste com sua equipe', 'Ligue no WhatsApp'] }, 6.5),
    newScene('cta', { title: 'Quer isso na sua clínica?', action: 'Fale com a Moove IA', handle: 'moove-ia.com' }, 4.5),
  ];
  P.scenes.forEach(s => (s.status = 'approved'));
  return P;
}
function sizeDemo() {
  const c = $('#demoCanvas'); const [W, H] = ASPECTS[DEMO.aspect];
  c.width = 432; c.height = Math.round(432 * H / W); c.style.aspectRatio = `${W}/${H}`;
}

/* ---------- start flows ---------- */
function openProject(P, view) {
  pause(); S.project = P; S.t = 0; S.sel = 0; H.past = []; H.future = []; S.chat = []; if (P.mode !== 'footage') THUMBS.clear();
  P.manualCuts ??= []; P.pauseCut ??= false; P.pauseMin ??= .6; P.voice ??= { preview: true }; if (P.mode === 'story') P.cast = normCast(P.cast, !P.series);
  if (P.mode !== 'footage') S.video = null;
  if (P.narration && !P.narration.buffer) { if (P.narration.store) restoreVoice(P); else P.narration = null; }
  saveDraft(); show(view);
}
function pipeline(title, kicker, steps) {
  show('process'); $('#procTitle').textContent = title; $('#procKicker').textContent = kicker;
  $('#pipeline').innerHTML = steps.map(([id, label]) => `<li data-id="${id}" data-s="wait"><span class="dot"></span><span>${esc(label)}</span><span class="detail"></span></li>`).join('');
  $('#procExtra').innerHTML = ''; $('#liveText').hidden = true; $('#liveText').textContent = '';
  return (id, s, detail) => { const li = $(`#pipeline li[data-id="${id}"]`); if (!li) return; li.dataset.s = s; if (detail != null) li.querySelector('.detail').textContent = detail; };
}
let FLOW = null;
$('#procCancel')?.addEventListener('click', () => { FLOW?.abort(); });

async function startExplainer(useAI) {
  const brief = $('#brief').value.trim();
  if (!brief) { toast('Escreva sobre o que é o vídeo'); $('#brief').focus(); return; }
  const seconds = OPT.seconds || clamp(+$('#customSec').value || 60, 5, 3600);
  const story = OPT.mode === 'story';
  const P = newProject(story ? 'story' : 'explainer', OPT.aspect); P.look = OPT.look; P.brief = brief;
  if (!story) P.captions.on = true;
  if (!useAI || !aiAvailable()) {
    if (useAI) toast('Claude indisponível aqui. Montei um rascunho sem IA.');
    const r = story ? localStory(brief, { seconds }) : localExplainer(brief, { seconds, aspect: OPT.aspect }); P.title = r.title; P.scenes = r.scenes; if (r.cast) P.cast = r.cast; openProject(P, 'board'); return;
  }
  const step = pipeline(story ? 'Escrevendo a história' : 'Escrevendo o roteiro', story ? 'Narração com imagem' : 'Explicativo animado', [['brief', 'Briefing recebido'], ['write', story ? 'Claude escrevendo a narração e dirigindo as cenas' : 'Claude escrevendo as cenas'], ['build', 'Montando a animação']]);
  step('brief', 'done', `${OPT.aspect} · ${fmtDur(seconds)} · ${OPT.tone}`); step('write', 'run');
  FLOW = new AbortController(); const live = $('#liveText'); live.hidden = false; live.textContent = 'Pensando…';
  try {
    let chap = '';
    const onText = ({ text }) => {
      const n = (text.match(story ? /"say"\s*:/g : /"kind"\s*:/g) || []).length; const last = [...text.matchAll(/"(?:say|text|title|term|quote)"\s*:\s*"([^"]{3,120})"/g)].pop();
      live.textContent = `${chap}${n} ${n === 1 ? 'cena escrita' : 'cenas escritas'}${last ? `\n“${last[1].replace(/\*/g, '')}”` : ''}`;
    };
    const r = story
      ? await planStory(brief + blueprintBrief(bpOf(BP.sel), seconds) + brandBrief(chOf(CH.sel)), { seconds, aspect: OPT.aspect, tone: OPT.tone }, FLOW.signal, onText, (i, n, title) => { chap = i < 0 ? 'Planejando os capítulos…\n' : `Capítulo ${i + 1} de ${n}: ${title}\n`; live.textContent = chap; step('write', 'run', i < 0 ? 'roteiro geral' : `capítulo ${i + 1}/${n}`); })
      : await planExplainer(brief + blueprintBrief(bpOf(BP.sel), seconds) + brandBrief(chOf(CH.sel)), { seconds, aspect: OPT.aspect, tone: OPT.tone }, FLOW.signal, onText);
    if (r.cast) P.cast = r.cast; if (r.post) P.post = r.post; if (BP.sel) P.blueprint = { id: BP.sel, name: bpOf(BP.sel)?.bp.name }; if (CH.sel) P.channel = { id: CH.sel, name: chOf(CH.sel)?.name };
    step('write', 'done', `${r.scenes.length} cenas · ${fmtDur(r.scenes.reduce((a, s) => a + s.dur, 0))}`); step('build', 'run');
    await fontsReady(); P.title = r.title || 'Explicativo'; P.scenes = r.scenes; step('build', 'done');
    openProject(P, 'board');
  } catch (e) {
    if (e?.code === 'cancelled') { show('home'); return; }
    step('write', 'err', aiErr(e)); live.hidden = true;
    $('#procExtra').innerHTML = `<div class="choice"><strong>Não deu para gerar com o Claude.</strong><span class="muted">${esc(aiErr(e))}</span><div class="chips"><button class="btn primary" id="retryAi">Tentar de novo</button><button class="btn" id="goLocal">Montar sem IA</button><button class="btn ghost" id="goHome">Voltar</button></div></div>`;
    $('#retryAi').onclick = () => startExplainer(true); $('#goLocal').onclick = () => startExplainer(false); $('#goHome').onclick = () => show('home');
  }
}

async function startFootage(file) {
  if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name)) { toast('Esse arquivo não é um vídeo'); return; }
  const P = newProject('footage', OPT.aspectF); P.look = OPT.lookF; P.captions.preset = OPT.capPreset; P.title = file.name.replace(/\.[^.]+$/, '').slice(0, 60);
  P.manualCuts = []; P.pauseCut = true; P.pauseMin = .6;
  const wishes = $('#wishes').value.trim();
  const step = pipeline('Preparando seu vídeo', 'Edição do seu vídeo', [['read', 'Abrindo o vídeo'], ['audio', 'Lendo o áudio'], ['sil', 'Achando pausas e respiros'], ['words', 'Transcrevendo a fala'], ['plan', 'Montando as cenas'], ['thumbs', 'Gerando miniaturas']]);
  FLOW = new AbortController();
  try {
    const src = await loadFootage(file, step);
    S.video = src.video; P.source = src; src.video.addEventListener('seeked', markDirty);
    if (src.audio) {
      step('sil', 'run'); await sleep(30);
      P.silences = detectSilences(src.audio); const tot = P.silences.reduce((a, [x, y]) => a + (y - x), 0);
      step('sil', 'done', `${P.silences.length} pausas · ${tot.toFixed(1)} s`);
      src.peaks = waveformPeaks(src.audio, Math.min(4000, Math.round(src.duration * 40)));
    } else step('sil', 'warn', 'Sem áudio');
    step('words', 'run', 'Escolha abaixo');
    const words = src.audio ? await chooseTranscription(P, step) : [];
    P.words = markFillers(words);
    step('words', words.length ? 'done' : 'warn', words.length ? `${words.length} palavras` : 'Sem legenda');
    $('#procExtra').innerHTML = '';
    step('plan', 'run');
    let scenes = null, note = '';
    if (aiAvailable() && P.words.length) {
      const live = $('#liveText'); live.hidden = false; live.textContent = 'Claude assistindo à transcrição…';
      try {
        const r = await planFootage(P, wishes, FLOW.signal, ({ text }) => { const n = (text.match(/"in"\s*:/g) || []).length; live.textContent = `${n} ${n === 1 ? 'cena cortada' : 'cenas cortadas'}`; });
        scenes = r.scenes; if (r.title) P.title = r.title; if (r.post) P.post = r.post; note = 'Claude';
      } catch (e) { if (e?.code === 'cancelled') throw e; note = 'automático (' + aiErr(e) + ')'; }
      live.hidden = true;
    }
    if (!scenes) { P.scenes = []; scenes = localFootagePlan(P); note ||= 'automático'; }
    P.scenes = scenes; P.captions.on = P.words.length > 0; rebuildCuts(P);
    step('plan', 'done', `${scenes.length} cenas · ${fmtDur(projectDuration(P))} (${note})`);
    step('thumbs', 'run'); await captureThumbs(P, P.scenes); step('thumbs', 'done');
    openProject(P, 'board');
  } catch (e) {
    if (e?.code === 'cancelled') { show('home'); return; }
    console.error(e); toast(e?.message || 'Não consegui abrir esse vídeo'); show('home');
  }
}

function chooseTranscription(P, step) {
  return new Promise(resolve => {
    const box = $('#procExtra'); const sup = speechSupported();
    box.innerHTML = `<div class="choice"><strong>Como gerar a legenda?</strong>
      <div class="choice-grid">
        <button type="button" data-c="auto" ${sup ? '' : 'disabled'}><strong>Transcrever automaticamente</strong><span>${sup ? `O navegador ouve o vídeo uma vez (${tc(P.source.duration)}). Deixe o som ligado e esta aba aberta.` : 'Este navegador não transcreve áudio de arquivo. Use o Chrome atualizado ou as outras opções.'}</span></button>
        <button type="button" data-c="paste"><strong>Colar o que eu falei</strong><span>Cole o roteiro ou o texto da fala; o app alinha às pausas da voz.</span></button>
        <button type="button" data-c="srt"><strong>Importar legenda .srt</strong><span>De CapCut, YouTube, Premiere ou outro app.</span></button>
        <button type="button" data-c="skip"><strong>Seguir sem legenda</strong><span>O Claude não lê a fala; os cortes usam só as pausas.</span></button>
      </div><div id="tsub"></div></div>`;
    const sub = $('#tsub');
    box.querySelector('.choice-grid').onclick = async e => {
      const b = e.target.closest('button[data-c]'); if (!b || b.disabled) return; const c = b.dataset.c;
      if (c === 'skip') return resolve([]);
      if (c === 'paste') {
        sub.innerHTML = `<label class="field"><span>Texto da fala</span><textarea class="input" id="pasteTxt" style="min-height:140px" placeholder="Cole aqui tudo o que você fala no vídeo, na ordem."></textarea></label><div><button class="btn primary" id="alignBtn">Alinhar ao vídeo</button></div>`;
        $('#pasteTxt').focus();
        $('#alignBtn').onclick = () => { const t = $('#pasteTxt').value.trim(); if (!t) return toast('Cole o texto primeiro'); resolve(alignText(t, P.source.duration, P.silences)); };
      }
      if (c === 'srt') {
        sub.innerHTML = `<input type="file" accept=".srt,.vtt,text/plain" id="srtIn" class="input">`;
        $('#srtIn').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; const w = parseSRT(await f.text()); if (!w.length) return toast('Não achei legendas nesse arquivo'); resolve(w); };
        $('#srtIn').click();
      }
      if (c === 'auto') {
        const ctl = new AbortController(); FLOW.signal.addEventListener('abort', () => ctl.abort());
        sub.innerHTML = `<div style="display:grid;gap:8px"><div class="bar"><i id="trBar"></i></div><div class="live-text" id="trLive">Ouvindo…</div><div><button class="btn" id="trStop">Parar e usar o que já foi transcrito</button></div></div>`;
        $('#trStop').onclick = () => ctl.abort();
        box.querySelector('.choice-grid').style.display = 'none';
        try {
          const w = await transcribeLive(P.source.video, $('#lang').value, (k, n, txt) => { $('#trBar').style.width = `${(k * 100).toFixed(1)}%`; step('words', 'run', `${Math.round(k * 100)}% · ${n} palavras`); if (txt) $('#trLive').textContent = txt; }, ctl.signal);
          P.source.video.currentTime = 0;
          if (!w.length) { toast('A transcrição não captou fala. Tente colar o texto.'); box.querySelector('.choice-grid').style.display = ''; sub.innerHTML = ''; return; }
          resolve(w);
        } catch (err) {
          box.querySelector('.choice-grid').style.display = ''; sub.innerHTML = `<p class="notice">A transcrição automática falhou (${esc(err?.code || 'erro')}). Use “Colar o que eu falei” ou importe um .srt.</p>`;
        }
      }
    };
  });
}

/* ---------- cuts ---------- */
function rebuildCuts(P) {
  const c = [...(P.manualCuts || [])];
  if (P.pauseCut) for (const [a, b] of P.silences) if (b - a >= (P.pauseMin || .6)) c.push([a + .15, b - .15]);
  const ws = P.words; for (let i = 0; i < ws.length; i++) if (ws[i].removed) { const a = Math.max(ws[i].t0 - .03, i ? ws[i - 1].t1 : 0), b = Math.min(ws[i].t1 + .03, ws[i + 1]?.t0 ?? ws[i].t1 + .03); c.push([a, b]); }
  P.cuts = mergeCuts(c);
}

/* ---------- player ---------- */
let PLAYER = null;
function mountPlayer(slot) {
  if (!PLAYER) {
    const frag = $('#playerTpl').content.cloneNode(true);
    PLAYER = document.createElement('div'); PLAYER.style.display = 'contents'; PLAYER.append(frag);
    $('#playBtn', PLAYER).onclick = () => (S.playing ? pause() : play());
    $('#scrub', PLAYER).oninput = e => seek((e.target.value / 1000) * projectDuration(S.project));
    new ResizeObserver(sizeStage).observe($('#screen', PLAYER));
  }
  const host = $(slot); host.append(PLAYER); sizeStage();
}
function sizeStage() {
  if (!S.project || !PLAYER) return;
  const scr = $('#screen'), c = $('#stage'); const [W, H] = ASPECTS[S.project.aspect];
  let bw = scr.clientWidth - 2, bh = S.view === 'studio' ? scr.clientHeight - 2 : Math.min(window.innerHeight * .55, bw * H / W);
  if (S.view !== 'studio') scr.style.height = `${Math.round(bh)}px`; else scr.style.height = '';
  if (!(bw > 0 && bh > 0)) return;
  const s = Math.min(bw / W, bh / H), cw = Math.floor(W * s), ch = Math.floor(H * s);
  c.style.width = cw + 'px'; c.style.height = ch + 'px';
  const dpr = Math.min(2, window.devicePixelRatio || 1), q = Math.min(1, (cw * dpr) / W);
  c.width = Math.round(W * q); c.height = Math.round(H * q); markDirty();
}
let DIRTY = true; function markDirty() { DIRTY = true; }
function play() {
  const P = S.project; if (!P) return; const tot = projectDuration(P);
  if (S.t >= tot - .05) S.t = 0;
  S.playing = true; S.clock = { t: S.t, at: performance.now() };
  if (P.music.kind !== 'none' || P.sfx || P.narration) { try { startLiveAudio(P, S.t); } catch (e) { } }
  const l0 = locate(P, S.t); VOICE.lastIdx = l0?.index ?? -1; if (l0 && l0.local < .5) speakScene(P, l0.index);
  setPlayIcons(true);
}
function pause() {
  if (!S.playing) { S.video?.pause(); return; }
  S.playing = false; stopLiveAudio(); stopSpeech(); S.video?.pause(); setPlayIcons(false); markDirty();
}
function seek(t) {
  const P = S.project; if (!P) return; S.t = clamp(t, 0, projectDuration(P));
  if (S.playing) { S.clock = { t: S.t, at: performance.now() }; stopLiveAudio(); stopSpeech(); if (P.music.kind !== 'none' || P.sfx || P.narration) startLiveAudio(P, S.t); const l = locate(P, S.t); VOICE.lastIdx = l?.index ?? -1; }
  syncVideo(true); markDirty();
}
function syncVideo(force) {
  const P = S.project, v = S.video; if (!v || P?.mode !== 'footage') return;
  const loc = locate(P, S.t); if (!loc) return;
  if (loc.scene.kind !== 'clip') { if (!v.paused) v.pause(); return; }
  const want = loc.src;
  if (S.playing) {
    if (v.paused) { v.currentTime = want; v.play().catch(() => { }); }
    else if (Math.abs(v.currentTime - want) > .3) v.currentTime = want;
  } else if (force || Math.abs(v.currentTime - want) > .02) { if (!v.seeking) v.currentTime = want; }
}
function setPlayIcons(on) {
  const ico = on ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>';
  for (const id of ['#playBtn', '#tlPlay']) { const b = $(id); if (b) { b.innerHTML = ico; b.setAttribute('aria-label', on ? 'Pausar' : 'Tocar'); } }
}

/* ---------- main loop ---------- */
let lastNow = -1, lastSceneIdx = -1;
function frame(now) {
  requestAnimationFrame(frame);
  if (S.view === 'home' && DEMO) {
    const c = $('#demoCanvas'); const [W] = ASPECTS[DEMO.aspect]; const ctx = c.getContext('2d'); const q = c.width / W;
    const tot = projectDuration(DEMO), t = ((now / 1000) % tot);
    ctx.setTransform(q, 0, 0, q, 0, 0); drawFrame(ctx, DEMO, t, { total: tot });
    $('#demoTc').textContent = tc(t, 30, true);
    return;
  }
  const P = S.project; if (!P || (S.view !== 'board' && S.view !== 'studio')) return;
  const tot = projectDuration(P);
  if (S.playing) {
    S.t = S.clock.t + (now - S.clock.at) / 1000;
    if (S.t >= tot) { S.t = tot; pause(); }
    syncVideo(false); DIRTY = true;
  }
  if (!DIRTY) return; DIRTY = false;
  const c = $('#stage'); if (c && c.width) { const [W] = ASPECTS[P.aspect]; const q = c.width / W; const ctx = c.getContext('2d'); ctx.setTransform(q, 0, 0, q, 0, 0); drawFrame(ctx, P, Math.min(S.t, tot - 1e-4), { total: tot }); }
  const sc = $('#scrub'); if (sc && document.activeElement !== sc) sc.value = tot ? (S.t / tot) * 1000 : 0;
  if ($('#tNow')) { $('#tNow').textContent = tc(S.t); $('#tTot').textContent = tc(tot); }
  if ($('#tlTime')) $('#tlTime').textContent = `${tc(S.t, P.fps, true)} / ${tc(tot)}`;
  const ph = $('#playhead'); if (ph) { ph.style.left = `${S.t * PPS}px`; if (S.playing) keepPlayheadVisible(); }
  const loc = locate(P, S.t);
  if (loc && loc.index !== lastSceneIdx) { lastSceneIdx = loc.index; if (S.playing) { S.sel = loc.index; highlightSel(); } }
  if (S.playing && loc && loc.index !== VOICE.lastIdx) { VOICE.lastIdx = loc.index; speakScene(P, loc.index); }
  if (S.view === 'studio' && TAB === 'text' && P.mode === 'footage') highlightWord(loc?.src);
}

/* ---------- board ---------- */
const THUMB_W = 360;
function renderBoard() {
  const P = S.project; const box = $('#cards');
  const sb = $('#boardSeries'); if (sb) { sb.innerHTML = seriesBarHTML(P); sb.hidden = !P.series; sb.onclick = e => { if (e.target.closest('[data-act=nextEp]')) nextEpisodeModal(P.series.id); }; }
  const [W, H] = ASPECTS[P.aspect];
  box.innerHTML = P.scenes.map((s, i) => {
    const d = sceneDur(P, s), st = sceneStart(P, i);
    return `<article class="card ${i === S.sel ? 'selected' : ''}" data-i="${i}" data-status="${s.status}">
      <div class="thumb"><canvas width="${THUMB_W}" height="${Math.round(THUMB_W * H / W)}" aria-label="Prévia da cena ${i + 1}"></canvas><span class="tag">${String(i + 1).padStart(2, '0')} · ${esc(TEMPLATES[s.kind]?.name || s.kind)}${s.overlay ? ' + ' + esc(OVERLAYS[s.overlay.kind]?.name || '') : ''}</span>${s.status === 'approved' ? '<span class="ok">Aprovada</span>' : ''}${missingPhotos(P, i) ? `<span class="ok" style="background:var(--accent);color:var(--on-accent);top:auto;bottom:8px">Falta ${missingPhotos(P, i) > 1 ? missingPhotos(P, i) + ' fotos' : 'foto'}</span>` : ''}</div>
      <div class="body">
        <div class="row"><span class="mono muted" style="font-size:11px">${tc(st)} → ${tc(st + d)}</span>
          ${s.kind === 'clip' ? `<span class="mono" style="font-size:12px">${d.toFixed(1)} s</span>` : `<span class="dur"><button type="button" data-a="dm" aria-label="Menos tempo">−</button><span>${d.toFixed(1)} s</span><button type="button" data-a="dp" aria-label="Mais tempo">+</button></span>`}</div>
        <h3>${esc(sceneLabel(s)).slice(0, 120) || '—'}</h3>
        ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
        <div class="actions">
          <button class="btn sm ${s.status === 'approved' ? '' : 'primary'}" data-a="ok" type="button">${s.status === 'approved' ? 'Desaprovar' : 'Aprovar'}</button>
          <button class="btn sm ai" data-a="redo" type="button">Refazer</button>
          <button class="btn sm" data-a="edit" type="button">Editar</button>
          ${missingPhotos(P, i) ? photoInput('board', i, false) : ''}
        </div>
        <div class="redo" hidden><input class="input" placeholder="O que mudar nesta cena?" aria-label="Pedido de mudança"><div class="actions"><button class="btn sm ai" data-a="redoGo" type="button">Pedir ao Claude</button><button class="btn sm ghost" data-a="redoX" type="button">Cancelar</button></div></div>
      </div></article>`;
  }).join('');
  $$('.card', box).forEach(card => { const i = +card.dataset.i; drawCardThumb(card, i, null); card.addEventListener('pointerenter', () => animateCard(card, i)); });
  const ap = P.scenes.filter(s => s.status === 'approved').length;
  $('#bApproved').textContent = ap; $('#bTotal').textContent = P.scenes.length; $('#bDur').textContent = tc(projectDuration(P));
  $('#toStudio').textContent = ap === P.scenes.length ? 'Abrir estúdio →' : `Abrir estúdio (${P.scenes.length - ap} pendentes) →`;
}
function drawCardThumb(card, i, local) {
  const P = S.project, s = P.scenes[i], c = card.querySelector('canvas'); if (!c) return;
  if (s.kind === 'clip') {
    const ctx = c.getContext('2d'), [W, H] = ASPECTS[P.aspect], q = c.width / W; ctx.setTransform(q, 0, 0, q, 0, 0);
    const img = THUMBS.get(s.id); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (img) { const sc = Math.max(W / img.width, H / img.height) * (s.zoom === 2 ? 1.18 : 1); ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc); }
    const o = s.overlay;
    if (o) { const L = look(P), d = sceneDur(P, s), lt = local ?? Math.min((o.at || 0) + 1.2, d * .9), ot = lt - (o.at || 0);
      if (o.kind === 'broll' && DRAW[o.p?.kind]) { drawBackground(ctx, L, W, H, lt); DRAW[o.p.kind](ctx, L, W, H, Math.max(ot, 1.6), o.dur || 4, o.p); }
      else if (OVL[o.kind]) OVL[o.kind](ctx, L, W, H, Math.max(.6, ot), (o.dur || 3) + 5, o.p || {}); }
    return;
  }
  const d = sceneDur(P, s); drawSceneThumb(c, P, i, local ?? Math.min(d - .4, Math.max(1.8, d * .6)));
}
let cardAnim = null;
function animateCard(card, i) {
  cancelAnimationFrame(cardAnim?.raf); const P = S.project, d = sceneDur(P, P.scenes[i]); const t0 = performance.now();
  const step = now => { if (!card.isConnected || !card.matches(':hover')) { drawCardThumb(card, i, null); return; } drawCardThumb(card, i, ((now - t0) / 1000) % d); cardAnim = { raf: requestAnimationFrame(step) }; };
  cardAnim = { raf: requestAnimationFrame(step) };
}
function initBoard() {
  $('#cards').addEventListener('click', async e => {
    const card = e.target.closest('.card'); if (!card) return; const i = +card.dataset.i, P = S.project, s = P.scenes[i];
    const a = e.target.closest('[data-a]')?.dataset.a;
    S.sel = i; $$('.card').forEach(c => c.classList.toggle('selected', c === card));
    if (!a) { seek(sceneStart(P, i) + .01); return; }
    if (a === 'ok') { pushHistory('aprovação'); s.status = s.status === 'approved' ? 'draft' : 'approved'; afterChange(); }
    if (a === 'dp' || a === 'dm') { pushHistory('duração'); s.dur = clamp(+(s.dur + (a === 'dp' ? .5 : -.5)).toFixed(1), 1.5, 60); afterChange(); }
    if (a === 'edit') { S.sel = i; TAB = 'scene'; show('studio'); seek(sceneStart(P, i) + .01); }
    if (a === 'redo') { const r = card.querySelector('.redo'); r.hidden = false; r.querySelector('input').focus(); }
    if (a === 'redoX') card.querySelector('.redo').hidden = true;
    if (a === 'redoGo') { const note = card.querySelector('.redo input').value.trim(); await redoWithClaude(i, note, card); }
  });
  $('#cards').addEventListener('change', e => { if (e.target.dataset.photo) { S.sel = +e.target.dataset.i; handlePhotoInput(e.target); } });
  $('#cards').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.redo input')) { e.preventDefault(); e.target.closest('.card').querySelector('[data-a=redoGo]').click(); } });
  $('#approveAll').onclick = () => { pushHistory('aprovar todas'); S.project.scenes.forEach(s => (s.status = 'approved')); afterChange(); toast('Todas as cenas aprovadas'); };
  $('#addScene').onclick = () => { pushHistory('nova cena'); const P = S.project; const at = clamp(S.sel + 1, 0, P.scenes.length); P.scenes.splice(at, 0, newScene('bullets')); S.sel = at; afterChange(); };
  $('#toStudio').onclick = () => show('studio');
  $('#chatForm').onsubmit = e => { e.preventDefault(); const t = $('#chatIn').value.trim(); if (t) { $('#chatIn').value = ''; doCommand(t); } };
}
async function redoWithClaude(i, note, card) {
  const P = S.project, s = P.scenes[i];
  if (!aiAvailable()) return toast('Claude indisponível. Edite a cena no estúdio.');
  const btn = card?.querySelector('[data-a=redoGo]'); if (btn) { btn.disabled = true; btn.textContent = 'Refazendo…'; }
  try {
    if (s.kind === 'clip') { await doCommand(`Na cena ${i + 1}: ${note || 'melhore o ritmo e o destaque visual'}`); return; }
    const ns = await redoScene(P, i, note);
    pushHistory(`refazer cena ${i + 1}`); ns.versions = [...(s.versions || []), { kind: s.kind, p: s.p, dur: s.dur, say: s.say }]; P.scenes[i] = ns;
    afterChange(); toast(`Cena ${i + 1} refeita`, { label: 'Desfazer', fn: undo });
  } catch (e) { toast(aiErr(e)); if (btn) { btn.disabled = false; btn.textContent = 'Pedir ao Claude'; } }
}

/* ---------- director / command ---------- */
S.chat = [];
function renderChat() {
  const log = $('#chatLog'); if (!log) return;
  log.innerHTML = S.chat.length ? S.chat.map((m, i) => `<div class="msg ${m.who}">${esc(m.text)}${m.undo ? ` <button class="undo" data-u="${i}" type="button">desfazer</button>` : ''}</div>`).join('')
    : `<div class="msg ai">Peça mudanças em qualquer cena: “a cena 2 em formato de gráfico”, “troca o visual para Papel”, “acrescenta uma cena de passos antes do final”.</div>`;
  log.scrollTop = log.scrollHeight;
  log.onclick = e => { const b = e.target.closest('[data-u]'); if (b) { undo(); S.chat[+b.dataset.u].undo = false; renderChat(); } };
}
let CMD = null;
async function doCommand(text) {
  const P = S.project; if (!P) return;
  S.chat.push({ who: 'me', text }); renderChat();
  if (!aiAvailable()) { S.chat.push({ who: 'ai', text: 'O Claude não está disponível aqui. Abra o app pelo claude.ai para usar comandos; dá para editar tudo no painel.' }); renderChat(); setReply('Claude indisponível'); return; }
  CMD = new AbortController(); $('#cmdStop').hidden = false; $('#cmdSend').disabled = true; setReply('Pensando…');
  const pending = { who: 'ai', text: 'Pensando…' }; S.chat.push(pending); renderChat();
  try {
    const r = await runCommand(P, text, CMD.signal);
    pushHistory(text.slice(0, 40));
    const n = applyOps(P, r?.ops || []);
    if (P.mode === 'footage') rebuildCuts(P);
    if (!n) H.past.pop();
    pending.text = r?.reply || (n ? 'Feito.' : 'Não encontrei o que mudar.'); pending.undo = n > 0;
    if (P.mode === 'footage') await captureThumbs(P, P.scenes);
    afterChange(); setReply(pending.text, n > 0);
  } catch (e) { pending.text = aiErr(e); setReply(pending.text); }
  finally { $('#cmdStop').hidden = true; $('#cmdSend').disabled = false; renderChat(); }
}
function setReply(text, canUndo) {
  let el = $('#cmdReply'); const bar = $('#cmdForm'); if (!bar) return;
  if (!el) { el = document.createElement('div'); el.id = 'cmdReply'; el.className = 'reply'; bar.after(el); el.style.gridColumn = '1'; }
  el.innerHTML = esc(text) + (canUndo ? ' <button class="btn sm ghost" type="button" style="color:var(--accent)">Desfazer</button>' : '');
  el.querySelector('button')?.addEventListener('click', () => { undo(); el.textContent = 'Desfeito.'; });
}

/* ---------- change propagation ---------- */
let saveT = null;
function afterChange(push = true) {
  const P = S.project; if (!P) return;
  S.sel = clamp(S.sel, 0, P.scenes.length - 1); S.t = clamp(S.t, 0, projectDuration(P));
  CAP_CACHE.key = ''; markDirty(); sizeStage();
  if (S.view === 'board') renderBoard();
  if (S.view === 'studio') { renderTimeline(); if (!PANE_EDITING) renderPane(); }
  $('#projTitle').value = P.title;
  clearTimeout(saveT); saveT = setTimeout(saveDraft, 600);
}

/* ---------- studio: inspector ---------- */
let TAB = 'scene', PANE_EDITING = false;
function setupTabs() {
  const P = S.project; const foot = P.mode === 'footage';
  $$('#insTabs button').forEach(b => { b.hidden = (b.dataset.tab === 'text' || b.dataset.tab === 'clips') && !foot; b.setAttribute('aria-selected', b.dataset.tab === TAB); });
  if ((TAB === 'text' || TAB === 'clips') && !foot) TAB = 'scene';
}
function fieldHTML(prefix, [key, label, type], val) {
  const id = `${prefix}-${key}`;
  if (type === 'area') return `<label class="field"><span>${label}</span><textarea class="input" id="${id}" data-k="${prefix}" data-f="${key}" data-t="text">${esc(val ?? '')}</textarea></label>`;
  if (type === 'list') return `<label class="field"><span>${label}</span><textarea class="input" id="${id}" data-k="${prefix}" data-f="${key}" data-t="list">${esc((val || []).join('\n'))}</textarea></label>`;
  if (type === 'bars') return `<label class="field"><span>${label}</span><textarea class="input" id="${id}" data-k="${prefix}" data-f="${key}" data-t="bars">${esc((val || []).map(b => `${b.label}: ${b.value}`).join('\n'))}</textarea></label>`;
  if (type === 'chat') return `<label class="field"><span>${label}</span><textarea class="input" id="${id}" data-k="${prefix}" data-f="${key}" data-t="chat">${esc((val || []).map(m => `${m.from === 'b' ? 'B' : 'A'}: ${m.text}`).join('\n'))}</textarea></label>`;
  if (type === 'number') return `<label class="field"><span>${label}</span><input class="input" type="number" step="any" id="${id}" data-k="${prefix}" data-f="${key}" data-t="number" value="${esc(val ?? 0)}"></label>`;
  return `<label class="field"><span>${label}</span><input class="input" id="${id}" data-k="${prefix}" data-f="${key}" data-t="text" value="${esc(val ?? '')}"></label>`;
}
function parseField(t, v) {
  if (t === 'number') return Number(String(v).replace(',', '.')) || 0;
  if (t === 'list') return v.split('\n').map(x => x.trim()).filter(Boolean);
  if (t === 'bars') return v.split('\n').map(l => { const m = l.match(/^(.*?)[:=]\s*([-\d.,]+)\s*$/); return m ? { label: m[1].trim(), value: Number(m[2].replace(',', '.')) || 0 } : null; }).filter(Boolean);
  if (t === 'chat') return v.split('\n').map(l => { const m = l.match(/^\s*([ABab])\s*:\s*(.+)$/); return m ? { from: m[1].toLowerCase() === 'b' ? 'b' : 'a', text: m[2].trim() } : null; }).filter(Boolean);
  return v;
}
function renderPane() {
  const P = S.project, pane = $('#pane'); if (!P || !pane) return;
  const s = P.scenes[S.sel];
  let h = '';
  if (TAB === 'scene' && s) {
    const d = sceneDur(P, s), st = sceneStart(P, S.sel);
    h += `<div class="group"><div class="row" style="display:flex;justify-content:space-between;align-items:center"><h4>Cena ${S.sel + 1} de ${P.scenes.length}</h4><span class="mono muted" style="font-size:11px">${tc(st)} · ${d.toFixed(1)} s</span></div>
      <div class="chips"><button class="btn sm ${s.status === 'approved' ? '' : 'primary'}" data-act="approve" type="button">${s.status === 'approved' ? 'Aprovada ✓' : 'Aprovar'}</button>
      <button class="btn sm icon" data-act="left" type="button" aria-label="Mover para trás">←</button><button class="btn sm icon" data-act="right" type="button" aria-label="Mover para frente">→</button>
      <button class="btn sm" data-act="dup" type="button">Duplicar</button><button class="btn sm danger" data-act="del" type="button">Apagar</button></div>${seriesBarHTML(P)}</div>`;
    if (s.kind === 'story') h += storyPaneHTML(P, s);
    else if (s.kind === 'talk') h += talkPaneHTML(P, s);
    else if (s.kind === 'obj') h += objPaneHTML(P, s);
    else if (s.kind === 'doc' || s.kind === 'photo') h += docPaneHTML(P, s);
    else if (s.kind === 'clip') {
      h += `<div class="group"><h4>Trecho do vídeo</h4><div class="row2">
        <label class="field"><span>Início (s)</span><input class="input mono" type="number" step=".1" data-k="src" data-f="in" data-t="number" value="${s.src.in.toFixed(2)}"></label>
        <label class="field"><span>Fim (s)</span><input class="input mono" type="number" step=".1" data-k="src" data-f="out" data-t="number" value="${s.src.out.toFixed(2)}"></label></div>
        <label class="field"><span>Movimento de câmera</span><select class="input" data-k="scene" data-f="zoom" data-t="number"><option value="0" ${!s.zoom ? 'selected' : ''}>Parado</option><option value="1" ${s.zoom === 1 ? 'selected' : ''}>Aproximação lenta</option><option value="2" ${s.zoom === 2 ? 'selected' : ''}>Corte seco aproximado</option></select></label></div>`;
      const o = s.overlay;
      h += `<div class="group"><h4>Gráfico sobre o vídeo</h4><label class="field"><span>Tipo</span><select class="input" data-act="ovl"><option value="">Nenhum</option>${Object.entries(OVERLAYS).map(([k, v]) => `<option value="${k}" ${o?.kind === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>`;
      if (o) {
        h += `<div class="row2"><label class="field"><span>Entra em (s)</span><input class="input mono" type="number" step=".1" min="0" data-k="ovl" data-f="at" data-t="number" value="${(o.at || 0).toFixed(1)}"></label><label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".1" min="1" data-k="ovl" data-f="dur" data-t="number" value="${(o.dur || 3).toFixed(1)}"></label></div>`;
        if (o.kind === 'broll') {
          const k = o.p.kind || 'title';
          h += `<label class="field"><span>Modelo da tela</span><select class="input" data-act="brollKind">${Object.entries(TEMPLATES).filter(([x]) => x !== 'clip').map(([x, v]) => `<option value="${x}" ${x === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>`;
          h += TEMPLATES[k].fields.map(f => fieldHTML('ovlp', f, o.p[f[0]])).join('');
        } else h += OVERLAYS[o.kind].fields.map(f => fieldHTML('ovlp', f, o.p[f[0]])).join('');
      }
      h += `</div>`;
    } else {
      h += `<div class="group"><label class="field"><span>Modelo</span><select class="input" data-act="kind">${Object.entries(TEMPLATES).filter(([k]) => k !== 'clip').map(([k, v]) => `<option value="${k}" ${k === s.kind ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
        <label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".5" min="1" data-k="scene" data-f="dur" data-t="number" value="${s.dur}"></label></div>`;
      h += `<div class="group">${TEMPLATES[s.kind].fields.map(f => fieldHTML('p', f, s.p[f[0]])).join('')}
        <label class="field"><span>Narração (vira legenda se ligada)</span><textarea class="input" data-k="scene" data-f="say" data-t="text">${esc(s.say || '')}</textarea></label></div>`;
      h += `<div class="group"><h4>Refazer com o Claude</h4><input class="input" id="paneRedo" placeholder="Ex.: mais curto e com um número"><button class="btn ai sm" data-act="redo" type="button">Refazer cena</button>${s.versions?.length ? `<button class="btn sm" data-act="prev" type="button">Voltar à versão anterior (${s.versions.length})</button>` : ''}</div>`;
    }
  }
  if (TAB === 'captions') {
    const C = P.captions;
    h += `<div class="group"><label class="toggle"><span>Mostrar legendas</span><input type="checkbox" data-k="cap" data-f="on" ${C.on ? 'checked' : ''}></label>
      ${P.mode !== 'footage' ? '<p class="notice ai" style="margin:0">A legenda usa a narração de cada cena.</p>' : (P.words.length ? '' : '<p class="notice" style="margin:0">Sem transcrição. Gere uma na aba Texto.</p>')}</div>
      <div class="group"><h4>Estilo</h4><div class="presets">${Object.entries(CAPTION_PRESETS).map(([k, v]) => `<button type="button" class="preset" data-act="cap" data-v="${k}" aria-pressed="${C.preset === k}"><strong>${v.name}</strong><small>${v.desc}</small></button>`).join('')}</div></div>
      <div class="group"><label class="field"><span>Posição vertical</span><input type="range" min=".12" max=".9" step=".01" data-k="cap" data-f="pos" data-t="number" value="${C.pos}"></label>
      <label class="field"><span>Palavras por vez: ${C.words}</span><input type="range" min="1" max="7" step="1" data-k="cap" data-f="words" data-t="number" value="${C.words}"></label>
      <label class="toggle"><span>Tudo em maiúsculas</span><input type="checkbox" data-k="cap" data-f="upper" ${C.upper ? 'checked' : ''}></label>
      <div class="row2" style="align-items:end"><label class="field"><span>Cor de destaque</span><input type="color" class="input" style="padding:2px;height:36px" data-k="cap" data-f="accent" data-t="text" value="${C.accent || look(P).a1}"></label><button class="btn sm" data-act="capReset" type="button">Usar cor do visual</button></div></div>
      <div class="group"><button class="btn" data-act="srt" type="button">Baixar legenda .srt</button></div>`;
  }
  if (TAB === 'visual') {
    if (P.mode !== 'footage') h += photosPaneHTML(P);
    h += `<div class="group"><h4>Visual dos gráficos</h4><div class="swatches">${Object.entries(LOOKS).map(([id, L]) => `<button type="button" class="swatch" data-act="look" data-v="${id}" aria-pressed="${P.look === id}"><i style="background:linear-gradient(135deg,${L.bg} 0 45%,${L.a1} 45% 72%,${L.a2} 72%)"></i>${L.name}</button>`).join('')}</div></div>
      <div class="group"><h4>Formato</h4><div class="chips">${Object.keys(ASPECTS).map(a => `<button type="button" class="chip" data-act="aspect" data-v="${a}" aria-pressed="${P.aspect === a}">${a}</button>`).join('')}</div>
      ${P.mode === 'footage' ? `<label class="field"><span>Enquadramento do vídeo</span><select class="input" data-k="proj" data-f="fit"><option value="cover" ${P.fit === 'cover' ? 'selected' : ''}>Preencher (corta as bordas)</option><option value="blur" ${P.fit === 'blur' ? 'selected' : ''}>Inteiro com fundo desfocado</option></select></label>` : ''}</div>
      <div class="group"><label class="toggle"><span>Contador de cenas e título no quadro</span><input type="checkbox" data-k="proj" data-f="chrome" ${P.chrome ? 'checked' : ''}></label>
      <label class="toggle"><span>Barra de progresso no topo</span><input type="checkbox" data-k="proj" data-f="progressBar" ${P.progressBar ? 'checked' : ''}></label></div>`;
    if (P.mode !== 'footage') h += `<div class="group"><label class="field"><span>Estilo dos personagens</span><select class="input" data-act="charStyle"><option value="cine" ${P.charStyle === 'cine' ? 'selected' : ''}>Cinemático (realista, sem contorno)</option><option value="toon" ${(P.charStyle || 'toon') === 'toon' ? 'selected' : ''}>Cartoon (contorno, cabeça grande)</option><option value="classic" ${P.charStyle === 'classic' ? 'selected' : ''}>Clássico (bonequinho)</option></select></label></div>`;
    if (P.mode === 'story') h += castPaneHTML(P);
  }
  if (TAB === 'post') h += postHTML(P);
  if (TAB === 'audio') {
    const M = P.music;
    if (P.mode !== 'footage') h += narrationPaneHTML(P);
    h += `<div class="group"><h4>Trilha</h4><div class="chips">${[['none', 'Nenhuma'], ['pulse', 'Batida gerada'], ['upload', 'Minha música']].map(([k, l]) => `<button type="button" class="chip" data-act="music" data-v="${k}" aria-pressed="${M.kind === k}">${l}</button>`).join('')}</div>
      ${M.kind === 'upload' ? `<label class="field"><span>${M.name ? 'Arquivo: ' + esc(M.name) : 'Escolha um arquivo de áudio'}</span><input type="file" accept="audio/*" class="input" id="musicIn"></label>` : ''}
      ${M.kind === 'pulse' ? '<p class="muted" style="margin:0;font-size:12px">Batida lo-fi gerada no próprio app, livre de direitos, no tamanho exato do vídeo.</p>' : ''}
      <label class="field"><span>Volume da trilha</span><input type="range" min="0" max="1" step=".05" data-k="music" data-f="vol" data-t="number" value="${M.vol}"></label></div>
      <div class="group"><label class="toggle"><span>Som de transição entre cenas</span><input type="checkbox" data-k="proj" data-f="sfx" ${P.sfx ? 'checked' : ''}></label></div>`;
  }
  if (TAB === 'text' && P.mode === 'footage') {
    const rem = P.words.filter(w => w.removed).length, f1 = P.words.filter(w => w.filler === 1).length, f2 = P.words.filter(w => w.filler === 2).length;
    h += `<div class="group"><p class="muted" style="margin:0;font-size:12px">Clique numa palavra para ir até ela. Alt + clique (ou o modo riscar) corta a palavra do vídeo.</p>
      <label class="toggle"><span>Modo riscar</span><input type="checkbox" id="strikeMode" ${STRIKE ? 'checked' : ''}></label>
      <div class="chips"><button class="btn sm" data-act="fill1" type="button">Remover vícios (${f1})</button><button class="btn sm" data-act="fill2" type="button">Remover “tipo/né” (${f2})</button><button class="btn sm" data-act="restore" type="button">Restaurar (${rem})</button></div>
      <label class="toggle"><span>Cortar pausas longas</span><input type="checkbox" data-k="proj" data-f="pauseCut" ${P.pauseCut ? 'checked' : ''}></label>
      <label class="field"><span>Pausa mínima: ${(P.pauseMin || .6).toFixed(2)} s</span><input type="range" min=".3" max="2" step=".05" data-k="proj" data-f="pauseMin" data-t="number" value="${P.pauseMin || .6}"></label>
      <div class="chips"><button class="btn sm" data-act="retr" type="button">Refazer transcrição</button></div></div>
      <div class="transcript" id="transcript">${P.words.length ? P.words.map((w, i) => `<span data-w="${i}" class="${w.removed ? 'x' : ''} ${w.filler ? 'f' + w.filler : ''}">${esc(w.text)}</span>`).join(' ') : '<p class="muted">Sem transcrição.</p>'}</div>`;
  }
  if (TAB === 'clips' && P.mode === 'footage') {
    h += `<div class="group"><p class="muted" style="margin:0;font-size:12px">O Claude lê a fala e sugere trechos que funcionam sozinhos como Reels, com nota de 0 a 99 (gancho, fluxo, valor).</p><button class="btn ai" data-act="findClips" type="button" ${P.words.length ? '' : 'disabled'}>Encontrar cortes</button>${S.parent ? '<button class="btn" data-act="back" type="button">← Voltar ao vídeo completo</button>' : ''}</div>
      <div style="display:grid;gap:8px">${(S.clips || []).map((c, i) => `<div class="clipcard"><div class="score" style="background:conic-gradient(var(--accent) ${c.score * 3.6}deg, var(--surface-3) 0)"><span style="background:var(--bg);width:38px;height:38px;border-radius:50%;display:grid;place-items:center">${c.score}</span></div><div><h5>${esc(c.title)}</h5><p>“${esc(c.hook)}”</p><p>${esc(c.why)}</p><div class="chips"><span class="mono muted" style="font-size:11px;align-self:center">${tc(c.start)}–${tc(c.end)}</span><button class="btn sm" data-act="clipGo" data-i="${i}" type="button">Ver</button><button class="btn sm primary" data-act="clipOpen" data-i="${i}" type="button">Abrir como vídeo</button></div></div></div>`).join('')}</div>`;
  }
  pane.innerHTML = h;
  if (TAB === 'text') { lastWordHL = -1; }
  if (TAB === 'visual' && P.mode === 'story') drawCastThumbs(P);
}
let STRIKE = false;
function sceneOf() { return S.project.scenes[S.sel]; }
function initInspector() {
  $('#insTabs').onclick = e => { const b = e.target.closest('button[data-tab]'); if (!b) return; TAB = b.dataset.tab; setupTabs(); renderPane(); };
  const pane = $('#pane');
  pane.addEventListener('focusin', e => { if (e.target.matches('[data-k]')) { PANE_EDITING = true; e.target._pushed = false; } });
  pane.addEventListener('focusout', e => { if (e.target.matches('[data-k]')) { PANE_EDITING = false; if (e.target.type !== 'range' && e.target.tagName !== 'SELECT') { renderTimeline(); if (S.view === 'board') renderBoard(); } } });
  const onEdit = e => {
    const el = e.target; if (!el.matches('[data-k]')) return; const P = S.project, s = sceneOf();
    if (!el._pushed) { pushHistory('edição'); el._pushed = true; }
    const k = el.dataset.k, f = el.dataset.f, t = el.dataset.t || 'text';
    const v = el.type === 'checkbox' ? el.checked : parseField(t, el.value);
    if (k === 'p') s.p[f] = v;
    else if (k === 'sp' || k === 'pp' || k === 'pd') { s.p[f] = v; if (k === 'pd' && f === 'crowd') el.previousElementSibling.textContent = `Bonecos no chão: ${v}`; }
    else if (k === 'pdb') { s.p.big = { ...(s.p.big || { value: '', label: '' }), [f]: v }; if (!String(s.p.big.value).trim()) s.p.big = String(s.p.big.label || '').trim() ? s.p.big : null; }
    else if (/^di\d$/.test(k)) s.p.items[+k.slice(2)][f] = f === 'count' ? clamp(Math.round(Number(v) || 1), 1, 4) : v;
    else if (talkEdit(k, f, v, s, P) || objEdit(k, f, v, s) || thingEdit(k, f, v, s)) { }
    else if (k === 'sh') s.p.hero[f] = v;
    else if (/^se\d$/.test(k)) s.p.extras[+k.slice(2)][f] = v;
    else if (/^cast\d$/.test(k)) { P.cast[+k.slice(4)][f] = v; drawCastThumbs(P); }
    else if (k === 'voice') P.voice[f] = v;
    else if (k === 'narr') P.narration[f] = v;
    else if (k === 'scene') { if (f === 'dur') s.dur = clamp(v, 1, 120); else { s[f] = v; if (f === 'say' && s.kind === 'story' && !P.narration) s.dur = sayDur(v); } }
    else if (k === 'src') { const D = P.source.duration; if (f === 'in') s.src.in = clamp(v, 0, s.src.out - .3); else s.src.out = clamp(v, s.src.in + .3, D); THUMBS.delete(s.id); }
    else if (k === 'ovl') s.overlay[f] = Math.max(0, v);
    else if (k === 'ovlp') s.overlay.p[f] = v;
    else if (k === 'cap') { P.captions[f] = v; if (f === 'words') el.previousElementSibling.textContent = `Palavras por vez: ${v}`; }
    else if (k === 'music') P.music[f] = v;
    else if (k === 'proj') { P[f] = v; if (f === 'pauseCut' || f === 'pauseMin') { rebuildCuts(P); if (f === 'pauseMin') el.previousElementSibling.textContent = `Pausa mínima: ${v.toFixed(2)} s`; } if (f === 'fit') sizeStage(); }
    CAP_CACHE.key = ''; markDirty();
    if (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'range' || el.type === 'color') { if (el.type !== 'range' && el.type !== 'color') { PANE_EDITING = false; afterChange(); } else renderTimeline(); }
    clearTimeout(saveT); saveT = setTimeout(saveDraft, 800);
  };
  pane.addEventListener('input', onEdit);
  pane.addEventListener('change', async e => {
    const el = e.target, P = S.project, s = sceneOf();
    if (el.dataset.act === 'objType') { pushHistory('objeto'); s.p.item = normObj({ item: { type: el.value } }).item; afterChange(); }
    if (el.dataset.act === 'charStyle') { pushHistory('estilo'); P.charStyle = el.value; if (el.value === 'cine' && P.captions.preset === 'toon') P.captions.preset = 'cine'; if (el.value !== 'cine' && P.captions.preset === 'cine') P.captions.preset = 'toon'; afterChange(); }
    if (el.dataset.act === 'kind') { pushHistory('modelo'); const k = el.value; s.p = { ...structuredClone(DEFAULT_PROPS[k]), ...pickCompatible(s.p, k) }; s.kind = k; s.dur = Math.max(s.dur, defaultDur(k, s.p) * .8); afterChange(); }
    if (el.dataset.act === 'ovl') { pushHistory('gráfico'); s.overlay = el.value ? normalizeOverlay({ kind: el.value, at: .3, dur: 3, p: el.value === 'broll' ? { kind: 'stat', ...DEFAULT_PROPS.stat } : { text: 'Seu *destaque* aqui', name: 'Seu nome', role: 'O que você faz', ...DEFAULT_PROPS.stat, title: 'Pontos', items: ['Primeiro', 'Segundo'] } }) : null; afterChange(); }
    if (el.dataset.act === 'brollKind') { pushHistory('modelo da tela'); const k = el.value; s.overlay.p = { ...structuredClone(DEFAULT_PROPS[k]), kind: k }; afterChange(); }
    if (el.id === 'musicIn' && el.files[0]) { try { const buf = await audioCtx().decodeAudioData(await el.files[0].arrayBuffer()); P.music.buffer = buf; P.music.name = el.files[0].name; afterChange(); toast('Música carregada'); } catch (err) { toast('Não consegui ler esse áudio'); } }
    if (el.id === 'strikeMode') STRIKE = el.checked;
    if (el.id === 'narrIn' && el.files[0]) onNarrationFile(el.files[0]);
    if (el.dataset.photo) handlePhotoInput(el);
    if (el.dataset.act === 'itType') { pushHistory('elemento'); s.p.items[+el.dataset.i] = normDoc({ items: [{ ...DEFAULT_ITEM[el.value], type: el.value }] }).items[0]; afterChange(); }
  });
  pane.addEventListener('click', async e => {
    const P = S.project, s = sceneOf();
    const w = e.target.closest('[data-w]');
    if (w) { const i = +w.dataset.w, word = P.words[i];
      if (e.altKey || STRIKE) { pushHistory('riscar palavra'); word.removed = !word.removed; w.classList.toggle('x', word.removed); rebuildCuts(P); afterChangeLight(); }
      else { const tl = srcToTimeline(P, word.t0 + .01); if (tl != null) seek(tl); else toast('Esse trecho está cortado'); }
      return; }
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT') return; const a = b.dataset.act;
    if (talkClick(a, b, s, P)) return;
    if (a === 'itAdd') { pushHistory('elemento'); s.p.items.push(normDoc({ items: [{ type: 'icon', name: 'alert', label: 'ALERTA' }] }).items[0]); afterChange(); }
    if (a === 'itDel') { pushHistory('elemento'); s.p.items.splice(+b.dataset.i, 1); afterChange(); }
    if (a === 'itNoPhoto') { pushHistory('foto'); s.p.items[+b.dataset.i].img = ''; afterChange(); }
    if (a === 'exAdd') { pushHistory('coadjuvante'); s.p.extras = [...(s.p.extras || []), { who: (P.cast[1] || P.cast[0]).id, pose: 'stand', emotion: 'neutral', prop: 'none', x: s.p.extras?.length ? .2 : .8 }]; afterChange(); }
    if (a === 'exDel') { pushHistory('coadjuvante'); s.p.extras.splice(+b.dataset.i, 1); afterChange(); }
    if (a === 'skin') { pushHistory('elenco'); P.cast[+b.dataset.i].skin = b.dataset.v; afterChange(); }
    if (a === 'narrDel') { pushHistory('remover narração'); P.narration = null; afterChange(); }
    if (a === 'script') { const r = await saveFile(`${slug(P.title)}-roteiro.txt`, narrationScript(P)); if (r === 'saved') toast('Roteiro salvo'); }
    if (a === 'copyScript') { try { await navigator.clipboard.writeText(narrationScript(P)); toast('Roteiro copiado'); } catch (e) { toast('Não deu para copiar aqui. Use Baixar roteiro.'); } }
    if (a === 'aiVoice') openAiVoice();
    if (a === 'approve') { pushHistory('aprovação'); s.status = s.status === 'approved' ? 'draft' : 'approved'; afterChange(); }
    if (a === 'left' || a === 'right') { const j = S.sel + (a === 'left' ? -1 : 1); if (j < 0 || j >= P.scenes.length) return; pushHistory('mover'); [P.scenes[S.sel], P.scenes[j]] = [P.scenes[j], P.scenes[S.sel]]; S.sel = j; afterChange(); }
    if (a === 'dup') duplicateScene();
    if (a === 'del') deleteScene();
    if (a === 'redo') { const note = $('#paneRedo').value.trim(); b.disabled = true; b.textContent = 'Refazendo…'; await redoWithClaude(S.sel, note); }
    if (a === 'prev') { const v = s.versions.pop(); if (v) { pushHistory('versão anterior'); Object.assign(s, { kind: v.kind, p: v.p, dur: v.dur, say: v.say }); afterChange(); } }
    if (a === 'cap') { pushHistory('estilo da legenda'); P.captions.preset = b.dataset.v; P.captions.on = true; afterChange(); }
    if (a === 'capReset') { pushHistory('cor da legenda'); P.captions.accent = null; afterChange(); }
    if (a === 'srt') { const srt = buildSRT(P); if (!srt.trim()) return toast('Não há legenda para baixar'); const r = await saveFile(`${slug(P.title)}.srt`, srt, 'text/plain'); if (r === 'saved') toast('Legenda salva'); }
    if (a === 'look') { pushHistory('visual'); P.look = b.dataset.v; afterChange(); }
    if (a === 'aspect') { pushHistory('formato'); P.aspect = b.dataset.v; afterChange(); }
    if (a === 'music') { pushHistory('trilha'); P.music.kind = b.dataset.v; if (S.playing) { pause(); } afterChange(); }
    if (a === 'fill1' || a === 'fill2') { pushHistory('remover vícios'); const lv = a === 'fill1' ? 1 : 2; let n = 0; P.words.forEach(w => { if (w.filler === lv && !w.removed) { w.removed = true; n++; } }); rebuildCuts(P); afterChange(); toast(`${n} ${n === 1 ? 'palavra removida' : 'palavras removidas'}`); }
    if (a === 'restore') { pushHistory('restaurar'); P.words.forEach(w => (w.removed = false)); rebuildCuts(P); afterChange(); }
    if (a === 'retr') retranscribe();
    if (a === 'findClips') { if (!aiAvailable()) return toast('Claude indisponível'); b.disabled = true; b.textContent = 'Lendo a fala…'; try { S.clips = await findClips(P); if (!S.clips.length) toast('Não achei trechos fortes o bastante'); } catch (err) { toast(aiErr(err)); } renderPane(); }
    if (a === 'clipGo') { const c = S.clips[+b.dataset.i]; const tl = srcToTimeline(P, c.start + .05); if (tl != null) { seek(tl); play(); } }
    if (a === 'clipOpen') openClip(S.clips[+b.dataset.i]);
    if (a === 'back') { const parent = S.parent; S.parent = null; S.project = parent; H.past = []; H.future = []; S.sel = 0; afterChange(); show('studio'); }
  });
}
function pickCompatible(p, kind) { const out = {}; const keys = TEMPLATES[kind].fields.map(f => f[0]); for (const k of keys) if (p[k] != null && typeof p[k] === typeof DEFAULT_PROPS[kind][k]) out[k] = p[k]; if (kind === 'hook' && !out.text && p.title) out.text = p.title; if (kind === 'title' && !out.title && p.text) out.title = p.text; return out; }
function slug(s) { return String(s || 'video').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 50) || 'video'; }
function afterChangeLight() { CAP_CACHE.key = ''; markDirty(); renderTimeline(); clearTimeout(saveT); saveT = setTimeout(saveDraft, 800); }
let lastWordHL = -1;
function highlightWord(src) {
  if (src == null) return; const P = S.project; const ws = P.words;
  let i = -1; for (let k = 0; k < ws.length; k++) { if (ws[k].t0 <= src) i = k; else break; }
  if (i === lastWordHL) return;
  $(`#transcript span[data-w="${lastWordHL}"]`)?.classList.remove('now');
  const el = $(`#transcript span[data-w="${i}"]`); el?.classList.add('now'); lastWordHL = i;
  if (el && S.playing) { const box = $('#pane'); const r = el.offsetTop - box.scrollTop; if (r < 40 || r > box.clientHeight - 40) box.scrollTop = el.offsetTop - box.clientHeight / 2; }
}
async function retranscribe() {
  const P = S.project; pause();
  const ov = modal(`<h3>Refazer transcrição</h3><p class="muted" style="margin:0">Cole o texto da fala para realinhar, importe um .srt ou deixe o navegador ouvir de novo.</p>
    <textarea class="input" id="rtTxt" style="min-height:120px" placeholder="Texto da fala"></textarea>
    <div class="modal-foot"><button class="btn ghost" data-x>Cancelar</button><input type="file" id="rtSrt" accept=".srt,.vtt" hidden><button class="btn" id="rtSrtB">Importar .srt</button>${speechSupported() ? '<button class="btn" id="rtAuto">Ouvir de novo</button>' : ''}<button class="btn primary" id="rtGo">Alinhar texto</button></div>`);
  const apply = w => { pushHistory('transcrição'); P.words = markFillers(w); rebuildCuts(P); P.captions.on = true; ov.remove(); afterChange(); toast(`${w.length} palavras`); };
  $('#rtGo').onclick = () => { const t = $('#rtTxt').value.trim(); if (t) apply(alignText(t, P.source.duration, P.silences)); };
  $('#rtSrtB').onclick = () => $('#rtSrt').click();
  $('#rtSrt').onchange = async e => { const f = e.target.files[0]; if (f) { const w = parseSRT(await f.text()); if (w.length) apply(w); else toast('Arquivo sem legendas'); } };
  if ($('#rtAuto')) $('#rtAuto').onclick = async () => {
    const ctl = new AbortController(); ov.querySelector('.modal').innerHTML = `<h3>Ouvindo o vídeo</h3><div class="bar"><i id="rtBar"></i></div><div class="live-text" id="rtLive">…</div><div class="modal-foot"><button class="btn" id="rtStop">Parar e usar</button></div>`;
    $('#rtStop').onclick = () => ctl.abort();
    try { const w = await transcribeLive(P.source.video, 'pt-BR', (k, n, txt) => { $('#rtBar').style.width = `${k * 100}%`; if (txt) $('#rtLive').textContent = txt; }, ctl.signal); if (w.length) apply(w); else { ov.remove(); toast('Nada captado'); } }
    catch (err) { ov.remove(); toast('A transcrição automática falhou neste navegador'); }
  };
}
function openClip(c) {
  const P = S.project;
  const NP = { ...structuredClone({ ...P, source: null, music: { ...P.music, buffer: null } }), id: uid(), title: c.title || 'Corte', source: P.source, aspect: '9:16' };
  NP.music.buffer = P.music.buffer;
  NP.scenes = P.scenes.filter(s => s.kind === 'clip' && s.src.out > c.start && s.src.in < c.end).map(s => { const n = structuredClone(s); n.id = uid(); n.src = { in: Math.max(s.src.in, c.start), out: Math.min(s.src.out, c.end) }; n.status = 'draft'; return n; });
  if (!NP.scenes.length) { const s = newScene('clip'); s.src = { in: c.start, out: c.end }; NP.scenes = [s]; }
  NP.scenes[0].overlay ||= normalizeOverlay({ kind: 'headline', at: .2, dur: 3, p: { text: c.hook ? c.hook.split(' ').slice(0, 7).join(' ') : c.title } });
  S.parent = P; S.project = NP; H.past = []; H.future = []; S.sel = 0; S.t = 0; NP.captions.on = NP.words.length > 0;
  captureThumbs(NP, NP.scenes).then(() => afterChange()); TAB = 'scene'; show('board'); toast('Corte aberto. Aprove as cenas e exporte.');
}
function duplicateScene() { const P = S.project, s = sceneOf(); pushHistory('duplicar'); const c = structuredClone(s); c.id = uid(); c.status = 'draft'; P.scenes.splice(S.sel + 1, 0, c); S.sel++; if (c.kind === 'clip') THUMBS.set(c.id, THUMBS.get(s.id)); afterChange(); }
function deleteScene() { const P = S.project; if (P.scenes.length <= 1) return toast('O vídeo precisa de pelo menos uma cena'); pushHistory('apagar cena'); P.scenes.splice(S.sel, 1); S.sel = Math.min(S.sel, P.scenes.length - 1); afterChange(); toast('Cena apagada', { label: 'Desfazer', fn: undo }); }
function splitAtPlayhead() {
  const P = S.project, loc = locate(P, S.t); if (!loc) return;
  const s = loc.scene;
  if (s.kind === 'clip') {
    if (loc.src - s.src.in < .25 || s.src.out - loc.src < .25) return toast('Muito perto da borda da cena');
    pushHistory('dividir'); const b = structuredClone(s); b.id = uid(); b.src.in = loc.src; s.src.out = loc.src; b.overlay = null; b.zoom = s.zoom === 1 ? 2 : 1;
    P.scenes.splice(loc.index + 1, 0, b); THUMBS.delete(s.id); captureThumbs(P, [s, b]).then(markDirty);
  } else {
    if (loc.local < .5 || loc.dur - loc.local < .5) return toast('Muito perto da borda da cena');
    pushHistory('dividir'); const b = structuredClone(s); b.id = uid(); b.dur = +(s.dur - loc.local).toFixed(2); s.dur = +loc.local.toFixed(2); P.scenes.splice(loc.index + 1, 0, b);
  }
  S.sel = loc.index + 1; afterChange(); toast('Cena dividida');
}

/* ---------- timeline ---------- */
let PPS = 40;
const KIND_COLOR = { hook: '#3b2a7a', title: '#1d3a8a', bullets: '#1a4a7a', stat: '#4a2a7a', compare: '#2a3a8a', steps: '#164a6a', chart: '#2a2f7a', quote: '#4a2470', definition: '#1e3f75', chat: '#14506e', cta: '#5a2a7a', clip: '#141A2B', story: '#1f2f5e', talk: '#3a2350', obj: '#2a4a3a', doc: '#2a2236', photo: '#1a2a3a' };
function fitZoom() { const P = S.project, w = ($('#tl')?.clientWidth || 800) - 90, tot = projectDuration(P) || 1; PPS = clamp(w / tot, 4, 200); $('#tlZoom').value = PPS; }
function renderTimeline() {
  const P = S.project, inner = $('#tlInner'); if (!P || !inner || S.view !== 'studio') return;
  const tot = projectDuration(P), W = Math.max(tot * PPS + 40, ($('#tl').clientWidth || 600) - 70);
  inner.style.width = W + 'px';
  const step = [.5, 1, 2, 5, 10, 15, 30, 60, 120, 300].find(s => s * PPS >= 70) || 600;
  let rul = '';
  for (let t = 0; t <= tot + step; t += step) rul += `<i style="left:${t * PPS}px"></i><span style="left:${t * PPS}px">${tc(t)}</span>`;
  let acc = 0, blocks = '';
  P.scenes.forEach((s, i) => {
    const d = sceneDur(P, s), x = acc * PPS, w = Math.max(2, d * PPS - 2);
    const thumb = s.kind === 'clip' && THUMBS.get(s.id) ? `background-image:url(${thumbURL(s.id)});` : '';
    const ov = s.overlay ? `<span class="ovl" style="left:${(s.overlay.at || 0) * PPS}px;width:${Math.min(s.overlay.dur || 3, d) * PPS}px"></span>` : '';
    blocks += `<div class="blk ${s.kind === 'clip' ? 'clip' : ''} ${i === S.sel ? 'sel' : ''} ${s.status === 'approved' ? 'ok' : ''}" data-i="${i}" style="left:${x}px;width:${w}px;background-color:${KIND_COLOR[s.kind] || '#333'};${thumb}" title="${esc(sceneLabel(s))}">${ov}<small>${String(i + 1).padStart(2, '0')}</small>${w > 70 ? esc(s.kind === 'clip' ? (s.overlay ? OVERLAYS[s.overlay.kind].name : '') : s.kind === 'story' || s.kind === 'talk' ? sceneLabel(s).slice(0, Math.max(8, Math.floor(w / 7))) : TEMPLATES[s.kind].name) : ''}${s.kind !== 'clip' ? '<span class="handle" data-h="1"></span>' : ''}</div>`;
    acc += d;
  });
  let caps = '';
  if (P.captions.on) for (const g of captionGroups(timelineWords(P), P.captions.preset === 'big' ? 1 : P.captions.words)) caps += `<div class="capblk" style="left:${g.t0 * PPS}px;width:${Math.max(4, (g.t1 - g.t0) * PPS - 1)}px">${esc(g.words.map(w => w.text).join(' '))}</div>`;
  inner.innerHTML = `<div class="ruler" id="ruler">${rul}</div>
    <div class="track" style="top:30px;height:52px" id="trkScenes">${blocks}</div>
    <div class="track" style="top:88px;height:28px">${caps}</div>
    <div class="track" style="top:122px;height:42px"><canvas class="wave" id="wave"></canvas></div>
    <div class="playhead" id="playhead" style="left:${S.t * PPS}px"></div>`;
  drawWave(W);
}
const THUMB_URLS = new Map();
function thumbURL(id) { const c = THUMBS.get(id); if (!c) return ''; if (!THUMB_URLS.has(c)) THUMB_URLS.set(c, c.toDataURL('image/jpeg', .6)); return THUMB_URLS.get(c); }
function drawWave(W) {
  const P = S.project, c = $('#wave'); if (!c) return; const H = 42; c.width = Math.min(16000, Math.round(W)); c.height = H; c.style.width = W + 'px';
  const ctx = c.getContext('2d'); const sx = c.width / W;
  const L = look(P);
  if (P.mode === 'footage' && P.source?.peaks) {
    const pk = P.source.peaks, dur = P.source.duration; let acc = 0;
    ctx.fillStyle = 'rgba(0,210,255,.55)';
    for (const s of P.scenes) {
      if (s.kind === 'clip') for (const [x, y] of keptSegs(P, s)) {
        const n0 = Math.floor(x / dur * pk.length), n1 = Math.ceil(y / dur * pk.length);
        for (let n = n0; n < n1; n++) { const tt = acc + (n / pk.length * dur - x); const px = tt * PPS * sx; const h = Math.max(1, pk[n] * H * .9); ctx.fillRect(px, (H - h) / 2, Math.max(1, PPS * sx * dur / pk.length), h); }
        acc += y - x;
      } else acc += sceneDur(P, s);
    }
  }
  if (P.music.kind !== 'none') { ctx.fillStyle = 'rgba(110,82,255,.28)'; ctx.fillRect(0, H - 10, projectDuration(P) * PPS * sx, 8); ctx.fillStyle = '#cfc6ff'; ctx.font = '10px "JetBrains Mono"'; ctx.fillText(P.music.kind === 'pulse' ? 'BATIDA GERADA' : (P.music.name || 'MÚSICA'), 6, H - 13); }
  if (P.sfx) { let acc = 0; ctx.fillStyle = L.a1; P.scenes.forEach((s, i) => { if (i) { ctx.beginPath(); ctx.arc(acc * PPS * sx, 8, 3, 0, 7); ctx.fill(); } acc += sceneDur(P, s); }); }
}
function highlightSel() { $$('#trkScenes .blk').forEach(b => b.classList.toggle('sel', +b.dataset.i === S.sel)); if (S.view === 'studio' && TAB === 'scene' && !PANE_EDITING) renderPane(); if (S.view === 'board') $$('.card').forEach(c => c.classList.toggle('selected', +c.dataset.i === S.sel)); }
function keepPlayheadVisible() { const tl = $('#tl'); if (!tl) return; const x = S.t * PPS; if (x < tl.scrollLeft || x > tl.scrollLeft + tl.clientWidth - 100) tl.scrollLeft = x - 80; }
function initTimeline() {
  const tl = $('#tl');
  $('#tlZoom').oninput = e => { PPS = +e.target.value; renderTimeline(); };
  tl.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); PPS = clamp(PPS * (e.deltaY < 0 ? 1.15 : .87), 4, 200); $('#tlZoom').value = PPS; renderTimeline(); }, { passive: false });
  const tAt = e => { const r = $('#tlInner').getBoundingClientRect(); return (e.clientX - r.left) / PPS; };
  tl.addEventListener('pointerdown', e => {
    const P = S.project; if (!P) return;
    const h = e.target.closest('[data-h]');
    if (h) {
      const i = +h.closest('.blk').dataset.i, s = P.scenes[i], startX = e.clientX, d0 = s.dur; pushHistory('duração'); tl.setPointerCapture(e.pointerId);
      const mv = ev => { s.dur = clamp(+(d0 + (ev.clientX - startX) / PPS).toFixed(2), 1, 120); markDirty(); renderTimeline(); };
      const up = () => { tl.removeEventListener('pointermove', mv); tl.removeEventListener('pointerup', up); afterChange(); };
      tl.addEventListener('pointermove', mv); tl.addEventListener('pointerup', up); return;
    }
    const blk = e.target.closest('.blk');
    if (blk) { S.sel = +blk.dataset.i; highlightSel(); }
    seek(tAt(e)); tl.setPointerCapture(e.pointerId);
    const mv = ev => seek(tAt(ev));
    const up = () => { tl.removeEventListener('pointermove', mv); tl.removeEventListener('pointerup', up); };
    tl.addEventListener('pointermove', mv); tl.addEventListener('pointerup', up);
  });
  $('#tlPlay').onclick = () => (S.playing ? pause() : play());
  $('#tlSplit').onclick = splitAtPlayhead; $('#tlDup').onclick = duplicateScene; $('#tlDel').onclick = deleteScene;
  $('#tlUndo').onclick = undo; $('#tlRedo').onclick = redo;
  $('#cmdForm').onsubmit = e => { e.preventDefault(); const t = $('#cmdIn').value.trim(); if (t) { $('#cmdIn').value = ''; doCommand(t); } };
  $('#cmdStop').onclick = () => CMD?.abort();
}

/* ---------- modal & export ---------- */
function modal(html) {
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  $('#modalRoot').append(ov); ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-x]')) ov.remove(); });
  setTimeout(() => ov.querySelector('button.primary, input, textarea')?.focus(), 30); return ov;
}
function openExport() {
  const P = S.project; pause();
  const pend = P.scenes.filter(s => s.status !== 'approved').length;
  let quality = 1080, speed = 1;
  const ov = modal(`<h3>Exportar</h3>
    <div class="summary"><div><b>${tc(projectDuration(P))}</b><span>duração</span></div><div><b>${P.aspect}</b><span>formato</span></div><div><b>${P.scenes.length}</b><span>cenas</span></div></div>
    ${pend ? `<p class="notice" style="margin:0">${pend} ${pend === 1 ? 'cena ainda não foi aprovada' : 'cenas ainda não foram aprovadas'}. Dá para exportar assim mesmo.</p>` : ''}
    <div class="field"><span>Qualidade</span><div class="chips" id="exQ"><button class="chip" data-v="1080" aria-pressed="true">1080p</button><button class="chip" data-v="720" aria-pressed="false">720p (mais leve)</button></div></div>
    ${P.mode === 'footage' ? `<div class="field"><span>Velocidade de gravação</span><div class="chips" id="exS"><button class="chip" data-v="1" aria-pressed="true">Normal (tempo real)</button><button class="chip" data-v="2" aria-pressed="false">Rápida 2×</button></div><span class="muted" style="font-size:12px">Seu vídeo é gravado tocando. Mantenha esta aba aberta e visível até terminar.</span></div>` : ''}
    <div id="exProg" hidden style="display:grid;gap:8px"><div class="bar"><i id="exBar"></i></div><div class="mono muted" id="exStage" style="font-size:12px"></div></div>
    <div class="modal-foot">${P.mode !== 'footage' ? '<button class="btn ghost" id="exJson">Salvar projeto</button>' : ''}${P.mode !== 'footage' && !P.narration ? '<p class="notice" style="margin:0;flex-basis:100%">Sem narração no arquivo: a voz do navegador é só prévia. Grave ou gere a voz na aba Áudio.</p>' : ''}<button class="btn ghost" id="exSrt">Legenda .srt</button><button class="btn ghost" data-x id="exClose">Fechar</button><button class="btn primary" id="exGo">Exportar MP4</button></div>`);
  ov.querySelector('#exQ').onclick = e => { const b = e.target.closest('button'); if (!b) return; quality = +b.dataset.v; $$('#exQ button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  ov.querySelector('#exS')?.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.v; $$('#exS button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $('#exSrt').onclick = async () => { const srt = buildSRT(P); if (!srt.trim()) return toast('Não há legenda'); if (await saveFile(`${slug(P.title)}.srt`, srt) === 'saved') toast('Legenda salva'); };
  $('#exJson')?.addEventListener('click', async () => { if (await saveFile(`${slug(P.title)}.moove-studio.json`, snapshot(P)) === 'saved') toast('Projeto salvo'); });
  let blob = null, ctl = null;
  $('#exGo').onclick = async () => {
    if (blob) { const r = await saveFile(`${slug(P.title)}.mp4`, blob); if (r === 'saved') toast('Vídeo salvo'); return; }
    if (ctl) { ctl.abort(); return; }
    if (!exportSupported()) { toast(window.Mp4Muxer ? 'Este navegador não exporta MP4. Use Chrome, Edge ou Safari atualizados.' : 'O módulo de exportação não carregou. Recarregue a página.'); return; }
    ctl = new AbortController(); $('#exProg').hidden = false; $('#exGo').textContent = 'Cancelar'; $('#exGo').classList.remove('primary');
    let wake = null; try { wake = await navigator.wakeLock?.request('screen'); } catch (e) { }
    try {
      blob = await exportMP4(P, { quality, speed, signal: ctl.signal, onProgress: ({ stage, k, eta }) => { $('#exBar').style.width = `${(k * 100).toFixed(1)}%`; $('#exStage').textContent = `${stage} · ${Math.round(k * 100)}%${eta ? ` · faltam ~${fmtDur(eta)}` : ''}`; } });
      $('#exStage').textContent = `Pronto · ${(blob.size / 1048576).toFixed(1)} MB`; $('#exGo').textContent = 'Salvar MP4'; $('#exGo').classList.add('primary');
      const r = await saveFile(`${slug(P.title)}.mp4`, blob); if (r === 'saved') toast('Vídeo salvo');
    } catch (e) {
      $('#exGo').textContent = 'Exportar MP4'; $('#exGo').classList.add('primary'); $('#exProg').hidden = e?.code === 'cancelled';
      $('#exStage').textContent = e?.code === 'cancelled' ? '' : `Falhou: ${e?.message || e}`; if (e?.code !== 'cancelled') console.error(e);
    } finally { ctl = null; wake?.release?.(); S.video && (S.video.muted = false); markDirty(); }
  };
}

/* ---------- keyboard ---------- */
function initKeys() {
  document.addEventListener('keydown', e => {
    if (!S.project || (S.view !== 'board' && S.view !== 'studio') || $('#modalRoot').children.length) return;
    const typing = e.target.closest('input, textarea, select, [contenteditable]');
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { if (typing && e.target.tagName !== 'INPUT') return; e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (typing) return;
    const fps = S.project.fps;
    if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(S.t - (e.shiftKey ? 1 : 1 / fps)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(S.t + (e.shiftKey ? 1 : 1 / fps)); }
    else if (e.key === 'Home') seek(0);
    else if (e.key.toLowerCase() === 's' && S.view === 'studio') splitAtPlayhead();
    else if ((e.key === 'Delete' || e.key === 'Backspace') && S.view === 'studio') deleteScene();
  });
}

/* ---------- boot ---------- */
async function fontsReady() {
  if (S.fontsReady) return;
  const fams = ['800 40px Sora', '500 20px Inter', '700 20px Inter', '400 40px Anton', '900 40px "Big Shoulders Display"', '500 20px "Instrument Sans"', '700 20px "Instrument Sans"', '500 20px "JetBrains Mono"', '800 20px Poppins', '900 20px Poppins', '500 20px Poppins', '800 20px Manrope', '500 20px Manrope', '700 20px Kalam', '400 20px Kalam', '700 20px Fraunces'];
  try { await Promise.race([Promise.all(fams.map(f => document.fonts.load(f))), sleep(2500)]); } catch (e) { }
  S.fontsReady = true; NOISE = null;
}
function boot() {
  initHome(); initBoard(); initInspector(); initTimeline(); initKeys(); initTrends();
  DEMO = demoProject(); sizeDemo();
  $('#brand').onclick = () => show('home');
  $('#steps').onclick = e => { const b = e.target.closest('button[data-go]'); if (b && !b.disabled) show(b.dataset.go); };
  $('#exportBtn').onclick = openExport; $('#undoBtn').onclick = undo;
  $('#projTitle').addEventListener('change', e => { if (S.project) { S.project.title = e.target.value.trim() || 'Sem nome'; afterChange(); } });
  window.addEventListener('resize', () => { if (S.view === 'studio') renderTimeline(); });
  updateAiBadge(); initCapabilities(); initHistory();
  fontsReady().then(markDirty);
  requestAnimationFrame(frame);
  show('home');
}
boot();

/* ============ AI: Claude as director (sample capability) + local fallback ============ */
async function initCapabilities() {
  if (!window.claude?.use) { S.aiState = 'off'; updateAiBadge(); return; }
  try {
    const [smp, dl] = await Promise.all([claude.use('sample'), claude.use('downloads')]);
    S.sample = smp; S.downloads = dl; S.aiState = smp ? 'ready' : 'off';
  } catch (e) { S.aiState = 'off'; }
  updateAiBadge();
}
const AI_ERRORS = {
  not_granted: 'Você não liberou o Claude para este app. Use o modo sem IA ou recarregue a página para liberar.',
  sampling_disabled: 'O Claude não está disponível nesta conta.',
  rate_limited: 'Muitos pedidos seguidos ou limite de uso atingido. Espere um pouco e tente de novo.',
  invalid_json: 'A resposta veio fora do formato. Tente de novo.',
  refused: 'O Claude recusou esse pedido. Reformule e tente outra vez.',
  prompt_too_large: 'O conteúdo ficou grande demais para um pedido. Tente um trecho menor.',
  session_expired: 'Sua sessão expirou. Entre de novo no claude.ai.',
  cancelled: 'Cancelado.',
};
const aiErr = e => AI_ERRORS[e?.code] || 'Falha de conexão com o Claude. Tente de novo.';
function aiAvailable() { return !!S.sample && S.aiState !== 'off' && S.aiState !== 'denied'; }
async function ask(prompt, opts = {}) {
  if (!aiAvailable()) throw { code: 'unavailable' };
  /* never the most expensive tier: scripts on the everyday model with medium thinking, small edits on the fast one */
  const o = { modelTier: 'default', effort: 'medium', ...opts };
  try { return await S.sample.json(prompt, o); }
  catch (e) { if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled'].includes(e?.code)) { S.aiState = 'denied'; updateAiBadge(); } throw e; }
}

const TEMPLATE_GUIDE = `Modelos de cena disponíveis (campo "kind") e suas props ("p"):
- hook: {kicker, text} — abertura de impacto, 3 a 9 palavras. Use *palavra* para destacar UMA palavra.
- title: {kicker, title, sub} — título de capítulo/assunto. title até 7 palavras, sub até 12.
- bullets: {title, items:[string]} — 2 a 5 itens curtos (até 8 palavras cada).
- stat: {value:number, prefix, suffix, label, note} — um número grande que conta. suffix pode ser "%", "x", "h", "mil".
- compare: {title, leftLabel, left:[string], rightLabel, right:[string], verdict} — dois lados, 2-4 itens cada.
- steps: {title, steps:[string]} — processo em 3 a 5 passos curtos.
- chart: {title, unit, bars:[{label, value:number}]} — 2 a 6 barras.
- quote: {quote, author} — frase marcante, até 20 palavras.
- definition: {term, kind, text} — definição de um termo, text até 25 palavras.
- chat: {title, messages:[{from:"a"|"b", text}]} — conversa de 2 a 4 mensagens (bom para mostrar atendimento, bots, exemplos).
- cta: {title, action, handle} — encerramento com chamada para ação.`;

const VIRAL_RULES = `Regras de retenção (formato viral de vídeo narrado):
- GANCHO AGRESSIVO: a 1ª frase (até 8 palavras, falada em até 1,5 s) é a frase mais forte do vídeo inteiro. Use uma destas: começar pelo clímax/resultado final, número chocante, acusação direta a quem assiste ("você está perdendo dinheiro e nem percebe"), ameaça ou consequência séria, segredo proibido, contradição que irrita ("todo mundo faz isso errado"). Chocante mas VERDADEIRO: nada de inventar fatos.
- Proibido no começo: "olá", "oi gente", "neste vídeo", "hoje vou", "você sabia que" morno, contexto, nome do perfil, explicação. Entre direto no conflito.
- A 1ª cena dura no máximo 2,5 s e tem um "text" grande na tela (3 a 5 palavras) que repete o gancho; câmera "shake" ou "push"; clima forte.
- A 2ª cena (até 5 s) AUMENTA A APOSTA e abre um LOOP: diga o que a pessoa perde se sair agora ("e o terceiro é o que mais engana").
- Nos primeiros 15 s, mude algo na tela a cada 2 a 4 s (cenário, câmera, ícone, texto): é aí que a maioria sai.
- Frases curtas e faladas, em segunda pessoa quando der ("você"). Uma ideia por cena. Ritmo rápido: cena nova a cada 2 a 6 segundos.
- A cada 20 a 30 segundos, uma VIRADA ou revelação para segurar a atenção.
- Use números concretos, contrastes (antes/depois, nível 1/nível 10) e consequências.
- Termine fechando o loop do começo e com uma chamada curta (seguir, salvar, comentar).`;


const DOC_GUIDE = `Além das cenas com personagem, você pode usar dois formatos documentais (misture para dar ritmo e realismo):
1) Infográfico documental: {"kind":"doc","say":"...","dur":s,"note":"...","p":{
   "bg":"wall" (parede escura de ripas, acento vermelho) | "night" (azul-noite com brilho âmbar, estilo dossiê de notícia),
   "kicker":"A PRESSÃO" (rótulo do capítulo no canto, opcional),
   "big":{"value":"2","label":"INQUÉRITOS NO SUPREMO"} (número gigante no topo, opcional),
   "items":[ até 4 elementos, escolha os que ilustram a frase:
     {"type":"calendar","weekday":"DOMINGO","day":"18","month":"OUTUBRO"},
     {"type":"screen","badge":"AO VIVO","caption":"DEBATE PRESIDENCIAL","show":"${DOC_SHOWS.join('|')}"},
     {"type":"lock","symbol":"${DOC_SYMBOLS.join('|')}","label":"BANCÁRIO"} (cadeado caindo = bloqueio, sigilo, quebra),
     {"type":"people","count":3,"label":"FAMÍLIAS"},
     {"type":"icon","name":"${DOC_ICONS.join('|')}","label":"..."},
     {"type":"stat","value":"40","suffix":"%","label":"DOS CASOS"},
     {"type":"card","kicker":"INQUÉRITO 1 · STF","title":"Lavagem de dinheiro","text":"uma linha de contexto","footer":"RELATOR: ...","icon":"${DOC_ICONS.join('|')}","tone":"amber|blue|red|gray","want":"foto de <pessoa/lugar>" (opcional: pede uma foto real para o círculo do cartão)},
     {"type":"photo","want":"descrição exata da foto real que o editor deve enviar","label":"legenda curta","grade":"doc|bw|warm|none"} ],
   "crowd":0 a 16 (fileira de bonecos no chão = população, vítimas, eleitores),
   "source":"FONTE · VEÍCULO (DATA)" (linha de fonte em letra de máquina, use quando citar fato real),
   "camera":"push|still"}}
2) Foto real em tela cheia: {"kind":"photo","say":"...","dur":s,"p":{"want":"descrição exata da foto real (pessoa pública, lugar, objeto, documento)","label":"nome ou título curto","kicker":"capítulo","source":"crédito/fonte","grade":"doc|bw|warm|none","move":"in|out|left|right"}}
   O editor envia as fotos depois. Peça fotos reais quando a narração citar pessoas públicas, lugares, empresas ou fatos documentados; descreva a foto com precisão.
Regras de mistura: para histórias de personagem, use "story" na maior parte e "doc"/"photo" para dados, datas, provas e pessoas reais. Para notícia, política, economia e fatos reais, use principalmente "doc" e "photo". Nunca invente fato, número, data ou fonte: se não tiver certeza, deixe "source" vazio e fale de forma geral.`;

const POST_GUIDE = `"post" (pacote de publicação, focado em retenção e conversão): {"titles":["3 títulos diferentes, até 60 caracteres: curiosidade + benefício ou conflito, números quando couber, sem prometer o que o vídeo não entrega"],"cover":"texto da capa, até 5 palavras grandes","caption":"legenda do post: 1ª linha é um gancho que faz parar o scroll; 2 a 3 linhas curtas de valor; termina com CTA que gera comentário (pergunta ou palavra-chave) e salvar/seguir","hashtags":["5 a 8, misture amplas e de nicho, sem #"],"comment":"comentário fixado que puxa conversa"}`;
const COMPACT = 'Escreva o JSON minificado (sem quebras de linha nem espaços extras) e omita campos opcionais vazios e campos com valor padrão (time "day", mood "normal", camera "push" ou "auto", pose "stand", emotion "neutral", prop "none", facing "right", x 0.5, crowd false, note).';
function normPost(x) {
  if (!x || typeof x !== 'object') return null;
  const S = (v, n) => String(v ?? '').trim().slice(0, n);
  const titles = (Array.isArray(x.titles) ? x.titles : [x.title]).map(t => S(t, 90)).filter(Boolean).slice(0, 3);
  return { titles, cover: S(x.cover, 60), caption: S(x.caption, 1200), hashtags: (Array.isArray(x.hashtags) ? x.hashtags : String(x.hashtags || '').split(/[\s,]+/)).map(h => S(h, 40).replace(/^#/, '')).filter(Boolean).slice(0, 10), comment: S(x.comment, 300) };
}
async function genPost(P, signal) {
  const lines = P.scenes.map(s => (s.say || sceneLabel(s) || '').replace(/\*/g, '')).filter(Boolean).join(' ').slice(0, 3500);
  const r = await ask(`Vídeo curto em português do Brasil chamado "${P.title}" (${tc(projectDuration(P))}, formato ${P.aspect}). Roteiro: ${lines}
Monte o pacote de publicação para viralizar em Reels, TikTok e Shorts.
${POST_GUIDE}
${COMPACT} Responda só com o objeto do "post".`, { signal, modelTier: 'quick', cache: false });
  return normPost(r?.post || r);
}

const LOOK_IDS = Object.keys(LOOKS);

function normList(v, max = 6) { return (Array.isArray(v) ? v : String(v || '').split('\n')).map(x => String(typeof x === 'object' ? x.text ?? x.label ?? '' : x).trim()).filter(Boolean).slice(0, max); }
function normalizeScene(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let kind = String(raw.kind || '').toLowerCase();
  if (!TEMPLATES[kind] || kind === 'clip') kind = 'title';
  const p = { ...(raw.p || raw.props || {}) };
  if (kind === 'doc' || kind === 'photo') {
    const s = newScene(kind); s.p = kind === 'doc' ? normDoc(p) : normPhoto(p); s.say = String(raw.say || '').slice(0, 400); s.note = String(raw.note || '').slice(0, 200);
    const d = Number(raw.dur); s.dur = clamp(Math.max(isFinite(d) && d > 0 ? d : 0, sayDur(s.say)), 1.5, 20); return s;
  }
  if (kind === 'obj') {
    const s = newScene('obj'); s.p = normObj(p); s.say = String(raw.say || '').slice(0, 400); s.note = String(raw.note || '').slice(0, 200);
    const d = Number(raw.dur); s.dur = clamp(Math.max(isFinite(d) && d > 0 ? d : 0, sayDur(s.say)), 1.5, 20); return s;
  }
  if (kind === 'talk') {
    const s = newScene('talk'); s.p = normTalk(p); if (!s.p.lines.length) return null; s.note = String(raw.note || '').slice(0, 200); s.dur = +talkDur(s.p).toFixed(2); return s;
  }
  if (kind === 'story') {
    const s = newScene('story'); s.p = normStory(p); s.say = String(raw.say || '').slice(0, 400); s.note = String(raw.note || '').slice(0, 200);
    const d = Number(raw.dur); s.dur = clamp(Math.max(isFinite(d) && d > 0 ? d : 0, sayDur(s.say)), 1.5, 20); return s;
  }
  const s = newScene(kind);
  for (const [k] of TEMPLATES[kind].fields) if (p[k] != null) s.p[k] = p[k];
  if (kind === 'bullets') s.p.items = normList(p.items, 6);
  if (kind === 'steps') s.p.steps = normList(p.steps, 6);
  if (kind === 'compare') { s.p.left = normList(p.left, 5); s.p.right = normList(p.right, 5); }
  if (kind === 'chart') s.p.bars = (Array.isArray(p.bars) ? p.bars : []).map(b => ({ label: String(b.label ?? b.name ?? ''), value: Number(b.value) || 0 })).filter(b => b.label).slice(0, 7);
  if (kind === 'chat') s.p.messages = (Array.isArray(p.messages) ? p.messages : []).map(m => ({ from: m.from === 'b' ? 'b' : 'a', text: String(m.text || '') })).filter(m => m.text).slice(0, 6);
  if (kind === 'stat') s.p.value = Number(String(p.value).replace(',', '.')) || 0;
  s.say = String(raw.say || '').slice(0, 400);
  s.note = String(raw.note || '').slice(0, 200);
  const d = Number(raw.dur);
  s.dur = clamp(Math.max(isFinite(d) && d > 0 ? d : defaultDur(kind, s.p), s.say ? sayDur(s.say) : 0), 2, 30);
  return s;
}

/* ---------- F01: plan an explainer ---------- */
async function planExplainer(brief, opt, signal, onText) {
  const target = opt.seconds, n = Math.max(3, Math.round(target / 5.5));
  const prompt = `Você é diretor de motion design e roteirista de vídeos curtos educativos em português do Brasil.
Crie o roteiro de um vídeo explicativo animado (motion graphics, sem pessoas filmadas) a partir deste briefing:

"""${brief}"""

Formato: ${opt.aspect}. Duração alvo: cerca de ${target} segundos (aproximadamente ${n} cenas). Tom: ${opt.tone}.

${TEMPLATE_GUIDE}
${OBJ_GUIDE}
${CINE_GUIDE}
Cena com personagem (opcional, para dar emoção): {"kind":"story","say":"..","p":{"place":"office|room|street|shop|..","hero":{"who":"hero","pose":"stand|point|think|celebrate|sad|scared","emotion":"neutral|happy|worried|shocked|angry","shot":"close|medium|wide"},"text":"até 4 palavras"}}

Regras:
- EXPLIQUE MOSTRANDO: pelo menos metade das cenas deve ser "obj" (o recibo, a conversa, o preço, a comparação) ou modelos com dados; alterne com personagem reagindo.
- Comece com "hook" e termine com "cta".
- Varie os modelos; não repita o mesmo modelo duas vezes seguidas.
- Textos na tela curtos; quem conta a história é a narração.
- "say" é a NARRAÇÃO falada da cena (vira voz e legenda). Obrigatória em todas as cenas, 1 a 2 frases.
- "dur" em segundos: o tempo para falar o "say" (cerca de 2,5 palavras por segundo), mínimo 2,5. A soma deve ficar perto da duração alvo.
${VIRAL_RULES}
- Números: use apenas dados que você tem segurança de serem verdadeiros e amplamente conhecidos. Se for um exemplo ilustrativo, deixe isso claro no "note" da cena ou escreva "exemplo" no label.
- "note": uma linha explicando a intenção da cena para o editor aprovar.

${POST_GUIDE}
${COMPACT}
Responda somente com JSON neste formato:
{"title":"título curto do vídeo","post":{...},"scenes":[{"kind":"hook","dur":3,"say":"...","note":"...","p":{...}}]}`;
  const r = await ask(prompt, { signal, onText, cache: false });
  const scenes = (r?.scenes || []).map(normalizeScene).filter(Boolean);
  if (!scenes.length) throw { code: 'invalid_json' };
  return { title: String(r.title || '').slice(0, 80), scenes, post: normPost(r.post) };
}

/* ---------- Narração com imagem (illustrated narrated story) ---------- */
const STORY_GUIDE = `Cada cena é uma ilustração animada com um personagem. Formato de cada cena:
{"say":"narração falada (1 a 2 frases curtas)","dur":segundos,"note":"intenção",
 "p":{"place":"${PLACES.join('|')}","time":"day|dusk|night",
      "hero":{"who":"<id do elenco>","shot":"close|medium|wide","pose":"${POSES.join('|')}","emotion":"${EMOTIONS.join('|')}","prop":"${PROPS.join('|')}","x":0.5,"facing":"right|left"},
      "extras":[{"who":"<id>","pose":"...","emotion":"...","prop":"...","x":0.8}],
      "crowd":false, "camera":"${CAMERAS.join('|')}", "mood":"${MOODS.join('|')}",
      "label":"NÍVEL 3 · GERENTE",
      "text":"até 5 palavras com *destaque*",
      "money":"R$ 3.000/mês",
      "icon":"${ICONS.filter(Boolean).join('|')}"}}
Campos opcionais: extras (0 a 2 coadjuvantes), label (rótulo de etapa/capítulo, use em vídeos de níveis), text (só em momentos fortes), money (etiqueta de valor), icon.
Direção de arte: o protagonista ("hero") aparece em quase todas as cenas e reage com emoção ao que a narração diz. Mude o cenário quando a história muda de lugar. Use pose "walk" ou "run" para movimento, "point" para explicar, "think" para dúvida, "celebrate" para conquista, "sad"/"scared" para consequência. mood "danger" para perigo, "flashback" para passado, "hope" para virada boa, "tense" para suspense. Câmera "push" aproxima e dá tensão; "shake" para impacto. Armas podem aparecer quando o roteiro pede (prop "gun" ou set "guns_table"), mas nunca disparo, sangue ou violência gráfica: mostre a tensão com emoção, cenário e clima.
Campo opcional "set":[...] com objetos de fundo.
"shot": "close" = rosto enorme reagindo (use em choque, dúvida, piada, ~1 a cada 3 cenas), "medium" = da cintura para cima, "wide" = corpo inteiro no cenário. Varie o enquadramento como num desenho animado.
${SET_GUIDE}
${THING_GUIDE}
${OBJ_GUIDE}
${CINE_GUIDE}`;
const CAST_GUIDE = `Elenco: defina de 2 a 5 personagens que se repetem no vídeo (ids curtos; o protagonista tem id "hero"):
[{"id":"hero","name":"...","skin":"s1|s2|s3|s4|s5 (s1 mais claro, s5 mais escuro)","hair":"${HAIRS.join('|')}","hairColor":"#hex","beard":"none|stubble|beard","top":"${TOPS.join('|')}","topColor":"#hex","pants":"#hex","accessory":"${ACCS.join('|')}","print":"estampa curta da camiseta (opcional, ex.: CORRIDA 10K/2019)","capText":"texto do boné se hair=cap (opcional)","capBrand":"id de marca do canal (opcional)","shirtBrand":"id de marca do canal (opcional)"}]`;

async function planStory(brief, opt, signal, onText, onChapter) {
  const target = opt.seconds;
  const base = `Você é roteirista e diretor de vídeos narrados virais em português do Brasil (estilo canais de animação com personagem, como "como é ser cada cargo de..." ou "o que acontece se...").
Tema pedido: "${brief}"
Formato: ${opt.aspect}. Tom: ${opt.tone}.
${VIRAL_RULES}`;
  if (target <= 150) {
    const prompt = `${base}
Duração alvo: cerca de ${target} segundos (aproximadamente ${Math.round(target / 3.6)} cenas).
${CAST_GUIDE}
${STORY_GUIDE}
${DOC_GUIDE}
"dur" = tempo para falar o "say" (cerca de 2,5 palavras por segundo), entre 2 e 7 s.
${POST_GUIDE}
${COMPACT}
Responda somente com JSON: {"title":"título curto e chamativo","post":{...},"cast":[...],"scenes":[...]}`;
    const r = await ask(prompt, { signal, onText, cache: false });
    const scenes = (r?.scenes || []).map(x => normalizeScene({ ...x, kind: ['doc', 'photo', 'obj'].includes(x?.kind) ? x.kind : 'story' })).filter(Boolean);
    if (!scenes.length) throw { code: 'invalid_json' };
    return { title: String(r.title || '').slice(0, 80), cast: normCast(r.cast), scenes, post: normPost(r.post) };
  }
  const nCh = clamp(Math.round(target / 75), 3, 14);
  onChapter?.(-1, nCh, 'Planejando os capítulos');
  const outline = await ask(`${base}
Duração alvo: cerca de ${Math.round(target / 60)} minutos. Planeje em ${nCh} capítulos que mantenham a curiosidade até o fim (do mais leve ao mais intenso, ou do nível mais baixo ao mais alto).
${CAST_GUIDE}
${POST_GUIDE}
${COMPACT}
Responda somente com JSON: {"title":"título curto e chamativo","post":{...},"cast":[...],"chapters":[{"title":"...","label":"rótulo curto para a tela, ex.: NÍVEL 1 · OLHEIRO (ou vazio)","beats":"o que acontece e qual a virada","seconds":número}]}`, { signal, cache: false });
  const cast = normCast(outline?.cast); const chapters = (outline?.chapters || []).slice(0, 16);
  if (!chapters.length) throw { code: 'invalid_json' };
  const scenes = []; let prevSummary = 'Este é o começo do vídeo.';
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i]; onChapter?.(i, chapters.length, ch.title);
    const secs = clamp(Number(ch.seconds) || target / chapters.length, 20, 240);
    const r = await ask(`${base}
Título do vídeo: "${outline.title}". Elenco já definido (use estes ids): ${JSON.stringify(cast.map(c => ({ id: c.id, name: c.name })))}.
Roteiro geral: ${chapters.map((c, j) => `${j + 1}. ${c.title}`).join(' / ')}.
Escreva agora SÓ o capítulo ${i + 1} de ${chapters.length}: "${ch.title}". ${ch.label ? `Use "label":"${ch.label}" na primeira cena do capítulo.` : ''} O que acontece: ${ch.beats || ''}.
Onde paramos: ${prevSummary}
${i === 0 ? 'Comece com o gancho e o loop aberto.' : 'Não repita o gancho; continue a história e termine o capítulo puxando para o próximo.'}${i === chapters.length - 1 ? ' Este é o último capítulo: feche o loop do começo e termine com a chamada curta.' : ''}
Duração do capítulo: cerca de ${Math.round(secs)} segundos (aproximadamente ${Math.round(secs / 3.6)} cenas).
${STORY_GUIDE}
${DOC_GUIDE}
${COMPACT}
Responda somente com JSON: {"summary":"uma frase sobre como o capítulo terminou","scenes":[...]}`, { signal, onText, cache: false });
    const sc = (r?.scenes || []).map(x => normalizeScene({ ...x, kind: ['doc', 'photo', 'obj'].includes(x?.kind) ? x.kind : 'story' })).filter(Boolean);
    scenes.push(...sc); prevSummary = String(r?.summary || ch.title);
  }
  if (!scenes.length) throw { code: 'invalid_json' };
  return { title: String(outline.title || '').slice(0, 80), cast, scenes, post: normPost(outline.post) };
}
function localStory(brief, opt) {
  const sents = brief.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const places = ['city', 'street', 'office', 'room', 'favela', 'field'];
  const lines = sents.length >= 3 ? sents : [`Você nunca pensou nisso, mas ${brief.toLowerCase().replace(/[.!?]$/, '')}.`, 'E o que acontece depois vai te surpreender.', 'Tudo começa com uma decisão pequena.', 'Que muda tudo.', 'Salva esse vídeo e manda para quem precisa ver.'];
  const scenes = lines.slice(0, 40).map((say, i) => { const s = newScene('story'); s.say = say; s.dur = sayDur(say); s.p = normStory({ place: places[i % places.length], time: i % 3 === 2 ? 'night' : 'day', camera: i % 2 ? 'push' : 'panR', hero: { pose: ['point', 'think', 'walk', 'stand', 'celebrate'][i % 5], emotion: ['shocked', 'worried', 'neutral', 'confident', 'happy'][i % 5] } }); s.note = 'Gerado sem IA a partir do texto. Ajuste no painel.'; return s; });
  return { title: (sents[0] || brief).slice(0, 40), cast: structuredClone(DEFAULT_CAST), scenes };
}

async function redoScene(P, idx, note, signal) {
  const s = P.scenes[idx];
  const ctx = P.scenes.map((x, i) => `${i + 1}. ${x.kind}: ${sceneLabel(x)}`).join('\n');
  const prompt = `Você é diretor de motion design. Este é o roteiro de um vídeo explicativo em português do Brasil sobre: "${P.brief || P.title}".
Cenas:
${ctx}

Refaça a cena ${idx + 1} (atual: ${JSON.stringify({ kind: s.kind, dur: s.dur, say: s.say, p: s.p })}).
Pedido do editor: "${note || 'deixe mais forte, mais claro e mais visual'}".
${s.kind === 'doc' || s.kind === 'photo' ? `Mantenha um formato documental (doc ou photo).
${DOC_GUIDE}` : s.kind === 'story' ? `Mantenha o formato de cena narrada ilustrada (kind "story"). Elenco: ${JSON.stringify((P.cast || []).map(c => ({ id: c.id, name: c.name })))}.
${STORY_GUIDE}` : s.kind === 'talk' ? `Mantenha o formato de diálogo (kind "talk"). Elenco: ${nvCastBrief(P.cast || [])}.
${TALK_GUIDE}
${SET_GUIDE}` : `Você pode trocar o modelo se fizer sentido.

${TEMPLATE_GUIDE}`}
${VIRAL_RULES}

${COMPACT}
Responda somente com JSON: {"kind":"...","dur":number,"say":"...","note":"...","p":{...}}`;
  const r = await ask(prompt, { signal, cache: false, modelTier: 'quick' });
  const ns = normalizeScene(r); if (!ns) throw { code: 'invalid_json' };
  return ns;
}

/* ---------- F02: plan edits over the user's footage ---------- */
function transcriptLines(P, maxChars = 60000) {
  const lines = []; let cur = null;
  for (const w of P.words) {
    if (!cur || w.t0 - cur.t1 > .7 || cur.text.length > 120 || /[.!?]$/.test(cur.text)) { if (cur) lines.push(cur); cur = { t0: w.t0, t1: w.t1, text: w.text }; }
    else { cur.text += ' ' + w.text; cur.t1 = w.t1; }
  }
  if (cur) lines.push(cur);
  let out = lines.map(l => `[${l.t0.toFixed(1)}-${l.t1.toFixed(1)}] ${l.text}`).join('\n');
  if (out.length > maxChars) out = out.slice(0, maxChars) + '\n[...]';
  return out;
}
async function planFootage(P, wishes, signal, onText) {
  const dur = P.source.duration;
  const prompt = `Você é editor de vídeo de criadores de conteúdo brasileiros (estilo Reels/TikTok/YouTube) e vai editar um vídeo gravado pelo usuário.
Duração do bruto: ${dur.toFixed(1)} s. Formato final: ${P.aspect}.
Pedido do usuário: "${wishes || 'edição dinâmica, profissional, com títulos e destaques quando ajudar'}".

Transcrição com tempos em segundos:
${transcriptLines(P) || '(sem transcrição)'}

Divida o vídeo em cenas na ordem original. Cada cena é um trecho contínuo do bruto: "in" e "out" em segundos, cortando em fins de frase, de 3 a 15 s cada.
- Pule erros, repetições, falsos começos e respiros longos: basta não incluir esses trechos em nenhuma cena.
- "zoom": 0 (normal), 1 (aproximação lenta) ou 2 (corte seco aproximado). Alterne para dar ritmo; use 2 em frases de impacto.
- "overlay" é opcional (use em cerca de uma cena a cada três):
  {"kind":"headline","at":segundos dentro da cena,"dur":2-4,"p":{"text":"até 6 palavras com *destaque*"}}
  {"kind":"lower","at":0.3,"dur":3,"p":{"name":"...","role":"..."}} — só se a pessoa se apresentar.
  {"kind":"stat","at":...,"dur":3,"p":{"value":number,"prefix":"","suffix":"%","label":"..."}} — só se um número for dito.
  {"kind":"bullets","at":...,"dur":4,"p":{"title":"...","items":["...","..."]}} — quando a pessoa listar coisas.
  {"kind":"broll","at":...,"dur":3-5,"p":{"kind":"<modelo>", ...props do modelo}} — tela animada cobrindo o vídeo enquanto a voz continua; use para ilustrar um conceito. ${TEMPLATE_GUIDE.replace('Modelos de cena disponíveis (campo "kind") e suas props ("p"):', 'Modelos aceitos dentro de broll:')}
- "note": uma linha dizendo o que você fez na cena.
- A primeira cena deve ter um "headline" de gancho se o começo do vídeo não prender atenção sozinho.

${POST_GUIDE}
${COMPACT}
Responda somente com JSON:
{"title":"título curto","post":{...},"scenes":[{"in":0.0,"out":6.2,"zoom":0,"note":"...","overlay":null}]}`;
  const r = await ask(prompt, { signal, onText, cache: false });
  const scenes = (r?.scenes || []).map(x => normalizeClip(x, dur)).filter(Boolean).sort((a, b) => a.src.in - b.src.in);
  if (!scenes.length) throw { code: 'invalid_json' };
  return { title: String(r.title || '').slice(0, 80), scenes, post: normPost(r.post) };
}
function normalizeOverlay(o) {
  if (!o || typeof o !== 'object' || !OVERLAYS[o.kind]) return null;
  const out = { kind: o.kind, at: Math.max(0, Number(o.at) || 0), dur: clamp(Number(o.dur) || 3, 1, 12), p: { ...(o.p || {}) } };
  if (o.kind === 'broll') { const inner = normalizeScene({ kind: o.p?.kind, p: o.p }); if (!inner) return null; out.p = { ...inner.p, kind: inner.kind }; }
  if (o.kind === 'bullets') out.p.items = normList(out.p.items, 5);
  if (o.kind === 'stat') out.p.value = Number(out.p.value) || 0;
  return out;
}
function normalizeClip(x, dur) {
  let a = clamp(Number(x?.in), 0, dur), b = clamp(Number(x?.out), 0, dur);
  if (!(b - a > .3)) return null;
  const s = newScene('clip'); s.src = { in: a, out: b }; s.dur = b - a;
  s.zoom = [0, 1, 2].includes(Number(x.zoom)) ? Number(x.zoom) : 0;
  s.overlay = normalizeOverlay(x.overlay); s.note = String(x.note || '').slice(0, 200);
  return s;
}

/* ---------- F03: natural-language commands → operations ---------- */
function projectSummary(P, text = '') {
  const nums = new Set([...String(text).matchAll(/\b(?:cena|cenas|scene)\s*(\d+)/gi)].map(m => +m[1]));
  for (const m of String(text).matchAll(/\b(\d+)\s*(?:e|,)\s*(\d+)/g)) { if (nums.size) { nums.add(+m[1]); nums.add(+m[2]); } }
  const all = /tod[ao]s|cada cena|geral|inteir/i.test(text) && P.scenes.length <= 25;
  return {
    mode: P.mode, aspect: P.aspect, look: P.look, duration: +projectDuration(P).toFixed(1),
    cast: P.mode === 'story' ? (P.cast || []).map(c => c.id) : undefined, captions: { on: P.captions.on, preset: P.captions.preset },
    scenes: P.scenes.map((s, i) => {
      const full = all || nums.has(i + 1), o = { n: i + 1, kind: s.kind, dur: +sceneDur(P, s).toFixed(1) };
      if (s.kind === 'clip') Object.assign(o, { in: +s.src.in.toFixed(1), out: +s.src.out.toFixed(1), zoom: s.zoom || 0 }, full ? { overlay: s.overlay } : { overlay: s.overlay?.kind || undefined });
      else Object.assign(o, full ? { say: s.say, p: s.p } : { say: String(s.say || sceneLabel(s)).slice(0, 70) });
      return o;
    }),
  };
}
async function runCommand(P, text, signal, onText) {
  const prompt = `Você é o editor dentro de um app de edição de vídeo. Aplique o pedido do usuário ao projeto devolvendo uma lista de operações.
Projeto atual (cenas numeradas a partir de 1; tempos em segundos):
${JSON.stringify(projectSummary(P, text))}
(Cenas sem "p" estão resumidas; para mudar o visual delas use "replace" ou "set" com o valor completo.)

Pedido: "${text}"

Operações possíveis:
{"op":"set","scene":n,"key":"<prop>","value":...}       // muda uma prop de cena (p.title, p.items...). Use key "say" para narração.
{"op":"dur","scene":n,"value":segundos}
{"op":"delete","scene":n}
{"op":"move","scene":n,"to":m}
{"op":"insert","at":n,"scene":{"kind":"...","dur":5,"say":"...","p":{...}}}   // insere antes da posição n (use total+1 para o fim)
{"op":"replace","scene":n,"with":{"kind":"...","dur":5,"say":"...","p":{...}}}
{"op":"caption","key":"on|preset|pos|upper|words|accent","value":...}   // presets: ${Object.keys(CAPTION_PRESETS).join(', ')}; pos 0.1 (topo) a 0.9 (base); accent cor hex
{"op":"look","value":"${LOOK_IDS.join('|')}"}
{"op":"aspect","value":"9:16|1:1|16:9"}
{"op":"project","key":"chrome|progressBar|fit|title","value":...}   // fit: cover|blur
{"op":"music","key":"kind|vol","value":...}   // kind: none|pulse|upload
${P.mode === 'footage' ? `{"op":"cut","from":segundos,"to":segundos}   // remove trecho do vídeo, em tempo do vídeo FINAL
{"op":"trim","scene":n,"in":segundos,"out":segundos}   // ajusta a cena no tempo do vídeo BRUTO
{"op":"zoom","scene":n,"value":0|1|2}
{"op":"overlay","scene":n,"value":{"kind":"headline|lower|stat|bullets|broll","at":0,"dur":3,"p":{...}} ou null}` : ''}

${P.mode === 'story' ? `As cenas deste projeto são narradas e ilustradas (kind "story"). Para mudar personagem/cenário use "set" com key "place", "time", "camera", "mood", "label", "text", "money", "icon", "crowd", "hero" (objeto inteiro) ou "extras" (lista). Ids do elenco: ${JSON.stringify((P.cast || []).map(c => c.id))}. Para mudar a aparência de um personagem: {"op":"castmember","id":"hero","key":"topColor|top|hair|hairColor|skin|beard|accessory|name","value":...}
${STORY_GUIDE}
${P.series || P.scenes.some(x => x.kind === 'talk') ? `Este projeto é uma novelinha: há cenas de diálogo. Para mudar falas use "set" com key "lines" (lista inteira) ou "chars". Elenco: ${nvCastBrief(P.cast || [])}.\n${TALK_GUIDE}` : ''}
${DOC_GUIDE}` : TEMPLATE_GUIDE + '\n' + DOC_GUIDE}

${COMPACT}
Responda somente com JSON: {"reply":"uma frase curta em português dizendo o que você fez","ops":[...]}
Se o pedido não fizer sentido para o projeto, devolva ops vazia e explique em reply.`;
  return ask(prompt, { signal, onText, cache: false, effort: 'low' });
}
function applyOps(P, ops) {
  const n = i => clamp(Math.round(Number(i)) - 1, 0, P.scenes.length - 1);
  let applied = 0;
  for (const o of ops || []) {
    try {
      switch (o.op) {
        case 'set': { const s = P.scenes[n(o.scene)]; if (s.kind === 'talk') { const nk = String(o.key).replace(/^p\./, ''); s.p = normTalk({ ...s.p, [nk]: o.value }); if (!P.narration) s.dur = +talkDur(s.p).toFixed(2); applied++; break; } if (s.kind === 'doc' && o.key !== 'say') { s.p = normDoc({ ...s.p, [String(o.key).replace(/^p\./, '')]: o.value }); applied++; break; } if (s.kind === 'photo' && o.key !== 'say') { s.p = normPhoto({ ...s.p, [String(o.key).replace(/^p\./, '')]: o.value }); applied++; break; } if (o.key === 'say') { s.say = String(o.value); s.dur = Math.max(s.dur, sayDur(s.say)); } else s.p[String(o.key).replace(/^p\./, '')] = o.value; if (s.kind === 'story') s.p = normStory(s.p); applied++; break; }
        case 'dur': { const s = P.scenes[n(o.scene)]; if (s.kind !== 'clip') { s.dur = clamp(Number(o.value) || s.dur, 1, 60); applied++; } break; }
        case 'delete': if (P.scenes.length > 1) { P.scenes.splice(n(o.scene), 1); applied++; } break;
        case 'move': { const [s] = P.scenes.splice(n(o.scene), 1); P.scenes.splice(clamp(Math.round(o.to) - 1, 0, P.scenes.length), 0, s); applied++; break; }
        case 'insert': { const s = normalizeScene(P.mode === 'story' && !['doc', 'photo', 'talk', 'obj'].includes(o.scene?.kind) ? { ...(o.scene || {}), kind: 'story' } : o.scene); if (s) { P.scenes.splice(clamp(Math.round(o.at) - 1, 0, P.scenes.length), 0, s); applied++; } break; }
        case 'replace': { const s = normalizeScene({ ...(o.with || {}), kind: P.mode === 'story' && !['doc', 'photo', 'talk', 'obj'].includes(o.with?.kind) ? 'story' : o.with?.kind }); if (s) { P.scenes[n(o.scene)] = s; applied++; } break; }
        case 'caption': if (o.key in P.captions) { P.captions[o.key] = o.value; applied++; } break;
        case 'look': if (LOOKS[o.value]) { P.look = o.value; applied++; } break;
        case 'aspect': if (ASPECTS[o.value]) { P.aspect = o.value; applied++; } break;
        case 'project': if (['chrome', 'progressBar', 'fit', 'title'].includes(o.key)) { P[o.key] = o.value; applied++; } break;
        case 'music': if (o.key === 'kind' && ['none', 'pulse', 'upload'].includes(o.value)) { P.music.kind = o.value; applied++; } if (o.key === 'vol') { P.music.vol = clamp(Number(o.value), 0, 1); applied++; } break;
        case 'cut': if (P.mode === 'footage') { const a = locate(P, Number(o.from)), b = locate(P, Number(o.to)); if (a?.src != null && b?.src != null && b.src > a.src) { P.manualCuts = [...(P.manualCuts || []), [a.src, b.src]]; applied++; } } break;
        case 'trim': { const s = P.scenes[n(o.scene)]; if (s.kind === 'clip') { const d = P.source.duration; s.src.in = clamp(Number(o.in ?? s.src.in), 0, d); s.src.out = clamp(Number(o.out ?? s.src.out), s.src.in + .3, d); applied++; } break; }
        case 'castmember': { const c = (P.cast || []).find(x => x.id === o.id); if (c && o.key in c) { c[o.key] = o.value; applied++; } break; }
        case 'zoom': { const s = P.scenes[n(o.scene)]; s.zoom = Number(o.value) || 0; applied++; break; }
        case 'overlay': { const s = P.scenes[n(o.scene)]; s.overlay = o.value ? normalizeOverlay(o.value) : null; applied++; break; }
      }
    } catch (e) { console.warn('op failed', o, e); }
  }
  return applied;
}

/* ---------- F05: viral clips ---------- */
async function findClips(P, signal) {
  const prompt = `Você é especialista em cortes virais para Reels, TikTok e Shorts.
Transcrição de um vídeo em português (tempos em segundos):
${transcriptLines(P)}

Encontre até 6 trechos que funcionam sozinhos como vídeos curtos de 15 a 60 s. Cada trecho deve começar com uma frase que prenda atenção e terminar com a ideia completa.
Dê uma nota de 0 a 99 considerando: força do gancho nos 3 primeiros segundos, fluxo (começo, meio e fim), valor para quem assiste e potencial de compartilhamento.
Responda somente com JSON: {"clips":[{"start":0,"end":30,"score":82,"title":"título do corte","hook":"frase de abertura","why":"uma linha"}]}`;
  const r = await ask(prompt, { signal });
  return (r?.clips || []).map(c => ({ start: Number(c.start) || 0, end: Number(c.end) || 0, score: clamp(Math.round(Number(c.score) || 0), 0, 99), title: String(c.title || ''), hook: String(c.hook || ''), why: String(c.why || '') })).filter(c => c.end - c.start > 3).sort((a, b) => b.score - a.score);
}

/* ---------- local fallback (no Claude) ---------- */
function localExplainer(brief, opt) {
  const clean = brief.replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/(?<=[.!?;])\s+|\n/).map(s => s.trim()).filter(Boolean);
  const topic = (sentences[0] || clean || 'Seu assunto').replace(/[.!?]$/, '').slice(0, 60);
  const words = topic.split(' ').slice(0, 7);
  const scenes = [
    newScene('hook', { kicker: 'Em poucos segundos', text: words.length > 2 ? `${words.slice(0, -1).join(' ')} *${words[words.length - 1]}*` : `*${topic}*` }),
    newScene('title', { kicker: 'O assunto', title: topic, sub: sentences[1] || 'O essencial, direto ao ponto' }),
  ];
  const rest = sentences.slice(2);
  if (rest.length >= 3) scenes.push(newScene('bullets', { title: 'Pontos principais', items: rest.slice(0, 4).map(s => s.slice(0, 60)) }));
  else scenes.push(newScene('definition', { term: words.slice(0, 3).join(' '), kind: 'conceito', text: (sentences[1] || clean).slice(0, 140) }));
  scenes.push(newScene('steps', { title: 'Na prática', steps: ['Entenda o problema', 'Teste uma solução', 'Meça o resultado', 'Ajuste e repita'] }));
  scenes.push(newScene('cta', { title: 'Gostou? Salva e manda para alguém', action: 'Seguir para mais', handle: '@moove.ia' }));
  const scale = opt.seconds / scenes.reduce((a, s) => a + s.dur, 0);
  if (scale > 1.3) scenes.forEach(s => (s.dur = clamp(s.dur * Math.min(scale, 1.8), 3, 12)));
  scenes.forEach(s => (s.note = 'Gerado sem IA a partir do briefing. Edite os textos no painel.'));
  return { title: topic.slice(0, 40), scenes };
}
function localFootagePlan(P) {
  /* split on silences into ~4-10 s scenes, alternate zoom for rhythm */
  const d = P.source.duration, sil = P.silences;
  const bounds = [0];
  for (const [a, b] of sil) { const mid = (a + b) / 2; if (mid - bounds[bounds.length - 1] > 4) bounds.push(mid); }
  if (d - bounds[bounds.length - 1] < 2 && bounds.length > 1) bounds.pop();
  bounds.push(d);
  const scenes = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    let a = bounds[i], b = bounds[i + 1];
    while (b - a > 12) { const s = newScene('clip'); s.src = { in: a, out: a + 8 }; s.zoom = scenes.length % 3 === 1 ? 1 : scenes.length % 3 === 2 ? 2 : 0; scenes.push(s); a += 8; }
    const s = newScene('clip'); s.src = { in: a, out: b }; s.zoom = scenes.length % 3 === 1 ? 1 : scenes.length % 3 === 2 ? 2 : 0; scenes.push(s);
  }
  scenes.forEach(s => (s.note = 'Corte automático pelas pausas da fala.'));
  return scenes;
}
function sceneLabel(s) {
  const p = s.p || {};
  if (s.kind === 'doc' || s.kind === 'photo') return String(s.say || p.want || p.kicker || 'Cena').replace(/\*/g, '');
  if (s.kind === 'story') return String(s.say || p.text || p.label || 'Cena narrada').replace(/\*/g, '');
  if (s.kind === 'obj') return String(s.say || p.title || OBJ_TYPES[p.item?.type] || 'Objeto').replace(/\*/g, '');
  if (s.kind === 'talk') return (p.lines || []).map(l => `${l.who === 'narrator' ? 'Narrador' : castOf(S.project, l.who)?.name || l.who}: ${l.text}`).join(' / ') || 'Diálogo';
  if (s.kind === 'clip') return s.overlay?.p?.text || s.overlay?.p?.title || s.note || 'Trecho do vídeo';
  return String(p.text || p.title || p.term || p.quote || (p.value != null ? `${p.prefix || ''}${p.value}${p.suffix || ''} ${p.label || ''}` : '') || TEMPLATES[s.kind]?.name || '').replace(/\*/g, '');
}

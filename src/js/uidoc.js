/* ============ UI for documentary/photo scenes + AI narration (Speko) ============ */
const ITEM_FIELDS = {
  calendar: [['weekday', 'Dia da semana'], ['day', 'Dia'], ['month', 'Mês']],
  screen: [['badge', 'Selo (ex.: AO VIVO)'], ['caption', 'Legenda da tela'], ['show', 'Imagem na tela', { debate: 'Debate', news: 'Jornal', chart: 'Gráfico', crowd: 'Multidão', person: 'Pessoa', map: 'Mapa' }]],
  lock: [['symbol', 'Símbolo', { 'R$': 'R$', phone: 'Celular', doc: 'Documento', house: 'Casa', card: 'Cartão', mail: 'E-mail', car: 'Carro', law: 'Justiça' }], ['label', 'Rótulo']],
  people: [['count', 'Quantidade (1 a 4)'], ['label', 'Rótulo']],
  icon: [['name', 'Ícone', Object.fromEntries(DOC_ICONS.map(i => [i, i]))], ['label', 'Rótulo']],
  stat: [['value', 'Valor'], ['prefix', 'Prefixo'], ['suffix', 'Sufixo'], ['label', 'Rótulo']],
  card: [['kicker', 'Rótulo de cima'], ['title', 'Título'], ['text', 'Texto'], ['footer', 'Rodapé'], ['icon', 'Ícone', Object.fromEntries(DOC_ICONS.map(i => [i, i]))], ['tone', 'Cor', { amber: 'Âmbar', blue: 'Azul', red: 'Vermelho', gray: 'Cinza' }], ['want', 'Foto pedida (opcional)']],
  news: [['site', 'Site / veículo'], ['section', 'Editoria'], ['title', 'Manchete'], ['mark', 'Trecho grifado'], ['sub', 'Linha fina'], ['date', 'Data'], ['url', 'Link da matéria'], ['want', 'Foto da matéria (opcional)']],
  study: [['org', 'Instituição'], ['year', 'Ano'], ['title', 'O que descobriu'], ['value', 'Número'], ['suffix', 'Unidade (%, x, mil)'], ['label', 'Explicação do número']],
  photo: [['want', 'Que foto é'], ['label', 'Legenda'], ['grade', 'Tratamento', { doc: 'Documentário', bw: 'Preto e branco', warm: 'Quente', none: 'Original' }]],
};
const DEFAULT_ITEM = { news: { site: 'PORTAL', section: 'ECONOMIA', title: 'Manchete da matéria', mark: '', sub: '', date: '05/11/2026 · 10h30' }, study: { org: 'Universidade', year: '2026', title: 'O que a pesquisa descobriu', value: '62', suffix: '%', label: 'das pessoas' }, calendar: { weekday: 'DOMINGO', day: '18', month: 'OUTUBRO' }, screen: { badge: 'AO VIVO', caption: 'URGENTE', show: 'news' }, lock: { symbol: 'R$', label: 'BANCÁRIO' }, people: { count: 3, label: 'FAMÍLIAS' }, icon: { name: 'alert', label: 'ALERTA' }, stat: { value: '2', label: 'INQUÉRITOS' }, card: { kicker: 'CASO 1', title: 'Título do cartão', text: 'Uma linha de contexto', footer: '', icon: 'doc', tone: 'amber' }, photo: { want: 'foto do assunto', label: '', grade: 'doc' } };
const ITEM_NAMES = { calendar: 'Calendário', screen: 'Tela de TV', lock: 'Cadeado', people: 'Pessoas', icon: 'Ícone', stat: 'Número', card: 'Cartão-pasta', photo: 'Foto real', news: 'Manchete de matéria', study: 'Pesquisa / estudo' };
function photoInput(scope, idx, has) { return `<label class="btn sm ${has ? '' : 'primary'}" style="cursor:pointer">${has ? 'Trocar foto' : 'Enviar foto'}<input type="file" accept="image/*" class="sr" data-photo="${scope}" data-i="${idx}"></label>`; }
function docPaneHTML(P, s) {
  const p = s.p;
  let h = `<div class="group"><label class="field"><span>Narração</span><textarea class="input" data-k="scene" data-f="say" data-t="text" style="min-height:84px">${esc(s.say || '')}</textarea></label>
    <label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".1" min="1" data-k="scene" data-f="dur" data-t="number" value="${s.dur}"></label></div>`;
  if (s.kind === 'photo') {
    const img = p.img && ASSETS.get(p.img);
    return h + `<div class="group"><h4>Foto real</h4><label class="field"><span>Que foto é</span><input class="input" data-k="pp" data-f="want" value="${esc(p.want)}"></label>
      <div class="chips">${photoInput('scene', -1, !!img)}${img ? `<span class="muted" style="font-size:12px;align-self:center">${esc(img.name)}</span>` : ''}</div>
      <div class="row2"><label class="field"><span>Movimento</span><select class="input" data-k="pp" data-f="move">${opt({ in: 'Aproximar', out: 'Afastar', left: 'Deslizar ←', right: 'Deslizar →' }, p.move)}</select></label>
      <label class="field"><span>Tratamento</span><select class="input" data-k="pp" data-f="grade">${opt({ doc: 'Documentário', bw: 'Preto e branco', warm: 'Quente', none: 'Original' }, p.grade)}</select></label></div>
      <label class="field"><span>Nome na tela</span><input class="input" data-k="pp" data-f="label" value="${esc(p.label)}"></label>
      <label class="field"><span>Rótulo do capítulo</span><input class="input" data-k="pp" data-f="kicker" value="${esc(p.kicker)}"></label>
      <label class="field"><span>Fonte / crédito</span><input class="input" data-k="pp" data-f="source" value="${esc(p.source)}"></label></div>`;
  }
  h += `<div class="group"><h4>Infográfico</h4><div class="row2">
    <label class="field"><span>Fundo</span><select class="input" data-k="pd" data-f="bg">${opt({ wall: 'Parede escura (vermelho)', night: 'Dossiê azul (âmbar)' }, p.bg)}</select></label>
    <label class="field"><span>Câmera</span><select class="input" data-k="pd" data-f="camera">${opt({ push: 'Aproximar', still: 'Parada' }, p.camera)}</select></label></div>
    <label class="field"><span>Rótulo do capítulo</span><input class="input" data-k="pd" data-f="kicker" value="${esc(p.kicker)}"></label>
    <div class="row2"><label class="field"><span>Número gigante</span><input class="input" data-k="pdb" data-f="value" value="${esc(p.big?.value ?? '')}"></label><label class="field"><span>Texto do número</span><input class="input" data-k="pdb" data-f="label" value="${esc(p.big?.label ?? '')}"></label></div>
    <label class="field"><span>Bonecos no chão: ${p.crowd}</span><input type="range" min="0" max="16" step="1" data-k="pd" data-f="crowd" data-t="number" value="${p.crowd}"></label>
    <label class="field"><span>Fonte (letra de máquina)</span><input class="input" data-k="pd" data-f="source" value="${esc(p.source)}"></label></div>`;
  (p.items || []).forEach((it, i) => {
    const has = it.img && ASSETS.get(it.img);
    h += `<div class="group"><div style="display:flex;justify-content:space-between;align-items:center"><h4>Elemento ${i + 1}</h4><button class="btn sm danger" type="button" data-act="itDel" data-i="${i}">Remover</button></div>
      <label class="field"><span>Tipo</span><select class="input" data-act="itType" data-i="${i}">${opt(ITEM_NAMES, it.type)}</select></label>
      ${(ITEM_FIELDS[it.type] || []).map(([k, l, o]) => o ? `<label class="field"><span>${l}</span><select class="input" data-k="di${i}" data-f="${k}">${opt(o, it[k])}</select></label>` : `<label class="field"><span>${l}</span><input class="input" data-k="di${i}" data-f="${k}" value="${esc(it[k] ?? '')}"></label>`).join('')}
      ${it.type === 'photo' || it.type === 'card' ? `<div class="chips">${photoInput('item', i, !!has)}${has ? `<button class="btn sm ghost" type="button" data-act="itNoPhoto" data-i="${i}">Tirar foto</button>` : ''}</div>` : ''}</div>`;
  });
  if ((p.items || []).length < 4) h += `<div class="group"><button class="btn sm" type="button" data-act="itAdd">+ Elemento</button></div>`;
  return h + `<div class="group"><h4>Refazer com o Claude</h4><input class="input" id="paneRedo" placeholder="Ex.: mostre com cadeados e uma TV ao vivo"><button class="btn ai sm" data-act="redo" type="button">Refazer cena</button></div>`;
}
const gNews = q => `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(q)}`, gImg = q => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
const linkBtn = (href, label) => `<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener" style="text-decoration:none">${label}</a>`;
function newsFoundHTML(P) {
  if (!P.newsRefs?.length) return '';
  return `<div class="group"><h4>Notícias reais usadas na pesquisa</h4>${P.newsRefs.map(n => `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span style="font-size:12.5px;min-width:0;overflow-wrap:anywhere">${esc(n.title)} <span class="muted">· ${esc(n.site)} ${esc(n.date)}</span></span>${linkBtn(n.url, 'Abrir')}</div>`).join('')}</div>`;
}
function photosPaneHTML(P) {
  const slots = photoSlots(P); if (!slots.length) return newsFoundHTML(P);
  return `<div class="group"><h4>Fotos reais pedidas</h4><p class="muted" style="margin:0;font-size:12px">Envie cada foto. Use imagens que você tem direito de usar e cite a fonte na cena.</p>
    ${slots.map((sl, k) => { const has = sl.img && ASSETS.get(sl.img); return `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span style="font-size:12.5px;min-width:0;overflow-wrap:anywhere"><b class="mono" style="font-size:11px">${String(sl.i + 1).padStart(2, '0')}</b> ${esc(sl.want || 'foto')} ${has ? '<span style="color:var(--success)">✓</span>' : ''}</span>${photoInput('slot', k, !!has)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:-2px 0 6px">${sl.ref.url ? linkBtn(sl.ref.url, '📰 Abrir matéria') : sl.ref.title ? linkBtn(gNews(sl.ref.title), '📰 Achar matéria') : ''}${linkBtn(gImg(sl.want || sl.ref.title || ''), '🖼️ Achar foto')}</div>`; }).join('')}<p class="muted" style="margin:0;font-size:12px">No celular: toque em Achar foto, segure a imagem, Salvar em Fotos e volte aqui em Enviar foto. Um print da matéria também serve.</p></div>${newsFoundHTML(P)}`;
}
async function handlePhotoInput(el) {
  const P = S.project, file = el.files?.[0]; if (!file) return;
  let id; try { id = await addAsset(file); } catch (e) { return toast('Não consegui abrir essa imagem'); }
  pushHistory('foto');
  const scope = el.dataset.photo, i = +el.dataset.i;
  if (scope === 'scene') P.scenes[S.sel].p.img = id;
  else if (scope === 'item') P.scenes[S.sel].p.items[i].img = id;
  else if (scope === 'slot') photoSlots(P)[i].ref.img = id;
  else if (scope === 'board') { const sl = photoSlots(P).filter(x => x.i === i && !(x.img && ASSETS.get(x.img)))[0] || photoSlots(P).find(x => x.i === i); if (sl) sl.ref.img = id; }
  afterChange(); toast('Foto adicionada');
}
function missingPhotos(P, idx) { return photoSlots(P).filter(x => x.i === idx && !(x.img && ASSETS.get(x.img))).length; }

/* ---------- AI narration through the Speko connector ---------- */
const TTS_VOICES = [
  { id: 'caio', label: 'Caio · masculina, pt-BR (Azure)', body: { voice: 'pt-BR-Caio:MAI-Voice-2.1', constraints: { allowedProviders: { tts: ['azure'] } } } },
  { id: 'luana', label: 'Luana · feminina, pt-BR (Azure)', body: { voice: 'pt-BR-Luana:MAI-Voice-2.1', constraints: { allowedProviders: { tts: ['azure'] } } } },
  { id: 'eleven', label: 'ElevenLabs multilíngue', body: { constraints: { allowedProviders: { tts: ['elevenlabs:eleven_multilingual_v2'] } } } },
];
const TTS_CACHE = new Map();
function b64ToBuf(b64) { const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
async function ttsScene(mcp, text, voice, signal) {
  const key = voice.id + '|' + text; if (TTS_CACHE.has(key)) return TTS_CACHE.get(key);
  const r = await mcp.callTool('Speko', 'audio.synthesize', { body: { text, intent: { language: 'pt-BR', optimizeFor: 'accuracy' }, ...voice.body } }, { signal });
  let pl = r?.payload; if (!pl && r?.content?.[0]?.text) { try { pl = JSON.parse(r.content[0].text); } catch (e) { } }
  if (!pl?.audio_base64) throw { code: 'no_audio', message: 'O conector não devolveu o áudio desta cena (texto longo demais?). Divida a narração em frases menores.' };
  const buf = await audioCtx().decodeAudioData(b64ToBuf(pl.audio_base64));
  TTS_CACHE.set(key, buf); return buf;
}
function sliceBuffer(buf, at, dur) {
  const sr = buf.sampleRate, a = Math.max(0, Math.round(at * sr)), n = Math.max(1, Math.min(buf.length - a, Math.round(dur * sr)));
  const out = audioCtx().createBuffer(1, n, sr); out.getChannelData(0).set(buf.getChannelData(0).subarray(a, a + n)); return out;
}
function concatBuffers(parts, total, sr) {
  const out = audioCtx().createBuffer(1, Math.max(1, Math.ceil(total * sr)), sr), d = out.getChannelData(0);
  for (const { buf, at } of parts) {
    const src = buf.numberOfChannels > 1 ? (() => { const a = buf.getChannelData(0), b = buf.getChannelData(1), m = new Float32Array(a.length); for (let i = 0; i < a.length; i++) m[i] = (a[i] + b[i]) / 2; return m; })() : buf.getChannelData(0);
    const ratio = buf.sampleRate / sr, off = Math.round(at * sr), n = Math.floor(src.length / ratio);
    for (let i = 0; i < n && off + i < d.length; i++) d[off + i] += src[Math.floor(i * ratio)];
  }
  return out;
}
function openAiVoice() {
  const P = S.project, clean = t => String(t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  const units = [];
  P.scenes.forEach((s, i) => {
    if (s.kind === 'talk') s.p.lines.forEach((l, j) => { const text = clean(l.text); if (text) units.push({ i, j, text, who: l.who }); });
    else { const text = clean(s.say); if (text) units.push({ i, j: -1, text, who: 'narrator' }); }
  });
  const chars = units.reduce((a, u) => a + u.text.length, 0), n = units.length;
  if (!n) return toast('Escreva a narração ou as falas das cenas primeiro');
  const talk = units.some(u => u.who !== 'narrator');
  const people = [...new Set(units.filter(u => u.who !== 'narrator').map(u => u.who))].map(w => castOf(P, w));
  let vid = P.voice?.ai || 'caio';
  const ov = modal(`<h3>${talk ? 'Vozes com IA' : 'Narração com IA'}</h3>
    <p style="margin:0">As vozes são geradas pelo conector <strong>Speko</strong> da sua conta, fala por fala, e entram no MP4. ${n} ${n === 1 ? 'trecho' : 'trechos'}, ${chars.toLocaleString('pt-BR')} caracteres (cerca de US$ ${(chars / 1000 * .06).toFixed(2)}; trechos que não mudaram são reaproveitados de graça).</p>
    ${talk ? `<div class="field"><span>Voz de cada personagem (troque em Visual → Elenco)</span><div style="display:grid;gap:4px;font-size:13px">${people.map(c => `<div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(c.name)}</b><span class="muted">${esc(voiceOfMember(P, c.id).label.split(' (')[0])}</span></div>`).join('')}</div></div>` : ''}
    <div class="field"><span>${talk ? 'Voz do narrador' : 'Voz'}</span><div class="chips" id="avV">${TTS_VOICES.map(v => `<button type="button" class="chip" data-v="${v.id}" aria-pressed="${v.id === vid}">${esc(v.label.split(' (')[0])}</button>`).join('')}</div></div>
    <div id="avProg" hidden style="display:grid;gap:8px"><div class="bar"><i id="avBar"></i></div><div class="mono muted" id="avStage" style="font-size:12px"></div></div>
    <p class="muted" style="margin:0;font-size:12px">Na primeira vez o claude.ai pede para você liberar o Speko nesta página. Cada fala gerada uma vez fica guardada; refazer só cobra o que mudou.</p>
    <div class="modal-foot"><button class="btn" data-x id="avClose">Fechar</button><button class="btn primary" id="avGo">Gerar ${talk ? 'vozes' : 'narração'}</button></div>`);
  $('#avV').onclick = e => { const b = e.target.closest('button'); if (!b) return; vid = b.dataset.v; $$('#avV button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  let ctl = null;
  $('#avGo').onclick = async () => {
    if (ctl) { ctl.abort(); return; }
    const mcp = await window.claude?.use?.('mcp');
    if (!mcp) { $('#avProg').hidden = false; $('#avStage').textContent = 'Os conectores não estão disponíveis aqui. Abra o app pelo claude.ai.'; return; }
    const narrator = TTS_VOICES.find(v => v.id === vid); P.voice.ai = vid;
    units.forEach(u => (u.voice = u.who === 'narrator' ? narrator : voiceOfMember(P, u.who)));
    /* reuse audio already generated (also after reopening from history): only new or changed lines go to Speko */
    const prevN = P.narration, prev = prevN?.buffer && Array.isArray(prevN.units) ? prevN.units : []; let reused = 0;
    for (const u of units) { const m = prev.find(x => x.k === u.voice.id + '|' + u.text); if (m) { u.buf = sliceBuffer(prevN.buffer, m.at, m.dur); reused++; } }
    ctl = new AbortController(); $('#avProg').hidden = false; $('#avGo').textContent = 'Cancelar'; $('#avGo').classList.remove('primary');
    let done = reused, failed = null; const queue = units.filter(u => !u.buf);
    if (reused) $('#avStage').textContent = `${reused} ${reused === 1 ? 'trecho reaproveitado' : 'trechos reaproveitados'} sem custo`;
    const worker = async () => {
      while (queue.length && !failed && !ctl.signal.aborted) {
        const u = queue.shift();
        try { u.buf = await ttsScene(mcp, u.text, u.voice, ctl.signal); done++; $('#avBar').style.width = `${(done / n * 100).toFixed(0)}%`; $('#avStage').textContent = `Gerando · ${done} de ${n}`; }
        catch (e) { failed = e; }
      }
    };
    try {
      await Promise.all([worker(), worker(), worker()]);
      if (ctl.signal.aborted) throw { code: 'cancelled' };
      if (failed) throw failed;
      pushHistory('vozes com IA');
      const sr = 24000, parts = [], words = []; let acc = 0;
      const put = (u, at) => { u.at = at; parts.push({ buf: u.buf, at }); const ws = u.text.split(/\s+/).filter(Boolean), tot = ws.reduce((a, w) => a + w.length + 1.5, 0); let c = 0; for (const w of ws) { const t0 = at + (c / tot) * u.buf.duration; c += w.length + 1.5; words.push({ text: w, t0, t1: at + (c / tot) * u.buf.duration }); } };
      P.scenes.forEach((s, i) => {
        const us = units.filter(u => u.i === i && u.buf);
        if (s.kind === 'talk' && us.length) {
          let t = .1; const lt = [];
          s.p.lines.forEach((l, j) => { const u = us.find(x => x.j === j); if (!u) { lt.push([t, t + .8]); t += 1; return; } put(u, acc + t); lt.push([+t.toFixed(3), +(t + u.buf.duration).toFixed(3)]); t += u.buf.duration + .2; });
          s.p.lineTimes = lt; s.dur = +Math.max(1.2, t + .1).toFixed(2);
        } else if (us[0]) { const lead = .08; put(us[0], acc + lead); s.dur = +(Math.max(1.2, us[0].buf.duration + lead + .22)).toFixed(2); }
        acc += sceneDur(P, s);
      });
      const buffer = concatBuffers(parts, acc, sr);
      P.narration = { buffer, name: talk ? `${people.length + 1} vozes` : narrator.label.split(' ·')[0], words, vol: 1, source: 'ai', script: scriptOf(P), units: units.filter(u => u.buf && u.at != null).map(u => ({ k: u.voice.id + '|' + u.text, at: +u.at.toFixed(4), dur: +u.buf.duration.toFixed(4) })) };
      P.captions.on = true; stopSpeech(); afterChange();
      $('#avStage').textContent = `Pronto · ${tc(acc)} de áudio${reused ? ` · ${reused} reaproveitados sem custo` : ''}. As cenas foram ajustadas às vozes.`; $('#avGo').textContent = 'Gerar de novo'; $('#avGo').classList.add('primary');
      toast(talk ? 'Vozes prontas' : 'Narração de IA pronta');
    } catch (e) {
      const msg = e?.code === 'cancelled' ? 'Cancelado.' : e?.code === 'not_granted' || e?.code === 'denied' ? 'O Speko não foi liberado para esta página. Tente de novo e clique em Permitir.' : e?.code === 'server_not_connected' ? 'O conector Speko não está conectado na sua conta.' : (e?.message || 'A geração falhou.');
      $('#avStage').textContent = msg; $('#avGo').textContent = `Gerar ${talk ? 'vozes' : 'narração'}`; $('#avGo').classList.add('primary'); console.warn(e);
    } finally { ctl = null; }
  };
}

/* ---------- publishing package: titles, cover, caption, hashtags ---------- */
function postHTML(P) {
  const X = P.post;
  if (!X) return `<div class="post"><span class="label">Publicação</span><p class="muted" style="margin:0;font-size:12.5px">Títulos, texto da capa, legenda e hashtags prontos para postar, pensados para prender e gerar comentário.</p><button class="btn ai sm" type="button" data-post="gen">Gerar pacote de publicação</button></div>`;
  const tags = X.hashtags.map(h => '#' + h).join(' ');
  return `<div class="post"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="label">Publicação</span><div class="chips"><button class="btn sm" type="button" data-post="all">Copiar tudo</button><button class="btn sm ai" type="button" data-post="gen">Gerar de novo</button></div></div>
    <div class="post-block"><b>Títulos</b>${X.titles.map((t, i) => `<div class="post-row"><span>${esc(t)}</span><button class="btn sm ghost" type="button" data-post="t${i}">Copiar</button></div>`).join('')}</div>
    ${X.cover ? `<div class="post-block"><b>Texto da capa</b><div class="post-row"><span class="post-cover">${esc(X.cover)}</span><button class="btn sm ghost" type="button" data-post="cover">Copiar</button></div></div>` : ''}
    <div class="post-block"><b>Legenda</b><textarea class="input" data-postf="caption" style="min-height:120px">${esc(X.caption)}</textarea><div class="post-row"><span class="muted" style="font-size:12px">${esc(tags)}</span><button class="btn sm ghost" type="button" data-post="caption">Copiar legenda + hashtags</button></div></div>
    ${X.comment ? `<div class="post-block"><b>Comentário fixado</b><div class="post-row"><span>${esc(X.comment)}</span><button class="btn sm ghost" type="button" data-post="comment">Copiar</button></div></div>` : ''}</div>`;
}
async function copyText(t, what) { try { await navigator.clipboard.writeText(t); toast(`${what} copiado`); } catch (e) { toast('Não deu para copiar aqui. Selecione o texto e copie.'); } }
async function onPostClick(e) {
  const b = e.target.closest('[data-post]'); if (!b) return; const P = S.project, X = P.post, a = b.dataset.post;
  if (a === 'gen') {
    if (!aiAvailable()) return toast('Claude indisponível aqui');
    b.disabled = true; b.textContent = 'Escrevendo…';
    try { const x = await genPost(P); if (!x?.titles?.length) throw { code: 'invalid_json' }; P.post = x; afterChange(); renderPosts(); toast('Pacote de publicação pronto'); }
    catch (err) { toast(aiErr(err)); b.disabled = false; b.textContent = 'Gerar pacote de publicação'; }
    return;
  }
  const tags = X.hashtags.map(h => '#' + h).join(' ');
  if (a[0] === 't' && a !== 'all') return copyText(X.titles[+a.slice(1)], 'Título');
  if (a === 'cover') return copyText(X.cover, 'Texto da capa');
  if (a === 'caption') return copyText(`${X.caption}\n\n${tags}`, 'Legenda');
  if (a === 'comment') return copyText(X.comment, 'Comentário');
  if (a === 'all') return copyText(`TÍTULOS\n${X.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nCAPA\n${X.cover}\n\nLEGENDA\n${X.caption}\n\n${tags}\n\nCOMENTÁRIO FIXADO\n${X.comment}`, 'Pacote');
}
function renderPosts() { const b = $('#boardPost'); if (b && S.project) b.innerHTML = postHTML(S.project); }
document.addEventListener('click', e => { if (e.target.closest('[data-post]')) onPostClick(e); });
document.addEventListener('input', e => { const f = e.target.dataset?.postf; if (f && S.project?.post) { S.project.post[f] = e.target.value; clearTimeout(saveT); saveT = setTimeout(saveDraft, 800); } });

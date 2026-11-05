
/* ---------- narration: browser voice preview, recorded upload, script ---------- */
const VOICE = { list: [], speaking: false, lastIdx: -1 };
function loadVoices() {
  try { VOICE.list = speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang)); } catch (e) { VOICE.list = []; }
}
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice(P) {
  const L = VOICE.list; if (!L.length) return null;
  const want = P.voice?.browserName; const byName = L.find(v => v.name === want);
  return byName || L.find(v => /natural|neural|google/i.test(v.name) && /BR/i.test(v.lang)) || L.find(v => /BR/i.test(v.lang)) || L[0];
}
function speakScene(P, idx) {
  if (!('speechSynthesis' in window) || P.mode === 'footage' || P.narration?.buffer || !P.voice?.preview) return;
  const s = P.scenes[idx]; if (s?.kind === 'talk') { if (s.p.lines?.length) speakTalk(P, s); return; } if (!s?.say) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(s.say.replace(/\*/g, '')); const v = pickVoice(P); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'pt-BR';
    const words = s.say.split(/\s+/).length; u.rate = clamp(words / (sceneDur(P, s) * 2.55), .9, 1.6); u.pitch = 1;
    speechSynthesis.speak(u);
  } catch (e) { }
}
function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) { } VOICE.lastIdx = -1; }
function narrationScript(P) { return P.scenes.map(s => s.kind === 'talk' ? s.p.lines.map(l => `[${l.who === 'narrator' ? 'Narrador' : castOf(P, l.who).name}] ${l.text}`).join('\n') : (s.say || '').replace(/\*/g, '').trim()).filter(Boolean).join('\n\n'); }

/* align a recorded/generated narration to the scenes: scene boundaries follow the voice */
function applyNarration(P, buffer, name, source) {
  const sil = detectSilences(buffer, .22);
  const says = P.scenes.map(sceneSpeech); P.scenes.forEach(s => { if (s.kind === 'talk') s.p.lineTimes = null; });
  const all = says.join(' ').trim(); if (!all) { toast('As cenas não têm narração escrita'); return false; }
  const words = alignText(all, buffer.duration, sil);
  let wi = 0; const starts = [];
  says.forEach(t => { const n = t ? t.split(/\s+/).filter(Boolean).length : 0; starts.push(n ? words[wi]?.t0 ?? null : null); wi += n; });
  /* scenes without narration keep their length; others start where their first word starts */
  let prev = 0;
  for (let i = 0; i < P.scenes.length; i++) {
    let next = null; for (let j = i + 1; j < P.scenes.length; j++) if (starts[j] != null) { next = starts[j]; break; }
    const st = i === 0 ? 0 : prev; const end = next ?? Math.max(buffer.duration + .6, st + 1.5);
    if (starts[i] != null || i === 0) P.scenes[i].dur = Math.max(1.2, +(end - st).toFixed(2));
    prev = st + P.scenes[i].dur;
  }
  P.narration = { buffer, name, words, vol: 1, source, script: all };
  P.captions.on = true; return true;
}
async function onNarrationFile(file) {
  const P = S.project;
  try {
    const buf = await audioCtx().decodeAudioData(await file.arrayBuffer());
    pushHistory('narração'); if (applyNarration(P, buf, file.name, 'upload')) { stopSpeech(); afterChange(); toast(`Narração sincronizada · ${tc(buf.duration)}`); }
  } catch (e) { toast('Não consegui ler esse áudio. Tente MP3, M4A ou WAV.'); }
}
function narrationStale(P) { return P.narration && P.narration.script !== scriptOf(P); }

/* ---------- story scene panel ---------- */
const POSE_NAMES = { stand: 'Em pé', walk: 'Andando', run: 'Correndo', point: 'Apontando', think: 'Pensando', cross: 'Braços cruzados', celebrate: 'Comemorando', phone: 'No telefone', sad: 'Cabisbaixo', scared: 'Com medo', sit: 'Sentado', hold: 'Segurando algo' };
const EMO_NAMES = { neutral: 'Neutro', happy: 'Feliz', confident: 'Confiante', worried: 'Preocupado', sad: 'Triste', angry: 'Bravo', scared: 'Assustado', shocked: 'Chocado' };
const PROP_NAMES = { none: 'Nada', phone: 'Celular', money: 'Dinheiro', briefcase: 'Maleta', bag: 'Saco de dinheiro', radio: 'Rádio', book: 'Livro', coffee: 'Café', clipboard: 'Prancheta', box: 'Caixa', gun: 'Arma', knife: 'Faca', cash: 'Notas de dinheiro', bottle: 'Garrafa', key: 'Chave', envelope: 'Envelope', laptop: 'Notebook' };
const CAM_NAMES = { push: 'Aproximar', pull: 'Afastar', panL: 'Panorâmica ←', panR: 'Panorâmica →', shake: 'Tremor (impacto)', still: 'Parada' };
const MOOD_NAMES = { normal: 'Normal', tense: 'Suspense', danger: 'Perigo', flashback: 'Lembrança', hope: 'Esperança', mystery: 'Mistério / terror (escuro)' };
const ICON_NAMES = { '': 'Nenhum', money: 'Dinheiro', clock: 'Relógio', alert: 'Alerta', heart: 'Coração', x: 'Errado', check: 'Certo', arrow: 'Subindo', question: 'Dúvida' };
const opt = (map, cur) => Object.entries(map).map(([k, v]) => `<option value="${esc(k)}" ${String(cur) === k ? 'selected' : ''}>${esc(v)}</option>`).join('');
function storyPaneHTML(P, s) {
  const p = s.p, h = p.hero || {}, castOpts = (cur, none) => (none ? `<option value="none" ${cur === 'none' ? 'selected' : ''}>Ninguém</option>` : '') + (P.cast || []).map(c => `<option value="${esc(c.id)}" ${cur === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<div class="group"><label class="field"><span>Narração</span><textarea class="input" data-k="scene" data-f="say" data-t="text" style="min-height:84px">${esc(s.say || '')}</textarea></label>
    <label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".1" min="1" data-k="scene" data-f="dur" data-t="number" value="${s.dur}"></label>
    ${P.narration ? '<p class="muted" style="margin:0;font-size:12px">A duração segue a narração gravada.</p>' : ''}</div>
  <div class="group"><h4>Cenário</h4><div class="row2">
    <label class="field"><span>Lugar</span><select class="input" data-k="sp" data-f="place">${opt(PLACE_NAMES, p.place)}</select></label>
    <label class="field"><span>Hora</span><select class="input" data-k="sp" data-f="time">${opt({ day: 'Dia', dusk: 'Fim de tarde', night: 'Noite' }, p.time)}</select></label>
    <label class="field"><span>Câmera</span><select class="input" data-k="sp" data-f="camera">${opt(CAM_NAMES, p.camera)}</select></label>
    <label class="field"><span>Clima</span><select class="input" data-k="sp" data-f="mood">${opt(MOOD_NAMES, p.mood)}</select></label></div>
    <label class="toggle"><span>Multidão ao fundo</span><input type="checkbox" data-k="sp" data-f="crowd" ${p.crowd ? 'checked' : ''}></label></div>${thingsPaneHTML(p)}${setPaneHTML(p)}
  <div class="group"><h4>Personagem principal</h4><div class="row2">
    <label class="field"><span>Quem</span><select class="input" data-k="sh" data-f="who">${castOpts(h.who, true)}</select></label>
    <label class="field"><span>Enquadramento</span><select class="input" data-k="sh" data-f="shot">${opt({ wide: 'Corpo inteiro', medium: 'Cintura para cima', close: 'Close no rosto' }, h.shot || 'wide')}</select></label>
    <label class="field"><span>Pose</span><select class="input" data-k="sh" data-f="pose">${opt(POSE_NAMES, h.pose)}</select></label>
    <label class="field"><span>Emoção</span><select class="input" data-k="sh" data-f="emotion">${opt(EMO_NAMES, h.emotion)}</select></label>
    <label class="field"><span>Na mão</span><select class="input" data-k="sh" data-f="prop">${opt(PROP_NAMES, h.prop)}</select></label>
    <label class="field"><span>Olhando para</span><select class="input" data-k="sh" data-f="facing">${opt({ right: 'Direita', left: 'Esquerda' }, h.facing)}</select></label>
    <label class="field"><span>Posição</span><input type="range" min=".1" max=".9" step=".01" data-k="sh" data-f="x" data-t="number" value="${h.x ?? .5}"></label></div></div>
  <div class="group"><h4>Coadjuvantes</h4>
    ${(p.extras || []).map((e, i) => `<div class="row2" style="align-items:end"><label class="field"><span>Quem</span><select class="input" data-k="se${i}" data-f="who">${castOpts(e.who)}</select></label><label class="field"><span>Pose</span><select class="input" data-k="se${i}" data-f="pose">${opt(POSE_NAMES, e.pose)}</select></label><label class="field"><span>Emoção</span><select class="input" data-k="se${i}" data-f="emotion">${opt(EMO_NAMES, e.emotion)}</select></label><button class="btn sm danger" data-act="exDel" data-i="${i}" type="button">Remover</button></div>`).join('')}
    ${(p.extras || []).length < 3 ? '<button class="btn sm" data-act="exAdd" type="button">+ Coadjuvante</button>' : ''}</div>
  <div class="group"><h4>Na tela</h4>
    <label class="field"><span>Rótulo de etapa (ex.: NÍVEL 2 · GERENTE)</span><input class="input" data-k="sp" data-f="label" value="${esc(p.label)}"></label>
    <label class="field"><span>Texto grande (*destaque*)</span><input class="input" data-k="sp" data-f="text" value="${esc(p.text)}"></label>
    <div class="row2"><label class="field"><span>Etiqueta de valor</span><input class="input" data-k="sp" data-f="money" value="${esc(p.money)}" placeholder="R$ 2.000/mês"></label>
    <label class="field"><span>Ícone</span><select class="input" data-k="sp" data-f="icon">${opt(ICON_NAMES, p.icon)}</select></label></div></div>
  <div class="group"><h4>Refazer com o Claude</h4><input class="input" id="paneRedo" placeholder="Ex.: mais tenso, ele percebendo o erro"><button class="btn ai sm" data-act="redo" type="button">Refazer cena</button>${s.versions?.length ? `<button class="btn sm" data-act="prev" type="button">Voltar à versão anterior (${s.versions.length})</button>` : ''}</div>`;
}
function castPaneHTML(P) {
  const sk = Object.entries(SKINS);
  const nv = P.series ? `<p class="notice ai" style="margin:0">Mudanças aqui valem só para este episódio. Para levar aos próximos, salve na novela. Episódios já lançados não mudam.</p><div class="chips"><button class="btn sm primary" data-act="castToSeries" type="button">Usar este elenco nos próximos episódios</button><button class="btn sm" data-act="castAdd" type="button">+ Personagem</button></div>` : '';
  return `<div class="group"><h4>Elenco</h4><p class="muted" style="margin:0;font-size:12px">A aparência e a voz valem para todas as cenas${P.series ? ' deste episódio' : ''}.</p>${nv}</div>` + (P.cast || []).map((c, i) => `
  <div class="group"><div style="display:flex;align-items:center;gap:10px"><canvas width="80" height="120" data-castthumb="${i}" style="width:40px;height:60px"></canvas><label class="field" style="flex:1"><span>Nome</span><input class="input" data-k="cast${i}" data-f="name" value="${esc(c.name)}"></label></div>
    <div class="field"><span>Pele</span><div class="chips">${sk.map(([k, v]) => `<button type="button" class="chip" style="background:${v};width:30px;padding:0" data-act="skin" data-i="${i}" data-v="${k}" aria-pressed="${c.skin === k}" aria-label="Tom ${k}"></button>`).join('')}</div></div>
    <div class="row2">
      <label class="field"><span>Cabelo</span><select class="input" data-k="cast${i}" data-f="hair">${opt({ short: 'Curto', buzz: 'Raspado', curly: 'Cacheado', long: 'Longo', bald: 'Careca', cap: 'Boné', bun: 'Coque' }, c.hair)}</select></label>
      <label class="field"><span>Cor do cabelo</span><input type="color" class="input" style="padding:2px" data-k="cast${i}" data-f="hairColor" value="${c.hairColor}"></label>
      <label class="field"><span>Barba</span><select class="input" data-k="cast${i}" data-f="beard">${opt({ none: 'Sem', stubble: 'Por fazer', beard: 'Cheia' }, c.beard)}</select></label>
      <label class="field"><span>Roupa</span><select class="input" data-k="cast${i}" data-f="top">${opt({ tshirt: 'Camiseta', hoodie: 'Moletom', suit: 'Terno', tank: 'Regata', uniform: 'Uniforme', jacket: 'Jaqueta' }, c.top)}</select></label>
      <label class="field"><span>Cor da roupa</span><input type="color" class="input" style="padding:2px" data-k="cast${i}" data-f="topColor" value="${c.topColor}"></label>
      <label class="field"><span>Calça</span><input type="color" class="input" style="padding:2px" data-k="cast${i}" data-f="pants" value="${c.pants}"></label>
      <label class="field"><span>Acessório</span><select class="input" data-k="cast${i}" data-f="accessory">${opt({ none: 'Nenhum', chain: 'Corrente', glasses: 'Óculos', watch: 'Relógio', backpack: 'Mochila', badge: 'Distintivo' }, c.accessory)}</select></label>
      <label class="field"><span>Marca no boné</span><select class="input" data-k="cast${i}" data-f="capBrand"><option value="">Nenhuma</option>${Object.entries(BRANDS).map(([k, b]) => `<option value="${k}" ${c.capBrand === k ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Marca na camiseta</span><select class="input" data-k="cast${i}" data-f="shirtBrand"><option value="">Nenhuma</option>${Object.entries(BRANDS).map(([k, b]) => `<option value="${k}" ${c.shirtBrand === k ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Texto no boné</span><input class="input" data-k="cast${i}" data-f="capText" value="${esc(c.capText || '')}"></label>
      <label class="field"><span>Estampa da camiseta (use / p/ 2 linhas)</span><input class="input" data-k="cast${i}" data-f="print" value="${esc(c.print || '')}"></label>
      <label class="field"><span>Gênero</span><select class="input" data-k="cast${i}" data-f="g">${opt({ m: 'Masculino', f: 'Feminino' }, genderOf(c))}</select></label>
      <label class="field"><span>Voz de IA (diálogos)</span><select class="input" data-k="cast${i}" data-f="voice">${voiceOpts(c.voice || voiceOfMember(P, c.id)?.id, genderOf(c))}</select></label>
    </div></div>`).join('');
}
function drawCastThumbs(P) {
  $$('canvas[data-castthumb]').forEach(c => { const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.fillStyle = '#262b33'; ctx.fillRect(0, 0, c.width, c.height); ctx.translate(c.width / 2, c.height - 6); drawPerson(ctx, P.cast[+c.dataset.castthumb], { h: c.height - 14, pose: 'stand', emotion: 'neutral' }, 0); });
}
function narrationPaneHTML(P) {
  const N = P.narration, stale = narrationStale(P);
  const vs = VOICE.list;
  return `<div class="group"><h4>Narração</h4>
    ${N ? `<p class="notice ai" style="margin:0">Narração ${N.source === 'upload' ? 'gravada' : 'de IA'}: ${esc(N.name || '')} · ${tc(N.buffer?.duration || 0)}. As cenas e a legenda seguem a voz.</p>${stale ? '<p class="notice" style="margin:0">O texto da narração mudou depois da gravação. Grave de novo ou desfaça a mudança.</p>' : ''}<div class="chips"><button class="btn sm danger" data-act="narrDel" type="button">Remover narração</button></div>`
      : `<p class="muted" style="margin:0;font-size:12px">Sem narração no arquivo final ainda. Escolha uma opção:</p>`}
    <label class="field"><span>1. Gravar a sua voz: baixe o roteiro, grave lendo no celular e envie o áudio</span>
      <div class="chips"><button class="btn sm" data-act="script" type="button">Baixar roteiro .txt</button><button class="btn sm" data-act="copyScript" type="button">Copiar roteiro</button></div>
      <input type="file" accept="audio/*,video/*" class="input" id="narrIn"></label>
    <div class="field"><span>2. Voz de IA no vídeo final</span><button class="btn sm ai" data-act="aiVoice" type="button">Gerar narração com IA</button></div>
    <label class="toggle"><span>Prévia com a voz do navegador (só para ouvir aqui)</span><input type="checkbox" data-k="voice" data-f="preview" ${P.voice?.preview ? 'checked' : ''}></label>
    ${vs.length ? `<label class="field"><span>Voz da prévia</span><select class="input" data-k="voice" data-f="browserName">${vs.map(v => `<option ${P.voice?.browserName === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>` : ''}
    ${N ? `<label class="field"><span>Volume da voz</span><input type="range" min="0" max="1.5" step=".05" data-k="narr" data-f="vol" data-t="number" value="${N.vol ?? 1}"></label>` : ''}</div>`;
}

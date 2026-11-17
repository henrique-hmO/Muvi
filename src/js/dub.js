/* ============ Dublagem: cria a versão do mesmo vídeo em inglês ou espanhol (traduz textos + voz no novo idioma) ============ */
const LANGS = {
  'pt': { name: 'português', tts: 'pt-BR', flag: '🇧🇷' },
  'en': { name: 'inglês', tts: 'en-US', flag: '🇺🇸', prompt: 'inglês dos EUA', base: 'Speak in natural, native American English. Viral TikTok narrator style: engaging, fast pace, short natural pauses, stress the key words.' },
  'es': { name: 'espanhol', tts: 'es-MX', flag: '🇲🇽', prompt: 'espanhol latino-americano neutro', base: 'Habla en español latinoamericano neutro y natural. Estilo de narrador viral de TikTok: atrapante, ritmo ágil, pausas cortas y naturales, enfatiza las palabras clave.' },
};
/* campos de texto que aparecem/são falados; o resto (lugar, pose, cores…) não muda */
const DUB_KEYS = ['say', 'text', 'title', 'sub', 'kicker', 'label', 'note', 'leftLabel', 'rightLabel', 'verdict', 'quote', 'term', 'unit', 'money', 'caption', 'suffix', 'prefix'];
const DUB_LISTS = ['items', 'left', 'right', 'steps'];
function dubCollect(P) {
  const out = []; const add = (get, set) => { const v = get(); if (typeof v === 'string' && /\p{L}/u.test(v) && v.trim().length > 1) out.push({ v, set }); };
  P.scenes.forEach(s => {
    add(() => s.say, x => (s.say = x));
    const p = s.p; if (!p || typeof p !== 'object') return;
    for (const k of DUB_KEYS) if (k !== 'say') add(() => p[k], x => (p[k] = x));
    for (const k of DUB_LISTS) if (Array.isArray(p[k])) p[k].forEach((_, i) => add(() => p[k][i], x => (p[k][i] = x)));
    for (const [k, f] of [['lines', 'text'], ['messages', 'text'], ['bars', 'label']]) if (Array.isArray(p[k])) p[k].forEach(o => o && add(() => o[f], x => (o[f] = x)));
  });
  return out;
}
async function makeDub(P, lang) {
  const L = LANGS[lang]; const Q = JSON.parse(snapshot(P));
  Q.id = uid(); Q.lang = lang; Q.title = `${P.title} (${lang.toUpperCase()})`; Q.narration = null; Q.source = null;
  Q.music = { ...(Q.music || {}), buffer: null }; if (Q.music.kind === 'upload') Q.music.kind = 'pulse';
  Q.voice = { ...(Q.voice || {}), ai: 'viral-m' }; delete Q.series;
  const items = dubCollect(Q);
  const post = Q.post ? { titles: Q.post.titles || [], cover: Q.post.cover || '', caption: Q.post.caption || '', comment: Q.post.comment || '' } : null;
  const r = await ask(`Traduza para ${L.prompt} os textos de um vídeo viral curto. Adapte como um criador nativo falaria: mantenha o gancho forte, o ritmo, as gírias equivalentes e o mesmo tamanho aproximado (a voz e as cenas já estão cronometradas). Mantenha os marcadores *assim* em volta das mesmas palavras de destaque. Números e fatos continuam iguais; valores em R$ ficam em R$.
Textos (JSON, na ordem): ${JSON.stringify(items.map(x => x.v))}
${post ? `Pacote de publicação: ${JSON.stringify(post)}` : ''}
Responda só JSON minificado: {"t":[string na mesma ordem e quantidade]${post ? ',"post":{"titles":[...],"cover":"","caption":"","comment":"","hashtags":[4 hashtags do assunto no idioma, sem #]}' : ''}}`, { effort: 'low', cache: false });
  const t = Array.isArray(r?.t) ? r.t : [];
  if (t.length < items.length * .9) throw { code: 'invalid_json' };
  items.forEach((x, i) => { if (typeof t[i] === 'string' && t[i].trim()) x.set(t[i]); });
  if (post && r.post) Q.post = { ...Q.post, ...normPost({ ...Q.post, ...r.post }) };
  return Q;
}
/* voz no idioma da versão */
ttsScene = (f => async function (mcp, text, voice, signal, u, P) {
  P ||= S.project; const L = LANGS[P?.lang];
  if (!L || P.lang === 'pt') return f(mcp, text, voice, signal, u, P);
  const speed = clamp(+(P.voice?.speed || 1.06), .8, 1.3), instr = voice.emo && P.voice?.emo !== false ? L.base : '';
  const key = [voice.id, P.lang, speed, instr, text].join('|'); if (TTS_CACHE.has(key)) return TTS_CACHE.get(key);
  const body = { text, intent: { language: L.tts, optimizeFor: 'accuracy' }, spokenForm: true, ...voice.body, speed };
  if (instr) body.instructions = instr;
  const r = await mcp.callTool('Speko', 'audio.synthesize', { body }, { signal });
  let pl = r?.payload; if (!pl && r?.content?.[0]?.text) { try { pl = JSON.parse(r.content[0].text); } catch (e) { } }
  if (!pl?.audio_base64) throw { code: 'no_audio', message: 'O conector não devolveu o áudio desta cena.' };
  const buf = await audioCtx().decodeAudioData(b64ToBuf(pl.audio_base64)); TTS_CACHE.set(key, buf); return buf;
})(ttsScene);

/* ---------- botões na aba Publicar ---------- */
function dubBlockHTML(P) {
  if (P.mode === 'footage' || (P.lang && P.lang !== 'pt')) return '';
  return `<div class="post-block dub-box"><b>🌎 Versão em outro idioma</b><p class="muted" style="margin:2px 0 8px;font-size:12.5px">Cria uma cópia deste vídeo traduzida, com legenda e voz no novo idioma, para postar em perfis gringos. Custa 1 pedido leve de IA; depois é só gerar a narração.</p>
    <div class="chips"><button type="button" class="btn sm" data-post="dub-en">${LANGS.en.flag} Inglês</button><button type="button" class="btn sm" data-post="dub-es">${LANGS.es.flag} Espanhol</button></div></div>`;
}
postHTML = (f => function (P) { return f(P) + dubBlockHTML(P); })(postHTML);
onPostClick = (f => async function (e) {
  const b = e.target.closest('[data-post]'); const a = b?.dataset.post;
  if (!a || !a.startsWith('dub-')) return f(e);
  const P = S.project, lang = a.slice(4); if (!P || b.disabled) return;
  if (!aiAvailable()) return toast('A IA não está disponível agora para traduzir.');
  const old = b.textContent; b.disabled = true; b.textContent = 'Traduzindo…';
  try {
    saveDraft(); const Q = await makeDub(P, lang);
    openProject(Q, 'board'); saveDraft();
    toast(`Versão em ${LANGS[lang].name} criada. Gere a narração (Áudio → Narração com IA) para ouvir no novo idioma.`);
  } catch (err) { console.warn(err); toast('Não deu para traduzir: ' + (err?.code ? aiErr(err) : err?.message || 'erro')); }
  finally { b.disabled = false; b.textContent = old; }
})(onPostClick);

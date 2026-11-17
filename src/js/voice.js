/* ============ Vozes mais naturais: emoção por cena (sem gastar IA), velocidade, pronúncia, prévia e vozes brasileiras novas ============ */
/* vozes que entendem instruções de estilo (emoção) */
const EMO_PROV = ['google-tts', 'openai-tts'];
TTS_VOICES.forEach(v => { const pr = v.body?.constraints?.allowedProviders?.tts?.[0] || ''; v.emo = EMO_PROV.some(p => pr.startsWith(p)); });
/* narradores virais (passo 1) e vozes brasileiras nativas (passo 2) */
TTS_VOICES.unshift(
  { id: 'viral-m', g: 'n', emo: true, label: 'Narrador viral · masculino, emoção por cena (Google)', body: spk('google-tts', 'Puck') },
  { id: 'viral-f', g: 'n', emo: true, label: 'Narradora viral · feminina, emoção por cena (Google)', body: spk('google-tts', 'Kore') },
);
TTS_VOICES.push(
  { id: 'bruno', g: 'm', label: 'Bruno · masculina brasileira confiável (Cartesia)', body: spk('cartesia:sonic-3.5', 'b603811e-54c2-4a0a-8854-09eab9ffa63f') },
  { id: 'diogo', g: 'm', label: 'Diogo · masculina brasileira animada (Cartesia)', body: spk('cartesia:sonic-3.5', 'fbee0e7d-a83a-4082-bad1-13c70f86da4e') },
  { id: 'anapaula', g: 'f', label: 'Ana Paula · feminina brasileira vendedora (Cartesia)', body: spk('cartesia:sonic-3.5', '1cf751f6-8749-43ab-98bd-230dd633abdb') },
  { id: 'alice', g: 'f', label: 'Alice · feminina brasileira explicativa (Cartesia)', body: spk('cartesia:sonic-3.5', '9904416a-0831-44ea-b8ee-5f145e8f9bbf') },
);
{ const el = TTS_VOICES.find(v => v.id === 'eleven'); if (el) el.label = 'ElevenLabs · precisa de saldo no Speko'; }

/* ---------- emoção: sai das próprias cenas (clima, emoção do personagem, posição no vídeo) — custo zero de IA ---------- */
const MOOD_TONE = { tense: 'tenso e urgente, voz firme', danger: 'alerta máximo, urgente, um pouco mais rápido', mystery: 'misterioso, voz mais baixa, quase sussurrando, suspense', flashback: 'nostálgico, mais lento e reflexivo', hope: 'esperançoso e caloroso' };
const EMO_TONE = { happy: 'animado, sorrindo na voz', confident: 'confiante e firme', worried: 'preocupado', sad: 'triste, mais lento e suave', angry: 'indignado e enérgico', scared: 'com medo, tenso', shocked: 'surpreso e chocado, ênfase forte', neutral: '' };
const VOICE_BASE = 'Fale em português do Brasil com sotaque brasileiro natural (nunca de Portugal). Estilo de narrador de vídeo viral do TikTok: envolvente, ritmo ágil, pausas curtas e naturais, dê ênfase às palavras mais importantes.';
function voiceStyle(P, u) {
  const s = P.scenes[u.i] || {}, p = s.p || {}, last = u.i === P.scenes.length - 1;
  const line = u.j >= 0 ? p.lines?.[u.j] : null;
  const emo = line?.emotion || p.hero?.emotion || '', mood = p.mood || 'normal';
  const parts = [VOICE_BASE];
  if (u.i === 0) parts.push('Esta é a frase de GANCHO: comece com energia e impacto máximos, como quem revela algo chocante.');
  if (MOOD_TONE[mood]) parts.push('Tom: ' + MOOD_TONE[mood] + '.'); else if (EMO_TONE[emo]) parts.push('Tom: ' + EMO_TONE[emo] + '.');
  if (last && u.i > 0) parts.push('É o fechamento: termine com convite direto e caloroso para seguir e comentar.');
  const em = [...String(s.say || line?.text || '').matchAll(/\*([^*]{2,40})\*/g)].map(m => m[1]); if (em.length) parts.push('Ênfase forte em: ' + em.join(', ') + '.');
  if (u.who && u.who !== 'narrator') parts.push('Você é um personagem falando numa cena, de forma natural e conversada.');
  return parts.join(' ');
}
/* ---------- pronúncia: dicionário do usuário, só no texto enviado à voz (a legenda continua igual) ---------- */
const PRON_KEY = 'muvi_pron';
const PRON_DEFAULT = 'IA = i-á\nMoove = Múve\nMuvi = Múvi\nTikTok = tiquetóque\nCEO = cí-i-ôu\nPIX = pix';
function pronList() { let t = PRON_DEFAULT; try { t = localStorage.getItem(PRON_KEY) ?? PRON_DEFAULT; } catch (e) { } return t.split('\n').map(l => l.split('=').map(x => x.trim())).filter(([a, b]) => a && b); }
function applyPron(text) { let t = text; for (const [a, b] of pronList()) t = t.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'gu'), `$1${b}`); return t; }

/* ---------- síntese com estilo ---------- */
ttsScene = async function (mcp, text, voice, signal, u, P) {
  P ||= S.project; const speed = clamp(+(P?.voice?.speed || 1.06), .8, 1.3), emo = voice.emo && P?.voice?.emo !== false;
  const instr = emo && u ? voiceStyle(P, u) : '';
  const say = applyPron(text);
  const key = [voice.id, speed, instr, say].join('|'); if (TTS_CACHE.has(key)) return TTS_CACHE.get(key);
  const body = { text: say, intent: { language: 'pt-BR', optimizeFor: 'accuracy' }, spokenForm: true, ...voice.body };
  if (speed !== 1) body.speed = speed; if (instr) body.instructions = instr;
  let r;
  try { r = await mcp.callTool('Speko', 'audio.synthesize', { body }, { signal }); }
  catch (e) { if (e?.code === 'cancelled' || signal?.aborted) throw e; const m = String(e?.message || e); if (/402|top-up|top up/i.test(m)) throw { code: 'needs_topup', message: 'Essa voz (ElevenLabs) precisa de saldo no Speko. Escolha outra voz ou adicione crédito no Speko.' }; throw e; }
  let pl = r?.payload; if (!pl && r?.content?.[0]?.text) { try { pl = JSON.parse(r.content[0].text); } catch (e) { } }
  if (!pl?.audio_base64) { const m = JSON.stringify(r || '').slice(0, 300); if (/402|top-up/i.test(m)) throw { code: 'needs_topup', message: 'Essa voz (ElevenLabs) precisa de saldo no Speko. Escolha outra voz.' }; throw { code: 'no_audio', message: 'O conector não devolveu o áudio desta cena (texto longo demais?). Divida a narração em frases menores.' }; }
  const buf = await audioCtx().decodeAudioData(b64ToBuf(pl.audio_base64));
  TTS_CACHE.set(key, buf); return buf;
};

/* ---------- controles na janela de narração ---------- */
const PREVIEW_TXT = 'Você não vai acreditar no que o seu cérebro faz quando sente perigo.';
const PREVIEW_CACHE = new Map();
openAiVoice = (f => function (...a) {
  const P = S.project; if (P) { P.voice ||= {}; if (!P.voice.ai) P.voice.ai = 'viral-m'; P.voice.speed ??= 1.06; P.voice.emo ??= true; }
  f.apply(this, a);
  const box = document.getElementById('avV')?.closest('.field'); if (!box || !P) return;
  const extra = document.createElement('div'); extra.className = 'voice-extra';
  const sp = [[1, 'Normal'], [1.06, 'Viral'], [1.12, 'Rápida']];
  extra.innerHTML = `<div class="voice-row"><button type="button" class="btn sm" id="avPrev">▶ Ouvir esta voz</button><small class="muted" id="avPrevMsg"></small></div>
    <div class="field"><span>Velocidade</span><div class="chips" id="avSpeed">${sp.map(([v, l]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${Math.abs(P.voice.speed - v) < .001}">${l}</button>`).join('')}</div></div>
    <label class="toggle" style="justify-content:flex-start;gap:10px"><input type="checkbox" id="avEmo" ${P.voice.emo !== false ? 'checked' : ''}><span>Emoção automática por cena <small class="muted">(gancho forte, suspense, alerta… sem gastar IA; vale nas vozes marcadas com ✦)</small></span></label>
    <details class="voice-pron"><summary>Pronúncia (como a voz deve falar certas palavras)</summary><textarea class="input" id="avPron" rows="4" placeholder="palavra = como falar">${esc(pronList().map(([a, b]) => `${a} = ${b}`).join('\n'))}</textarea><small class="muted">Uma por linha. Só muda a voz; a legenda continua com a palavra original.</small></details>
    <label class="toggle" style="justify-content:flex-start;gap:10px"><input type="checkbox" id="avRedo"><span>Refazer todas as falas <small class="muted">(cobra de novo; use só se mudou voz, velocidade ou emoção)</small></span></label>`;
  box.after(extra);
  /* marca as vozes com emoção */
  document.querySelectorAll('#avV button').forEach(b => { const v = TTS_VOICES.find(x => x.id === b.dataset.v); if (v?.emo && !b.textContent.includes('✦')) b.textContent += ' ✦'; });
  extra.querySelector('#avSpeed').onclick = e => { const b = e.target.closest('button'); if (!b) return; P.voice.speed = +b.dataset.v; extra.querySelectorAll('#avSpeed button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  extra.querySelector('#avEmo').onchange = e => { P.voice.emo = e.target.checked; };
  extra.querySelector('#avPron').onchange = e => { try { localStorage.setItem(PRON_KEY, e.target.value); } catch (er) { } };
  extra.querySelector('#avRedo').onchange = e => { if (e.target.checked && P.narration) P.narration.units = []; };
  extra.querySelector('#avPrev').onclick = async () => {
    const vid = document.querySelector('#avV [aria-pressed="true"]')?.dataset.v || P.voice.ai, v = TTS_VOICES.find(x => x.id === vid), msg = extra.querySelector('#avPrevMsg');
    if (!v) return; const key = vid + '|' + P.voice.speed + '|' + (P.voice.emo !== false);
    try {
      let buf = PREVIEW_CACHE.get(key);
      if (!buf) { msg.textContent = 'Gerando amostra… (custa centavos)'; const mcp = await window.claude?.use?.('mcp'); if (!mcp) throw new Error('conectores indisponíveis aqui');
        buf = await ttsScene(mcp, PREVIEW_TXT, v, null, { i: 0, j: -1, who: 'narrator' }, { ...P, scenes: [{ say: PREVIEW_TXT, p: { mood: 'mystery' } }] }); PREVIEW_CACHE.set(key, buf); }
      const ac = audioCtx(); await ac.resume?.(); const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start(); msg.textContent = 'Tocando: ' + v.label.split(' (')[0];
    } catch (e) { msg.textContent = e?.message || 'Não deu para gerar a amostra.'; }
  };
})(openAiVoice);

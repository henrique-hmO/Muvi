/* ============ NOVELINHA: dialogue scenes, per-character voices, saved series with episodes ============ */

/* ---------- dialogue scene: timing ---------- */
function avgX(chars, xOf) { return chars.reduce((a, _, j) => a + xOf(j), 0) / Math.max(1, chars.length); }
function talkDur(p) {
  const L = p.lines || []; if (!L.length) return 3;
  return clamp(L.reduce((a, l) => a + String(l.text || '').split(/\s+/).filter(Boolean).length / 2.6 + .5, 0) + .35, 1.5, 40);
}
function talkTimesP(p, d) {
  const L = p.lines || []; if (!L.length) return [];
  if (Array.isArray(p.lineTimes) && p.lineTimes.length === L.length) return p.lineTimes.map(([a, b]) => [Math.min(a, d), Math.min(b, d)]);
  const w = L.map(l => String(l.text || '').split(/\s+/).filter(Boolean).length + 1.2), tot = w.reduce((a, b) => a + b, 0), gap = .14, lead = .12;
  const avail = Math.max(.5, d - lead - .2 - gap * (L.length - 1)); let t = lead;
  return w.map(x => { const a = t, b = t + avail * x / tot; t = b + gap; return [a, b]; });
}
function talkTimes(P, s) { return talkTimesP(s.p, sceneDur(P, s)); }
function sceneSpeech(s) { return (s.kind === 'talk' ? (s.p.lines || []).map(l => l.text).join(' ') : s.say || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim(); }
function scriptOf(P) { return P.scenes.map(sceneSpeech).filter(Boolean).join(' ').trim(); }

/* ---------- dialogue scene: renderer ---------- */
DRAW.talk = (ctx, L, W, H, t, d, p) => {
  PLACE_FX.fall = false; PLACE_FX.cabin = p.place === 'cabin'; PLACE_FX.drive = (p.things || []).some(x => x.anim === 'drive');
  const P = S.__drawP || S.project, m = Math.min(W, H), vertical = H > W, gy = H * .8;
  const chars = (p.chars || []).slice(0, 4), many = chars.length > 2, ch = (vertical ? H * .47 : H * .68) * (many ? .84 : 1), lines = p.lines || [], times = talkTimesP(p, d);
  let li = -1; for (let j = 0; j < times.length; j++) if (t >= times[j][0] - .05) li = j;
  const cur = li >= 0 ? lines[li] : null, speaking = cur && t <= times[li][1] + .02;
  const idx = who => chars.findIndex(c => c.who === who), xOf = j => (Number.isFinite(+chars[j]?.x) ? +chars[j].x : .5);
  const k = clamp(t / Math.max(.5, d)), cam = { z: 1, x: 0 };
  const mode = p.camera || 'auto';
  if (mode === 'auto') {
    if (chars.length > 1) {
      const tx = cur && idx(cur.who) >= 0 ? xOf(idx(cur.who)) : .5;
      const pv = li > 0 && idx(lines[li - 1].who) >= 0 ? xOf(idx(lines[li - 1].who)) : .5;
      const kk = li >= 0 ? ease.inOut(clamp((t - times[li][0] + .05) / .4)) : 0;
      cam.z = many ? 1.04 : vertical ? 1.2 : 1.1; cam.x = clamp((lerp(pv, tx, kk) - .5) * W * (many ? .12 : vertical ? .5 : .32), -W * .16, W * .16);
    } else cam.z = lerp(1.04, 1.16, ease.inOut(k));
  } else switch (mode) {
    case 'push': cam.z = lerp(1, 1.16, ease.inOut(k)); break;
    case 'pull': cam.z = lerp(1.18, 1, ease.out(k)); break;
    case 'panL': cam.x = lerp(W * .07, -W * .07, ease.inOut(k)); cam.z = 1.08; break;
    case 'panR': cam.x = lerp(-W * .07, W * .07, ease.inOut(k)); cam.z = 1.08; break;
    case 'shake': cam.z = 1.06; cam.x = Math.sin(t * 31) * W * .006; break;
  }
  cam.z *= 1 + .06 * (1 - ease.out(clamp(t / .3)));
  /* cartoon coverage: every other line cuts to a close-up of whoever is talking */
  if ((p.camera || 'auto') === 'auto' && chars.length > 1 && cur && li % 2 === 1 && idx(cur.who) >= 0) {
    drawPlaceBlur(ctx, W, H, p.place || 'room', p.time || 'day', t, { z: 1.1, x: (xOf(idx(cur.who)) - .5) * W * .3 }, p, 7);
    const j = idx(cur.who), c = chars[j], face = xOf(j) > avgX(chars, xOf) ? -1 : 1, chh = vertical ? H * 1.25 : H * 1.9, lt = t - times[li][0];
    let emo = cur.emotion || c.emotion || 'neutral';
    ctx.save(); ctx.translate(W / 2 + face * W * .04, H * .42 + chh * .71 + (1 - ease.out(clamp(lt / .25))) * H * .03);
    drawPerson(ctx, castOf(P, c.who), { h: chh, facing: face, pose: 'stand', emotion: emo, talking: speaking, phase: j * 1.7 }, t);
    ctx.restore(); drawMood(ctx, W, H, p.mood || 'normal', t);
    if (cur.who !== 'narrator') { const who = castOf(P, cur.who); ctx.save(); ctx.font = `800 ${m * .036}px "Poppins", ${FALLBACK}`; const nm = String(who.name || '').toUpperCase(), tw = ctx.measureText(nm).width, hh = m * .066, x = W / 2 - tw / 2 - m * .03, y = H * (vertical ? .1 : .07); rr(ctx, x, y, tw + m * .06, hh, hh / 2); ctx.fillStyle = who.topColor || L.a1; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, m * .004); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(nm, x + m * .03, y + hh / 2 + 1); ctx.restore(); }
    return;
  }
  const env = drawPlace(ctx, W, H, p.place || 'room', p.time || 'day', t, cam, p);
  drawThings(ctx, W, H, p.things, t, d, 'back');
  ctx.save(); ctx.translate(W / 2, gy); ctx.scale(cam.z, cam.z); ctx.translate(-W / 2 - cam.x, -gy);
  const avg = chars.reduce((a, _, j) => a + xOf(j), 0) / Math.max(1, chars.length);
  const order = chars.map((_, j) => j).sort((a, b) => (cur && chars[a].who === cur.who ? 1 : 0) - (cur && chars[b].who === cur.who ? 1 : 0));
  for (const j of order) {
    const c = chars[j], x = xOf(j), isCur = cur && cur.who === c.who;
    const face = c.facing === 'left' ? -1 : c.facing === 'right' ? 1 : chars.length < 2 ? 1 : x > avg ? -1 : 1;
    let emo = c.emotion || 'neutral';
    for (let q = li; q >= 0; q--) if (lines[q].who === c.who) { emo = lines[q].emotion || emo; break; }
    ctx.save(); ctx.translate(W * x, gy + H * .02);
    const en = .35 + .65 * ease.out(clamp(t / .35)); ctx.globalAlpha = en;
    drawPerson(ctx, castOf(P, c.who), { h: ch, facing: face, pose: c.pose || 'stand', emotion: emo, prop: c.prop || 'none', dim: chars.length > 1 && !isCur ? .1 : 0, talking: isCur && speaking, phase: j * 1.7 }, t);
    ctx.restore();
  }
  ctx.restore();
  env.fg?.();
  drawThings(ctx, W, H, p.things, t, d, 'front');
  drawMood(ctx, W, H, p.mood || 'normal', t);
  /* name tag over whoever is speaking */
  if (cur && cur.who !== 'narrator' && idx(cur.who) >= 0) {
    const who = castOf(P, cur.who), j = idx(cur.who);
    const sx = W / 2 + (W * xOf(j) - W / 2 - cam.x) * cam.z, sy = gy + H * .02 - ch * 1.08 * cam.z;
    const a = clamp((t - times[li][0] + .05) / .2) * (1 - clamp((t - times[li][1] - .25) / .2));
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a; ctx.font = `800 ${m * .034}px "Poppins", ${FALLBACK}`;
      const name = String(who.name || '').toUpperCase(), tw = ctx.measureText(name).width, hh = m * .062, x = clamp(sx - tw / 2 - m * .03, m * .03, W - tw - m * .09), y = Math.max(m * .04, sy - hh) - (1 - a) * 8;
      rr(ctx, x, y, tw + m * .06, hh, hh / 2); ctx.fillStyle = who.topColor || L.a1; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, m * .004); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(name, x + m * .03, y + hh / 2 + 1);
      ctx.beginPath(); ctx.moveTo(clamp(sx, x + hh, x + tw + m * .06 - hh) - m * .012, y + hh); ctx.lineTo(clamp(sx, x + hh, x + tw + m * .06 - hh), y + hh + m * .018); ctx.lineTo(clamp(sx, x + hh, x + tw + m * .06 - hh) + m * .012, y + hh); ctx.fillStyle = who.topColor || L.a1; ctx.fill();
      ctx.restore();
    }
  }
  if (p.text) {
    const top = H * (vertical ? .1 : .07);
    const fit = fitText(ctx, { ...L, display: 'Poppins', dW: 900, upper: true }, 'display', p.text, W * .86, m * .085, m * .045, 2, H * .16, 1.05);
    ctx.save(); ctx.lineJoin = 'round';
    drawLines(ctx, { ...L, display: 'Poppins', dW: 900 }, fit, W * .07, top, W * .86, 'display', 'center', i => { const kk = clamp((t - .15 - i * .07) / .25); return { a: kk > 0 ? 1 : 0, s: lerp(1.35, 1, ease.back(kk)) }; }, { ink: '#ffffff', acc: L.a1, stroke: '#0b0c10' });
    ctx.restore();
  }
};
function normTalk(p) {
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const chars = (Array.isArray(p.chars) ? p.chars : []).slice(0, 4).map(c => ({ who: String(c.who || 'hero').slice(0, 20), x: Number(c.x), facing: c.facing === 'left' ? 'left' : c.facing === 'right' ? 'right' : '', pose: pick(c.pose, POSES, 'stand'), emotion: pick(c.emotion, EMOTIONS, 'neutral'), prop: pick(c.prop, PROPS, 'none') }));
  const lines = (Array.isArray(p.lines) ? p.lines : []).slice(0, 6).map(l => ({ who: String(l.who || chars[0]?.who || 'hero').slice(0, 20), text: String(l.text || '').replace(/\s+/g, ' ').trim().slice(0, 180), emotion: pick(l.emotion, EMOTIONS, '') })).filter(l => l.text);
  for (const l of lines) if (l.who !== 'narrator' && !chars.find(c => c.who === l.who) && chars.length < 4) chars.push({ who: l.who, x: NaN, facing: '', pose: 'stand', emotion: 'neutral', prop: 'none' });
  const xs = chars.map(c => c.x), bad = xs.some(x => !Number.isFinite(x)) || xs.some((x, i) => xs.some((y, j) => j !== i && Math.abs(x - y) < .14));
  chars.forEach((c, i) => { c.x = bad ? (chars.length < 2 ? .5 : chars.length > 2 ? +(.17 + i * .66 / (chars.length - 1)).toFixed(2) : +(.26 + i * .48 / (chars.length - 1)).toFixed(2)) : clamp(c.x, .1, .9); });
  return { place: pick(p.place, PLACES, 'room'), time: pick(p.time, TIMES, 'day'), mood: pick(p.mood, MOODS, 'normal'), camera: p.camera === 'auto' || CAMERAS.includes(p.camera) ? p.camera || 'auto' : 'auto', text: String(p.text || '').slice(0, 60), chars, lines, lineTimes: null, ...normSet(p), brand: brandOf(p.brand), things: normThings(p.things) };
}

/* ---------- voices per character ---------- */
const spk = (prov, voice) => ({ ...(voice ? { voice } : {}), constraints: { allowedProviders: { tts: [prov] } } });
TTS_VOICES.forEach(v => (v.g = v.id === 'luana' ? 'f' : v.id === 'caio' ? 'm' : 'n'));
TTS_VOICES.push(
  { id: 'charon', g: 'm', label: 'Charon · masculina grave (Google)', body: spk('google-tts', 'Charon') },
  { id: 'puck', g: 'm', label: 'Puck · masculina expressiva (Google)', body: spk('google-tts', 'Puck') },
  { id: 'orion', g: 'm', label: 'Orion · masculina grave (xAI)', body: spk('xai-tts', 'orion') },
  { id: 'atlas', g: 'm', label: 'Atlas · masculina forte (xAI)', body: spk('xai-tts', 'atlas') },
  { id: 'cosmo', g: 'm', label: 'Cosmo · masculina simpática (xAI)', body: spk('xai-tts', 'cosmo') },
  { id: 'onyx', g: 'm', label: 'Onyx · masculina grave (OpenAI)', body: spk('openai-tts', 'onyx') },
  { id: 'echo', g: 'm', label: 'Echo · masculina calma (OpenAI)', body: spk('openai-tts', 'echo') },
  { id: 'kore', g: 'f', label: 'Kore · feminina quente (Google)', body: spk('google-tts', 'Kore') },
  { id: 'zephyr', g: 'f', label: 'Zephyr · feminina viva (Google)', body: spk('google-tts', 'Zephyr') },
  { id: 'luna', g: 'f', label: 'Luna · feminina viva (xAI)', body: spk('xai-tts', 'luna') },
  { id: 'carina', g: 'f', label: 'Carina · feminina quente (xAI)', body: spk('xai-tts', 'carina') },
  { id: 'nova', g: 'f', label: 'Nova · feminina clara (OpenAI)', body: spk('openai-tts', 'nova') },
  { id: 'shimmer', g: 'f', label: 'Shimmer · feminina suave (OpenAI)', body: spk('openai-tts', 'shimmer') },
  { id: 'aoede', g: 'n', label: 'Aoede · narradora calma (Google)', body: spk('google-tts', 'Aoede') },
  { id: 'fable', g: 'n', label: 'Fable · narrador caloroso (OpenAI)', body: spk('openai-tts', 'fable') },
);
const VOICE_POOL = { m: ['caio', 'charon', 'orion', 'puck', 'atlas', 'onyx', 'cosmo', 'echo'], f: ['luana', 'kore', 'luna', 'carina', 'nova', 'zephyr', 'shimmer'] };
function genderOf(c) { return c.g === 'f' || c.g === 'm' ? c.g : ['long', 'bun'].includes(c.hair) ? 'f' : 'm'; }
function assignVoices(cast, narrator) {
  const used = new Set([narrator]); for (const c of cast) if (c.voice && TTS_VOICES.find(v => v.id === c.voice)) used.add(c.voice); else c.voice = '';
  for (const c of cast) if (!c.voice) { const pool = VOICE_POOL[genderOf(c)]; c.voice = pool.find(v => !used.has(v)) || pool[0]; used.add(c.voice); }
  return cast;
}
function voiceOfMember(P, who) { const c = castOf(P, who); return TTS_VOICES.find(v => v.id === c.voice) || TTS_VOICES.find(v => v.id === VOICE_POOL[genderOf(c)][0]); }
const voiceOpts = (cur, g) => TTS_VOICES.map(v => `<option value="${v.id}" ${v.id === cur ? 'selected' : ''}>${esc(v.label.split(' (')[0])}${v.g === g ? '' : v.g === 'n' ? ' · narração' : ''}</option>`).join('');

/* browser preview of a dialogue scene: one utterance per line, pitch by gender */
function speakTalk(P, s) {
  try {
    speechSynthesis.cancel(); const v = pickVoice(P), times = talkTimes(P, s);
    s.p.lines.forEach((l, j) => {
      const u = new SpeechSynthesisUtterance(l.text.replace(/\*/g, '')); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'pt-BR';
      const c = l.who === 'narrator' ? null : castOf(P, l.who), g = c ? genderOf(c) : 'n', i = c ? (P.cast || []).indexOf(c) : 0;
      u.pitch = g === 'f' ? 1.3 + (i % 2) * .15 : g === 'm' ? .75 + (i % 3) * .1 : 1;
      const [a, b] = times[j] || [0, 2]; u.rate = clamp(l.text.split(/\s+/).length / (Math.max(.6, b - a) * 2.55), .9, 1.7);
      speechSynthesis.speak(u);
    });
  } catch (e) { }
}

/* ---------- storage: claude.ai db (private per person) with browser fallback ---------- */
const NV = { ready: null, db: null, uid: null, list: [], loaded: false, err: '' };
const NV_LOCAL = 'moove-studio.novelas.v1';
function nvInit() {
  return NV.ready ??= (async () => {
    try {
      const [db, user] = await Promise.all([window.claude?.use?.('db'), window.claude?.use?.('user')]);
      const id = db && user ? await user.id() : null;
      if (db && id) { NV.db = db; NV.uid = id; }
    } catch (e) { }
  })();
}
const nvLocal = () => { try { return JSON.parse(localStorage.getItem(NV_LOCAL) || '{"n":{},"e":{}}'); } catch (e) { return { n: {}, e: {} }; } };
const nvLocalPut = o => { try { localStorage.setItem(NV_LOCAL, JSON.stringify(o)); return true; } catch (e) { return false; } };
const nvPath = id => `data/users/${NV.uid}/nv_${id}`;
async function nvLoadAll() {
  await nvInit();
  let list = [];
  if (NV.db) {
    try { const snap = await NV.db.collection(`data/users/${NV.uid}`).where('kind', '==', 'novela').get(); list = snap.docs.map(d => d.data()).filter(Boolean); NV.err = ''; }
    catch (e) { NV.err = 'Não deu para ler as novelas salvas agora.'; }
  }
  const loc = Object.values(nvLocal().n); for (const x of loc) if (!list.find(y => y.id === x.id)) list.push(x);
  NV.list = list.sort((a, b) => (b.updated || 0) - (a.updated || 0)); NV.loaded = true; return NV.list;
}
async function nvSave(nv) {
  nv.updated = Date.now(); await nvInit();
  const i = NV.list.findIndex(x => x.id === nv.id); if (i >= 0) NV.list[i] = nv; else NV.list.unshift(nv);
  if (NV.db) { try { await NV.db.doc(nvPath(nv.id)).set(JSON.parse(JSON.stringify(nv))); return 'cloud'; } catch (e) { console.warn(e); } }
  const o = nvLocal(); o.n[nv.id] = nv; nvLocalPut(o); return 'local';
}
async function nvSaveEpisode(nv, P) {
  const data = snapshot(P), n = P.series.n;
  if (NV.db) { try { await NV.db.doc(`${nvPath(nv.id)}/eps/ep${n}`).set({ n, title: P.title, data, saved: Date.now() }); return 'cloud'; } catch (e) { console.warn(e); } }
  const o = nvLocal(); o.e[`${nv.id}#${n}`] = data; return nvLocalPut(o) ? 'local' : 'fail';
}
async function nvLoadEpisode(nv, n) {
  await nvInit();
  if (NV.db) { try { const s = await NV.db.doc(`${nvPath(nv.id)}/eps/ep${n}`).get(); if (s.exists) return JSON.parse(s.data().data); } catch (e) { console.warn(e); } }
  const d = nvLocal().e[`${nv.id}#${n}`]; return d ? JSON.parse(d) : null;
}
const nvOf = id => NV.list.find(x => x.id === id);
let NV_SAVE_T = null;
function nvQueueSave(P) {
  if (!P?.series) return; clearTimeout(NV_SAVE_T);
  NV_SAVE_T = setTimeout(async () => {
    const nv = nvOf(P.series.id); if (!nv) return;
    const ep = nv.episodes.find(e => e.n === P.series.n); if (ep) { ep.title = P.series.title || ep.title; ep.saved = Date.now(); ep.dur = projectDuration(P); }
    await nvSaveEpisode(nv, P); await nvSave(nv);
  }, 1500);
}

/* ---------- writing with Claude ---------- */
const NOVELA_RULES = `Regras de novelinha viral (vertical, estilo série de TikTok/Reels com personagens animados):
- A PRIMEIRA FALA (em 0 s, até 8 palavras) é a mais chocante do episódio: acusação, segredo revelado, ameaça ou flagra. Nada de apresentação, nada de "oi". A 1ª cena tem "text" grande na tela (até 4 palavras) e camera "shake".
- A cada 10 a 15 segundos uma virada, revelação ou nova pergunta. Ninguém resolve tudo rápido.
- Personagens com desejo claro, um segredo e jeito próprio de falar. Diálogos curtos, falados como no Brasil, com réplica afiada e subtexto.
- Misture cenas de diálogo (kind "talk", maioria) com poucas cenas do narrador (kind "story", com "say") para pular tempo, mostrar o que alguém pensa ou criar suspense.
- O episódio termina num gancho forte e interrompido (revelação pela metade, chegada inesperada, mensagem no celular). A última fala do narrador chama para a próxima parte em até 8 palavras.
- Sem conteúdo sexual, sem violência gráfica, sem pessoas reais, sem marcas.`;
const TALK_GUIDE = `Cena de diálogo (kind "talk"): os personagens conversam na tela e cada um fala com a própria voz.
{"kind":"talk","note":"intenção","p":{"place":"${PLACES.join('|')}","time":"day|dusk|night","mood":"${MOODS.join('|')}","camera":"auto",
 "chars":[{"who":"<id>","x":0.3,"pose":"${POSES.join('|')}","emotion":"${EMOTIONS.join('|')}","prop":"${PROPS.join('|')}"},{"who":"<id>","x":0.7,"pose":"...","emotion":"..."}],
 "lines":[{"who":"<id>","text":"fala","emotion":"..."}],
 "text":""}}
Cada cena de diálogo tem de 1 a 4 falas, cada fala até 14 palavras. Até 3 personagens na cena (x entre 0.2 e 0.8, bem separados). "emotion" de cada fala muda o rosto de quem fala. "text" só em momento chocante (até 4 palavras). "who":"narrator" numa fala é o narrador em off. camera "auto" segue quem fala; "shake" para choque. Pode ter "set":[...] e "things":[...] (mesmas listas das cenas do narrador).`;
const NV_CAST_GUIDE = `Elenco fixo da novela (2 a 5 personagens; o protagonista tem id "hero"; ids curtos sem espaço):
[{"id":"hero","name":"nome brasileiro","g":"m|f","about":"quem é, o que quer, segredo, jeito de falar (1 frase)","skin":"s1|s2|s3|s4|s5","hair":"${HAIRS.join('|')}","hairColor":"#hex","beard":"none|stubble|beard","top":"${TOPS.join('|')}","topColor":"#hex","pants":"#hex","accessory":"${ACCS.join('|')}","print":"estampa curta (opcional)","capText":"texto do boné (opcional)","capBrand":"id de marca do canal (opcional)","shirtBrand":"id de marca do canal (opcional)"}]
Use cores de roupa bem diferentes entre os personagens para o público reconhecer cada um.`;
const EP_FORMAT = (secs) => `Duração do episódio: cerca de ${secs} segundos (aproximadamente ${Math.max(4, Math.round(secs / 4.5))} cenas).
Formato das cenas: lista "scenes" misturando "talk", "story" e "obj" (celular com a conversa, o post, o preço: mostre as coisas).
${TALK_GUIDE}
Cena do narrador: {"kind":"story","say":"narração curta","p":{...}} com estes campos:
${STORY_GUIDE}`;
function nvCastBrief(cast) { return JSON.stringify(cast.map(c => ({ id: c.id, name: c.name, g: genderOf(c), about: c.about || '' }))); }
function nvScenes(list) { return (list || []).map(x => normalizeScene({ ...x, kind: ['talk', 'obj'].includes(x?.kind) ? x.kind : 'story' })).filter(Boolean); }

async function createNovela(premise, opt, signal, onText) {
  const r = await ask(`Você é roteirista-chefe de novelinhas virais em português do Brasil.
Ideia da novela: "${premise}". Gênero: ${opt.genre}. Formato ${opt.aspect}.
${NOVELA_RULES}
${NV_CAST_GUIDE}
Crie a novela e escreva o EPISÓDIO 1.
${EP_FORMAT(opt.seconds)}
${POST_GUIDE}
${COMPACT}
Responda somente com JSON: {"title":"nome da novela (até 5 palavras)","logline":"1 frase","bible":"o mundo, as relações e os segredos de cada um, em até 4 frases","arc":"para onde a história vai nos próximos episódios, em até 3 frases","cast":[...],"episode":{"title":"título do episódio","summary":"o que aconteceu, em 2 frases","cliff":"o gancho final, 1 frase","scenes":[...]},"post":{...}}`, { signal, onText, cache: false });
  const cast = normCast(r?.cast, false); const scenes = nvScenes(r?.episode?.scenes);
  if (!scenes.length) throw { code: 'invalid_json' };
  cast.forEach((c, i) => (c.about = String(r.cast?.[i]?.about || '').slice(0, 200)));
  return { title: String(r.title || 'Nova novela').slice(0, 60), logline: String(r.logline || '').slice(0, 220), bible: String(r.bible || '').slice(0, 900), arc: String(r.arc || '').slice(0, 600), cast, episode: { title: String(r.episode?.title || 'Episódio 1').slice(0, 70), summary: String(r.episode?.summary || '').slice(0, 400), cliff: String(r.episode?.cliff || '').slice(0, 240), scenes }, post: normPost(r.post) };
}
async function writeEpisode(nv, n, wish, seconds, signal, onText) {
  const prev = nv.episodes.filter(e => e.n < n).sort((a, b) => a.n - b.n);
  const r = await ask(`Você é roteirista-chefe da novelinha viral "${nv.title}" (${nv.genre}), em português do Brasil.
Premissa: ${nv.logline}
Bíblia da história: ${nv.bible}
Para onde a história vai: ${nv.arc || 'decida você, mantendo coerência'}
Elenco fixo (use exatamente estes ids e mantenha a personalidade): ${nvCastBrief(nv.cast)}
Episódios anteriores:
${prev.map(e => `Ep ${e.n} · ${e.title}: ${e.summary} Gancho: ${e.cliff}`).join('\n') || '(nenhum)'}
${blueprintBrief(bpOf(nv.bpId), seconds)}${brandBrief(chOf(nv.channelId))}Escreva agora o EPISÓDIO ${n}. Comece com o narrador lembrando o gancho anterior em 1 frase curta (até 3 s) e entre direto no conflito.${wish ? `\nO que o autor quer neste episódio: "${wish}".` : ''}
${NOVELA_RULES}
Se precisar de personagem novo, inclua em "newCast" no mesmo formato: ${NV_CAST_GUIDE.split('\n')[1]}
${EP_FORMAT(seconds)}
${POST_GUIDE}
${COMPACT}
Responda somente com JSON: {"title":"título do episódio","summary":"o que aconteceu, 2 frases","cliff":"gancho final, 1 frase","arc":"plano atualizado para os próximos episódios, até 3 frases","newCast":[],"scenes":[...],"post":{...}}`, { signal, onText, cache: false });
  const scenes = nvScenes(r?.scenes); if (!scenes.length) throw { code: 'invalid_json' };
  const add = (Array.isArray(r.newCast) ? r.newCast : []).filter(c => c?.id && !nv.cast.find(x => x.id === c.id)).slice(0, 2);
  const newCast = add.length ? normCast(add, false).map((c, i) => ({ ...c, about: String(add[i].about || '').slice(0, 200) })) : [];
  return { title: String(r.title || `Episódio ${n}`).slice(0, 70), summary: String(r.summary || '').slice(0, 400), cliff: String(r.cliff || '').slice(0, 240), arc: String(r.arc || '').slice(0, 600), newCast, scenes, post: normPost(r.post) };
}
function localEpisode(nv) {
  const [a, b] = [nv.cast[0], nv.cast[1] || nv.cast[0]];
  const talk = (lines, place, mood) => { const s = newScene('talk'); s.p = normTalk({ place, mood, chars: [{ who: a.id, x: .3 }, { who: b.id, x: .7 }], lines }); s.dur = talkDur(s.p); return s; };
  const st = say => { const s = newScene('story'); s.p = normStory({ place: 'void', hero: { who: a.id, pose: 'think', emotion: 'worried' } }); s.say = say; s.dur = sayDur(say); return s; };
  return [talk([{ who: b.id, text: 'Eu sei o que você fez.', emotion: 'angry' }, { who: a.id, text: 'Do que você está falando?', emotion: 'worried' }], 'room', 'tense'), st('Escreva aqui a narração da cena.'), talk([{ who: b.id, text: 'Amanhã todo mundo vai saber.', emotion: 'confident' }], 'street', 'danger'), st('Continua na próxima parte.')];
}

/* ---------- flows ---------- */
const NV_GENRES = ['Drama', 'Romance', 'Comédia', 'Suspense', 'Família', 'Trabalho / escritório', 'Escola', 'Vingança'];
const NV_SECS = [[30, '30 s'], [60, '1 min'], [90, '1:30'], [120, '2 min'], [180, '3 min']];
const NVO = { genre: 'Drama', seconds: 60 };
function nvProject(nv, ep, scenes) {
  const P = newProject('story', nv.aspect || '9:16'); P.look = nv.look || OPT.look;
  P.series = { id: nv.id, n: ep.n, title: ep.title }; P.title = `${nv.title} · Ep ${ep.n}: ${ep.title}`.slice(0, 100);
  P.cast = structuredClone(nv.cast); P.voice.ai = nv.narrator || 'eleven'; P.scenes = scenes; P.brief = nv.logline; P.captions.preset = 'doc';
  return P;
}
async function startNovela(useAI) {
  const premise = $('#nvPremise').value.trim();
  if (!premise) { toast('Escreva a ideia da novela'); $('#nvPremise').focus(); return; }
  const opt = { genre: NVO.genre, seconds: NVO.seconds, aspect: OPT.aspect };
  const nv = { id: uid(), kind: 'novela', title: '', genre: opt.genre, logline: premise, bible: '', arc: '', cast: [], narrator: 'eleven', aspect: opt.aspect, look: OPT.look, seconds: opt.seconds, episodes: [], created: Date.now() };
  let ep, post = null;
  if (!useAI || !aiAvailable()) {
    if (useAI) toast('Claude indisponível aqui. Montei um rascunho sem IA.');
    nv.title = premise.split(/\s+/).slice(0, 4).join(' '); nv.cast = normCast([{ ...DEFAULT_CAST[0], g: 'm' }, { ...DEFAULT_CAST[3], id: 'rival', g: 'f' }], false);
    assignVoices(nv.cast, nv.narrator); ep = { n: 1, title: 'O segredo', summary: '', cliff: '' }; nv.episodes.push(ep);
    const P = nvProject(nv, ep, localEpisode(nv)); await nvSave(nv); await nvSaveEpisode(nv, P); openProject(P, 'board'); return;
  }
  const step = pipeline('Criando a novela', 'Novelinha', [['brief', 'Ideia recebida'], ['write', 'Claude criando elenco, segredos e o episódio 1'], ['voice', 'Escolhendo uma voz para cada personagem'], ['save', 'Salvando a novela']]);
  step('brief', 'done', `${opt.genre} · ${fmtDur(opt.seconds)}`); step('write', 'run');
  FLOW = new AbortController(); const live = $('#liveText'); live.hidden = false; live.textContent = 'Pensando…';
  try {
    nv.bpId = BP.sel || ''; nv.channelId = CH.sel || ''; const r = await createNovela(premise + blueprintBrief(bpOf(BP.sel), opt.seconds) + brandBrief(chOf(CH.sel)), opt, FLOW.signal, ({ text }) => { const n = (text.match(/"(?:text|say)"\s*:/g) || []).length; const last = [...text.matchAll(/"(?:text|say)"\s*:\s*"([^"]{3,120})"/g)].pop(); live.textContent = `${n} falas escritas${last ? `\n“${last[1]}”` : ''}`; });
    Object.assign(nv, { title: r.title, logline: r.logline || premise, bible: r.bible, arc: r.arc, cast: r.cast }); post = r.post;
    step('write', 'done', `${r.cast.length} personagens · ${r.episode.scenes.length} cenas`); step('voice', 'run');
    assignVoices(nv.cast, nv.narrator); step('voice', 'done', nv.cast.map(c => `${c.name}: ${TTS_VOICES.find(v => v.id === c.voice)?.label.split(' ·')[0]}`).join(' · '));
    ep = { n: 1, title: r.episode.title, summary: r.episode.summary, cliff: r.episode.cliff, saved: Date.now() }; nv.episodes.push(ep);
    step('save', 'run'); await fontsReady();
    const P = nvProject(nv, ep, r.episode.scenes); P.post = post; ep.dur = projectDuration(P);
    const where = await nvSave(nv); await nvSaveEpisode(nv, P); step('save', 'done', where === 'cloud' ? 'na sua conta' : 'neste navegador');
    $('#nvPremise').value = ''; openProject(P, 'board'); toast(`Novela “${nv.title}” criada e salva`);
  } catch (e) {
    if (e?.code === 'cancelled') { show('home'); return; }
    step('write', 'err', aiErr(e)); live.hidden = true;
    $('#procExtra').innerHTML = `<div class="choice"><strong>Não deu para criar com o Claude.</strong><span class="muted">${esc(aiErr(e))}</span><div class="chips"><button class="btn primary" id="retryAi">Tentar de novo</button><button class="btn ghost" id="goHome">Voltar</button></div></div>`;
    $('#retryAi').onclick = () => startNovela(true); $('#goHome').onclick = () => show('home');
  }
}
async function startEpisode(nvId, wish, seconds) {
  const nv = nvOf(nvId); if (!nv) return toast('Novela não encontrada');
  if (S.project?.series?.id === nvId) { clearTimeout(NV_SAVE_T); await nvSaveEpisode(nv, S.project); }
  const n = Math.max(0, ...nv.episodes.map(e => e.n)) + 1;
  if (!aiAvailable()) { const ep = { n, title: `Episódio ${n}`, summary: '', cliff: '' }; nv.episodes.push(ep); const P = nvProject(nv, ep, localEpisode(nv)); await nvSave(nv); await nvSaveEpisode(nv, P); openProject(P, 'board'); return toast('Claude indisponível. Montei um rascunho para você escrever.'); }
  const step = pipeline(`Episódio ${n}`, nv.title, [['ctx', 'Lendo a história até aqui'], ['write', `Claude escrevendo o episódio ${n}`], ['save', 'Salvando']]);
  step('ctx', 'done', `${nv.episodes.length} ${nv.episodes.length === 1 ? 'episódio' : 'episódios'} · ${nv.cast.length} personagens`); step('write', 'run');
  FLOW = new AbortController(); const live = $('#liveText'); live.hidden = false; live.textContent = 'Pensando…';
  try {
    const r = await writeEpisode(nv, n, wish, seconds || nv.seconds || 60, FLOW.signal, ({ text }) => { const k = (text.match(/"(?:text|say)"\s*:/g) || []).length; const last = [...text.matchAll(/"(?:text|say)"\s*:\s*"([^"]{3,120})"/g)].pop(); live.textContent = `${k} falas escritas${last ? `\n“${last[1]}”` : ''}`; });
    if (r.newCast.length) { nv.cast.push(...r.newCast); assignVoices(nv.cast, nv.narrator); }
    if (r.arc) nv.arc = r.arc;
    step('write', 'done', `${r.scenes.length} cenas${r.newCast.length ? ` · novo: ${r.newCast.map(c => c.name).join(', ')}` : ''}`); step('save', 'run');
    const ep = { n, title: r.title, summary: r.summary, cliff: r.cliff, saved: Date.now() }; nv.episodes.push(ep);
    await fontsReady(); const P = nvProject(nv, ep, r.scenes); P.post = r.post; ep.dur = projectDuration(P);
    await nvSave(nv); await nvSaveEpisode(nv, P); step('save', 'done');
    openProject(P, 'board'); toast(`Episódio ${n} pronto`);
  } catch (e) {
    if (e?.code === 'cancelled') { show('home'); return; }
    step('write', 'err', aiErr(e)); live.hidden = true;
    $('#procExtra').innerHTML = `<div class="choice"><strong>Não deu para escrever o episódio.</strong><span class="muted">${esc(aiErr(e))}</span><div class="chips"><button class="btn primary" id="retryAi">Tentar de novo</button><button class="btn ghost" id="goHome">Voltar</button></div></div>`;
    $('#retryAi').onclick = () => startEpisode(nvId, wish, seconds); $('#goHome').onclick = () => show('home');
  }
}
async function openEpisode(nvId, n) {
  const nv = nvOf(nvId); const data = nv && await nvLoadEpisode(nv, n);
  if (!data) return toast('Não achei esse episódio salvo');
  const P = data; P.music.buffer = null; if (P.music.kind === 'upload') P.music.kind = 'pulse'; P.source = null;
  openProject(P, 'board'); if (n < Math.max(...nv.episodes.map(e => e.n))) toast('Episódio já lançado: o elenco dele fica como estava');
}
function nextEpisodeModal(nvId) {
  const nv = nvOf(nvId); if (!nv) return toast('Novela não encontrada');
  const n = Math.max(0, ...nv.episodes.map(e => e.n)) + 1, last = nv.episodes.find(e => e.n === n - 1);
  let secs = nv.seconds || 60;
  const ov = modal(`<h3>${esc(nv.title)} · Episódio ${n}</h3>
    ${last?.cliff ? `<p class="muted" style="margin:0;font-size:13px">Gancho do episódio ${n - 1}: ${esc(last.cliff)}</p>` : ''}
    <label class="field"><span>O que deve acontecer? (opcional, o Claude continua a história se ficar vazio)</span><textarea class="input" id="nvWish" placeholder="Ex.: a mãe descobre a mentira e expulsa ele de casa"></textarea></label>
    <div class="field"><span>Duração</span><div class="chips" id="nvEpSecs">${NV_SECS.map(([v, l]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${v === secs}">${l}</button>`).join('')}</div></div>
    <p class="muted" style="margin:0;font-size:12px">Usa o elenco atual da novela: ${nv.cast.map(c => esc(c.name)).join(', ')}. Episódios já lançados não mudam.</p>
    <div class="modal-foot"><button class="btn" data-x type="button">Cancelar</button><button class="btn primary" id="nvEpGo" type="button">Escrever episódio ${n}</button></div>`);
  $('#nvEpSecs').onclick = e => { const b = e.target.closest('button'); if (!b) return; secs = +b.dataset.v; $$('#nvEpSecs button').forEach(x => x.setAttribute('aria-pressed', x === b)); };
  $('#nvEpGo').onclick = () => { const w = $('#nvWish').value.trim(); ov.remove(); startEpisode(nvId, w, secs); };
}
async function castToSeries(P) {
  const nv = nvOf(P.series?.id); if (!nv) return toast('Novela não encontrada');
  nv.cast = structuredClone(P.cast).map(c => ({ ...c, about: c.about || nv.cast.find(x => x.id === c.id)?.about || '' }));
  const where = await nvSave(nv); toast(`Elenco salvo na novela para os próximos episódios${where === 'local' ? ' (neste navegador)' : ''}`);
}

/* ---------- home: library + new novela ---------- */
function renderNovelas() {
  const box = $('#nvLib'); if (!box) return;
  if (!NV.loaded) { box.innerHTML = '<p class="muted" style="margin:0;font-size:13px">Carregando suas novelas…</p>'; return; }
  const L = NV.list;
  box.innerHTML = (NV.err ? `<p class="notice" style="margin:0">${esc(NV.err)}</p>` : '') + (L.length ? `<span class="label">Suas novelas</span>` + L.map(nv => {
    const eps = [...nv.episodes].sort((a, b) => a.n - b.n);
    return `<article class="nv-card" data-nv="${nv.id}">
      <div class="nv-head"><canvas width="132" height="96" data-nvthumb="${nv.id}" aria-hidden="true"></canvas><div style="min-width:0"><h4>${esc(nv.title)}</h4><p class="muted">${esc(nv.genre)} · ${eps.length} ${eps.length === 1 ? 'episódio' : 'episódios'} · ${nv.cast.map(c => esc(c.name)).join(', ')}</p></div></div>
      <div class="chips"><button class="btn sm primary" type="button" data-nva="next">+ Episódio ${eps.length ? Math.max(...eps.map(e => e.n)) + 1 : 1}</button>${eps.map(e => `<button class="btn sm" type="button" data-nva="open" data-n="${e.n}" title="${esc(e.title)}">Ep ${e.n}</button>`).join('')}</div>
    </article>`;
  }).join('') : '<p class="muted" style="margin:0;font-size:13px">Nenhuma novela ainda. Crie a primeira abaixo: o elenco e a história ficam salvos para os próximos episódios.</p>');
  $$('canvas[data-nvthumb]', box).forEach(c => { const nv = nvOf(c.dataset.nvthumb); const ctx = c.getContext('2d'); const g = ctx.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, '#141A2B'); g.addColorStop(1, '#09111F'); ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height); const cs = nv.cast.slice(0, 3); cs.forEach((m, i) => { ctx.save(); ctx.translate(c.width * (cs.length < 2 ? .5 : .22 + i * .56 / (cs.length - 1)), c.height - 4); drawPerson(ctx, m, { h: c.height - 12, facing: i ? -1 : 1 }, i); ctx.restore(); }); });
}
function initNovelaHome() {
  OPT.nvGenre = NVO.genre; OPT.nvSecs = NVO.seconds;
  chipSet('[data-opt="nvGenre"]', NV_GENRES.map(g => [g, g]), 'nvGenre', v => (NVO.genre = v));
  chipSet('[data-opt="nvSecs"]', NV_SECS, 'nvSecs', v => (NVO.seconds = v));
  $('#nvGo').onclick = () => startNovela(true);
  $('#nvLocal').onclick = () => startNovela(false);
  $('#nvLib').onclick = e => { const b = e.target.closest('[data-nva]'); if (!b) return; const id = b.closest('[data-nv]').dataset.nv; if (b.dataset.nva === 'next') nextEpisodeModal(id); else openEpisode(id, +b.dataset.n); };
  nvLoadAll().then(renderNovelas);
}

/* ---------- inspector: dialogue scene + series bar ---------- */
function talkPaneHTML(P, s) {
  const p = s.p, who = (cur, narr) => (narr ? `<option value="narrator" ${cur === 'narrator' ? 'selected' : ''}>Narrador</option>` : '') + (P.cast || []).map(c => `<option value="${esc(c.id)}" ${cur === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<div class="group"><h4>Falas</h4>
    ${p.lines.map((l, i) => `<div class="talk-line"><div class="row2" style="align-items:end"><label class="field"><span>Quem fala</span><select class="input" data-k="tl${i}" data-f="who">${who(l.who, true)}</select></label><label class="field"><span>Emoção</span><select class="input" data-k="tl${i}" data-f="emotion">${opt({ '': 'Igual à cena', ...EMO_NAMES }, l.emotion)}</select></label></div>
      <div style="display:flex;gap:6px;align-items:start"><textarea class="input" data-k="tl${i}" data-f="text" style="min-height:52px;flex:1">${esc(l.text)}</textarea><button class="btn sm icon danger" data-act="tlDel" data-i="${i}" type="button" aria-label="Apagar fala">×</button></div></div>`).join('')}
    ${p.lines.length < 6 ? '<button class="btn sm" data-act="tlAdd" type="button">+ Fala</button>' : ''}
    <label class="field"><span>Duração (s)</span><input class="input mono" type="number" step=".1" min="1" data-k="scene" data-f="dur" data-t="number" value="${s.dur}"></label>
    ${P.narration ? '<p class="muted" style="margin:0;font-size:12px">A duração segue as vozes geradas.</p>' : ''}</div>
  <div class="group"><h4>Quem está na cena</h4>
    ${p.chars.map((c, i) => `<div class="row2" style="align-items:end"><label class="field"><span>Personagem</span><select class="input" data-k="tc${i}" data-f="who">${who(c.who)}</select></label><label class="field"><span>Pose</span><select class="input" data-k="tc${i}" data-f="pose">${opt(POSE_NAMES, c.pose)}</select></label><label class="field"><span>Posição</span><input type="range" min=".1" max=".9" step=".01" data-k="tc${i}" data-f="x" data-t="number" value="${c.x}"></label><button class="btn sm danger" data-act="tcDel" data-i="${i}" type="button">Tirar</button></div>`).join('')}
    ${p.chars.length < 4 ? '<button class="btn sm" data-act="tcAdd" type="button">+ Personagem na cena</button>' : ''}</div>
  <div class="group"><h4>Cenário</h4><div class="row2">
    <label class="field"><span>Lugar</span><select class="input" data-k="sp" data-f="place">${opt(PLACE_NAMES, p.place)}</select></label>
    <label class="field"><span>Hora</span><select class="input" data-k="sp" data-f="time">${opt({ day: 'Dia', dusk: 'Fim de tarde', night: 'Noite' }, p.time)}</select></label>
    <label class="field"><span>Câmera</span><select class="input" data-k="sp" data-f="camera">${opt({ auto: 'Segue quem fala', ...CAM_NAMES }, p.camera)}</select></label>
    <label class="field"><span>Clima</span><select class="input" data-k="sp" data-f="mood">${opt(MOOD_NAMES, p.mood)}</select></label></div>
    <label class="field"><span>Texto grande na tela (opcional)</span><input class="input" data-k="sp" data-f="text" value="${esc(p.text || '')}"></label></div>${thingsPaneHTML(p)}${setPaneHTML(p)}
  <div class="group"><h4>Refazer com o Claude</h4><input class="input" id="paneRedo" placeholder="Ex.: mais tensa, ela desconfia dele"><button class="btn ai sm" data-act="redo" type="button">Refazer cena</button>${s.versions?.length ? `<button class="btn sm" data-act="prev" type="button">Voltar à versão anterior (${s.versions.length})</button>` : ''}</div>`;
}
function talkEdit(k, f, v, s, P) {
  if (/^tl\d$/.test(k)) { s.p.lines[+k.slice(2)][f] = v; s.p.lineTimes = null; if (f === 'text' && !P.narration) s.dur = +talkDur(s.p).toFixed(1); return true; }
  if (/^tc\d$/.test(k)) { s.p.chars[+k.slice(2)][f] = v; return true; }
  return false;
}
function talkClick(a, b, s, P) {
  if (setClick(a, b, s)) return true;
  if (a === 'tlAdd') { pushHistory('fala'); const last = s.p.lines[s.p.lines.length - 1], other = s.p.chars.find(c => c.who !== last?.who) || s.p.chars[0]; s.p.lines.push({ who: other?.who || 'hero', text: 'Nova fala', emotion: '' }); s.p.lineTimes = null; if (!P.narration) s.dur = +talkDur(s.p).toFixed(1); afterChange(); return true; }
  if (a === 'tlDel') { if (s.p.lines.length <= 1) { toast('A cena precisa de pelo menos uma fala'); return true; } pushHistory('fala'); s.p.lines.splice(+b.dataset.i, 1); s.p.lineTimes = null; if (!P.narration) s.dur = +talkDur(s.p).toFixed(1); afterChange(); return true; }
  if (a === 'tcAdd') { pushHistory('personagem'); const free = (P.cast || []).find(c => !s.p.chars.find(x => x.who === c.id)) || P.cast[0]; s.p.chars.push({ who: free.id, x: .5, facing: '', pose: 'stand', emotion: 'neutral', prop: 'none' }); s.p.chars.forEach((c, i) => (c.x = +(.22 + i * .56 / Math.max(1, s.p.chars.length - 1)).toFixed(2))); if (s.p.chars.length === 1) s.p.chars[0].x = .5; afterChange(); return true; }
  if (a === 'tcDel') { pushHistory('personagem'); s.p.chars.splice(+b.dataset.i, 1); afterChange(); return true; }
  if (a === 'castToSeries') { castToSeries(P); return true; }
  if (a === 'castAdd') { pushHistory('elenco'); const n = (P.cast || []).length; const c = normCast([{ id: 'p' + uid().slice(0, 4), name: `Personagem ${n + 1}`, skin: 's' + (1 + n % 5), hair: n % 2 ? 'long' : 'short', g: n % 2 ? 'f' : 'm', topColor: ['#2f6f5e', '#8a3b2e', '#5b4a8a', '#a07a2a'][n % 4] }], false)[0]; P.cast.push(c); assignVoices(P.cast, P.voice?.ai); afterChange(); return true; }
  if (a === 'nextEp') { nextEpisodeModal(P.series.id); return true; }
  return false;
}
function seriesBarHTML(P) {
  if (!P.series) return '';
  const nv = nvOf(P.series.id), latest = nv ? Math.max(...nv.episodes.map(e => e.n)) : P.series.n;
  return `<div class="series-bar"><span class="label">Novela</span><strong>${esc(nv?.title || 'Novela')}</strong><span class="pill">Episódio ${P.series.n}${P.series.n < latest ? ' · já lançado' : ''}</span><span class="muted" style="font-size:12px">Salvo automaticamente</span><button class="btn sm primary" type="button" data-act="nextEp">+ Episódio ${latest + 1}</button></div>`;
}

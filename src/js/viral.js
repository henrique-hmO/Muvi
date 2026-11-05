/* ============ VIRAL: copy the structure of a viral video (Buzzy "Recreate", clean-room) ============
   Local analysis is free (cuts, pacing, audio, keyframes). One Claude read per reference, saved and reused forever. */
const BP = { list: [], loaded: false, sel: '' };

async function analyzeViralFile(file, onStep, signal) {
  const url = URL.createObjectURL(file);
  const v = document.createElement('video'); v.src = url; v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.style.cssText = 'position:fixed;left:0;top:0;width:64px;height:64px;opacity:.01;pointer-events:none;z-index:-1'; document.body.append(v);
  try {
    onStep('read', 'run');
    await primeVideo(v, 'Esse vídeo não abriu no navegador.');
    const D = v.duration; if (!isFinite(D) || D < 2) throw { message: 'Vídeo curto demais para analisar.' };
    if (D > 600) throw { message: 'Use um vídeo de até 10 minutos.' };
    const W = v.videoWidth, H = v.videoHeight;
    onStep('read', 'done', `${W}×${H} · ${tc(D)}`);

    /* 1. frames: luma grid + histogram per sample */
    onStep('cuts', 'run');
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent), fps = clamp(Math.floor((mobile ? 300 : 600) / D), 2, mobile ? 6 : 10), n = Math.max(2, Math.floor(D * fps));
    const sw = 48, sh = Math.max(16, Math.round(48 * H / W)), c = document.createElement('canvas'); c.width = sw; c.height = sh;
    const x = c.getContext('2d', { willReadFrequently: true });
    const times = [], diffs = [], hds = [], lum = []; let prev = null, prevH = null;
    for (let i = 0; i < n; i++) {
      if (signal?.aborted) throw { code: 'cancelled' };
      const t = (i + .5) / fps; await seekTo(v, t); x.drawImage(v, 0, 0, sw, sh);
      const d = x.getImageData(0, 0, sw, sh).data, g = new Float32Array(sw * sh), hist = new Float32Array(16); let L = 0;
      for (let k = 0, j = 0; k < d.length; k += 4, j++) { const y = d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11; g[j] = y; L += y; hist[Math.min(15, y >> 4)]++; }
      for (let b = 0; b < 16; b++) hist[b] /= g.length;
      let df = 0, hd = 0; if (prev) { for (let j = 0; j < g.length; j++) df += Math.abs(g[j] - prev[j]); df /= g.length; for (let b = 0; b < 16; b++) hd += Math.abs(hist[b] - prevH[b]); }
      times.push(t); diffs.push(df); hds.push(hd); lum.push(L / g.length); prev = g; prevH = hist;
      if (i % 8 === 0) onStep('cuts', 'run', `${Math.round(i / n * 100)}%`);
    }
    /* cut = a spike well above the local motion level that is not a one-frame flash */
    const med = a => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] || 0; };
    const cuts = [];
    for (let i = 1; i < n; i++) {
      const win = diffs.slice(Math.max(1, i - 6), i).concat(diffs.slice(i + 1, i + 7)), base = med(win) || 1;
      const spike = diffs[i] > Math.max(14, base * 2.6) && hds[i] > .22 && diffs[i] >= diffs[i - 1] && diffs[i] >= (diffs[i + 1] ?? 0);
      const flash = i + 1 < n && Math.abs(lum[i + 1] - lum[i - 1]) < 6 && Math.abs(lum[i] - lum[i - 1]) > 25;
      const t = (times[i] + times[i - 1]) / 2;
      if (spike && !flash && (!cuts.length || t - cuts[cuts.length - 1] > .3)) cuts.push(+t.toFixed(2));
    }
    const bounds = [0, ...cuts, D], shots = bounds.slice(1).map((b, i) => [+bounds[i].toFixed(2), +b.toFixed(2)]);
    const motion = Math.round(clamp(med(diffs.filter((_, i) => !cuts.some(ct => Math.abs(ct - times[i]) < 1 / fps))) / 30 * 100, 0, 100));
    const flashes = lum.reduce((a, l, i) => a + (i > 0 && i + 1 < n && Math.abs(l - lum[i - 1]) > 25 && Math.abs(lum[i + 1] - lum[i - 1]) < 6 ? 1 : 0), 0);
    onStep('cuts', 'done', `${shots.length} ${shots.length === 1 ? 'tomada' : 'tomadas'} · troca a cada ${(D / shots.length).toFixed(1)} s`);

    /* 2. audio: how fast the talking starts, how much of the video has voice, energy peaks */
    onStep('audio', 'run');
    let audio = null, speechCover = null, speechStart = null, peaks = [];
    try {
      const buf = await audioCtx().decodeAudioData(await file.arrayBuffer()); audio = buf;
      const sil = detectSilences(buf, .25), silTot = sil.reduce((a, [p, q]) => a + (q - p), 0);
      speechCover = Math.round(clamp(1 - silTot / D) * 100);
      speechStart = sil.length && sil[0][0] < .05 ? +sil[0][1].toFixed(2) : 0;
      peaks = loudMoments(buf, 5).map(p => +(+(p.t ?? p)).toFixed(1)).filter(Number.isFinite).sort((a, b) => a - b);
      onStep('audio', 'done', `voz/som em ${speechCover}% · começa em ${speechStart.toFixed(1)} s`);
    } catch (e) { onStep('audio', 'warn', 'sem áudio legível'); }

    /* 3. keyframes: the hook + the start of each shot (max 8) */
    onStep('frames', 'run');
    const picks = [.25, Math.min(D - .1, 1.5)];
    const starts = shots.slice(1).map(s => s[0] + Math.min(.35, (s[1] - s[0]) / 2));
    const step = Math.max(1, Math.ceil(starts.length / 6)); for (let i = 0; i < starts.length && picks.length < 8; i += step) picks.push(starts[i]);
    const uniq = [...new Set(picks.map(t => +t.toFixed(2)))].sort((a, b) => a - b);
    const big = document.createElement('canvas'), bw = 360, bh = Math.round(360 * H / W); big.width = bw; big.height = bh; const bx = big.getContext('2d');
    const thumb = document.createElement('canvas'), tw = 120, th = Math.round(120 * H / W); thumb.width = tw; thumb.height = th; const txc = thumb.getContext('2d');
    const frames = [];
    for (const t of uniq) {
      await seekTo(v, t); bx.drawImage(v, 0, 0, bw, bh); txc.drawImage(v, 0, 0, tw, th);
      frames.push({ t, blob: await new Promise(r => big.toBlob(r, 'image/jpeg', .72)), thumb: thumb.toDataURL('image/jpeg', .6) });
    }
    onStep('frames', 'done', `${frames.length} quadros`);
    const aspect = W / H < .7 ? '9:16' : W / H > 1.4 ? '16:9' : '1:1';
    const metrics = { dur: +D.toFixed(2), aspect, shots, cutsPerMin: Math.round(cuts.length / D * 60), avgShot: +(D / shots.length).toFixed(2), firstCut: cuts[0] ?? null, cutsIn3s: cuts.filter(t => t < 3).length, motion, flashes, speechCover, speechStart, peaks };
    return { metrics, frames, video: v, url };
  } catch (e) { v.remove(); URL.revokeObjectURL(url); throw e; }
}

const BP_GUIDE = `Responda somente com JSON:
{"name":"nome curto do formato (até 5 palavras)","format":"POV|lista|antes e depois|história|tutorial|reação|desafio|opinião|bastidores|outro","hook":{"type":"pergunta|choque|promessa|contradição|curiosidade|POV|número|ameaça|segredo","text":"o que é dito ou escrito no gancho","visual":"o que aparece no gancho","seconds":n},"beats":[{"from":0,"to":3,"role":"gancho|contexto|tensão|virada|prova|payoff|cta|loop","what":"o que acontece, descrito de forma GENÉRICA (sem o assunto do original)","technique":"técnica: corte seco, zoom, texto grande, close, mudança de cenário, som…"}],"pacing":"ritmo em 1 frase","text_on_screen":"como usa texto/legenda na tela","emotion":"arco emocional em 1 frase","retention":["truque de retenção 1","2","3"],"ending":"como termina (loop, CTA, gancho para a parte 2…)","why":"por que prende, em 2 frases","template":"roteiro modelo com lacunas [ASSUNTO], [NÚMERO], [VIRADA] em 4 a 7 linhas"}
"beats" cobre o vídeo inteiro em ordem, de 4 a 10 batidas, usando os tempos medidos.`;
async function readBlueprint(an, transcript, note, signal) {
  const m = an.metrics, caps = await S.sample.limits?.().catch(() => null), canImg = !!caps?.images;
  const max = caps?.images?.maxCount || 8, frames = canImg ? an.frames.slice(0, max) : [];
  const prompt = `Você é estrategista de vídeos virais (TikTok, Reels, Shorts). Faça a engenharia reversa da ESTRUTURA deste vídeo para reaproveitar o esqueleto em outros assuntos.
Medições automáticas: duração ${m.dur}s, formato ${m.aspect}, ${m.shots.length} tomadas (troca a cada ${m.avgShot}s; ${m.cutsPerMin} cortes/min; primeiro corte em ${m.firstCut ?? '—'}s; ${m.cutsIn3s} cortes nos 3 primeiros segundos); cortes em: ${m.shots.slice(1).map(s => s[0]).join(', ') || 'nenhum'}; movimento de câmera ${m.motion}/100; ${m.flashes} flashes; voz/som em ${m.speechCover ?? '?'}% do tempo, começa em ${m.speechStart ?? '?'}s; picos de áudio em ${m.peaks.join(', ') || '—'}s.
${frames.length ? `Imagens: quadros do vídeo, em ordem, nos tempos ${frames.map(f => f.t + 's').join(', ')}. Leia o texto que aparece na tela.` : 'Sem imagens disponíveis: deduza pelas medições e pela fala.'}
${transcript ? `Fala do vídeo: "${transcript.slice(0, 1500)}"` : 'Fala não transcrita.'}${note ? `\nNota do usuário: ${note}` : ''}
${BP_GUIDE}`;
  return ask(prompt, { signal, cache: false, ...(frames.length ? { images: frames.map(f => f.blob) } : {}) });
}
function normBlueprint(r, m) {
  const S_ = (v, n) => String(v ?? '').trim().slice(0, n);
  const beats = (Array.isArray(r?.beats) ? r.beats : []).slice(0, 12).map(b => ({ from: +clamp(Number(b.from) || 0, 0, m.dur).toFixed(1), to: +clamp(Number(b.to) || 0, 0, m.dur).toFixed(1), role: S_(b.role, 20), what: S_(b.what, 160), technique: S_(b.technique, 120) })).filter(b => b.what);
  if (!beats.length) throw { code: 'invalid_json' };
  return { name: S_(r.name, 50) || 'Estrutura viral', format: S_(r.format, 30), hook: { type: S_(r.hook?.type, 20), text: S_(r.hook?.text, 160), visual: S_(r.hook?.visual, 160), seconds: clamp(Number(r.hook?.seconds) || 2, .5, 10) }, beats, pacing: S_(r.pacing, 160), text_on_screen: S_(r.text_on_screen, 160), emotion: S_(r.emotion, 160), retention: (Array.isArray(r.retention) ? r.retention : []).slice(0, 5).map(x => S_(x, 120)), ending: S_(r.ending, 160), why: S_(r.why, 300), template: S_(r.template, 700) };
}
/* compact brief that goes into the script prompt, beats rescaled to the requested length */
function blueprintBrief(b, seconds) {
  if (!b) return '';
  const D = Math.max(1, b.metrics.dur), h = clamp(Math.min(b.bp.hook.seconds, 3), .5, Math.min(3, seconds / 3)), k = seconds / D;
  /* the hook keeps its real length (never stretched); the rest scales to the new duration */
  const r = t => Math.round((t <= b.bp.hook.seconds ? Math.min(t, h) : h + (t - b.bp.hook.seconds) * (seconds - h) / Math.max(.1, D - b.bp.hook.seconds)) * 10) / 10;
  const shot = clamp(+(b.metrics.avgShot * Math.sqrt(k)).toFixed(1), 1.2, 8);
  const B = b.bp;
  return `\nESTRUTURA VIRAL A SEGUIR (copie o esqueleto, o tipo de gancho e o ritmo; NUNCA copie o assunto, as falas, nomes ou marcas do vídeo original):
Formato: ${B.format}. Gancho do tipo "${B.hook.type}" nos primeiros ${h}s (no original: ${B.hook.text || B.hook.visual}). Faça um gancho do MESMO tipo para o novo assunto.
Batidas (tempos já ajustados para ${seconds}s): ${B.beats.map(x => `${r(x.from)}-${r(x.to)}s ${x.role}: ${x.what}${x.technique ? ` (${x.technique})` : ''}`).join(' | ')}
Ritmo: ${B.pacing} Troque de cena a cada ~${shot}s (o "dur" das cenas perto disso).
Retenção: ${B.retention.join('; ')}. Final: ${B.ending}.\n`;
}

/* ---------- storage (account db, browser fallback) ---------- */
const BP_LOCAL = 'moove-studio.blueprints.v1';
async function bpLoadAll() {
  await nvInit(); let list = [];
  if (NV.db) { try { const s = await NV.db.collection(`data/users/${NV.uid}`).where('kind', '==', 'blueprint').get(); list = s.docs.map(d => d.data()).filter(Boolean); } catch (e) { console.warn(e); } }
  try { for (const b of JSON.parse(localStorage.getItem(BP_LOCAL) || '[]')) if (!list.find(x => x.id === b.id)) list.push(b); } catch (e) { }
  BP.list = list.sort((a, b) => (b.created || 0) - (a.created || 0)); BP.loaded = true; return BP.list;
}
async function bpSave(b) {
  await nvInit(); BP.list = [b, ...BP.list.filter(x => x.id !== b.id)];
  if (NV.db) { try { await NV.db.doc(`data/users/${NV.uid}/bp_${b.id}`).set(JSON.parse(JSON.stringify(b))); return 'cloud'; } catch (e) { console.warn(e); } }
  try { const l = JSON.parse(localStorage.getItem(BP_LOCAL) || '[]').filter(x => x.id !== b.id); l.unshift(b); localStorage.setItem(BP_LOCAL, JSON.stringify(l.slice(0, 30))); } catch (e) { }
  return 'local';
}
async function bpDelete(id) {
  BP.list = BP.list.filter(x => x.id !== id); if (BP.sel === id) BP.sel = '';
  if (NV.db) { try { await NV.db.doc(`data/users/${NV.uid}/bp_${id}`).delete(); } catch (e) { } }
  try { localStorage.setItem(BP_LOCAL, JSON.stringify(JSON.parse(localStorage.getItem(BP_LOCAL) || '[]').filter(x => x.id !== id))); } catch (e) { }
}
const bpOf = id => BP.list.find(x => x.id === id);

/* ---------- UI ---------- */
function bpCardHTML(b, full) {
  const m = b.metrics, B = b.bp, D = m.dur;
  const strip = `<div class="bp-strip" aria-label="Linha do tempo das tomadas">${m.shots.map(([a, z], i) => `<i style="width:${((z - a) / D * 100).toFixed(2)}%" title="Tomada ${i + 1}: ${a}–${z}s"></i>`).join('')}</div>`;
  const beats = `<div class="bp-beats">${B.beats.map(x => `<span style="width:${(Math.max(.4, x.to - x.from) / D * 100).toFixed(2)}%" data-role="${esc(x.role)}" title="${esc(x.what)}">${esc(x.role)}</span>`).join('')}</div>`;
  return `<div class="bp-card"><div class="bp-thumbs">${(b.thumbs || []).slice(0, full ? 8 : 5).map(t => `<img src="${t}" alt="">`).join('')}</div>
    <div class="bp-head"><strong>${esc(B.name)}</strong><span class="pill">${esc(B.format)}</span><span class="mono muted" style="font-size:11px">${tc(D)} · ${m.shots.length} tomadas · ${m.cutsPerMin} cortes/min</span></div>
    ${strip}${beats}
    ${full ? `<dl class="bp-dl"><dt>Gancho</dt><dd><b>${esc(B.hook.type)}</b> em ${B.hook.seconds}s · ${esc(B.hook.text || B.hook.visual)}</dd>
      <dt>Ritmo</dt><dd>${esc(B.pacing)}</dd><dt>Texto na tela</dt><dd>${esc(B.text_on_screen)}</dd><dt>Emoção</dt><dd>${esc(B.emotion)}</dd>
      <dt>Retenção</dt><dd>${B.retention.map(esc).join(' · ')}</dd><dt>Final</dt><dd>${esc(B.ending)}</dd><dt>Por que prende</dt><dd>${esc(B.why)}</dd>
      <dt>Modelo</dt><dd style="white-space:pre-wrap">${esc(B.template)}</dd></dl>` : ''}</div>`;
}
function renderBpPicker() {
  for (const box of $$('[data-bppick]')) {
    box.innerHTML = `<button type="button" class="chip" data-bp="" aria-pressed="${!BP.sel}">Nenhuma</button>${BP.list.map(b => `<button type="button" class="chip" data-bp="${b.id}" aria-pressed="${BP.sel === b.id}">${esc(b.bp.name)}</button>`).join('')}<button type="button" class="chip bp-new" data-bp="new">+ Analisar vídeo viral</button>${BP.sel ? `<button type="button" class="chip" data-bp="view">Ver estrutura</button>` : ''}`;
  }
}
function initViral() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bppick] [data-bp]'); if (!b) return;
    const v = b.dataset.bp;
    if (v === 'new') return openViralModal();
    if (v === 'view') return openBpView(BP.sel);
    BP.sel = v; renderBpPicker();
    if (v) toast(`Estrutura “${bpOf(v)?.bp.name}” vai guiar o roteiro`);
  });
  renderBpPicker(); bpLoadAll().then(renderBpPicker);
}
function openBpView(id) {
  const b = bpOf(id); if (!b) return;
  const ov = modal(`<h3>${esc(b.bp.name)}</h3>${bpCardHTML(b, true)}
    <div class="modal-foot"><button class="btn danger ghost" id="bpDel" type="button">Apagar estrutura</button><button class="btn" data-x type="button">Fechar</button><button class="btn primary" id="bpUse" type="button">Usar no próximo vídeo</button></div>`);
  ov.querySelector('.modal').classList.add('wide');
  $('#bpUse').onclick = () => { BP.sel = id; renderBpPicker(); ov.remove(); toast('Estrutura escolhida. Agora escreva o tema e gere.'); };
  $('#bpDel').onclick = async () => { if ($('#bpDel').dataset.sure !== '1') { $('#bpDel').dataset.sure = '1'; $('#bpDel').textContent = 'Confirmar'; return; } await bpDelete(id); renderBpPicker(); ov.remove(); toast('Estrutura apagada'); };
}
function openViralModal() {
  let an = null, ctl = null;
  const ov = modal(`<h3>Copiar a estrutura de um vídeo viral</h3>
    <p style="margin:0" class="muted">Envie o arquivo de um vídeo que viralizou (baixe do TikTok/Reels/Shorts). O app mede cortes, ritmo e áudio de graça; o Claude lê uma vez o gancho, as batidas e os truques de retenção. A estrutura fica salva para usar em quantos vídeos quiser.</p>
    <label class="drop" style="padding:22px" id="vrDrop"><strong>Solte o vídeo viral aqui</strong><span class="muted">ou clique para escolher · até 10 min</span><input type="file" accept="video/*" class="sr" id="vrFile"></label>
    <ol class="pipeline" id="vrSteps" hidden></ol>
    <div id="vrMore" hidden style="display:grid;gap:10px">
      <label class="field"><span>Fala do vídeo (opcional, melhora muito a leitura do gancho)</span><textarea class="input" id="vrText" placeholder="Cole aqui a legenda/transcrição, ou use o botão para transcrever ouvindo o vídeo"></textarea></label>
      <div class="chips"><button class="btn sm" id="vrListen" type="button" ${speechSupported() ? '' : 'hidden'}>Transcrever ouvindo (leva o tempo do vídeo)</button></div>
      <label class="field"><span>Observação (opcional)</span><input class="input" id="vrNote" placeholder="Ex.: o que me chamou atenção é o gancho com número"></label>
    </div>
    <div id="vrOut"></div>
    <div class="modal-foot"><button class="btn" data-x type="button">Fechar</button><button class="btn primary" id="vrGo" type="button" hidden>Ler estrutura com o Claude</button></div>`);
  ov.querySelector('.modal').classList.add('wide');
  const steps = [['read', 'Abrindo o vídeo'], ['cuts', 'Detectando cortes e ritmo'], ['audio', 'Medindo a fala e o som'], ['frames', 'Separando quadros-chave'], ['ai', 'Claude lendo a estrutura']];
  const step = (id, s, d) => { const li = $(`#vrSteps li[data-id="${id}"]`); if (!li) return; li.dataset.s = s; if (d != null) li.querySelector('.detail').textContent = d; };
  const onFile = async f => {
    if (!f) return;
    $('#vrSteps').hidden = false; $('#vrSteps').innerHTML = steps.map(([id, l]) => `<li data-id="${id}" data-s="wait"><span class="dot"></span><span>${l}</span><span class="detail"></span></li>`).join('');
    $('#vrDrop').hidden = true; ctl = new AbortController();
    try {
      an = await analyzeViralFile(f, step, ctl.signal); an.name = f.name;
      $('#vrMore').hidden = false; $('#vrGo').hidden = false;
      $('#vrOut').innerHTML = `<div class="bp-card"><div class="bp-thumbs">${an.frames.slice(0, 6).map(x => `<img src="${x.thumb}" alt="">`).join('')}</div><div class="bp-strip">${an.metrics.shots.map(([a, z]) => `<i style="width:${((z - a) / an.metrics.dur * 100).toFixed(2)}%"></i>`).join('')}</div><p class="muted mono" style="margin:0;font-size:11.5px">${an.metrics.shots.length} tomadas · ${an.metrics.cutsPerMin} cortes/min · ${an.metrics.cutsIn3s} cortes nos 3 primeiros segundos · fala em ${an.metrics.speechCover ?? '?'}%</p></div>`;
      if (!aiAvailable()) { step('ai', 'warn', 'Claude indisponível aqui'); $('#vrGo').hidden = true; }
    } catch (e) { if (e?.code !== 'cancelled') { toast(e?.message || 'Não deu para analisar esse vídeo'); $('#vrDrop').hidden = false; $('#vrSteps').hidden = true; } }
  };
  $('#vrFile').onchange = e => onFile(e.target.files?.[0]);
  $('#vrDrop').addEventListener('dragover', e => e.preventDefault());
  $('#vrDrop').addEventListener('drop', e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); });
  $('#vrListen').onclick = async () => {
    if (!an) return; const b = $('#vrListen'); b.disabled = true; b.textContent = 'Ouvindo…';
    try { const ws = await transcribeLive(an.video, 'pt-BR', (k, n) => (b.textContent = `Ouvindo… ${Math.round(k * 100)}%`), ctl.signal); $('#vrText').value = ws.map(w => w.text).join(' '); b.textContent = 'Transcrito'; }
    catch (e) { b.textContent = 'Não deu para transcrever aqui. Cole a fala.'; }
  };
  $('#vrGo').onclick = async () => {
    if (!an) return; const go = $('#vrGo'); go.disabled = true; go.textContent = 'Lendo…'; step('ai', 'run');
    try {
      const r = await readBlueprint(an, $('#vrText').value.trim(), $('#vrNote').value.trim(), ctl.signal);
      const b = { id: uid(), kind: 'blueprint', created: Date.now(), source: an.name, metrics: an.metrics, thumbs: an.frames.map(f => f.thumb), bp: normBlueprint(r, an.metrics) };
      const where = await bpSave(b); BP.sel = b.id; renderBpPicker(); step('ai', 'done', where === 'cloud' ? 'salva na sua conta' : 'salva neste navegador');
      $('#vrOut').innerHTML = bpCardHTML(b, true); $('#vrMore').hidden = true;
      go.disabled = false; go.textContent = 'Usar no próximo vídeo'; go.onclick = () => { ov.remove(); toast('Estrutura escolhida. Escreva o tema e gere.'); };
    } catch (e) { step('ai', 'err', aiErr(e)); go.disabled = false; go.textContent = 'Tentar de novo'; }
  };
  const obs = new MutationObserver(() => { if (!ov.isConnected) { ctl?.abort(); if (an) { an.video.remove(); URL.revokeObjectURL(an.url); } obs.disconnect(); } });
  obs.observe($('#modalRoot'), { childList: true });
}

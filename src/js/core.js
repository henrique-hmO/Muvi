/* ============ CORE: utils, palettes, model, time mapping, history ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const uid = () => Math.random().toString(36).slice(2, 9);
const ease = {
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  inOut: k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  back: k => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
  expo: k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  elastic: k => (k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * (2 * Math.PI) / 3) + 1),
};
/* progress of an animation that starts at `s` and lasts `d`, inside scene-local time t */
const pr = (t, s, d) => clamp((t - s) / d);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function tc(sec, fps = 30, withFrames = false) {
  sec = Math.max(0, sec || 0);
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60), f = Math.floor((sec % 1) * fps);
  const base = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return withFrames ? `${base}:${String(f).padStart(2, '0')}` : base;
}
function fmtDur(sec) {
  sec = Math.round(sec);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}min${sec % 60 ? ' ' + (sec % 60) + 's' : ''}`;
}
function fmtNum(v, dec = 0) {
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/* ---------- Video looks (palettes for the generated video, not the editor UI) ---------- */
const LOOKS = {
  moove: {
    name: 'Moove IA', bg: '#04070D', ink: '#F8FAFC', muted: '#A6B0C3', a1: '#00D2FF', a2: '#D44CFF',
    surface: 'rgba(20,26,43,.75)', line: 'rgba(53,108,255,.16)', onA: '#04070D',
    display: 'Sora', dW: 800, body: 'Inter', bW: 500, upper: false, bg2: 'blobs', track: 0,
  },
  slate: {
    name: 'Claquete', bg: '#141414', ink: '#f2efe8', muted: '#a39f96', a1: '#f2b33d', a2: '#ff7a59',
    surface: 'rgba(255,255,255,.05)', line: 'rgba(242,179,61,.18)', onA: '#1a1306',
    display: 'Big Shoulders Display', dW: 900, body: 'Instrument Sans', bW: 500, upper: true, bg2: 'scan', track: .02,
  },
  clean: {
    name: 'Clean', bg: '#f5f6f8', ink: '#111521', muted: '#5d6476', a1: '#2b54f0', a2: '#14b8a6',
    surface: '#ffffff', line: 'rgba(17,21,33,.08)', onA: '#ffffff',
    display: 'Manrope', dW: 800, body: 'Manrope', bW: 500, upper: false, bg2: 'dots', track: -.01,
  },
  lousa: {
    name: 'Lousa', bg: '#1f3b30', ink: '#f1efe4', muted: '#b9c4b6', a1: '#ffd84d', a2: '#ff9ec7',
    surface: 'rgba(255,255,255,.06)', line: 'rgba(255,255,255,.14)', onA: '#1f3b30',
    display: 'Kalam', dW: 700, body: 'Kalam', bW: 400, upper: false, bg2: 'chalk', track: 0,
  },
  papel: {
    name: 'Papel', bg: '#efe8dc', ink: '#1c1a17', muted: '#6c645a', a1: '#cf3d27', a2: '#1f4e8c',
    surface: '#f8f3ea', line: 'rgba(28,26,23,.12)', onA: '#f8f3ea',
    display: 'Fraunces', dW: 700, body: 'Instrument Sans', bW: 500, upper: false, bg2: 'paper', track: -.01,
  },
};

const ASPECTS = { '9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080] };

const CAPTION_PRESETS = {
  cine: { name: 'Cinema', desc: 'Maiúscula grossa, palavra-chave em caixa vermelha, próxima palavra entra desfocada' },
  doc: { name: 'Documentário', desc: 'Condensada, palavra ativa em vermelho' },
  news: { name: 'Notícia', desc: 'Frase grande e limpa, sem caixa' },
  pop: { name: 'Pop', desc: 'Maiúscula, contorno, palavra ativa colorida' },
  toon: { name: 'Cartoon', desc: 'Branca com contorno grosso, nomes e números coloridos' },
  box: { name: 'Caixinha', desc: 'Texto em caixa escura, destaque em pílula' },
  karaoke: { name: 'Karaokê', desc: 'Palavras acendem conforme a fala' },
  big: { name: 'Uma por vez', desc: 'Uma palavra grande no centro' },
  minimal: { name: 'Discreta', desc: 'Frase em caixa-baixa, rodapé' },
};

/* ---------- Scene templates: schema drives the property panel ---------- */
const TEMPLATES = {
  hook:       { name: 'Gancho', fields: [['text', 'Frase (use *palavra* p/ destacar)', 'area'], ['kicker', 'Rótulo', 'text']] },
  title:      { name: 'Título', fields: [['kicker', 'Rótulo', 'text'], ['title', 'Título', 'area'], ['sub', 'Subtítulo', 'area']] },
  bullets:    { name: 'Lista', fields: [['title', 'Título', 'text'], ['items', 'Itens (um por linha)', 'list']] },
  stat:       { name: 'Número', fields: [['value', 'Valor', 'number'], ['prefix', 'Prefixo', 'text'], ['suffix', 'Sufixo', 'text'], ['label', 'Legenda do número', 'text'], ['note', 'Contexto', 'area']] },
  compare:    { name: 'Comparação', fields: [['title', 'Título', 'text'], ['leftLabel', 'Lado A', 'text'], ['left', 'Itens A', 'list'], ['rightLabel', 'Lado B', 'text'], ['right', 'Itens B', 'list'], ['verdict', 'Conclusão', 'text']] },
  steps:      { name: 'Passos', fields: [['title', 'Título', 'text'], ['steps', 'Passos (um por linha)', 'list']] },
  chart:      { name: 'Gráfico', fields: [['title', 'Título', 'text'], ['unit', 'Unidade', 'text'], ['bars', 'Barras (rótulo: valor)', 'bars']] },
  quote:      { name: 'Citação', fields: [['quote', 'Citação', 'area'], ['author', 'Autor', 'text']] },
  definition: { name: 'Definição', fields: [['term', 'Termo', 'text'], ['kind', 'Classe', 'text'], ['text', 'Definição', 'area']] },
  chat:       { name: 'Conversa', fields: [['title', 'Título', 'text'], ['messages', 'Mensagens (A: / B:)', 'chat']] },
  cta:        { name: 'Chamada final', fields: [['title', 'Título', 'area'], ['action', 'Botão', 'text'], ['handle', 'Perfil / site', 'text']] },
  clip:       { name: 'Trecho do vídeo', fields: [] },
  story:      { name: 'Cena narrada', fields: [] },
  talk:       { name: 'Diálogo', fields: [] },
  obj:        { name: 'Objeto explicativo', fields: [] },
  doc:        { name: 'Infográfico documental', fields: [] },
  photo:      { name: 'Foto real', fields: [] },
};
const OVERLAYS = {
  headline: { name: 'Título no topo', fields: [['text', 'Texto (*destaque*)', 'area']] },
  lower:    { name: 'Nome na base', fields: [['name', 'Nome', 'text'], ['role', 'Descrição', 'text']] },
  stat:     { name: 'Número', fields: [['value', 'Valor', 'number'], ['prefix', 'Prefixo', 'text'], ['suffix', 'Sufixo', 'text'], ['label', 'Rótulo', 'text']] },
  bullets:  { name: 'Lista lateral', fields: [['title', 'Título', 'text'], ['items', 'Itens', 'list']] },
  broll:    { name: 'Tela animada (B-roll)', fields: [] },
};

const DEFAULT_PROPS = {
  hook: { kicker: 'Você sabia?', text: 'Isso vai mudar *tudo*' },
  title: { kicker: 'Capítulo 1', title: 'O que é *automação*', sub: 'Em menos de um minuto' },
  bullets: { title: 'Por que importa', items: ['Economiza horas por semana', 'Reduz erros manuais', 'Escala sem contratar'] },
  stat: { value: 73, prefix: '', suffix: '%', label: 'das tarefas repetitivas', note: 'podem ser automatizadas hoje' },
  compare: { title: 'Antes e depois', leftLabel: 'Manual', left: ['3 horas por dia', 'Erros frequentes'], rightLabel: 'Com IA', right: ['15 minutos', 'Revisão automática'], verdict: 'A diferença paga o investimento' },
  steps: { title: 'Como começar', steps: ['Mapeie a tarefa', 'Escolha a ferramenta', 'Teste com um caso', 'Escale'] },
  chart: { title: 'Tempo gasto por semana', unit: 'h', bars: [{ label: 'Manual', value: 15 }, { label: 'Planilha', value: 9 }, { label: 'Com IA', value: 2 }] },
  quote: { quote: 'Quem não automatiza o repetitivo, trabalha para ele.', author: 'Moove IA' },
  definition: { term: 'Automação', kind: 'substantivo', text: 'Fazer um sistema executar sozinho uma tarefa que antes exigia uma pessoa.' },
  chat: { title: 'Na prática', messages: [{ from: 'a', text: 'Quanto custa o orçamento?' }, { from: 'b', text: 'Te mando em 30 segundos 👇' }, { from: 'b', text: 'Pronto! Orçamento enviado no seu e-mail.' }] },
  cta: { title: 'Quer isso na sua empresa?', action: 'Fale com a gente', handle: '@moove.ia' },
  clip: {},
  doc: { bg: 'wall', kicker: '', big: null, items: [{ type: 'calendar', weekday: 'DOMINGO', day: '18', month: 'OUTUBRO' }, { type: 'screen', badge: 'AO VIVO', caption: 'DEBATE', show: 'debate' }], crowd: 0, source: '', camera: 'push' },
  photo: { want: 'foto do assunto', img: '', label: '', kicker: '', source: '', grade: 'doc', move: 'in' },
  obj: { bg: 'stripes', title: '', item: { type: 'receipt', title: 'ORÇAMENTO', lines: ['Serviço'], total: 'R$ 800' }, who: null, cross: false },
  talk: { place: 'room', time: 'day', mood: 'normal', camera: 'auto', text: '', chars: [{ who: 'hero', x: .3, pose: 'stand', emotion: 'neutral', prop: 'none' }, { who: 'woman', x: .7, pose: 'cross', emotion: 'angry', prop: 'none' }], lines: [{ who: 'woman', text: 'Onde você estava ontem à noite?', emotion: 'angry' }, { who: 'hero', text: 'Eu posso explicar.', emotion: 'worried' }], lineTimes: null },
  story: { place: 'city', time: 'day', camera: 'push', mood: 'normal', icon: '', label: '', text: '', money: '', crowd: false, hero: { who: 'hero', pose: 'stand', emotion: 'neutral', prop: 'none', x: .5, facing: 'right' }, extras: [] },
};

function newScene(kind = 'title', p = {}, dur) {
  return {
    id: uid(), kind, dur: dur || defaultDur(kind, p), status: 'draft',
    p: { ...structuredClone(DEFAULT_PROPS[kind] || {}), ...p }, say: '', versions: [],
  };
}
function sayDur(say) { const n = String(say || '').split(/\s+/).filter(Boolean).length; return n ? clamp(n / 2.55 + .45, 2, 14) : 4; }
function defaultDur(kind, p = {}) {
  if (kind === 'talk') return talkDur(p);
  const base = { hook: 3, title: 4, bullets: 6, stat: 4.5, compare: 7, steps: 7, chart: 6, quote: 6, definition: 6, chat: 7, cta: 5, clip: 5 }[kind] || 5;
  const n = (p.items || p.steps || p.bars || p.messages || []).length;
  return Math.max(base, kind === 'bullets' || kind === 'steps' ? 2.4 + n * 1.2 : base);
}

function newProject(mode = 'explainer', aspect = '9:16') {
  return {
    id: uid(), title: 'Projeto sem nome', mode, aspect, fps: 30, look: 'moove', cineDark: typeof OPT !== 'undefined' && (mode === 'novela' || OPT.mode === 'novela' ? OPT.nvClima : OPT.clima) === 'escuro',
    chrome: mode === 'explainer', progressBar: mode === 'story', fit: 'cover',
    charStyle: 'cine', captions: { on: mode !== 'explainer', preset: mode === 'footage' ? 'box' : 'cine', pos: mode === 'footage' ? .74 : .7, upper: false, words: 3, accent: null },
    music: { kind: mode === 'footage' ? 'none' : 'pulse', vol: mode === 'story' ? .22 : .35, buffer: null, name: '' },
    sfx: mode !== 'footage', cast: mode === 'story' ? structuredClone(DEFAULT_CAST) : undefined,
    voice: { preview: true, id: 'pm_alex', speed: 1.05 }, narration: null,
    scenes: [], words: [], cuts: [], silences: [], source: null, brief: '',
  };
}

/* ---------- Time: scenes, kept segments, mapping ---------- */
function projectDuration(P) { return P.scenes.reduce((a, s) => a + sceneDur(P, s), 0); }

/* For clip scenes the duration is derived from the source range minus cuts */
function keptSegs(P, s) {
  if (s.kind !== 'clip' || !s.src) return null;
  let segs = [[s.src.in, s.src.out]];
  for (const [a, b] of P.cuts) {
    const next = [];
    for (const [x, y] of segs) {
      if (b <= x || a >= y) { next.push([x, y]); continue; }
      if (a > x) next.push([x, a]);
      if (b < y) next.push([b, y]);
    }
    segs = next;
  }
  return segs.filter(([x, y]) => y - x > 0.04);
}
function sceneDur(P, s) {
  if (s.kind === 'clip') { const k = keptSegs(P, s); return k ? k.reduce((a, [x, y]) => a + (y - x), 0) : s.dur; }
  return s.dur;
}
/* timeline t -> {index, scene, local, start, src (source seconds or null)} */
function locate(P, t) {
  let acc = 0;
  for (let i = 0; i < P.scenes.length; i++) {
    const s = P.scenes[i], d = sceneDur(P, s);
    if (t < acc + d || i === P.scenes.length - 1) {
      const local = clamp(t - acc, 0, d);
      let src = null;
      if (s.kind === 'clip') {
        const segs = keptSegs(P, s); let rem = local;
        for (const [x, y] of segs) { if (rem <= y - x) { src = x + rem; break; } rem -= (y - x); }
        if (src == null && segs.length) src = segs[segs.length - 1][1];
      }
      return { index: i, scene: s, local, start: acc, dur: d, src };
    }
    acc += d;
  }
  return null;
}
/* source seconds -> timeline seconds (or null if cut / outside) */
function srcToTimeline(P, st) {
  let acc = 0;
  for (const s of P.scenes) {
    const d = sceneDur(P, s);
    if (s.kind === 'clip') {
      for (const [x, y] of keptSegs(P, s)) {
        if (st >= x && st <= y) return acc + (st - x);
        acc += y - x;
      }
    } else acc += d;
  }
  return null;
}
function sceneStart(P, idx) { let a = 0; for (let i = 0; i < idx; i++) a += sceneDur(P, P.scenes[i]); return a; }
function mergeCuts(cuts) {
  const c = cuts.filter(([a, b]) => b - a > 0.01).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const r of c) { const l = out[out.length - 1]; if (l && r[0] <= l[1] + 0.02) l[1] = Math.max(l[1], r[1]); else out.push([...r]); }
  return out;
}

/* ---------- Words visible on the timeline (for captions) ---------- */
function timelineWords(P) {
  if (P.mode === 'footage') {
    const out = [];
    for (const w of P.words) {
      if (w.removed) continue;
      const a = srcToTimeline(P, w.t0 + 0.01), b = srcToTimeline(P, Math.max(w.t0 + 0.02, w.t1 - 0.01));
      if (a == null) continue;
      out.push({ text: w.text, t0: a, t1: b ?? a + (w.t1 - w.t0) });
    }
    return out;
  }
  if (P.narration?.words?.length) return P.narration.words;
  /* explainer/story: distribute each scene's `say` over its duration */
  const out = []; let acc = 0;
  for (const s of P.scenes) {
    const d = sceneDur(P, s);
    if (s.kind === 'talk') { talkTimes(P, s).forEach(([a, b], j) => { const ws = String(s.p.lines[j]?.text || '').split(/\s+/).filter(Boolean), tot = ws.reduce((x, w) => x + w.length + 2, 0); let c = 0; for (const w of ws) { const t0 = acc + a + (c / tot) * (b - a); c += w.length + 2; out.push({ text: w, t0, t1: acc + a + (c / tot) * (b - a) }); } }); acc += d; continue; }
    const ws = (s.say || '').split(/\s+/).filter(Boolean);
    if (ws.length) {
      const total = ws.reduce((a, w) => a + w.length + 2, 0), lead = acc === 0 ? 0 : Math.min(.3, d * .1);
      let c = 0;
      for (const w of ws) {
        const t0 = acc + lead + (c / total) * (d - lead * 2); c += w.length + 2;
        const t1 = acc + lead + (c / total) * (d - lead * 2);
        out.push({ text: w, t0, t1 });
      }
    }
    acc += d;
  }
  return out;
}

/* ---------- History (undo/redo) ---------- */
const H = { past: [], future: [] };
function snapshot(P) {
  const { source, music, narration, ...rest } = P;
  return JSON.stringify({ ...rest, music: { ...music, buffer: null }, narration: narration ? { ...narration, buffer: null } : null });
}
function pushHistory(label = '') {
  if (!S.project) return;
  H.past.push({ label, data: snapshot(S.project) });
  if (H.past.length > 80) H.past.shift();
  H.future.length = 0;
}
function restore(json) {
  const keep = { source: S.project.source, buffer: S.project.music.buffer, nb: S.project.narration?.buffer };
  const p = JSON.parse(json);
  p.source = keep.source; p.music.buffer = keep.buffer; if (p.narration) p.narration.buffer = keep.nb || null;
  S.project = p;
}
function undo() {
  const h = H.past.pop(); if (!h) return toast('Nada para desfazer');
  H.future.push({ label: h.label, data: snapshot(S.project) }); restore(h.data); afterChange(false);
  toast(h.label ? `Desfeito: ${h.label}` : 'Desfeito');
}
function redo() {
  const h = H.future.pop(); if (!h) return toast('Nada para refazer');
  H.past.push({ label: h.label, data: snapshot(S.project) }); restore(h.data); afterChange(false);
  toast('Refeito');
}

/* ---------- Global app state ---------- */
const S = {
  view: 'home', project: null, t: 0, playing: false, sel: 0,
  sample: null, downloads: null, aiState: 'checking',
  video: null, // HTMLVideoElement of the source footage
  fontsReady: false,
};

/* ---------- Draft persistence (per-viewer convenience only) ---------- */
const DRAFT_KEY = 'moove-studio.drafts.v1';
function saveDraft() {
  const P = S.project; if (!P) return;
  try {
    const all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]').filter(d => d.id !== P.id);
    all.unshift({ id: P.id, title: P.title, mode: P.mode, aspect: P.aspect, look: P.look, saved: Date.now(), data: P.mode !== 'footage' ? snapshot(P) : null, scenes: P.scenes.length, dur: projectDuration(P) });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all.slice(0, 12)));
  } catch (e) { /* storage unavailable: ignore */ }
  if (P.series) nvQueueSave(P);
  histQueue(P);
}
function loadDrafts() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); } catch (e) { return []; } }

/* ============ BRANDS: original fictional brands (own names + own marks) and channels by niche ============ */
const BRANDS = {
  pulo:      { name: 'PULO', cat: 'Tênis e roupa esportiva', c: ['#ff5a36', '#1c1b22'], mark: 'spring' },
  geladao:   { name: 'GELADÃO', cat: 'Refrigerante', c: ['#1e88e5', '#ffffff'], mark: 'cube' },
  mercadao:  { name: 'MERCADÃO', cat: 'Supermercado', c: ['#2e9d55', '#ffd23f'], mark: 'cart' },
  troco:     { name: 'TROCO', cat: 'Banco digital', c: ['#7b3ff2', '#ffffff'], mark: 'coin' },
  toon_tel:  { name: 'TÔ ON', cat: 'Operadora de celular', c: ['#e91e63', '#ffffff'], mark: 'signal' },
  chegou:    { name: 'CHEGOU', cat: 'App de entrega', c: ['#ff9800', '#1c1b22'], mark: 'box' },
  burgao:    { name: 'BURGÃO', cat: 'Fast-food', c: ['#d32f2f', '#ffd23f'], mark: 'burger' },
  boaviagem: { name: 'BOA VIAGEM', cat: 'Posto de gasolina', c: ['#00897b', '#ffeb3b'], mark: 'drop' },
  saudeja:   { name: 'SAÚDE JÁ', cat: 'Farmácia', c: ['#00a86b', '#ffffff'], mark: 'cross' },
  suor:      { name: 'SUOR', cat: 'Academia', c: ['#212121', '#c6ff00'], mark: 'dumbbell' },
  papo:      { name: 'PAPO', cat: 'App de mensagem', c: ['#5e35b1', '#ffffff'], mark: 'bubble' },
  telona:    { name: 'TELONA', cat: 'Streaming', c: ['#b71c1c', '#ffffff'], mark: 'play' },
  pixelbr:   { name: 'PIXEL BR', cat: 'Games', c: ['#3949ab', '#00e5ff'], mark: 'controller' },
  rodaviva:  { name: 'RODA VIVA', cat: 'Autopeças e oficina', c: ['#424242', '#ffc107'], mark: 'tire' },
  estrela:   { name: 'COLÉGIO ESTRELA', cat: 'Escola', c: ['#1565c0', '#ffd23f'], mark: 'star' },
  lardoce:   { name: 'LAR DOCE', cat: 'Imobiliária / aluguel', c: ['#6d4c41', '#ffcc80'], mark: 'house' },
  plantao:   { name: 'PLANTÃO 24', cat: 'TV / notícias', c: ['#c62828', '#ffffff'], mark: 'tv' },
  fofoca:    { name: 'BABADO', cat: 'Fofoca / celebridades', c: ['#ec407a', '#ffffff'], mark: 'star' },
  rapidao:   { name: 'RAPIDÃO', cat: 'Transporte por app', c: ['#1c1b22', '#ffd23f'], mark: 'bolt' },
  cafezin:   { name: 'CAFEZIN', cat: 'Padaria / café', c: ['#795548', '#fff3e0'], mark: 'cup' },
  firma:     { name: 'FIRMA S.A.', cat: 'Empresa / escritório', c: ['#37474f', '#80deea'], mark: 'tower' },
  vitrine:   { name: 'VITRINE', cat: 'Loja online', c: ['#00acc1', '#ffffff'], mark: 'bag' },
};
const NICHES = {
  humor: { name: 'Humor do dia a dia', brands: ['pulo', 'geladao', 'mercadao', 'chegou', 'burgao', 'rodaviva', 'toon_tel'] },
  financas: { name: 'Finanças e dinheiro', brands: ['troco', 'mercadao', 'lardoce', 'boaviagem', 'firma', 'vitrine'] },
  novela: { name: 'Novelinha / drama', brands: ['papo', 'troco', 'cafezin', 'lardoce', 'saudeja', 'rapidao'] },
  curiosidades: { name: 'Curiosidades', brands: ['plantao', 'geladao', 'mercadao', 'telona', 'pixelbr'] },
  crime: { name: 'Crime / histórias reais', brands: ['plantao', 'rapidao', 'boaviagem', 'papo', 'troco'] },
  saude: { name: 'Saúde e bem-estar', brands: ['saudeja', 'suor', 'mercadao', 'cafezin'] },
  fitness: { name: 'Fitness', brands: ['suor', 'pulo', 'geladao', 'saudeja'] },
  relacionamento: { name: 'Relacionamento', brands: ['papo', 'cafezin', 'burgao', 'telona', 'rapidao'] },
  tecnologia: { name: 'Tecnologia', brands: ['papo', 'toon_tel', 'pixelbr', 'vitrine', 'telona'] },
  comida: { name: 'Comida', brands: ['burgao', 'cafezin', 'mercadao', 'chegou', 'geladao'] },
  carros: { name: 'Carros', brands: ['rodaviva', 'boaviagem', 'rapidao', 'troco'] },
  games: { name: 'Games', brands: ['pixelbr', 'geladao', 'telona', 'chegou'] },
  escola: { name: 'Escola / estudos', brands: ['estrela', 'papo', 'cafezin', 'burgao'] },
  trabalho: { name: 'Trabalho / CLT', brands: ['firma', 'cafezin', 'rapidao', 'troco', 'papo'] },
  negocios: { name: 'Empreendedorismo', brands: ['vitrine', 'troco', 'firma', 'chegou', 'mercadao'] },
  fofoca: { name: 'Fofoca / famosos', brands: ['fofoca', 'plantao', 'telona', 'papo'] },
};

/* one original mark per brand: simple geometric icons, ink outline, inside a rounded badge */
function drawBrandMark(ctx, mark, s, fg) {
  const lw = Math.max(1, s * .07); ctx.lineWidth = lw; ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s))); if (fill) { ctx.closePath(); ctx.fill(); } else ctx.stroke(); };
  switch (mark) {
    case 'spring': P([[-.35, .3], [-.2, -.05], [-.05, .2], [.1, -.15], [.25, .1], [.38, -.3]]); break;
    case 'cube': P([[0, -.35], [.32, -.18], [0, 0], [-.32, -.18]], true); ctx.globalAlpha = .7; P([[-.32, -.18], [0, 0], [0, .36], [-.32, .18]], true); ctx.globalAlpha = .45; P([[.32, -.18], [0, 0], [0, .36], [.32, .18]], true); ctx.globalAlpha = 1; break;
    case 'cart': P([[-.38, -.25], [-.25, -.25], [-.15, .12], [.25, .12], [.33, -.12], [-.2, -.12]]); ctx.beginPath(); ctx.arc(-.1 * s, .26 * s, .06 * s, 0, 7); ctx.arc(.2 * s, .26 * s, .06 * s, 0, 7); ctx.fill(); break;
    case 'coin': ctx.beginPath(); ctx.arc(0, 0, .32 * s, 0, 7); ctx.stroke(); P([[-.12, .1], [.12, -.12]]); P([[.02, -.12], [.12, -.12], [.12, -.02]]); break;
    case 'signal': for (let i = 0; i < 4; i++) { ctx.fillRect((-.32 + i * .17) * s, (.3 - i * .17) * s, .1 * s, (i * .17 + .08) * s); } break;
    case 'box': P([[-.3, -.15], [0, -.3], [.3, -.15], [.3, .2], [0, .35], [-.3, .2]], true); ctx.strokeStyle = 'rgba(0,0,0,.35)'; P([[-.3, -.15], [0, 0], [.3, -.15]]); P([[0, 0], [0, .35]]); break;
    case 'burger': ctx.beginPath(); ctx.arc(0, -.02 * s, .32 * s, Math.PI, 0); ctx.fill(); ctx.fillRect(-.34 * s, .04 * s, .68 * s, .08 * s); ctx.fillRect(-.3 * s, .16 * s, .6 * s, .1 * s); break;
    case 'drop': ctx.beginPath(); ctx.moveTo(0, -.36 * s); ctx.quadraticCurveTo(.32 * s, .05 * s, 0, .33 * s); ctx.quadraticCurveTo(-.32 * s, .05 * s, 0, -.36 * s); ctx.fill(); break;
    case 'cross': ctx.fillRect(-.1 * s, -.32 * s, .2 * s, .64 * s); ctx.fillRect(-.32 * s, -.1 * s, .64 * s, .2 * s); break;
    case 'dumbbell': ctx.fillRect(-.3 * s, -.04 * s, .6 * s, .08 * s); for (const x of [-.3, .22]) { ctx.beginPath(); rr(ctx, x * s, -.2 * s, .08 * s, .4 * s, .02 * s); ctx.fill(); } break;
    case 'bubble': ctx.beginPath(); rr(ctx, -.32 * s, -.26 * s, .64 * s, .42 * s, .12 * s); ctx.fill(); P([[-.12, .14], [-.2, .32], [.04, .15]], true); break;
    case 'play': ctx.beginPath(); rr(ctx, -.34 * s, -.26 * s, .68 * s, .52 * s, .1 * s); ctx.stroke(); P([[-.08, -.13], [.14, 0], [-.08, .13]], true); break;
    case 'controller': ctx.beginPath(); rr(ctx, -.36 * s, -.16 * s, .72 * s, .32 * s, .14 * s); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-.24 * s, -.03 * s, .14 * s, .05 * s); ctx.fillRect(-.195 * s, -.08 * s, .05 * s, .14 * s); ctx.beginPath(); ctx.arc(.15 * s, -.04 * s, .035 * s, 0, 7); ctx.arc(.24 * s, .04 * s, .035 * s, 0, 7); ctx.fill(); break;
    case 'tire': ctx.beginPath(); ctx.arc(0, 0, .32 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, .12 * s, 0, 7); ctx.fill(); break;
    case 'star': { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = (i % 2 ? .15 : .36) * s, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); break; }
    case 'house': P([[-.3, -.02], [0, -.3], [.3, -.02], [.22, -.02], [.22, .3], [-.22, .3], [-.22, -.02]], true); break;
    case 'tv': ctx.beginPath(); rr(ctx, -.34 * s, -.22 * s, .68 * s, .46 * s, .06 * s); ctx.stroke(); P([[-.12, -.36], [0, -.22], [.12, -.36]]); break;
    case 'bolt': P([[.06, -.36], [-.2, .04], [-.02, .04], [-.08, .36], [.2, -.06], [.02, -.06]], true); break;
    case 'cup': ctx.beginPath(); rr(ctx, -.24 * s, -.12 * s, .4 * s, .4 * s, .06 * s); ctx.fill(); ctx.beginPath(); ctx.arc(.2 * s, .06 * s, .1 * s, -Math.PI / 2, Math.PI / 2); ctx.stroke(); P([[-.1, -.34], [-.06, -.2]]); P([[.04, -.34], [.08, -.2]]); break;
    case 'tower': for (const [x, h] of [[-.3, .5], [-.08, .66], [.14, .4]]) ctx.fillRect(x * s, (.3 - h) * s, .18 * s, h * s); break;
    case 'bag': ctx.beginPath(); rr(ctx, -.28 * s, -.12 * s, .56 * s, .44 * s, .05 * s); ctx.fill(); ctx.beginPath(); ctx.arc(0, -.12 * s, .14 * s, Math.PI, 0); ctx.stroke(); break;
  }
}
/* badge = mark + name; size = badge height in px */
function drawBrandBadge(ctx, id, x, y, size, opt = {}) {
  const b = BRANDS[id]; if (!b) return 0;
  const [bg, fg] = b.c, h = size, iconW = h, pad = h * .25;
  ctx.save(); ctx.font = `900 ${h * .52}px "Poppins", ${FALLBACK}`; const tw = opt.noText ? 0 : ctx.measureText(b.name).width;
  const w = iconW + (tw ? tw + pad * 1.4 : 0); const x0 = opt.align === 'left' ? x : x - w / 2;
  rr(ctx, x0, y - h / 2, w, h, h * .28); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = h * .06; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.translate(x0 + iconW / 2, y); drawBrandMark(ctx, b.mark, h * .9, fg); ctx.restore();
  if (tw) { ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(b.name, x0 + iconW, y + h * .03); }
  ctx.restore(); return w;
}
const brandOf = s => (BRANDS[s] ? s : Object.keys(BRANDS).find(k => BRANDS[k].name.toLowerCase() === String(s || '').toLowerCase()) || '');

/* ---------- channels: a niche + its brands, picked when generating ---------- */
const CH = { list: [], sel: '' };
const CH_LOCAL = 'moove-studio.channels.v1';
async function chLoadAll() {
  await nvInit(); let list = [];
  if (NV.db) { try { const s = await NV.db.collection(`data/users/${NV.uid}`).where('kind', '==', 'channel').get(); list = s.docs.map(d => d.data()).filter(Boolean); } catch (e) { console.warn(e); } }
  try { for (const c of JSON.parse(localStorage.getItem(CH_LOCAL) || '[]')) if (!list.find(x => x.id === c.id)) list.push(c); } catch (e) { }
  CH.list = list; try { CH.sel = localStorage.getItem(CH_LOCAL + '.sel') || ''; } catch (e) { } if (!CH.list.find(c => c.id === CH.sel)) CH.sel = '';
  return list;
}
async function chSave(c) {
  await nvInit(); CH.list = [c, ...CH.list.filter(x => x.id !== c.id)];
  if (NV.db) { try { await NV.db.doc(`data/users/${NV.uid}/ch_${c.id}`).set(JSON.parse(JSON.stringify(c))); return; } catch (e) { console.warn(e); } }
  try { localStorage.setItem(CH_LOCAL, JSON.stringify(CH.list)); } catch (e) { }
}
async function chDelete(id) { CH.list = CH.list.filter(c => c.id !== id); if (CH.sel === id) CH.sel = ''; if (NV.db) { try { await NV.db.doc(`data/users/${NV.uid}/ch_${id}`).delete(); } catch (e) { } } try { localStorage.setItem(CH_LOCAL, JSON.stringify(CH.list)); } catch (e) { } }
const chOf = id => CH.list.find(c => c.id === id);
function brandBrief(ch) {
  if (!ch) return '';
  const ids = ch.brands?.length ? ch.brands : NICHES[ch.niche]?.brands || [];
  return `\nCANAL: "${ch.name}" (nicho: ${NICHES[ch.niche]?.name || ch.niche}). Marcas FICTÍCIAS do canal, nunca use marcas reais: ${ids.map(k => `${k}=${BRANDS[k].name} (${BRANDS[k].cat})`).join('; ')}.${ch.house ? ` Marca da casa (aparece sempre): ${ch.house}.` : ''}
Use os ids: no elenco "capBrand"/"shirtBrand" (boné e camiseta), em cenas "story" o set "sign" com "brand":"<id>" (fachada/outdoor/sacola), e em itens de "obj" o campo "brand". Coloque marca onde for natural (2 a 4 vezes no vídeo), combinando com o roteiro.\n`;
}
function renderChPicker() {
  for (const box of $$('[data-chpick]')) box.innerHTML = `<button type="button" class="chip" data-ch="" aria-pressed="${!CH.sel}">Sem canal</button>${CH.list.map(c => `<button type="button" class="chip" data-ch="${c.id}" aria-pressed="${CH.sel === c.id}">${esc(c.name)}</button>`).join('')}<button type="button" class="chip bp-new" data-ch="new">+ Canal</button>${CH.sel ? '<button type="button" class="chip" data-ch="edit">Editar</button>' : ''}`;
}
function initChannels() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-chpick] [data-ch]'); if (!b) return; const v = b.dataset.ch;
    if (v === 'new') return openChannelModal(); if (v === 'edit') return openChannelModal(chOf(CH.sel));
    CH.sel = v; try { localStorage.setItem(CH_LOCAL + '.sel', v); } catch (er) { } renderChPicker();
  });
  renderChPicker(); chLoadAll().then(renderChPicker);
}
function openChannelModal(ch) {
  const c = ch ? structuredClone(ch) : { id: uid(), kind: 'channel', name: '', niche: 'humor', brands: [...NICHES.humor.brands], house: '' };
  const ov = modal(`<h3>${ch ? 'Editar canal' : 'Novo canal'}</h3>
    <label class="field"><span>Nome do canal</span><input class="input" id="chName" value="${esc(c.name)}" placeholder="Ex.: Cleitinho do Dia a Dia"></label>
    <div class="field"><span>Nicho</span><div class="chips" id="chNiche">${Object.entries(NICHES).map(([k, n]) => `<button type="button" class="chip" data-v="${k}" aria-pressed="${c.niche === k}">${esc(n.name)}</button>`).join('')}</div></div>
    <div class="field"><span>Marcas fictícias que aparecem nos vídeos</span><div class="brand-grid" id="chBrands"></div></div>
    <label class="field"><span>Marca da casa (opcional: nome que aparece em todo vídeo, ex.: boné do personagem)</span><input class="input" id="chHouse" value="${esc(c.house || '')}" placeholder="Ex.: AUTOPEÇAS DO TIÃO"></label>
    <div class="modal-foot">${ch ? '<button class="btn danger ghost" id="chDel" type="button">Apagar canal</button>' : ''}<button class="btn" data-x type="button">Cancelar</button><button class="btn primary" id="chOk" type="button">Salvar canal</button></div>`);
  ov.querySelector('.modal').classList.add('wide');
  const draw = () => {
    $('#chBrands').innerHTML = Object.entries(BRANDS).map(([k, b]) => `<button type="button" class="brand-chip" data-b="${k}" aria-pressed="${c.brands.includes(k)}"><canvas width="220" height="56" data-badge="${k}"></canvas><small>${esc(b.cat)}</small></button>`).join('');
    $$('#chBrands canvas[data-badge]').forEach(cv => { const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); drawBrandBadge(x, cv.dataset.badge, 6, 28, 40, { align: 'left' }); });
  };
  draw();
  $('#chNiche').onclick = e => { const b = e.target.closest('button'); if (!b) return; c.niche = b.dataset.v; c.brands = [...NICHES[c.niche].brands]; $$('#chNiche button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); };
  $('#chBrands').onclick = e => { const b = e.target.closest('[data-b]'); if (!b) return; const k = b.dataset.b; c.brands = c.brands.includes(k) ? c.brands.filter(x => x !== k) : [...c.brands, k]; b.setAttribute('aria-pressed', c.brands.includes(k)); };
  $('#chOk').onclick = async () => { c.name = $('#chName').value.trim() || NICHES[c.niche].name; c.house = $('#chHouse').value.trim().slice(0, 24); await chSave(c); CH.sel = c.id; try { localStorage.setItem(CH_LOCAL + '.sel', c.id); } catch (e) { } renderChPicker(); ov.remove(); toast(`Canal “${c.name}” salvo`); };
  if (ch) $('#chDel').onclick = async () => { await chDelete(ch.id); renderChPicker(); ov.remove(); toast('Canal apagado'); };
}

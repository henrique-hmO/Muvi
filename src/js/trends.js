/* ============ TRENDS: live Google Trends (official RSS) through the Firecrawl connector ============ */
const TR = { geo: 'BR', items: [], at: 0, loading: false, err: '', ideas: {} };
const GEOS = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos' };
function parseTrendsXML(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const tag = (el, n) => el.getElementsByTagName(n)[0]?.textContent?.trim() || '';
  return [...doc.getElementsByTagName('item')].map(it => ({
    title: tag(it, 'title'), traffic: tag(it, 'ht:approx_traffic'), date: new Date(tag(it, 'pubDate')),
    news: [...it.getElementsByTagName('ht:news_item')].slice(0, 3).map(n => ({ title: tag(n, 'ht:news_item_title'), url: tag(n, 'ht:news_item_url'), source: tag(n, 'ht:news_item_source') })),
  })).filter(x => x.title);
}
function findXML(r) {
  const pl = r?.payload;
  const cands = [pl?.rawHtml, pl?.data?.rawHtml, pl?.html, typeof pl === 'string' ? pl : null];
  for (const c of r?.content || []) if (c?.text) { try { const j = JSON.parse(c.text); cands.push(j.rawHtml, j.data?.rawHtml, j.html); } catch (e) { cands.push(c.text); } }
  return cands.find(c => typeof c === 'string' && c.trimStart().startsWith('<') && c.includes('<rss')) || '';
}
async function loadTrends(force) {
  if (TR.loading) return; TR.loading = true; TR.err = ''; renderTrends();
  try {
    const mcp = await window.claude?.use?.('mcp');
    if (!mcp) throw { message: 'Os conectores só funcionam com o app aberto pelo claude.ai.' };
    const cache = { staleTime: 10 * 60 * 1000, gcTime: 15 * 60 * 1000, ...(force ? { refresh: true } : {}) };
    const r = await mcp.callTool('Firecrawl', 'firecrawl_scrape', { url: `https://trends.google.com/trending/rss?geo=${TR.geo}`, formats: ['rawHtml'], maxAge: 0, objective: 'Ler os assuntos em alta agora no Google Trends para criar vídeos' }, { cache });
    const xml = findXML(r); if (!xml) throw { message: 'O Google Trends não respondeu desta vez. Tente atualizar.' };
    TR.items = parseTrendsXML(xml); TR.at = Date.now();
    if (!TR.items.length) throw { message: 'Nenhum assunto em alta veio na resposta. Tente atualizar.' };
  } catch (e) {
    TR.err = e?.code === 'not_granted' || e?.code === 'denied' ? 'O Firecrawl não foi liberado para esta página. Clique em Atualizar e permita.' : e?.code === 'server_not_connected' ? 'Conecte o Firecrawl em Configurações → Conectores do claude.ai.' : (e?.message || 'Não deu para carregar agora.');
  } finally { TR.loading = false; renderTrends(); }
}
function trafficLabel(t) { const n = String(t).replace(/\D/g, ''); if (!n) return t; const v = +n; return v >= 1e6 ? `${v / 1e6} mi+ buscas` : v >= 1000 ? `${v / 1000} mil+ buscas` : `${v}+ buscas`; }
function ago(d) { const m = Math.round((Date.now() - d) / 60000); if (!(m >= 0)) return ''; return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function renderTrends() {
  const box = $('#trendsBody'); if (!box) return;
  $('#trendsGeo').value = TR.geo;
  $('#trendsAt').textContent = TR.loading ? 'Buscando…' : TR.at ? `Atualizado ${ago(TR.at) || 'agora'}` : '';
  if (TR.err) { box.innerHTML = `<p class="notice" style="margin:0">${esc(TR.err)}</p>`; return; }
  if (!TR.items.length) { box.innerHTML = `<div class="trend-empty"><p style="margin:0">Veja o que as pessoas estão buscando agora no Google e transforme em vídeo.</p><button class="btn primary" type="button" data-tr="load">${TR.loading ? 'Carregando…' : 'Ver o que está em alta'}</button><p class="muted" style="margin:0;font-size:12px">Dados ao vivo do Google Trends via seu conector Firecrawl (1 crédito por atualização; fica guardado por 10 minutos).</p></div>`; return; }
  const max = Math.max(...TR.items.map(i => +String(i.traffic).replace(/\D/g, '') || 0), 1);
  box.innerHTML = TR.items.map((it, i) => {
    const v = +String(it.traffic).replace(/\D/g, '') || 0, ideas = TR.ideas[it.title];
    return `<article class="trend">
      <div class="trend-head"><span class="trend-rank mono">${String(i + 1).padStart(2, '0')}</span><div style="min-width:0"><h4>${esc(cap(it.title))}</h4>
        <div class="trend-meta"><span class="pill">${esc(trafficLabel(it.traffic))}</span><span>${esc(ago(it.date))}</span></div>
        <div class="trend-bar"><i style="width:${Math.max(6, v / max * 100)}%"></i></div></div></div>
      ${it.news.length ? `<ul class="trend-news">${it.news.slice(0, 2).map(n => `<li><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a> <span class="muted">· ${esc(n.source)}</span></li>`).join('')}</ul>` : ''}
      ${ideas ? `<ul class="trend-ideas">${ideas.map(x => `<li>“${esc(x)}”</li>`).join('')}</ul>` : ''}
      <div class="chips"><button class="btn sm primary" type="button" data-tr="story" data-i="${i}">Criar história narrada</button><button class="btn sm" type="button" data-tr="explainer" data-i="${i}">Criar explicativo</button><button class="btn sm ai" type="button" data-tr="ideas" data-i="${i}" ${aiAvailable() ? '' : 'hidden'}>${ideas === null ? 'Pensando…' : 'Ganchos'}</button></div>
    </article>`;
  }).join('');
}
function trendBrief(it) {
  const news = it.news.map(n => `- ${n.title} (${n.source})`).join('\n');
  return `Assunto em alta no Google agora (${GEOS[TR.geo]}, ${trafficLabel(it.traffic)}): "${it.title}".\nManchetes que puxaram a alta:\n${news}\nFaça um vídeo para quem está buscando isso agora: explique o que aconteceu e por que importa, usando só o que as manchetes dizem. Não invente fatos, números ou falas.`;
}
function initTrends() {
  $('#trendsBtn').onclick = () => openTrends();
  $('#trendsClose').onclick = () => closeTrends();
  $('#trendsRefresh').onclick = () => loadTrends(true);
  $('#trendsGeo').onchange = e => { TR.geo = e.target.value; TR.items = []; TR.ideas = {}; loadTrends(false); };
  $('#trendsScrim').onclick = () => closeTrends();
  $('#trendsBody').onclick = async e => {
    const b = e.target.closest('[data-tr]'); if (!b) return; const a = b.dataset.tr, it = TR.items[+b.dataset.i];
    if (a === 'load') return loadTrends(false);
    if (a === 'story' || a === 'explainer') {
      closeTrends(); show('home');
      $(`#tab-${a}`).click(); $('#brief').value = trendBrief(it); $('#brief').focus();
      toast('Tema em alta carregado. Ajuste duração e formato e gere.');
    }
    if (a === 'ideas') {
      TR.ideas[it.title] = null; renderTrends();
      try { const r = await S.sample.json(`Assunto em alta no Google no Brasil agora: "${it.title}". Manchetes: ${it.news.map(n => n.title).join(' | ')}.\nEscreva 3 ganchos de abertura para vídeos curtos em português do Brasil (até 12 palavras cada), fiéis às manchetes, sem inventar fatos. Responda só com JSON: ["...","...","..."]`, { modelTier: 'quick', cache: false }); TR.ideas[it.title] = (Array.isArray(r) ? r : []).slice(0, 3).map(String); }
      catch (err) { delete TR.ideas[it.title]; toast(aiErr(err)); }
      renderTrends();
    }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#trends').hidden) closeTrends(); });
}
function openTrends() { $('#trends').hidden = false; $('#trendsScrim').hidden = false; renderTrends(); if (!TR.items.length && !TR.err) loadTrends(false); setTimeout(() => $('#trendsClose').focus(), 30); }
function closeTrends() { $('#trends').hidden = true; $('#trendsScrim').hidden = true; $('#trendsBtn').focus(); }

/* real headlines for factual scripts: Google News RSS through Firecrawl (1 call) */
async function searchNews(topic) {
  const mcp = await window.claude?.use?.('mcp'); if (!mcp) return [];
  const q = String(topic).split(/[\n.!?]/).find(x => x.trim().length > 3)?.replace(/\s+/g, ' ').trim().slice(0, 100) || String(topic).slice(0, 100);
  const r = await mcp.callTool('Firecrawl', 'firecrawl_scrape', { url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`, formats: ['rawHtml'], maxAge: 0, objective: 'Achar notícias reais sobre o tema do vídeo para citar manchetes verdadeiras' }, { cache: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 } });
  const xml = findXML(r); if (!xml) return [];
  const doc = new DOMParser().parseFromString(xml, 'text/xml'), out = [];
  doc.querySelectorAll('item').forEach(it => { if (out.length >= 8) return; const g = sel => it.querySelector(sel)?.textContent?.trim() || ''; let title = g('title'); const site = g('source'); if (site && title.endsWith(' - ' + site)) title = title.slice(0, -(site.length + 3)); const d = new Date(g('pubDate')); out.push({ title, site, url: g('link'), date: isNaN(d) ? '' : d.toLocaleDateString('pt-BR') }); });
  return out;
}
function newsBrief(list) {
  if (!list?.length) return '';
  return `\nNOTÍCIAS REAIS ENCONTRADAS AGORA NO GOOGLE NOTÍCIAS (se o assunto for real, use-as nos cartões "news" copiando título, site e data EXATAMENTE e coloque "url" com o link; não invente outras):\n${list.map((n, i) => `${i + 1}) ${n.title} | ${n.site} | ${n.date} | ${n.url}`).join('\n')}\n`;
}

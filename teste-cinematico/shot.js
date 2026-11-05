const { chromium } = require('playwright');
const SC = [
 ['park', 'night', [{ type: 'dog', x: .3, y: .86, size: .45 }], 'friend', 'O CACHORRO *SUMIU* NA PRAÇA', { L: [{ cone: [300, 200, 420, 1700, 420], w0: 30, k: .9 }], G: [[300, 210, 120, '255,220,160', .5]] }],
 ['road', 'night', [{ type: 'supercar', anim: 'idle', x: .5, y: .82, size: 1.1, color: '#b3121b' }], 'none', 'ELE COMPROU UM *SUPERCARRO*', { L: [{ x: 540, y: 1450, r: 620, k: .9 }, { cone: [900, 1500, 1300, 1450, 260], w0: 40, k: .8 }], G: [[860, 1480, 140, '255,240,200', .55], [170, 1470, 90, '255,40,40', .45]] }],
 ['sea', 'dusk', [{ type: 'yacht', x: .5, y: .78, size: 1.2 }], 'none', 'A FESTA NO *IATE* ACABOU MAL', { L: [{ x: 540, y: 1350, r: 700, k: .85 }, { x: 540, y: 500, r: 700, k: .5 }], G: [[540, 560, 500, '240,110,70', .2]] }],
 ['sky', 'night', [{ type: 'plane', anim: 'idle', x: .5, y: .4, size: 1.2 }], 'none', 'O AVIÃO *SUMIU* DO RADAR', { L: [{ x: 540, y: 760, r: 760, k: .9 }], G: [[880, 300, 160, '220,215,200', .25], [140, 760, 40, '255,50,50', .8]] }],
 ['market2', 'night', [], 'hero', 'A LOJA JÁ TAVA *FECHADA*', { L: [{ cone: [540, 120, 540, 1800, 480], w0: 50, k: .9 }], G: [[540, 130, 120, '200,230,255', .45]] }],
 ['favela', 'night', [], 'hero', 'NINGUÉM *VIU* NADA', { L: [{ cone: [200, 300, 560, 1800, 420], w0: 30, k: .88 }, { x: 540, y: 1700, r: 900, k: .3 }], G: [[200, 300, 130, '255,200,120', .55], [820, 1300, 40, '255,200,120', .4], [700, 1150, 40, '255,200,120', .4]] }],
 ['office', 'night', [], 'hero', 'ELE FICOU ATÉ *TARDE*', { L: [{ x: 700, y: 1500, r: 520, k: .9 }, { x: 540, y: 1300, r: 760, k: .4 }], G: [[700, 1500, 240, '150,190,255', .35]] }],
 ['hospital', 'night', [], 'friend', 'O MÉDICO *MENTIU*', { L: [{ cone: [540, 100, 540, 1850, 520], w0: 60, k: .9 }], G: [[540, 110, 140, '210,240,255', .5], [870, 1500, 60, '80,255,140', .35]] }],
 ['cabin', 'night', [], 'hero', 'NO MEIO DO *VOO*', { L: [{ x: 540, y: 1300, r: 760, k: .75 }, { x: 780, y: 1250, r: 260, k: .6 }, { x: 160, y: 1250, r: 260, k: .6 }], G: [[540, 1100, 400, '120,150,255', .1]] }],
];
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 pg.on('pageerror', e => console.log('ERR', e.message));
 await pg.goto('file://' + __dirname + '/show.html'); await pg.waitForFunction('window.__cine'); await pg.waitForTimeout(800);
 for (let i = 0; i < SC.length; i++) {
  const [place, time, things, who, cap, L] = SC[i];
  const url = await pg.evaluate(({ place, time, things, who, cap, L, i }) => {
    const P = newProject('story', '9:16'); P.captions.on = false; P.progressBar = false; P.sfx = false;
    const props = structuredClone(DEFAULT_PROPS.story); Object.assign(props, { place, time, things, camera: 'static' });
    props.hero = { ...props.hero, who, x: things.length ? .7 : .5 };
    P.scenes = [newScene('story', props, 4)];
    const A = document.createElement('canvas'); A.width = 1080; A.height = 1920; const a = A.getContext('2d');
    drawFrame(a, P, 1.5);
    const O = document.createElement('canvas'); O.width = 1080; O.height = 1920; const c = O.getContext('2d');
    c.filter = 'saturate(.5) contrast(1.15) brightness(.8)'; c.drawImage(A, 0, 0); c.filter = 'none';
    c.fillStyle = 'rgba(45,30,22,.18)'; c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, 1080, 1920); c.globalCompositeOperation = 'source-over';
    CINE.lights(c, L.L, .78); for (const g of L.G) CINE.glow(c, ...g);
    CINE.vignette(c, .7, .3); CINE.cap(c, cap); CINE.grain(c, i);
    return O.toDataURL('image/jpeg', .9);
  }, { place, time, things, who, cap, L, i });
  require('fs').writeFileSync(`var_${i}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
 }
 await b.close(); })();

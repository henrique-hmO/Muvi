/* ============ Interface animada com GSAP (prévia) ============ */
(function () {
  const B = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/';
  const load = src => new Promise((ok, no) => { const e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = no; document.head.append(e); });
  load(B + 'gsap.min.js').then(() => Promise.all(['Flip', 'SplitText', 'ScrambleTextPlugin', 'CustomEase'].map(n => load(B + n + '.min.js')))).then(init).catch(e => console.warn('GSAP não carregou, app segue sem animação', e));

  function init() {
    gsap.registerPlugin(Flip, SplitText, ScrambleTextPlugin, CustomEase);
    CustomEase.create('moove', '0.22,1,0.36,1');
    gsap.defaults({ ease: 'moove', duration: .6 });
    document.documentElement.classList.add('gsap-on');
    const mm = gsap.matchMedia();
    mm.add({ anim: '(prefers-reduced-motion: no-preference)', mouse: '(hover: hover) and (pointer: fine)' }, ctx => {
      const { anim, mouse } = ctx.conditions; if (!anim) return;

      /* 1. abertura da home: título sobe letra por letra, sublinhado se desenha, resto entra em cascata */
      const h1 = document.querySelector('.home h1'), em = h1?.querySelector('em');
      const split = h1 && SplitText.create(h1, { type: 'words,chars', mask: 'words' });
      const tl = gsap.timeline({ delay: .15 });
      tl.from('.hero-logo', { autoAlpha: 0, y: 10 })
        .from(split ? split.chars : [], { yPercent: 110, duration: .9, stagger: .016 }, '<.1')
        .fromTo(em, { '--u': 0 }, { '--u': 1, duration: .7, ease: 'power3.inOut' }, '-=.45')
        .from('.home .lede', { autoAlpha: 0, y: 14 }, '-=.6')
        .from('.modes button', { autoAlpha: 0, y: 18, stagger: .06 }, '-=.45')
        .from('.home .panel, .home .composer, .home .modes ~ *', { autoAlpha: 0, y: 12, stagger: .05 }, '-=.35')
        .from('#examples button', { autoAlpha: 0, x: -12, stagger: .05 }, '-=.3');
      const ex = [...document.querySelectorAll('.label')].find(l => /exemplo/i.test(l.textContent));
      if (ex) tl.to(ex, { duration: 1, scrambleText: { text: ex.textContent, chars: '01#%', speed: .5 } }, .3);

      /* 2. indicador dos modos desliza de um para o outro (Flip) */
      const modes = document.querySelector('.modes');
      let ind = null;
      if (modes) {
        ind = document.createElement('i'); ind.className = 'mode-ind';
        const place = () => { const sel = modes.querySelector('[aria-selected="true"]'); if (sel && ind.parentNode !== sel) sel.append(ind); };
        place();
        new MutationObserver(() => {
          const sel = modes.querySelector('[aria-selected="true"]'); if (!sel || ind.parentNode === sel) return;
          const st = Flip.getState(ind); sel.append(ind); Flip.from(st, { duration: .5, ease: 'power3.inOut' });
          const box = modes.nextElementSibling; box && gsap.from(box.querySelectorAll('.field, .examples, .chips, .actions'), { autoAlpha: 0, y: 8, stagger: .03, duration: .35, overwrite: true });
        }).observe(modes, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
      }

      /* 3. chips e botões respondem ao toque com mola */
      const press = e => { const b = e.target.closest('.chip, .btn'); if (b && !b.disabled) gsap.fromTo(b, { scale: .94 }, { scale: 1, duration: .45, ease: 'back.out(3)', overwrite: true }); };
      document.addEventListener('pointerdown', press);

      /* 4. botão principal "magnético" no computador */
      const mag = [];
      if (mouse) document.querySelectorAll('.btn.primary.lg').forEach(b => {
        const xTo = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3' });
        const mv = e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35); };
        const lv = () => { xTo(0); yTo(0); };
        b.addEventListener('pointermove', mv); b.addEventListener('pointerleave', lv); mag.push([b, mv, lv]);
      });

      /* 5. troca de tela: conteúdo entra em cascata; cards da aprovação sobem um por um */
      const _show = window.show;
      window.show = show = function (v) {
        _show.apply(this, arguments);
        const el = document.getElementById('v-' + v); if (!el) return;
        gsap.from(el.querySelectorAll(':scope > * > *'), { autoAlpha: 0, y: 14, stagger: .04, duration: .45, clearProps: 'all' });
        requestAnimationFrame(() => gsap.from(el.querySelectorAll('.card'), { autoAlpha: 0, y: 24, scale: .97, stagger: { each: .05, from: 'start' }, duration: .5, clearProps: 'all' }));
      };

      /* 6. aviso (toast) entra com mola */
      const t = document.getElementById('toast');
      if (t) new MutationObserver(() => { if (t.classList.contains('show')) gsap.fromTo(t, { y: 24, scale: .96 }, { y: 0, scale: 1, duration: .5, ease: 'back.out(2)', overwrite: true }); }).observe(t, { attributes: true, attributeFilter: ['class'] });

      return () => { split?.revert(); ind?.remove(); document.removeEventListener('pointerdown', press); mag.forEach(([b, mv, lv]) => { b.removeEventListener('pointermove', mv); b.removeEventListener('pointerleave', lv); }); window.show = show = _show; };
    });
  }
})();

# GSAP — referência para o Muvi

Lido em 13/11/2026 de gsap.com/docs/v3. GSAP é **100% grátis**, inclusive os plugins que eram pagos (Webflow comprou e liberou). Versão atual nas demos oficiais: `gsap@3.15.0`.

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<!-- plugins: .../dist/Flip.min.js, SplitText.min.js, CustomEase.min.js etc. -->
<script>gsap.registerPlugin(Flip, SplitText, CustomEase);</script>
```

## Como isso entra no Muvi (importante)

- **Vídeos são desenhados no canvas**, quadro a quadro, e a exportação precisa ser exata por quadro. GSAP anima **qualquer objeto JS** (`gsap.to(obj, {x: 100})`), não só HTML. Uso seguro: criar uma timeline **pausada** por cena e, no `drawFrame`, chamar `tl.time(tempoLocal)` (ou `tl.progress(p)`) antes de desenhar. Nunca depender do relógio do GSAP na exportação.
- **Interface do app** (HTML): Flip (reordenar cenas, abrir cards), SplitText (título da home), botões e transições de tela.
- Respeitar `prefers-reduced-motion` com `gsap.matchMedia()`.

## Núcleo

- `gsap.to(alvo, vars)`, `gsap.from()`, `gsap.fromTo(alvo, de, para)`, `gsap.set()`.
- Propriedades especiais: `duration` (padrão 0.5), `delay`, `ease`, `stagger`, `repeat` (-1 = infinito), `repeatDelay`, `yoyo`, `overwrite` (true/"auto"/false), `immediateRender`, `keyframes`, `paused`, `runBackwards`, `inherit`, callbacks `onStart/onUpdate/onComplete/onRepeat/onReverseComplete` (+ `*Params`, `callbackScope`).
- Valores por função: `x: (i, alvo, lista) => i * 100`. Relativos: `x: "+=50"`.
- Controle (tween e timeline): `play pause resume reverse restart seek time progress timeScale duration kill invalidate revert`.

## Timeline

```js
const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
tl.to(a, { x: 100 })
  .to(b, { y: 50 }, "<")        // começa junto com o anterior
  .to(c, { scale: 2 }, ">0.2")  // 0.2s depois do fim do anterior
  .addLabel("virada", 3)
  .to(d, { opacity: 0 }, "virada+=0.5");
tl.time(2.4); // posiciona o playhead (o que o Muvi usa por quadro)
```

Parâmetro de posição: número (absoluto), `"+=1"`/`"-=1"` (relativo ao fim), `"rotulo"`, `"rotulo+=2"`, `"<"` (início do recente), `">"` (fim do recente), `"<1"`, `">-0.5"`.
Métodos extras: `add addLabel addPause call clear currentLabel nextLabel previousLabel getChildren getTweensOf tweenTo tweenFromTo shiftChildren totalDuration totalProgress`.

## Eases

`none`, `power1..4`, `back(1.7)`, `circ`, `elastic(amp, periodo)`, `expo`, `sine`, `bounce`, `steps(n)`. Cada um com `.in`, `.out`, `.inOut`.
Extras: `CustomEase.create("nome", "0.1,0.2,0.49,1")`, `CustomWiggle.create("tremer", {wiggles: 15, type: "easeOut"})`, `CustomBounce`, `RoughEase` (tremido aleatório), `SlowMo` (câmera lenta no meio), `ExpoScaleEase` (zoom com escala natural).

## Stagger e keyframes

- `stagger: { each: 0.1 }` ou `{ amount: 1 }`, `from: "start"|"center"|"edges"|"random"|"end"|índice`, `grid: "auto"|[linhas, colunas]`, `axis: "x"|"y"`, `ease`. Também aceita função `(i, alvo, lista) => atraso`.
- Keyframes (só em `to()`): array de objetos (`[{x:100, duration:1}, {y:50}]`), porcentagens (`{"0%": {...}, "75%": {...}}`) ou arrays de valores (`{x: [100, 0, 50], easeEach: "sine.inOut"}`).

## Utilitários (gsap.utils)

`clamp`, `mapRange`, `normalize`, `interpolate` (números, cores, strings, objetos), `random(min, max, snap)` / `random(array)`, `snap`, `wrap`, `wrapYoyo`, `distribute`, `shuffle`, `splitColor`, `toArray`, `getUnit`, `unitize`, `pipe`, `selector`, `checkPrefix`. Sem o último argumento, devolvem uma função reutilizável.
Outros: `gsap.quickTo`, `gsap.quickSetter`, `gsap.getProperty`, `gsap.killTweensOf`, `gsap.delayedCall`, `gsap.registerEffect`, `gsap.defaults`, `gsap.config`.

## Organização e responsivo

- `gsap.context(() => {...}, escopo)`: junta tudo que foi criado para limpar com `ctx.revert()`; `add()`, `ignore()`, `kill()`.
- `gsap.matchMedia()`:
```js
const mm = gsap.matchMedia();
mm.add({ celular: "(max-width: 799px)", calmo: "(prefers-reduced-motion: reduce)" }, (ctx) => {
  const { celular, calmo } = ctx.conditions;
  gsap.to(".x", { y: celular ? 20 : 60, duration: calmo ? 0 : 0.6 });
  return () => { /* limpeza quando para de valer */ };
});
```

## Plugins

- **Flip**: `const s = Flip.getState(alvos, {props: "backgroundColor"})` → muda o layout → `Flip.from(s, {absolute: true, duration: .5, stagger: .05, ease: "power1.inOut"})`. Opções: `absolute`, `nested`, `scale`, `fade`, `spin`, `prune`, `simple`, `toggleClass`, `zIndex`, `onEnter`, `onLeave`, `targets`, `props`. Outros: `Flip.to`, `Flip.fit(a, b)`, `Flip.batch`, `Flip.makeAbsolute`, `Flip.isFlipping`, `Flip.killFlipsOf`. `data-flip-id` liga elementos diferentes (troca com fade). Não faz 3D; usar `box-sizing: border-box`.
- **SplitText**: `SplitText.create(el, {type: "chars,words,lines", mask: "lines", autoSplit: true, onSplit(self){ return gsap.from(self.lines, {yPercent: 100, stagger: .1}) }})`. Opções: `aria` (acessibilidade automática), `propIndex`, `smartWrap`, `charsClass/wordsClass/linesClass` ("++" numera). `split.revert()` volta ao original.
- **ScrambleText**: `scrambleText: {text: "NOVO", chars: "XO", revealDelay: .5, speed: .3}` (texto embaralhando — bom para números/estatísticas).
- **TextPlugin**: `text: {value: "novo texto", delimiter: " ", type: "diff"}` (efeito digitação).
- **DrawSVG**: `drawSVG: "0%"` → `"100%"`, ou faixa `"20% 80%"`; funciona em path, line, polyline, polygon, rect, ellipse, circle.
- **MorphSVG**: `morphSVG: {shape: "#outra", type: "rotational", shapeIndex, origin, smooth, render: fn}` — `render` permite desenhar no **canvas**. `MorphSVGPlugin.convertToPath("circle, rect")`.
- **MotionPath**: `motionPath: {path, align, alignOrigin: [.5,.5], autoRotate: true, start, end, curviness}`; ajudantes `getPositionOnPath`, `getLength`, `stringToRawPath`, `convertToPath`.
- **Physics2D**: `physics2D: {velocity, angle, gravity, acceleration, friction}` — ótimo para confete/partículas em objetos `{x, y}` (dá para usar no canvas). **PhysicsProps** faz o mesmo em qualquer propriedade.
- **Inertia**: `inertia: {x: {velocity: 500, min: 0, max: 1024}}`, `InertiaPlugin.track()`.
- **Draggable**: `Draggable.create(el, {type: "x,y"|"x"|"rotation", bounds, inertia: true, snap, edgeResistance, onDrag, onDragEnd, onClick})`. Funciona no toque; `allowNativeTouchScrolling` deixa rolar no outro eixo.
- **Observer**: `Observer.create({target, type: "wheel,touch,pointer", onUp, onDown, onLeft, onRight, tolerance, preventDefault})` — swipe entre seções.
- **ScrollTrigger**: `scrollTrigger: {trigger, start: "top 80%", end, scrub: true, pin, snap, toggleActions: "play none none reverse", once, markers}`; `ScrollTrigger.batch`, `refresh`, `normalizeScroll` (ajuda no iPhone com a barra de endereço). Pin com `position: fixed` quebra se um ancestral tiver `transform`.
- Outros: ScrollSmoother, ScrollTo, GSDevTools (linha do tempo visual para depurar), PixiPlugin, EaselPlugin, MotionPathHelper.

## Não consegui ler

- A página `gsap.ticker()` deu 404 na hora da leitura. O que se sabe: `gsap.ticker.add(fn)` recebe `(time, deltaTime, frame)`; `gsap.ticker.lagSmoothing(0)` desliga a compensação de travadas; `gsap.ticker.fps(n)`.

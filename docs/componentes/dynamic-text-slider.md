# Dynamic Text Slider (componente React enviado em 13/11/2026)

Original em `dynamic-text-slider.original.txt` (React + Tailwind + shadcn). O Muvi não usa React: foi refeito em JS puro (`trim.js` + CSS).

**O que faz:** a palavra de destaque fica dentro de uma moldura inclinada (-2.76°) com duas alças, como o corte de um trecho na timeline de um editor. Arrastar as alças recorta o texto (`clip-path: inset(...)`); a inclinação muda conforme o centro do trecho se desloca (até ±3°). O arraste é projetado no eixo inclinado (cos/sen do ângulo) para parecer natural. Teclado: setas movem 10px. Distância mínima entre alças: 50px.

**Como ficou no Muvi:** "vídeo pronto." dentro do trecho, com as cores Moove (degradê magenta → violeta → ciano na moldura e nas alças, em vez do amarelo), texto cortado aparece apagado (13%) em vez de sumir, abertura animada (alças começam juntas no meio e abrem), duplo clique volta ao inteiro, respeita "reduzir movimento".

**Lição reaproveitável:** medir o texto, guardar posições em px e aplicar com `clip-path` é um jeito barato de fazer "corte"/"revelação" de texto; serve também dentro dos vídeos (canvas: `ctx.save(); ctx.beginPath(); ctx.rect(...); ctx.clip()`).

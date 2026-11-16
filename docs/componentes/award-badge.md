# Award Badge (componente React enviado em 16/11/2026)

Original em `award-badge.original.txt` (selo "Product Hunt" em SVG que inclina em 3D com `matrix3d` seguindo o mouse e tem faixas coloridas borradas girando por cima em `mix-blend-mode: overlay` — efeito holográfico).

**Como ficou no Muvi:** selo "MUVI · DESENVOLVIDO POR **Moove IA**" no fim da home, depois do Histórico (substituiu a linha "desenvolvido com as tecnologias da Moove IA"). Fundo escuro com a logo M, texto no degradê Moove, 7 faixas holográficas nas cores da marca girando devagar, brilho que segue o ponteiro, inclinação 3D com `rotateX/rotateY` (mais simples que a matriz do original) e também pelo dedo no iPhone. Link para moove-ia.com. Feito em JS puro + CSS (`histsel.js`).

**Lição reaproveitável:** faixas em gradiente borradas + `mix-blend-mode: overlay` + rotação lenta = efeito holográfico barato, sem imagem nem biblioteca.

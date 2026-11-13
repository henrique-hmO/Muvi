# Mesh Gradient SVG → mascote do Muvi (enviado em 13/11/2026)

Original em `shader-svg-mascote.original.txt` (React + framer-motion + @paper-design/shaders-react). O Muvi não usa React: refeito em JS puro num `<canvas>` (`mascot.js` + `mascot.css`).

**O que o original faz:** forma de fantasminha (path SVG 231×289) preenchida com um degradê "mesh" animado (shader), dois olhos elípticos que seguem o mouse (deslocamento ±8, mola) e piscam a cada 3 s, e o corpo flutua (sobe 8px e estica 8% em 2,8 s).

**Como ficou no Muvi:** o mesmo path vira `Path2D` e recorta o canvas; o degradê é feito com manchas radiais nas cores Moove (#D44CFF, #6E52FF, #00D2FF, #356CFF, rosa) girando devagar sobre fundo escuro; olhos com brilho, seguem dedo ou mouse e passeiam sozinhos quando ninguém mexe; canvas na resolução da tela (até 3×), então fica nítido no iPhone; para de desenhar quando a tela está escondida; respeita "reduzir movimento". Fica atrás da logo M na home, com os olhos aparecendo por cima.

**Lição reaproveitável:** `new Path2D(d)` aceita o texto de um path SVG — dá para recortar qualquer forma vetorial no canvas (inclusive dentro dos vídeos) sem SVG nem bibliotecas.

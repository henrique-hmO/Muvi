# Componentes — CORTE

Botão: primário (âmbar, texto on-accent), secundário (surface-2 + borda), fantasma, ícone 32px. Estados: hover, active, focus-visible (anel 2px âmbar), disabled, loading (rótulo mantido). Usado em todas as telas.
Campo de prompt: textarea grande, borda border-input, foco âmbar; Ctrl+Enter envia. S01, S02, chat.
Chips/segmented: formato (9:16, 1:1, 16:9), tom, estilo. `aria-pressed`. S02, S06, S07.
Cartão de cena: miniatura canvas animada no hover, número + timecode mono, tipo, duração editável, ações Aprovar / Refazer / Editar texto, estado draft (borda tracejada) ou approved (faixa sucesso). S04.
Player: canvas no formato do projeto, play/pause (espaço), timecode HH:MM:SS:FF, scrub. S04, S05.
Timeline: régua com timecodes, trilhas Cenas / Legenda / Áudio, playhead âmbar arrastável, clipes com cor por tipo, zoom (Ctrl+roda). Seleção ciano. S05.
Painel de propriedades: campos da cena selecionada gerados pelo schema do template. S05.
Transcrição: palavras clicáveis; clique pula o tempo, Alt+clique risca; vícios sublinhados. S05.
Chat do diretor: bolhas usuário/Claude, "Pensando…", botão Parar, operações aplicadas listadas com Desfazer. S04, S05.
Progresso por etapas: lista de etapas com estado (aguardando / rodando / feito / erro) e barra. S03, S07.
Toast: canto inferior, 4s, ações curtas. Global.

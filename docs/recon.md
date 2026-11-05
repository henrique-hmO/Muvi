# Recon — Editor de vídeo com IA (codinome: CORTE)

Escopo: um único editor que junta o melhor de 7 ferramentas, rodando como artefato no navegador, uso interno da Moove IA.
Plataforma: web (desktop primeiro, utilizável no celular).
Fatia: o loop central — **prompt ou vídeo bruto → Claude planeja cenas → aprovação cena a cena → render com legenda e animação → MP4.**

## Fontes

| fonte | o que deu |
| --- | --- |
| vivideo.ai/tools/ai-video-generator | 3 modos (Agente / Auto / Manual), storyboard de cenas aprovável no chat, voz + música + legenda no mesmo passo, 9:16 / 1:1 / 16:9, brand kit |
| Deevid (app store + reviews públicas) | texto→vídeo, imagem→vídeo, frame inicial→final, estilo, avatar com lip-sync |
| Invideo AI (help center "Magic Box") | edição por comando de texto: "apague a cena 3", "deixe a cena 4 mais engraçada", trocar mídia, mudar formato; undo |
| Descript (help/reviews) | editar o vídeo editando a transcrição; remover "é", "tipo", "né" e pausas em 1 clique |
| Submagic (features públicas) | legendas animadas com palavra destacada + emoji, auto-zoom em picos, B-roll por palavra-chave, sons, música, hook title, remoção de silêncio |
| Opus Clip (features públicas) | cortes curtos a partir de vídeo longo, virality score 0–99 (hook, fluxo, valor, tendência), reframe 9:16 |
| CapCut (help / app store) | timeline multitrilha, split no playhead, keyframes, animações de texto in/out/loop, faixa de legendas, atalhos |

## Telas

| ID | tela | como chega | propósito | componentes-chave | estados |
| --- | --- | --- | --- | --- | --- |
| S01 | Início | abrir o app | escolher o caminho | 2 cartões de entrada (Gerar / Editar), projetos recentes, prompt rápido | vazio, com projetos |
| S02 | Briefing do explicativo | S01 → Gerar | descrever o vídeo | prompt, formato, duração, tom, estilo visual, paleta | preenchendo, enviando |
| S03 | Upload e análise | S01 → Editar | subir vídeo próprio | dropzone, progresso de transcrição por etapa | vazio, carregando modelo, transcrevendo, erro |
| S04 | Storyboard / aprovação | após S02 ou S03 | revisar cena a cena | cartões de cena com preview animado, aprovar / refazer / editar, chat do diretor | gerando, aguardando aprovação, tudo aprovado |
| S05 | Estúdio (editor) | após aprovar | ajuste fino | preview, timeline multitrilha, painel de propriedades, transcrição editável, chat de comandos | tocando, pausado, cena selecionada |
| S06 | Legendas | aba no S05 | estilo das legendas | presets estilo Reels, fonte, cor de destaque, posição, palavras por linha | — |
| S07 | Exportar | botão no S05 | gerar MP4 | formato, qualidade, barra de render, download | renderizando, pronto, erro |
| S08 | Cortes virais | aba no S05 (vídeo próprio longo) | achar trechos | lista de cortes sugeridos com nota 0–99 e motivo | — |

## Fluxos

F01 Gerar explicativo animado
  S01 → S02 (prompt) → S04 (Claude escreve roteiro e cenas, cada uma com animação) → aprovar/refazer cada cena → S05 → S07
  edge: Claude indisponível (cair para gerador local de cenas), cena refeita fica pior (histórico de versões), texto longo demais para a cena

F02 Editar vídeo gravado
  S01 → S03 (upload + transcrição no navegador) → Claude propõe cenas: cortes de silêncio e vícios, títulos, zooms, B-roll animado, legendas → S04 aprovar cena a cena → S05 → S07
  edge: vídeo sem fala, idioma, arquivo grande, transcrição errada (editável)

F03 Editar por comando (Magic Box)
  S05 → chat: "corta os 3 primeiros segundos", "legenda amarela", "cena 2 mais curta" → mudança aplicada + undo

F04 Editar pela transcrição (Descript)
  S05 → riscar palavras na transcrição → corte aplicado na timeline

F05 Cortes virais (Opus)
  S08 → Claude lê a transcrição → sugere cortes com nota → abrir um corte como projeto

Caminho feliz F01: 4 cliques (Gerar → enviar prompt → aprovar tudo → exportar). Meta a bater.

## Componentes

Botão (primário, fantasma, ícone), campo de prompt grande, chips de opção, segmented control (formato), cartão de cena, player com controles, timeline (régua, trilhas vídeo/legenda/gráficos/áudio, playhead, clips arrastáveis), painel de propriedades, lista de transcrição com palavras clicáveis, bolhas de chat, barra de progresso por etapas, toast, modal de exportação, slider, color swatch.

## Modelo de dados inferido

Project  id, title, mode (explainer | footage), aspect (9:16|1:1|16:9), fps, duration, palette, captionStyle, scenes[], media?, transcript?  — confiança alta
Scene  id, order, start, end (no vídeo-fonte, se footage), duration, status (draft|approved|redo), template (title|bullets|stat|compare|steps|quote|cta|broll|talking), props (json), notes, versions[]  — alta (storyboard Vivideo/Invideo)
Word  text, start, end, removed (bool), filler (bool)  — alta (Descript/Whisper)
CaptionStyle  preset, font, color, highlight, position, wordsPerLine, animation  — alta (Submagic/CapCut)
Clip (corte viral)  start, end, score, hook, reason  — média
Edit (histórico)  command, before, after  — média (undo do Invideo)

## O que não dá para clonar (skip)

- Modelos de vídeo realista (Veo, Sora, Kling): API paga externa — fora por decisão do usuário; arquitetura deixa um encaixe para depois.
- Avatares com lip-sync e clonagem de voz: modelos proprietários.
- Biblioteca de stock / Storyblocks / clipes de filme: licenciada. Substituto: B-roll em motion graphics gerado no próprio app.
- Postagem direta em redes sociais e agendador: fora do artefato.
- Virality score "treinado em milhares de vídeos": substituído por avaliação do Claude com os mesmos critérios (hook, fluxo, valor).

## Tamanho

8 telas, 5 fluxos, 6 entidades. Tamanho: **M** (como artefato).
Partes difíceis: (1) render de MP4 no navegador com vídeo + gráficos + legenda sincronizados; (2) transcrição com tempo por palavra rodando local (Whisper em WebGPU/WASM); (3) Claude gerando cenas estruturadas confiáveis que viram animação.

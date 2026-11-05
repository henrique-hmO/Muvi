# Arquitetura — CORTE (editor de vídeo com IA, artefato)

Stack em uma linha: um único artefato HTML, JS puro, render em Canvas 2D, export MP4 via WebCodecs + mp4-muxer, Claude via capability `sample`, download via `downloads`.

## Escolhas

| camada | escolha | por quê |
| --- | --- | --- |
| app | 1 página HTML, JS sem framework | roda no artefato, sem build, carregamento rápido |
| render | Canvas 2D, função pura `drawFrame(project, t)` | o mesmo código serve preview e export, então o que se vê é o que sai |
| IA | `sample.json` (modelTier default para roteiro, quick para comandos) | roda na conta do próprio usuário, sem chave de API |
| export vídeo | WebCodecs `VideoEncoder` (H.264) + mp4-muxer (UMD do jsDelivr) | render offline quadro a quadro, sem limite de duração |
| export áudio | `OfflineAudioContext` monta trechos mantidos + música + efeitos → `AudioEncoder` AAC | áudio sincronizado com os cortes |
| fallback export | `MediaRecorder` WebM em tempo real | navegadores sem WebCodecs |
| transcrição | Web Speech API com a faixa de áudio do vídeo (`recognition.start(track)`), pt-BR | o CSP bloqueia baixar Whisper; o reconhecimento do próprio Chrome é a opção que funciona |
| fallback legenda | colar o roteiro/SRT; alinhamento por energia de voz (detector de silêncio) | funciona offline em qualquer navegador |
| arquivos | `downloads.save` (MP4, SRT, JSON do projeto) | o sandbox bloqueia downloads diretos |
| persistência | estado em memória + rascunho no localStorage (sem o vídeo) | projeto é pessoal; vídeo grande não cabe em storage |

## Modelo de dados (em memória)

```
Project { id, title, mode: 'explainer'|'footage', aspect: '9:16'|'1:1'|'16:9',
          fps: 30, palette: {bg, ink, accent, accent2}, captionStyle, music?,
          scenes: Scene[], source?: {file, url, duration, w, h, audioBuffer},
          words: Word[], history: snapshot[] }
Scene   { id, kind, dur, status: 'draft'|'approved', props, src?: {in, out},
          zoom?: {at, amount}, overlay?: {kind, props}, versions: [] }
Word    { t0, t1, text, removed, filler }
```

A duração total = soma de `dur` das cenas. Sem teto.

## "Rotas" (funções internas, por fluxo)

| função | faz | fluxo |
| --- | --- | --- |
| planExplainer(brief) | Claude → JSON de cenas com template + props + duração | F01 |
| redoScene(i, nota) | Claude refaz uma cena | F01/F02 |
| planFootage(words, silêncios) | Claude propõe cenas sobre o vídeo: cortes, título, zoom, overlays | F02 |
| runCommand(texto) | Claude devolve uma lista de operações (`ops`) aplicadas ao projeto, com undo | F03 |
| toggleWord(i) | risca palavra → recalcula trechos mantidos | F04 |
| findClips() | Claude lê transcrição → cortes com nota 0–99 | F05 |
| exportMP4(), exportSRT() | render offline e salvar | F01/F02 |

## Partes que mordem

- Seek de vídeo por quadro é lento: usar `requestVideoFrameCallback`/`seeked` e avisar progresso; 5 min a 30 fps = 9.000 quadros.
- Memória: não guardar quadros; encoder em streaming direto para o muxer.
- Reconhecimento de fala exige tocar o vídeo em tempo real; mostrar progresso e permitir colar o texto.
- JSON do Claude pode vir incompleto: validar cada cena, preencher padrão, nunca quebrar.
- `sample` pode estar indisponível (fora do claude.ai): gerador local de cenas como plano B.

## Ordem de build

1. Fatia vertical: briefing → cenas (gerador local) → preview canvas → export MP4.
2. Claude: plano, refazer cena, chat de comandos.
3. Modo vídeo próprio: upload, silêncios, transcrição, legendas, cortes, zoom, overlays.
4. Transcrição editável, cortes virais, SRT, música, atalhos.

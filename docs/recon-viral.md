# Recon · Buzzy "Recreate" (copiar a estrutura de um vídeo viral)

Escopo: só a função de pegar um vídeo que viralizou e reaproveitar o esqueleto (gancho, batidas, ritmo, retenção) num vídeo novo do Moove Studio. Plataforma original: web (buzzy.now). Público: uso interno da Moove IA.

## Fontes
| fonte | url |
| --- | --- |
| guia de uso (terceiro) | https://www.nemovideo.com/ja-JP/blog/how-to-recreate-viral-tiktoks-with-buzzy |
| lançamento (press release) | https://www.businesswire.com/news/home/20251217537860/en |
| matéria | https://decrypt.co/352167 |
| matéria (canvas agêntico) | https://neuronfeed.com/news/buzzy-launches-agentic-video-creation-platform-with-infinite-canvas |
| site | https://www.buzzy.now (bloqueado para leitura nesta sessão) |

## Fluxo do original
F01 Recriar viral: biblioteca "Inspire Me" (filtra por tipo: product reveal, POV, transformação, UGC) → escolhe referência → Recreate → troca assunto/voz/cenário → revisa → legenda → exporta 9:16.
Não clona por link: extrai estrutura (tipo de gancho, cadência, gatilho emocional). Estrutura transfere melhor que estética.

## Tradução para o Moove Studio
F01 Analisar referência: enviar vídeo → análise local grátis (cortes, ritmo, fala, picos de áudio, quadros-chave) → 1 leitura do Claude com 8 quadros pequenos → "Estrutura" salva na conta (reutilizável sem custo).
F02 Usar estrutura: escolher a estrutura ao gerar explicativo / narração / novela → o roteiro segue gancho, batidas e ritmo, escalados para a duração pedida.

## Modelo de dados
Blueprint: id, name, created, metrics {dur, aspect, shots[], cutsPerMin, avgShot, firstCut, cutsIn3s, motion, speechCover, speechStart, peaks[]}, thumbs[] (data URL 120 px), bp {format, hook{type,text,visual,seconds}, beats[{from,to,role,what,technique}], pacing, text_on_screen, emotion, retention[], ending, why, template}. Confiança: alta (é nosso).

## Fora do escopo (skip)
- Biblioteca de tendências com dados de milhões de visualizações (dados proprietários).
- Baixar vídeo por link de TikTok/Instagram (bloqueado e contra os termos das plataformas): o usuário envia o arquivo.
- Geração de vídeo realista (modelos pagos por segundo).

## Tamanho
S. Partes difíceis: detectar cortes sem falso positivo em câmera tremida/zoom; ler texto na tela (resolvido com quadros-chave para o Claude); aplicar ritmo sem piorar o roteiro.

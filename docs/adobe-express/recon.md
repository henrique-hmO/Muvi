# Recon — Adobe Express (vídeo, áudio e voz)

Feito em 17/11/2026 com o pacote replica (replica-recon), só com fontes públicas: páginas de ajuda, preços e páginas de produto. Nada de código, APIs privadas ou arquivos da Adobe. O objetivo é comparar com o Muvi e decidir o que construir.

**Recorte:** Adobe Express na web e no celular — criação e edição de vídeo, legendas, voz (texto para fala), tradução/dublagem e áudio.
**Para quem:** uso interno da Moove IA (Muvi).

## Fontes

| fonte | URL |
| --- | --- |
| Página "Free Video Maker" | https://www.adobe.com/express/create/video |
| Preços | https://www.adobe.com/express/pricing |
| Créditos de IA (tabela de custo) | https://helpx.adobe.com/creative-cloud/apps/generative-ai/generative-credits-faq.html |
| Ajuda — Legendar vídeos (e menu de vídeo) | https://helpx.adobe.com/express/web/video-creation-and-editing/edit-videos/caption-video.html |
| Ajuda — Gerar fala a partir de texto (Firefly) | https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/generate-speech-from-text.html |
| Ajuda — Adicionar tom à fala | https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-audio/add-tone-to-the-speech-text.html |
| Ajuda — Traduzir vídeo | https://helpx.adobe.com/firefly/web/work-with-audio-and-video/work-with-video/translate-video.html |
| Produto — Dublagem com IA | https://www.adobe.com/products/firefly/features/ai-dubbing.html |

## Telas (as de vídeo/áudio)

| ID | tela | como chega | para quê | componentes | estados |
| --- | --- | --- | --- | --- | --- |
| S01 | Início / escolher tipo | home → "+" → Vídeo | escolher modelo ou começar do zero | grade de modelos, busca, botões de formato | vazio, com modelos |
| S02 | Editor de vídeo (cenas + linha do tempo) | modelo ou "do zero" | montar o vídeo | canvas, linha do tempo de camadas, painel lateral (mídia, texto, áudio, elementos) | sem mídia, editando, carregando |
| S03 | Painel de legendas | linha do tempo → ícone de legendas | gerar e editar legenda automática | idioma falado, fonte (vídeo/áudio/tudo), transcrição editável, Formatar (fonte, cor, forma) | gerando, editando, erro de áudio |
| S04 | Ação rápida "Legendar vídeo" | + → Ações rápidas → Vídeo | legenda em 1 tela sem abrir o editor | upload, idioma, estilos prontos, cores, baixar | — |
| S05 | Gerar fala (Firefly) | Firefly → Áudio → Gerar fala | texto vira locução | texto ou importar DOCX/TXT, modelo (Firefly ou parceiro: ElevenLabs Multilingual v2), voz, idioma/sotaque, velocidade, tom (pitch), Corrigir pronúncia, Localizar e substituir, Adicionar tom, Adicionar pausa, Dicas | gerando, pronto, baixar |
| S06 | Traduzir vídeo | Firefly → Vídeo → Traduzir | dublar em outros idiomas | upload (mp4/mov, 5 s a 10 min, até 4K), idioma de origem detectado, vários idiomas de destino, sincronia labial (só empresas), transcrição | processando, pronto (7 dias para baixar) |
| S07 | Clip Maker | Ações rápidas | cortar podcast/aula em clipes sociais com legenda | upload, clipes sugeridos | — |
| S08 | Animar personagens | Ações rápidas | personagem fala com a sua voz gravada | personagem, gravar/enviar áudio | — |
| S09 | Redimensionar / Agendar | editor → Redimensionar / Agendar | adaptar formatos e postar em 3 contas por rede | lista de formatos, calendário | — |

## Fluxos

```
F01 Criar vídeo a partir de modelo
    S01 → S02 (trocar mídia, textos, música) → S09 redimensionar → baixar ou agendar
    cliques no caminho feliz: ~8
F02 Legendar vídeo gravado
    S02 → S03 (idioma → Gerar → revisar transcrição → Formatar → arrastar posição)
    ou S04 em 1 tela: idioma → enviar → estilo → baixar
F03 Locução por IA
    S05 colar texto → voz → idioma → velocidade/tom → marcar trechos com tom (neutro, positivo, negativo, expressivo) → pausas → corrigir pronúncia → Gerar → baixar → levar ao editor
F04 Dublar vídeo
    S06 enviar → origem automática → escolher idiomas → (sincronia labial) → Gerar → revisar cada idioma → baixar
    limites: 1 pessoa falando, 1 idioma por vídeo, áudio limpo
F05 Clipes de vídeo longo
    S07 enviar → clipes sugeridos com legenda → baixar
```

## Componentes repetidos

Linha do tempo de camadas com alças de corte; painel lateral de mídia com busca; seletor de idioma; seletor de voz com prévia; controles deslizantes (velocidade, tom); editor de texto com etiquetas coloridas de tom (cinza neutro, verde positivo, vermelho negativo, azul expressivo); estilos prontos de legenda; botão Gerar com custo em créditos; barra de progresso de processamento; lista "Sua mídia" com validade de 7 dias.

## Modelo de dados (inferido)

```
Projeto   id, formato (W×H), cenas[], camadas[] com início/fim, marca (kit)      evidência: S02, redimensionar       confiança: média
Legenda   idioma, fonte (vídeo|áudio|tudo), segmentos[{texto, início, fim}], estilo   evidência: S03/S04          confiança: alta
Locução   texto, modelo, voz, idioma+sotaque, velocidade, tom, trechos[{faixa, tom}], pausas[], pronúncias[{palavra, como falar}]   evidência: S05   confiança: alta
Dublagem  vídeo, idioma origem, idiomas destino[], sincronia labial (bool), transcrição, saídas[{idioma, arquivo, expira em}]   evidência: S06   confiança: alta
```

## Custos que a Adobe cobra (referência de preço)

- Express Premium US$ 9,99/mês com 250 créditos; Firefly Pro US$ 19,99/mês com 4.000.
- Traduzir vídeo ou áudio: 5 créditos por segundo (1 minuto ≈ 300 créditos). Com sincronia labial: 10 a 15 por segundo.
- Gerar vídeo: 20 a 100 créditos por segundo.

## O que não dá (nem deve) ser copiado

- **Vozes, músicas, efeitos e banco de imagens da Adobe:** são conteúdo licenciado (Adobe Stock e modelos de voz próprios ou de parceiros). Baixar esses áudios para usar no Muvi ou para treinar/clonar vozes viola os termos e direitos autorais.
- **Modelos de IA da Adobe (Firefly) e a sincronia labial:** tecnologia deles; o Muvi usa as próprias ferramentas e conectores.
- **Agendamento direto nas redes:** depende de parcerias e APIs aprovadas.

## Tamanho

Para o recorte de voz/dublagem no Muvi: **M (algumas semanas)** se feito por partes. As partes difíceis: tom por trecho com vozes que aceitam emoção, dublagem com tempos batendo com as cenas, e custo de voz por minuto.

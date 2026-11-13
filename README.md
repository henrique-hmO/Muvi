# Muvi

Fábrica de vídeos virais com IA, desenvolvida com as tecnologias da Moove IA.

Modos:
- **Explicativo animado:** cenas de motion graphics e objetos que mostram o assunto (recibo, carteira, celular, preço…).
- **Narração com imagem:** personagens cartoon, closes, cenários e narração.
- **Novelinha:** elenco fixo, uma voz por personagem, episódios que continuam a história.
- **Editar meu vídeo:** cortes, legendas e telas animadas sobre um vídeo gravado.

Também tem: estrutura viral (copia gancho e ritmo de um vídeo que bombou), canais com marcas fictícias, Google Trends, pacote de publicação, histórico salvo na conta e exportação MP4 (H.264 + AAC) direto no navegador.

## Como está organizado

```
src/shell.html     HTML + CSS do app (layout, cores, fontes)
src/js/*.js        código, um arquivo por área
build.sh           junta tudo em muvi.html
muvi.html          o app pronto (é o que está publicado no claude.ai)
docs/              engenharia reversa (pacote replica): mapa, matriz de features, design
docs/gsap.md       referência do GSAP (animações) para futuras atualizações
```

Ordem dos arquivos (definida no build.sh): core → render → story → places → toon → brands → objs → doc → audio → ai → media → export → uistory → uidoc → trends → novela → history → viral → ui.

| arquivo | o que faz |
| --- | --- |
| core.js | modelo do projeto, tempos, legendas, histórico de desfazer |
| render.js | desenha cada quadro (modelos, legendas, transições) |
| story.js / toon.js | personagens (clássico e cartoon), poses, rostos |
| places.js | cenários, objetos de fundo, fundo desfocado dos closes |
| objs.js | cenas de objeto explicativo |
| brands.js | marcas fictícias e canais por nicho |
| novela.js | diálogos, vozes por personagem, novelas e episódios |
| viral.js | análise de vídeo viral (cortes, ritmo, quadros) |
| export.js | exportação MP4 com WebCodecs + mp4-muxer |
| ai.js | prompts e normalização das respostas do Claude |
| history.js | histórico na conta e voz salva sem pagar de novo |
| ui.js / uistory.js / uidoc.js | telas, inspetor, timeline |

## Rodar

```sh
./build.sh        # gera muvi.html
open muvi.html    # abre no navegador (a IA, as vozes e o banco só funcionam publicado no claude.ai)
```

## Para lançar ao público (próximo passo)

O app hoje usa a conta de quem abre (Claude, Speko, Firecrawl e banco do claude.ai). Para virar produto:
- **Vercel:** hospedar o site e criar rotas de servidor que chamam a API do Claude e o Speko. As chaves ficam só em variáveis de ambiente, nunca no navegador.
- **Supabase:** login, banco (projetos, novelas, canais, estruturas, histórico) e storage (vozes).
- **Cobrança e limite por usuário.**

O motor de animação e a exportação não mudam: são código do navegador e funcionam igual.

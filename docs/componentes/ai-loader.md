# AI Loader (componente React enviado em 16/11/2026)

**Original:** um círculo com sombras internas coloridas (`box-shadow ... inset`) que gira em 5 s e troca as cores no meio do giro, com o texto "Generating" no centro, cada letra acendendo e crescendo em sequência (atraso de 0,1 s por letra, ciclo de 3 s).

**Versão do Muvi (`loader.js` + `loader.css`):**
- Fica no topo da tela de montagem e mostra "Criando seu vídeo".
- As sombras usam as cores Moove: ciano #00D2FF, violeta #6E52FF, magenta #D44CFF e azul #356CFF.
- Tem um halo que respira em volta e as letras brilham em ciano quando acendem.
- O tamanho se adapta à tela, de 150 a 190 px.
- Se algum passo der erro, a animação para e fica cinza. Quando tudo termina, o orbe some.
- Respeita "reduzir movimento".

**Lição reaproveitável:** várias `box-shadow inset` coloridas num círculo girando já parecem uma esfera de luz, sem canvas nem imagem.

**Português** · [English](manual.md)

# Tonestamp — manual da ferramenta

Ferramenta de meio-tom por mapeamento tonal em 7 estados. Arquivo HTML único, roda offline no navegador, sem instalação e sem servidor. Abre com duplo clique.

Baseada na técnica que o Anton Burmistrov (@antoncreations) mostrou no reel de 18/05/2026, com algumas coisas a mais.

> Este é o manual de uso. Pra entender **como desenhar um conjunto de shapes que funciona**, leia [shape-design.md](shape-design.md) — é a parte que separa um resultado bonito de um borrão.

---

## O conceito em uma frase

A ferramenta lê o **brilho** de cada célula da imagem e troca aquela célula por um **SVG** escolhido de acordo com a faixa de brilho onde ela caiu. Não é pixel art e não é ASCII. É meio-tom com forma customizada.

Por isso são 7 estados: a imagem se forma por **luminância**, não por cor. A cor é um eixo separado que pode ser empilhado por cima (ver seção Cor).

---

## Fonte

| Controle | O que faz |
|---|---|
| **Imagem** | Abre o seletor de arquivos. Aceita JPG, PNG, WebP, GIF estático. |
| **Vídeo** | Aceita MP4, WebM, MOV. Toca em loop e sem áudio, e o filtro roda em tempo real quadro a quadro. |
| **Webcam** | Pede permissão da câmera e usa ela como fonte ao vivo. Bom pra testar shape rápido, e bom pra instalação. |
| **Proporção** | Alterna entre `original` (mantém o enquadramento) e `1×1` (recorta o centro em quadrado). |
| **Pausar / Tocar** | Congela o vídeo ou a webcam sem perder o quadro atual. Use antes de exportar PNG ou SVG pra travar exatamente o quadro que você quer. |

Também dá pra **arrastar e soltar** um arquivo em cima da área de preview.

Se algo der errado ao carregar — arquivo corrompido, câmera negada, formato que o navegador não abre — a mensagem aparece logo abaixo dos botões da seção Fonte, com o motivo.

---

## Grid

| Controle | Faixa | O que faz |
|---|---|---|
| **Grid resolution (scale)** | 8 a 220 | Quantas colunas de células. Baixo = poucas células grandes, leitura abstrata. Alto = muitas células pequenas, a imagem original volta a ser reconhecível. O número de linhas é calculado sozinho pra manter a proporção. |
| **Background color** | qualquer | Cor do fundo atrás das shapes. Também vale como cor de "vazio" onde um estado está desligado. |
| **Fill SVG shapes (solid)** | on/off | **Ligado:** ignora as cores originais do SVG e pinta a shape inteira com a cor do estado. É o modo normal. **Desligado:** desenha o SVG com as cores que ele já tem. Útil se você desenhou um ícone multicolorido de propósito. |
| **Quick invert mapping** | on/off | Inverte a escala inteira. O que era highlight vira sombra. Vira um negativo, útil pra testar composição em fundo claro. |

**Sobre a resolução do grid.** O ponto doce pra retrato costuma ser entre 60 e 110. Abaixo de 40 você perde o rosto e ganha padrão. Acima de 140 vira ruído e a graça do meio-tom some.

> ⚠️ Com fonte em movimento e grid acima de 160, aparece um aviso no rodapé do preview. Não é bug: são dezenas de milhares de desenhos por quadro e o fps cai mesmo.

---

## 7-state midtone mapping

Sete linhas, do highlight à sombra:

| Estado | Faixa de brilho | Normalmente recebe |
|---|---|---|
| 1 · Highlights | mais claro | shape mais pesada / mais área |
| 2 · Light mid | | |
| 3 · Mid high | | |
| 4 · Midtones | meio | shape de transição |
| 5 · Mid low | | |
| 6 · Dark mid | | |
| 7 · Shadows (100%) | mais escuro | shape mais leve / menos área, ou nada |

Cada linha tem três controles:

- **Quadradinho de cor** à esquerda: a cor daquela faixa. Só tem efeito no modo de cor `Estado`.
- **↑** : sobe o seu próprio SVG pra essa faixa. Fica verde quando tem arquivo customizado.
- **●** : liga e desliga o estado. Desligado, aquela faixa tonal fica **vazia**, mostrando só o fundo. É assim que você abre buracos e cria respiro na imagem.

O quadradinho preto ao lado é o preview da shape já tingida na cor escolhida, contra o fundo escolhido.

Se o SVG que você subir não abrir, o card fica com a borda rosa e mostra o motivo — XML malformado, raiz que não é `<svg>`, arquivo vazio. Antes isso falhava em silêncio e a shape só sumia.

**Tudo branco** reseta as 7 cores pra `#FFFFFF`.
**Shapes padrão** volta pro conjunto que vem embutido, e religa todos os estados.

---

## Cor

Três modos, mutuamente exclusivos.

| Modo | De onde vem a cor da célula |
|---|---|
| **Estado** | Da cor fixa que você escolheu naquela faixa tonal. Comportamento clássico. |
| **Pixel** | Da cor real daquele ponto da imagem original. A shape continua vindo do brilho. Resultado mais fotográfico e sujo. |
| **Quantizar** | Da cor mais próxima dentro de uma paleta extraída da imagem. É o que gera o look chapado de pôster serigrafado. |

Controles auxiliares:

- **Cores na paleta (2 a 8):** quantas cores o algoritmo vai extrair. Com 3 ou 4 você tem o look de serigrafia. Com 8 fica quase fotográfico.
- **Extrair e aplicar:** roda o k-means, preenche os swatches **e** distribui a paleta pelos 7 estados de uma vez. Clicar num swatch copia o hex.
- **Aplicar nos estados:** joga a paleta extraída nos 7 color pickers, distribuída do claro ao escuro, interpolando quando a paleta tem menos de 7 cores. Esse é o "settings automática por cor".
- **Extrair ao trocar de fonte:** liga a extração automática toda vez que você carrega uma imagem nova.
- **Saturação (-100 a +100):** só age nos modos Pixel e Quantizar. Puxa pra +60 ou +80 pra chapar as cores e fugir do aspecto lavado.

**Como o k-means funciona aqui:** ele reduz a imagem pra 96×96, trata cada pixel como um ponto em RGB, e agrupa em N clusters rodando 12 iterações. O centro de cada cluster vira uma cor da paleta. Depois a paleta é ordenada por luminância, do mais claro ao mais escuro, e é por isso que o *Aplicar nos estados* já sai coerente com a escala tonal.

Os centroides iniciais são pegos espalhados pela varredura da imagem, não sorteados. Isso é de propósito: com semente aleatória a paleta mudava a cada clique no mesmo arquivo, o que atrapalha quem está fechando um pôster.

---

## Escala e rotação

| Controle | O que faz |
|---|---|
| **Scale shapes with midtones** | Liga a variação de tamanho **dentro** de cada faixa. Uma célula no topo da faixa 3 fica maior que uma no fundo da faixa 3. Isso suaviza as bordas duras entre estados. |
| **Min size (%)** | Tamanho mínimo, no fundo da faixa. |
| **Max size (%)** | Tamanho máximo, no topo. Pode passar de 100% pras shapes se sobreporem e fecharem áreas sólidas. |
| **Enable 90° snap rotation** | Cada célula gira em múltiplos de 90°, com um sorteio estável por posição. Só faz diferença visual em shapes assimétricas. |
| **Rotation interval** | Milissegundos entre cada giro. Valor baixo = mais rápido. Só faz sentido em vídeo ou webcam, ou pra gravar WebM. |

**Detalhe importante:** com *Scale* desligado mas *Max size* diferente de 100%, todas as shapes ficam no mesmo tamanho fixo definido pelo Max. É assim que você abre espaçamento uniforme no grid.

---

## Tom

Esses três ajustes agem **antes** do mapeamento, ou seja, eles mudam qual estado cada célula vai receber. Não são efeito visual, são controle de distribuição.

| Controle | O que faz |
|---|---|
| **Brilho** | Empurra a imagem toda pra cima ou pra baixo na escala. Positivo = mais células caem nos estados claros. |
| **Contraste** | Afasta as pontas do meio. Aumenta a separação entre highlight e sombra, reduz o uso dos estados do meio. |
| **Gamma** | Redistribui só os meios-tons, sem mexer nas pontas. Abaixo de 1.00 escurece os meios, acima clareia. É o controle mais preciso dos três, use ele antes de apelar pro contraste. |

Se a sua imagem está usando só 3 dos 7 estados, o problema é distribuição tonal, não é a shape. Mexe aqui primeiro.

---

## Exportar

| Controle | O que faz |
|---|---|
| **Resolução de saída** | 600 a 3000px no lado maior. Não muda o grid, muda quantos pixels cada célula ocupa. |
| **Fundo transparente** | Tira o fundo do export de PNG e SVG, deixando as shapes sobre alpha. A prévia continua mostrando a cor de fundo — senão você trabalharia olhando pro xadrez do navegador. |
| **PNG** | Baixa o quadro atual como PNG. |
| **SVG** | Baixa **vetor de verdade**. Gera um `<g>` por combinação de shape e cor dentro de `<defs>`, e um `<use>` por célula posicionado por `transform`. Abre no Illustrator editável. |
| **Gravar WebM** | Grava a área de preview em vídeo, a 30fps. Clica de novo pra parar e baixar. Serve pra vídeo filtrado, pra rotação animada e pra webcam. |

**Por que `<g>` e não `<symbol>`.** O Illustrator lê SVG 1.1, trata `<symbol>` com viewBox de forma inconsistente, e ignora o atributo `href` do SVG 2 — ele precisa de `xlink:href`. Exports antigos abriam certo no Preview do macOS e como um retângulo preto vazio no Illustrator, que é exatamente essa combinação. Agora o export escreve os dois atributos e posiciona grupos comuns por `transform`.

**Sobre peso do SVG.** No modo `Estado` ou `Quantizar` o arquivo é leve, porque existem poucas combinações de shape e cor. No modo `Pixel` pode virar centenas de grupos e o arquivo fica pesado. Se for exportar vetor, prefira Quantizar.

---

## Presets

Salva e recarrega **a configuração inteira** como um `.json`.

| Controle | O que faz |
|---|---|
| **Salvar preset** | Baixa um JSON com todos os parâmetros, as 7 cores, quais estados estão ligados e os SVGs **embutidos como texto**. |
| **Carregar preset** | Lê um `.json` e restaura tudo, inclusive as shapes customizadas. |

Os SVGs vão embutidos de propósito: um preset tem que atravessar máquina, e-mail e pendrive sem levar uma pasta de assets junto.

O arquivo tem um campo `version`. Se você abrir um preset gerado por uma versão mais nova da ferramenta, ela recusa com uma mensagem em vez de aplicar pela metade. Preset corrompido, JSON de outra coisa ou estado faltando também são recusados com o motivo escrito na tela — nunca em tela branca.

Tem quatro exemplos prontos em [`examples/`](../examples/), um pra cada combinação documentada no fim deste manual.

---

## Tema da interface

Botão no canto superior direito do painel. Dois temas, escuro (padrão) e claro. A escolha fica salva em `localStorage` sob a chave `tonestamp:theme`. Na primeira visita a ferramenta segue a preferência do sistema operacional.

**O tema é só da interface.** Ele não encosta no *Background color* do grid. Aquilo é decisão de composição, é sua, e continua igual quando você troca de tema — inclusive é comum trabalhar com interface clara e composição de fundo preto.

---

## Acessibilidade

- Todo controle tem rótulo associado ou `aria-label`. Os botões `↑` e `●` de cada estado anunciam o estado a que pertencem.
- Foco visível em tudo que é focável, com contorno na cor de destaque.
- O painel inteiro é navegável por teclado, na ordem visual.
- O tema claro passa em AA (4.5:1) para texto. `node scripts/contrast.mjs` roda o verificador e imprime o relatório, incluindo as ressalvas conhecidas do tema escuro.
- `prefers-reduced-motion` desliga a transição de troca de tema.

---

## Combinações que já sei que funcionam

Cada uma tem um preset pronto em [`examples/`](../examples/).

**Retrato editorial em preto e branco** — `retrato-editorial.json`
Grid 90, escala por tamanho com círculos, fundo `#0D0D0D`, todas as shapes brancas, scale ligado com min 15 e max 105, gamma 0.85.

**Pôster serigrafado colorido** — `poster-serigrafia.json`
Grid 55, modo Quantizar com paleta de 3, saturação +70, shapes sólidas e chapadas, scale desligado com max em 92 pra abrir grade. Fundo na cor mais escura da paleta.

**Lettering / título** — `lettering.json`
Grid 34, escala por complexidade, estado 7 desligado pra sombra virar vazio, rotação 90° ligada com intervalo alto. Exporta em SVG e leva pro Illustrator pra ajustar as células na mão.

**Textura de fundo pra layout** — `textura-fundo.json`
Grid 160, uma shape só repetida em todos os estados variando só a cor, saturação baixa. Vira um padrão de ruído fino que dá pra usar atrás de tipografia.

---

## Limitações conhecidas

- Acima de 160 colunas com vídeo em movimento, a taxa de quadros cai. São dezenas de milhares de desenhos por quadro. Pra imagem parada não tem problema nenhum.
- No modo Pixel as cores são arredondadas em passos de 32 por canal, pra manter o cache de shapes tingidas sob controle de memória. Na prática não dá pra perceber, porque a imagem já está muito abstraída.
- Webcam exige HTTPS ou `localhost` em alguns navegadores. Abrindo o arquivo direto do disco, o Chrome geralmente libera, o Safari às vezes não.
- A gravação WebM não funciona no Safari. Use Chrome ou Firefox.
- SVG multicolorido com gradiente não vai funcionar bem com *Fill solid* ligado, porque o preenchimento sobrescreve tudo. Desligue o fill nesse caso.
- As fontes (Bricolage Grotesque e IBM Plex Mono) vão embutidas no arquivo. Não há requisição de rede nenhuma: offline a tipografia é idêntica.
- Rodando `src/index.html` direto do disco, os ES modules são bloqueados pelo navegador. Use `dist/index.html`, ou sirva `src/` por HTTP (`npm run serve`).

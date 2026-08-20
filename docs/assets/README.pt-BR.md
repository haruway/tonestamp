# Shot list — imagens do README

Nada disso existe ainda. O repo hoje não tem **nenhum** registro visual da
ferramenta rodando, e é a primeira coisa que alguém procura ao abrir a página.
Esta é a lista pra gravar de uma vez só, numa sessão.

Ordem de importância: o **01** sozinho já resolve 80% do problema. Se você só
tiver ânimo pra um, faça o 01.

---

## 01 · `demo.gif` — o GIF do topo · **prioridade máxima**

O primeiro conteúdo do README, antes de qualquer texto longo.

| | |
|---|---|
| Formato | GIF (ou MP4 convertido) |
| Duração | **máximo 15s** |
| Peso | **abaixo de 5MB** |
| Dimensão | 1200×750 aprox., 2:1.25 |
| Onde entra | descomentar a linha em [`README.md`](../../README.md) logo abaixo dos badges |

**Roteiro, na ordem:**

1. (0–2s) Tela parada com uma foto de rosto já carregada, grid ~90, preto e branco. Deixa o olho entender que é um retrato.
2. (2–7s) **Arrasta o slider de Grid resolution** de 90 até ~25 e volta pra ~110. É o movimento mais legível que a ferramenta tem — mostra o conceito inteiro sem precisar de legenda.
3. (7–11s) Clica em **Quantizar** e sobe a **Saturação** pra +70. A imagem vira pôster colorido na frente da pessoa.
4. (11–15s) Liga **Scale shapes with midtones** e mexe no Max size. Termina num quadro bonito e parado.

Não mexa em mais nada. GIF com seis coisas acontecendo não comunica nada.

**Como gravar:** a própria ferramenta grava — botão **Gravar WebM**. Mas ele
captura só o canvas, sem o painel. Pro GIF do topo você quer a tela inteira com
os sliders aparecendo, então use captura de tela normal:

```bash
# macOS: Cmd+Shift+5, grava a janela do navegador, salva .mov
# depois, com ffmpeg:
ffmpeg -i captura.mov -vf "fps=12,scale=1200:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 demo.gif

# se passar de 5MB, baixa pra fps=10 ou scale=1000
```

---

## 02 · `hero-still.png` — o quadro que vende

Um resultado bonito, sem interface nenhuma. Serve de fallback caso o GIF fique
pesado demais, e é a imagem que as pessoas vão copiar pro Twitter.

- Export **PNG** direto da ferramenta, 2040px.
- Preset `retrato-editorial.json` numa foto de rosto com contraste bom.
- Fundo `#0D0D0D`, shapes brancas.

---

## 03 · Os três modos de cor — a comparação

O README tem a seção **Features** falando dos três modos. Três imagens lado a
lado explicam em dois segundos o que o parágrafo explica em cinquenta palavras.

| Arquivo | Config |
|---|---|
| `mode-state.png` | modo **Estado**, cores brancas, fundo preto |
| `mode-pixel.png` | modo **Pixel**, saturação 0 |
| `mode-quant.png` | modo **Quantizar**, paleta 3, saturação +70 |

**A mesma foto, o mesmo grid, o mesmo enquadramento nos três.** Se mudar a foto
entre eles a comparação não vale nada. Export PNG a 1000px em cada um, só
trocando o modo.

Monta no README como tabela de três colunas.

---

## 04 · `shape-ramp.png` — as 7 shapes em linha

As sete shapes padrão lado a lado, do highlight à sombra, em fundo escuro.
Ilustra a ideia de rampa monotônica melhor que a tabela de porcentagem.

- Entra em [`docs/shape-design.md`](../shape-design.md), na seção "Como calcular o peso".
- Já existe algo parecido em `_original/_preview-escala-tonal.png` — vale
  regerar limpo, 1400×200, fundo `#0e0e13`.
- **Bônus que vale muito:** a mesma imagem desfocada em gaussiana forte ao lado,
  provando que vira um degradê limpo. É o "teste do olho semicerrado"
  virando imagem.

---

## 05 · `themes.png` — os dois temas

Print do painel no tema escuro e no claro, lado a lado, mesma configuração.

Serve pra provar o ponto que o manual insiste: **o fundo da composição continua
preto nos dois**. Deixe o `Background color` em `#000000` nas duas capturas e
o contraste entre painel claro e composição escura fica evidente.

Só o painel (372px de largura), não a tela toda.

---

## 06 · `svg-illustrator.png` — a prova do vetor

Print do Illustrator com um export SVG aberto, camadas expandidas, mostrando os
`<use>` como objetos editáveis e um deles selecionado.

Esse é o print que convence designer. "Exporta SVG de verdade" é fácil de
escrever e fácil de duvidar — a captura resolve.

Entra na seção **Features**, no bullet de vector export.

---

## 07 · `mobile.png` — opcional

Print em 390px de largura mostrando o layout empilhado. Só vale a pena se você
quiser destacar responsividade; pra essa ferramenta não é o argumento principal.

---

## Checklist de publicação

- [ ] `demo.gif` abaixo de 5MB, testado no preview do GitHub (GIF grande não carrega no mobile)
- [ ] Linha do GIF descomentada no `README.md`
- [ ] Todo PNG passado por `pngquant` ou `oxipng`
- [ ] Nenhuma foto de terceiro sem direito de uso — se for foto de banco, cite; se for sua, melhor
- [ ] **Nada de arte do Makoto San** nas capturas: o repo credita a técnica, não redistribui o trabalho
- [ ] Link da demo do GitHub Pages testado depois do primeiro deploy

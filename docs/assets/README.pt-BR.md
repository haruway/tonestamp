**Português** · [English](README.md)

# Imagens do readme — o que existe e o que falta

As imagens estão ordenadas por quanto elas justificam o próprio espaço. Se você
só for fazer uma das que faltam, faça a **#1**.

## Situação

| # | Arquivo | Situação | Impacto |
|---|---|---|---|
| 1 | `demo.gif` | ❌ **falta** | 🔥🔥🔥 de longe o mais importante |
| 2 | `hero-still.png` | ❌ falta | 🔥🔥🔥 |
| 3 | `modes-*.png` | ❌ falta | 🔥🔥 |
| 4 | `ui-dark-{en,pt}.png` | ✅ gerado | 🔥🔥 |
| 5 | `shape-ramp-{en,pt}.png` | ✅ gerado | 🔥🔥 |
| 6 | `ui-light-{en,pt}.png` | ✅ gerado | 🔥 |
| 7 | `svg-illustrator.png` | ❌ falta | 🔥 |

Os itens 4, 5 e 6 foram renderizados direto do repositório com Chrome headless
e já estão no readme. Os que faltam precisam de foto de verdade e de mão humana
no slider — por isso são seus.

---

## 1 · `demo.gif` — topo do readme · **faça esse primeiro**

Nada mais comunica o que a ferramenta é em menos de três segundos. Imagem
parada mostra o resultado; só o GIF mostra a *transformação*, e a transformação
é o produto.

| | |
|---|---|
| Formato | GIF (grave em .mov e converta) |
| Duração | **máximo 15s** |
| Peso | **abaixo de 5MB** — GIF pesado o GitHub não carrega no celular |
| Tamanho | uns 1200×750 |
| Onde entra | descomente a linha logo abaixo dos badges em `README.md` e `README.pt-BR.md` |

**Roteiro, nessa ordem:**

1. **(0–2s)** Quadro parado, uma foto de rosto já carregada, grid em torno de 90, preto e branco. Deixe o olho entender que é um retrato.
2. **(2–7s)** **Arraste o slider de Grid resolution** de 90 até uns 25 e volte pra uns 110. É o movimento mais legível que a ferramenta tem — explica o conceito inteiro sem legenda.
3. **(7–11s)** Clique em **Quantizar** e suba a **Saturação** pra +70. A imagem vira pôster colorido na frente de quem assiste.
4. **(11–15s)** Ligue **Scale shapes with midtones** e mexa no Max size. Termine num quadro bonito e parado.

Não mexa em mais nada. GIF com seis coisas acontecendo não comunica nenhuma.

**Como gravar.** A ferramenta tem o botão **Gravar WebM**, mas ele captura só o
canvas, sem o painel. Pro GIF do topo você quer os sliders aparecendo, então
use o gravador do sistema:

- **⌘⇧5** → Opções → ligue **Mostrar cliques do mouse** → grave a janela do navegador.
- Redimensione o navegador pra uns 1440×900 antes. Tela cheia em monitor grande deixa a interface minúscula no GIF.
- Ligue o Não Perturbe. Notificação no meio do take queima a gravação.

**Convertendo:**

```bash
brew install gifski
gifski --fps 12 --width 1200 --quality 80 -o demo.gif gravacao.mov
# passou de 5MB? baixe pra --fps 10 ou --width 1000
```

## 2 · `hero-still.png` — o quadro que vende

Um resultado bonito, sem interface nenhuma. É a imagem que as pessoas printam e
repostam, e é o plano B se o GIF ficar pesado demais.

- Export **PNG** direto da ferramenta, 2040px.
- Preset `retrato-editorial.json` numa foto de rosto com bom contraste.
- Fundo `#0D0D0D`, shapes brancas.

## 3 · Os três modos de cor — a comparação

Três imagens lado a lado explicam em dois segundos o que o parágrafo de
Recursos explica em cinquenta palavras.

| Arquivo | Configuração |
|---|---|
| `mode-state.png` | modo **Estado**, shapes brancas, fundo preto |
| `mode-pixel.png` | modo **Pixel**, saturação 0 |
| `mode-quant.png` | modo **Quantizar**, paleta de 3, saturação +70 |

**A mesma foto, o mesmo grid, o mesmo enquadramento nos três.** Se a foto mudar
entre eles, a comparação não vale nada. Export PNG a 1000px em cada um,
trocando só o modo.

## 4 · `ui-dark-en.png` / `ui-dark-pt.png` ✅ pronto

A interface inteira, tema escuro, rodando o gradiente de teste embutido. Fica
logo abaixo dos badges, como a primeira coisa da página.

**Duas versões, uma por idioma.** O `README.md` mostra a captura em inglês e o
`README.pt-BR.md` a em português — ninguém deve cair numa página no idioma dele
e ver um print em outro.

Pra regerar depois de mudar layout:

```bash
node scripts/build.mjs
# depois renderize dist/index.html em 1440×900 com device scale factor 2x
```

## 5 · `shape-ramp-en.png` / `shape-ramp-pt.png` ✅ pronto

As sete shapes padrão em fileira com a porcentagem de área preenchida, e a
mesma fileira bem desfocada embaixo.

É a melhor explicação isolada da ideia central, porque a fileira desfocada *é*
o teste do olho semicerrado — dá pra ver ela virando um degradê limpo. Sustenta
o argumento da "rampa monotônica" melhor que qualquer parágrafo.

## 6 · `ui-light-en.png` / `ui-light-pt.png` ✅ pronto

A interface no tema claro, em inglês, com o fundo da composição ainda preto.

Esse último detalhe é o motivo da imagem existir: ele prova o que o manual
repete, que o tema da interface e o fundo da composição são independentes.
Mantenha o `Background color` em `#000000` se for regerar.

## 7 · `svg-illustrator.png` — a prova do vetor

Print do Illustrator com um SVG exportado aberto, camadas expandidas, mostrando
os `<use>` como objetos editáveis e um deles selecionado.

Esse é o print que convence designer. "Exporta vetor de verdade" é fácil de
escrever e fácil de duvidar; a captura resolve.

---

## Checklist de publicação

- [ ] `demo.gif` abaixo de 5MB, testado no preview do GitHub
- [ ] Linha do GIF descomentada nos **dois** readmes, `README.md` e `README.pt-BR.md`
- [ ] Todo PNG passado por `pngquant` ou `oxipng`
- [ ] Nenhuma foto de terceiro sem direito de uso — se for de banco, cite; sua é melhor
- [ ] **Nada de arte do Makoto San** nas capturas: o repo credita a técnica, não redistribui o trabalho
- [ ] Link do GitHub Pages testado depois do primeiro deploy

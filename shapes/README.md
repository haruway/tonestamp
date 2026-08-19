# Shapes

## `default/`

O conjunto que vem embutido na ferramenta. São os mesmos sete SVGs que estão
como constantes em [`src/js/shapes.js`](../src/js/shapes.js) — ficam duplicados
de propósito: no código pra a ferramenta abrir offline sem `fetch`, e aqui como
arquivo pra você abrir no Illustrator e usar de ponto de partida.

| Arquivo | Estado | Área preenchida |
|---|---|---|
| `01-highlights-circulo-cheio.svg` | 1 · Highlights | ~66% |
| `02-light-mid-quadrado-arredondado.svg` | 2 · Light mid | ~68% de caixa |
| `03-mid-high-circulo-medio.svg` | 3 · Mid high | ~36% |
| `04-midtones-losango.svg` | 4 · Midtones | ~21% |
| `05-mid-low-anel.svg` | 5 · Mid low | ~30% de contorno |
| `06-dark-mid-quadrado-pequeno.svg` | 6 · Dark mid | ~8% |
| `07-shadows-ponto.svg` | 7 · Shadows | ~1,5% |

Se você mudar um destes arquivos, **atualize também a constante `DEFAULT_SVG`**
em `src/js/shapes.js` e rode `node scripts/build.mjs`. O que a ferramenta carrega
é a constante, não o arquivo.

## Desenhando o seu próprio conjunto

A explicação longa — peso óptico, por que a rampa tem que ser monotônica, quais
famílias de shape servem pra qual zona tonal, e o fluxo no Illustrator — está em
[`docs/shape-design.md`](../docs/shape-design.md).

O resumo de bolso:

1. Prancheta **quadrada** de 100×100.
2. Uma cor só, traçados expandidos, furos em caminho composto.
3. Margem de 4 a 8% nas bordas.
4. Área preenchida **decrescendo** do estado 1 ao 7, sem degrau invertido.
5. SVG 1.1, atributos de apresentação, sem dados de edição do Illustrator.

Suba cada arquivo pelo botão `↑` do estado correspondente. Quando o conjunto
estiver bom, **Salvar preset** — o `.json` embute os SVGs e você não perde o
trabalho.

## Contribuindo com um conjunto

Conjuntos novos são bem-vindos como pasta irmã de `default/`, com nome
descritivo (`brutalist/`, `organic/`, `halftone-classico/`) e um `README.md`
curto mostrando a rampa. Veja [CONTRIBUTING.md](../CONTRIBUTING.md).

**Português** · [English](README.md)

# Shapes

## `default/`

O conjunto que vem embutido na ferramenta. São os mesmos sete SVGs que estão
como constantes em [`src/js/shapes.js`](../src/js/shapes.js) — ficam duplicados
de propósito: no código pra a ferramenta abrir offline sem `fetch`, e aqui como
arquivo pra você abrir no Illustrator e usar de ponto de partida.

| Arquivo | Estado | Área preenchida |
|---|---|---|
| `01-highlights-circulo-cheio.svg` | 1 · Highlights | 66,5% |
| `02-light-mid-quadrado-arredondado.svg` | 2 · Light mid | 62,5% |
| `03-mid-high-circulo-medio.svg` | 3 · Mid high | 36,3% |
| `04-midtones-losango.svg` | 4 · Midtones | 32,0% |
| `05-mid-low-anel.svg` | 5 · Mid low | 30,2% |
| `06-dark-mid-quadrado-pequeno.svg` | 6 · Dark mid | 7,8% |
| `07-shadows-ponto.svg` | 7 · Shadows | 1,5% |

A área tem que continuar caindo do 1 ao 7. O `node scripts/check-ramp.mjs`
mede cada shape geometricamente e reprova se a rampa subir — ele também
confere que estes arquivos ainda batem com a constante `DEFAULT_SVG` do código.

Se você mudar um destes arquivos, **atualize também a constante `DEFAULT_SVG`**
em `src/js/shapes.js` e rode `node scripts/build.mjs`. O que a ferramenta carrega
é a constante, não o arquivo.

## `blocks/`

Quadrados que preenchem a célula inteira no highlight e vão encolhendo em
direção à sombra. Como o estado 1 é um quadrado de 100×100 cheio, as células
vizinhas se encostam e fecham áreas sólidas — é isso que dá o aspecto duro, de
grid impresso, em vez de pontilhado.

| Arquivo | Estado | Área preenchida |
|---|---|---|
| `01-highlights-bloco-cheio.svg` | 1 · Highlights | 100,0% |
| `02-light-mid-bloco-88.svg` | 2 · Light mid | 77,4% |
| `03-mid-high-bloco-74.svg` | 3 · Mid high | 54,8% |
| `04-midtones-bloco-58.svg` | 4 · Midtones | 33,6% |
| `05-mid-low-bloco-42.svg` | 5 · Mid low | 17,6% |
| `06-dark-mid-bloco-26.svg` | 6 · Dark mid | 6,8% |
| `07-shadows-bloco-12.svg` | 7 · Shadows | 1,4% |

Os degraus aqui são muito mais bem distribuídos que no `default/`, então os
meios-tons ficam mais suaves. Carregue num clique com o preset
[`blocos.json`](../examples/blocos.json).

## Desenhando o seu próprio conjunto

A explicação longa — peso óptico, por que a rampa tem que ser monotônica, quais
famílias de shape servem pra qual zona tonal, e o fluxo no Illustrator — está em
[`docs/shape-design.pt-BR.md`](../docs/shape-design.pt-BR.md).

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
curto mostrando a rampa. Veja [CONTRIBUTING.pt-BR.md](../CONTRIBUTING.pt-BR.md).

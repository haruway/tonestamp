**Português** · [English](CONTRIBUTING.md)

# Contribuindo

Obrigado por olhar. É um projeto pequeno com uma opinião forte sobre o que ele é, então vale ler as restrições antes de escrever código.

## A restrição que importa

**Zero dependência de runtime. JavaScript puro com ES modules.**

Isso é decisão de produto, não limitação esperando pra ser superada. O que se oferece é um arquivo que você baixa, dá dois cliques, e que continua funcionando daqui a cinco anos sem toolchain nenhuma. Um framework, um script de CDN ou um bundler no caminho crítico quebram essa promessa.

Por favor não abra PR adicionando React, Vue, Svelte, Tailwind, gerenciador de estado, sistema de plugins, camada de i18n externa, service worker, analytics ou backend. Vai ser recusado, e isso não é julgamento sobre o código.

## Setup

```bash
git clone https://github.com/haruway/tonestamp.git
cd tonestamp

npm run serve      # http://localhost:8080 — obrigatório, veja abaixo
npm run build      # regenera dist/index.html
npm run verify     # dist em dia + contraste + rampa tonal
```

Não existe `npm install`. O `package.json` existe pelos scripts e pelos metadados; não há dependência pra baixar.

**Você não consegue abrir `src/index.html` por `file://`.** Os navegadores bloqueiam ES modules nesse protocolo. Use `npm run serve` enquanto desenvolve, ou teste o `dist/index.html`, que é um arquivo único com tudo embutido e funciona direto do disco.

## Arquitetura

```
src/js/
  state.js      S, slots, palette + get/set/subscribe    nenhum DOM
  shapes.js     parse, rasterização, tint, cache          sem DOM da página
  palette.js    k-means, cor, cor por célula              sem DOM da página
  renderer.js   amostragem, mapeamento, loop de desenho   só o canvas recebido
  export.js     PNG, SVG vetorial, gravação WebM
  sources.js    arquivo, vídeo, webcam, arrastar e soltar
  presets.js    salvar/carregar JSON com validação
  i18n.js       dicionário pt/en e o botão de idioma
  theme.js      alternância escuro/claro
  main.js       boot, wiring de DOM, tudo que tem id
```

Três regras seguram isso de pé:

1. **`renderer.js`, `palette.js` e `shapes.js` não podem tocar no DOM da página.** Podem criar canvas e imagens em memória, e podem desenhar num canvas entregue por parâmetro. Não podem chamar `getElementById`. É o que os torna testáveis e reutilizáveis fora da ferramenta.
2. **Só o `main.js` conhece os ids do HTML.** Se você se pegar buscando um elemento de qualquer outro módulo, exponha um callback no lugar — `renderer.onStats`, `sources.onChange`, `sources.onError` são o padrão que já existe.
3. **Módulo que não conhece o DOM também não conhece idioma.** `shapes`, `sources` e `presets` devolvem *chaves* de tradução (`'err.cam.denied'`), nunca frases prontas. Quem monta a frase é o `main.js`, via `t()`.

O grafo de módulos é acíclico e o build depende disso. `state.js → shapes.js` é o único import numa folha; `renderer` e `export` ficam por cima.

## O build

`scripts/build.mjs` é um bundler deliberadamente pequeno: embute o CSS, converte as fontes em base64, percorre o grafo a partir de `main.js`, tira os `import`/`export` e envolve cada módulo num IIFE que se registra num objeto `__m`.

Ele aceita um **subconjunto pequeno e explícito** de sintaxe de módulo, e erra alto em qualquer outra coisa:

| Aceito | Recusado, com mensagem explicando por quê |
|---|---|
| `import { a, b } from './x.js'` | `import padrao from …` |
| `import * as ns from './x.js'` | `import(…)` dinâmico |
| `export function` / `async function` | `export default` |
| `export const` / `export class` | `export let` / `export var` |
| `export { a, b }` | import de pacote, dependência circular |

`export let` é recusado porque o ES module dá ligação viva e o bundle copia o valor no momento do import — as duas coisas se comportariam diferente. Exponha um getter no lugar, como o `state.js` faz com `getPalette()`.

O script também confere que todo import nomeado existe nos exports do módulo de origem. O ESM lançaria `SyntaxError`; o bundle produziria `undefined` em silêncio, então a checagem tem que ser em tempo de build.

As buscas por `import` e `export` rodam sobre uma cópia do código com comentários, strings e regex mascarados. Sem isso, um `@param {import('./x.js')}` num JSDoc é lido como import dinâmico e o build reprova código correto.

Se você mexer em `src/`, **rode `node scripts/build.mjs` e faça commit do `dist/index.html` no mesmo commit.** O CI reprova o contrário, de propósito — um `dist` desatualizado significa que alguém baixa um arquivo que não corresponde ao código.

## Comportamento está congelado

O resultado visual de cada controle existente está fechado. Refatoração é bem-vinda; mudar o que um slider faz com a imagem não é, a menos que seja correção de um bug claro.

Duas coisas em particular parecem ineficiência e não são:

- **O cache de tints é limpo inteiro ao chegar em 1200 entradas**, em vez de evicção LRU. Limpar é mais barato e mais previsível, e o custo é um quadro lento de vez em quando.
- **As cores do modo Pixel são arredondadas em passos de 32 por canal.** Sem isso, uma foto colorida pede um tint quase único por célula e o cache vira vazamento de memória. Nove níveis por canal, 729 combinações por shape. Não remova sem medir memória com uma foto colorida em modo Pixel.

As duas estão documentadas no manual e comentadas no código.

## Shapes e a rampa

O conjunto padrão tem que ser uma rampa monotônica de área preenchida, do estado 1 ao 7. Não é preferência estética: uma rampa que sobe em algum ponto produz relevo falso na imagem.

`npm run ramp` mede cada shape geometricamente — achata os arcos em polígono e aplica shoelace — e reprova se a rampa subir. Ele também confere que os arquivos de `shapes/default/` batem com a constante `DEFAULT_SVG` do código, que é fácil de dessincronizar.

Conjuntos novos são bem-vindos como pasta irmã de `shapes/default/`. Leia [docs/shape-design.pt-BR.md](docs/shape-design.pt-BR.md) primeiro — um conjunto cuja área não seja uma rampa monotônica volta, porque não funciona, não por questão de gosto.

Inclua um `README.md` curto com a rampa e um render de exemplo.

## Acessibilidade

Todo controle precisa de `<label>` associado ou `aria-label`. O foco tem que continuar visível. Os botões das linhas de estado (`↑`, `●`) são um caractere só, então o `aria-label` deles tem que nomear o estado a que pertencem.

`npm run contrast` lê os tokens de tema e confere os pares que a interface de fato renderiza. Sai com código diferente de zero em reprovação que não tenha ressalva explícita. Se você adicionar um token de cor, adicione o par dele à tabela em `scripts/contrast.mjs`.

O tema escuro carrega três ressalvas documentadas, herdadas da paleta do protótipo original. Não adicione ressalvas novas sem escrever o motivo.

## Tradução

Textos novos entram em `src/js/i18n.js`, nos dois dicionários. Nenhuma frase deve ficar embutida em `main.js`.

No modo português, os termos técnicos que já estavam em inglês no protótipo continuam em inglês — `Grid resolution`, `Fill SVG shapes`, `Scale shapes with midtones`. É como designer brasileiro fala. No modo inglês tudo é traduzido.

Documentação nova precisa das duas versões: `NOME.md` em inglês e `NOME.pt-BR.md` em português, cada uma com a linha de alternância no topo.

## Commits

Conventional commits, uma unidade lógica por commit:

```
feat:      capacidade nova
fix:       correção de bug
refactor:  sem mudança de comportamento
docs:      só documentação
chore:     ferramentaria, config, arrumação
ci:        mudança de workflow
build:     mudança no script de build
style:     só apresentação, sem mudança de lógica
```

Explique o *porquê* no corpo quando a mudança não for evidente. O *o quê* já está no diff.

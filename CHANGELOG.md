# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico.

## [1.0.0] — 2026-08-19

Primeira versão pública. O protótipo de arquivo único virou repositório, sem
mudar o comportamento de nenhum controle existente.

### Adicionado

- **Sistema de temas.** Escuro (padrão) e claro, alternados por botão no topo do
  painel, persistidos em `localStorage` sob `svgdither:theme`. Na primeira visita
  segue `prefers-color-scheme`. Transição de 150ms, respeitando
  `prefers-reduced-motion`. O tema é da interface e não encosta na cor de fundo
  da composição.
- **Presets.** Salvar e carregar toda a configuração como `.json`, com os SVGs
  embutidos como texto pra o arquivo ser portátil. Campo `version` pra migração
  futura. JSON inválido, de versão incompatível ou corrompido é recusado com o
  motivo na tela, sem travar.
- **Quatro presets de exemplo** em `examples/`, um por combinação documentada no
  manual: retrato editorial, pôster serigrafia, lettering e textura de fundo.
- **Estados de erro visíveis.** SVG que não abre agora mostra o motivo no card do
  estado, com a borda destacada. Antes falhava em silêncio e a shape só sumia.
  Erros de fonte (arquivo corrompido, formato não suportado) aparecem na seção
  Fonte.
- **Mensagens de webcam específicas** por tipo de falha: permissão negada,
  nenhuma câmera, câmera ocupada.
- **Aviso de performance** no rodapé do preview quando o grid passa de 160 com
  fonte em movimento.
- **Build de arquivo único.** `node scripts/build.mjs` embute CSS e resolve o
  grafo de ES modules num `dist/index.html` auto-contido. Node puro, zero
  dependência. `--check` falha se o `dist/` estiver desatualizado.
- **Verificador de contraste.** `node scripts/contrast.mjs` lê os tokens dos dois
  temas e confere os pares que a interface renderiza contra o mínimo AA.
- **Deploy automático** no GitHub Pages a cada push na `main`, com verificação de
  que o `dist/` commitado bate com o que o build gera.
- Documentação: README em inglês, manual e guia de design de shapes em português,
  guia de contribuição, e uma shot list das imagens que faltam.

### Modificado

- **Código-fonte modularizado.** O HTML único virou `src/` com nove módulos ES:
  `state`, `shapes`, `palette`, `renderer`, `export`, `sources`, `presets`,
  `theme` e `main`. `renderer`, `palette` e `shapes` não tocam no DOM da página
  além do canvas que recebem por parâmetro.
- **CSS separado** em `tokens.css`, `base.css` e `components.css`, com todas as
  cores da interface como custom properties.
- Botões de fonte que eram `<label>` estilizado viraram `<button>` de verdade,
  pra funcionarem no teclado.
- Swatches da paleta viraram `<button>` com `aria-label`.
- Extração de paleta agora recebe a fonte por parâmetro em vez de ler estado
  global.

### Corrigido

- **Acessibilidade.** Todo controle tem rótulo ou `aria-label`; os botões `↑` e
  `●` de cada estado anunciam a que estado pertencem; foco visível em tudo que é
  focável; `aria-pressed` nos botões de alternância.
- **Layout em 390px.** Novo breakpoint em 480px ajustando padding, espaçamento
  entre letras e a grade dos cards de estado. O cabeçalho do painel deixa de ser
  fixo abaixo de 900px, onde grudava por cima do conteúdo.
- **Limpeza de recursos.** `URL.revokeObjectURL` depois que a imagem decodifica e
  ao trocar de fonte; stream da webcam encerrada ao trocar; `requestAnimationFrame`
  cancelado quando a aba fica oculta, via `visibilitychange`; tudo liberado no
  `pagehide`.
- **SVG inválido** agora é detectado no parse — `parsererror`, raiz que não é
  `<svg>`, arquivo vazio — em vez de depender do `onerror` da `Image`.
- O mesmo arquivo pode ser subido duas vezes seguidas: o valor do input é
  limpo depois de cada leitura.

### Mantido de propósito

- Teto de 1200 entradas no cache de tints, com limpeza total em vez de LRU.
- Quantização de cor em passos de 32 por canal nos modos Pixel e Quantizar.
- Toda a matemática de mapeamento tonal, geometria, escala e rotação, byte por
  byte igual ao protótipo.

### Ressalvas conhecidas

- Três pares de contraste do tema escuro ficam abaixo de AA: texto secundário
  sobre o card de estado (4.34:1), branco sobre o botão de gravação (3.38:1) e a
  borda divisória (1.28:1). São valores da paleta original do protótipo, fixados
  pelo briefing. Estão registrados como ressalva em `scripts/contrast.mjs` e
  aparecem em todo relatório.
- O README ainda não tem GIF de demonstração nem capturas. A lista do que gravar
  está em `docs/assets/README.md`.

[1.0.0]: https://github.com/danilomariani/svg-dither/releases/tag/v1.0.0

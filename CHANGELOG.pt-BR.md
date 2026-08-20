**Português** · [English](CHANGELOG.md)

# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico.

## [1.0.0] — 19/08/2026

Primeira versão pública. Um protótipo de arquivo único virou repositório, sem
mudar o comportamento de nenhum controle existente.

### Adicionado

- **Sistema de temas.** Escuro (padrão) e claro, alternados no cabeçalho do
  painel, persistidos em `localStorage` sob `tonestamp:theme`. Na primeira
  visita segue `prefers-color-scheme`. Transição de 150ms, respeitando
  `prefers-reduced-motion`. O tema é da interface e nunca encosta na cor de
  fundo da composição.
- **Interface em português e inglês**, alternada no cabeçalho e persistida em
  `tonestamp:lang`, com padrão vindo do idioma do navegador. Os módulos que não
  conhecem o DOM devolvem *chaves* de erro em vez de frases, pra continuarem
  livres de idioma.
- **Presets.** Salvar e carregar toda a configuração como `.json`, com os SVGs
  embutidos como texto pra o arquivo ser portátil. Campo `version` pra migração
  futura. JSON inválido, corrompido ou de versão mais nova é recusado com o
  motivo na tela, nunca em tela branca.
- **Quatro presets de exemplo** em `examples/`, um por combinação documentada
  no manual: retrato editorial, pôster serigrafia, lettering e textura de fundo.
- **Tipografia embutida.** Bricolage Grotesque e IBM Plex Mono vão em base64
  dentro do arquivo único. A ferramenta agora **não faz requisição de rede
  nenhuma** — antes ela dizia rodar offline e mesmo assim buscava as fontes no
  Google.
- **Estados de erro visíveis.** Um SVG que não abre agora mostra o motivo no
  card do estado, com a borda destacada. Antes falhava em silêncio e a shape só
  sumia. Erros de fonte (arquivo corrompido, formato não suportado) aparecem na
  seção Fonte.
- **Mensagens de webcam específicas** por tipo de falha: permissão negada,
  nenhuma câmera, câmera ocupada.
- **Aviso de performance** no rodapé do preview quando o grid passa de 160 com
  fonte em movimento.
- **Build de arquivo único.** `node scripts/build.mjs` embute o CSS, converte as
  fontes em base64 e resolve o grafo de ES modules num `dist/index.html`
  auto-contido. Node puro, zero dependência. `--check` falha se o `dist/`
  estiver desatualizado.
- **Verificador de contraste.** `node scripts/contrast.mjs` lê os tokens dos
  dois temas e confere os pares que a interface renderiza contra o mínimo AA.
- **Verificador de rampa tonal.** `node scripts/check-ramp.mjs` mede a área
  preenchida de cada shape padrão geometricamente e falha se a rampa subir. Ele
  também confere que os arquivos de `shapes/default/` ainda batem com a
  constante `DEFAULT_SVG` do código.
- **Deploy automático** no GitHub Pages a cada push na `main`, verificando que o
  `dist/` commitado bate com o que o build gera.
- Documentação nos **dois idiomas**: readme, manual, guia de design de shapes,
  guia de contribuição, e uma lista das imagens que ainda faltam.
- `NOTICE.md`, dizendo o que o projeto é e pedindo que a ferramenta em si não
  seja revendida — um pedido, deliberadamente fora da licença.

### Modificado

- **Código-fonte modularizado.** O HTML único virou `src/` com dez módulos ES:
  `state`, `shapes`, `palette`, `renderer`, `export`, `sources`, `presets`,
  `i18n`, `theme` e `main`. `renderer`, `palette` e `shapes` não tocam no DOM da
  página além do canvas que recebem por parâmetro.
- **CSS separado** em `fonts.css`, `tokens.css`, `base.css` e
  `components.css`, com todas as cores da interface como custom properties.
- **Tipografia maior.** Wordmark 19 → 27px, títulos de seção 10 → 12,5px,
  rótulos de campo 9,5 → 10,5px, valores em destaque 10,5 → 12,5px, nome dos
  estados 10,5 → 12,5px. O espaçamento entre letras desce pra compensar, e o
  painel vai de 372 pra 392px.
- Botões de fonte que eram `<label>` estilizado viraram `<button>` de verdade,
  pra funcionarem no teclado.
- Swatches da paleta viraram `<button>` com `aria-label`.
- A extração de paleta agora recebe a fonte por parâmetro em vez de ler estado
  global.

### Corrigido

- **O conjunto padrão de shapes não era uma rampa monotônica.** Duas inversões:
  o quadrado arredondado com 68,9% ficava acima do círculo do estado 1 com
  66,5%, e o losango com 42,3% ficava acima do círculo do estado 3 com 36,3%.
  As duas produziam relevo falso — um degrau de tom que não existe na foto,
  mais visível em pele. O quadrado agora é 80×80 rx13 (62,5%) e o losango tem
  diagonais de 80 (32,0%). O manual afirmava que o losango tinha "~21%"; a
  conta estava errada, um losango de diagonais 92 tem (92×92)/2 = 4232, ou 42%.
- **Acessibilidade.** Todo controle tem rótulo ou `aria-label`; os botões `↑` e
  `●` de cada estado anunciam a que estado pertencem; foco visível em tudo que é
  focável; `aria-pressed` nos botões de alternância.
- **Layout em 390px.** Novo breakpoint em 480px ajustando padding, espaçamento
  entre letras e a grade dos cards de estado. O cabeçalho do painel deixa de ser
  fixo abaixo de 900px, onde grudava por cima do conteúdo.
- **Limpeza de recursos.** `URL.revokeObjectURL` depois que a imagem decodifica
  e ao trocar de fonte; stream da webcam encerrada ao trocar;
  `requestAnimationFrame` cancelado quando a aba fica oculta, via
  `visibilitychange`; tudo liberado no `pagehide`.
- **SVG inválido** agora é detectado no parse — `parsererror`, raiz que não é
  `<svg>`, arquivo vazio — em vez de depender do `onerror` da `Image`.
- O mesmo arquivo pode ser subido duas vezes seguidas: o valor do input é limpo
  depois de cada leitura.

### Mantido de propósito

- Teto de 1200 entradas no cache de tints, com limpeza total em vez de LRU.
- Quantização de cor em passos de 32 por canal nos modos Pixel e Quantizar.
- Toda a matemática de mapeamento tonal, geometria, escala e rotação, byte por
  byte igual ao protótipo.

### Ressalvas conhecidas

- Três pares de contraste do tema escuro ficam abaixo de AA: texto secundário
  sobre o card de estado (4,34:1), branco sobre o botão de gravação (3,38:1) e a
  borda divisória (1,28:1). São valores da paleta original do protótipo, fixados
  pelo briefing. Estão registrados como ressalva em `scripts/contrast.mjs` e
  aparecem em todo relatório.
- A rampa padrão é monotônica, mas desigual — queda de 26 pontos entre os
  estados 2 e 3, depois três estados dentro de 6 pontos. Herdado do conjunto
  original.
- O readme ainda não tem GIF de demonstração. A lista do que gravar está em
  `docs/assets/README.pt-BR.md`.
- O Safari não foi testado interativamente. Sabe-se que a gravação WebM não
  funciona lá; o resto é auditoria estática de API.

[1.0.0]: https://github.com/haruway/tonestamp/releases/tag/v1.0.0

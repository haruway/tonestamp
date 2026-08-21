/**
 * i18n.js — português e inglês, sem dependência e sem arquivo externo.
 *
 * Como funciona: cada texto da interface tem uma chave. O HTML marca os
 * elementos com `data-i18n` (conteúdo), `data-i18n-aria` e `data-i18n-title`
 * (atributos), e `applyStatic()` reescreve tudo de uma vez. Textos dinâmicos
 * — mensagens de erro, rótulos que alternam — passam por `t()`.
 *
 * Os módulos que não conhecem a interface (`shapes`, `sources`, `presets`)
 * devolvem CHAVES de erro, nunca frases. Quem traduz é o `main.js`. É o que
 * permite manter aqueles módulos livres de idioma e de DOM.
 *
 * O português é a redação original da ferramenta, preservada palavra por
 * palavra. Termos técnicos que já estavam em inglês no protótipo continuam em
 * inglês no modo português — é como designer brasileiro fala mesmo.
 */

const STORAGE_KEY = 'tonestamp:lang';

/** Idiomas disponíveis, na ordem em que o botão alterna. */
export const LANGS = ['pt', 'en'];

const DICT = {
  pt: {
    'doc.title': 'Tonestamp — meio-tom tonal em 7 estados',
    'doc.desc': 'Meio-tom por mapeamento tonal em 7 estados. Roda offline no navegador, sem instalação.',
    'doc.lang': 'pt-BR',

    'panel.aria': 'Controles',
    'head.sub': 'Mapeamento tonal em 7 estados',
    'canvas.aria': 'Resultado do meio-tom. Pré-visualização da imagem processada.',
    'hint.drop': 'Arraste imagem ou vídeo pra cá',
    'hint.perf': 'grid alto com vídeo derruba o fps',
    'drop.label': 'SOLTA AQUI',

    'theme.toLight': 'Alternar para tema claro',
    'theme.toDark': 'Alternar para tema escuro',
    'lang.toggle': 'Switch to English',
    'lang.short': 'EN',

    'sec.source': 'Fonte',
    'btn.image': 'Imagem',
    'btn.video': 'Vídeo',
    'btn.cam': 'Webcam',
    'btn.ratio.original': 'Proporção: original',
    'btn.ratio.square': 'Proporção: 1×1',
    'btn.pause': 'Pausar',
    'btn.play': 'Tocar',

    'sec.grid': 'Grid',
    'lbl.cols': 'Grid resolution (scale)',
    'lbl.bg': 'Background color',
    'chk.fill': 'Fill SVG shapes (solid)',
    'chk.invert': 'Quick invert mapping',

    'sec.states': '7-state midtone mapping',
    'lbl.shapeSet': 'Conjunto de shapes',
    'msg.setLoaded': 'conjunto "{name}" carregado',
    'btn.allWhite': 'Tudo branco',
    'btn.defaultShapes': 'Shapes padrão',

    'sec.color': 'Cor',
    'mode.state': 'Estado',
    'mode.pixel': 'Pixel',
    'mode.quant': 'Quantizar',
    'note.state': 'Cor fixa por faixa tonal. A shape e a cor vêm do brilho.',
    'note.pixel': 'Cada célula puxa a cor real daquele ponto. A shape continua vindo do brilho.',
    'note.quant': 'A cor do pixel gruda na cor mais próxima da paleta. É o que dá o look chapado de pôster.',
    'lbl.palN': 'Cores na paleta',
    'sw.empty': 'Nenhuma paleta extraída',
    'sw.copy': '{hex} — clique pra copiar',
    'sw.copyAria': 'Copiar {hex}',
    'sw.copied': 'copiado',
    'btn.extract': 'Extrair e aplicar',
    'btn.apply': 'Aplicar nos estados',
    'chk.autoPal': 'Extrair paleta ao trocar de fonte',
    'lbl.sat': 'Saturação',

    'sec.scale': 'Escala e rotação',
    'chk.scale': 'Scale shapes with midtones',
    'lbl.min': 'Min size (%)',
    'lbl.max': 'Max size (%)',
    'chk.rot': 'Enable 90° snap rotation',
    'lbl.rotInt': 'Rotation interval',
    'note.rot': 'Lower = faster.',

    'sec.tone': 'Tom',
    'lbl.bri': 'Brilho',
    'lbl.con': 'Contraste',
    'lbl.gam': 'Gamma',

    'sec.export': 'Exportar',
    'lbl.res': 'Resolução de saída',
    'chk.alpha': 'Fundo transparente (PNG e SVG)',
    'btn.png': 'PNG',
    'btn.svg': 'SVG',
    'btn.rec': 'Gravar vídeo',
    'btn.recStop': 'Parar gravação',
    'note.rec': 'Grava o preview em {ext}, {fps}fps, ~{mbps} Mb/s. A resolução do vídeo é a "Resolução de saída" acima. Não troque de aba durante a gravação.',
    'note.recNo': 'Este navegador não grava vídeo do canvas. Use Chrome ou Firefox.',
    'err.rec.unsupported': 'este navegador não grava vídeo do canvas (MediaRecorder ausente). Use Chrome ou Firefox.',
    'err.rec.noStream': 'não consegui capturar o canvas.',
    'err.rec.empty': 'a gravação saiu sem nenhum quadro. Isso acontece se a aba ficar escondida durante a gravação.',
    'err.rec.failed': 'a gravação falhou ({name}).',
    'note.export': 'Export SVG só sai com as shapes reais quando você sobe seus próprios arquivos.',

    'sec.presets': 'Presets',
    'btn.savePreset': 'Salvar preset',
    'btn.loadPreset': 'Carregar preset',
    'note.presets': 'O preset guarda tudo, inclusive as shapes que você subiu. É um .json portátil.',
    'msg.presetSaved': 'preset salvo',
    'msg.presetLoaded': 'preset carregado: {name}',
    'msg.presetPartial': 'preset carregado, mas {n} shape(s) não abriram',
    'msg.presetFailed': 'preset não carregado — {reason}',

    'note.flow':
      'Fluxo: desenha a shape → exporta SVG de cor única → sobe no estado que quiser → ajusta grid, cor e escala. Estado 1 é highlight, estado 7 é sombra. Desmarcar um estado deixa aquela faixa tonal vazia.',
    'note.flow.lead': 'Fluxo:',

    'state.colorAria': 'Cor de {state}',
    'state.previewAria': 'Prévia da shape de {state}',
    'state.uploadAria': 'Subir SVG para {state}',
    'state.uploadTitle': 'Subir SVG',
    'state.toggleAria': 'Ligar ou desligar {state}',
    'state.toggleTitle': 'Ligar/desligar estado',

    'tag.none': '— sem fonte',
    'tag.failed': '— falha ao carregar',
    'tag.source': '— {type} {w}×{h}',
    'tag.webcam': 'webcam',
    'tag.image': 'imagem',
    'tag.video': 'vídeo',
    'stats.fps': '{fps} fps · {cols}×{rows} células',

    'err.svg.empty': 'arquivo vazio',
    'err.svg.malformed': 'XML malformado',
    'err.svg.notSvg': 'a raiz do arquivo não é <svg>',
    'err.svg.draw': 'o navegador não conseguiu desenhar este SVG',
    'err.file.read': 'não consegui ler o arquivo',

    'err.src.image': 'não consegui abrir essa imagem',
    'err.src.video': 'não consegui abrir esse vídeo',
    'err.src.svg': 'SVG é shape, não é fonte. Suba pelo ↑ de um estado.',
    'err.src.format': 'formato não suportado: {type}',
    'err.src.unknownType': 'desconhecido',

    'err.cam.unsupported': 'este navegador não expõe a câmera. Chrome ou Firefox resolvem.',
    'err.cam.denied':
      'câmera negada. Libere a permissão no cadeado da barra de endereço. Abrindo o arquivo direto do disco, o Safari costuma bloquear — use Chrome, ou sirva por https.',
    'err.cam.notFound': 'nenhuma câmera encontrada neste computador.',
    'err.cam.busy': 'a câmera está ocupada por outro aplicativo.',
    'err.cam.generic': 'não consegui abrir a câmera ({name}).',

    'err.preset.json': 'não é um JSON válido',
    'err.preset.notObject': 'o arquivo não descreve um preset',
    'err.preset.format': 'este JSON não é um preset do Tonestamp',
    'err.preset.noVersion': 'preset sem número de versão válido',
    'err.preset.newer':
      'preset da versão {found}, esta build entende até a {max}. Atualize a ferramenta.',
    'err.preset.noParams': 'preset sem o bloco de parâmetros',
    'err.preset.stateCount': 'preset precisa ter exatamente {n} estados',
    'err.preset.stateCorrupt': 'estado {i} corrompido',
    'err.preset.stateNoSvg': 'estado {i} sem SVG',
    'err.preset.stateColor': 'estado {i} com cor inválida',
  },

  en: {
    'doc.title': 'Tonestamp — 7-state tonal halftone',
    'doc.desc': 'Tonal halftone in seven states. Runs offline in the browser, no install.',
    'doc.lang': 'en',

    'panel.aria': 'Controls',
    'head.sub': 'Tonal mapping in seven states',
    'canvas.aria': 'Halftone result. Preview of the processed image.',
    'hint.drop': 'Drop an image or video here',
    'hint.perf': 'a high grid with video will tank the frame rate',
    'drop.label': 'DROP IT HERE',

    'theme.toLight': 'Switch to light theme',
    'theme.toDark': 'Switch to dark theme',
    'lang.toggle': 'Mudar para português',
    'lang.short': 'PT',

    'sec.source': 'Source',
    'btn.image': 'Image',
    'btn.video': 'Video',
    'btn.cam': 'Webcam',
    'btn.ratio.original': 'Ratio: original',
    'btn.ratio.square': 'Ratio: 1×1',
    'btn.pause': 'Pause',
    'btn.play': 'Play',

    'sec.grid': 'Grid',
    'lbl.cols': 'Grid resolution (scale)',
    'lbl.bg': 'Background color',
    'chk.fill': 'Fill SVG shapes (solid)',
    'chk.invert': 'Quick invert mapping',

    'sec.states': '7-state midtone mapping',
    'lbl.shapeSet': 'Shape set',
    'msg.setLoaded': '"{name}" set loaded',
    'btn.allWhite': 'All white',
    'btn.defaultShapes': 'Default shapes',

    'sec.color': 'Colour',
    'mode.state': 'State',
    'mode.pixel': 'Pixel',
    'mode.quant': 'Quantize',
    'note.state': 'One fixed colour per tonal band. Shape and colour both come from brightness.',
    'note.pixel': 'Each cell samples the real colour at that point. The shape still comes from brightness.',
    'note.quant': 'The pixel colour snaps to the nearest palette colour. This is what gives the flat poster look.',
    'lbl.palN': 'Palette colours',
    'sw.empty': 'No palette extracted',
    'sw.copy': '{hex} — click to copy',
    'sw.copyAria': 'Copy {hex}',
    'sw.copied': 'copied',
    'btn.extract': 'Extract and apply',
    'btn.apply': 'Apply to states',
    'chk.autoPal': 'Extract palette on source change',
    'lbl.sat': 'Saturation',

    'sec.scale': 'Scale and rotation',
    'chk.scale': 'Scale shapes with midtones',
    'lbl.min': 'Min size (%)',
    'lbl.max': 'Max size (%)',
    'chk.rot': 'Enable 90° snap rotation',
    'lbl.rotInt': 'Rotation interval',
    'note.rot': 'Lower = faster.',

    'sec.tone': 'Tone',
    'lbl.bri': 'Brightness',
    'lbl.con': 'Contrast',
    'lbl.gam': 'Gamma',

    'sec.export': 'Export',
    'lbl.res': 'Output resolution',
    'chk.alpha': 'Transparent background (PNG and SVG)',
    'btn.png': 'PNG',
    'btn.svg': 'SVG',
    'btn.rec': 'Record video',
    'btn.recStop': 'Stop recording',
    'note.rec': 'Records the preview as {ext}, {fps}fps, ~{mbps} Mbps. Video resolution is the "Output resolution" above. Do not switch tabs while recording.',
    'note.recNo': 'This browser cannot record the canvas. Use Chrome or Firefox.',
    'err.rec.unsupported': 'this browser cannot record the canvas (no MediaRecorder). Use Chrome or Firefox.',
    'err.rec.noStream': 'could not capture the canvas.',
    'err.rec.empty': 'the recording came out with no frames. This happens if the tab is hidden while recording.',
    'err.rec.failed': 'recording failed ({name}).',
    'note.export': 'SVG export only carries real shapes once you upload your own files.',

    'sec.presets': 'Presets',
    'btn.savePreset': 'Save preset',
    'btn.loadPreset': 'Load preset',
    'note.presets': 'A preset stores everything, including the shapes you uploaded. It is a portable .json.',
    'msg.presetSaved': 'preset saved',
    'msg.presetLoaded': 'preset loaded: {name}',
    'msg.presetPartial': 'preset loaded, but {n} shape(s) failed to open',
    'msg.presetFailed': 'preset not loaded — {reason}',

    'note.flow':
      'Workflow: draw the shape → export it as a single-colour SVG → upload it to whichever state you want → adjust grid, colour and scale. State 1 is highlight, state 7 is shadow. Turning a state off leaves that tonal band empty.',
    'note.flow.lead': 'Workflow:',

    'state.colorAria': 'Colour of {state}',
    'state.previewAria': 'Shape preview for {state}',
    'state.uploadAria': 'Upload SVG for {state}',
    'state.uploadTitle': 'Upload SVG',
    'state.toggleAria': 'Turn {state} on or off',
    'state.toggleTitle': 'Toggle state',

    'tag.none': '— no source',
    'tag.failed': '— failed to load',
    'tag.source': '— {type} {w}×{h}',
    'tag.webcam': 'webcam',
    'tag.image': 'image',
    'tag.video': 'video',
    'stats.fps': '{fps} fps · {cols}×{rows} cells',

    'err.svg.empty': 'empty file',
    'err.svg.malformed': 'malformed XML',
    'err.svg.notSvg': 'the root element is not <svg>',
    'err.svg.draw': 'the browser could not render this SVG',
    'err.file.read': 'could not read the file',

    'err.src.image': 'could not open that image',
    'err.src.video': 'could not open that video',
    'err.src.svg': 'an SVG is a shape, not a source. Upload it with the ↑ on a state.',
    'err.src.format': 'unsupported format: {type}',
    'err.src.unknownType': 'unknown',

    'err.cam.unsupported': 'this browser does not expose the camera. Chrome or Firefox will work.',
    'err.cam.denied':
      'camera denied. Allow it from the padlock in the address bar. Opening the file straight from disk, Safari usually blocks it — use Chrome, or serve over https.',
    'err.cam.notFound': 'no camera found on this computer.',
    'err.cam.busy': 'the camera is in use by another application.',
    'err.cam.generic': 'could not open the camera ({name}).',

    'err.preset.json': 'not valid JSON',
    'err.preset.notObject': 'the file does not describe a preset',
    'err.preset.format': 'this JSON is not a Tonestamp preset',
    'err.preset.noVersion': 'preset has no valid version number',
    'err.preset.newer': 'preset is version {found}, this build understands up to {max}. Update the tool.',
    'err.preset.noParams': 'preset has no parameters block',
    'err.preset.stateCount': 'a preset must have exactly {n} states',
    'err.preset.stateCorrupt': 'state {i} is corrupt',
    'err.preset.stateNoSvg': 'state {i} has no SVG',
    'err.preset.stateColor': 'state {i} has an invalid colour',
  },
};

/* ---------------- estado do idioma ---------------- */

let current = 'pt';
const listeners = new Set();

/** @returns {'pt'|'en'} */
export function getLang() {
  return current;
}

/** Idioma salvo, ou null se o usuário nunca escolheu. */
function stored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/** Palpite a partir do navegador. Português só pra pt-*; o resto cai no inglês. */
function detect() {
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

/**
 * Traduz uma chave, interpolando `{nome}` a partir de `vars`.
 *
 * Chave desconhecida volta como a própria chave, em vez de string vazia:
 * um texto errado na tela é mais fácil de achar do que um buraco.
 *
 * @param {string} key
 * @param {Record<string, string|number>} [vars]
 * @returns {string}
 */
export function t(key, vars) {
  const table = DICT[current] || DICT.pt;
  let s = table[key];
  if (s === undefined) s = (DICT.pt[key] !== undefined ? DICT.pt[key] : key);
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

/** @param {(lang:string)=>void} fn */
export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Reescreve todo texto marcado com data-i18n no documento.
 * Chamado no boot e a cada troca de idioma.
 */
export function applyStatic() {
  const root = document.documentElement;
  root.lang = t('doc.lang');
  document.title = t('doc.title');

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('doc.desc'));

  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.getAttribute('data-i18n'));
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  }
}

/**
 * Troca o idioma, persiste e avisa quem escuta.
 * @param {'pt'|'en'} lang
 */
export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage bloqueado: vale só nesta sessão
  }
  applyStatic();
  for (const fn of listeners) fn(current);
}

/** Alterna entre os idiomas disponíveis. */
export function toggleLang() {
  setLang(LANGS[(LANGS.indexOf(current) + 1) % LANGS.length]);
}

/**
 * Define o idioma inicial e liga o botão de alternância.
 * @param {HTMLButtonElement} button
 */
export function initI18n(button) {
  current = stored() || detect();
  applyStatic();

  const sync = () => {
    button.setAttribute('aria-label', t('lang.toggle'));
    button.setAttribute('title', t('lang.toggle'));
    button.textContent = t('lang.short');
  };
  sync();
  onLangChange(sync);
  button.addEventListener('click', toggleLang);
}

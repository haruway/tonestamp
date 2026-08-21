/**
 * main.js — boot e wiring.
 *
 * Este é o único módulo que conhece os ids do HTML. Ele lê a interface e
 * escreve no estado; lê o estado e escreve na interface. Nenhuma regra de
 * negócio mora aqui — se aparecer matemática de imagem neste arquivo, ela
 * está no lugar errado.
 */

import { S, slots, N, STATE_META, set, subscribe, getPalette, setPalette } from './state.js';
import { DEFAULT_SVG, buildSlotImage, getTint, clearTints } from './shapes.js';
import { SHAPE_SETS, findShapeSet } from './shape-sets.js';
import { extractPalette, rgb2hex, spreadOverStates } from './palette.js';
import * as renderer from './renderer.js';
import * as exporter from './export.js';
import * as sources from './sources.js';
import * as presets from './presets.js';
import { initTheme } from './theme.js';
import { initI18n, t, onLangChange, getLang } from './i18n.js';

/** @param {string} id */
const $ = (id) => document.getElementById(id);

/** Acima disto, com fonte em movimento, o fps cai de verdade. */
const PERF_COLS_WARN = 160;

/* ================= lista de estados ================= */

const statesEl = $('states');

STATE_META.forEach(([name, sub], i) => {
  const row = document.createElement('div');
  row.className = 'state';
  row.id = 'st' + i;
  row.innerHTML = `
    <div class="sw">
      <input type="color" id="c${i}" value="#ffffff">
    </div>
    <div>
      <div class="st-n">${name}</div>
      <div class="st-s">${sub}</div>
    </div>
    <div class="st-a">
      <canvas class="prev" id="pv${i}" width="26" height="26" role="img"></canvas>
      <button class="mini" id="up${i}" type="button">↑</button>
      <button class="mini" id="tg${i}" type="button" aria-pressed="true">●</button>
      <input type="file" id="fi${i}" accept=".svg,image/svg+xml" class="vh" tabindex="-1" aria-hidden="true">
    </div>
    <p class="st-err" id="er${i}" role="status" hidden></p>`;
  statesEl.appendChild(row);
});

/**
 * Escreve os rótulos acessíveis dos 7 cards. Fica separado da criação porque
 * precisa rodar de novo a cada troca de idioma.
 */
function syncStateLabels() {
  STATE_META.forEach(([name, sub], i) => {
    const state = `${name} · ${sub}`;
    $('c' + i).setAttribute('aria-label', t('state.colorAria', { state }));
    $('pv' + i).setAttribute('aria-label', t('state.previewAria', { state }));
    $('up' + i).setAttribute('aria-label', t('state.uploadAria', { state }));
    $('up' + i).setAttribute('title', t('state.uploadTitle'));
    $('tg' + i).setAttribute('aria-label', t('state.toggleAria', { state }));
    $('tg' + i).setAttribute('title', t('state.toggleTitle'));
  });
}

/**
 * Pinta o quadradinho de prévia do estado: fundo da composição + shape tingida.
 * @param {number} i
 */
function paintPreview(i) {
  const cv = $('pv' + i);
  if (!cv) return;
  const x = cv.getContext('2d');
  x.fillStyle = S.bg;
  x.fillRect(0, 0, cv.width, cv.height);
  const slot = slots[i];
  const tint = getTint(i, slot.img, slot.color, S.fill);
  if (tint && slot.on) x.drawImage(tint, 2, 2, cv.width - 4, cv.height - 4);
}

/**
 * Mostra ou esconde o erro de um estado.
 * @param {number} i
 */
function showSlotError(i) {
  const el = $('er' + i);
  const slot = slots[i];
  if (slot.error) {
    // slot.error é uma chave vinda de shapes.js, não uma frase
    el.textContent = `${slot.name}: ${t(slot.error)}`;
    el.hidden = false;
    $('st' + i).classList.add('err');
  } else {
    el.textContent = '';
    el.hidden = true;
    $('st' + i).classList.remove('err');
  }
}

/**
 * Recarrega a imagem de um slot e atualiza a prévia.
 * @param {number} i
 */
async function rebuildSlot(i) {
  clearTints();
  await buildSlotImage(slots[i]);
  showSlotError(i);
  paintPreview(i);
}

/**
 * Marca a geração da reconstrução em andamento. Trocar de conjunto no meio de
 * uma reconstrução dispara outra; a antiga precisa desistir, senão as duas
 * escrevem nas prévias e sobra uma mistura dos dois conjuntos.
 */
let rebuildToken = 0;

async function rebuildAll() {
  const token = ++rebuildToken;
  clearTints();
  for (let i = 0; i < N; i++) {
    await buildSlotImage(slots[i]);
    if (token !== rebuildToken) return; // outra reconstrução assumiu
    showSlotError(i);
    paintPreview(i);
  }
}

function repaintAllPreviews() {
  for (let i = 0; i < N; i++) paintPreview(i);
}

/* ================= controles dos estados ================= */

for (let i = 0; i < N; i++) {
  $('c' + i).addEventListener('input', (e) => {
    slots[i].color = e.target.value;
    rebuildSlot(i);
  });

  $('up' + i).addEventListener('click', () => $('fi' + i).click());

  $('fi' + i).addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // permite subir o mesmo arquivo de novo
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      slots[i].svgText = String(reader.result);
      slots[i].dirtyImg = true;
      slots[i].name = file.name;
      $('up' + i).classList.add('has');
      rebuildSlot(i);
    };
    reader.onerror = () => {
      slots[i].error = 'err.file.read';
      showSlotError(i);
    };
    reader.readAsText(file);
  });

  $('tg' + i).addEventListener('click', () => {
    slots[i].on = !slots[i].on;
    syncSlotToggle(i);
    paintPreview(i);
  });
}

function syncSlotToggle(i) {
  const on = slots[i].on;
  $('st' + i).classList.toggle('off', !on);
  $('tg' + i).setAttribute('aria-pressed', String(on));
}

$('bAllWhite').addEventListener('click', () => {
  slots.forEach((s, i) => {
    s.color = '#ffffff';
    $('c' + i).value = '#ffffff';
  });
  rebuildAll();
});

/* ================= conjuntos de shapes embutidos ================= */

/** id do conjunto carregado por último, pra o seletor não mentir. */
let currentSet = SHAPE_SETS[0].id;

/**
 * Carrega um conjunto embutido nos 7 estados.
 *
 * Os conjuntos vêm de `shape-sets.js`, gerado a partir das pastas de
 * `shapes/`. Não dá pra buscar os arquivos em disco: a ferramenta abre de
 * file://, sem servidor, e fetch nesse protocolo é bloqueado.
 *
 * @param {string} id
 */
function loadShapeSet(id) {
  const set = findShapeSet(id);
  if (!set) return;
  currentSet = set.id;
  slots.forEach((slot, i) => {
    slot.svgText = set.svgs[i];
    slot.dirtyImg = true;
    slot.name = set.id;
    slot.on = true;
    slot.error = null;
    $('up' + i).classList.remove('has');
    syncSlotToggle(i);
  });
  $('selSet').value = set.id;
  rebuildAll();
}

/** Preenche o seletor, com os rótulos no idioma atual. */
function buildSetOptions() {
  const sel = $('selSet');
  sel.innerHTML = '';
  for (const set of SHAPE_SETS) {
    const opt = document.createElement('option');
    opt.value = set.id;
    opt.textContent = set.labels[getLang()] || set.labels.en;
    sel.appendChild(opt);
  }
  sel.value = currentSet;
}

$('selSet').addEventListener('change', (e) => loadShapeSet(e.target.value));

$('bReset').addEventListener('click', () => loadShapeSet(currentSet));

/* ================= sliders e checkboxes ================= */

/**
 * Liga um range ao estado e ao seu rótulo numérico.
 * @param {string} id id do input
 * @param {string} vid id do <b> que mostra o valor
 * @param {string} key chave em S
 * @param {(v:number)=>string} [fmt] formatação do rótulo
 * @param {(v:number)=>number} [map] conversão do valor bruto pro estado
 */
function bindRange(id, vid, key, fmt, map) {
  const el = $(id);
  const label = $(vid);
  el.addEventListener('input', () => {
    const raw = +el.value;
    set(key, map ? map(raw) : raw);
    label.textContent = fmt ? fmt(raw) : String(raw);
  });
}

bindRange('rCols', 'vCols', 'cols');
bindRange('rMin', 'vMin', 'minS');
bindRange('rMax', 'vMax', 'maxS');
bindRange('rRot', 'vRot', 'rotInt', (v) => v + 'ms');
bindRange('rBri', 'vBri', 'bri');
bindRange('rCon', 'vCon', 'con');
bindRange('rGam', 'vGam', 'gam', (v) => (v / 100).toFixed(2), (v) => v / 100);
bindRange('rRes', 'vRes', 'res', (v) => v + 'px');

$('cBg').addEventListener('input', (e) => set('bg', e.target.value));

$('kFill').addEventListener('change', (e) => {
  set('fill', e.target.checked);
  clearTints();
  rebuildAll();
});
$('kInv').addEventListener('change', (e) => set('invert', e.target.checked));
$('kScale').addEventListener('change', (e) => set('scale', e.target.checked));
$('kRot').addEventListener('change', (e) => set('rot', e.target.checked));
$('kAuto').addEventListener('change', (e) => set('autoPal', e.target.checked));
$('kAlpha').addEventListener('change', (e) => set('alpha', e.target.checked));

/* ================= cor ================= */

const MODE_NOTE = { state: 'note.state', pixel: 'note.pixel', quant: 'note.quant' };
const MODE_BTN = { state: 'mState', pixel: 'mPixel', quant: 'mQuant' };

function setMode(mode) {
  set('cmode', mode);
  for (const [key, id] of Object.entries(MODE_BTN)) {
    const on = key === mode;
    $(id).classList.toggle('on', on);
    $(id).setAttribute('aria-pressed', String(on));
  }
  $('modeNote').textContent = t(MODE_NOTE[mode]);
  if (mode === 'quant' && !getPalette().length) doExtract();
}

for (const [key, id] of Object.entries(MODE_BTN)) {
  $(id).addEventListener('click', () => setMode(key));
}

function drawSwatches() {
  const el = $('swatches');
  const palette = getPalette();
  el.innerHTML = '';
  if (!palette.length) {
    const empty = document.createElement('span');
    empty.id = 'swEmpty';
    empty.textContent = t('sw.empty');
    el.appendChild(empty);
    return;
  }
  palette.forEach((p) => {
    const hex = rgb2hex(p[0], p[1], p[2]);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sws';
    b.style.background = hex;
    b.title = t('sw.copy', { hex });
    b.setAttribute('aria-label', t('sw.copyAria', { hex }));
    b.addEventListener('click', () => {
      if (navigator.clipboard) navigator.clipboard.writeText(hex).catch(() => {});
      b.title = t('sw.copied');
    });
    el.appendChild(b);
  });
}

/**
 * Extrai a paleta da fonte e já distribui nos 7 estados.
 *
 * Extrair sem aplicar não servia pra nada: os swatches enchiam e a imagem
 * continuava igual, então era preciso lembrar de clicar em "Aplicar nos
 * estados". Agora extrair é uma ação só.
 *
 * @param {boolean} [apply=true] false só preenche os swatches, usado quando
 *   o usuário mexe no número de cores da paleta sem pedir aplicação
 */
function doExtract(apply = true) {
  const info = sources.getSource();
  setPalette(extractPalette(info ? info.el : null, S.palN));
  drawSwatches();
  if (apply) applyToStates();
}

function applyToStates() {
  if (!getPalette().length) doExtract();
  const colors = spreadOverStates(getPalette(), N);
  if (!colors.length) return;
  colors.forEach((hex, i) => {
    slots[i].color = hex;
    $('c' + i).value = hex;
  });
  clearTints();
  repaintAllPreviews();
}

$('rPal').addEventListener('input', (e) => {
  set('palN', +e.target.value);
  $('vPal').textContent = String(S.palN);
  // arrastar o slider re-extrai e reaplica, pra o resultado aparecer na hora
  if (getPalette().length) doExtract();
});
$('rSat').addEventListener('input', (e) => {
  set('sat', +e.target.value);
  $('vSat').textContent = String(S.sat);
});
$('bExtract').addEventListener('click', doExtract);
$('bApply').addEventListener('click', applyToStates);

/* ================= fonte ================= */

const bRatio = $('bRatio');
bRatio.addEventListener('click', () => {
  set('square', !S.square);
  syncRatioButton();
});
function syncRatioButton() {
  bRatio.textContent = t(S.square ? 'btn.ratio.square' : 'btn.ratio.original');
  bRatio.setAttribute('aria-pressed', String(S.square));
}

const bPlay = $('bPlay');
bPlay.addEventListener('click', () => {
  set('playing', !S.playing);
  syncPlayButton();
  sources.setPlaying(S.playing);
});
function syncPlayButton() {
  bPlay.textContent = t(S.playing ? 'btn.pause' : 'btn.play');
}

$('bImg').addEventListener('click', () => $('fImg').click());
$('bVid').addEventListener('click', () => $('fVid').click());

$('fImg').addEventListener('change', (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) sources.loadFile(f, S.playing);
});
$('fVid').addEventListener('change', (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (f) sources.loadFile(f, S.playing);
});
$('bCam').addEventListener('click', () => sources.startCam());

sources.initDropZone($('drop'), () => S.playing);

/** Mensagem de erro da seção Fonte. */
function showSourceMessage(text, kind) {
  const el = $('srcMsg');
  if (!text) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.textContent = text;
  el.className = 'note srcmsg ' + (kind || 'bad');
  el.hidden = false;
}

sources.onError((key, vars) => {
  // sources.js manda chave, não frase: a tradução é aqui
  const filled = { ...vars };
  if (filled.type === null || filled.type === undefined) filled.type = t('err.src.unknownType');
  showSourceMessage(t(key, filled), 'bad');
  $('tagInfo').textContent = t('tag.failed');
});

sources.onChange((info) => {
  showSourceMessage('');
  syncSourceTag();
  updatePerfWarning();
  // fonte nova, proporção nova: a altura da saída muda junto
  syncRecNote();
  // Extração automática só PREENCHE os swatches, não aplica nos estados.
  // Aplicar aqui sobrescreveria as sete cores escolhidas na mão toda vez que
  // uma fonte nova entrasse — e no boot deixava tudo cinza. Quem aplica é o
  // botão "Extrair e aplicar", que é ação explícita.
  // Pequeno atraso: com vídeo, o primeiro quadro pode não estar pronto.
  if (S.autoPal) setTimeout(() => doExtract(false), 60);
});

/** Escreve o rótulo da fonte ativa no canto do stage. */
function syncSourceTag() {
  const info = sources.getSource();
  if (!info) {
    $('tagInfo').textContent = t('tag.none');
    return;
  }
  const type = t(info.type === 'cam' ? 'tag.webcam' : info.type === 'video' ? 'tag.video' : 'tag.image');
  $('tagInfo').textContent = t('tag.source', { type, w: info.w, h: info.h });
}

/* ================= aviso de performance ================= */

function updatePerfWarning() {
  const info = sources.getSource();
  const moving = !!info && info.type !== 'image';
  $('perfWarn').hidden = !(moving && S.cols > PERF_COLS_WARN);
}

/* ================= exportar ================= */

$('bPng').addEventListener('click', () => exporter.exportPNG());
$('bSvg').addEventListener('click', () => exporter.exportSVG());

const bRec = $('bRec');

/** Mostra o que a gravação vai produzir, ou por que não vai. */
function syncRecNote() {
  // tamanho pretendido, não o atual do canvas: no boot o canvas ainda está no
  // tamanho do HTML e a nota saía com a taxa de bits errada
  const { w, h } = renderer.outputSize();
  const info = exporter.recordingInfo(w, h);
  const el = $('recNote');
  el.textContent = info ? t('note.rec', info) : t('note.recNo');
  el.classList.toggle('warn', !info);
  bRec.disabled = !info;
}

function setRecIdle() {
  bRec.textContent = t('btn.rec');
  bRec.classList.remove('on');
  bRec.setAttribute('aria-pressed', 'false');
  // a resolução volta a ser editável: mudá-la redimensiona o canvas, o que
  // invalida a stream capturada
  $('rRes').disabled = false;
}

bRec.addEventListener('click', () => {
  exporter.toggleRecording((state, detail) => {
    if (state === 'recording') {
      bRec.textContent = t('btn.recStop');
      bRec.classList.add('on');
      bRec.setAttribute('aria-pressed', 'true');
      $('rRes').disabled = true;
      showSourceMessage('');
      return;
    }
    setRecIdle();
    if (state === 'error' && detail) {
      showSourceMessage(t(detail.key, detail.vars), 'bad');
    }
  });
});

/* ================= presets ================= */

function showPresetMessage(text, kind) {
  const el = $('presetMsg');
  if (!text) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.textContent = text;
  el.className = 'note msg ' + kind;
  el.hidden = false;
}

$('bSavePreset').addEventListener('click', () => {
  presets.downloadPreset(getPalette());
  showPresetMessage(t('msg.presetSaved'), 'ok');
});

$('bLoadPreset').addEventListener('click', () => $('fPreset').click());

$('fPreset').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    const result = presets.parsePreset(String(reader.result));
    if (!result.ok) {
      showPresetMessage(t('msg.presetFailed', { reason: t(result.error, result.vars) }), 'bad');
      return;
    }
    presets.applyPreset(result.data);
    syncUI();
    await rebuildAll();
    drawSwatches();
    const broken = slots.filter((s) => s.error).length;
    showPresetMessage(
      broken
        ? t('msg.presetPartial', { n: broken })
        : t('msg.presetLoaded', { name: file.name }),
      broken ? 'bad' : 'ok'
    );
  };
  reader.onerror = () => showPresetMessage(t('err.file.read'), 'bad');
  reader.readAsText(file);
});

/* ================= sincronizar interface a partir do estado ================= */

/**
 * Escreve o estado inteiro de volta nos controles. Usado depois de carregar
 * um preset — é mais barato e mais seguro que atualizar campo por campo.
 */
function syncUI() {
  $('rCols').value = S.cols;
  $('vCols').textContent = String(S.cols);
  $('cBg').value = S.bg;
  $('kFill').checked = S.fill;
  $('kInv').checked = S.invert;

  $('kScale').checked = S.scale;
  $('rMin').value = S.minS;
  $('vMin').textContent = String(S.minS);
  $('rMax').value = S.maxS;
  $('vMax').textContent = String(S.maxS);
  $('kRot').checked = S.rot;
  $('rRot').value = S.rotInt;
  $('vRot').textContent = S.rotInt + 'ms';

  $('rBri').value = S.bri;
  $('vBri').textContent = String(S.bri);
  $('rCon').value = S.con;
  $('vCon').textContent = String(S.con);
  $('rGam').value = Math.round(S.gam * 100);
  $('vGam').textContent = S.gam.toFixed(2);

  $('rRes').value = S.res;
  $('vRes').textContent = S.res + 'px';

  $('rPal').value = S.palN;
  $('vPal').textContent = String(S.palN);
  $('rSat').value = S.sat;
  $('vSat').textContent = String(S.sat);
  $('kAuto').checked = S.autoPal;
  $('kAlpha').checked = S.alpha;

  for (const [key, id] of Object.entries(MODE_BTN)) {
    const on = key === S.cmode;
    $(id).classList.toggle('on', on);
    $(id).setAttribute('aria-pressed', String(on));
  }
  $('modeNote').textContent = t(MODE_NOTE[S.cmode]);

  slots.forEach((slot, i) => {
    $('c' + i).value = slot.color;
    syncSlotToggle(i);
    $('up' + i).classList.toggle('has', slot.svgText !== DEFAULT_SVG[i]);
  });

  syncRatioButton();
  syncPlayButton();
  sources.setPlaying(S.playing);
  updatePerfWarning();
}

/**
 * Reescreve tudo que é texto dinâmico — o que `applyStatic` do i18n não
 * alcança, porque é gerado em JS ou depende do estado atual.
 */
function syncDynamicText() {
  buildSetOptions();
  syncStateLabels();
  syncRatioButton();
  syncPlayButton();
  syncSourceTag();
  $('modeNote').textContent = t(MODE_NOTE[S.cmode]);
  if (!exporter.isRecording()) bRec.textContent = t('btn.rec');
  syncRecNote();
  drawSwatches();
  for (let i = 0; i < N; i++) showSlotError(i);
}

/* ================= reações a mudanças de estado ================= */

subscribe((key) => {
  if (key === 'bg' || key === 'fill') repaintAllPreviews();
  if (key === 'cols') updatePerfWarning();
  // estes três mudam o tamanho da saída, e a nota da gravação anuncia
  // resolução e taxa de bits
  if (key === 'res' || key === 'cols' || key === 'square') syncRecNote();
});

/* ================= ciclo de vida ================= */

// aba escondida: nada de queimar CPU desenhando pra ninguém
document.addEventListener('visibilitychange', () => {
  // gravando, o loop precisa continuar: se o canvas para de mudar, o
  // captureStream para de emitir quadros e o arquivo sai vazio
  if (document.hidden && !exporter.isRecording()) renderer.stop();
  else renderer.start();
});

window.addEventListener('pagehide', () => {
  renderer.stop();
  sources.releaseAll();
});

/* ================= boot ================= */

initI18n($('langToggle'));
initTheme($('themeToggle'));
onLangChange(syncDynamicText);

const canvas = $('out');
renderer.init(canvas);
exporter.init(canvas);

renderer.onStats(({ fps, cols, rows }) => {
  $('fps').textContent = t('stats.fps', { fps, cols, rows });
});

/**
 * Imagem de teste: um gradiente radial. Serve pra ver a rampa dos 7 estados
 * imediatamente, sem precisar carregar nada.
 */
function testPattern() {
  const c = document.createElement('canvas');
  c.width = c.height = 800;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, 800, 800);
  const gr = x.createRadialGradient(400, 340, 20, 400, 400, 420);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(0.45, '#8a8a8a');
  gr.addColorStop(1, '#000');
  x.fillStyle = gr;
  x.fillRect(0, 0, 800, 800);
  return c.toDataURL();
}

syncDynamicText();

rebuildAll().then(() => sources.setImage(testPattern()));
renderer.start();

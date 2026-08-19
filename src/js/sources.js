/**
 * sources.js — de onde vem a imagem: arquivo, vídeo, webcam, arrastar e soltar.
 *
 * Guarda a fonte ativa e cuida do ciclo de vida dela: parar a stream da câmera
 * ao trocar, revogar object URL, avisar quem escuta quando a fonte muda.
 *
 * Este é o único módulo além de `main.js` que fala com o DOM da página, e só
 * pro drop zone. O resto é elemento em memória.
 */

/**
 * @typedef {'image'|'video'|'cam'} SourceType
 * @typedef {object} SourceInfo
 * @property {CanvasImageSource} el
 * @property {SourceType} type
 * @property {number} w
 * @property {number} h
 */

/** @type {SourceInfo|null} */
let current = null;

/** @type {MediaStream|null} */
let camStream = null;

/**
 * Object URL do arquivo em uso. Guardado pra ser revogado na próxima troca.
 * Imagem revoga assim que decodifica; vídeo não pode, o elemento ainda
 * precisa da URL pra fazer loop e seek.
 */
let heldUrl = null;

const changeListeners = new Set();
const errorListeners = new Set();

/** @param {(info: SourceInfo) => void} fn */
export function onChange(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

/** @param {(message: string) => void} fn */
export function onError(fn) {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

function emitChange() {
  for (const fn of changeListeners) fn(current);
}

function fail(message) {
  for (const fn of errorListeners) fn(message);
}

/** @returns {SourceInfo|null} */
export function getSource() {
  return current;
}

/* ---------------- limpeza ---------------- */

/** Para a stream da webcam, se houver. Idempotente. */
export function stopCam() {
  if (!camStream) return;
  camStream.getTracks().forEach((t) => t.stop());
  camStream = null;
}

/** Revoga o object URL retido, se houver. */
function releaseHeldUrl() {
  if (!heldUrl) return;
  URL.revokeObjectURL(heldUrl);
  heldUrl = null;
}

/**
 * Solta tudo: câmera, vídeo tocando e object URL.
 * Chamado ao trocar de fonte e ao sair da página.
 */
export function releaseAll() {
  stopCam();
  if (current && current.type === 'video' && current.el.pause) {
    current.el.pause();
    current.el.removeAttribute('src');
    current.el.load();
  }
  releaseHeldUrl();
}

/** Chamado antes de instalar uma fonte nova. */
function prepareForNewSource() {
  stopCam();
  releaseHeldUrl();
}

/* ---------------- instalar fontes ---------------- */

/**
 * @param {string} url data: ou blob:
 */
export function setImage(url) {
  prepareForNewSource();
  const isBlob = url.startsWith('blob:');
  const im = new Image();
  im.onload = () => {
    // a imagem já está decodificada em memória: a URL não serve mais pra nada
    if (isBlob) URL.revokeObjectURL(url);
    current = { el: im, type: 'image', w: im.naturalWidth, h: im.naturalHeight };
    emitChange();
  };
  im.onerror = () => {
    if (isBlob) URL.revokeObjectURL(url);
    fail('não consegui abrir essa imagem');
  };
  im.src = url;
}

/**
 * @param {string} url
 * @param {boolean} playing estado atual de play/pause
 */
export function setVideo(url, playing) {
  prepareForNewSource();
  const v = document.createElement('video');
  v.src = url;
  v.loop = true;
  v.muted = true;
  v.playsInline = true;
  // o elemento precisa da URL viva pra fazer loop, então ela fica retida
  if (url.startsWith('blob:')) heldUrl = url;
  v.addEventListener('error', () => fail('não consegui abrir esse vídeo'));
  v.addEventListener(
    'loadeddata',
    () => {
      current = { el: v, type: 'video', w: v.videoWidth, h: v.videoHeight };
      if (playing) v.play().catch(() => {});
      emitChange();
    },
    { once: true }
  );
}

/**
 * Pede a câmera e instala como fonte ao vivo.
 * @returns {Promise<boolean>} true se conseguiu
 */
export async function startCam() {
  prepareForNewSource();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    fail('este navegador não expõe a câmera. Chrome ou Firefox resolvem.');
    return false;
  }
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
    const v = document.createElement('video');
    v.srcObject = camStream;
    v.muted = true;
    v.playsInline = true;
    await v.play();
    current = { el: v, type: 'cam', w: v.videoWidth, h: v.videoHeight };
    emitChange();
    return true;
  } catch (err) {
    stopCam();
    fail(cameraErrorMessage(err));
    return false;
  }
}

/**
 * Traduz o erro de getUserMedia pra algo acionável.
 * @param {DOMException|Error} err
 */
function cameraErrorMessage(err) {
  switch (err && err.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'câmera negada. Libere a permissão no cadeado da barra de endereço. Abrindo o arquivo direto do disco, o Safari costuma bloquear — use Chrome, ou sirva por https.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'nenhuma câmera encontrada neste computador.';
    case 'NotReadableError':
      return 'a câmera está ocupada por outro aplicativo.';
    default:
      return 'não consegui abrir a câmera' + (err && err.name ? ` (${err.name})` : '') + '.';
  }
}

/**
 * Play/pause do vídeo ou da webcam. Não faz nada com imagem parada.
 * @param {boolean} playing
 */
export function setPlaying(playing) {
  if (!current || current.type === 'image') return;
  const el = current.el;
  if (playing) el.play && el.play().catch(() => {});
  else el.pause && el.pause();
}

/* ---------------- entrada de arquivo ---------------- */

/**
 * Recebe um File e instala como fonte, se o tipo servir.
 * @param {File} file
 * @param {boolean} playing
 * @returns {boolean} true se o arquivo foi aceito
 */
export function loadFile(file, playing) {
  if (!file) return false;
  // SVG cai aqui quando o usuário arrasta uma shape por engano: ignora,
  // shape se sobe pelo botão do estado
  if (file.type.startsWith('image/svg')) {
    fail('SVG é shape, não é fonte. Suba pelo ↑ de um estado.');
    return false;
  }
  if (file.type.startsWith('image/')) {
    setImage(URL.createObjectURL(file));
    return true;
  }
  if (file.type.startsWith('video/')) {
    setVideo(URL.createObjectURL(file), playing);
    return true;
  }
  fail('formato não suportado: ' + (file.type || 'desconhecido'));
  return false;
}

/**
 * Liga o arrastar e soltar na janela inteira, mostrando o overlay.
 *
 * O contador existe porque `dragleave` dispara ao passar por cima de
 * qualquer filho; sem contar entradas e saídas o overlay pisca.
 *
 * @param {HTMLElement} overlayEl
 * @param {() => boolean} isPlaying
 */
export function initDropZone(overlayEl, isPlaying) {
  let depth = 0;

  const show = () => overlayEl.classList.add('on');
  const hide = () => {
    depth = 0;
    overlayEl.classList.remove('on');
  };

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    depth++;
    show();
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('dragleave', () => {
    depth--;
    if (depth <= 0) hide();
  });
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    hide();
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (file) loadFile(file, isPlaying());
  });
}

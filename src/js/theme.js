/**
 * theme.js — alternância entre o tema escuro e o claro da INTERFACE.
 *
 * Deixando explícito porque é fácil errar: isto não tem nenhuma relação com o
 * "Background color" do grid. Aquilo é cor da composição, mora em `S.bg` e
 * pertence ao usuário. Trocar o tema aqui nunca pode encostar naquilo.
 *
 * O tema inicial é escrito no <html> por um script inline no index.html, antes
 * da primeira pintura. Este módulo cuida do resto do ciclo de vida.
 */

const STORAGE_KEY = 'svgdither:theme';
const THEMES = ['dark', 'light'];

/** @returns {'dark'|'light'} */
export function getTheme() {
  const t = document.documentElement.getAttribute('data-theme');
  return THEMES.includes(t) ? t : 'dark';
}

/** @returns {'dark'|'light'|null} o que está salvo, se houver escolha explícita */
function stored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Aplica um tema e persiste a escolha.
 * @param {'dark'|'light'} theme
 */
export function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // modo privado ou storage bloqueado: o tema vale só nesta sessão
  }
  syncButton();
}

/** Inverte o tema atual. */
export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

/** @type {HTMLButtonElement|null} */
let btn = null;

function syncButton() {
  if (!btn) return;
  const next = getTheme() === 'dark' ? 'claro' : 'escuro';
  btn.setAttribute('aria-label', `Alternar para tema ${next}`);
  btn.setAttribute('title', `Alternar para tema ${next}`);
}

/**
 * Liga o botão de alternância e o acompanhamento da preferência do sistema.
 * @param {HTMLButtonElement} button
 */
export function initTheme(button) {
  btn = button;
  syncButton();
  btn.addEventListener('click', toggleTheme);

  // enquanto o usuário não escolher um tema na mão, seguimos o sistema ao vivo
  const mq = matchMedia('(prefers-color-scheme: light)');
  const follow = (e) => {
    if (stored()) return;
    document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    syncButton();
  };
  if (mq.addEventListener) mq.addEventListener('change', follow);
  else if (mq.addListener) mq.addListener(follow); // Safari antigo
}

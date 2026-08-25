// Light/dark theme. Sets data-theme on <html>; persisted in localStorage;
// defaults to the OS preference. The actual colours are CSS-variable overrides
// under :root[data-theme="dark"] (see shell.css + each tool's tokens). An inline
// <head> script (injected by vite.config) applies the saved theme before paint
// to avoid a flash; this module wires the toggle buttons.
const KEY = 'uward-theme';

export function currentTheme() {
  try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light') return v; } catch (e) {}
  return 'light';
}

function apply(t) { document.documentElement.setAttribute('data-theme', t); refreshButtons(); }

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(KEY, next); } catch (e) {}
  apply(next);
}

function refreshButtons() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
    b.textContent = dark ? '☀' : '☾';
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    b.setAttribute('aria-label', label);
    b.title = label;
  });
}

/** Create a theme-toggle button (caller styles/places it). */
export function makeThemeToggle() {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('data-theme-toggle', '');
  b.textContent = currentTheme() === 'dark' ? '☀' : '☾';
  b.addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });
  return b;
}

// Make sure the attribute is set even if the inline head script didn't run.
apply(currentTheme());

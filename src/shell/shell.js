// Shared in-tool shell: a slim sticky top bar (Home · tool name · Switch tool)
// plus a bottom-sheet tool switcher. Included on every tool page via:
//   <script type="module" src="/src/shell/shell.js"></script>
//
// It is intentionally framework-free and self-mounting so each migrated tool
// needs no changes beyond that one script tag.
import './shell.css';
import { WARDS, ALL_TOOLS, toolHref, hubHref, currentToolId } from './tools.js';
import { openTerms } from './consent.js'; // also self-mounts the first-use terms gate

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) =>
    node.append(c instanceof Node ? c : document.createTextNode(c)),
  );
  return node;
}

function buildSheet(activeId) {
  const backdrop = el('div', { id: 'ushell-backdrop' });
  const sheet = el('div', { id: 'ushell-sheet', role: 'dialog', 'aria-label': 'Switch tool' });
  sheet.append(el('div', { class: 'ush-grip' }));
  WARDS.forEach((w) => {
    sheet.append(el('div', { class: 'ush-ward' }, `${w.icon} ${w.name}`));
    w.tools.forEach((t) => {
      const a = el('a', { class: 'ush-tool' + (t.id === activeId ? ' active' : ''), href: toolHref(t.path) }, [
        el('span', { class: 'ush-ico' }, t.icon),
        el('span', {}, [
          el('div', { class: 'ush-name' }, t.name),
          el('div', { class: 'ush-desc' }, t.desc),
        ]),
      ]);
      sheet.append(a);
    });
  });
  const terms = el('button', { class: 'ush-terms', type: 'button' }, 'ข้อกำหนดการใช้งาน & เครดิต');
  terms.addEventListener('click', () => { backdrop.classList.remove('open'); sheet.classList.remove('open'); openTerms(); });
  sheet.append(terms);
  const close = () => { backdrop.classList.remove('open'); sheet.classList.remove('open'); };
  backdrop.addEventListener('click', close);
  return { backdrop, sheet, open: () => { backdrop.classList.add('open'); sheet.classList.add('open'); }, close };
}

function mount() {
  if (document.getElementById('ushell-bar')) return;
  const activeId = currentToolId();
  const active = ALL_TOOLS.find((t) => t.id === activeId);

  const { backdrop, sheet, open } = buildSheet(activeId);

  const home = el('button', { id: 'ushell-home', title: 'All tools', 'aria-label': 'All tools' }, '⌂');
  home.addEventListener('click', () => { location.href = hubHref(); });

  const title = el('div', { id: 'ushell-title' }, active ? active.name : 'uWard');

  const switchBtn = el('button', { id: 'ushell-switch', title: 'Switch tool' }, '⇄ Tools');
  switchBtn.addEventListener('click', open);

  const bar = el('div', { id: 'ushell-bar' }, [home, title, switchBtn]);

  document.body.prepend(bar);
  document.body.append(backdrop, sheet);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

import './shell/shell.css'; // design tokens
import './shell/theme.css'; // shared modern baseline
import './hub.css';
import { WARDS, toolHref } from './shell/tools.js';
import { openTerms } from './shell/consent.js'; // also self-mounts the first-use terms gate

const BUILD = import.meta.env.VITE_BUILD_SHA || 'dev';

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) =>
    node.append(c instanceof Node ? c : document.createTextNode(c)),
  );
  return node;
}

function render() {
  const root = document.getElementById('hub');
  root.replaceChildren();

  const head = h('header', { class: 'hub-head' }, [
    h('div', { class: 'hub-brand' }, [h('span', { class: 'mark' }, '✚'), 'uWard']),
    h('p', { class: 'hub-tagline' }, 'Bedside clinical tools — installable & offline'),
  ]);
  root.append(head);

  WARDS.forEach((w) => {
    const section = h('section', { class: 'ward' });
    section.append(h('div', { class: 'ward-title' }, [h('span', { class: 'w-ico' }, w.icon), w.name]));
    const grid = h('div', { class: 'tool-grid' });
    w.tools.forEach((t) => {
      grid.append(
        h('a', { class: 'tool-card', href: toolHref(t.path) }, [
          h('span', { class: 't-ico' }, t.icon),
          h('span', {}, [h('div', { class: 't-name' }, t.name), h('div', { class: 't-desc' }, t.desc)]),
          h('span', { class: 't-go' }, '›'),
        ]),
      );
    });
    section.append(grid);
    root.append(section);
  });

  const termsLink = h('button', { class: 'foot-link', type: 'button' }, 'ข้อกำหนดการใช้งาน & เครดิต');
  termsLink.addEventListener('click', openTerms);
  root.append(
    h('footer', { class: 'hub-foot' }, [
      h('span', { class: 'pill' }, [h('span', { class: 'dot' }), 'Works offline · auto-updates']),
      termsLink,
      h('div', {}, [
        document.createTextNode('จัดทำโดย นศพ. ภูริพัฒณ์ มหาพรหมรักษ์ (Ung MDKKU50) · build '),
        h('code', {}, BUILD.slice(0, 7)),
      ]),
    ]),
  );
  root.setAttribute('aria-busy', 'false');
}

render();

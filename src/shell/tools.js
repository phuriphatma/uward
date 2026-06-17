// Single source of truth for the tool catalogue. The hub launcher and the
// in-tool "Switch tool" sheet are both built from this. Add a tool here and in
// vite.config.js `pages`, then create tools/<id>/index.html.
//
// `path` is relative to the deploy base (import.meta.env.BASE_URL), so links
// work both in dev ("/") and on GitHub Pages ("/uward/").

export const WARDS = [
  {
    id: 'obgyn',
    name: 'OB-GYN',
    icon: '🤰',
    tools: [
      { id: 'ga', name: 'GA Calculator', desc: 'Gestational age & due date', icon: '📅', path: 'tools/ga/' },
    ],
  },
  {
    id: 'peds',
    name: 'Pediatrics',
    icon: '🧒',
    tools: [
      { id: 'bili', name: 'Bilirubin (AAP 2022)', desc: 'Phototherapy thresholds + weight delta', icon: '🩸', path: 'tools/bili/' },
      { id: 'avg', name: 'Average Calculator', desc: 'Quick averages with history', icon: '🧮', path: 'tools/avg/' },
      { id: 'growth', name: 'Growth Chart', desc: 'Plot weight / height / HC', icon: '📈', path: 'tools/growth/' },
    ],
  },
  {
    id: 'ward',
    name: 'Ward Management',
    icon: '🏥',
    tools: [
      { id: 'ward', name: 'Ward Manager', desc: 'Wards, beds, notes & I/O', icon: '🛏️', path: 'tools/ward/' },
    ],
  },
];

export const ALL_TOOLS = WARDS.flatMap((w) =>
  w.tools.map((t) => ({ ...t, wardId: w.id, wardName: w.name, wardIcon: w.icon })),
);

/** Absolute href for a tool given its `path`. */
export function toolHref(path) {
  return import.meta.env.BASE_URL + path;
}

/** href back to the hub home. */
export function hubHref() {
  return import.meta.env.BASE_URL;
}

/** Best-effort detection of which tool the current page is, by URL. */
export function currentToolId() {
  const path = location.pathname.replace(/index\.html$/, '');
  const hit = ALL_TOOLS.find((t) => {
    const full = (import.meta.env.BASE_URL + t.path).replace(/index\.html$/, '');
    return path === full || path === full.replace(/\/$/, '');
  });
  return hit ? hit.id : null;
}

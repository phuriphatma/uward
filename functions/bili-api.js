// Cloudflare Pages Function — same-origin CORS proxy for the PediTools AAP 2022
// bilirubin API. PediTools sends no Access-Control-Allow-Origin header, so the
// browser can't fetch it directly; this endpoint fetches it server-side and
// returns it with CORS so the bili tool can auto-verify its local calculation.
//
// Route: /bili-api?ga=..&age=..&risk=none|any|both[&bili=..]
// (Only available on Cloudflare Pages. On GitHub Pages this path 404s and the
//  tool degrades to local-only — see scheduleApiVerify in tools/bili/app.js.)
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const out = new URLSearchParams();
  for (const k of ['ga', 'age', 'risk', 'bili', 'tcb', 'tcbage']) {
    const v = url.searchParams.get(k);
    if (v != null && v !== '') out.set(k, v);
  }
  const target = 'https://peditools.org/bili2022/api/?' + out.toString();
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
  };
  if (context.request.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const r = await fetch(target, { cf: { cacheTtl: 86400, cacheEverything: true } });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { ...cors, 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=86400' },
    });
  } catch (e) {
    return new Response('PediTools proxy error', { status: 502, headers: cors });
  }
}

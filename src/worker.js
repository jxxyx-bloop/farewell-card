const CACHE_TTL = 30; // seconds — all edge visitors at the same PoP share this snapshot

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/notes') {
      if (request.method === 'GET')     return handleGet(env, ctx);
      if (request.method === 'PUT')     return handlePut(request, env, ctx);
      if (request.method === 'OPTIONS') return optionsResponse();
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Everything else → serve static assets from public/
    const asset = await env.ASSETS.fetch(request);
    return withSecurityHeaders(asset);
  }
};

// ─── GET /api/notes ───────────────────────────────────────────────────────────
// Serves the cached snapshot if fresh; otherwise fetches from JSONBin and caches.
// All users hitting the same Cloudflare edge node share one cached response.

async function handleGet(env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.internal/notes/${env.JSONBIN_BIN_ID}`);

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const upstream = await fetch(
    `https://api.jsonbin.io/v3/b/${env.JSONBIN_BIN_ID}/latest`,
    { headers: { 'X-Access-Key': env.JSONBIN_API_KEY } }
  );

  const body = await upstream.text();

  if (!upstream.ok) {
    return new Response(body, { status: upstream.status, headers: jsonCt() });
  }

  const response = new Response(body, {
    headers: { ...jsonCt(), 'Cache-Control': `public, max-age=${CACHE_TTL}` }
  });

  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// ─── PUT /api/notes ───────────────────────────────────────────────────────────
// Writes directly to JSONBin (bypasses cache), then invalidates the GET cache
// so the next read returns the fresh state.

async function handlePut(request, env, ctx) {
  const body = await request.text();

  const upstream = await fetch(
    `https://api.jsonbin.io/v3/b/${env.JSONBIN_BIN_ID}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': env.JSONBIN_API_KEY },
      body,
    }
  );

  const cache = caches.default;
  const cacheKey = new Request(`https://cache.internal/notes/${env.JSONBIN_BIN_ID}`);
  ctx.waitUntil(cache.delete(cacheKey));

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: jsonCt(),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonCt() {
  return { 'Content-Type': 'application/json' };
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// Attach security headers to static asset responses.
// connect-src no longer needs api.jsonbin.io — the browser never calls it directly.
function withSecurityHeaders(response) {
  const h = new Headers(response.headers);
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()');
  h.set('Content-Security-Policy',
    "default-src 'none'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self'; " +        // api.jsonbin.io removed — Worker proxies it now
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  return new Response(response.body, { status: response.status, headers: h });
}

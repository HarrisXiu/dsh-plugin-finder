/** Same-origin UI API: background discovery avoids long-running browser requests. */
function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(body));
}
function trusted(request, trustedHosts = []) {
  const host = request.headers.host;
  if (host !== undefined) {
    const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(name) && !trustedHosts.includes(host)) return false;
  }
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  if (request.headers.origin !== undefined) {
    try { return new URL(request.headers.origin).host === host; } catch { return false; }
  }
  return true;
}
export function mountFinderRoutes(host, engine) {
  const controller = new AbortController();
  const start = force => {
    if (engine.pending) return;
    engine.refresh({ force, signal: controller.signal }).catch(() => {});
  };
  const snapshot = () => {
    const index = engine.reindex();
    return {
      schema: 3, mode: 'github-topic:dsh-plugin', running: Boolean(engine.pending), progress: engine.progress,
      generatedAt: index?.generatedAt ?? '', scan: { complete: index?.scan?.complete ?? false, total: index?.scan?.total ?? null,
        sources: index?.scan?.sources ?? [] }, errors: index?.errors ?? [],
      candidates: index?.candidates ?? [], categories: index?.categories ?? {},
    };
  };
  const routes = [
    { kind: 'exact', path: '/plugin-finder/index', handler: async (request, response) => {
      if (!trusted(request, host.get?.('connection')?.trustedHosts)) return send(response, 403, { error: 'untrusted origin' });
      if (request.method !== 'GET') return send(response, 405, { error: 'GET required' });
      // Loading the page does not cause a request to external services. The UI
      // explicitly starts/resumes a scan via POST, then polls these local snapshots.
      if (!engine.index && !engine.pending) await engine.adoptCache({ stale: true });
      send(response, 200, snapshot());
    } },
    { kind: 'exact', path: '/plugin-finder/refresh', handler: async (request, response) => {
      if (!trusted(request, host.get?.('connection')?.trustedHosts)) return send(response, 403, { error: 'untrusted origin' });
      if (request.method !== 'POST') return send(response, 405, { error: 'POST required' });
      start(true);
      send(response, 202, snapshot());
    } },
  ];
  const disposers = routes.map(route => host.webServer.register(route));
  return () => { controller.abort(); for (const dispose of disposers) dispose(); };
}

/**
 * Minimal JSON-over-HTTP helper for the Plugin Finder.
 *
 * No dependencies: the bundle must load inside the DSH Host process, where only
 * platform modules are available. Every call is bounded by a timeout, an
 * optional caller signal, and a single retry for transient failures, because
 * GitHub's unauthenticated budget is small and a hung socket would otherwise
 * stall the whole suggestion refresh.
 *
 * @module dsh-plugin-finder/core/http
 */

/** Default user agent: GitHub rejects requests without one. */
export const USER_AGENT = 'dsh-plugin-finder (+https://github.com/; DeepSeek Harness plugin)';

/** Transient HTTP statuses worth one retry. */
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * One JSON request with a bounded deadline.
 * @param {string} url - absolute http(s) URL.
 * @param {object} [options] - request options.
 * @param {Record<string,string>} [options.headers] - extra request headers.
 * @param {number} [options.timeoutMs] - per-attempt deadline, default 15000.
 * @param {number} [options.retries] - extra attempts for transient failures, default 1.
 * @param {AbortSignal} [options.signal] - caller cancellation.
 * @returns {Promise<{ok: boolean, status: number, data: any, error?: string, rateLimit?: object}>}
 *   Never throws for network or HTTP failure; callers classify from `ok`/`error`.
 */
export async function getJson(url, options = {}) {
  const { headers = {}, timeoutMs = 15000, retries = 1, signal } = options;
  let last = { ok: false, status: 0, data: null, error: 'not attempted' };
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) return { ok: false, status: 0, data: null, error: 'aborted' };
    const timer = new AbortController();
    const deadline = setTimeout(() => timer.abort(new Error('timeout')), timeoutMs);
    const onAbort = () => timer.abort(new Error('aborted'));
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: 'application/json', ...headers },
        signal: timer.signal,
        redirect: 'follow',
      });
      const rateLimit = readRateLimit(response.headers);
      const text = await response.text();
      if (!response.ok) {
        last = {
          ok: false,
          status: response.status,
          data: null,
          error: `HTTP ${response.status}${describeBody(text)}`,
          rateLimit,
        };
        if (!RETRY_STATUS.has(response.status) || attempt === retries) return last;
      } else {
        try {
          return { ok: true, status: response.status, data: text ? JSON.parse(text) : null, rateLimit };
        } catch {
          return { ok: false, status: response.status, data: null, error: 'invalid JSON response', rateLimit };
        }
      }
    } catch (error) {
      const aborted = signal?.aborted === true;
      last = {
        ok: false,
        status: 0,
        data: null,
        error: aborted ? 'aborted' : `network: ${error?.cause?.message ?? error?.message ?? String(error)}`,
      };
      if (aborted) return last;
    } finally {
      clearTimeout(deadline);
      signal?.removeEventListener('abort', onAbort);
    }
    // Space out the single retry so a rate-limit response has a chance to reset.
    await sleep(900);
  }
  return last;
}

/** Read the GitHub rate-limit headers when present, so callers can report exhaustion honestly. */
function readRateLimit(headers) {
  const remaining = headers.get('x-ratelimit-remaining');
  if (remaining === null) return undefined;
  const reset = Number(headers.get('x-ratelimit-reset'));
  return {
    remaining: Number(remaining),
    limit: Number(headers.get('x-ratelimit-limit') ?? 0),
    resetAt: Number.isFinite(reset) ? new Date(reset * 1000).toISOString() : undefined,
  };
}

/** A short, single-line excerpt of a failure body, for diagnostics. */
function describeBody(text) {
  const message = text?.match(/"message"\s*:\s*"([^"]{1,200})"/)?.[1];
  return message ? `: ${message}` : '';
}

/**
 * Await a delay.
 * @param {number} ms - milliseconds.
 * @returns {Promise<void>} resolves after the delay.
 */
export function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, Math.max(0, ms)); });
}

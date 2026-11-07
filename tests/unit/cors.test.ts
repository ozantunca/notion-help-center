import type { NextApiRequest, NextApiResponse } from 'next';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** The allowlist is read once at import, so each case loads a fresh module. */
async function headersFor(allowlist: string | undefined, origin?: string) {
  vi.resetModules();
  if (allowlist === undefined) vi.stubEnv('PUBLIC_API_CORS_ORIGIN', '');
  else vi.stubEnv('PUBLIC_API_CORS_ORIGIN', allowlist);
  const { setCorsHeaders } = await import('../../lib/cors');
  const headers: Record<string, string> = {};
  const res = { setHeader: (k: string, v: string) => (headers[k] = v) } as unknown as NextApiResponse;
  setCorsHeaders({ headers: origin ? { origin } : {} } as NextApiRequest, res);
  return headers;
}

afterEach(() => vi.unstubAllEnvs());

describe('setCorsHeaders', () => {
  it('sets nothing when no origin is allowed', async () => {
    expect(await headersFor(undefined, 'https://a.example')).toEqual({});
  });

  it('allows any origin with *', async () => {
    const h = await headersFor('*', 'https://a.example');
    expect(h['Access-Control-Allow-Origin']).toBe('*');
  });

  it('echoes an origin on the list and varies on Origin', async () => {
    const h = await headersFor('https://a.example, https://b.example', 'https://b.example');
    expect(h['Access-Control-Allow-Origin']).toBe('https://b.example');
    expect(h.Vary).toBe('Origin');
  });

  it('sets nothing for an origin that is not on the list', async () => {
    expect(await headersFor('https://a.example', 'https://evil.example')).toEqual({});
  });
});

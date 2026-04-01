/**
 * HTTP Basic auth for `/admin` and `/api/admin/*`.
 * Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment.
 */

export function getAdminCredentials(): { user: string; pass: string } | null {
  const user = process.env.ADMIN_USERNAME?.trim();
  if (!user) return null;
  const pass = process.env.ADMIN_PASSWORD;
  if (pass === undefined || pass === '') return null;
  return { user, pass };
}

/** Decode `Authorization: Basic ...` payload (Edge-safe, no Buffer). */
function decodeBasicPayload(authorization: string): string | null {
  const b64 = authorization.slice(6).trim();
  try {
    return atob(b64);
  } catch {
    return null;
  }
}

export function verifyBasicAuthHeader(
  authorization: string | null | undefined,
): boolean {
  const creds = getAdminCredentials();
  if (!creds) return false;
  if (!authorization?.startsWith('Basic ')) return false;
  const decoded = decodeBasicPayload(authorization);
  if (decoded === null) return false;
  const colon = decoded.indexOf(':');
  const user = colon >= 0 ? decoded.slice(0, colon) : '';
  const pass = colon >= 0 ? decoded.slice(colon + 1) : '';
  return user === creds.user && pass === creds.pass;
}

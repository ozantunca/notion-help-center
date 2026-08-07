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

/**
 * Guard for state-changing admin requests.
 *
 * Browsers replay cached HTTP Basic credentials automatically, so a cross-origin
 * `<form method="post">` targeting an admin route would otherwise arrive
 * authenticated. A plain form can only send `application/x-www-form-urlencoded`,
 * `multipart/form-data`, or `text/plain` — all of which Next's body parser
 * happily turns into an object — but it cannot send `application/json` without
 * triggering a CORS preflight that we never approve. Requiring JSON therefore
 * blocks the form-based CSRF path.
 */
export function hasJsonContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  return contentType.split(';')[0].trim().toLowerCase() === 'application/json';
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

/**
 * Compare two strings without an early exit, so the time taken does not reveal
 * how many leading characters were correct. `crypto.timingSafeEqual` is not
 * available in the Edge runtime this also runs in (middleware), hence the
 * hand-rolled loop.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) {
    // charCodeAt past the end is NaN; `| 0` normalises it to 0.
    diff |= ((a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0));
  }
  return diff === 0;
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
  // Bitwise AND, not `&&`: both comparisons always run.
  const userOk = timingSafeStringEqual(user, creds.user);
  const passOk = timingSafeStringEqual(pass, creds.pass);
  return userOk && passOk;
}

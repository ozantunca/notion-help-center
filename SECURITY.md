# Security Policy

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.

- Use [GitHub private vulnerability reporting](https://github.com/ozantunca/notion-help-center/security/advisories/new), or
- Email the maintainer listed in the repository profile.

Please include reproduction steps and the affected version or commit. Expect an
initial response within a few working days.

## Supported versions

This project is developed on the default branch. Fixes land there; there is no
long-term support branch for older releases.

## Threat model

This is a **self-hosted** application. Each deployment controls its own
infrastructure, secrets, and Notion workspace. The relevant trust boundaries are:

| Actor | Trust | Notes |
| --- | --- | --- |
| Anonymous visitor | Untrusted | Reads published content, posts article feedback |
| Notion workspace editor | Semi-trusted | Article content and images are synced and rendered |
| `/admin` operator | Trusted | Edits branding, uploads logos, holds the Basic auth password |
| Deployment operator | Fully trusted | Controls environment variables and volumes |

Notion content is treated as **semi-trusted input**: an editor can already
publish arbitrary text, but must not be able to break out into script execution
or reach the host filesystem or internal network.

## Operator checklist

Before exposing a deployment to the internet:

- [ ] **Serve over HTTPS.** `/admin` uses HTTP Basic auth, which sends
      credentials Base64-encoded on every request. Without TLS they are
      effectively in cleartext.
- [ ] **Set a strong `ADMIN_PASSWORD`.** If `ADMIN_USERNAME` / `ADMIN_PASSWORD`
      are unset, `/admin` and `/api/admin/*` return `503` and are unusable —
      that is the safe default. Do not set weak credentials just to enable it.
- [ ] **Keep `NOTION_API_KEY` out of version control.** `.env` and `.env*.local`
      are gitignored. Supply secrets via the environment or your platform's
      secret store.
- [ ] **Scope the Notion integration** to only the help-center database. The
      token has whatever access you grant it in the Notion UI.
- [ ] **Set `PUBLIC_API_CORS_ORIGIN` to explicit origins.** `*` allows any site
      to read `/api/v1/*`. Content served there is already public, but an
      allowlist keeps the surface predictable.
- [ ] **Put a rate limiter in front of the app** if it is publicly reachable.
      `/api/feedback` has a small in-process throttle, which does not hold
      across multiple instances.
- [ ] **Mount dedicated volumes** for `/app/data` and `/app/media`. Never mount
      the repository over `/app/public` (see [docs/DOCKER.md](./docs/DOCKER.md)).
- [ ] **Back up `data/help-center.db`.** It holds synced content, site config,
      and collected feedback.

## Controls in this codebase

Where the code defends the boundaries above:

- **Admin authentication** — `lib/admin-auth.ts`. Enforced in `middleware.ts`
  for `/admin` and `/api/admin/*`, and re-checked inside each admin API route so
  a middleware matcher change cannot silently expose them. Credentials are
  compared in constant time.
- **Theme CSS injection** — `lib/site-config.ts`. Theme values are rendered into
  an inline `<style>` tag, so they are restricted to a conservative character
  set, with `url(` and `expression(` rejected. Values are re-validated at
  render time, not only at save time.
- **Link schemes** — `lib/site-config.ts` (`sanitizeUrl`). Nav links, `logoUrl`,
  and `mainSiteUrl` accept only `http:`, `https:`, `mailto:`, `tel:`, or a
  root-relative path. This blocks `javascript:` and `data:` URLs.
- **Markdown rendering** — `react-markdown` is used **without** `rehype-raw`, so
  raw HTML in Notion content is escaped rather than parsed. Do not add
  `rehype-raw` without also adding sanitization (`rehype-sanitize`).
- **Uploaded and synced media** — `pages/api/media/[[...path]].ts`. Path
  segments are validated and the resolved path is confirmed to stay inside the
  media directory. Responses carry `X-Content-Type-Options: nosniff` and a
  `sandbox` CSP so an uploaded SVG cannot execute script in this origin while
  still rendering via `<img>`.
- **Server-side downloads** — `lib/media.ts`. URLs come from Notion content and
  the admin logo field, so downloads enforce `http(s)` on every redirect hop,
  cap redirects, bound the response size, and apply a request timeout.
  Filenames are reduced to a single safe path segment.
- **SQL** — all queries in `lib/db.ts`, `lib/help-data.ts`, and
  `pages/api/feedback.ts` use `better-sqlite3` prepared statements with bound
  parameters. No string-concatenated SQL.
- **Feedback endpoint** — `pages/api/feedback.ts` is unauthenticated by design;
  input lengths are bounded and a per-IP throttle limits write volume.

### Known accepted risks

- **`/admin` uses HTTP Basic auth** with no lockout or MFA. It is intended for a
  single operator behind TLS, ideally with an additional network restriction
  (VPN, IP allowlist, or proxy auth). It is not a multi-user admin system.
- **SVG logo uploads are permitted.** They are neutralized by the media CSP
  above. If you do not need SVG, remove `image/svg+xml` from `MIME_TO_EXT` in
  `lib/admin-logo-upload.ts`.
- **No `Content-Security-Policy` on HTML pages.** The pages router emits inline
  bootstrap scripts, so a useful policy needs per-deployment nonces. Baseline
  headers are set in `next.config.js`; add a CSP at your proxy if you can supply
  nonces. A starting point:

  ```
  default-src 'self';
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'nonce-<per-request>';
  frame-ancestors 'self';
  base-uri 'self';
  object-src 'none'
  ```

  Add `https://client.crisp.chat` to `script-src`/`connect-src` if you enable
  Crisp, and `https://formspree.io` to `form-action` if you enable Formspree.

## Dependencies

Run `pnpm audit` before releases. The app pins **`next@^15.5.25`** (or newer
15.5.x) so published fixes for Server Actions, RSC deserialization, middleware,
and image optimization apply. Direct and transitive dependency versions are also
nudged via `pnpm.overrides` in `package.json` where upstream packages lag.

### Server Actions

This project uses the **Pages Router** only (`pages/`). There are no
`"use server"` modules and no App Router `app/` tree, so application code does
not define Server Actions. The framework may still expose Server Action
endpoints internally; keeping Next.js on a patched 15.5.x release is the
primary mitigation. If Server Actions are added later, follow Next.js guidance:
authenticate inside each action, validate input, set
`serverActions.allowedOrigins` in `next.config.js`, and avoid forwarding
user-controlled URLs from actions.

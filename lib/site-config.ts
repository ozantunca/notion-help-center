export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface SiteTheme {
  primaryColor: string;
  primaryHoverColor: string;
  heroGradientFrom: string;
  heroGradientVia: string;
  heroGradientTo: string;
}

export interface SiteConfig {
  brandName: string;
  logoUrl?: string;
  logoAlt: string;
  mainSiteUrl: string;
  supportEmail: string;
  headerLinks: NavLink[];
  footerLinks: NavLink[];
  theme: SiteTheme;
  /** Appended to page titles, e.g. "Article title - {seoTitleSuffix}" */
  seoTitleSuffix: string;
  seoDefaultDescription: string;
}

export const defaultSiteConfig: SiteConfig = {
  brandName: 'Notion Help Center',
  logoAlt: 'Notion Help Center',
  mainSiteUrl: 'https://example.com',
  supportEmail: 'support@example.com',
  headerLinks: [
    { label: 'Home', href: 'https://example.com', external: true },
    { label: 'Contact', href: '/contact', external: false },
  ],
  footerLinks: [
    { label: 'Home', href: 'https://example.com', external: true },
    { label: 'Contact', href: '/contact', external: false },
  ],
  theme: {
    primaryColor: '#4f46e5',
    primaryHoverColor: '#4338ca',
    heroGradientFrom: '#4f46e5',
    heroGradientVia: '#6366f1',
    heroGradientTo: '#818cf8',
  },
  seoTitleSuffix: 'Notion Help Center',
  seoDefaultDescription: 'Self-hosted documentation synced from Notion.',
};

/**
 * Values below land in an inline `<style>` (see {@link siteThemeToRootCss}) and in
 * `style.setProperty`. Anything outside this set could close the `<style>` element
 * (`</style><script>`), pull a remote resource (`url(...)`, `@import`), or inject
 * extra declarations, so unrecognised input falls back to the default token.
 *
 * Deliberately permissive enough for the values the admin UI offers: hex, `rgb()`,
 * `hsl()`, colour keywords, and `linear-gradient(...)`.
 */
const CSS_VALUE_ALLOWED = /^[A-Za-z0-9\s#(),.%_-]+$/;
const CSS_VALUE_MAX_LENGTH = 200;

export function isSafeCssValue(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > CSS_VALUE_MAX_LENGTH) return false;
  if (!CSS_VALUE_ALLOWED.test(v)) return false;
  // `url(` and `@` never appear in a colour/gradient we generate, but both are
  // exfiltration primitives inside a stylesheet.
  if (/url\s*\(/i.test(v)) return false;
  if (/expression\s*\(/i.test(v)) return false;
  return true;
}

/**
 * Schemes allowed for navigation links, logos, and the main-site URL.
 * Blocks `javascript:` / `data:` / `vbscript:`, which would otherwise turn an
 * admin-editable field into stored XSS for every visitor.
 */
const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function sanitizeUrl(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  // Root-relative paths stay in-app. `//host` is protocol-relative, not a path.
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  if (v.startsWith('#')) return v;
  try {
    const { protocol } = new URL(v);
    return SAFE_URL_SCHEMES.has(protocol.toLowerCase()) ? v : undefined;
  } catch {
    return undefined;
  }
}

function normalizeLinks(value: unknown, fallback: NavLink[]): NavLink[] {
  if (!Array.isArray(value)) return fallback;
  const links = value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      const href = typeof item.href === 'string' ? sanitizeUrl(item.href) ?? '' : '';
      const external = typeof item.external === 'boolean' ? item.external : undefined;
      return { label, href, external };
    })
    .filter((item) => item.label && item.href);

  return links.length > 0 ? links : fallback;
}

function normalizeTheme(raw: unknown): SiteTheme {
  const base = defaultSiteConfig.theme;
  if (!raw || typeof raw !== 'object') return base;
  const t = raw as Record<string, unknown>;
  const pick = (value: unknown, fallback: string): string =>
    typeof value === 'string' && isSafeCssValue(value) ? value.trim() : fallback;
  return {
    primaryColor: pick(t.primaryColor, base.primaryColor),
    primaryHoverColor: pick(t.primaryHoverColor, base.primaryHoverColor),
    heroGradientFrom: pick(t.heroGradientFrom, base.heroGradientFrom),
    heroGradientVia: pick(t.heroGradientVia, base.heroGradientVia),
    heroGradientTo: pick(t.heroGradientTo, base.heroGradientTo),
  };
}

export function normalizeSiteConfig(raw: unknown): SiteConfig {
  const input =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const brandName =
    typeof input.brandName === 'string' && input.brandName.trim()
      ? input.brandName.trim()
      : defaultSiteConfig.brandName;
  const logoUrl =
    typeof input.logoUrl === 'string' ? sanitizeUrl(input.logoUrl) : undefined;
  const logoAlt =
    typeof input.logoAlt === 'string' && input.logoAlt.trim()
      ? input.logoAlt.trim()
      : defaultSiteConfig.logoAlt;
  const mainSiteUrl =
    (typeof input.mainSiteUrl === 'string' ? sanitizeUrl(input.mainSiteUrl) : undefined) ??
    defaultSiteConfig.mainSiteUrl;
  const supportEmail =
    typeof input.supportEmail === 'string' && input.supportEmail.trim()
      ? input.supportEmail.trim()
      : defaultSiteConfig.supportEmail;
  const seoTitleSuffix =
    typeof input.seoTitleSuffix === 'string' && input.seoTitleSuffix.trim()
      ? input.seoTitleSuffix.trim()
      : defaultSiteConfig.seoTitleSuffix;
  const seoDefaultDescription =
    typeof input.seoDefaultDescription === 'string' && input.seoDefaultDescription.trim()
      ? input.seoDefaultDescription.trim()
      : defaultSiteConfig.seoDefaultDescription;

  return {
    brandName,
    ...(logoUrl ? { logoUrl } : {}),
    logoAlt,
    mainSiteUrl,
    supportEmail,
    headerLinks: normalizeLinks(input.headerLinks, defaultSiteConfig.headerLinks),
    footerLinks: normalizeLinks(input.footerLinks, defaultSiteConfig.footerLinks),
    theme: normalizeTheme(input.theme),
    seoTitleSuffix,
    seoDefaultDescription,
  };
}

/**
 * CSS for `:root` variables (SSR-safe; use in a `<style>` tag).
 *
 * Values are re-checked here rather than trusting the caller: this string is
 * interpolated into markup verbatim, so it is the last line of defence against a
 * theme value that never went through {@link normalizeSiteConfig}.
 */
export function siteThemeToRootCss(theme: SiteTheme): string {
  const base = defaultSiteConfig.theme;
  const safe = (value: string, fallback: string): string =>
    typeof value === 'string' && isSafeCssValue(value) ? value.trim() : fallback;
  return `:root{--color-primary:${safe(theme.primaryColor, base.primaryColor)};--color-primary-hover:${safe(theme.primaryHoverColor, base.primaryHoverColor)};--hero-gradient-from:${safe(theme.heroGradientFrom, base.heroGradientFrom)};--hero-gradient-via:${safe(theme.heroGradientVia, base.heroGradientVia)};--hero-gradient-to:${safe(theme.heroGradientTo, base.heroGradientTo)};}`;
}

/** Apply theme CSS variables on document root (client-only). */
export function applyThemeToDocument(theme: SiteTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-primary-hover', theme.primaryHoverColor);
  root.style.setProperty('--hero-gradient-from', theme.heroGradientFrom);
  root.style.setProperty('--hero-gradient-via', theme.heroGradientVia);
  root.style.setProperty('--hero-gradient-to', theme.heroGradientTo);
}

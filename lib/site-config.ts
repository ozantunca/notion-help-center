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

function normalizeLinks(value: unknown, fallback: NavLink[]): NavLink[] {
  if (!Array.isArray(value)) return fallback;
  const links = value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      const href = typeof item.href === 'string' ? item.href.trim() : '';
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
  return {
    primaryColor:
      typeof t.primaryColor === 'string' && t.primaryColor.trim()
        ? t.primaryColor.trim()
        : base.primaryColor,
    primaryHoverColor:
      typeof t.primaryHoverColor === 'string' && t.primaryHoverColor.trim()
        ? t.primaryHoverColor.trim()
        : base.primaryHoverColor,
    heroGradientFrom:
      typeof t.heroGradientFrom === 'string' && t.heroGradientFrom.trim()
        ? t.heroGradientFrom.trim()
        : base.heroGradientFrom,
    heroGradientVia:
      typeof t.heroGradientVia === 'string' && t.heroGradientVia.trim()
        ? t.heroGradientVia.trim()
        : base.heroGradientVia,
    heroGradientTo:
      typeof t.heroGradientTo === 'string' && t.heroGradientTo.trim()
        ? t.heroGradientTo.trim()
        : base.heroGradientTo,
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
    typeof input.logoUrl === 'string' && input.logoUrl.trim()
      ? input.logoUrl.trim()
      : undefined;
  const logoAlt =
    typeof input.logoAlt === 'string' && input.logoAlt.trim()
      ? input.logoAlt.trim()
      : defaultSiteConfig.logoAlt;
  const mainSiteUrl =
    typeof input.mainSiteUrl === 'string' && input.mainSiteUrl.trim()
      ? input.mainSiteUrl.trim()
      : defaultSiteConfig.mainSiteUrl;
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

/** CSS for `:root` variables (SSR-safe; use in a `<style>` tag). */
export function siteThemeToRootCss(theme: SiteTheme): string {
  return `:root{--color-primary:${theme.primaryColor};--color-primary-hover:${theme.primaryHoverColor};--hero-gradient-from:${theme.heroGradientFrom};--hero-gradient-via:${theme.heroGradientVia};--hero-gradient-to:${theme.heroGradientTo};}`;
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

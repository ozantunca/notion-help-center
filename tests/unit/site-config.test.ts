import { describe, expect, it } from 'vitest';
import {
  defaultSiteConfig,
  isSafeCssValue,
  normalizeSiteConfig,
  sanitizeUrl,
  siteThemeToRootCss,
} from '../../lib/site-config';

describe('isSafeCssValue', () => {
  it.each(['#4f46e5', 'rgb(79, 70, 229)', 'hsl(240 50% 50%)', 'rebeccapurple', 'linear-gradient(90deg, #fff, #000)'])(
    'accepts %s',
    (value) => expect(isSafeCssValue(value)).toBe(true),
  );

  it.each([
    '',
    'red;}</style><script>alert(1)</script>',
    'red; background: blue',
    'url(https://evil.example/x.png)',
    'expression(alert(1))',
    '@import',
    'a'.repeat(201),
  ])('rejects %j', (value) => expect(isSafeCssValue(value)).toBe(false));
});

describe('sanitizeUrl', () => {
  it.each(['https://example.com', 'http://example.com/a', 'mailto:a@b.c', 'tel:+3100000', '/contact', '#top'])(
    'keeps %s',
    (value) => expect(sanitizeUrl(value)).toBe(value),
  );

  it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', 'vbscript:x', '//evil.example', 'not a url', '  '])(
    'drops %j',
    (value) => expect(sanitizeUrl(value)).toBeUndefined(),
  );
});

describe('normalizeSiteConfig', () => {
  it('returns the defaults for empty or invalid input', () => {
    expect(normalizeSiteConfig(undefined)).toEqual(defaultSiteConfig);
    expect(normalizeSiteConfig('nope')).toEqual(defaultSiteConfig);
    expect(normalizeSiteConfig({})).toEqual(defaultSiteConfig);
  });

  it('trims text fields and falls back when they are blank', () => {
    const config = normalizeSiteConfig({ brandName: '  Acme  ', seoTitleSuffix: '   ' });
    expect(config.brandName).toBe('Acme');
    expect(config.seoTitleSuffix).toBe(defaultSiteConfig.seoTitleSuffix);
  });

  it('drops unsafe logo and nav URLs', () => {
    const config = normalizeSiteConfig({
      logoUrl: 'javascript:alert(1)',
      headerLinks: [
        { label: 'Bad', href: 'javascript:alert(1)' },
        { label: 'Docs', href: '/docs', external: false },
        { label: '', href: '/no-label' },
      ],
    });
    expect(config.logoUrl).toBeUndefined();
    expect(config.headerLinks).toEqual([{ label: 'Docs', href: '/docs', external: false }]);
  });

  it('uses the default links when no link is valid', () => {
    const config = normalizeSiteConfig({ footerLinks: [{ label: 'x', href: 'data:x' }] });
    expect(config.footerLinks).toEqual(defaultSiteConfig.footerLinks);
  });

  it('replaces only the unsafe theme values', () => {
    const { theme } = normalizeSiteConfig({
      theme: { primaryColor: '#ff0000', primaryHoverColor: 'red;}</style>' },
    });
    expect(theme.primaryColor).toBe('#ff0000');
    expect(theme.primaryHoverColor).toBe(defaultSiteConfig.theme.primaryHoverColor);
  });
});

describe('siteThemeToRootCss', () => {
  it('writes every theme variable', () => {
    const css = siteThemeToRootCss(defaultSiteConfig.theme);
    expect(css).toBe(
      ':root{--color-primary:#4f46e5;--color-primary-hover:#4338ca;--hero-gradient-from:#4f46e5;--hero-gradient-via:#6366f1;--hero-gradient-to:#818cf8;}',
    );
  });

  it('never lets a value close the style element', () => {
    const css = siteThemeToRootCss({
      ...defaultSiteConfig.theme,
      primaryColor: 'red}</style><script>alert(1)</script>',
    });
    expect(css).not.toContain('</style>');
    expect(css).toContain('--color-primary:#4f46e5;');
  });
});

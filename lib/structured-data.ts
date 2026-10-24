import type { SiteConfig } from './site-config';

export interface ArticleSeo {
  /** Absolute URL of the article page. */
  canonicalUrl: string;
  /** Absolute URL of the first image in the article, or of the site logo. */
  imageUrl: string | null;
  /** JSON-LD for the page, already serialised and safe to put inside `<script>`. */
  jsonLd: string;
}

const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/;

function toAbsolute(url: string | undefined, origin: string): string | null {
  if (!url) return null;
  try {
    const absolute = new URL(url, `${origin}/`);
    return /^https?:$/.test(absolute.protocol) ? absolute.toString() : null;
  } catch {
    return null;
  }
}

/**
 * `JSON.stringify` output can still close the `<script>` element (`</script>`)
 * or start an HTML comment, because titles and descriptions come from Notion.
 */
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Canonical URL, share image and schema.org data (`Article` and
 * `BreadcrumbList`) for an article page. Runs on the server, where the public
 * origin (`HELP_CENTER_URL`) is known.
 */
export function buildArticleSeo(params: {
  origin: string;
  article: { title: string; description: string; url: string; lastUpdated: string; content?: string };
  collection: { title: string; href: string };
  siteConfig: SiteConfig;
}): ArticleSeo {
  const { origin, article, collection, siteConfig } = params;
  const canonicalUrl = toAbsolute(article.url, origin) ?? `${origin}${article.url}`;
  const logoUrl = toAbsolute(siteConfig.logoUrl, origin);
  const contentImage = MARKDOWN_IMAGE_RE.exec(article.content ?? '')?.[1];
  const imageUrl = toAbsolute(contentImage, origin) ?? logoUrl;

  const organization = {
    '@type': 'Organization',
    name: siteConfig.brandName,
    url: toAbsolute(siteConfig.mainSiteUrl, origin) ?? origin,
    ...(logoUrl ? { logo: { '@type': 'ImageObject', url: logoUrl } } : {}),
  };

  const dateModified = Number.isNaN(Date.parse(article.lastUpdated))
    ? undefined
    : new Date(article.lastUpdated).toISOString();

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${canonicalUrl}#article`,
        headline: article.title.slice(0, 110),
        ...(article.description ? { description: article.description } : {}),
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        ...(imageUrl ? { image: [imageUrl] } : {}),
        ...(dateModified ? { dateModified } : {}),
        articleSection: collection.title,
        author: organization,
        publisher: organization,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: collection.title,
            item: toAbsolute(collection.href, origin) ?? `${origin}${collection.href}`,
          },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
        ],
      },
    ],
  };

  return { canonicalUrl, imageUrl, jsonLd: serializeJsonLd(data) };
}

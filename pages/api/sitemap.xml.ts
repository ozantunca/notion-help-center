import { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '../../lib/types';
import { loadHelpMetadata } from '../../lib/help-data';

/** Escape for XML text content. Article URLs come from Notion titles, so they are not trusted markup. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** `lastUpdated` is free-form in Notion; an unparseable value must not throw or emit garbage. */
function toIsoDate(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const helpCenterUrl = (
      process.env.HELP_CENTER_URL || 'http://localhost:3000'
    ).replace(/\/+$/, '');

    const metadata = loadHelpMetadata();
    const articles: Article[] = metadata.articles || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(helpCenterUrl)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${articles
    .map((article) => {
      const lastmod = toIsoDate(article.lastUpdated);
      return `  <url>
    <loc>${escapeXml(`${helpCenterUrl}${article.url}`)}</loc>${
      lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
    }
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).end('Internal server error');
  }
}

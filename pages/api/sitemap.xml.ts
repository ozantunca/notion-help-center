import { NextApiRequest, NextApiResponse } from 'next';
import { Article } from '../../lib/types';
import { loadHelpMetadata } from '../../lib/help-data';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const helpCenterUrl =
      process.env.HELP_CENTER_URL || 'http://localhost:3000';

    const metadata = loadHelpMetadata();
    const articles: Article[] = metadata.articles || [];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${helpCenterUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${articles
    .map(
      (article) => `  <url>
    <loc>${helpCenterUrl}${article.url}</loc>
    <lastmod>${new Date(article.lastUpdated).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).end('Internal server error');
  }
}

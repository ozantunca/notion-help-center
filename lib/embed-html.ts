import { createHash } from 'crypto';
import { renderArticleMarkdown } from './markdown';

/**
 * Rendered HTML for the widget, cached by content. The public API serves this on
 * every request and rendering costs CPU, so the same article is rendered once
 * until its text (or the public origin) changes. A sync changes the text, which
 * changes the key; old entries fall out when the cap is reached.
 */
const MAX_ENTRIES = 200;
const cache = new Map<string, string>();

export function renderEmbedHtml(markdown: string, origin: string): string {
  const key = createHash('sha1').update(origin).update('\0').update(markdown).digest('hex');

  const hit = cache.get(key);
  if (hit !== undefined) {
    // Refresh recency: a Map iterates in insertion order.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const { html } = renderArticleMarkdown(markdown, { mode: 'embed', baseUrl: origin });
  cache.set(key, html);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return html;
}

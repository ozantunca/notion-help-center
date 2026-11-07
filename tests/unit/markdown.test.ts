import { describe, expect, it } from 'vitest';
import { renderArticleMarkdown } from '../../lib/markdown';

const render = (md: string) => renderArticleMarkdown(md).html;

describe('renderArticleMarkdown: headings', () => {
  it('adds ids, copy-link anchors and an outline for H2 and H3', () => {
    const { html, toc } = renderArticleMarkdown('## Set up\n\n### Install it\n\n#### Detail');
    expect(html).toContain('<h2 id="set-up">');
    expect(html).toContain('<a href="#set-up" class="heading-anchor"');
    expect(toc).toEqual([
      { id: 'set-up', text: 'Set up', depth: 2 },
      { id: 'install-it', text: 'Install it', depth: 3 },
    ]);
  });

  it('gives repeated headings unique ids', () => {
    const { toc } = renderArticleMarkdown('## Notes\n\n## Notes');
    expect(toc.map((t) => t.id)).toEqual(['notes', 'notes-1']);
  });

  it('demotes every heading one level when the body uses H1', () => {
    const { html } = renderArticleMarkdown('# Top\n\n## Second');
    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2 id="top">');
    expect(html).toContain('<h3 id="second">');
  });

  it('keeps heading levels when the body has no H1', () => {
    expect(render('## Only H2')).toContain('<h2 id="only-h2">');
  });
});

describe('renderArticleMarkdown: Notion blocks', () => {
  it('turns an emoji-led quote into a callout', () => {
    const html = render('> 💡 Sync runs every six hours.');
    expect(html).toContain('<div class="callout">');
    expect(html).toContain('<span class="callout-icon" aria-hidden="true">💡</span>');
    expect(html).toMatch(/<div class="callout-body">\s*<p>Sync runs every six hours\.<\/p>/);
    expect(html).not.toContain('<blockquote');
  });

  it('keeps a plain quote as a blockquote', () => {
    const html = render('> Just a quote');
    expect(html).toContain('<blockquote>');
    expect(html).not.toContain('callout');
  });

  it('parses markdown inside a Notion toggle', () => {
    const html = render('<details>\n<summary>More</summary>\n- **one**\n- two\n</details>');
    expect(html).toContain('<summary>More</summary>');
    expect(html).toContain('<li><strong>one</strong></li>');
  });

  it('wraps tables so they scroll on narrow screens', () => {
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toMatch(/<div class="table-wrap"><table>/);
  });

  it('renders GFM task lists', () => {
    const html = render('- [x] done\n- [ ] todo');
    expect(html).toContain('contains-task-list');
    expect(html).toContain('type="checkbox"');
  });
});

describe('renderArticleMarkdown: links and images', () => {
  it('opens external links in a new tab without an opener', () => {
    const html = render('[site](https://example.com)');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('keeps internal links in the same tab', () => {
    const html = render('[home](/contact)');
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain('target=');
  });

  it('lazy-loads images', () => {
    expect(render('![alt](/media/a.png)')).toContain('loading="lazy"');
  });
});

describe('renderArticleMarkdown: sanitising', () => {
  it('removes script elements', () => {
    const html = render('Hello <script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(1)</script>');
  });

  it('removes event handler attributes', () => {
    expect(render('<img src="/a.png" onerror="alert(1)">')).not.toContain('onerror');
  });

  it('removes javascript: URLs', () => {
    expect(render('[click](javascript:alert(1))')).not.toContain('javascript:');
  });

  it('removes iframes', () => {
    expect(render('<iframe src="https://evil.example"></iframe>')).not.toContain('<iframe');
  });
});

describe('renderArticleMarkdown: embed mode', () => {
  const embed = (md: string) =>
    renderArticleMarkdown(md, { mode: 'embed', baseUrl: 'https://help.example.com/' });

  it('adds no heading ids, anchors or outline', () => {
    const { html, toc } = embed('## Section');
    expect(html).toContain('<h2>Section</h2>');
    expect(html).not.toContain('heading-anchor');
    expect(toc).toEqual([]);
  });

  it('points relative links at the help center', () => {
    expect(embed('[a](/contact)').html).toContain('href="https://help.example.com/contact"');
    expect(embed('[b](guide/start)').html).toContain('href="https://help.example.com/guide/start"');
  });

  it('removes the href of fragment-only links', () => {
    const { html } = embed('[jump](#section)');
    expect(html).toContain('<a>jump</a>');
  });

  it('keeps absolute links as they are', () => {
    expect(embed('[x](https://other.example/a)').html).toContain('href="https://other.example/a"');
  });
});

describe('renderArticleMarkdown: reading time', () => {
  it('is at least one minute', () => {
    expect(renderArticleMarkdown('Short.').readingMinutes).toBe(1);
  });

  it('counts about 200 words per minute and skips code blocks', () => {
    const words = Array.from({ length: 600 }, () => 'word').join(' ');
    const code = '```\n' + Array.from({ length: 2000 }, () => 'x').join(' ') + '\n```';
    expect(renderArticleMarkdown(`${words}\n\n${code}`).readingMinutes).toBe(3);
  });
});

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { toHtml } from 'hast-util-to-html';
import { toString as hastToString } from 'hast-util-to-string';
import GithubSlugger from 'github-slugger';
import type { Element, ElementContent, Root, RootContent } from 'hast';

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface RenderedArticle {
  /** Sanitised HTML, safe for `dangerouslySetInnerHTML`. */
  html: string;
  /** H2/H3 headings (after demotion), in document order. */
  toc: TocItem[];
  readingMinutes: number;
}

const HEADING_RE = /^h[1-6]$/;
/** One leading emoji (with variation selectors, skin tones and ZWJ sequences). */
const LEADING_EMOJI_RE =
  /^(\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic})*)\s*/u;

function isElement(node: RootContent | ElementContent | undefined): node is Element {
  return !!node && node.type === 'element';
}

function walk(node: Root | Element, fn: (el: Element, parent: Root | Element) => void): void {
  for (const child of node.children) {
    if (isElement(child)) {
      fn(child, node);
      walk(child, fn);
    }
  }
}

/**
 * notion-to-md writes toggles as `<details>\n<summary>…</summary>\nbody\n</details>`.
 * Without blank lines CommonMark keeps the body inside the raw HTML block, so its
 * markdown (lists, bold, links) never gets parsed.
 */
function normalizeNotionMarkdown(markdown: string): string {
  return markdown
    .replace(/(<summary>[\s\S]*?<\/summary>)[ \t]*\n(?!\n)/g, '$1\n\n')
    .replace(/([^\n])\n<\/details>/g, '$1\n\n</details>');
}

/**
 * The article title is already the page's H1, and Notion "Heading 1" blocks become
 * `#`. Shift every heading down one level when the body uses H1 so the outline stays valid.
 */
function demoteHeadings(tree: Root): void {
  let hasH1 = false;
  walk(tree, (el) => {
    if (el.tagName === 'h1') hasH1 = true;
  });
  if (!hasH1) return;
  walk(tree, (el) => {
    if (HEADING_RE.test(el.tagName) && el.tagName !== 'h6') {
      el.tagName = `h${Number(el.tagName[1]) + 1}`;
    }
  });
}

/** Adds ids, a copy-link anchor, and collects the H2/H3 outline. */
function addHeadingAnchors(tree: Root, toc: TocItem[]): void {
  const slugger = new GithubSlugger();
  walk(tree, (el) => {
    if (!['h2', 'h3', 'h4'].includes(el.tagName)) return;
    const text = hastToString(el).trim();
    if (!text) return;
    const id = slugger.slug(text);
    el.properties = { ...el.properties, id };
    el.children.push({
      type: 'element',
      tagName: 'a',
      properties: {
        href: `#${id}`,
        className: ['heading-anchor'],
        ariaLabel: `Copy link to “${text}”`,
      },
      children: [{ type: 'text', value: '#' }],
    });
    if (el.tagName === 'h2' || el.tagName === 'h3') {
      toc.push({ id, text, depth: el.tagName === 'h2' ? 2 : 3 });
    }
  });
}

/**
 * Notion callouts arrive as `> 💡 text`. Turn an emoji-led blockquote into a
 * styled callout box; plain quotes stay blockquotes.
 */
function convertCallouts(tree: Root): void {
  walk(tree, (el) => {
    if (el.tagName !== 'blockquote') return;
    const firstBlock = el.children.find(isElement);
    if (!firstBlock || firstBlock.tagName !== 'p') return;
    const firstText = firstBlock.children[0];
    if (!firstText || firstText.type !== 'text') return;
    const match = LEADING_EMOJI_RE.exec(firstText.value);
    if (!match) return;

    firstText.value = firstText.value.slice(match[0].length);
    const body = el.children;
    el.tagName = 'div';
    el.properties = { className: ['callout'] };
    el.children = [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['callout-icon'], ariaHidden: 'true' },
        children: [{ type: 'text', value: match[1] }],
      },
      { type: 'element', tagName: 'div', properties: { className: ['callout-body'] }, children: body },
    ];
  });
}

function markExternalLinks(tree: Root): void {
  walk(tree, (el) => {
    if (el.tagName !== 'a') return;
    const href = el.properties?.href;
    if (typeof href === 'string' && /^https?:\/\//i.test(href)) {
      el.properties = { ...el.properties, target: '_blank', rel: ['noopener', 'noreferrer'] };
    }
  });
}

/** Wide tables scroll inside their own box instead of widening the page on phones. */
function wrapTables(tree: Root): void {
  const wrap = (parent: Root | Element) => {
    parent.children = parent.children.map((child) => {
      if (!isElement(child)) return child;
      if (child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'] },
          children: [child],
        };
      }
      wrap(child);
      return child;
    }) as typeof parent.children;
  };
  wrap(tree);
}

function makeImagesLazy(tree: Root): void {
  walk(tree, (el) => {
    if (el.tagName === 'img') el.properties = { ...el.properties, loading: 'lazy' };
  });
}

function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|[\]()-]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Render Notion-exported markdown to sanitised HTML.
 *
 * Runs on the server only (called from `getServerSideProps`), so the unified
 * pipeline and parse5 stay out of the client bundle. Raw HTML from Notion is
 * parsed, then passed through `rehype-sanitize` (GitHub schema) before any of our
 * own markup is added, so only the classes and attributes set here survive.
 */
export function renderArticleMarkdown(markdown: string): RenderedArticle {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, defaultSchema);

  const source = normalizeNotionMarkdown(markdown);
  const tree = processor.runSync(processor.parse(source)) as Root;

  const toc: TocItem[] = [];
  demoteHeadings(tree);
  addHeadingAnchors(tree, toc);
  convertCallouts(tree);
  markExternalLinks(tree);
  makeImagesLazy(tree);
  wrapTables(tree);

  return {
    html: toHtml(tree),
    toc,
    readingMinutes: Math.max(1, Math.round(countWords(markdown) / 200)),
  };
}

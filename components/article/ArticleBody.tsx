import React, { useCallback } from 'react';

/**
 * Renders HTML produced by `renderArticleMarkdown` (already sanitised on the server).
 * Clicking a heading's `#` anchor updates the URL and copies the section link.
 */
export function ArticleBody({ html }: { html: string }) {
  const onClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a.heading-anchor');
    if (!anchor) return;
    event.preventDefault();
    const hash = anchor.getAttribute('href') ?? '';
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    window.history.replaceState(null, '', hash);
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    navigator.clipboard?.writeText(url).then(
      () => {
        anchor.dataset.copied = 'true';
        window.setTimeout(() => delete anchor.dataset.copied, 1500);
      },
      () => undefined,
    );
  }, []);

  return (
    <div
      className="article-body prose sm:prose-lg max-w-none"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

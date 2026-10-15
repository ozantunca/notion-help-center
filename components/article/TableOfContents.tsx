import React, { useEffect, useState } from 'react';
import type { TocItem } from '../../lib/markdown';

/** Highlights the last heading that scrolled past the top third of the viewport. */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    if (ids.length === 0) return;
    const update = () => {
      const threshold = window.innerHeight / 3;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= threshold) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);

  return active;
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const ids = React.useMemo(() => items.map((item) => item.id), [items]);
  const active = useActiveHeading(ids);

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        On this page
      </p>
      <ul className="space-y-1 border-l border-gray-200">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                item.depth === 3 ? 'pl-7' : 'pl-4'
              } ${
                active === item.id
                  ? 'border-primary font-medium text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Collapsible outline for screens where the right column is hidden. */
export function InlineTableOfContents({ items }: { items: TocItem[] }) {
  return (
    <details className="toc-inline mb-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-gray-900">On this page</summary>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className={item.depth === 3 ? 'pl-4' : ''}>
            <a href={`#${item.id}`} className="text-gray-600 hover:text-primary">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

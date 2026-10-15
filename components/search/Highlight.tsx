import React from 'react';
import { tokenizeQuery } from '../../lib/search-query';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Marks every word in `text` that starts with one of the query's words. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0 || !text) return <>{text}</>;

  // Longest first so "deploy" wins over "de" when both are typed.
  const alternatives = [...tokens].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${alternatives.join('|')})`, 'giu');

  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(re)) {
    const start = (match.index ?? 0) + match[1].length;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <mark key={start} className="rounded-sm bg-yellow-100 text-inherit">
        {match[2]}
      </mark>,
    );
    last = start + match[2].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

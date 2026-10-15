import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loadClientSearch, type ClientSearch, type SearchHit } from '../../lib/search-client';
import { Highlight } from './Highlight';

const MAX_RESULTS = 8;

interface SearchBoxProps {
  size?: 'large' | 'compact';
  defaultQuery?: string;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function searchUrl(query: string): string {
  return `/search?q=${encodeURIComponent(query.trim())}`;
}

/**
 * Search box with results as you type. The index downloads once, on first focus or
 * hover; after that every keystroke searches locally. Without JavaScript the form
 * still submits to `/search`.
 */
export function SearchBox({ size = 'compact', defaultQuery = '' }: SearchBoxProps) {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [engine, setEngine] = useState<ClientSearch | null>(null);
  const [failed, setFailed] = useState(false);

  const ensureLoaded = useCallback(() => {
    if (engine) return;
    loadClientSearch().then(
      (loaded) => {
        setEngine(loaded);
        setFailed(false);
      },
      () => setFailed(true),
    );
  }, [engine]);

  const trimmed = query.trim();
  const allResults = useMemo(
    () => (engine && trimmed ? engine.search(trimmed) : []),
    [engine, trimmed],
  );
  const results = allResults.slice(0, MAX_RESULTS);
  const fallback = engine && trimmed && allResults.length === 0 ? engine.suggested.slice(0, 4) : [];
  const options: SearchHit[] = results.length > 0 ? results : fallback;
  const showPanel = open && trimmed.length > 0;

  // `/` and Cmd/Ctrl+K focus the search box from anywhere on the page.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const slash = event.key === '/' && !isTypingTarget(event.target);
      const cmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!slash && !cmdK) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const picked = active >= 0 ? options[active] : undefined;
    if (picked) go(picked.url);
    else if (trimmed) go(searchUrl(trimmed));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === 'Escape') {
      // Also stops the browser from clearing a `type="search"` field.
      event.preventDefault();
      if (showPanel) setOpen(false);
      else inputRef.current?.blur();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  const large = size === 'large';
  const optionId = (i: number) => `${listboxId}-option-${i}`;

  return (
    <div ref={rootRef} className="relative text-left" onPointerEnter={ensureLoaded}>
      <form action="/search" method="get" role="search" onSubmit={onSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 sm:pl-5">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            ensureLoaded();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search for articles"
          aria-label="Search articles"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-activedescendant={showPanel && active >= 0 ? optionId(active) : undefined}
          className={`block w-full rounded-xl border-0 bg-white pl-12 pr-12 text-gray-900 placeholder-gray-500 shadow-lg shadow-black/10 focus:outline-none focus:ring-4 focus:ring-white/40 sm:pl-14 ${
            large ? 'py-4 text-lg' : 'py-3'
          }`}
        />
        {!query && (
          <kbd className="pointer-events-none absolute inset-y-0 right-4 my-auto hidden h-6 items-center rounded border border-gray-200 px-2 font-sans text-xs text-gray-400 sm:flex">
            /
          </kbd>
        )}
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl bg-white text-gray-900 shadow-2xl ring-1 ring-black/5">
          {!engine ? (
            <p className="px-5 py-4 text-sm text-gray-500">
              {failed ? 'Search is unavailable. Press Enter to search.' : 'Loading…'}
            </p>
          ) : (
            <>
              {results.length === 0 && (
                <div className="px-5 pt-4 pb-2 text-sm">
                  <p className="text-gray-700">
                    No articles match <span className="font-semibold">“{trimmed}”</span>.
                  </p>
                  {fallback.length > 0 && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Popular articles
                    </p>
                  )}
                </div>
              )}

              {options.length > 0 && (
                <ul id={listboxId} role="listbox" aria-label="Search results" className="max-h-[60vh] overflow-y-auto py-1">
                  {options.map((hit, i) => (
                    <li key={hit.id} id={optionId(i)} role="option" aria-selected={i === active}>
                      <Link
                        href={hit.url}
                        onClick={() => setOpen(false)}
                        onPointerMove={() => setActive(i)}
                        className={`block px-5 py-3 ${i === active ? 'bg-primary-soft' : ''}`}
                      >
                        <span className="block font-semibold leading-snug">
                          <Highlight text={hit.title} query={results.length ? trimmed : ''} />
                        </span>
                        {hit.path && <span className="mt-0.5 block text-xs text-gray-400">{hit.path}</span>}
                        {hit.description && (
                          <span className="mt-1 block truncate text-sm text-gray-600">
                            <Highlight text={hit.description} query={results.length ? trimmed : ''} />
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm">
                {results.length > 0 ? (
                  <Link href={searchUrl(trimmed)} onClick={() => setOpen(false)} className="font-medium text-primary hover:underline">
                    See all {allResults.length} {allResults.length === 1 ? 'result' : 'results'}
                  </Link>
                ) : (
                  <Link href="/contact" onClick={() => setOpen(false)} className="font-medium text-primary hover:underline">
                    Contact support
                  </Link>
                )}
                <span className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
                  <kbd className="rounded border border-gray-200 bg-white px-1.5 font-sans">↑</kbd>
                  <kbd className="rounded border border-gray-200 bg-white px-1.5 font-sans">↓</kbd>
                  to move
                  <kbd className="ml-2 rounded border border-gray-200 bg-white px-1.5 font-sans">↵</kbd>
                  to open
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

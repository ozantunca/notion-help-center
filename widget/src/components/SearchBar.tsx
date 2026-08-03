import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onSearch: (q: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('');

  // Hold the callback in a ref so the debounce below depends only on `value`.
  // The parent rebuilds its handler whenever the current view changes, and
  // depending on that identity re-ran the search after every navigation —
  // opening an article from search results immediately pushed the results
  // back on top of it.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    const t = setTimeout(() => onSearchRef.current(value), 300);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="nhc-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        placeholder="Search articles..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search help articles"
      />
    </div>
  );
}

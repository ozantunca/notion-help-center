import React, { useState, useEffect } from 'react';

interface Props {
  onSearch: (q: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const t = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(t);
  }, [value, onSearch]);

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

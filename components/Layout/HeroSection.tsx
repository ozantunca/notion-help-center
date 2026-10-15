import React from 'react';

interface HeroSectionProps {
  /** Shown only on the large hero. */
  title?: string;
  /** `large` on the home page; `compact` (search only) everywhere else. */
  size?: 'large' | 'compact';
  defaultQuery?: string;
}

export function HeroSection({
  title = 'How can we help?',
  size = 'large',
  defaultQuery = '',
}: HeroSectionProps) {
  const large = size === 'large';

  return (
    <div
      className={`bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] text-white px-4 sm:px-6 lg:px-8 ${
        large ? 'pt-14 pb-16 sm:pt-20 sm:pb-24' : 'py-6'
      }`}
    >
      <div className={`mx-auto text-center ${large ? 'max-w-3xl' : 'max-w-2xl'}`}>
        {large && (
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">{title} ✨</h1>
        )}
        <form action="/search" method="get" role="search" className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Search for articles"
            aria-label="Search articles"
            className={`block w-full pl-12 sm:pl-14 pr-4 rounded-xl border-0 bg-white text-gray-900 placeholder-gray-500 shadow-lg shadow-black/10 focus:ring-4 focus:ring-white/40 ${
              large ? 'py-4 text-lg' : 'py-3'
            }`}
          />
        </form>
      </div>
    </div>
  );
}

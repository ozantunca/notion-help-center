import React from 'react';

interface HeroSectionProps {
  title?: string;
  showSearch?: boolean;
}

export function HeroSection({
  title = 'How can we help?',
  showSearch = true,
}: HeroSectionProps) {
  return (
    <div className="bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">{title} ✨</h1>
        {showSearch && (
          <form action="/search" method="get" className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              placeholder="Search for articles"
              className="block w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:ring-2 focus:ring-white/50"
            />
          </form>
        )}
      </div>
    </div>
  );
}

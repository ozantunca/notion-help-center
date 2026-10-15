import React from 'react';
import { useRouter } from 'next/router';
import { SearchBox } from '../search/SearchBox';

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
  const { asPath } = useRouter();
  const large = size === 'large';

  return (
    <div
      className={`relative z-10 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] text-white px-4 sm:px-6 lg:px-8 ${
        large ? 'pt-14 pb-16 sm:pt-20 sm:pb-24' : 'py-6'
      }`}
    >
      <div className={`mx-auto text-center ${large ? 'max-w-3xl' : 'max-w-2xl'}`}>
        {large && (
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">{title} ✨</h1>
        )}
        {/* Remount per page so the box starts fresh after navigation. */}
        <SearchBox key={asPath} size={size} defaultQuery={defaultQuery} />
      </div>
    </div>
  );
}

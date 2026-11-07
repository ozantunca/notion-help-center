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
      className={`relative z-10 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] bg-[length:200%_200%] text-white px-4 sm:px-6 lg:px-8 animate-gradient-pan ${
        large ? 'pt-14 pb-16 sm:pt-20 sm:pb-24' : 'py-6'
      }`}
    >
      {/* Decoration only. A separate clipped layer, so the search results
          dropdown can still extend below the hero. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-white/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 right-[-5rem] h-96 w-96 rounded-full bg-white/10 blur-3xl animate-float-slow" />
        <div className="hero-dots absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      <div className={`relative mx-auto text-center ${large ? 'max-w-3xl' : 'max-w-2xl'}`}>
        {large && (
          <h1 className="mb-8 animate-fade-up text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
            {title}{' '}
            <span className="inline-block origin-[70%_70%] animate-wave" aria-hidden>
              ✨
            </span>
          </h1>
        )}
        {/* Remount per page so the box starts fresh after navigation. */}
        <div className={large ? 'animate-fade-up [animation-delay:120ms]' : ''}>
          <SearchBox key={asPath} size={size} defaultQuery={defaultQuery} />
        </div>
      </div>
    </div>
  );
}

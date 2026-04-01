import React from 'react';
import Link from 'next/link';
import { useSiteConfig } from '../SiteConfigProvider';

interface HeaderProps {
  variant?: 'white' | 'purple';
  showSearch?: boolean;
  searchQuery?: string;
}

export function Header({
  variant = 'white',
  showSearch = false,
  searchQuery = '',
}: HeaderProps) {
  const isPurple = variant === 'purple';
  const siteConfig = useSiteConfig();

  return (
    <header
      className={
        isPurple
          ? 'bg-gradient-to-r from-[var(--hero-gradient-from)] to-[var(--hero-gradient-via)] text-white'
          : 'bg-white border-b border-gray-200'
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            {siteConfig.logoUrl ? (
              <img
                src={siteConfig.logoUrl}
                alt={siteConfig.logoAlt}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <svg
                width="32"
                height="24"
                viewBox="0 0 32 24"
                fill="currentColor"
                className={isPurple ? 'text-white' : 'text-primary'}
              >
                <path d="M2 18h4v-4H2v4zm6 0h4v-4H8v4zm6 0h4v-4h-4v4zm6 0h4v-4h-4v4zM2 12h4V8H2v4zm6 0h4V8H8v4zm6 0h4V8h-4v4zm6 0h4V8h-4v4zM2 6h4V2H2v4zm6 0h4V2H8v4zm6 0h4V2h-4v4zm6 0h4V2h-4v4z" />
              </svg>
            )}
            <span className="font-bold text-xl">{siteConfig.brandName}</span>
          </Link>
          <nav className="flex items-center gap-6">
            {siteConfig.headerLinks.map((link) =>
              link.external !== false ? (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium hover:opacity-80 ${isPurple ? 'text-white' : 'text-gray-700'}`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`font-medium hover:opacity-80 ${isPurple ? 'text-white' : 'text-gray-700'}`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>
      {showSearch && (
        <div className="max-w-3xl mx-auto px-4 pb-8">
          <form action="/search" method="get" className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
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
              defaultValue={searchQuery}
              placeholder="Search for articles"
              className="block w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </form>
        </div>
      )}
    </header>
  );
}

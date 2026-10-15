import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSiteConfig } from '../SiteConfigProvider';
import type { NavLink } from '../../lib/site-config';

function NavItem({ link, className }: { link: NavLink; className: string }) {
  return link.external !== false ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

/** Site header, identical on every page. Nav links collapse into a menu below `sm`. */
export function Header() {
  const siteConfig = useSiteConfig();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);

  return (
    <header className="relative z-20 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            {siteConfig.logoUrl ? (
              <img
                src={siteConfig.logoUrl}
                alt={siteConfig.logoAlt}
                className="h-8 w-auto shrink-0 object-contain"
              />
            ) : (
              <svg
                width="32"
                height="24"
                viewBox="0 0 32 24"
                fill="currentColor"
                className="shrink-0 text-primary"
                aria-hidden
              >
                <path d="M2 18h4v-4H2v4zm6 0h4v-4H8v4zm6 0h4v-4h-4v4zm6 0h4v-4h-4v4zM2 12h4V8H2v4zm6 0h4V8H8v4zm6 0h4V8h-4v4zm6 0h4V8h-4v4zM2 6h4V2H2v4zm6 0h4V2H8v4zm6 0h4V2h-4v4zm6 0h4V2h-4v4z" />
              </svg>
            )}
            <span className="truncate text-lg font-bold text-gray-900">
              {siteConfig.brandName}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {siteConfig.headerLinks.map((link) => (
              <NavItem
                key={`${link.label}-${link.href}`}
                link={link}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              />
            ))}
          </nav>

          {siteConfig.headerLinks.length > 0 && (
            <button
              type="button"
              className="sm:hidden -mr-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="sm:hidden absolute inset-x-0 top-full border-b border-gray-200 bg-white px-4 py-2 shadow-lg"
        >
          {siteConfig.headerLinks.map((link) => (
            <NavItem
              key={`${link.label}-${link.href}`}
              link={link}
              className="block rounded-lg px-3 py-3 font-medium text-gray-700 hover:bg-gray-50"
            />
          ))}
        </nav>
      )}
    </header>
  );
}

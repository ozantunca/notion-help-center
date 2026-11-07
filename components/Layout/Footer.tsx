import React from 'react';
import Link from 'next/link';
import { useSiteConfig } from '../SiteConfigProvider';

export function Footer() {
  const siteConfig = useSiteConfig();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/contact"
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-primary-ring hover:text-primary hover:shadow-card-hover active:translate-y-0"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300 ease-spring group-hover:-rotate-12 group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            {siteConfig.footerLinks.map((link) =>
              link.external !== false ? (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gray-900"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="transition-colors hover:text-gray-900"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>
          <p className="text-sm text-gray-400">{siteConfig.brandName}</p>
        </div>
      </div>
    </footer>
  );
}

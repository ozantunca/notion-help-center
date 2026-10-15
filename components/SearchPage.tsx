import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { HeroSection } from './Layout/HeroSection';
import { ArticleList } from './ArticleList';
import { SearchDocument } from '../lib/search-index';
import { Collection, SubCollection } from '../lib/types';
import type { SiteConfig } from '../lib/site-config';

interface SearchPageProps {
  query: string;
  results: SearchDocument[];
  /** Suggested articles, filled only when `results` is empty. */
  suggested: SearchDocument[];
  collections: Collection[];
  subCollections: SubCollection[];
  siteConfig: SiteConfig;
}

function getCollectionContext(
  doc: SearchDocument,
  collections: Collection[],
  subCollections: SubCollection[],
): string {
  const collection = collections.find((c) => c.id === doc.collectionId);
  const subCollection = subCollections.find((sc) => sc.id === doc.subCollectionId);
  if (collection && subCollection) {
    return `${collection.title} › ${subCollection.title}`;
  }
  if (collection) return collection.title;
  return '';
}

export function SearchPage({
  query,
  results,
  suggested,
  collections,
  subCollections,
  siteConfig,
}: SearchPageProps) {
  const suffix = siteConfig.seoTitleSuffix;
  const pageTitle = query
    ? `Search results for "${query}" - ${suffix}`
    : `Search - ${suffix}`;

  const toItems = (docs: SearchDocument[]) =>
    docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      url: doc.url,
      eyebrow: getCollectionContext(doc, collections, subCollections),
    }));

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={
            query
              ? `Search results for "${query}" in ${siteConfig.brandName}`
              : `Search ${siteConfig.brandName}`
          }
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroSection size="compact" defaultQuery={query} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span aria-hidden>›</span>
            <span className="text-gray-900">Search</span>
          </nav>

          {!query && (
            <p className="text-gray-600">Enter a search term above to find articles.</p>
          )}

          {query && results.length > 0 && (
            <section>
              <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
                {results.length} {results.length === 1 ? 'result' : 'results'} for “{query}”
              </h1>
              <ArticleList articles={toItems(results)} />
            </section>
          )}

          {query && results.length === 0 && (
            <section>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                No results for “{query}”
              </h1>
              <p className="mt-2 text-gray-600">
                Check the spelling or try a shorter word. You can also{' '}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  contact support
                </Link>
                .
              </p>
              {suggested.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Popular articles
                  </h2>
                  <ArticleList articles={toItems(suggested)} />
                </div>
              )}
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

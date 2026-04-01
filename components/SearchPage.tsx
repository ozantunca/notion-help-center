import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { ArticleCard } from './ArticleCard';
import { SearchDocument } from '../lib/search-index';
import { Collection, SubCollection } from '../lib/types';
import type { SiteConfig } from '../lib/site-config';

interface SearchPageProps {
  query: string;
  results: SearchDocument[];
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
  collections,
  subCollections,
  siteConfig,
}: SearchPageProps) {
  const suffix = siteConfig.seoTitleSuffix;
  const pageTitle = query
    ? `Search results for "${query}" - ${suffix}`
    : `Search - ${suffix}`;

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
        <Header variant="purple" showSearch searchQuery={query} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">
              {query ? `Search results for "${query}"` : 'Search results'}
            </span>
          </nav>

          {!query && (
            <p className="text-gray-600 mb-8">
              Enter a search term above to find articles.
            </p>
          )}

          {query && results.length === 0 && (
            <p className="text-gray-600">
              No articles found for &quot;{query}&quot;. Try different keywords.
            </p>
          )}

          {query && results.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {results.length} {results.length === 1 ? 'article' : 'articles'}{' '}
                found
              </h2>
              <div className="space-y-3">
                {results.map((doc) => {
                  const context = getCollectionContext(
                    doc,
                    collections,
                    subCollections,
                  );
                  return (
                    <div key={doc.id}>
                      <ArticleCard
                        title={doc.title}
                        description={doc.description}
                        url={doc.url}
                        variant="list"
                      />
                      {context && (
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                          In: {context}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

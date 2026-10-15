import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Collection, Article, SubCollection } from '../lib/types';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { HeroSection } from './Layout/HeroSection';
import { ArticleList } from './ArticleList';
import { CollectionIcon } from './CollectionIcon';
import type { SiteConfig } from '../lib/site-config';

interface CollectionPageProps {
  collection: Collection;
  subCollections: SubCollection[];
  articles: Article[];
  siteConfig: SiteConfig;
}

export function CollectionPage({
  collection,
  subCollections,
  articles,
  siteConfig,
}: CollectionPageProps) {
  const sections = subCollections
    .map((subCollection) => ({
      subCollection,
      articles: articles.filter((a) => a.subCollectionId === subCollection.id),
    }))
    .filter((section) => section.articles.length > 0);
  const articleCount = sections.reduce((sum, s) => sum + s.articles.length, 0);

  return (
    <>
      <Head>
        <title>{`${collection.title} - ${siteConfig.seoTitleSuffix}`}</title>
        <meta name="description" content={collection.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroSection size="compact" />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">
              All Categories
            </Link>
            <span aria-hidden>›</span>
            <span className="text-gray-900">{collection.title}</span>
          </nav>

          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center">
            <CollectionIcon
              icon={collection.icon}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-4xl shadow-sm [&_img]:max-h-10 [&_img]:max-w-10"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{collection.title}</h1>
              {collection.description && (
                <p className="mt-1 text-gray-600">{collection.description}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                {sections.length > 1 && ` · ${sections.length} sections`}
              </p>
            </div>
          </div>

          {sections.map(({ subCollection, articles: subArticles }) => (
            <section key={subCollection.id} className="mb-10">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                {subCollection.title}
              </h2>
              <ArticleList articles={subArticles} />
            </section>
          ))}
        </main>

        <Footer />
      </div>
    </>
  );
}

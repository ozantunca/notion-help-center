import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Collection, Article, SubCollection } from '../lib/types';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { HeroSection } from './Layout/HeroSection';
import { ArticleCard } from './ArticleCard';
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
  return (
    <>
      <Head>
        <title>{`${collection.title} - ${siteConfig.seoTitleSuffix}`}</title>
        <meta name="description" content={collection.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroSection title="How can we help?" showSearch />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary">
              All Categories
            </Link>
            <span className="mx-1">›</span>
            {collection.icon ? (
              <CollectionIcon
                icon={collection.icon}
                className="flex h-9 w-9 shrink-0 items-center justify-center text-2xl [&_img]:max-h-9 [&_img]:max-w-9"
              />
            ) : null}
            <span className="font-medium text-gray-900">{collection.title}</span>
          </nav>

          {subCollections.map((subCollection) => {
            const subArticles = articles.filter(
              (a) => a.subCollectionId === subCollection.id,
            );

            if (subArticles.length === 0) return null;

            return (
              <section key={subCollection.id} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {subCollection.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      title={article.title}
                      description={article.description}
                      url={article.url}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        <Footer />
      </div>
    </>
  );
}

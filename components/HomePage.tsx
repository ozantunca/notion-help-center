import React from 'react';
import Head from 'next/head';
import { Collection, Article } from '../lib/types';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { HeroSection } from './Layout/HeroSection';
import { CategoryCard } from './CategoryCard';
import { ArticleCard } from './ArticleCard';
import type { SiteConfig } from '../lib/site-config';

interface HomePageProps {
  collections: Collection[];
  articles: Article[];
  siteConfig: SiteConfig;
}

export function HomePage({ collections, articles, siteConfig }: HomePageProps) {
  const suggestedArticles = articles.filter((a) => a.suggested).slice(0, 5);

  return (
    <>
      <Head>
        <title>{`${siteConfig.brandName} - ${siteConfig.seoTitleSuffix}`}</title>
        <meta name="description" content={siteConfig.seoDefaultDescription} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <HeroSection title="How can we help?" showSearch />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collections.map((collection) => {
                const collectionArticles = articles.filter(
                  (a) => a.collectionId === collection.id,
                );
                return (
                  <CategoryCard
                    key={collection.id}
                    id={collection.id}
                    title={collection.title}
                    description={collection.description || ''}
                    articleCount={collectionArticles.length}
                    icon={collection.icon}
                  />
                );
              })}
            </div>
          </section>

          {suggestedArticles.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Suggested Articles
              </h2>
              <div className="space-y-3">
                {suggestedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    title={article.title}
                    description={article.description}
                    url={article.url}
                    variant="list"
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

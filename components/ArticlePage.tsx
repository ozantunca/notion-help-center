import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Article } from '../lib/types';
import type { RenderedArticle } from '../lib/markdown';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { HeroSection } from './Layout/HeroSection';
import { ArticleList } from './ArticleList';
import { ArticleBody } from './article/ArticleBody';
import { ArticleFeedback } from './article/ArticleFeedback';
import { ArticleSidebar } from './article/ArticleSidebar';
import { InlineTableOfContents, TableOfContents } from './article/TableOfContents';
import type { SiteConfig } from '../lib/site-config';

export interface ArticleLink {
  id: string;
  title: string;
  url: string;
}

export interface ArticleNavSection {
  id: string;
  title: string;
  articles: ArticleLink[];
}

export interface ArticlePageProps {
  article: Omit<Article, 'content'>;
  rendered: RenderedArticle;
  collection: { title: string; icon: string | null; href: string };
  subCollectionTitle: string;
  sections: ArticleNavSection[];
  previous: ArticleLink | null;
  next: ArticleLink | null;
  related: (ArticleLink & { description: string })[];
  siteConfig: SiteConfig;
}

/** Fixed locale and UTC so server and client render the same string. */
const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatDate(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

function PagerLink({ link, direction }: { link: ArticleLink; direction: 'previous' | 'next' }) {
  const isNext = direction === 'next';
  return (
    <Link
      href={link.url}
      className={`group flex flex-col rounded-xl border border-gray-200 px-5 py-4 transition-colors hover:border-primary ${
        isNext ? 'sm:col-start-2 sm:items-end sm:text-right' : ''
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {isNext ? 'Next →' : '← Previous'}
      </span>
      <span className="mt-1 font-semibold text-gray-900 group-hover:text-primary">{link.title}</span>
    </Link>
  );
}

export function ArticlePage({
  article,
  rendered,
  collection,
  subCollectionTitle,
  sections,
  previous,
  next,
  related,
  siteConfig,
}: ArticlePageProps) {
  const updated = formatDate(article.lastUpdated);
  const hasToc = rendered.toc.length >= 2;

  return (
    <>
      <Head>
        <title>{`${article.title} - ${siteConfig.seoTitleSuffix}`}</title>
        <meta name="description" content={article.description} />
      </Head>

      <div className="min-h-screen bg-white">
        <Header />
        <HeroSection size="compact" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
          <aside className="hidden lg:block">
            <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto pb-6">
              <ArticleSidebar collection={collection} sections={sections} currentId={article.id} />
            </div>
          </aside>

          <main className="min-w-0 max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
              <span aria-hidden>›</span>
              <Link href={collection.href} className="hover:text-primary">
                {collection.title}
              </Link>
              <span aria-hidden>›</span>
              <span className="text-gray-900">{subCollectionTitle}</span>
            </nav>

            <article>
              <header className="mb-8 border-b border-gray-100 pb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {article.title}
                </h1>
                {article.description && (
                  <p className="mt-3 text-lg text-gray-600">{article.description}</p>
                )}
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                  {updated && <span>Updated {updated}</span>}
                  {updated && <span aria-hidden>·</span>}
                  <span>{rendered.readingMinutes} min read</span>
                </p>
              </header>

              {hasToc && (
                <div className="xl:hidden">
                  <InlineTableOfContents items={rendered.toc} />
                </div>
              )}

              {rendered.html ? (
                <ArticleBody html={rendered.html} />
              ) : (
                <p className="text-gray-600">This article has no content yet.</p>
              )}
            </article>

            <div className="mt-12 space-y-10">
              <ArticleFeedback articleId={article.id} />

              {(previous || next) && (
                <nav aria-label="Previous and next article" className="grid gap-4 sm:grid-cols-2">
                  {previous && <PagerLink link={previous} direction="previous" />}
                  {next && <PagerLink link={next} direction="next" />}
                </nav>
              )}

              {related.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    More in {subCollectionTitle}
                  </h2>
                  <ArticleList articles={related} />
                </section>
              )}
            </div>
          </main>

          {hasToc && (
            <aside className="hidden xl:block">
              <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
                <TableOfContents items={rendered.toc} />
              </div>
            </aside>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}

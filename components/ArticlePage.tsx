import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Article } from '../lib/types';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import type { SiteConfig } from '../lib/site-config';

interface ArticlePageProps {
  article: Article;
  collectionTitle: string;
  subCollectionTitle: string;
  collectionSlug?: string;
  siteConfig: SiteConfig;
}

type FeedbackRating = 'positive' | 'neutral' | 'negative';

export function ArticlePage({
  article,
  collectionTitle,
  subCollectionTitle,
  collectionSlug,
  siteConfig,
}: ArticlePageProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [commentPrompt, setCommentPrompt] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState('');

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Article not found
          </h1>
          <Link href="/" className="text-primary hover:text-primary-hover">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const markdownContent = article.content || '';

  return (
    <>
      <Head>
        <title>{`${article.title} - ${siteConfig.seoTitleSuffix}`}</title>
        <meta name="description" content={article.description} />
      </Head>

      <div className="min-h-screen bg-white">
        <Header variant="purple" showSearch />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-primary">
              Home
            </Link>
            <span className="mx-2">›</span>
            <Link
              href={collectionSlug ? `/collection/${collectionSlug}` : `/collection/${article.collectionId}`}
              className="hover:text-primary"
            >
              {collectionTitle}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{subCollectionTitle}</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">{article.title}</span>
          </nav>

          <article className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            {article.description && (
              <p className="text-xl text-gray-600 mb-8">{article.description}</p>
            )}
            {markdownContent ? (
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-img:rounded-xl">
                <ReactMarkdown>{markdownContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-gray-600">Content is being loaded...</div>
            )}
          </article>

          <section className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Was this helpful?
            </h3>
            {feedbackSubmitted ? (
              <p className="text-gray-600">Thank you for your feedback!</p>
            ) : commentPrompt ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Anything we could improve?
                </p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional feedback..."
                  rows={3}
                  className="block w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
                  disabled={feedbackPending}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setFeedbackPending(true);
                      try {
                        const res = await fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            articleId: article.id,
                            rating: commentPrompt,
                            comment: comment || undefined,
                          }),
                        });
                        if (res.ok) setFeedbackSubmitted(true);
                      } finally {
                        setFeedbackPending(false);
                      }
                    }}
                    disabled={feedbackPending}
                    className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    {feedbackPending ? 'Sending...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCommentPrompt(null);
                      setComment('');
                    }}
                    disabled={feedbackPending}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    setFeedbackPending(true);
                    try {
                      const res = await fetch('/api/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          articleId: article.id,
                          rating: 'positive',
                        }),
                      });
                      if (res.ok) setFeedbackSubmitted(true);
                    } finally {
                      setFeedbackPending(false);
                    }
                  }}
                  disabled={feedbackPending}
                  className="text-3xl hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Yes, helpful"
                >
                  😊
                </button>
                <button
                  type="button"
                  onClick={() => setCommentPrompt('neutral')}
                  disabled={feedbackPending}
                  className="text-3xl hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Neutral"
                >
                  😐
                </button>
                <button
                  type="button"
                  onClick={() => setCommentPrompt('negative')}
                  disabled={feedbackPending}
                  className="text-3xl hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="No, not helpful"
                >
                  😞
                </button>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

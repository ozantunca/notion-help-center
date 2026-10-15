import React from 'react';
import { GetServerSideProps } from 'next';
import { Article, Collection, SubCollection } from '../../../../lib/types';
import { slugify } from '../../../../lib/article-url';
import {
  ArticlePage,
  type ArticlePageProps,
  type ArticleLink,
  type ArticleNavSection,
} from '../../../../components/ArticlePage';
import { loadHelpMetadata, loadSiteConfig } from '../../../../lib/help-data';
import { renderArticleMarkdown } from '../../../../lib/markdown';

type ArticleRouteProps = ArticlePageProps;

export default function ArticleRoute(props: ArticleRouteProps) {
  return <ArticlePage {...props} />;
}

export const getServerSideProps: GetServerSideProps<ArticleRouteProps> = async ({
  params,
}) => {
  const collectionParam = params?.collectionId;
  const subCollectionParam = params?.subCollectionId;
  const slug = params?.slug;
  const articleIdParam = params?.articleId;

  if (
    typeof collectionParam !== 'string' ||
    typeof subCollectionParam !== 'string' ||
    typeof slug !== 'string' ||
    typeof articleIdParam !== 'string'
  ) {
    return { notFound: true };
  }

  const metadata = loadHelpMetadata();
  const articles: Article[] = metadata.articles || [];
  const collections: Collection[] = metadata.collections || [];
  const subCollections: SubCollection[] = metadata.subCollections || [];

  const collection = collections.find(
    (c) =>
      (c.slug && c.slug === collectionParam) ||
      c.id === collectionParam ||
      (c.slug || slugify(c.title)) === collectionParam,
  );
  if (!collection) {
    return { notFound: true };
  }

  const subCollection = subCollections.find(
    (sc) =>
      sc.collectionId === collection.id &&
      (sc.id === subCollectionParam || sc.legacyId === subCollectionParam),
  );
  if (!subCollection) {
    return { notFound: true };
  }

  const article = articles.find(
    (a) =>
      a.subCollectionId === subCollection.id &&
      a.slug === slug &&
      (a.id === articleIdParam || a.legacyId === articleIdParam),
  );

  if (!article) {
    return { notFound: true };
  }

  const toLink = (a: Article): ArticleLink => ({ id: a.id, title: a.title, url: a.url });

  // Sidebar: every section of this collection, in sync order.
  const sections: ArticleNavSection[] = subCollections
    .filter((sc) => sc.collectionId === collection.id)
    .map((sc) => ({
      id: sc.id,
      title: sc.title,
      articles: articles.filter((a) => a.subCollectionId === sc.id).map(toLink),
    }))
    .filter((section) => section.articles.length > 0);

  const flat = sections.flatMap((section) => section.articles);
  const index = flat.findIndex((a) => a.id === article.id);

  const related = articles
    .filter((a) => a.subCollectionId === subCollection.id && a.id !== article.id)
    .slice(0, 5)
    .map((a) => ({ ...toLink(a), description: a.description }));

  // Markdown is rendered here so the parser stays out of the client bundle;
  // the raw content is not sent to the browser.
  const { content, ...articleWithoutContent } = article;

  return {
    props: {
      article: articleWithoutContent,
      rendered: renderArticleMarkdown(content || ''),
      collection: {
        title: collection.title,
        icon: collection.icon ?? null,
        href: `/collection/${collection.slug || slugify(collection.title)}`,
      },
      subCollectionTitle: subCollection.title,
      sections,
      previous: index > 0 ? flat[index - 1] : null,
      next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
      related,
      siteConfig: loadSiteConfig(),
    },
  };
};

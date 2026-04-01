import React from 'react';
import { GetServerSideProps } from 'next';
import { Article, Collection, SubCollection } from '../../../../lib/types';
import { slugify } from '../../../../lib/article-url';
import { ArticlePage } from '../../../../components/ArticlePage';
import { loadHelpMetadata, loadSiteConfig } from '../../../../lib/help-data';
import type { SiteConfig } from '../../../../lib/site-config';

interface ArticleRouteProps {
  article: Article;
  collectionTitle: string;
  subCollectionTitle: string;
  collectionSlug?: string;
  siteConfig: SiteConfig;
}

export default function ArticleRoute({
  article,
  collectionTitle,
  subCollectionTitle,
  collectionSlug,
  siteConfig,
}: ArticleRouteProps) {
  return (
    <ArticlePage
      article={article}
      collectionTitle={collectionTitle}
      subCollectionTitle={subCollectionTitle}
      collectionSlug={collectionSlug}
      siteConfig={siteConfig}
    />
  );
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

  return {
    props: {
      article,
      collectionTitle: collection.title,
      subCollectionTitle: subCollection.title,
      collectionSlug: collection.slug || slugify(collection.title),
      siteConfig: loadSiteConfig(),
    },
  };
};

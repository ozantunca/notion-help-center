import React from 'react';
import { GetServerSideProps } from 'next';
import { Collection, Article, SubCollection } from '../../../lib/types';
import { CollectionPage } from '../../../components/CollectionPage';
import { loadHelpMetadata, loadSiteConfig } from '../../../lib/help-data';
import type { SiteConfig } from '../../../lib/site-config';

interface CollectionPageProps {
  collection: Collection;
  subCollections: SubCollection[];
  articles: Article[];
  siteConfig: SiteConfig;
}

export default function CollectionRoute({
  collection,
  subCollections,
  articles,
  siteConfig,
}: CollectionPageProps) {
  return (
    <CollectionPage
      collection={collection}
      subCollections={subCollections}
      articles={articles}
      siteConfig={siteConfig}
    />
  );
}

export const getServerSideProps: GetServerSideProps<CollectionPageProps> = async ({
  params,
}) => {
  const collectionId = params?.collectionId;
  if (typeof collectionId !== 'string') {
    return { notFound: true };
  }

  const metadata = loadHelpMetadata();
  const collections: Collection[] = metadata.collections || [];
  const subCollections: SubCollection[] = metadata.subCollections || [];
  const articles: Article[] = metadata.articles || [];

  const collection = collections.find(
    (c) => c.id === collectionId || c.slug === collectionId,
  );

  if (!collection) {
    return { notFound: true };
  }

  const collectionSubCollections = subCollections.filter(
    (sc) => sc.collectionId === collection.id,
  );

  const collectionArticles = articles.filter((a) => a.collectionId === collection.id);

  return {
    props: {
      collection,
      subCollections: collectionSubCollections,
      articles: collectionArticles,
      siteConfig: loadSiteConfig(),
    },
  };
};

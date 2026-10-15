import React from 'react';
import { GetServerSideProps } from 'next';
import lunr from 'lunr';
import { SearchPage } from '../components/SearchPage';
import { SearchDocument } from '../lib/search-index';
import { Collection, SubCollection } from '../lib/types';
import { loadHelpMetadata, loadSearchSnapshot, loadSiteConfig } from '../lib/help-data';
import { runSearch } from '../lib/search-query';
import type { SiteConfig } from '../lib/site-config';

interface SearchProps {
  query: string;
  results: SearchDocument[];
  suggested: SearchDocument[];
  collections: Collection[];
  subCollections: SubCollection[];
  siteConfig: SiteConfig;
}

export default function Search({
  query,
  results,
  suggested,
  collections,
  subCollections,
  siteConfig,
}: SearchProps) {
  return (
    <SearchPage
      query={query}
      results={results}
      suggested={suggested}
      collections={collections}
      subCollections={subCollections}
      siteConfig={siteConfig}
    />
  );
}

export const getServerSideProps: GetServerSideProps<SearchProps> = async (
  context,
) => {
  const query = (typeof context.query.q === 'string' ? context.query.q : '')
    .trim();

  let results: SearchDocument[] = [];
  const meta = loadHelpMetadata();
  const collections = meta.collections;
  const subCollections = meta.subCollections;
  const siteConfig = loadSiteConfig();

  const searchData = loadSearchSnapshot();

  if (searchData && query) {
    const idx = lunr.Index.load(searchData.index);
    const matches = runSearch(lunr, idx, query);
    const docMap = new Map(searchData.documents.map((d) => [d.id, d]));
    results = matches
      .map((m) => docMap.get(m.ref))
      .filter((d): d is SearchDocument => d != null);
  }

  // Shown when nothing matches, so the page is never a dead end.
  const suggested: SearchDocument[] =
    results.length === 0
      ? meta.articles
          .filter((a) => a.published && a.suggested)
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            collectionId: a.collectionId,
            subCollectionId: a.subCollectionId,
            url: a.url,
          }))
      : [];

  return {
    props: {
      query,
      // The article body is only needed for indexing, not for the result list.
      results: results.map(({ content: _content, ...doc }) => doc),
      suggested,
      collections,
      subCollections,
      siteConfig,
    },
  };
};

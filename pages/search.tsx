import React from 'react';
import { GetServerSideProps } from 'next';
import lunr from 'lunr';
import { SearchPage } from '../components/SearchPage';
import { SearchDocument } from '../lib/search-index';
import { Collection, SubCollection } from '../lib/types';
import { loadHelpMetadata, loadSearchSnapshot, loadSiteConfig } from '../lib/help-data';
import type { SiteConfig } from '../lib/site-config';

interface SearchProps {
  query: string;
  results: SearchDocument[];
  collections: Collection[];
  subCollections: SubCollection[];
  siteConfig: SiteConfig;
}

export default function Search({
  query,
  results,
  collections,
  subCollections,
  siteConfig,
}: SearchProps) {
  return (
    <SearchPage
      query={query}
      results={results}
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
    const matches = idx.search(query);
    const docMap = new Map(searchData.documents.map((d) => [d.id, d]));
    results = matches
      .map((m) => docMap.get(m.ref))
      .filter((d): d is SearchDocument => d != null);
  }

  return {
    props: {
      query,
      results,
      collections,
      subCollections,
      siteConfig,
    },
  };
};

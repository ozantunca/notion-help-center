import React from 'react';
import { GetServerSideProps } from 'next';
import { Collection, Article } from '../lib/types';
import { HomePage } from '../components/HomePage';
import { loadHelpMetadata, loadSiteConfig } from '../lib/help-data';
import type { SiteConfig } from '../lib/site-config';

interface HomeProps {
  collections: Collection[];
  articles: Article[];
  siteConfig: SiteConfig;
}

export default function Home({ collections, articles, siteConfig }: HomeProps) {
  return <HomePage collections={collections} articles={articles} siteConfig={siteConfig} />;
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const meta = loadHelpMetadata();

  return {
    props: {
      collections: meta.collections,
      articles: meta.articles,
      siteConfig: loadSiteConfig(),
    },
  };
};

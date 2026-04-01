import React from 'react';
import App, { type AppContext, type AppProps } from 'next/app';
import { SiteConfigProvider } from '../components/SiteConfigProvider';
import type { SiteConfig } from '../lib/site-config';
import '../styles/globals.css';

function pickSiteConfig(pageProps: AppProps['pageProps'] | undefined): SiteConfig | undefined {
  if (!pageProps || typeof pageProps !== 'object') return undefined;
  return (pageProps as { _siteConfig?: SiteConfig })._siteConfig;
}

function withoutSiteConfig(pageProps: AppProps['pageProps']): AppProps['pageProps'] {
  if (!pageProps || typeof pageProps !== 'object') return pageProps;
  const p = pageProps as Record<string, unknown>;
  if (!('_siteConfig' in p)) return pageProps;
  const { _siteConfig: _, ...rest } = p;
  return rest as AppProps['pageProps'];
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const initialConfig = pickSiteConfig(pageProps);
  return (
    <SiteConfigProvider initialConfig={initialConfig}>
      <Component {...withoutSiteConfig(pageProps)} />
    </SiteConfigProvider>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  // Client bundle must never import help-data / better-sqlite3 (no `fs`). Only merge on server.
  if (typeof window !== 'undefined') {
    return appProps;
  }
  const { loadSiteConfig } = await import('../lib/help-data');
  const siteConfig = loadSiteConfig();
  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      _siteConfig: siteConfig,
    },
  };
};

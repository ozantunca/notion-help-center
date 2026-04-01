import React, { createContext, useContext, useState } from 'react';
import {
  defaultSiteConfig,
  normalizeSiteConfig,
  siteThemeToRootCss,
  type SiteConfig,
} from '../lib/site-config';

const SiteConfigContext = createContext<SiteConfig>(defaultSiteConfig);

type Props = {
  children: React.ReactNode;
  /** From `_app` getInitialProps — no client fetch; avoids theme/branding flash */
  initialConfig?: SiteConfig;
};

export function SiteConfigProvider({ children, initialConfig }: Props) {
  const [config] = useState<SiteConfig>(() =>
    initialConfig ? normalizeSiteConfig(initialConfig) : defaultSiteConfig,
  );

  return (
    <SiteConfigContext.Provider value={config}>
      <style
        id="notion-help-center-theme-vars"
        // eslint-disable-next-line react/no-danger -- theme strings from server bootstrap / DB
        dangerouslySetInnerHTML={{ __html: siteThemeToRootCss(config.theme) }}
      />
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}

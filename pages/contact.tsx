import React from 'react';
import { GetStaticProps } from 'next';
import { ContactPage } from '../components/ContactPage';
import { loadSiteConfig } from '../lib/help-data';
import type { SiteConfig } from '../lib/site-config';

interface ContactProps {
  siteConfig: SiteConfig;
}

export default function Contact({ siteConfig }: ContactProps) {
  return <ContactPage siteConfig={siteConfig} />;
}

export const getStaticProps: GetStaticProps<ContactProps> = async () => ({
  props: {
    siteConfig: loadSiteConfig(),
  },
  revalidate: 60,
});

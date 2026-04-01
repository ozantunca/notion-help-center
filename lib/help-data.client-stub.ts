/**
 * Resolved instead of `help-data.ts` in the **browser** webpack build only.
 * Real SQLite-backed implementations run on the server (getServerSideProps, API routes, sync scripts).
 */
import type { Collection, SubCollection, Article } from './types';
import type { SearchDocument } from './search-index';
import { normalizeSiteConfig, type SiteConfig } from './site-config';

export interface HelpMetadata {
  collections: Collection[];
  subCollections: SubCollection[];
  articles: Article[];
  lastSynced?: string;
}

export interface SearchSnapshot {
  index: object;
  documents: SearchDocument[];
}

function serverOnly(name: string): never {
  throw new Error(`${name} is server-only (SQLite); this stub should not run in the browser`);
}

export function loadHelpMetadata(): HelpMetadata {
  return { collections: [], subCollections: [], articles: [] };
}

export function loadSearchSnapshot(): SearchSnapshot | null {
  return null;
}

export function loadSiteConfigDiskRaw(): Record<string, unknown> | null {
  return null;
}

export function loadSiteConfig(): SiteConfig {
  return normalizeSiteConfig({});
}

export function saveSiteConfigOnly(_siteConfig: SiteConfig): void {
  serverOnly('saveSiteConfigOnly');
}

export function saveHelpCenterData(_params: {
  collections: Collection[];
  subCollections: SubCollection[];
  articles: Article[];
  searchIndex: { index: object; documents: SearchDocument[] };
  siteConfig: SiteConfig;
  lastSynced: string;
}): void {
  serverOnly('saveHelpCenterData');
}

export function saveSearchSnapshotOnly(_searchIndex: {
  index: object;
  documents: SearchDocument[];
}): void {
  serverOnly('saveSearchSnapshotOnly');
}

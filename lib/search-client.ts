import type { SearchIndexDocument, SearchIndexPayload } from '../pages/api/search-index';
import { runSearch } from './search-query';

export type SearchHit = SearchIndexDocument;

export interface ClientSearch {
  search(query: string): SearchHit[];
  suggested: SearchHit[];
}

let loading: Promise<ClientSearch> | null = null;

/**
 * Downloads the index and lunr once per page load, on first use. Later calls reuse
 * the same promise, so every keystroke after that runs locally.
 */
export function loadClientSearch(): Promise<ClientSearch> {
  if (!loading) {
    loading = Promise.all([
      import('lunr').then((m) => m.default),
      fetch('/api/search-index').then((res) => {
        if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
        return res.json() as Promise<SearchIndexPayload>;
      }),
    ])
      .then(([lunr, payload]) => {
        const index = payload.index ? lunr.Index.load(payload.index) : null;
        const byId = new Map(payload.documents.map((d) => [d.id, d]));
        return {
          search: (query: string) =>
            index
              ? runSearch(lunr, index, query)
                  .map((match) => byId.get(match.ref))
                  .filter((d): d is SearchHit => d != null)
              : [],
          suggested: payload.documents.filter((d) => d.suggested),
        };
      })
      .catch((error) => {
        // Let the next focus try again instead of caching the failure.
        loading = null;
        throw error;
      });
  }
  return loading;
}

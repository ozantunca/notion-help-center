import type lunrNs from 'lunr';

/**
 * Limits for one query. Search runs on the server for `/search` and the public
 * `/api/v1/search`, and its cost grows with the number of words (each word adds
 * exact, typo and prefix clauses). Real queries are a few words long.
 */
export const MAX_QUERY_LENGTH = 200;
export const MAX_QUERY_WORDS = 10;

/** Lowercased word tokens from free text (letters and digits only). */
export function tokenizeQuery(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Search-as-you-type query, shared by the browser search box, `/search` and
 * `/api/v1/search`.
 *
 * Every word matches exactly (through the stemmer) or with one typo. The last word
 * is also matched as a prefix, because the visitor is probably still typing it:
 * "deplo" finds "Deploy with Docker".
 *
 * `lunr` is passed in so this module never imports it at runtime; the browser
 * loads lunr lazily, on first focus of the search box.
 */
export function runSearch(
  lunr: typeof lunrNs,
  index: lunrNs.Index,
  raw: string,
): lunrNs.Index.Result[] {
  // Never pass user text to lunr's own query syntax: `*` and `~2` in it make a
  // single short request expensive enough to block the server.
  const tokens = tokenizeQuery(raw.slice(0, MAX_QUERY_LENGTH)).slice(0, MAX_QUERY_WORDS);
  if (tokens.length === 0) return [];
  const last = tokens.length - 1;

  try {
    return index.query((q) => {
      tokens.forEach((token, i) => {
        q.term(token, { boost: 10 });
        if (token.length >= 4) {
          q.term(token, { editDistance: 1, usePipeline: false, boost: 1 });
        }
        if (i === last) {
          q.term(token, {
            wildcard: lunr.Query.wildcard.TRAILING,
            usePipeline: false,
            boost: 5,
          });
        }
      });
    });
  } catch {
    return [];
  }
}

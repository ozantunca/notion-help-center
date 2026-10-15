import type lunrNs from 'lunr';

/** Lowercased word tokens from free text (letters and digits only). */
export function tokenizeQuery(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Search-as-you-type query, shared by the browser search box and `/search`.
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
  const tokens = tokenizeQuery(raw);
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

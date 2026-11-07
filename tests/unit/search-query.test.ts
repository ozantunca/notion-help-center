import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
import { generateSearchIndex } from '../../lib/search-index';
import { MAX_QUERY_WORDS, runSearch, tokenizeQuery } from '../../lib/search-query';
import type { Article } from '../../lib/types';

function article(id: string, title: string, description = ''): Article {
  return {
    id,
    title,
    description,
    slug: id,
    published: true,
    suggested: false,
    lastUpdated: '2026-01-01T00:00:00.000Z',
    collectionId: 'c',
    subCollectionId: 's',
    url: `/c/s/${id}/${id}`,
  };
}

const { index: json } = generateSearchIndex(
  [
    article('docker', 'Deploy with Docker', 'Run the help center with persistent volumes.'),
    article('logo', 'Change logo and colors', 'Update branding in the admin page.'),
    article('domain', 'Use a custom domain'),
  ],
  new Map([['domain', 'Point a CNAME record at the server.']]),
);
const index = lunr.Index.load(json);
const search = (q: string) => runSearch(lunr, index, q).map((r) => r.ref);

describe('tokenizeQuery', () => {
  it('lowercases and splits on anything that is not a letter or digit', () => {
    expect(tokenizeQuery('Deploy, with DOCKER!')).toEqual(['deploy', 'with', 'docker']);
  });

  it('keeps non-Latin letters and digits', () => {
    expect(tokenizeQuery('Çalışma 2026')).toEqual(['çalışma', '2026']);
  });

  it('drops lunr query syntax', () => {
    expect(tokenizeQuery('title:foo* bar~2 +baz')).toEqual(['title', 'foo', 'bar', '2', 'baz']);
  });
});

describe('runSearch', () => {
  it('finds an article by an exact word', () => {
    expect(search('docker')[0]).toBe('docker');
  });

  it('matches the last word as a prefix while the visitor types', () => {
    expect(search('deplo')).toContain('docker');
  });

  it('allows one typo in words of four letters or more', () => {
    expect(search('dockr')).toContain('docker');
  });

  it('searches the description and the article body', () => {
    expect(search('branding')).toContain('logo');
    expect(search('cname')).toContain('domain');
  });

  it('returns nothing for empty or symbol-only input', () => {
    expect(search('')).toEqual([]);
    expect(search('*** ~~ ::')).toEqual([]);
  });

  it('does not fail on very long input', () => {
    const many = Array.from({ length: MAX_QUERY_WORDS * 5 }, (_, i) => `word${i}`).join(' ');
    expect(() => search(many)).not.toThrow();
    expect(() => search('a'.repeat(10_000))).not.toThrow();
  });
});

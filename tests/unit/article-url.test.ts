import { describe, expect, it } from 'vitest';
import { getArticlePath, slugify } from '../../lib/article-url';
import type { Article, Collection, SubCollection } from '../../lib/types';

describe('slugify', () => {
  it('lowercases, joins words with hyphens and drops punctuation', () => {
    expect(slugify('  Getting Started: The Basics!  ')).toBe('getting-started-the-basics');
  });
});

describe('getArticlePath', () => {
  const article = { id: 'a1', slug: 'deploy-with-docker' } as Article;
  const collection = { id: 'c1', title: 'Getting Started' } as Collection;
  const sub = { id: 's1', title: 'Deployment', collectionId: 'c1' } as SubCollection;

  it('uses the collection slug when it is set', () => {
    expect(getArticlePath(article, { ...collection, slug: 'start' }, sub)).toBe(
      '/start/s1/deploy-with-docker/a1',
    );
  });

  it('slugifies the collection title when there is no slug', () => {
    expect(getArticlePath(article, collection, sub)).toBe('/getting-started/s1/deploy-with-docker/a1');
  });

  it('prefers legacy ids so old links keep working', () => {
    expect(
      getArticlePath({ ...article, legacyId: 'old-a' }, collection, { ...sub, legacyId: 'old-s' }),
    ).toBe('/getting-started/old-s/deploy-with-docker/old-a');
  });
});

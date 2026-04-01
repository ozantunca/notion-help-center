import { GetServerSideProps } from 'next';
import { Article, Collection, SubCollection } from '../../../lib/types';
import { getArticlePath } from '../../../lib/article-url';
import { loadHelpMetadata } from '../../../lib/help-data';

/**
 * Legacy article URLs (e.g. /{collectionId}/{subCollectionId}/{slug}).
 * Redirects to canonical URL at request time so we don't use getStaticProps redirect (not allowed during prerender).
 */
export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const metadata = loadHelpMetadata();
  const articles: Article[] = metadata.articles || [];
  const collections: Collection[] = metadata.collections || [];
  const subCollections: SubCollection[] = metadata.subCollections || [];

  const article = articles.find(
    (a) =>
      a.collectionId === params?.collectionId &&
      a.subCollectionId === params?.subCollectionId &&
      a.slug === params?.slug,
  );

  if (!article) {
    return { notFound: true };
  }

  const collection = collections.find((c: Collection) => c.id === article.collectionId);
  const subCollection = subCollections.find(
    (sc: SubCollection) => sc.id === article.subCollectionId,
  );

  if (!collection || !subCollection) {
    return { notFound: true };
  }

  const destination = getArticlePath(article, collection, subCollection);

  res.writeHead(301, { Location: destination });
  res.end();
  return { props: {} };
};

export default function LegacyArticleRedirect() {
  return null;
}

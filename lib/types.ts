export interface Collection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  /** URL slug for canonical article paths (e.g. "using-the-sound-wave-editor") */
  slug?: string;
}

export interface SubCollection {
  id: string;
  title: string;
  collectionId: string;
  /** Legacy Cuid used in canonical URLs for backward compatibility */
  legacyId?: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  slug: string;
  published: boolean;
  suggested: boolean;
  lastUpdated: string;
  collectionId: string;
  subCollectionId: string;
  content?: string; // Markdown content
  url: string;
  /** Legacy Cuid used in canonical URLs for backward compatibility */
  legacyId?: string;
}

export interface ArticleMetadata {
  articles: Article[];
  collections: Collection[];
  subCollections: SubCollection[];
  searchIndex: any;
}

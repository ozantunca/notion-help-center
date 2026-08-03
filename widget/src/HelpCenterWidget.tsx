import React, { useState, useCallback } from 'react';
import './widget.css';
import { LauncherButton } from './components/LauncherButton';
import { Panel } from './components/Panel';
import { SearchBar } from './components/SearchBar';
import { HomeView } from './views/HomeView';
import { CollectionView } from './views/CollectionView';
import { ArticleView } from './views/ArticleView';
import { SearchView } from './views/SearchView';
import { useConfig } from './hooks/useApi';

type View =
  | { name: 'home' }
  | { name: 'collection'; id: string; title: string }
  | { name: 'article'; id: string; title: string }
  | { name: 'search' };

export interface HelpCenterWidgetProps {
  apiUrl: string;
}

export function HelpCenterWidget({ apiUrl }: HelpCenterWidgetProps) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<View[]>([{ name: 'home' }]);
  const [searchQuery, setSearchQuery] = useState('');

  const { config } = useConfig(apiUrl);

  const current = stack[stack.length - 1];

  const push = useCallback((view: View) => setStack((s) => [...s, view]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (q.trim() && current.name !== 'search') {
        push({ name: 'search' });
      } else if (!q.trim() && current.name === 'search') {
        pop();
      }
    },
    [current.name, push, pop],
  );

  const handleArticle = useCallback(
    (id: string, title = '') => push({ name: 'article', id, title }),
    [push],
  );

  const handleCollection = useCallback(
    (id: string, title: string) => push({ name: 'collection', id, title }),
    [push],
  );

  const panelTitle =
    current.name === 'home' ? (config?.brandName ?? 'Help Center')
    : current.name === 'search' ? 'Search results'
    : current.name === 'collection' ? current.title
    : current.name === 'article' ? current.title
    : 'Help Center';

  const primaryColor = config?.theme.primaryColor;
  const primaryHoverColor = config?.theme.primaryHoverColor;

  return (
    <div
      id="nhc-widget"
      style={
        primaryColor
          ? ({ '--nhc-primary': primaryColor, '--nhc-primary-hover': primaryHoverColor } as React.CSSProperties)
          : undefined
      }
    >
      {open && (
        <Panel
          title={panelTitle}
          canGoBack={stack.length > 1}
          onBack={pop}
          onClose={() => setOpen(false)}
          viewKey={'id' in current ? `${current.name}:${current.id}` : current.name}
        >
          <SearchBar onSearch={handleSearch} />

          {current.name === 'search' ? (
            <SearchView apiUrl={apiUrl} query={searchQuery} onArticle={handleArticle} />
          ) : current.name === 'home' ? (
            <HomeView apiUrl={apiUrl} onArticle={handleArticle} onCollection={handleCollection} />
          ) : current.name === 'collection' ? (
            <CollectionView apiUrl={apiUrl} collectionId={current.id} onArticle={handleArticle} />
          ) : current.name === 'article' ? (
            <ArticleView apiUrl={apiUrl} articleId={current.id} />
          ) : null}
        </Panel>
      )}
      <LauncherButton open={open} onClick={() => setOpen((v) => !v)} />
    </div>
  );
}

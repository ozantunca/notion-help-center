import React from 'react';

/** Placeholder rows shown while a list loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="nhc-skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="nhc-skeleton-card">
          <div className="nhc-skeleton nhc-skeleton-line" style={{ width: `${70 - (i % 3) * 12}%` }} />
          <div className="nhc-skeleton nhc-skeleton-line nhc-skeleton-line--sm" style={{ width: `${90 - (i % 2) * 20}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Placeholder paragraph lines shown while an article loads. */
export function ArticleSkeleton() {
  const widths = [55, 100, 96, 88, 100, 70, 0, 100, 92, 60];
  return (
    <div className="nhc-skeleton-article" role="status" aria-label="Loading">
      {widths.map((w, i) =>
        w === 0 ? (
          <div key={i} className="nhc-skeleton-gap" />
        ) : (
          <div
            key={i}
            className={`nhc-skeleton nhc-skeleton-line${i === 0 ? ' nhc-skeleton-line--lg' : ''}`}
            style={{ width: `${w}%` }}
          />
        ),
      )}
    </div>
  );
}

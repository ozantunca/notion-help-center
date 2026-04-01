import React from 'react';

export interface CollectionIconProps {
  /** Emoji string, or `/media/...` / absolute `http(s)` URL from Notion (rehosted after sync). */
  icon?: string;
  className?: string;
}

const FALLBACK = '📚';

function isUrlOrMediaPath(s: string): boolean {
  return /^https?:\/\//i.test(s) || s.startsWith('/');
}

/**
 * Renders a collection icon: image for URLs, emoji text otherwise.
 */
export function CollectionIcon({ icon, className }: CollectionIconProps) {
  const wrapper = className ?? 'mb-4 flex h-14 items-center justify-center text-4xl';

  if (!icon || !icon.trim()) {
    return (
      <div className={wrapper} aria-hidden>
        {FALLBACK}
      </div>
    );
  }

  const trimmed = icon.trim();
  if (isUrlOrMediaPath(trimmed)) {
    return (
      <div className={wrapper}>
        <img
          src={trimmed}
          alt=""
          className="max-h-14 max-w-[3.5rem] object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={wrapper} aria-hidden>
      {trimmed}
    </div>
  );
}

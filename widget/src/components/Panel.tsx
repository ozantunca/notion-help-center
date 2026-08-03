import React, { useEffect, useRef } from 'react';

interface Props {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
  /** Changes whenever a different view is shown, so the body scrolls back to the top. */
  viewKey: string;
  children: React.ReactNode;
}

export function Panel({ title, canGoBack, onBack, onClose, viewKey, children }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [viewKey]);

  return (
    <div className="nhc-panel" role="dialog" aria-label="Help center">
      <div className="nhc-panel-header">
        {canGoBack && (
          <button onClick={onBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="nhc-panel-body" ref={bodyRef}>{children}</div>
    </div>
  );
}

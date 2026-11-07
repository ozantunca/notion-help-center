import React, { useEffect, useRef } from 'react';

interface Props {
  title: string;
  canGoBack: boolean;
  onBack: () => void;
  onClose: () => void;
  /** Changes whenever a different view is shown, so the body scrolls back to the top. */
  viewKey: string;
  /** True while the panel plays its exit animation. */
  closing?: boolean;
  /** Called when the exit animation ends, so the parent can unmount the panel. */
  onClosed?: () => void;
  /** Optional row pinned below the scrolling body, e.g. an escalation link. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Longer than the exit animation. Unmounts the panel even if the host page disables animations. */
const CLOSE_FALLBACK_MS = 260;

export function Panel({
  title,
  canGoBack,
  onBack,
  onClose,
  viewKey,
  closing = false,
  onClosed,
  footer,
  children,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [viewKey]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => onClosedRef.current?.(), CLOSE_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [closing]);

  return (
    <div
      className={`nhc-panel${closing ? ' nhc-panel--closing' : ''}`}
      role="dialog"
      aria-label="Help center"
      aria-hidden={closing || undefined}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) onClosedRef.current?.();
      }}
    >
      <div className="nhc-panel-header">
        {canGoBack && (
          <button className="nhc-back" onClick={onBack} aria-label="Go back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <h2 key={title}>{title}</h2>
        <button onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="nhc-panel-body" ref={bodyRef}>{children}</div>
      {footer && <div className="nhc-panel-footer">{footer}</div>}
    </div>
  );
}

import React from 'react';

interface Props {
  open: boolean;
  onClick: () => void;
}

export function LauncherButton({ open, onClick }: Props) {
  return (
    <button className="nhc-launcher" onClick={onClick} aria-label={open ? 'Close help' : 'Open help'}>
      {open ? (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
      )}
    </button>
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelpCenterWidget } from './HelpCenterWidget';

export { HelpCenterWidget };
export type { HelpCenterWidgetProps } from './HelpCenterWidget';

export function init(options: { apiUrl: string }) {
  const existing = document.getElementById('nhc-widget-root');
  const container = existing ?? document.createElement('div');
  if (!existing) {
    container.id = 'nhc-widget-root';
    document.body.appendChild(container);
  }
  createRoot(container).render(<HelpCenterWidget apiUrl={options.apiUrl} />);
}

// Auto-init when loaded via <script> tag
if (typeof document !== 'undefined') {
  const self =
    document.currentScript as HTMLScriptElement | null;
  const apiUrl = self?.dataset.apiUrl;
  if (apiUrl) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => init({ apiUrl }));
    } else {
      init({ apiUrl });
    }
  }
}

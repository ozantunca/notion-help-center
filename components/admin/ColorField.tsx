import React from 'react';

const inputClass =
  'block w-full min-w-[10rem] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

/** 6-digit hex for `<input type="color">`, or a neutral fallback. */
export function hexForColorInput(css: string): string {
  const t = css.trim();
  const full = /^#([0-9A-Fa-f]{6})$/i.exec(t);
  if (full) return `#${full[1].toLowerCase()}`;
  const short = /^#([0-9A-Fa-f]{3})$/i.exec(t);
  if (short) {
    const h = short[1];
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return '#6366f1';
}

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
};

/**
 * Swatch acts as the only visible picker target: native `<input type="color">` is invisible on top of it
 * (avoids browser-specific color control chrome). Text field accepts any CSS color / gradient.
 */
export function ColorField({ id, label, value, onChange, hint }: Props) {
  const pickerSafe = hexForColorInput(value);
  const previewBg = value.trim()
    ? value
    : 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 50% / 10px 10px';

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div
          className="group relative h-11 w-11 shrink-0 rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
          title="Click to open color picker"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-md border border-gray-300 shadow-inner"
            style={{ background: previewBg }}
            aria-hidden
          />
          <input
            id={`${id}-picker`}
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={pickerSafe}
            onChange={(e) => onChange(e.target.value.toLowerCase())}
            aria-label={`${label} — color picker`}
          />
        </div>
        <input
          id={`${id}-text`}
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4f46e5, rgb(), hsl(), or gradient"
          spellCheck={false}
          aria-label={`${label} — CSS value`}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

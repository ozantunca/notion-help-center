import React from 'react';
import type { NavLink } from '../../lib/site-config';

const inputClass =
  'block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

type Props = {
  title: string;
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
};

export function NavLinksEditor({ title, links, onChange }: Props) {
  const update = (index: number, patch: Partial<NavLink>) => {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  };

  const remove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...links,
      { label: 'New link', href: '/', external: false },
    ]);
  };

  return (
    <fieldset className="rounded-lg border border-gray-200 p-4">
      <legend className="px-1 text-sm font-medium text-gray-900">{title}</legend>
      <p className="mb-3 text-xs text-gray-500">
        Label, target URL, and whether it opens in a new tab (external).
      </p>
      <ul className="space-y-3">
        {links.map((link, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-100 bg-gray-50 p-3"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor={`nav-${title}-label-${i}`}>
                  Label
                </label>
                <input
                  id={`nav-${title}-label-${i}`}
                  className={`${inputClass} mt-0.5`}
                  value={link.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor={`nav-${title}-href-${i}`}>
                  URL
                </label>
                <input
                  id={`nav-${title}-href-${i}`}
                  className={`${inputClass} mt-0.5 font-mono text-xs`}
                  value={link.href}
                  onChange={(e) => update(i, { href: e.target.value })}
                  placeholder="/contact or https://…"
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={Boolean(link.external)}
                  onChange={(e) => update(i, { external: e.target.checked })}
                />
                Open in new tab
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-700"
      >
        + Add link
      </button>
    </fieldset>
  );
}

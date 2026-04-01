import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useCallback, useState } from 'react';
import { ColorField } from '../../components/admin/ColorField';
import { NavLinksEditor } from '../../components/admin/NavLinksEditor';
import type { NavLink, SiteConfig, SiteTheme } from '../../lib/site-config';

type Props = {
  initialConfig: SiteConfig;
  /** Shown in production so operators mount a volume on the media directory. */
  mediaPersistence?: {
    absolutePath: string;
    usesEnvOverride: boolean;
  };
};

const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const labelClass = 'block text-sm font-medium text-gray-700';

const LOGO_MAX_MB = 2;

export default function AdminPage({ initialConfig, mediaPersistence }: Props) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [headerLinks, setHeaderLinks] = useState<NavLink[]>(initialConfig.headerLinks);
  const [footerLinks, setFooterLinks] = useState<NavLink[]>(initialConfig.footerLinks);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const setTheme = useCallback((patch: Partial<SiteTheme>) => {
    setConfig((c) => ({ ...c, theme: { ...c.theme, ...patch } }));
  }, []);

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('err');
      setMessage('Choose an image file (PNG, JPEG, GIF, WebP, or SVG).');
      return;
    }
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      setStatus('err');
      setMessage(`Logo must be at most ${LOGO_MAX_MB} MB.`);
      return;
    }

    setUploadingLogo(true);
    setMessage('');
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ dataUrl }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || res.statusText);
      }
      if (!data?.url) {
        throw new Error('Invalid response');
      }
      setConfig((c) => ({ ...c, logoUrl: data.url }));
      setStatus('ok');
      setMessage('Logo uploaded. Click Save to persist all settings, or continue editing.');
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    setMessage('');

    const payload: SiteConfig = {
      ...config,
      headerLinks,
      footerLinks,
    };

    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || res.statusText);
      }
      const data = (await res.json()) as { siteConfig: SiteConfig };
      setConfig(data.siteConfig);
      setHeaderLinks(data.siteConfig.headerLinks);
      setFooterLinks(data.siteConfig.footerLinks);
      setStatus('ok');
      setMessage('Saved. Public pages will pick this up on the next request (and after client refresh).');
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const logoSrc =
    config.logoUrl &&
    (config.logoUrl.startsWith('/') || config.logoUrl.startsWith('http'))
      ? config.logoUrl
      : null;

  return (
    <>
      <Head>
        <title>Admin — Notion Help Center</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-100 py-10 px-4">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow">
          <h1 className="text-2xl font-semibold text-gray-900">Notion Help Center — settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Stored in SQLite and <code className="rounded bg-gray-100 px-1">public/site-config.json</code>.
            Remote logo URLs are saved under the media directory (
            <code className="rounded bg-gray-100 px-1">/app/media</code> when the app runs from{' '}
            <code className="rounded bg-gray-100 px-1">/app</code>, else{' '}
            <code className="rounded bg-gray-100 px-1">public/media</code>, or set{' '}
            <code className="rounded bg-gray-100 px-1">HELP_CENTER_MEDIA_DIR</code>) and served at{' '}
            <code className="rounded bg-gray-100 px-1">/media/…</code> when you save.
          </p>

          {mediaPersistence ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Logos disappear after redeploy?</p>
              <p className="mt-1 text-amber-900/90">
                Uploaded files live on disk at{' '}
                <code className="break-all rounded bg-amber-100/90 px-1 py-0.5 text-xs">
                  {mediaPersistence.absolutePath}
                </code>
                {mediaPersistence.usesEnvOverride ? (
                  <>
                    {' '}
                    (from <code className="rounded bg-amber-100/90 px-1">HELP_CENTER_MEDIA_DIR</code>).
                  </>
                ) : mediaPersistence.absolutePath === '/app/media' ? (
                  <>
                    {' '}
                    (default for <code className="rounded bg-amber-100/90 px-1">WORKDIR /app</code>: mount a volume on{' '}
                    <code className="rounded bg-amber-100/90 px-1">/app/media</code>).
                  </>
                ) : (
                  <>
                    {' '}
                    (default <code className="rounded bg-amber-100/90 px-1">public/media</code> under the working
                    directory).
                  </>
                )}{' '}
                SQLite still has your <code className="rounded bg-amber-100/90 px-1">logoUrl</code>, but the file must
                exist on a <strong>persistent volume</strong> at that path.
              </p>
              <p className="mt-2 text-amber-900/90">
                Mount storage there (or set <code className="rounded bg-amber-100/90 px-1">HELP_CENTER_MEDIA_DIR</code>{' '}
                to a mounted path). See <strong>docs/DOCKER.md</strong> and the Deployment section in{' '}
                <strong>README.md</strong>.
              </p>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-8 space-y-8">
            <div>
              <label className={labelClass} htmlFor="brandName">
                Brand name
              </label>
              <input
                id="brandName"
                className={inputClass}
                value={config.brandName}
                onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
              />
            </div>

            <fieldset className="rounded-lg border border-gray-200 p-4">
              <legend className="px-1 text-sm font-medium text-gray-900">Logo</legend>
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="px-2 text-center text-xs text-gray-400">No logo</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className={labelClass} htmlFor="logoFile">
                      Upload image
                    </label>
                    <input
                      id="logoFile"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                      className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                      onChange={onLogoFile}
                      disabled={uploadingLogo}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPEG, GIF, WebP, or SVG — max {LOGO_MAX_MB} MB. Upload updates the field below; save the form
                      when you are done.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="logoUrl">
                      Logo URL or path
                    </label>
                    <input
                      id="logoUrl"
                      className={inputClass}
                      placeholder="https://… or /media/…"
                      value={config.logoUrl ?? ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          logoUrl: e.target.value.trim() || undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <div>
              <label className={labelClass} htmlFor="logoAlt">
                Logo alt text
              </label>
              <input
                id="logoAlt"
                className={inputClass}
                value={config.logoAlt}
                onChange={(e) => setConfig({ ...config, logoAlt: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="mainSiteUrl">
                Main site URL
              </label>
              <input
                id="mainSiteUrl"
                className={inputClass}
                value={config.mainSiteUrl}
                onChange={(e) => setConfig({ ...config, mainSiteUrl: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="supportEmail">
                Support email
              </label>
              <input
                id="supportEmail"
                type="email"
                className={inputClass}
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="seoTitleSuffix">
                SEO title suffix
              </label>
              <input
                id="seoTitleSuffix"
                className={inputClass}
                value={config.seoTitleSuffix}
                onChange={(e) => setConfig({ ...config, seoTitleSuffix: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="seoDefaultDescription">
                SEO default description
              </label>
              <textarea
                id="seoDefaultDescription"
                rows={3}
                className={inputClass}
                value={config.seoDefaultDescription}
                onChange={(e) => setConfig({ ...config, seoDefaultDescription: e.target.value })}
              />
            </div>

            <NavLinksEditor title="Header navigation" links={headerLinks} onChange={setHeaderLinks} />
            <NavLinksEditor title="Footer navigation" links={footerLinks} onChange={setFooterLinks} />

            <fieldset className="space-y-5 rounded-lg border border-gray-200 p-4">
              <legend className="px-1 text-sm font-medium text-gray-900">Theme</legend>
              <p className="text-xs text-gray-500">
                Click the swatch to open the system color picker (sets hex). Use the text field for any CSS color or
                gradient.
              </p>
              <ColorField
                id="primary"
                label="Primary color"
                value={config.theme.primaryColor}
                onChange={(v) => setTheme({ primaryColor: v })}
              />
              <ColorField
                id="primaryHover"
                label="Primary hover"
                value={config.theme.primaryHoverColor}
                onChange={(v) => setTheme({ primaryHoverColor: v })}
              />
              <ColorField
                id="heroFrom"
                label="Hero gradient — from"
                value={config.theme.heroGradientFrom}
                onChange={(v) => setTheme({ heroGradientFrom: v })}
                hint="Often a hex; can match CSS used in the hero background."
              />
              <ColorField
                id="heroVia"
                label="Hero gradient — via"
                value={config.theme.heroGradientVia}
                onChange={(v) => setTheme({ heroGradientVia: v })}
              />
              <ColorField
                id="heroTo"
                label="Hero gradient — to"
                value={config.theme.heroGradientTo}
                onChange={(v) => setTheme({ heroGradientTo: v })}
              />
            </fieldset>

            {message && (
              <p
                className={
                  status === 'err' ? 'text-sm text-red-600' : 'text-sm text-green-700'
                }
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'saving' || uploadingLogo}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Save all settings'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const { loadSiteConfig } = await import('../../lib/help-data');
  const { getHelpMediaDir } = await import('../../lib/media-dir');
  const initialConfig = loadSiteConfig();
  const props: Props = {
    initialConfig: JSON.parse(JSON.stringify(initialConfig)) as SiteConfig,
  };
  if (process.env.NODE_ENV === 'production') {
    props.mediaPersistence = {
      absolutePath: getHelpMediaDir(),
      usesEnvOverride: Boolean(process.env.HELP_CENTER_MEDIA_DIR?.trim()),
    };
  }
  return { props: props };
};

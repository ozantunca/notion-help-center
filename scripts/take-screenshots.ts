/**
 * Capture the README screenshots from the demo content.
 *
 *   pnpm run e2e:prepare          # seed demo content, build the widget and the site
 *   pnpm start --port 3100 &      # or any running server
 *   pnpm run screenshots
 *
 * Set SCREENSHOT_URL to use another server (default http://localhost:3100).
 * Writes PNG files to docs/screenshots/.
 */
import * as path from 'path';
import { chromium, type Page } from '@playwright/test';

const BASE_URL = (process.env.SCREENSHOT_URL ?? 'http://localhost:3100').replace(/\/+$/, '');
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const VIEWPORT = { width: 1280, height: 860 };

/** Wait for entrance animations to end so the capture shows the final state. */
const settle = (page: Page) => page.waitForTimeout(1500);

/** A neutral page that stands in for "your website" behind the widget. */
const WIDGET_HOST_HTML = `<!doctype html><html><head><style>
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
  nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: white; border-bottom: 1px solid #e2e8f0; }
  .logo { font-weight: 700; font-size: 18px; } .links span { margin-left: 28px; color: #64748b; font-size: 14px; }
  main { max-width: 720px; padding: 96px 48px; }
  h1 { font-size: 44px; line-height: 1.1; margin: 0 0 16px; letter-spacing: -0.02em; }
  p { font-size: 18px; color: #475569; margin: 0 0 32px; }
  .cta { display: inline-block; padding: 12px 22px; border-radius: 10px; background: #0f172a; color: white; font-weight: 600; }
  .bar { height: 12px; border-radius: 6px; background: #e2e8f0; margin: 14px 0; }
</style></head><body>
  <nav><span class="logo">Your product</span><span class="links"><span>Features</span><span>Pricing</span><span>Docs</span></span></nav>
  <main>
    <h1>Your website,<br>with help one click away</h1>
    <p>The widget loads from your help center with one script tag.</p>
    <span class="cta">Get started</span>
    <div style="margin-top:72px"><div class="bar" style="width:90%"></div><div class="bar" style="width:75%"></div><div class="bar" style="width:82%"></div></div>
  </main>
  <script src="${BASE_URL}/widget.js" data-api-url="${BASE_URL}"></script>
</body></html>`;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const shot = async (name: string, options: { fullPage?: boolean } = {}) => {
    const file = path.join(OUT_DIR, name);
    await page.screenshot({ path: file, ...options });
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  };

  // Home page, whole length.
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await settle(page);
  await shot('help-center-home.png', { fullPage: true });

  // Search as you type, with the first result selected.
  const box = page.getByRole('combobox', { name: 'Search articles' });
  await box.fill('notion');
  await page.getByRole('listbox', { name: 'Search results' }).waitFor();
  await box.press('ArrowDown');
  await page.waitForTimeout(400);
  await shot('help-center-search.png');

  // An article with a callout, an outline and the sidebar.
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /How the help center works/ }).click();
  await page.getByRole('heading', { level: 1, name: 'How the help center works' }).waitFor();
  await settle(page);
  await shot('help-center-article.png');

  // The widget, open on a stand-in host page. Playwright answers the request,
  // so the page shares the help center's origin and needs no CORS setup.
  await page.route(`${BASE_URL}/__screenshot-host`, (route) =>
    route.fulfill({ contentType: 'text/html', body: WIDGET_HOST_HTML }),
  );
  await page.goto(`${BASE_URL}/__screenshot-host`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open help' }).click();
  await page.getByRole('dialog', { name: 'Help center' }).getByText('Suggested articles').waitFor();
  await page.mouse.move(0, 0);
  await settle(page);
  await shot('widget.png');

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

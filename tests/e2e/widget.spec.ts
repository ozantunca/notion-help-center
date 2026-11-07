import { expect, test, type Page } from '@playwright/test';

/**
 * A bare host page on the help center's origin (so no CORS setup is needed).
 * The request never reaches the server; Playwright answers it.
 */
const HOST_PATH = '/__widget-host';

async function loadWidget(page: Page, extraCss = '') {
  const origin = new URL(test.info().project.use.baseURL!).origin;
  await page.route(`**${HOST_PATH}`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><style>${extraCss}</style></head>
        <body><h1>Host site</h1>
        <script src="/widget.js" data-api-url="${origin}"></script></body></html>`,
    }),
  );
  await page.goto(HOST_PATH);
  await expect(page.getByRole('button', { name: 'Open help' })).toBeVisible();
}

const panel = (page: Page) => page.getByRole('dialog', { name: 'Help center' });

test('opens on the home view with suggestions and topics', async ({ page }) => {
  await loadWidget(page);
  await page.getByRole('button', { name: 'Open help' }).click();
  await expect(panel(page).getByRole('heading', { name: 'Notion Help Center' })).toBeVisible();
  await expect(panel(page).getByText('Suggested articles')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: /Deploy with Docker/ })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: /Customization/ })).toBeVisible();
});

test('opens an article and goes back', async ({ page }) => {
  await loadWidget(page);
  await page.getByRole('button', { name: 'Open help' }).click();
  await panel(page).getByRole('button', { name: /How the help center works/ }).click();

  await expect(panel(page).getByRole('heading', { name: 'How the help center works' })).toBeVisible();
  await expect(panel(page).locator('.nhc-article-content .callout')).toBeVisible();

  await panel(page).getByRole('button', { name: 'Go back' }).click();
  await expect(panel(page).getByText('Suggested articles')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Go back' })).toHaveCount(0);
});

test('lists the articles of a topic', async ({ page }) => {
  await loadWidget(page);
  await page.getByRole('button', { name: 'Open help' }).click();
  await panel(page).getByRole('button', { name: /Getting Started/ }).click();
  await expect(panel(page).getByRole('heading', { name: 'Getting Started' })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: /Use a custom domain/ })).toBeVisible();
});

test('searches and keeps the query while an article is open', async ({ page }) => {
  await loadWidget(page);
  await page.getByRole('button', { name: 'Open help' }).click();
  const input = panel(page).getByRole('searchbox', { name: 'Search help articles' });
  await input.fill('docker');
  await expect(panel(page).getByRole('heading', { name: 'Search results' })).toBeVisible();
  await panel(page).getByRole('button', { name: /Deploy with Docker/ }).click();
  await expect(panel(page).getByRole('heading', { name: 'Deploy with Docker' })).toBeVisible();
  await expect(input).toHaveValue('docker');
});

test.describe('closing', () => {
  test('removes the panel after the exit animation', async ({ page }) => {
    await loadWidget(page);
    await page.getByRole('button', { name: 'Open help' }).click();
    await expect(panel(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close help' }).click();
    await expect(page.locator('.nhc-panel')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open help' })).toBeVisible();
  });

  test('the header close button also closes it', async ({ page }) => {
    await loadWidget(page);
    await page.getByRole('button', { name: 'Open help' }).click();
    await panel(page).getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('.nhc-panel')).toHaveCount(0);
  });

  test('reopening during the exit animation keeps the panel open', async ({ page }) => {
    await loadWidget(page);
    const launcher = page.locator('.nhc-launcher');
    await launcher.click();
    await expect(panel(page)).toBeVisible();
    await launcher.click();
    await launcher.click();
    await page.waitForTimeout(400);
    await expect(panel(page)).toBeVisible();
    await expect(page.locator('.nhc-panel--closing')).toHaveCount(0);
  });

  test('works when the visitor asks for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await loadWidget(page);
    await page.getByRole('button', { name: 'Open help' }).click();
    await expect(panel(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close help' }).click();
    await expect(page.locator('.nhc-panel')).toHaveCount(0);
  });

  test('works when the host page turns animations off', async ({ page }) => {
    await loadWidget(page, '* { animation: none !important; }');
    await page.getByRole('button', { name: 'Open help' }).click();
    await expect(panel(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close help' }).click();
    await expect(page.locator('.nhc-panel')).toHaveCount(0);
  });
});

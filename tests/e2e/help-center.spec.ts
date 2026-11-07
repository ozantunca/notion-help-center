import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('shows categories and suggested articles', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /How can we help/ })).toBeVisible();
    for (const name of ['Getting Started', 'Writing in Notion', 'Customization']) {
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /Deploy with Docker/ })).toBeVisible();
  });

  test('opens a category', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Getting Started/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Getting Started' })).toBeVisible();
    await expect(page.getByText('5 articles · 2 sections')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Deployment' })).toBeVisible();
  });

  test('has no horizontal scroll at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});

test.describe('search box', () => {
  test('shows results while typing and opens one with the keyboard', async ({ page }) => {
    await page.goto('/');
    const box = page.getByRole('combobox', { name: 'Search articles' });
    await box.fill('deplo');
    const results = page.getByRole('listbox', { name: 'Search results' });
    await expect(results.getByRole('option', { name: /Deploy with Docker/ })).toBeVisible();

    await box.press('ArrowDown');
    await box.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Deploy with Docker' })).toBeVisible();
  });

  test('suggests popular articles when nothing matches', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Search articles' }).fill('qwertyzzz');
    await expect(page.getByText(/No articles match/)).toBeVisible();
    await expect(page.getByText('Popular articles')).toBeVisible();
  });

  test('"/" focuses the search box', async ({ page }) => {
    await page.goto('/');
    await page.locator('body').click({ position: { x: 5, y: 500 } });
    await page.keyboard.press('/');
    await expect(page.getByRole('combobox', { name: 'Search articles' })).toBeFocused();
  });
});

test.describe('search page', () => {
  test('lists results for a query', async ({ page }) => {
    await page.goto('/search?q=docker');
    await expect(page.getByRole('heading', { level: 1, name: /result.* for “docker”/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Deploy with Docker/ })).toBeVisible();
  });

  test('explains an empty result and suggests articles', async ({ page }) => {
    await page.goto('/search?q=qwertyzzz');
    await expect(page.getByRole('heading', { level: 1, name: 'No results for “qwertyzzz”' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular articles' })).toBeVisible();
  });
});

test.describe('article page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /How the help center works/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'How the help center works' })).toBeVisible();
  });

  test('renders the Notion blocks and the outline', async ({ page }) => {
    await expect(page.locator('.article-body .callout')).toBeVisible();
    const outline = page.getByRole('navigation', { name: 'On this page' });
    await expect(outline.getByRole('link', { name: 'Connect Notion' })).toBeVisible();
    await expect(page.locator('h2#connect-notion')).toBeVisible();
  });

  test('marks the current article in the sidebar', async ({ page }) => {
    const sidebar = page.getByRole('navigation', { name: 'Articles in Getting Started' });
    await expect(sidebar.locator('[aria-current="page"]')).toHaveText('How the help center works');
  });

  test('sends feedback', async ({ page }) => {
    let body: unknown;
    // Answer in the browser so the test does not write to the database.
    await page.route('**/api/feedback', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.getByRole('button', { name: 'Yes, helpful' }).click();
    await expect(page.getByText('Thank you for your feedback!')).toBeVisible();
    expect(body).toMatchObject({ rating: 'positive' });
  });

  test('asks for a comment on negative feedback', async ({ page }) => {
    await page.route('**/api/feedback', (route) => route.fulfill({ status: 200, json: { ok: true } }));
    await page.getByRole('button', { name: 'No, not helpful' }).click();
    await page.getByPlaceholder('Optional feedback...').fill('Needs a screenshot');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Thank you for your feedback!')).toBeVisible();
  });
});

test('contact page links to support', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact Us' })).toBeVisible();
});

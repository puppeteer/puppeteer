# Scraping patterns and common pitfalls

This guide covers practical patterns for building reliable scrapers with
Puppeteer, based on behaviors that are easy to miss until they cause production
issues.

## `evaluate` vs `evaluateHandle` — choosing the right tool

[`page.evaluate()`](https://pptr.dev/api/puppeteer.page.evaluate) serializes
its return value to JSON before handing it back to your script. This has one
important consequence: if the page becomes unresponsive (for example, it is
stuck loading a CAPTCHA challenge or an auth redirect), the call respects your
configured `defaultTimeout` and throws a `TimeoutError`.

[`page.evaluateHandle()`](https://pptr.dev/api/puppeteer.page.evaluatehandle)
returns a live `JSHandle` — a reference that stays connected to the page
context. Because the handle itself is returned before the value is serialized,
the call can hang indefinitely on an unresponsive page, bypassing your timeout
settings.

**Rule of thumb:** use `page.evaluate()` whenever you only need a serializable
value (string, number, boolean, plain object, array). Reserve
`page.evaluateHandle()` for cases where you genuinely need a live reference —
for example, when you want to call `.screenshot()` on an element handle.

```ts
// ✅ Serializable value — evaluate() is correct and respects timeouts
const href = await page.evaluate(() => {
  const link = document.querySelector('a.result');
  return link ? link.href : null;
});

// ✅ Live reference needed — evaluateHandle() is correct here
const elementHandle = await page.evaluateHandle(() => {
  return document.querySelector('.review-card');
});
await elementHandle.screenshot({ path: 'card.jpg' });

// ⚠️ Common mistake: using evaluateHandle to return a plain string
// This can hang on an unresponsive page and bypass your timeout
const href2 = await page.evaluateHandle(() => {
  const link = document.querySelector('a.result');
  return link ? link.href : null; // returns a JSHandle<string>, not a string
});
```

When you need an `ElementHandle` for a specific element you already found
inside `evaluate()`, a reliable pattern is to mark it with a temporary
`data-*` attribute and then query it from the outside:

```ts
// Step 1 — find and mark the target element inside evaluate()
const found = await page.evaluate((snippet: string) => {
  const el = Array.from(document.querySelectorAll('article')).find(
    node => (node.textContent ?? '').includes(snippet),
  );
  if (!el) return false;
  el.setAttribute('data-pptr-target', 'true');
  return true;
}, targetSnippet);

// Step 2 — get the ElementHandle via the marker
if (found) {
  const handle = await page.$('[data-pptr-target]');
  // Clean up the marker before taking the screenshot
  await page.evaluate(() => {
    document.querySelector('[data-pptr-target]')?.removeAttribute('data-pptr-target');
  });
  await handle?.screenshot({ path: 'target.jpg' });
}
```

## Filtering leaf elements when multiple ancestors match

`document.querySelectorAll` returns every element that matches a selector,
including parent nodes that happen to also match. In scrapers this often means
receiving the same logical item multiple times at different levels of the DOM
hierarchy.

To keep only the innermost (leaf) nodes:

```ts
const items = await page.evaluate(() => {
  const candidates = Array.from(
    document.querySelectorAll('.review, [class*="review"]'),
  );

  // Discard any node that contains another candidate — keep only leaves
  const leaves = candidates.filter(
    node => !candidates.some(other => other !== node && node.contains(other)),
  );

  return leaves.map(el => el.textContent?.trim() ?? '');
});
```

This is especially useful on pages where structural markup wraps repeated
items inside container elements that share the same class names.

## Detecting auth walls and login redirects

Some pages redirect to a login screen silently, returning HTTP 200 with a login
form rather than a 3xx status code. Puppeteer does not throw in this case, so
you need to check explicitly.

```ts
await page.goto('https://example.com/protected', {
  waitUntil: 'domcontentloaded',
});

const url = page.url();
const isAuthWall =
  url.includes('/login') ||
  url.includes('/signin') ||
  url.includes('authwall') ||
  url.includes('auth/redirect');

const hasLoginModal = await page
  .$('#login-modal, [data-testid="login-dialog"]')
  .catch(() => null);

if (isAuthWall || hasLoginModal) {
  // Handle gracefully: skip, retry with credentials, or surface an error
  throw new Error(`Auth wall detected on ${url}`);
}
```

## Setting a defensive page timeout after navigation

`page.setDefaultTimeout()` applies to all subsequent operations on the page.
Setting a tighter timeout right after navigating to a page that might be slow
or stuck (for example, after following a redirect to an unknown domain) prevents
individual `waitForSelector` or `evaluate` calls from blocking your entire
pipeline:

```ts
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

// Tighten the timeout for all subsequent calls on this page
page.setDefaultTimeout(15_000);

// Any operation that takes longer than 15 s will now throw a TimeoutError
// instead of waiting for the global default (typically 30 s)
const title = await page.evaluate(() => document.title);
```

This is particularly useful in long-running scraping loops where a single
stuck page would otherwise delay every subsequent item.

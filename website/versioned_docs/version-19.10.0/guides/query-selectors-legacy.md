# Query Selectors (legacy)

Queries are the primary mechanism for interacting with the DOM on your site. For example, a typical workflow goes like:

```ts
// Import puppeteer
import puppeteer from 'puppeteer';

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch();

  // Create a page
  const page = await browser.newPage();

  // Go to your site
  await page.goto('YOUR_SITE');

  // Query for an element handle.
  const element = await page.waitForSelector('div > .class-name');

  // Do something with element...
  await element.click(); // Just an example.

  // Dispose of handle
  await element.dispose();

  // Close browser.
  await browser.close();
})();
```

## CSS

CSS selectors follow the CSS spec of the browser being automated. We provide some basic type deduction for CSS selectors (such as `HTMLInputElement` for `input`), but any selector that contains no type information (such as `.class-name`) will need to be coerced manually using TypeScript's `as` coercion mechanism.

### Example

```ts
// Automatic
const element = await page.waitForSelector('div > input');
// Manual
const element = (await page.waitForSelector(
  'div > .class-name-for-input'
)) as HTMLInputElement;
```

## Built-in selectors

Built-in selectors are Puppeteer's own class of selectors for doing things CSS cannot. Every built-in selector starts with a prefix `.../` to assist Puppeteer in distinguishing between CSS selectors and a built-in.

### Text selectors (`text/`)

Text selectors will select "minimal" elements containing the given text, even within (open) shadow roots. Here, "minimum" means the deepest elements that contain a given text, but not their parents (which technically will also contain the given text).

#### Example

```ts
// Note we usually need type coercion since the type cannot be deduced, but for text selectors, `instanceof` checks may be better for runtime validation.
const element = await page.waitForSelector('text/My name is Jun');
```

### XPath selectors (`xpath/`)

XPath selectors will use the browser's native [`Document.evaluate`](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) to query for elements.

#### Example

```ts
// There is not type deduction for XPaths.
const node = await page.waitForSelector('xpath/h2');
```

### ARIA selectors (`aria/`)

ARIA selectors can be used to find elements with a given ARIA label. These labels are computed using Chrome's internal representation.

#### Example

```ts
const node = await page.waitForSelector('aria/Button name');
```

### Pierce selectors (`pierce/`)

Pierce selectors will run the `querySelector*` API on the document and all shadow roots to find an element.

:::danger

Selectors will **not** _partially_ pierce through shadow roots. See the examples below.

:::

#### Example

Suppose the HTML is

```html
<div>
  <custom-element>
    <div></div>
  </custom-element>
</div>
```

Then

```ts
// This will be two elements because of the outer and inner div.
expect((await page.$$('pierce/div')).length).toBe(2);

// Partial piercing doesn't work.
expect((await page.$$('pierce/div div')).length).toBe(0);
```

## Custom selectors

Puppeteer provides users the ability to add their own query selectors to Puppeteer using [Puppeteer.registerCustomQueryHandler](../api/puppeteer.registercustomqueryhandler.md). This is useful for creating custom selectors based on framework objects or other vendor-specific objects.

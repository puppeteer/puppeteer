# Query Selectors

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

## `P` Selectors

Puppeteer uses a superset of the CSS selector syntax for querying. We call this syntax _P selectors_ and it's supercharged with extra capabilities such as deep combinators and text selection.

:::caution

Although P selectors look like real CSS selectors (we intentionally designed it this way), they should not be used for actually CSS styling. They are designed only for Puppeteer.

:::

:::note

P selectors only work on the first "depth" of selectors; for example, `:is(div >>> a)` will not work.

:::

### `>>>` and `>>>>` combinators

The `>>>` and `>>>>` are called _deep descendent_ and _deep_ combinators respectively. Both combinators have the effect of going into shadow hosts with `>>>` going into every shadow host under a node and `>>>>` going into the immediate one (if the node is a shadow host; otherwise, it's a no-op).

:::note

A common question is when should `>>>>` be chosen over `>>>` considering the flexibility of `>>>`. A similar question can be asked about `>` and a space; choose `>` if you do not need to query all elements under a given node and a space otherwise. This answer extends to `>>>>` (`>`) and `>>>` (space) naturally.

:::

#### Example

Suppose we have the markup

```html
<custom-element>
  <template shadowrootmode="open">
    <slot></slot>
  </template>
  <custom-element>
    <template shadowrootmode="open">
      <slot></slot>
    </template>
    <custom-element>
      <template shadowrootmode="open">
        <slot></slot>
      </template>
      <h2>Light content</h2>
    </custom-element>
  </custom-element>
</custom-element>
```

Then `custom-element >>> h2` will return `h2`, but `custom-element >>>> h2` will return nothing since the inner `h2` is in a deeper shadow root.

### `P`-elements

`P` elements are [pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements) with a `-p` vendor prefix. It allows you to enhance your selectors with Puppeteer-specific query engines such as XPath, text queries, and ARIA.

#### Text selectors (`-p-text`)

Text selectors will select "minimal" elements containing the given text, even within (open) shadow roots. Here, "minimum" means the deepest elements that contain a given text, but not their parents (which technically will also contain the given text).

##### Example

```ts
const element = await page.waitForSelector('div ::-p-text(My name is Jun)');
// You can also use escapes.
const element = await page.waitForSelector(
  ':scope >>> ::-p-text(My name is Jun \\(pronounced like "June"\\))'
);
// or quotes
const element = await page.waitForSelector(
  'div >>>> ::-p-text("My name is Jun (pronounced like \\"June\\")"):hover'
);
```

#### XPath selectors (`-p-xpath`)

XPath selectors will use the browser's native [`Document.evaluate`](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) to query for elements.

##### Example

```ts
const element = await page.waitForSelector('::-p-xpath(h2)');
```

#### ARIA selectors (`-p-aria`)

ARIA selectors can be used to find elements with a given ARIA label. These labels are computed using Chrome's internal representation.

##### Example

```ts
const node = await page.waitForSelector('::-p-aria(Submit)');
```

### Custom selectors

Puppeteer provides users the ability to add their own query selectors to Puppeteer using [Puppeteer.registerCustomQueryHandler](../api/puppeteer.registercustomqueryhandler.md). This is useful for creating custom selectors based on framework objects or other vendor-specific objects.

#### Example

Suppose you register a custom selector called `lit`. You can use it like so:

```ts
const node = await page.waitForSelector('::-p-lit(LitElement)');
```

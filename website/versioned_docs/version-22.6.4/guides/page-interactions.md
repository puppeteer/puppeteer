# Page interactions

Puppeteer allows you interact with the pages in various ways.

## Locators

Locators is a new, experimental API that combines the functionalities of
waiting and actions. With additional precondition checks, it
enables automatic retries for failed actions, resulting in more reliable and
less flaky automation scripts.

:::note

Locators API is experimental and we will not follow semver for breaking changes
in the Locators API.

:::

### Use cases

#### Waiting for an element

```ts
await page.locator('button').wait();
```

The following preconditions are automatically checked:

- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.

#### Waiting for a function

```ts
await page
  .locator(() => {
    let resolve!: (node: HTMLCanvasElement) => void;
    const promise = new Promise(res => {
      return (resolve = res);
    });
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.target instanceof HTMLCanvasElement) {
          resolve(record.target);
        }
      }
    });
    observer.observe(document);
    return promise;
  })
  .wait();
```

#### Clicking an element

```ts
await page.locator('button').click();
```

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Clicking an element matching a criteria

```ts
await page
  .locator('button')
  .filter(button => !button.disabled)
  .click();
```

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Filling out an input

```ts
await page.locator('input').fill('value');
```

Automatically detects the input type and choose an appropriate way to fill it out with the provided value.

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Retrieving an element property

```ts
const enabled = await page
  .locator('button')
  .map(button => !button.disabled)
  .wait();
```

#### Hover over an element

```ts
await page.locator('div').hover();
```

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Scroll an element

```ts
await page.locator('div').scroll({
  scrollLeft: 10,
  scrollTop: 20,
});
```

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

### Configuring locators

Locators can be configured to tune configure the preconditions and other other options:

```ts
await page
  .locator('button')
  .setEnsureElementIsInTheViewport(false)
  .setTimeout(0)
  .setVisibility(null)
  .setWaitForEnabled(false)
  .setWaitForStableBoundingBox(false)
  .click();
```

### Getting locator events

Currently, locators support a single event that notifies you when the locator is about to perform the action:

```ts
let willClick = false;
await page
  .locator('button')
  .on(LocatorEvent.Action, () => {
    willClick = true;
  })
  .click();
```

This event can be used for logging/debugging or other purposes. The event might
fire multiple times if the locator retries the action.

## Query Selectors

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

### `P` Selectors

Puppeteer uses a superset of the CSS selector syntax for querying. We call this syntax _P selectors_ and it's supercharged with extra capabilities such as deep combinators and text selection.

:::caution

Although P selectors look like real CSS selectors (we intentionally designed it this way), they should not be used for actually CSS styling. They are designed only for Puppeteer.

:::

:::note

P selectors only work on the first "depth" of selectors; for example, `:is(div >>> a)` will not work.

:::

#### `>>>` and `>>>>` combinators

The `>>>` and `>>>>` are called _deep descendent_ and _deep_ combinators respectively. Both combinators have the effect of going into shadow hosts with `>>>` going into every shadow host under a node and `>>>>` going into the immediate one (if the node is a shadow host; otherwise, it's a no-op).

:::note

A common question is when should `>>>>` be chosen over `>>>` considering the flexibility of `>>>`. A similar question can be asked about `>` and a space; choose `>` if you do not need to query all elements under a given node and a space otherwise. This answer extends to `>>>>` (`>`) and `>>>` (space) naturally.

:::

##### Example

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

> Note: `<template shadowrootmode="open">` is not supported on Firefox.
> You can read more about it [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template#attributes).

Then `custom-element >>> h2` will return `h2`, but `custom-element >>>> h2` will return nothing since the inner `h2` is in a deeper shadow root.

#### `P`-elements

`P` elements are [pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements) with a `-p` vendor prefix. It allows you to enhance your selectors with Puppeteer-specific query engines such as XPath, text queries, and ARIA.

##### Text selectors (`-p-text`)

Text selectors will select "minimal" elements containing the given text, even within (open) shadow roots. Here, "minimum" means the deepest elements that contain a given text, but not their parents (which technically will also contain the given text).

###### Example

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

##### XPath selectors (`-p-xpath`)

XPath selectors will use the browser's native [`Document.evaluate`](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) to query for elements.

###### Example

```ts
const element = await page.waitForSelector('::-p-xpath(h2)');
```

##### ARIA selectors (`-p-aria`)

ARIA selectors can be used to find elements with a given ARIA label. These labels are computed using Chrome's internal representation.

###### Example

```ts
const node = await page.waitForSelector('::-p-aria(Submit)');
const node = await page.waitForSelector(
  '::-p-aria([name="Click me"][role="button"])'
);
```

#### Custom selectors

Puppeteer provides users the ability to add their own query selectors to Puppeteer using [Puppeteer.registerCustomQueryHandler](../api/puppeteer.registercustomqueryhandler.md). This is useful for creating custom selectors based on framework objects or other vendor-specific objects.

##### Custom Selectors

You can register a custom query handler that allows you to create custom selectors. For example, define a query handler for `getById` selectors:

```ts
Puppeteer.registerCustomQueryHandler('getById', {
  queryOne: (elementOrDocument, selector) => {
    return elementOrDocument.querySelector(`[id="${CSS.escape(selector)}"]`);
  },
  // Note: for demonstation perpose only `id` should be page unique
  queryAll: (elementOrDocument, selector) => {
    return elementOrDocument.querySelectorAll(`[id="${CSS.escape(selector)}"]`);
  },
});
```

You can now use it as following:

```ts
const node = await page.waitForSelector('::-p-getById(elementId)');
// OR used in conjunction with other selectors
const moreSpecificNode = await page.waitForSelector(
  '.side-bar ::-p-getById(elementId)'
);
```

##### Custom framework components selector

:::caution

Be careful when relying on internal APIs of libraries or frameworks. They can change at any time.

:::

Find Vue components by name by using Vue internals for querying:

```ts
Puppeteer.registerCustomQueryHandler('vue', {
  queryOne: (element, name) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
    do {
      const currentNode = walker.currentNode;
      if (
        currentNode.__vnode?.ctx?.type?.name.toLowerCase() ===
        name.toLocaleLowerCase()
      ) {
        return currentNode;
      }
    } while (walker.nextNode());

    return null;
  },
});
```

Query the Vue component as following:

```ts
const element = await page.$('::-p-vue(MyComponent)');
```

##### Web Components

Web Components create their own tag so you can query them by the tag name:

```ts
const element = await page.$('my-web-component');
```

Extend `HTMLElementTagNameMap` to define types for custom tags. This allows Puppeteer to infer the return type for the ElementHandle:

```ts
declare global {
  interface HTMLElementTagNameMap {
    'my-web-component': MyWebComponent;
  }
}
```

## Query Selectors (legacy)

:::caution

While we maintin prefixed selectors, the recommended way is to use the selector syntax documented above.

:::

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

### CSS

CSS selectors follow the CSS spec of the browser being automated. We provide some basic type deduction for CSS selectors (such as `HTMLInputElement` for `input`), but any selector that contains no type information (such as `.class-name`) will need to be coerced manually using TypeScript's `as` coercion mechanism.

#### Example

```ts
// Automatic
const element = await page.waitForSelector('div > input');
// Manual
const element = (await page.waitForSelector(
  'div > .class-name-for-input'
)) as HTMLInputElement;
```

### Built-in selectors

Built-in selectors are Puppeteer's own class of selectors for doing things CSS cannot. Every built-in selector starts with a prefix `.../` to assist Puppeteer in distinguishing between CSS selectors and a built-in.

#### Text selectors (`text/`)

Text selectors will select "minimal" elements containing the given text, even within (open) shadow roots. Here, "minimum" means the deepest elements that contain a given text, but not their parents (which technically will also contain the given text).

##### Example

```ts
// Note we usually need type coercion since the type cannot be deduced, but for text selectors, `instanceof` checks may be better for runtime validation.
const element = await page.waitForSelector('text/My name is Jun');
```

#### XPath selectors (`xpath/`)

XPath selectors will use the browser's native [`Document.evaluate`](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) to query for elements.

##### Example

```ts
// There is not type deduction for XPaths.
const node = await page.waitForSelector('xpath/h2');
```

#### ARIA selectors (`aria/`)

ARIA selectors can be used to find elements with a given ARIA label. These labels are computed using Chrome's internal representation.

##### Example

```ts
const node = await page.waitForSelector('aria/Button name');
```

#### Pierce selectors (`pierce/`)

Pierce selectors will run the `querySelector*` API on the document and all shadow roots to find an element.

:::danger

Selectors will **not** _partially_ pierce through shadow roots. See the examples below.

:::

##### Example

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

### Custom selectors

Puppeteer provides users the ability to add their own query selectors to Puppeteer using [Puppeteer.registerCustomQueryHandler](../api/puppeteer.registercustomqueryhandler.md). This is useful for creating custom selectors based on framework objects or other vendor-specific objects.

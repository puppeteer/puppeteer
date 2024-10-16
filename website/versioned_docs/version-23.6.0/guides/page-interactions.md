# Page interactions

Puppeteer allows interacting with elements on the page through mouse, touch
events and keyboard input. Usually you first query a DOM element using a [CSS
selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors) and
then invoke an action on the selected element. All of Puppeteer APIs that accept
a selector, accept a [CSS
selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors) by
default. Additionally, Puppeteer offers [custom selector syntax](#selectors) that allows
finding elements using XPath, Text, Accessibility attributes and accessing
Shadow DOM without the need to execute JavaScript.

If you want to emit mouse or
keyboard events without selecting an element first, use the
[`page.mouse`](https://pptr.dev/api/puppeteer.mouse),
[`page.keyboard`](https://pptr.dev/api/puppeteer.keyboard) and
[`page.touchscreen`](https://pptr.dev/api/puppeteer.touchscreen) APIs. The rest
of this guide, gives an overview on how to select DOM elements and invoke
actions on them.

## Locators

Locators is the recommended way to select an element and interact with it.
Locators encapsulate the information on how to select an element and they allow
Puppeteer to automatically wait for the element to be present in the DOM and to
be in the right state for the action. You always instantiate a locator using the
[`page.locator()`](https://pptr.dev/api/puppeteer.page.locator) or
[`frame.locator()`](https://pptr.dev/api/puppeteer.frame.locator) function. If
the locator API doesn't offer a functionality you need, you can still use lower
level APIs such as
[`page.waitForSelector()`](https://pptr.dev/api/puppeteer.page.waitforselector/)
or [`ElementHandle`](https://pptr.dev/api/puppeteer.elementhandle/).

### Clicking an element using locators

```ts
// 'button' is a CSS selector.
await page.locator('button').click();
```

The locator automatically checks the following before clicking:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

### Filling out an input

```ts
// 'input' is a CSS selector.
await page.locator('input').fill('value');
```

Automatically detects the input type and choose an appropriate way to fill it
out with the provided value. For example, it will fill out `<select>` elements as
well as `<input>` elements.

The locator automatically checks the following before typing into the input:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Hover over an element

```ts
await page.locator('div').hover();
```

The locator automatically checks the following before hovering:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

#### Scroll an element

The [`.scroll()`] functions uses mouse wheel events to scroll an element.

```ts
// Scroll the div element by 10px horizontally
// and by 20 px vertically.
await page.locator('div').scroll({
  scrollLeft: 10,
  scrollTop: 20,
});
```

The locator automatically checks the following before hovering:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

### Waiting for element to be visible

Sometimes you only need to wait for the element to be visible.

```ts
// '.loading' is a CSS selector.
await page.locator('.loading').wait();
```

The locator automatically checks the following before returning:

- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.

### Waiting for a function

Sometimes it is useful to wait for an arbitrary condition expressed as a
JavaScript function. In this case, locator can be defined using a function
instead of a selector. The following example waits until the MutationObserver
detects a `HTMLCanvasElement` element appearing on the page. You can also call
other locator functions such as `.click()` or `.fill()` on the function locator.

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

### Applying filters on locators

The following example shows how to add extra conditions to the locator expressed
as a JavaScript function. The button element will only be clicked if its
`innerText` is 'My button'.

```ts
await page
  .locator('button')
  .filter(button => button.innerText === 'My button')
  .click();
```

### Returning values from a locator

The [`map`](https://pptr.dev/api/puppeteer.locator.map/) function allows mapping
an element to a JavaScript value. In this case, calling `wait()` will return the
deserialized JavaScript value.

```ts
const enabled = await page
  .locator('button')
  .map(button => !button.disabled)
  .wait();
```

### Returning ElementHandles from a locator

The [`waitHandle`](https://pptr.dev/api/puppeteer.locator.waithandle/) function
allows returning the
[ElementHandle](https://pptr.dev/api/puppeteer.elementhandle/). It might be
useful if there is no corresponding locator API for the action you need.

```ts
const buttonHandle = await page.locator('button').waitHandle();
await buttonHandle.click();
```

### Configuring locators

Locators can be configured to tune configure the preconditions and other options:

```ts
// Clicks on a button without waiting for any preconditions.
await page
  .locator('button')
  .setEnsureElementIsInTheViewport(false)
  .setVisibility(null)
  .setWaitForEnabled(false)
  .setWaitForStableBoundingBox(false)
  .click();
```

### Locator timeouts

By default, locators inherit the timeout setting from the page. But it is
possible to set the timeout on the per-locator basis. A
[TimeoutError](https://pptr.dev/api/puppeteer.timeouterror/) will be thrown if
the element is not found or the preconditions are not met within the specified
time period.

```ts
// Time out after 3 sec.
await page.locator('button').setTimeout(3000).click();
```

### Getting locator events

Currently, locators support [a single
event](https://pptr.dev/api/puppeteer.locatorevents/) that notifies you when the
locator is about to perform the action indicating that pre-conditions have been
met:

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

## waitForSelector

[`waitForSelector`](https://pptr.dev/api/puppeteer.page.waitforselector/) is a
lower-level API compared to locators that allows waiting for an element to be
available in DOM. It does not automatically retry the action if it fails and
requires manually disposing the resulting ElementHandle to prevent memory leaks.
The method exists on the Page, Frame and ElementHandle instances.

```ts
// Import puppeteer
import puppeteer from 'puppeteer';

// Launch the browser.
const browser = await puppeteer.launch();

// Create a page.
const page = await browser.newPage();

// Go to your site.
await page.goto('YOUR_SITE');

// Query for an element handle.
const element = await page.waitForSelector('div > .class-name');

// Do something with element...
await element.click(); // Just an example.

// Dispose of handle.
await element.dispose();

// Close browser.
await browser.close();
```

Some page level APIs such as `page.click(selector)`, `page.type(selector)`,
`page.hover(selector)` are implemented using `waitForSelector` for
backwards-compatibility reasons.

## Querying without waiting

Sometimes you know that the elements are already on the page. In that case,
Puppeteer offers multiple ways to find an element or multiple elements matching a
selector. These methods exist on Page, Frame and ElementHandle instances.

- [`page.$()`](https://pptr.dev/api/puppeteer.page._/) returns a single element
  matching a selector.
- [`page.$$()`](https://pptr.dev/api/puppeteer.page.__) returns all elements matching a selector.
- [`page.$eval()`](https://pptr.dev/api/puppeteer.page._eval) returns the result
  of running a JavaScript function on the first element matching a selector.
- [`page.$$eval()`](https://pptr.dev/api/puppeteer.page.__eval) returns the
  result of running a JavaScript function on each element matching a selector.

## Selectors

Puppeteer accepts [CSS
selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors) in
every API that accepts a selector. Additionally, you can opt-in into using
additional selector syntax to do more than CSS selectors offer.

### Non-CSS selectors

Puppeteer extends the CSS syntax with custom
[pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements)
that define how to select an element using a non-CSS selector. The Puppeteer
supported pseudo-elements are prefixed with a `-p` vendor prefix.

#### XPath selectors (`-p-xpath`)

XPath selectors will use the browser's native [`Document.evaluate`](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) to query for elements.

```ts
// Runs the `//h2` as the XPath expression.
const element = await page.waitForSelector('::-p-xpath(//h2)');
```

#### Text selectors (`-p-text`)

Text selectors will select "minimal" elements containing the given text, even
within (open) shadow roots. Here, "minimum" means the deepest elements that
contain a given text, but not their parents (which technically will also contain
the given text).

```ts
// Click a button inside a div element that has Checkout as the inner text.
await page.locator('div ::-p-text(Checkout)').click();
// You need to escape CSS selector syntax such '(', ')' if it is part of the your search text ('Checkout (2 items)').
await page.locator(':scope >>> ::-p-text(Checkout \\(2 items\\))').click();
// or use quotes escaping any quotes that are part of the search text ('He said: "Hello"').
await page.locator(':scope >>> ::-p-text("He said: \\"Hello\\"")').click();
```

#### ARIA selectors (`-p-aria`)

ARIA selectors can be used to find elements using the computed accessible name
and role. These labels are computed using the browsers internal representation
of the accessibility tree. That means that ARIA relationships such as labeledby
are resolved before the query is run. The ARIA selectors are useful if you do
not want to depend on any particular DOM structure or DOM attributes.

```ts
await page.locator('::-p-aria(Submit)').click();
await page.locator('::-p-aria([name="Click me"][role="button"])').click();
```

#### Pierce selector (`pierce/`)

Pierce selector is a selector that returns all elements matching the provided CSS selector in
all shadow roots in the document. We recommend using [deep
combinators](#querying-elements-in-shadow-dom) instead because they offer more
flexibility in combining difference selectors. `pierce/` is only available in
the [prefixed notation](#prefixed-selector-syntax).

```ts
await page.locator('pierce/div').click();
// Same query as the pierce/ one using deep combinators.
await page.locator('& >>> div').click();
```

### Querying elements in Shadow DOM

CSS selectors do not allow descending into Shadow DOM, therefore, Puppeteer adds
two combinators to the CSS selector syntax that allow searching inside [shadow
DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).

#### The `>>>` combinator

The `>>>` is called the _deep descendent_ combinator. It is analogous to the
CSS's descendent combinator (denoted with a single space character <code>&nbsp;</code>, for
example, `div button`) and it selects matching elements under the parent element
at any depth. For example, `my-custom-element >>> button` would select all
button elements that are available inside shadow DOM of the `my-custom-element`
(the shadow host).

:::note

Deep combinators only work on the first "depth" of CSS selectors and open shadow
roots; for example, `:is(div > > a)` will not work.

:::

#### The `>>>>` combinator

The `>>>>` is called the _deep child_ combinator. It is analogous to the CSS's
child combinator (denoted with `>`, for example, `div > button`) and it selects
matching elements under the parent element's immediate shadow root, if the
element has one. For example,
`my-custom-element >>>> button` would select all button elements that are available
inside the immediate shadow root of the `my-custom-element` (the shadow host).

### Custom selectors

You can also add your own pseudo element using
[Puppeteer.registerCustomQueryHandler](../api/puppeteer.puppeteer.registercustomqueryhandler.md).
This is useful for creating custom selectors based on framework objects or your application.

For example, you can write all your selectors using the `react-component` pseudo-element
and implement a custom logic how to resolve the provided ID.

```ts
Puppeteer.registerCustomQueryHandler('react-component', {
  queryOne: (elementOrDocument, selector) => {
    // Dummy example just delegates to querySelector but you can find your
    // React component because this callback runs in the page context.
    return elementOrDocument.querySelector(`[id="${CSS.escape(selector)}"]`);
  },
  queryAll: (elementOrDocument, selector) => {
    // Dummy example just delegates to querySelector but you can find your
    // React component because this callback runs in the page context.
    return elementOrDocument.querySelectorAll(`[id="${CSS.escape(selector)}"]`);
  },
});
```

In your application you can now write selectors as following.

```ts
await page.locator('::-p-react-component(MyComponent)').click();
// OR used in conjunction with other selectors.
await page.locator('.side-bar ::-p-react-component(MyComponent)').click();
```

Another example shows how you can define a custom query handler for locating vue
components:

:::caution

Be careful when relying on internal APIs of libraries or frameworks. They can change at any time.

:::

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

Search for a given view component as following:

```ts
const element = await page.$('::-p-vue(MyComponent)');
```

### Prefixed selector syntax

:::caution

While we maintain prefixed selectors, the recommended way is to use the selector syntax documented above.

:::

The following legacy syntax (`${nonCssSelectorName}/${nonCssSelector}`) allows
running a single non-CSS selector at a time is also supported. Note that this
syntax does not allow combining multiple selectors.

```ts
// Same as ::-p-text("My text").
await page.locator('text/My text').click();
// Same as ::-p-xpath(//h2).
await page.locator('xpath///h2').click();
// Same as ::-p-aria(My label).
await page.locator('aria/My label').click();

await page.locator('pierce/div').click();
```

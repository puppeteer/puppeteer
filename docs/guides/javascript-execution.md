# JavaScript execution

Puppeteer allows evaluating JavaScript functions in the context of the page
driven by Puppeteer:

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

  // Evaluate JavaScript
  const three = await page.evaluate(() => {
    return 1 + 2;
  });

  console.log(three);

  // Close browser.
  await browser.close();
})();
```

:::caution

Although the function is defined in your script context, it actually gets
stringified by Puppeteer, sent to the target page over Chrome DevTools protocol
and evaluated there. It means that the function cannot access scope variables in
your script.

:::

Alternatively, you can provide a function body as a string:

```ts
// Evaluate JavaScript
const three = await page.evaluate(`
    1 + 2
`);
```

:::caution

The example above produces the equivalent results but it also illustrates that
the types and global variables available to the evaluated function cannot be
known. Especially, in TypeScript you should be careful to make sure that objects
referenced by the evaluated function are correct.

:::

## Return types

The functions you evaluate can return values. If the returned value is of a
primitive type, it gets automatically converted by Puppeteer to a primitive type
in the script context like in the previous example.

If the script returns an object, Puppeteer serializes it to a JSON and reconstructs it on the script side. This process might not always yield correct results, for example, when you return a DOM node:

```ts
const body = await page.evaluate(() => {
  return document.body;
});
console.log(body); // {}, unexpected!
```

To work with the returned objects, Puppeteer offers a way to return objects by reference:

```ts
const body = await page.evaluateHandle(() => {
  return document.body;
});
console.log(body instanceof ElementHandle); // true
```

The returned object is either a `JSHandle` or a `ElementHandle`. `ElementHandle` extends `JSHandle` and it is only created for DOM elements.

See the [API documentation](https://pptr.dev/api) for more details about what methods are available for handles.

## Passing arguments to the evaluate function

You can provide arguments to your function:

```ts
const three = await page.evaluate(
  (a, b) => {
    return 1 + 2;
  },
  1,
  2
);
```

The arguments can be primitive values or `JSHandle`s.

:::note

Page, JSHandle and ElementHandle offer several different helpers to evaluate JavaScript but they all follow the basic principles outlined in this guide.

:::

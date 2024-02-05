# Locators

Locators is a new, experimental API that combines the functionalities of
waiting and actions. With additional precondition checks, it
enables automatic retries for failed actions, resulting in more reliable and
less flaky automation scripts.

:::note

Locators API is experimental and we will not follow semver for breaking changes
in the Locators API.

:::

## Use cases

### Waiting for an element

```ts
await page.locator('button').wait();
```

The following preconditions are automatically checked:

- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.

### Waiting for a function

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

### Clicking an element

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

### Clicking an element matching a criteria

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

### Filling out an input

```ts
await page.locator('input').fill('value');
```

Automatically detects the input type and choose an approritate way to fill it out with the provided value.

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to become enabled.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

### Retrieving an element property

```ts
const enabled = await page
  .locator('button')
  .map(button => !button.disabled)
  .wait();
```

### Hover over an element

```ts
await page.locator('div').hover();
```

The following preconditions are automatically checked:

- Ensures the element is in the viewport.
- Waits for the element to become
  [visible](https://pptr.dev/api/puppeteer.elementhandle.isvisible/) or hidden.
- Waits for the element to have a stable bounding box over two consecutive
  animation frames.

### Scroll an element

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

## Configuring locators

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

## Getting locator events

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

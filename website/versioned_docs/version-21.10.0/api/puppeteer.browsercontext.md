---
sidebar_label: BrowserContext
---

# BrowserContext class

[BrowserContext](./puppeteer.browsercontext.md) represents individual sessions within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has a single [browser context](./puppeteer.browsercontext.md) by default. Others can be created using [Browser.createIncognitoBrowserContext()](./puppeteer.browser.createincognitobrowsercontext.md).

[BrowserContext](./puppeteer.browsercontext.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserContextEvent](./puppeteer.browsercontextevent.md) enum.

If a [page](./puppeteer.page.md) opens another [page](./puppeteer.page.md), e.g. using `window.open`, the popup will belong to the parent [page's browser context](./puppeteer.page.browsercontext.md).

#### Signature:

```typescript
export declare abstract class BrowserContext extends EventEmitter<BrowserContextEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[BrowserContextEvents](./puppeteer.browsercontextevents.md)&gt;

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `BrowserContext` class.

## Example

Creating an incognito [browser context](./puppeteer.browsercontext.md):

```ts
// Create a new incognito browser context
const context = await browser.createIncognitoBrowserContext();
// Create a new page inside context.
const page = await context.newPage();
// ... do stuff with page ...
await page.goto('https://example.com');
// Dispose context once it's no longer needed.
await context.close();
```

## Properties

| Property | Modifiers             | Type                | Description                                                              |
| -------- | --------------------- | ------------------- | ------------------------------------------------------------------------ |
| closed   | <code>readonly</code> | boolean             | Whether this [browser context](./puppeteer.browsercontext.md) is closed. |
| id       | <code>readonly</code> | string \| undefined | Identifier for this [browser context](./puppeteer.browsercontext.md).    |

## Methods

| Method                                                                                        | Modifiers | Description                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [browser()](./puppeteer.browsercontext.browser.md)                                            |           | Gets the [browser](./puppeteer.browser.md) associated with this [browser context](./puppeteer.browsercontext.md).                                                                                               |
| [clearPermissionOverrides()](./puppeteer.browsercontext.clearpermissionoverrides.md)          |           | Clears all permission overrides for this [browser context](./puppeteer.browsercontext.md).                                                                                                                      |
| [close()](./puppeteer.browsercontext.close.md)                                                |           | Closes this [browser context](./puppeteer.browsercontext.md) and all associated [pages](./puppeteer.page.md).                                                                                                   |
| [isIncognito()](./puppeteer.browsercontext.isincognito.md)                                    |           | <p>Whether this [browser context](./puppeteer.browsercontext.md) is incognito.</p><p>The [default browser context](./puppeteer.browser.defaultbrowsercontext.md) is the only non-incognito browser context.</p> |
| [newPage()](./puppeteer.browsercontext.newpage.md)                                            |           | Creates a new [page](./puppeteer.page.md) in this [browser context](./puppeteer.browsercontext.md).                                                                                                             |
| [overridePermissions(origin, permissions)](./puppeteer.browsercontext.overridepermissions.md) |           | Grants this [browser context](./puppeteer.browsercontext.md) the given <code>permissions</code> within the given <code>origin</code>.                                                                           |
| [pages()](./puppeteer.browsercontext.pages.md)                                                |           | Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).                                                                                              |
| [targets()](./puppeteer.browsercontext.targets.md)                                            |           | Gets all active [targets](./puppeteer.target.md) inside this [browser context](./puppeteer.browsercontext.md).                                                                                                  |
| [waitForTarget(predicate, options)](./puppeteer.browsercontext.waitfortarget.md)              |           | <p>Waits until a [target](./puppeteer.target.md) matching the given <code>predicate</code> appears and returns it.</p><p>This will look all open [browser contexts](./puppeteer.browsercontext.md).</p>         |

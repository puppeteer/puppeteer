---
sidebar_label: BrowserContext
---

# BrowserContext class

[BrowserContext](./puppeteer.browsercontext.md) represents individual user contexts within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has a single [browser context](./puppeteer.browsercontext.md) by default. Others can be created using [Browser.createBrowserContext()](./puppeteer.browser.createbrowsercontext.md). Each context has isolated storage (cookies/localStorage/etc.)

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

Creating a new [browser context](./puppeteer.browsercontext.md):

```ts
// Create a new browser context
const context = await browser.createBrowserContext();
// Create a new page inside context.
const page = await context.newPage();
// ... do stuff with page ...
await page.goto('https://example.com');
// Dispose context once it's no longer needed.
await context.close();
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

closed

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this [browser context](./puppeteer.browsercontext.md) is closed.

</td></tr>
<tr><td>

id

</td><td>

`readonly`

</td><td>

string \| undefined

</td><td>

Identifier for this [browser context](./puppeteer.browsercontext.md).

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[browser()](./puppeteer.browsercontext.browser.md)

</td><td>

</td><td>

Gets the [browser](./puppeteer.browser.md) associated with this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[clearPermissionOverrides()](./puppeteer.browsercontext.clearpermissionoverrides.md)

</td><td>

</td><td>

Clears all permission overrides for this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[close()](./puppeteer.browsercontext.close.md)

</td><td>

</td><td>

Closes this [browser context](./puppeteer.browsercontext.md) and all associated [pages](./puppeteer.page.md).

</td></tr>
<tr><td>

[isIncognito()](./puppeteer.browsercontext.isincognito.md)

</td><td>

</td><td>

Whether this [browser context](./puppeteer.browsercontext.md) is incognito.

In Chrome, the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) is the only non-incognito browser context.

</td></tr>
<tr><td>

[newPage()](./puppeteer.browsercontext.newpage.md)

</td><td>

</td><td>

Creates a new [page](./puppeteer.page.md) in this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[overridePermissions(origin, permissions)](./puppeteer.browsercontext.overridepermissions.md)

</td><td>

</td><td>

Grants this [browser context](./puppeteer.browsercontext.md) the given `permissions` within the given `origin`.

</td></tr>
<tr><td>

[pages()](./puppeteer.browsercontext.pages.md)

</td><td>

</td><td>

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[targets()](./puppeteer.browsercontext.targets.md)

</td><td>

</td><td>

Gets all active [targets](./puppeteer.target.md) inside this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

[waitForTarget(predicate, options)](./puppeteer.browsercontext.waitfortarget.md)

</td><td>

</td><td>

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
</tbody></table>

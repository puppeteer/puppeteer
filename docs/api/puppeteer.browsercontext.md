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

<span id="closed">closed</span>

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this [browser context](./puppeteer.browsercontext.md) is closed.

</td></tr>
<tr><td>

<span id="id">id</span>

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

<span id="browser">[browser()](./puppeteer.browsercontext.browser.md)</span>

</td><td>

</td><td>

Gets the [browser](./puppeteer.browser.md) associated with this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="clearpermissionoverrides">[clearPermissionOverrides()](./puppeteer.browsercontext.clearpermissionoverrides.md)</span>

</td><td>

</td><td>

Clears all permission overrides for this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="close">[close()](./puppeteer.browsercontext.close.md)</span>

</td><td>

</td><td>

Closes this [browser context](./puppeteer.browsercontext.md) and all associated [pages](./puppeteer.page.md).

**Remarks:**

The [default browser context](./puppeteer.browser.defaultbrowsercontext.md) cannot be closed.

</td></tr>
<tr><td>

<span id="isincognito">[isIncognito()](./puppeteer.browsercontext.isincognito.md)</span>

</td><td>

`deprecated`

</td><td>

Whether this [browser context](./puppeteer.browsercontext.md) is incognito.

In Chrome, the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) is the only non-incognito browser context.

**Deprecated:**

In Chrome, the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) can also be "incognito" if configured via the arguments and in such cases this getter returns wrong results (see https://github.com/puppeteer/puppeteer/issues/8836). Also, the term "incognito" is not applicable to other browsers. To migrate, check the [default browser context](./puppeteer.browser.defaultbrowsercontext.md) instead: in Chrome all non-default contexts are incognito, and the default context might be incognito if you provide the `--incognito` argument when launching the browser.

</td></tr>
<tr><td>

<span id="newpage">[newPage()](./puppeteer.browsercontext.newpage.md)</span>

</td><td>

</td><td>

Creates a new [page](./puppeteer.page.md) in this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="overridepermissions">[overridePermissions(origin, permissions)](./puppeteer.browsercontext.overridepermissions.md)</span>

</td><td>

</td><td>

Grants this [browser context](./puppeteer.browsercontext.md) the given `permissions` within the given `origin`.

</td></tr>
<tr><td>

<span id="pages">[pages()](./puppeteer.browsercontext.pages.md)</span>

</td><td>

</td><td>

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

**Remarks:**

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).

</td></tr>
<tr><td>

<span id="targets">[targets()](./puppeteer.browsercontext.targets.md)</span>

</td><td>

</td><td>

Gets all active [targets](./puppeteer.target.md) inside this [browser context](./puppeteer.browsercontext.md).

</td></tr>
<tr><td>

<span id="waitfortarget">[waitForTarget(predicate, options)](./puppeteer.browsercontext.waitfortarget.md)</span>

</td><td>

</td><td>

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

</td></tr>
</tbody></table>

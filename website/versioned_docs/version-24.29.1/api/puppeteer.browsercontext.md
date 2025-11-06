---
sidebar_label: BrowserContext
---

# BrowserContext class

[BrowserContext](./puppeteer.browsercontext.md) represents individual user contexts within a [browser](./puppeteer.browser.md).

When a [browser](./puppeteer.browser.md) is launched, it has at least one default [browser context](./puppeteer.browsercontext.md). Others can be created using [Browser.createBrowserContext()](./puppeteer.browser.createbrowsercontext.md). Each context has isolated storage (cookies/localStorage/etc.)

[BrowserContext](./puppeteer.browsercontext.md) [emits](./puppeteer.eventemitter.md) various events which are documented in the [BrowserContextEvent](./puppeteer.browsercontextevent.md) enum.

If a [page](./puppeteer.page.md) opens another [page](./puppeteer.page.md), e.g. using `window.open`, the popup will belong to the parent [page's browser context](./puppeteer.page.browsercontext.md).

### Signature

```typescript
export declare abstract class BrowserContext extends EventEmitter<BrowserContextEvents>
```

**Extends:** [EventEmitter](./puppeteer.eventemitter.md)&lt;[BrowserContextEvents](./puppeteer.browsercontextevents.md)&gt;

## Remarks

In Chrome all non-default contexts are incognito, and [default browser context](./puppeteer.browser.defaultbrowsercontext.md) might be incognito if you provide the `--incognito` argument when launching the browser.

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

<span id="cookies">[cookies()](./puppeteer.browsercontext.cookies.md)</span>

</td><td>

</td><td>

Gets all cookies in the browser context.

</td></tr>
<tr><td>

<span id="deletecookie">[deleteCookie(cookies)](./puppeteer.browsercontext.deletecookie.md)</span>

</td><td>

</td><td>

Removes cookie in this browser context.

</td></tr>
<tr><td>

<span id="deletematchingcookies">[deleteMatchingCookies(filters)](./puppeteer.browsercontext.deletematchingcookies.md)</span>

</td><td>

</td><td>

Deletes cookies matching the provided filters in this browser context.

</td></tr>
<tr><td>

<span id="newpage">[newPage(options)](./puppeteer.browsercontext.newpage.md)</span>

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

<span id="pages">[pages(includeAll)](./puppeteer.browsercontext.pages.md)</span>

</td><td>

</td><td>

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

**Remarks:**

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).

</td></tr>
<tr><td>

<span id="setcookie">[setCookie(cookies)](./puppeteer.browsercontext.setcookie.md)</span>

</td><td>

</td><td>

Sets a cookie in the browser context.

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

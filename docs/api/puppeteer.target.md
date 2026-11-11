---
sidebar_label: Target
---

# Target class

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged, such as a frame, a page or a worker.

### Signature

```typescript
export declare abstract class Target
```

## Remarks

With CDP, Puppeteer reports all targets that it attaches to. This includes `"tab"` targets and targets with a [subtype](./puppeteer.target.subtype.md), such as prerendered pages. Each tab has a `"tab"` target and a `"page"` target with the same URL. To find the target that shows the content of a tab, check the type and the subtype:

```ts
const target = await browser.waitForTarget(target => {
  return (
    target.type() === 'page' &&
    !target.subtype() &&
    target.url() === 'https://www.example.com/'
  );
});
```

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Target` class.

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

<span id="logger">logger</span>

</td><td>

`protected`

</td><td>

[Logger](./puppeteer.logger.md)

</td><td>

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

<span id="aspage">[asPage()](./puppeteer.target.aspage.md)</span>

</td><td>

</td><td>

Forcefully creates a page for a target of any type. It is useful if you want to handle a CDP target of type `other` as a page. If you deal with a regular page target, use [Target.page()](./puppeteer.target.page.md).

**Remarks:**

For a `"tab"` target, forces a page for the child target that shows the content of the tab, and throws if the tab has no such child yet. Throws for a target with the `"prerender"` [subtype](./puppeteer.target.subtype.md).

</td></tr>
<tr><td>

<span id="browser">[browser()](./puppeteer.target.browser.md)</span>

</td><td>

</td><td>

Get the browser the target belongs to.

</td></tr>
<tr><td>

<span id="browsercontext">[browserContext()](./puppeteer.target.browsercontext.md)</span>

</td><td>

</td><td>

Get the browser context the target belongs to.

</td></tr>
<tr><td>

<span id="createcdpsession">[createCDPSession()](./puppeteer.target.createcdpsession.md)</span>

</td><td>

</td><td>

Creates a Chrome Devtools Protocol session attached to the target.

</td></tr>
<tr><td>

<span id="isdiscarded">[isDiscarded()](./puppeteer.target.isdiscarded.md)</span>

</td><td>

</td><td>

Returns `true` if the target is a `"tab"` target and the browser discarded the tab to save memory.

**Remarks:**

A discarded tab has no page target. [Target.page()](./puppeteer.target.page.md) returns `null` for it, [Target.asPage()](./puppeteer.target.aspage.md) throws, and [Browser.pages()](./puppeteer.browser.pages.md) does not include it. When the tab loads again, for example when the user selects it, the tab gets a new page target and Puppeteer emits `targetchanged` for the tab target.

A [Page](./puppeteer.page.md) that is open when its tab is discarded closes.

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `false`.

</td></tr>
<tr><td>

<span id="opener">[opener()](./puppeteer.target.opener.md)</span>

</td><td>

</td><td>

Get the target that opened this target. Top-level targets return `null`.

</td></tr>
<tr><td>

<span id="page">[page()](./puppeteer.target.page.md)</span>

</td><td>

</td><td>

Returns the [Page](./puppeteer.page.md) of the target, or `null` if the target has no page.

**Remarks:**

- A `"tab"` target and its primary `"page"` target return the same [Page](./puppeteer.page.md). - A target with the `"prerender"` [subtype](./puppeteer.target.subtype.md) returns `null`. After Chrome activates the prerendered page, the target returns the [Page](./puppeteer.page.md) of the tab. - Targets that are not of type `"page"`, `"tab"`, `"webview"` or `"background_page"` return `null`.

</td></tr>
<tr><td>

<span id="parent">[parent()](./puppeteer.target.parent.md)</span>

</td><td>

</td><td>

Returns the target that Puppeteer attached this target through. For example, the parent of a `"page"` target is the `"tab"` target of its tab. Returns `undefined` for top-level targets, such as `"tab"` targets.

**Remarks:**

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `undefined`.

</td></tr>
<tr><td>

<span id="subtype">[subtype()](./puppeteer.target.subtype.md)</span>

</td><td>

</td><td>

Returns the subtype of the target, as CDP reports it. For example, a prerendered page has the subtype `"prerender"`. Returns `undefined` if the target has no subtype.

**Remarks:**

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `undefined`.

</td></tr>
<tr><td>

<span id="type">[type()](./puppeteer.target.type.md)</span>

</td><td>

</td><td>

Identifies what kind of target this is.

**Remarks:**

See [docs](https://developer.chrome.com/extensions/background_pages) for more info about background pages.

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.target.url.md)</span>

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="worker">[worker()](./puppeteer.target.worker.md)</span>

</td><td>

</td><td>

If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.

</td></tr>
</tbody></table>

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

Forcefully creates a page for an arbitrary target. It is useful if you want to handle a CDP target of type `other` as a page. If you deal with a regular page target, use [Target.page()](./puppeteer.target.page.md).

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

**_(Experimental)_** Checks whether this target is discarded.

**Remarks:**

A target of type ["tab"](./puppeteer.targettype.md) is discarded while Chrome keeps its tab discarded. A target of type ["page"](./puppeteer.targettype.md) is discarded if Chrome closed it because it discarded the tab of the target. When Chrome reloads a discarded tab, it creates new targets that are not discarded.

Targets inside a page, such as out-of-process iframes and dedicated workers, close together with the page. Do not use this method to find out why such a target closed: it can return `false` for them even if Chrome discarded their tab.

The value of a closed target can change from `false` to `true` after the [targetdestroyed](./puppeteer.browserevent.md) event, because Chrome can close the target before it reports that the tab is discarded. In rare cases, a target that closed for another reason, with no target to replace it, is also reported as discarded if Chrome discards its tab later.

Currently only supported for Chrome and the CDP protocol.

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

If the target is not of type `"page"`, `"webview"` or `"background_page"`, or if the target is [discarded](./puppeteer.target.isdiscarded.md), returns `null`.

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

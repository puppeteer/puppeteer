---
sidebar_label: Target
---

# Target class

Target represents a [CDP target](https://chromedevtools.github.io/devtools-protocol/tot/Target/). In CDP a target is something that can be debugged such a frame, a page or a worker.

#### Signature:

```typescript
export declare abstract class Target
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Target` class.

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

<span id="opener">[opener()](./puppeteer.target.opener.md)</span>

</td><td>

</td><td>

Get the target that opened this target. Top-level targets return `null`.

</td></tr>
<tr><td>

<span id="page">[page()](./puppeteer.target.page.md)</span>

</td><td>

</td><td>

If the target is not of type `"page"`, `"webview"` or `"background_page"`, returns `null`.

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

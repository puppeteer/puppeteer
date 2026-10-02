---
sidebar_label: BrowserContextEvent
---

# BrowserContextEvent enum

### Signature

```typescript
export declare const enum BrowserContextEvent
```

## Enumeration Members

<table><thead><tr><th>

Member

</th><th>

Value

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

Console

</td><td>

`"console"`

</td><td>

Emitted when JavaScript within any page or worker in the browser context calls one of the console API methods, e.g. `console.log` or `console.dir`. Contains a [ConsoleMessage](./puppeteer.consolemessage.md) instance.

**Remarks:**

Use [ConsoleMessage.page()](./puppeteer.consolemessage.page.md), [ConsoleMessage.frame()](./puppeteer.consolemessage.frame.md) or [ConsoleMessage.worker()](./puppeteer.consolemessage.worker.md) to identify the originating context.

Events are only delivered for pages and workers that Puppeteer has attached to, e.g. via [BrowserContext.pages()](./puppeteer.browsercontext.pages.md) or [Target.page()](./puppeteer.target.page.md). Registering the listener before attaching guarantees that console messages replayed by the browser on attachment are not lost.

Service workers and shared workers are not attached automatically: their console messages are only delivered after [Target.worker()](./puppeteer.target.worker.md) has been called for their target.

The [arguments](./puppeteer.consolemessage.args.md) are shared with listeners registered on [Page](./puppeteer.page.md), [WebWorker](./puppeteer.webworker.md) and [Browser](./puppeteer.browser.md). Disposing them in one listener invalidates them for all other listeners.

</td></tr>
<tr><td>

Request

</td><td>

`"request"`

</td><td>

Emitted when any page in the browser context issues a request. Contains a [HTTPRequest](./puppeteer.httprequest.md) instance.

**Remarks:**

Use [HTTPRequest.page()](./puppeteer.httprequest.page.md), [HTTPRequest.frame()](./puppeteer.httprequest.frame.md) or [HTTPRequest.worker()](./puppeteer.httprequest.worker.md) to identify the originating context.

These listeners only observe requests. Do not call `request.continue()`, `abort()` or `respond()` from them: they are not coordinated with page-level handlers (see [cooperative intercept mode](https://pptr.dev/guides/network-interception#cooperative-intercept-mode)). To intercept requests, use [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md) with a [PageEvent.Request](./puppeteer.pageevent.md) listener.

</td></tr>
<tr><td>

TargetChanged

</td><td>

`"targetchanged"`

</td><td>

Emitted when the url of a target inside the browser context changes. Contains a [Target](./puppeteer.target.md) instance.

</td></tr>
<tr><td>

TargetCreated

</td><td>

`"targetcreated"`

</td><td>

Emitted when a target is created within the browser context, for example when a new page is opened by [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) or by [browserContext.newPage](./puppeteer.browsercontext.newpage.md)

Contains a [Target](./puppeteer.target.md) instance.

</td></tr>
<tr><td>

TargetDestroyed

</td><td>

`"targetdestroyed"`

</td><td>

Emitted when a target is destroyed within the browser context, for example when a page is closed. Contains a [Target](./puppeteer.target.md) instance.

</td></tr>
</tbody></table>

---
sidebar_label: BrowserEvent
---

# BrowserEvent enum

All the events a [browser instance](./puppeteer.browser.md) may emit.

### Signature

```typescript
export declare const enum BrowserEvent
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

**_(Experimental)_** Emitted when JavaScript within any page or worker in the browser calls one of the console API methods, e.g. `console.log` or `console.dir`. Contains a [ConsoleMessage](./puppeteer.consolemessage.md) instance.

**Remarks:**

Use [ConsoleMessage.page()](./puppeteer.consolemessage.page.md), [ConsoleMessage.frame()](./puppeteer.consolemessage.frame.md) or [ConsoleMessage.worker()](./puppeteer.consolemessage.worker.md) to identify the originating context. Messages from workers have no page or frame: use [ConsoleMessage.worker()](./puppeteer.consolemessage.worker.md) for them. Messages logged by the browser itself (e.g. network errors or violations) can have no page, frame or worker.

Events are only delivered for pages and workers that Puppeteer has attached to, e.g. via [Browser.pages()](./puppeteer.browser.pages.md) or [Target.page()](./puppeteer.target.page.md). Registering the listener before attaching guarantees that console messages replayed by the browser on attachment are not lost.

With WebDriver BiDi, console messages that the browser replays while connecting are delivered once, right after [Puppeteer.connect()](./puppeteer.puppeteer.connect.md) resolves: register the listener before awaiting anything else, or they are missed. Replayed messages can be delivered after messages logged later.

Service workers and shared workers are not attached automatically: their console messages are only delivered after [Target.worker()](./puppeteer.target.worker.md) has been called for their target. With WebDriver BiDi, their console messages are not reported.

The [arguments](./puppeteer.consolemessage.args.md) are shared with listeners registered on [Page](./puppeteer.page.md), [WebWorker](./puppeteer.webworker.md) and [BrowserContext](./puppeteer.browsercontext.md). Disposing them in one listener invalidates them for all other listeners.

</td></tr>
<tr><td>

Disconnected

</td><td>

`"disconnected"`

</td><td>

Emitted when Puppeteer gets disconnected from the browser instance. This might happen because either:

- The browser closes/crashes or - [Browser.disconnect()](./puppeteer.browser.disconnect.md) was called.

</td></tr>
<tr><td>

Request

</td><td>

`"request"`

</td><td>

**_(Experimental)_** Emitted when any page in the browser issues a request. Contains a [HTTPRequest](./puppeteer.httprequest.md) instance.

**Remarks:**

Use [HTTPRequest.page()](./puppeteer.httprequest.page.md) or [HTTPRequest.frame()](./puppeteer.httprequest.frame.md) to identify the originating context. Requests from dedicated workers have no page or frame: use [HTTPRequest.worker()](./puppeteer.httprequest.worker.md) for them. Dedicated worker requests and [HTTPRequest.worker()](./puppeteer.httprequest.worker.md) are not supported with WebDriver BiDi.

With CDP, events are only delivered for pages that have a [Page](./puppeteer.page.md) instance, e.g. created via [Browser.pages()](./puppeteer.browser.pages.md) or [Target.page()](./puppeteer.target.page.md). Requests issued before the instance exists, such as the initial navigation of a popup, are not reported. With WebDriver BiDi, requests from all pages are reported. Requests from service workers and shared workers are not reported.

These listeners only observe requests. Do not call `request.continue()`, `abort()` or `respond()` from them: they are not coordinated with page-level handlers (see [cooperative intercept mode](https://pptr.dev/guides/network-interception#cooperative-intercept-mode)). To intercept requests, use [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md) with a [PageEvent.Request](./puppeteer.pageevent.md) listener.

</td></tr>
<tr><td>

RequestFailed

</td><td>

`"requestfailed"`

</td><td>

**_(Experimental)_** Emitted when a request issued by any page in the browser fails, for example by timing out. Contains a [HTTPRequest](./puppeteer.httprequest.md) instance.

**Remarks:**

HTTP error responses, such as 404 or 503, are still successful responses from HTTP standpoint, so the request completes with [BrowserEvent.RequestFinished](./puppeteer.browserevent.md) and not with [BrowserEvent.RequestFailed](./puppeteer.browserevent.md). The same delivery rules as for [BrowserEvent.Request](./puppeteer.browserevent.md) apply.

</td></tr>
<tr><td>

RequestFinished

</td><td>

`"requestfinished"`

</td><td>

**_(Experimental)_** Emitted when a request issued by any page in the browser finishes successfully. Contains a [HTTPRequest](./puppeteer.httprequest.md) instance.

**Remarks:**

The same delivery rules as for [BrowserEvent.Request](./puppeteer.browserevent.md) apply.

</td></tr>
<tr><td>

RequestServedFromCache

</td><td>

`"requestservedfromcache"`

</td><td>

**_(Experimental)_** Emitted when a request issued by any page in the browser is served from the memory cache. Contains a [HTTPRequest](./puppeteer.httprequest.md) instance.

**Remarks:**

The same delivery rules as for [BrowserEvent.Request](./puppeteer.browserevent.md) apply.

</td></tr>
<tr><td>

Response

</td><td>

`"response"`

</td><td>

**_(Experimental)_** Emitted when a response is received for a request issued by any page in the browser. Contains a [HTTPResponse](./puppeteer.httpresponse.md) instance.

**Remarks:**

Use [HTTPResponse.request()](./puppeteer.httpresponse.request.md) to access the originating request. The same delivery rules as for [BrowserEvent.Request](./puppeteer.browserevent.md) apply.

</td></tr>
<tr><td>

TargetChanged

</td><td>

`"targetchanged"`

</td><td>

Emitted when the URL of a target changes. Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target changes in all browser contexts.

</td></tr>
<tr><td>

TargetCreated

</td><td>

`"targetcreated"`

</td><td>

Emitted when a target is created, for example when a new page is opened by [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open) or by [browser.newPage](./puppeteer.browser.newpage.md)

Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target creations in all browser contexts.

</td></tr>
<tr><td>

TargetDestroyed

</td><td>

`"targetdestroyed"`

</td><td>

Emitted when a target is destroyed, for example when a page is closed. Contains a [Target](./puppeteer.target.md) instance.

**Remarks:**

Note that this includes target destructions in all browser contexts.

</td></tr>
</tbody></table>

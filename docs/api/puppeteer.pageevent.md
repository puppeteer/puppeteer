---
sidebar_label: PageEvent
---

# PageEvent enum

All the events that a page instance may emit.

### Signature

```typescript
export declare const enum PageEvent
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

Close

</td><td>

`"close"`

</td><td>

Emitted when the page closes.

</td></tr>
<tr><td>

Console

</td><td>

`"console"`

</td><td>

Emitted when JavaScript within the page calls one of console API methods, e.g. `console.log` or `console.dir`. Also emitted if the page throws an error or a warning.

**Remarks:**

A `console` event provides a [ConsoleMessage](./puppeteer.consolemessage.md) representing the console message that was logged.

</td></tr>
<tr><td>

Dialog

</td><td>

`"dialog"`

</td><td>

Emitted when a JavaScript dialog appears, such as `alert`, `prompt`, `confirm` or `beforeunload`. Puppeteer can respond to the dialog via [Dialog.accept()](./puppeteer.dialog.accept.md) or [Dialog.dismiss()](./puppeteer.dialog.dismiss.md).

</td></tr>
<tr><td>

DOMContentLoaded

</td><td>

`"domcontentloaded"`

</td><td>

Emitted when the JavaScript [DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/Events/DOMContentLoaded) event is dispatched.

</td></tr>
<tr><td>

Error

</td><td>

`"error"`

</td><td>

Emitted when the page crashes. Will contain an `Error`.

</td></tr>
<tr><td>

FrameAttached

</td><td>

`"frameattached"`

</td><td>

Emitted when a frame is attached. Will contain a [Frame](./puppeteer.frame.md).

</td></tr>
<tr><td>

FrameDetached

</td><td>

`"framedetached"`

</td><td>

Emitted when a frame is detached. Will contain a [Frame](./puppeteer.frame.md).

</td></tr>
<tr><td>

FrameNavigated

</td><td>

`"framenavigated"`

</td><td>

Emitted when a frame is navigated to a new URL. Will contain a [Frame](./puppeteer.frame.md).

</td></tr>
<tr><td>

Load

</td><td>

`"load"`

</td><td>

Emitted when the JavaScript [load](https://developer.mozilla.org/en-US/docs/Web/Events/load) event is dispatched.

</td></tr>
<tr><td>

Metrics

</td><td>

`"metrics"`

</td><td>

Emitted when the JavaScript code makes a call to `console.timeStamp`. For the list of metrics see [page.metrics](./puppeteer.page.metrics.md).

**Remarks:**

Contains an object with two properties:

- `title`: the title passed to `console.timeStamp` - `metrics`: object containing metrics as key/value pairs. The values will be `number`s.

</td></tr>
<tr><td>

PageError

</td><td>

`"pageerror"`

</td><td>

Emitted when an uncaught exception happens within the page. Contains an `Error` or data of type unknown.

</td></tr>
<tr><td>

Popup

</td><td>

`"popup"`

</td><td>

Emitted when the page opens a new tab or window.

Contains a [Page](./puppeteer.page.md) corresponding to the popup window.

</td></tr>
<tr><td>

Request

</td><td>

`"request"`

</td><td>

Emitted when a page issues a request and contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

The object is readonly. See [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md) for intercepting and mutating requests.

</td></tr>
<tr><td>

RequestFailed

</td><td>

`"requestfailed"`

</td><td>

Emitted when a request fails, for example by timing out.

Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

HTTP Error responses, such as 404 or 503, are still successful responses from HTTP standpoint, so request will complete with `requestfinished` event and not with `requestfailed`.

</td></tr>
<tr><td>

RequestFinished

</td><td>

`"requestfinished"`

</td><td>

Emitted when a request finishes successfully. Contains a [HTTPRequest](./puppeteer.httprequest.md).

</td></tr>
<tr><td>

RequestServedFromCache

</td><td>

`"requestservedfromcache"`

</td><td>

Emitted when a request ended up loading from cache. Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

For certain requests, might contain undefined. [https://crbug.com/750469](https://crbug.com/750469)

</td></tr>
<tr><td>

Response

</td><td>

`"response"`

</td><td>

Emitted when a response is received. Contains a [HTTPResponse](./puppeteer.httpresponse.md).

</td></tr>
<tr><td>

WorkerCreated

</td><td>

`"workercreated"`

</td><td>

Emitted when a dedicated [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) is spawned by the page.

</td></tr>
<tr><td>

WorkerDestroyed

</td><td>

`"workerdestroyed"`

</td><td>

Emitted when a dedicated [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) is destroyed by the page.

</td></tr>
</tbody></table>

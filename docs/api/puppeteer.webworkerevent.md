---
sidebar_label: WebWorkerEvent
---

# WebWorkerEvent enum

### Signature

```typescript
export declare enum WebWorkerEvent
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

Emitted when the worker calls a console API.

</td></tr>
<tr><td>

Error

</td><td>

`"error"`

</td><td>

Emitted when the worker throws an exception.

**Deprecated:**

Use [WebWorkerEvent.Exception](./puppeteer.webworkerevent.md) instead.

</td></tr>
<tr><td>

Exception

</td><td>

`"exception"`

</td><td>

Emitted when an uncaught exception happens within the worker. Contains a [RemoteException](./puppeteer.remoteexception.md).

**Remarks:**

The [handle](./puppeteer.remoteexception.handle.md) of the exception is disposed right after the event has been dispatched. Call `move()` on it synchronously inside the listener to keep it alive.

</td></tr>
<tr><td>

Request

</td><td>

`"request"`

</td><td>

**_(Experimental)_** Emitted when the worker issues a request. Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

Only supported with CDP. With WebDriver BiDi these events are never emitted.

For service workers and shared workers, network events are only delivered once a [WebWorker](./puppeteer.webworker.md) instance exists, i.e. after [Target.worker()](./puppeteer.target.worker.md) has been called. Requests issued before that, such as requests made while a service worker starts up, are not reported.

Listeners are bound to this worker instance: if the worker is terminated and restarted (e.g. an idle extension service worker), a new [WebWorker](./puppeteer.webworker.md) is created and listeners must be re-attached.

Requests issued by service workers and shared workers cannot be intercepted: `request.continue()`, `abort()` and `respond()` throw.

</td></tr>
<tr><td>

RequestFailed

</td><td>

`"requestfailed"`

</td><td>

**_(Experimental)_** Emitted when a request issued by the worker fails. Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

The same delivery rules as for [WebWorkerEvent.Request](./puppeteer.webworkerevent.md) apply.

</td></tr>
<tr><td>

RequestFinished

</td><td>

`"requestfinished"`

</td><td>

**_(Experimental)_** Emitted when a request issued by the worker finishes successfully. Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

The same delivery rules as for [WebWorkerEvent.Request](./puppeteer.webworkerevent.md) apply.

</td></tr>
<tr><td>

RequestServedFromCache

</td><td>

`"requestservedfromcache"`

</td><td>

**_(Experimental)_** Emitted when a request issued by the worker is served from cache. Contains a [HTTPRequest](./puppeteer.httprequest.md).

**Remarks:**

The same delivery rules as for [WebWorkerEvent.Request](./puppeteer.webworkerevent.md) apply.

</td></tr>
<tr><td>

Response

</td><td>

`"response"`

</td><td>

**_(Experimental)_** Emitted when a response is received for a request issued by the worker. Contains a [HTTPResponse](./puppeteer.httpresponse.md).

**Remarks:**

The same delivery rules as for [WebWorkerEvent.Request](./puppeteer.webworkerevent.md) apply.

</td></tr>
</tbody></table>

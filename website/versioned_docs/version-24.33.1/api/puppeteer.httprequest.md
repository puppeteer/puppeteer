---
sidebar_label: HTTPRequest
---

# HTTPRequest class

Represents an HTTP request sent by a page.

### Signature

```typescript
export declare abstract class HTTPRequest
```

## Remarks

Whenever the page sends a request, such as for a network resource, the following events are emitted by Puppeteer's `page`:

- `request`: emitted when the request is issued by the page.

- `requestfinished` - emitted when the response body is downloaded and the request is complete.

If request fails at some point, then instead of `requestfinished` event the `requestfailed` event is emitted.

All of these events provide an instance of `HTTPRequest` representing the request that occurred:

```
page.on('request', request => ...)
```

NOTE: HTTP Error responses, such as 404 or 503, are still successful responses from HTTP standpoint, so request will complete with `requestfinished` event.

If request gets a 'redirect' response, the request is successfully finished with the `requestfinished` event, and a new request is issued to a redirected url.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `HTTPRequest` class.

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

<span id="client">client</span>

</td><td>

`readonly`

</td><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

**_(Experimental)_** Warning! Using this client can break Puppeteer. Use with caution.

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

<span id="abort">[abort(errorCode, priority)](./puppeteer.httprequest.abort.md)</span>

</td><td>

</td><td>

Aborts a request.

**Remarks:**

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md). If it is not enabled, this method will throw an exception immediately.

</td></tr>
<tr><td>

<span id="aborterrorreason">[abortErrorReason()](./puppeteer.httprequest.aborterrorreason.md)</span>

</td><td>

</td><td>

The most recent reason for aborting the request

</td></tr>
<tr><td>

<span id="continue">[continue(overrides, priority)](./puppeteer.httprequest.continue.md)</span>

</td><td>

</td><td>

Continues request with optional request overrides.

**Remarks:**

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md).

Exception is immediately thrown if the request interception is not enabled.

</td></tr>
<tr><td>

<span id="continuerequestoverrides">[continueRequestOverrides()](./puppeteer.httprequest.continuerequestoverrides.md)</span>

</td><td>

</td><td>

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

</td></tr>
<tr><td>

<span id="enqueueinterceptaction">[enqueueInterceptAction(pendingHandler)](./puppeteer.httprequest.enqueueinterceptaction.md)</span>

</td><td>

</td><td>

Adds an async request handler to the processing queue. Deferred handlers are not guaranteed to execute in any particular order, but they are guaranteed to resolve before the request interception is finalized.

</td></tr>
<tr><td>

<span id="failure">[failure()](./puppeteer.httprequest.failure.md)</span>

</td><td>

</td><td>

Access information about the request's failure.

**Remarks:**

</td></tr>
<tr><td>

<span id="fetchpostdata">[fetchPostData()](./puppeteer.httprequest.fetchpostdata.md)</span>

</td><td>

</td><td>

Fetches the POST data for the request from the browser.

</td></tr>
<tr><td>

<span id="finalizeinterceptions">[finalizeInterceptions()](./puppeteer.httprequest.finalizeinterceptions.md)</span>

</td><td>

</td><td>

Awaits pending interception handlers and then decides how to fulfill the request interception.

</td></tr>
<tr><td>

<span id="frame">[frame()](./puppeteer.httprequest.frame.md)</span>

</td><td>

</td><td>

The frame that initiated the request, or null if navigating to error pages.

</td></tr>
<tr><td>

<span id="haspostdata">[hasPostData()](./puppeteer.httprequest.haspostdata.md)</span>

</td><td>

</td><td>

True when the request has POST data. Note that [HTTPRequest.postData()](./puppeteer.httprequest.postdata.md) might still be undefined when this flag is true when the data is too long or not readily available in the decoded form. In that case, use [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md).

</td></tr>
<tr><td>

<span id="headers">[headers()](./puppeteer.httprequest.headers.md)</span>

</td><td>

</td><td>

An object with HTTP headers associated with the request. All header names are lower-case.

</td></tr>
<tr><td>

<span id="initiator">[initiator()](./puppeteer.httprequest.initiator.md)</span>

</td><td>

</td><td>

The initiator of the request.

</td></tr>
<tr><td>

<span id="interceptresolutionstate">[interceptResolutionState()](./puppeteer.httprequest.interceptresolutionstate.md)</span>

</td><td>

</td><td>

An InterceptResolutionState object describing the current resolution action and priority.

InterceptResolutionState contains: action: InterceptResolutionAction priority?: number

InterceptResolutionAction is one of: `abort`, `respond`, `continue`, `disabled`, `none`, or `already-handled`.

</td></tr>
<tr><td>

<span id="isinterceptresolutionhandled">[isInterceptResolutionHandled()](./puppeteer.httprequest.isinterceptresolutionhandled.md)</span>

</td><td>

</td><td>

Is `true` if the intercept resolution has already been handled, `false` otherwise.

</td></tr>
<tr><td>

<span id="isnavigationrequest">[isNavigationRequest()](./puppeteer.httprequest.isnavigationrequest.md)</span>

</td><td>

</td><td>

True if the request is the driver of the current frame's navigation.

</td></tr>
<tr><td>

<span id="method">[method()](./puppeteer.httprequest.method.md)</span>

</td><td>

</td><td>

The method used (`GET`, `POST`, etc.)

</td></tr>
<tr><td>

<span id="postdata">[postData()](./puppeteer.httprequest.postdata.md)</span>

</td><td>

`deprecated`

</td><td>

**Deprecated:**

Use [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md).

</td></tr>
<tr><td>

<span id="redirectchain">[redirectChain()](./puppeteer.httprequest.redirectchain.md)</span>

</td><td>

</td><td>

A `redirectChain` is a chain of requests initiated to fetch a resource.

**Remarks:**

`redirectChain` is shared between all the requests of the same chain.

For example, if the website `http://example.com` has a single redirect to `https://example.com`, then the chain will contain one request:

```ts
const response = await page.goto('http://example.com');
const chain = response.request().redirectChain();
console.log(chain.length); // 1
console.log(chain[0].url()); // 'http://example.com'
```

If the website `https://google.com` has no redirects, then the chain will be empty:

```ts
const response = await page.goto('https://google.com');
const chain = response.request().redirectChain();
console.log(chain.length); // 0
```

</td></tr>
<tr><td>

<span id="resourcetype">[resourceType()](./puppeteer.httprequest.resourcetype.md)</span>

</td><td>

</td><td>

Contains the request's resource type as it was perceived by the rendering engine.

</td></tr>
<tr><td>

<span id="respond">[respond(response, priority)](./puppeteer.httprequest.respond.md)</span>

</td><td>

</td><td>

Fulfills a request with the given response.

**Remarks:**

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md).

Exception is immediately thrown if the request interception is not enabled.

</td></tr>
<tr><td>

<span id="response">[response()](./puppeteer.httprequest.response.md)</span>

</td><td>

</td><td>

A matching `HTTPResponse` object, or null if the response has not been received yet.

</td></tr>
<tr><td>

<span id="responseforrequest">[responseForRequest()](./puppeteer.httprequest.responseforrequest.md)</span>

</td><td>

</td><td>

The `ResponseForRequest` that gets used if the interception is allowed to respond (ie, `abort()` is not called).

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.httprequest.url.md)</span>

</td><td>

</td><td>

The URL of the request

</td></tr>
</tbody></table>

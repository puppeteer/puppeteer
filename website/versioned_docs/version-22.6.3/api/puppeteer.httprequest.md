---
sidebar_label: HTTPRequest
---

# HTTPRequest class

Represents an HTTP request sent by a page.

#### Signature:

```typescript
export declare abstract class HTTPRequest
```

## Remarks

Whenever the page sends a request, such as for a network resource, the following events are emitted by Puppeteer's `page`:

- `request`: emitted when the request is issued by the page. - `requestfinished` - emitted when the response body is downloaded and the request is complete.

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

client

</td><td>

`readonly`

</td><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

Warning! Using this client can break Puppeteer. Use with caution.

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

[abort(errorCode, priority)](./puppeteer.httprequest.abort.md)

</td><td>

</td><td>

Aborts a request.

</td></tr>
<tr><td>

[abortErrorReason()](./puppeteer.httprequest.aborterrorreason.md)

</td><td>

</td><td>

The most recent reason for aborting the request

</td></tr>
<tr><td>

[continue(overrides, priority)](./puppeteer.httprequest.continue.md)

</td><td>

</td><td>

Continues request with optional request overrides.

</td></tr>
<tr><td>

[continueRequestOverrides()](./puppeteer.httprequest.continuerequestoverrides.md)

</td><td>

</td><td>

The `ContinueRequestOverrides` that will be used if the interception is allowed to continue (ie, `abort()` and `respond()` aren't called).

</td></tr>
<tr><td>

[enqueueInterceptAction(pendingHandler)](./puppeteer.httprequest.enqueueinterceptaction.md)

</td><td>

</td><td>

Adds an async request handler to the processing queue. Deferred handlers are not guaranteed to execute in any particular order, but they are guaranteed to resolve before the request interception is finalized.

</td></tr>
<tr><td>

[failure()](./puppeteer.httprequest.failure.md)

</td><td>

</td><td>

Access information about the request's failure.

</td></tr>
<tr><td>

[fetchPostData()](./puppeteer.httprequest.fetchpostdata.md)

</td><td>

</td><td>

Fetches the POST data for the request from the browser.

</td></tr>
<tr><td>

[finalizeInterceptions()](./puppeteer.httprequest.finalizeinterceptions.md)

</td><td>

</td><td>

Awaits pending interception handlers and then decides how to fulfill the request interception.

</td></tr>
<tr><td>

[frame()](./puppeteer.httprequest.frame.md)

</td><td>

</td><td>

The frame that initiated the request, or null if navigating to error pages.

</td></tr>
<tr><td>

[hasPostData()](./puppeteer.httprequest.haspostdata.md)

</td><td>

</td><td>

True when the request has POST data. Note that [HTTPRequest.postData()](./puppeteer.httprequest.postdata.md) might still be undefined when this flag is true when the data is too long or not readily available in the decoded form. In that case, use [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md).

</td></tr>
<tr><td>

[headers()](./puppeteer.httprequest.headers.md)

</td><td>

</td><td>

An object with HTTP headers associated with the request. All header names are lower-case.

</td></tr>
<tr><td>

[initiator()](./puppeteer.httprequest.initiator.md)

</td><td>

</td><td>

The initiator of the request.

</td></tr>
<tr><td>

[interceptResolutionState()](./puppeteer.httprequest.interceptresolutionstate.md)

</td><td>

</td><td>

An InterceptResolutionState object describing the current resolution action and priority.

InterceptResolutionState contains: action: InterceptResolutionAction priority?: number

InterceptResolutionAction is one of: `abort`, `respond`, `continue`, `disabled`, `none`, or `already-handled`.

</td></tr>
<tr><td>

[isInterceptResolutionHandled()](./puppeteer.httprequest.isinterceptresolutionhandled.md)

</td><td>

</td><td>

Is `true` if the intercept resolution has already been handled, `false` otherwise.

</td></tr>
<tr><td>

[isNavigationRequest()](./puppeteer.httprequest.isnavigationrequest.md)

</td><td>

</td><td>

True if the request is the driver of the current frame's navigation.

</td></tr>
<tr><td>

[method()](./puppeteer.httprequest.method.md)

</td><td>

</td><td>

The method used (`GET`, `POST`, etc.)

</td></tr>
<tr><td>

[postData()](./puppeteer.httprequest.postdata.md)

</td><td>

</td><td>

The request's post body, if any.

</td></tr>
<tr><td>

[redirectChain()](./puppeteer.httprequest.redirectchain.md)

</td><td>

</td><td>

A `redirectChain` is a chain of requests initiated to fetch a resource.

</td></tr>
<tr><td>

[resourceType()](./puppeteer.httprequest.resourcetype.md)

</td><td>

</td><td>

Contains the request's resource type as it was perceived by the rendering engine.

</td></tr>
<tr><td>

[respond(response, priority)](./puppeteer.httprequest.respond.md)

</td><td>

</td><td>

Fulfills a request with the given response.

</td></tr>
<tr><td>

[response()](./puppeteer.httprequest.response.md)

</td><td>

</td><td>

A matching `HTTPResponse` object, or null if the response has not been received yet.

</td></tr>
<tr><td>

[responseForRequest()](./puppeteer.httprequest.responseforrequest.md)

</td><td>

</td><td>

The `ResponseForRequest` that gets used if the interception is allowed to respond (ie, `abort()` is not called).

</td></tr>
<tr><td>

[url()](./puppeteer.httprequest.url.md)

</td><td>

</td><td>

The URL of the request

</td></tr>
</tbody></table>

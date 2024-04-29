---
sidebar_label: HTTPResponse
---

# HTTPResponse class

The HTTPResponse class represents responses which are received by the [Page](./puppeteer.page.md) class.

#### Signature:

```typescript
export declare abstract class HTTPResponse
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `HTTPResponse` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="buffer">[buffer()](./puppeteer.httpresponse.buffer.md)</span>

</td><td>

</td><td>

Promise which resolves to a buffer with response body.

**Remarks:**

The buffer might be re-encoded by the browser based on HTTP-headers or other heuristics. If the browser failed to detect the correct encoding, the buffer might be encoded incorrectly. See https://github.com/puppeteer/puppeteer/issues/6478.

</td></tr>
<tr><td>

<span id="frame">[frame()](./puppeteer.httpresponse.frame.md)</span>

</td><td>

</td><td>

A [Frame](./puppeteer.frame.md) that initiated this response, or `null` if navigating to error pages.

</td></tr>
<tr><td>

<span id="fromcache">[fromCache()](./puppeteer.httpresponse.fromcache.md)</span>

</td><td>

</td><td>

True if the response was served from either the browser's disk cache or memory cache.

</td></tr>
<tr><td>

<span id="fromserviceworker">[fromServiceWorker()](./puppeteer.httpresponse.fromserviceworker.md)</span>

</td><td>

</td><td>

True if the response was served by a service worker.

</td></tr>
<tr><td>

<span id="headers">[headers()](./puppeteer.httpresponse.headers.md)</span>

</td><td>

</td><td>

An object with HTTP headers associated with the response. All header names are lower-case.

</td></tr>
<tr><td>

<span id="json">[json()](./puppeteer.httpresponse.json.md)</span>

</td><td>

</td><td>

Promise which resolves to a JSON representation of response body.

**Remarks:**

This method will throw if the response body is not parsable via `JSON.parse`.

</td></tr>
<tr><td>

<span id="ok">[ok()](./puppeteer.httpresponse.ok.md)</span>

</td><td>

</td><td>

True if the response was successful (status in the range 200-299).

</td></tr>
<tr><td>

<span id="remoteaddress">[remoteAddress()](./puppeteer.httpresponse.remoteaddress.md)</span>

</td><td>

</td><td>

The IP address and port number used to connect to the remote server.

</td></tr>
<tr><td>

<span id="request">[request()](./puppeteer.httpresponse.request.md)</span>

</td><td>

</td><td>

A matching [HTTPRequest](./puppeteer.httprequest.md) object.

</td></tr>
<tr><td>

<span id="securitydetails">[securityDetails()](./puppeteer.httpresponse.securitydetails.md)</span>

</td><td>

</td><td>

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.

</td></tr>
<tr><td>

<span id="status">[status()](./puppeteer.httpresponse.status.md)</span>

</td><td>

</td><td>

The status code of the response (e.g., 200 for a success).

</td></tr>
<tr><td>

<span id="statustext">[statusText()](./puppeteer.httpresponse.statustext.md)</span>

</td><td>

</td><td>

The status text of the response (e.g. usually an "OK" for a success).

</td></tr>
<tr><td>

<span id="text">[text()](./puppeteer.httpresponse.text.md)</span>

</td><td>

</td><td>

Promise which resolves to a text (utf8) representation of response body.

</td></tr>
<tr><td>

<span id="timing">[timing()](./puppeteer.httpresponse.timing.md)</span>

</td><td>

</td><td>

Timing information related to the response.

</td></tr>
<tr><td>

<span id="url">[url()](./puppeteer.httpresponse.url.md)</span>

</td><td>

</td><td>

The URL of the response.

</td></tr>
</tbody></table>

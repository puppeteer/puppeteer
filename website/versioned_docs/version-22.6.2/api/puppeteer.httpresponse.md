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

[buffer()](./puppeteer.httpresponse.buffer.md)

</td><td>

</td><td>

Promise which resolves to a buffer with response body.

</td></tr>
<tr><td>

[frame()](./puppeteer.httpresponse.frame.md)

</td><td>

</td><td>

A [Frame](./puppeteer.frame.md) that initiated this response, or `null` if navigating to error pages.

</td></tr>
<tr><td>

[fromCache()](./puppeteer.httpresponse.fromcache.md)

</td><td>

</td><td>

True if the response was served from either the browser's disk cache or memory cache.

</td></tr>
<tr><td>

[fromServiceWorker()](./puppeteer.httpresponse.fromserviceworker.md)

</td><td>

</td><td>

True if the response was served by a service worker.

</td></tr>
<tr><td>

[headers()](./puppeteer.httpresponse.headers.md)

</td><td>

</td><td>

An object with HTTP headers associated with the response. All header names are lower-case.

</td></tr>
<tr><td>

[json()](./puppeteer.httpresponse.json.md)

</td><td>

</td><td>

Promise which resolves to a JSON representation of response body.

</td></tr>
<tr><td>

[ok()](./puppeteer.httpresponse.ok.md)

</td><td>

</td><td>

True if the response was successful (status in the range 200-299).

</td></tr>
<tr><td>

[remoteAddress()](./puppeteer.httpresponse.remoteaddress.md)

</td><td>

</td><td>

The IP address and port number used to connect to the remote server.

</td></tr>
<tr><td>

[request()](./puppeteer.httpresponse.request.md)

</td><td>

</td><td>

A matching [HTTPRequest](./puppeteer.httprequest.md) object.

</td></tr>
<tr><td>

[securityDetails()](./puppeteer.httpresponse.securitydetails.md)

</td><td>

</td><td>

[SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or `null` otherwise.

</td></tr>
<tr><td>

[status()](./puppeteer.httpresponse.status.md)

</td><td>

</td><td>

The status code of the response (e.g., 200 for a success).

</td></tr>
<tr><td>

[statusText()](./puppeteer.httpresponse.statustext.md)

</td><td>

</td><td>

The status text of the response (e.g. usually an "OK" for a success).

</td></tr>
<tr><td>

[text()](./puppeteer.httpresponse.text.md)

</td><td>

</td><td>

Promise which resolves to a text (utf8) representation of response body.

</td></tr>
<tr><td>

[timing()](./puppeteer.httpresponse.timing.md)

</td><td>

</td><td>

Timing information related to the response.

</td></tr>
<tr><td>

[url()](./puppeteer.httpresponse.url.md)

</td><td>

</td><td>

The URL of the response.

</td></tr>
</tbody></table>

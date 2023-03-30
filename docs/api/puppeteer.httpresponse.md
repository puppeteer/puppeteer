---
sidebar_label: HTTPResponse
---

# HTTPResponse class

The HTTPResponse class represents responses which are received by the [Page](./puppeteer.page.md) class.

#### Signature:

```typescript
export declare class HTTPResponse
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `HTTPResponse` class.

## Methods

| Method                                                               | Modifiers | Description                                                                                                                                |
| -------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [buffer()](./puppeteer.httpresponse.buffer.md)                       |           | Promise which resolves to a buffer with response body.                                                                                     |
| [frame()](./puppeteer.httpresponse.frame.md)                         |           | A [Frame](./puppeteer.frame.md) that initiated this response, or <code>null</code> if navigating to error pages.                           |
| [fromCache()](./puppeteer.httpresponse.fromcache.md)                 |           | True if the response was served from either the browser's disk cache or memory cache.                                                      |
| [fromServiceWorker()](./puppeteer.httpresponse.fromserviceworker.md) |           | True if the response was served by a service worker.                                                                                       |
| [headers()](./puppeteer.httpresponse.headers.md)                     |           | An object with HTTP headers associated with the response. All header names are lower-case.                                                 |
| [json()](./puppeteer.httpresponse.json.md)                           |           | Promise which resolves to a JSON representation of response body.                                                                          |
| [ok()](./puppeteer.httpresponse.ok.md)                               |           | True if the response was successful (status in the range 200-299).                                                                         |
| [remoteAddress()](./puppeteer.httpresponse.remoteaddress.md)         |           | The IP address and port number used to connect to the remote server.                                                                       |
| [request()](./puppeteer.httpresponse.request.md)                     |           | A matching [HTTPRequest](./puppeteer.httprequest.md) object.                                                                               |
| [securityDetails()](./puppeteer.httpresponse.securitydetails.md)     |           | [SecurityDetails](./puppeteer.securitydetails.md) if the response was received over the secure connection, or <code>null</code> otherwise. |
| [status()](./puppeteer.httpresponse.status.md)                       |           | The status code of the response (e.g., 200 for a success).                                                                                 |
| [statusText()](./puppeteer.httpresponse.statustext.md)               |           | The status text of the response (e.g. usually an "OK" for a success).                                                                      |
| [text()](./puppeteer.httpresponse.text.md)                           |           | Promise which resolves to a text representation of response body.                                                                          |
| [timing()](./puppeteer.httpresponse.timing.md)                       |           | Timing information related to the response.                                                                                                |
| [url()](./puppeteer.httpresponse.url.md)                             |           | The URL of the response.                                                                                                                   |

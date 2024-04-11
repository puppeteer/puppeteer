---
sidebar_label: PageEvents
---

# PageEvents interface

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

#### Signature:

```typescript
export interface PageEvents extends Record<EventType, unknown>
```

**Extends:** Record&lt;[EventType](./puppeteer.eventtype.md), unknown&gt;

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<p id="close">close</p>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="console">console</p>

</td><td>

</td><td>

[ConsoleMessage](./puppeteer.consolemessage.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="dialog">dialog</p>

</td><td>

</td><td>

[Dialog](./puppeteer.dialog.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="domcontentloaded">domcontentloaded</p>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="error">error</p>

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="frameattached">frameattached</p>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="framedetached">framedetached</p>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="framenavigated">framenavigated</p>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="load">load</p>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="metrics">metrics</p>

</td><td>

</td><td>

&#123; title: string; metrics: [Metrics](./puppeteer.metrics.md); &#125;

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="pageerror">pageerror</p>

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="popup">popup</p>

</td><td>

</td><td>

[Page](./puppeteer.page.md) \| null

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="request">request</p>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="requestfailed">requestfailed</p>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="requestfinished">requestfinished</p>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="requestservedfromcache">requestservedfromcache</p>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="response">response</p>

</td><td>

</td><td>

[HTTPResponse](./puppeteer.httpresponse.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="workercreated">workercreated</p>

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<p id="workerdestroyed">workerdestroyed</p>

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>

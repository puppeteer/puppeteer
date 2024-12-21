---
sidebar_label: PageEvents
---

# PageEvents interface

Denotes the objects received by callback functions for page events.

See [PageEvent](./puppeteer.pageevent.md) for more detail on the events and when they are emitted.

### Signature

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

<span id="close">close</span>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="console">console</span>

</td><td>

</td><td>

[ConsoleMessage](./puppeteer.consolemessage.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="dialog">dialog</span>

</td><td>

</td><td>

[Dialog](./puppeteer.dialog.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="domcontentloaded">domcontentloaded</span>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="error">error</span>

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="frameattached">frameattached</span>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="framedetached">framedetached</span>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="framenavigated">framenavigated</span>

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="load">load</span>

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="metrics">metrics</span>

</td><td>

</td><td>

&#123; title: string; metrics: [Metrics](./puppeteer.metrics.md); &#125;

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="pageerror">pageerror</span>

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="popup">popup</span>

</td><td>

</td><td>

[Page](./puppeteer.page.md) \| null

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="request">request</span>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="requestfailed">requestfailed</span>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="requestfinished">requestfinished</span>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="requestservedfromcache">requestservedfromcache</span>

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="response">response</span>

</td><td>

</td><td>

[HTTPResponse](./puppeteer.httpresponse.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="workercreated">workercreated</span>

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="workerdestroyed">workerdestroyed</span>

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>

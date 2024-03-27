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

close

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

console

</td><td>

</td><td>

[ConsoleMessage](./puppeteer.consolemessage.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

dialog

</td><td>

</td><td>

[Dialog](./puppeteer.dialog.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

domcontentloaded

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

error

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

frameattached

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

framedetached

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

framenavigated

</td><td>

</td><td>

[Frame](./puppeteer.frame.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

load

</td><td>

</td><td>

undefined

</td><td>

</td><td>

</td></tr>
<tr><td>

metrics

</td><td>

</td><td>

&#123; title: string; metrics: [Metrics](./puppeteer.metrics.md); &#125;

</td><td>

</td><td>

</td></tr>
<tr><td>

pageerror

</td><td>

</td><td>

Error

</td><td>

</td><td>

</td></tr>
<tr><td>

popup

</td><td>

</td><td>

[Page](./puppeteer.page.md) \| null

</td><td>

</td><td>

</td></tr>
<tr><td>

request

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

requestfailed

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

requestfinished

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

requestservedfromcache

</td><td>

</td><td>

[HTTPRequest](./puppeteer.httprequest.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

response

</td><td>

</td><td>

[HTTPResponse](./puppeteer.httpresponse.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

workercreated

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

workerdestroyed

</td><td>

</td><td>

[WebWorker](./puppeteer.webworker.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>

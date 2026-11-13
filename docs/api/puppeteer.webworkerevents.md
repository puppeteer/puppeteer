---
sidebar_label: WebWorkerEvents
---

# WebWorkerEvents interface

### Signature

```typescript
export interface WebWorkerEvents extends Record<EventType, unknown>
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

<span id="console">console</span>

</td><td>

</td><td>

[ConsoleMessage](./puppeteer.consolemessage.md)

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

<span id="exception">exception</span>

</td><td>

</td><td>

[RemoteException](./puppeteer.remoteexception.md)

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
</tbody></table>

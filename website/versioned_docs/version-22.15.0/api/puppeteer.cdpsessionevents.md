---
sidebar_label: CDPSessionEvents
---

# CDPSessionEvents interface

### Signature

```typescript
export interface CDPSessionEvents extends CDPEvents, Record<EventType, unknown>
```

**Extends:** [CDPEvents](./puppeteer.cdpevents.md), Record&lt;[EventType](./puppeteer.eventtype.md), unknown&gt;

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

<span id="sessionattached">sessionattached</span>

</td><td>

</td><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

<span id="sessiondetached">sessiondetached</span>

</td><td>

</td><td>

[CDPSession](./puppeteer.cdpsession.md)

</td><td>

</td><td>

</td></tr>
</tbody></table>

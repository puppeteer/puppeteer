---
sidebar_label: CDPSessionEvents
---

# CDPSessionEvents interface

#### Signature:

```typescript
export interface CDPSessionEvents extends CDPEvents, Record<EventType, unknown>
```

**Extends:** [CDPEvents](./puppeteer.cdpevents.md), Record&lt;[EventType](./puppeteer.eventtype.md), unknown&gt;

## Properties

| Property        | Modifiers | Type                                    | Description | Default |
| --------------- | --------- | --------------------------------------- | ----------- | ------- |
| sessionattached |           | [CDPSession](./puppeteer.cdpsession.md) |             |         |
| sessiondetached |           | [CDPSession](./puppeteer.cdpsession.md) |             |         |

---
sidebar_label: BrowserContextEvents
---

# BrowserContextEvents interface

#### Signature:

```typescript
export interface BrowserContextEvents extends Record<EventType, unknown>
```

**Extends:** Record&lt;[EventType](./puppeteer.eventtype.md), unknown&gt;

## Properties

| Property        | Modifiers | Type                            | Description | Default |
| --------------- | --------- | ------------------------------- | ----------- | ------- |
| targetchanged   |           | [Target](./puppeteer.target.md) |             |         |
| targetcreated   |           | [Target](./puppeteer.target.md) |             |         |
| targetdestroyed |           | [Target](./puppeteer.target.md) |             |         |

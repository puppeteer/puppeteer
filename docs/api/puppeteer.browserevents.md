---
sidebar_label: BrowserEvents
---

# BrowserEvents interface

#### Signature:

```typescript
export interface BrowserEvents extends Record<EventType, unknown>
```

**Extends:** Record&lt;EventType, unknown&gt;

## Properties

| Property        | Modifiers | Type                            | Description | Default |
| --------------- | --------- | ------------------------------- | ----------- | ------- |
| disconnected    |           | undefined                       |             |         |
| targetchanged   |           | [Target](./puppeteer.target.md) |             |         |
| targetcreated   |           | [Target](./puppeteer.target.md) |             |         |
| targetdestroyed |           | [Target](./puppeteer.target.md) |             |         |

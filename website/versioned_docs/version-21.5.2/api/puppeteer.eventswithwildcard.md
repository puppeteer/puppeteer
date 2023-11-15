---
sidebar_label: EventsWithWildcard
---

# EventsWithWildcard type

#### Signature:

```typescript
export type EventsWithWildcard<Events extends Record<EventType, unknown>> =
  Events & {
    '*': Events[keyof Events];
  };
```

**References:** [EventType](./puppeteer.eventtype.md)

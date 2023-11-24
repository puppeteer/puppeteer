---
sidebar_label: EventsWithWildcard
---

# EventsWithWildcard type

#### Signature:

```typescript
export type EventsWithWildcard<Events extends Record<EventType, unknown>> = Events & &#123;
    '*': Events[keyof Events];
&#125;;
```

**References:** [EventType](./puppeteer.eventtype.md)

---
sidebar_label: EventEmitter.emit
---

# EventEmitter.emit() method

Emit an event and call any associated listeners.

#### Signature:

```typescript
class EventEmitter \{emit<Key extends keyof EventsWithWildcard<Events>>(type: Key, event: EventsWithWildcard<Events>[Key]): boolean;\}
```

## Parameters

| Parameter | Type                                                                         | Description                  |
| --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| type      | Key                                                                          | the event you'd like to emit |
| event     | [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\] |                              |

**Returns:**

boolean

`true` if there are any listeners, `false` if there are not.

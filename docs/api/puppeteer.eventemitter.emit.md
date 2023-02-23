---
sidebar_label: EventEmitter.emit
---

# EventEmitter.emit() method

Emit an event and call any associated listeners.

#### Signature:

```typescript
class EventEmitter {
  emit(event: EventType, eventData?: unknown): boolean;
}
```

## Parameters

| Parameter | Type                                  | Description                                             |
| --------- | ------------------------------------- | ------------------------------------------------------- |
| event     | [EventType](./puppeteer.eventtype.md) | the event you'd like to emit                            |
| eventData | unknown                               | _(Optional)_ any data you'd like to emit with the event |

**Returns:**

boolean

`true` if there are any listeners, `false` if there are not.

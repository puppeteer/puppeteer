---
sidebar_label: EventEmitter.listenerCount
---

# EventEmitter.listenerCount() method

Gets the number of listeners for a given event.

#### Signature:

```typescript
class EventEmitter {
  listenerCount(event: EventType): number;
}
```

## Parameters

| Parameter | Type                                  | Description                             |
| --------- | ------------------------------------- | --------------------------------------- |
| event     | [EventType](./puppeteer.eventtype.md) | the event to get the listener count for |

**Returns:**

number

the number of listeners bound to the given event

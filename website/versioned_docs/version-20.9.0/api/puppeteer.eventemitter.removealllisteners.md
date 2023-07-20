---
sidebar_label: EventEmitter.removeAllListeners
---

# EventEmitter.removeAllListeners() method

Removes all listeners. If given an event argument, it will remove only listeners for that event.

#### Signature:

```typescript
class EventEmitter {
  removeAllListeners(event?: EventType): this;
}
```

## Parameters

| Parameter | Type                                  | Description                                     |
| --------- | ------------------------------------- | ----------------------------------------------- |
| event     | [EventType](./puppeteer.eventtype.md) | _(Optional)_ the event to remove listeners for. |

**Returns:**

this

`this` to enable you to chain method calls.

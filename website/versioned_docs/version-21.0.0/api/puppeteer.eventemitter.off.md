---
sidebar_label: EventEmitter.off
---

# EventEmitter.off() method

Remove an event listener from firing.

#### Signature:

```typescript
class EventEmitter {
  off(event: EventType, handler: Handler<any>): this;
}
```

## Parameters

| Parameter | Type                                         | Description                                     |
| --------- | -------------------------------------------- | ----------------------------------------------- |
| event     | [EventType](./puppeteer.eventtype.md)        | the event type you'd like to stop listening to. |
| handler   | [Handler](./puppeteer.handler.md)&lt;any&gt; | the function that should be removed.            |

**Returns:**

this

`this` to enable you to chain method calls.

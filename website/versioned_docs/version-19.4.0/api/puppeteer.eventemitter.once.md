---
sidebar_label: EventEmitter.once
---

# EventEmitter.once() method

Like `on` but the listener will only be fired once and then it will be removed.

#### Signature:

```typescript
class EventEmitter {
  once(event: EventType, handler: Handler<any>): EventEmitter;
}
```

## Parameters

| Parameter | Type                                         | Description                                       |
| --------- | -------------------------------------------- | ------------------------------------------------- |
| event     | [EventType](./puppeteer.eventtype.md)        | the event you'd like to listen to                 |
| handler   | [Handler](./puppeteer.handler.md)&lt;any&gt; | the handler function to run when the event occurs |

**Returns:**

[EventEmitter](./puppeteer.eventemitter.md)

`this` to enable you to chain method calls.

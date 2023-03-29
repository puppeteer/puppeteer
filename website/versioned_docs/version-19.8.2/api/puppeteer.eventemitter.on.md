---
sidebar_label: EventEmitter.on
---

# EventEmitter.on() method

Bind an event listener to fire when an event occurs.

#### Signature:

```typescript
class EventEmitter {
  on(event: EventType, handler: Handler<any>): EventEmitter;
}
```

## Parameters

| Parameter | Type                                         | Description                                                        |
| --------- | -------------------------------------------- | ------------------------------------------------------------------ |
| event     | [EventType](./puppeteer.eventtype.md)        | the event type you'd like to listen to. Can be a string or symbol. |
| handler   | [Handler](./puppeteer.handler.md)&lt;any&gt; | the function to be called when the event occurs.                   |

**Returns:**

[EventEmitter](./puppeteer.eventemitter.md)

`this` to enable you to chain method calls.

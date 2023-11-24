---
sidebar_label: EventEmitter.on
---

# EventEmitter.on() method

Bind an event listener to fire when an event occurs.

#### Signature:

```typescript
class EventEmitter &#123;on<Key extends keyof EventsWithWildcard<Events>>(type: Key, handler: Handler<EventsWithWildcard<Events>[Key]>): this;&#125;
```

## Parameters

| Parameter | Type                                                                                                                  | Description                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| type      | Key                                                                                                                   | the event type you'd like to listen to. Can be a string or symbol. |
| handler   | [Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt; | the function to be called when the event occurs.                   |

**Returns:**

this

`this` to enable you to chain method calls.

---
sidebar_label: EventEmitter.once
---

# EventEmitter.once() method

Like `on` but the listener will only be fired once and then it will be removed.

#### Signature:

```typescript
class EventEmitter {
  once<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>
  ): this;
}
```

## Parameters

| Parameter | Type                                                                                                                  | Description                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| type      | Key                                                                                                                   | the event you'd like to listen to                 |
| handler   | [Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt; | the handler function to run when the event occurs |

**Returns:**

this

`this` to enable you to chain method calls.

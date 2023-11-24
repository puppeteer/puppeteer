---
sidebar_label: EventEmitter.off
---

# EventEmitter.off() method

Remove an event listener from firing.

#### Signature:

```typescript
class EventEmitter &#123;off<Key extends keyof EventsWithWildcard<Events>>(type: Key, handler?: Handler<EventsWithWildcard<Events>[Key]>): this;&#125;
```

## Parameters

| Parameter | Type                                                                                                                  | Description                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| type      | Key                                                                                                                   | the event type you'd like to stop listening to.   |
| handler   | [Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt; | _(Optional)_ the function that should be removed. |

**Returns:**

this

`this` to enable you to chain method calls.

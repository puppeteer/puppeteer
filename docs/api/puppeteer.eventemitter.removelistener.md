---
sidebar_label: EventEmitter.removeListener
---

# EventEmitter.removeListener() method

> Warning: This API is now obsolete.
>
> please use [EventEmitter.off()](./puppeteer.eventemitter.off.md) instead.

Remove an event listener.

#### Signature:

```typescript
class EventEmitter \{removeListener<Key extends keyof EventsWithWildcard<Events>>(type: Key, handler: Handler<EventsWithWildcard<Events>[Key]>): this;\}
```

## Parameters

| Parameter | Type                                                                                                                  | Description |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| type      | Key                                                                                                                   |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt; |             |

**Returns:**

this

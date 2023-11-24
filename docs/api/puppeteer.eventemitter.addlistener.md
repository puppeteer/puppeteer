---
sidebar_label: EventEmitter.addListener
---

# EventEmitter.addListener() method

> Warning: This API is now obsolete.
>
> please use [EventEmitter.on()](./puppeteer.eventemitter.on.md) instead.

Add an event listener.

#### Signature:

```typescript
class EventEmitter &#123;addListener<Key extends keyof EventsWithWildcard<Events>>(type: Key, handler: Handler<EventsWithWildcard<Events>[Key]>): this;&#125;
```

## Parameters

| Parameter | Type                                                                                                                  | Description |
| --------- | --------------------------------------------------------------------------------------------------------------------- | ----------- |
| type      | Key                                                                                                                   |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt; |             |

**Returns:**

this

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
class EventEmitter {
  addListener(event: EventType, handler: Handler<any>): this;
}
```

## Parameters

| Parameter | Type                                         | Description |
| --------- | -------------------------------------------- | ----------- |
| event     | [EventType](./puppeteer.eventtype.md)        |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;any&gt; |             |

**Returns:**

this

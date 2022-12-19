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
class EventEmitter {
  removeListener(event: EventType, handler: Handler<any>): EventEmitter;
}
```

## Parameters

| Parameter | Type                                         | Description |
| --------- | -------------------------------------------- | ----------- |
| event     | [EventType](./puppeteer.eventtype.md)        |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;any&gt; |             |

**Returns:**

[EventEmitter](./puppeteer.eventemitter.md)

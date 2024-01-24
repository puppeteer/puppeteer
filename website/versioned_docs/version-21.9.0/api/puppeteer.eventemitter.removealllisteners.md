---
sidebar_label: EventEmitter.removeAllListeners
---

# EventEmitter.removeAllListeners() method

Removes all listeners. If given an event argument, it will remove only listeners for that event.

#### Signature:

```typescript
class EventEmitter {
  removeAllListeners(type?: keyof EventsWithWildcard<Events>): this;
}
```

## Parameters

| Parameter | Type                                                                        | Description                                     |
| --------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| type      | keyof [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt; | _(Optional)_ the event to remove listeners for. |

**Returns:**

this

`this` to enable you to chain method calls.

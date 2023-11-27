---
sidebar_label: EventEmitter.listenerCount
---

# EventEmitter.listenerCount() method

Gets the number of listeners for a given event.

#### Signature:

```typescript
class EventEmitter \{listenerCount(type: keyof EventsWithWildcard<Events>): number;\}
```

## Parameters

| Parameter | Type                                                                        | Description                             |
| --------- | --------------------------------------------------------------------------- | --------------------------------------- |
| type      | keyof [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt; | the event to get the listener count for |

**Returns:**

number

the number of listeners bound to the given event

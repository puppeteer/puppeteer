---
sidebar_label: Page.on
---

# Page.on() method

Listen to page events.

:::note

This method exists to define event typings and handle proper wireup of cooperative request interception. Actual event listening and dispatching is delegated to [EventEmitter](./puppeteer.eventemitter.md).

:::

#### Signature:

```typescript
class Page {
  on<K extends keyof PageEventObject>(
    eventName: K,
    handler: (event: PageEventObject[K]) => void
  ): EventEmitter;
}
```

## Parameters

| Parameter | Type                                                                       | Description |
| --------- | -------------------------------------------------------------------------- | ----------- |
| eventName | K                                                                          |             |
| handler   | (event: [PageEventObject](./puppeteer.pageeventobject.md)\[K\]) =&gt; void |             |

**Returns:**

[EventEmitter](./puppeteer.eventemitter.md)

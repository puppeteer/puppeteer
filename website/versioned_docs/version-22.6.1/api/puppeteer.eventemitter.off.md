---
sidebar_label: EventEmitter.off
---

# EventEmitter.off() method

Remove an event listener from firing.

#### Signature:

```typescript
class EventEmitter {
  off<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler?: Handler<EventsWithWildcard<Events>[Key]>
  ): this;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

type

</td><td>

Key

</td><td>

the event type you'd like to stop listening to.

</td></tr>
<tr><td>

handler

</td><td>

[Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt;

</td><td>

_(Optional)_ the function that should be removed.

</td></tr>
</tbody></table>
**Returns:**

this

`this` to enable you to chain method calls.

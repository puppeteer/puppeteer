---
sidebar_label: EventEmitter.once
---

# EventEmitter.once() method

Like `on` but the listener will only be fired once and then it will be removed.

### Signature

```typescript
class EventEmitter {
  once<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>,
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

the event you'd like to listen to

</td></tr>
<tr><td>

handler

</td><td>

[Handler](./puppeteer.handler.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]&gt;

</td><td>

the handler function to run when the event occurs

</td></tr>
</tbody></table>
**Returns:**

this

`this` to enable you to chain method calls.

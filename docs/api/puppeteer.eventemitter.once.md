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
    handler: (
      event: EventsWithWildcard<Events>[Key],
      eventData: Key extends '*' ? Events[keyof Events] : never,
    ) => void,
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

(event: [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\], eventData: Key extends '\*' ? Events\[keyof Events\] : never) =&gt; void

</td><td>

the handler function to run when the event occurs

</td></tr>
</tbody></table>

**Returns:**

this

`this` to enable you to chain method calls.

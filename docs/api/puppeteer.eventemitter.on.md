---
sidebar_label: EventEmitter.on
---

# EventEmitter.on() method

Bind an event listener to fire when an event occurs.

### Signature

```typescript
class EventEmitter {
  on<Key extends keyof EventsWithWildcard<Events>>(
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

the event type you'd like to listen to. Can be a string or symbol.

</td></tr>
<tr><td>

handler

</td><td>

(event: [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\], eventData: Key extends '\*' ? Events\[keyof Events\] : never) =&gt; void

</td><td>

the function to be called when the event occurs.

</td></tr>
</tbody></table>

**Returns:**

this

`this` to enable you to chain method calls.

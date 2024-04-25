---
sidebar_label: EventEmitter.emit
---

# EventEmitter.emit() method

Emit an event and call any associated listeners.

#### Signature:

```typescript
class EventEmitter {
  emit<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    event: EventsWithWildcard<Events>[Key]
  ): boolean;
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

the event you'd like to emit

</td></tr>
<tr><td>

event

</td><td>

[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;\[Key\]

</td><td>

</td></tr>
</tbody></table>
**Returns:**

boolean

`true` if there are any listeners, `false` if there are not.

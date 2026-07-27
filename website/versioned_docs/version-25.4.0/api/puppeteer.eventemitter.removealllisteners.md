---
sidebar_label: EventEmitter.removeAllListeners
---

# EventEmitter.removeAllListeners() method

Removes all listeners. If given an event argument, it will remove only listeners for that event.

### Signature

```typescript
class EventEmitter {
  removeAllListeners(type?: keyof EventsWithWildcard<Events>): this;
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

keyof [EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;

</td><td>

_(Optional)_ the event to remove listeners for.

</td></tr>
</tbody></table>

**Returns:**

this

`this` to enable you to chain method calls.

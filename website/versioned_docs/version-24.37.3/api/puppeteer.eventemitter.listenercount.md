---
sidebar_label: EventEmitter.listenerCount
---

# EventEmitter.listenerCount() method

Gets the number of listeners for a given event.

### Signature

```typescript
class EventEmitter {
  listenerCount(type: keyof EventsWithWildcard<Events>): number;
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

the event to get the listener count for

</td></tr>
</tbody></table>

**Returns:**

number

the number of listeners bound to the given event

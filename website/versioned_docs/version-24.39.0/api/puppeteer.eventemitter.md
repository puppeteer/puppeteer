---
sidebar_label: EventEmitter
---

# EventEmitter class

The EventEmitter class that many Puppeteer classes extend.

### Signature

```typescript
export declare class EventEmitter<Events extends Record<EventType, unknown>> implements CommonEventEmitter<EventsWithWildcard<Events>>
```

**Implements:** [CommonEventEmitter](./puppeteer.commoneventemitter.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;&gt;

## Remarks

This allows you to listen to events that Puppeteer classes fire and act accordingly. Therefore you'll mostly use [on](./puppeteer.eventemitter.on.md) and [off](./puppeteer.eventemitter.off.md) to bind and unbind to event listeners.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `EventEmitter` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="emit">[emit(type, event)](./puppeteer.eventemitter.emit.md)</span>

</td><td>

</td><td>

Emit an event and call any associated listeners.

</td></tr>
<tr><td>

<span id="listenercount">[listenerCount(type)](./puppeteer.eventemitter.listenercount.md)</span>

</td><td>

</td><td>

Gets the number of listeners for a given event.

</td></tr>
<tr><td>

<span id="off">[off(type, handler)](./puppeteer.eventemitter.off.md)</span>

</td><td>

</td><td>

Remove an event listener from firing.

</td></tr>
<tr><td>

<span id="on">[on(type, handler)](./puppeteer.eventemitter.on.md)</span>

</td><td>

</td><td>

Bind an event listener to fire when an event occurs.

</td></tr>
<tr><td>

<span id="once">[once(type, handler)](./puppeteer.eventemitter.once.md)</span>

</td><td>

</td><td>

Like `on` but the listener will only be fired once and then it will be removed.

</td></tr>
<tr><td>

<span id="removealllisteners">[removeAllListeners(type)](./puppeteer.eventemitter.removealllisteners.md)</span>

</td><td>

</td><td>

Removes all listeners. If given an event argument, it will remove only listeners for that event.

</td></tr>
</tbody></table>

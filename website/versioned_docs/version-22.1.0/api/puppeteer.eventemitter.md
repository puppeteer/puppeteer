---
sidebar_label: EventEmitter
---

# EventEmitter class

The EventEmitter class that many Puppeteer classes extend.

#### Signature:

```typescript
export declare class EventEmitter<Events extends Record<EventType, unknown>> implements CommonEventEmitter<EventsWithWildcard<Events>>
```

**Implements:** [CommonEventEmitter](./puppeteer.commoneventemitter.md)&lt;[EventsWithWildcard](./puppeteer.eventswithwildcard.md)&lt;Events&gt;&gt;

## Remarks

This allows you to listen to events that Puppeteer classes fire and act accordingly. Therefore you'll mostly use [on](./puppeteer.eventemitter.on.md) and [off](./puppeteer.eventemitter.off.md) to bind and unbind to event listeners.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `EventEmitter` class.

## Methods

| Method                                                                     | Modifiers | Description                                                                                      |
| -------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| [emit(type, event)](./puppeteer.eventemitter.emit.md)                      |           | Emit an event and call any associated listeners.                                                 |
| [listenerCount(type)](./puppeteer.eventemitter.listenercount.md)           |           | Gets the number of listeners for a given event.                                                  |
| [off(type, handler)](./puppeteer.eventemitter.off.md)                      |           | Remove an event listener from firing.                                                            |
| [on(type, handler)](./puppeteer.eventemitter.on.md)                        |           | Bind an event listener to fire when an event occurs.                                             |
| [once(type, handler)](./puppeteer.eventemitter.once.md)                    |           | Like <code>on</code> but the listener will only be fired once and then it will be removed.       |
| [removeAllListeners(type)](./puppeteer.eventemitter.removealllisteners.md) |           | Removes all listeners. If given an event argument, it will remove only listeners for that event. |

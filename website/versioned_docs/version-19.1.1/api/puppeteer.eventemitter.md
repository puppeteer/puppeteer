---
sidebar_label: EventEmitter
---

# EventEmitter class

The EventEmitter class that many Puppeteer classes extend.

#### Signature:

```typescript
export declare class EventEmitter implements CommonEventEmitter
```

**Implements:** [CommonEventEmitter](./puppeteer.commoneventemitter.md)

## Remarks

This allows you to listen to events that Puppeteer classes fire and act accordingly. Therefore you'll mostly use [on](./puppeteer.eventemitter.on.md) and [off](./puppeteer.eventemitter.off.md) to bind and unbind to event listeners.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `EventEmitter` class.

## Methods

| Method                                                                       | Modifiers | Description                                                                                      |
| ---------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ |
| [addListener(event, handler)](./puppeteer.eventemitter.addlistener.md)       |           | Add an event listener.                                                                           |
| [emit(event, eventData)](./puppeteer.eventemitter.emit.md)                   |           | Emit an event and call any associated listeners.                                                 |
| [listenerCount(event)](./puppeteer.eventemitter.listenercount.md)            |           | Gets the number of listeners for a given event.                                                  |
| [off(event, handler)](./puppeteer.eventemitter.off.md)                       |           | Remove an event listener from firing.                                                            |
| [on(event, handler)](./puppeteer.eventemitter.on.md)                         |           | Bind an event listener to fire when an event occurs.                                             |
| [once(event, handler)](./puppeteer.eventemitter.once.md)                     |           | Like <code>on</code> but the listener will only be fired once and then it will be removed.       |
| [removeAllListeners(event)](./puppeteer.eventemitter.removealllisteners.md)  |           | Removes all listeners. If given an event argument, it will remove only listeners for that event. |
| [removeListener(event, handler)](./puppeteer.eventemitter.removelistener.md) |           | Remove an event listener.                                                                        |

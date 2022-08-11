import mitt, {
  Emitter,
  EventType,
  Handler,
} from '../../vendor/mitt/src/index.js';

/**
 * @public
 */
export {EventType, Handler};

/**
 * @public
 */
export interface CommonEventEmitter {
  on(event: EventType, handler: Handler): CommonEventEmitter;
  off(event: EventType, handler: Handler): CommonEventEmitter;
  /* To maintain parity with the built in NodeJS event emitter which uses removeListener
   * rather than `off`.
   * If you're implementing new code you should use `off`.
   */
  addListener(event: EventType, handler: Handler): CommonEventEmitter;
  removeListener(event: EventType, handler: Handler): CommonEventEmitter;
  emit(event: EventType, eventData?: unknown): boolean;
  once(event: EventType, handler: Handler): CommonEventEmitter;
  listenerCount(event: string): number;

  removeAllListeners(event?: EventType): CommonEventEmitter;
}

/**
 * The EventEmitter class that many Puppeteer classes extend.
 *
 * @remarks
 *
 * This allows you to listen to events that Puppeteer classes fire and act
 * accordingly. Therefore you'll mostly use {@link EventEmitter.on | on} and
 * {@link EventEmitter.off | off} to bind
 * and unbind to event listeners.
 *
 * @public
 */
export class EventEmitter implements CommonEventEmitter {
  private emitter: Emitter;
  private eventsMap = new Map<EventType, Handler[]>();

  /**
   * @internal
   */
  constructor() {
    this.emitter = mitt(this.eventsMap);
  }

  /**
   * Bind an event listener to fire when an event occurs.
   * @param event - the event type you'd like to listen to. Can be a string or symbol.
   * @param handler - the function to be called when the event occurs.
   * @returns `this` to enable you to chain method calls.
   */
  on(event: EventType, handler: Handler): EventEmitter {
    this.emitter.on(event, handler);
    return this;
  }

  /**
   * Remove an event listener from firing.
   * @param event - the event type you'd like to stop listening to.
   * @param handler - the function that should be removed.
   * @returns `this` to enable you to chain method calls.
   */
  off(event: EventType, handler: Handler): EventEmitter {
    this.emitter.off(event, handler);
    return this;
  }

  /**
   * Remove an event listener.
   * @deprecated please use {@link EventEmitter.off} instead.
   */
  removeListener(event: EventType, handler: Handler): EventEmitter {
    this.off(event, handler);
    return this;
  }

  /**
   * Add an event listener.
   * @deprecated please use {@link EventEmitter.on} instead.
   */
  addListener(event: EventType, handler: Handler): EventEmitter {
    this.on(event, handler);
    return this;
  }

  /**
   * Emit an event and call any associated listeners.
   *
   * @param event - the event you'd like to emit
   * @param eventData - any data you'd like to emit with the event
   * @returns `true` if there are any listeners, `false` if there are not.
   */
  emit(event: EventType, eventData?: unknown): boolean {
    this.emitter.emit(event, eventData);
    return this.eventListenersCount(event) > 0;
  }

  /**
   * Like `on` but the listener will only be fired once and then it will be removed.
   * @param event - the event you'd like to listen to
   * @param handler - the handler function to run when the event occurs
   * @returns `this` to enable you to chain method calls.
   */
  once(event: EventType, handler: Handler): EventEmitter {
    const onceHandler: Handler = eventData => {
      handler(eventData);
      this.off(event, onceHandler);
    };

    return this.on(event, onceHandler);
  }

  /**
   * Gets the number of listeners for a given event.
   *
   * @param event - the event to get the listener count for
   * @returns the number of listeners bound to the given event
   */
  listenerCount(event: EventType): number {
    return this.eventListenersCount(event);
  }

  /**
   * Removes all listeners. If given an event argument, it will remove only
   * listeners for that event.
   * @param event - the event to remove listeners for.
   * @returns `this` to enable you to chain method calls.
   */
  removeAllListeners(event?: EventType): EventEmitter {
    if (event) {
      this.eventsMap.delete(event);
    } else {
      this.eventsMap.clear();
    }
    return this;
  }

  private eventListenersCount(event: EventType): number {
    return this.eventsMap.get(event)?.length || 0;
  }
}

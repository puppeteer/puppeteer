import mitt, { Emitter, EventType, Handler } from 'mitt';

export interface CommonEventEmitter {
  on(event: EventType, handler: Handler): CommonEventEmitter;
  off(event: EventType, handler: Handler): CommonEventEmitter;
  /* To maintain parity with the built in NodeJS event emitter which uses removeListener
   * rather than `off`.
   * If you're implementing new code you should use `off`.
   */
  addListener(event: EventType, handler: Handler): CommonEventEmitter;
  removeListener(event: EventType, handler: Handler): CommonEventEmitter;
  emit(event: EventType, eventData?: any): boolean;
  once(event: EventType, handler: Handler): CommonEventEmitter;
  listenerCount(event: string): number;

  removeAllListeners(event?: EventType): CommonEventEmitter;
}

export class EventEmitter implements CommonEventEmitter {
  private emitter: Emitter;
  private eventsMap = new Map<EventType, Handler[]>();

  constructor() {
    this.emitter = mitt(this.eventsMap);
  }

  on(event: EventType, handler: Handler): EventEmitter {
    this.emitter.on(event, handler);
    return this;
  }

  off(event: EventType, handler: Handler): EventEmitter {
    this.emitter.off(event, handler);
    return this;
  }

  removeListener(event: EventType, handler: Handler): EventEmitter {
    this.off(event, handler);
    return this;
  }

  addListener(event: EventType, handler: Handler): EventEmitter {
    this.on(event, handler);
    return this;
  }

  emit(event: EventType, eventData?: any): boolean {
    this.emitter.emit(event, eventData);
    return this.eventListenersCount(event) > 0;
  }

  once(event: EventType, handler: Handler): EventEmitter {
    const onceHandler: Handler = (eventData) => {
      handler(eventData);
      this.off(event, onceHandler);
    };

    return this.on(event, onceHandler);
  }

  listenerCount(event: EventType): number {
    return this.eventListenersCount(event);
  }

  removeAllListeners(event?: EventType): EventEmitter {
    if (event) {
      this.eventsMap.delete(event);
    } else {
      this.eventsMap.clear();
    }
    return this;
  }

  private eventListenersCount(event: EventType): number {
    return this.eventsMap.has(event) ? this.eventsMap.get(event).length : 0;
  }
}

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
  emit(event: EventType, eventData?: any): void;
  once(event: EventType, handler: Handler): void;
  listenerCount(event: string): number;
}

export class EventEmitter implements CommonEventEmitter {
  private emitter: Emitter;
  private listenerCounts = new Map<EventType, number>();

  constructor() {
    this.emitter = mitt(new Map());
  }

  on(event: EventType, handler: Handler): EventEmitter {
    this.emitter.on(event, handler);
    const existingCounts = this.listenerCounts.get(event);
    if (existingCounts) {
      this.listenerCounts.set(event, existingCounts + 1);
    } else {
      this.listenerCounts.set(event, 1);
    }
    return this;
  }

  off(event: EventType, handler: Handler): EventEmitter {
    this.emitter.off(event, handler);

    const existingCounts = this.listenerCounts.get(event);
    this.listenerCounts.set(event, existingCounts - 1);
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

  emit(event: EventType, eventData?: any): void {
    this.emitter.emit(event, eventData);
  }

  once(event: EventType, handler: Handler): void {
    const onceHandler: Handler = (eventData) => {
      handler(eventData);
      this.off(event, onceHandler);
    };

    this.on(event, onceHandler);
  }

  listenerCount(event: EventType): number {
    return this.listenerCounts.get(event) || 0;
  }
}

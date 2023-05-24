/**
 * Copyright 2022 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import mitt, {Emitter, EventHandlerMap} from '../../third_party/mitt/index.js';

/**
 * @public
 */
export type EventType = string | symbol;
/**
 * @public
 */
export type Handler<T = unknown> = (event: T) => void;

/**
 * @public
 */
export interface CommonEventEmitter {
  on(event: EventType, handler: Handler): this;
  off(event: EventType, handler: Handler): this;
  /* To maintain parity with the built in NodeJS event emitter which uses removeListener
   * rather than `off`.
   * If you're implementing new code you should use `off`.
   */
  addListener(event: EventType, handler: Handler): this;
  removeListener(event: EventType, handler: Handler): this;
  emit(event: EventType, eventData?: unknown): boolean;
  once(event: EventType, handler: Handler): this;
  listenerCount(event: string): number;

  removeAllListeners(event?: EventType): this;
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
  private emitter: Emitter<Record<string | symbol, any>>;
  private eventsMap: EventHandlerMap<Record<string | symbol, any>> = new Map();

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
  on(event: EventType, handler: Handler<any>): this {
    this.emitter.on(event, handler);
    return this;
  }

  /**
   * Remove an event listener from firing.
   * @param event - the event type you'd like to stop listening to.
   * @param handler - the function that should be removed.
   * @returns `this` to enable you to chain method calls.
   */
  off(event: EventType, handler: Handler<any>): this {
    this.emitter.off(event, handler);
    return this;
  }

  /**
   * Remove an event listener.
   * @deprecated please use {@link EventEmitter.off} instead.
   */
  removeListener(event: EventType, handler: Handler<any>): this {
    this.off(event, handler);
    return this;
  }

  /**
   * Add an event listener.
   * @deprecated please use {@link EventEmitter.on} instead.
   */
  addListener(event: EventType, handler: Handler<any>): this {
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
  once(event: EventType, handler: Handler<any>): this {
    const onceHandler: Handler<any> = eventData => {
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
  removeAllListeners(event?: EventType): this {
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

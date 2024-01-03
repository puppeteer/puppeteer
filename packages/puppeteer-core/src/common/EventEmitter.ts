/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import mitt, {
  type Emitter,
  type EventHandlerMap,
} from '../../third_party/mitt/mitt.js';
import {disposeSymbol} from '../util/disposable.js';

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
export interface CommonEventEmitter<Events extends Record<EventType, unknown>> {
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): this;
  off<Key extends keyof Events>(
    type: Key,
    handler?: Handler<Events[Key]>
  ): this;
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): boolean;
  /* To maintain parity with the built in NodeJS event emitter which uses removeListener
   * rather than `off`.
   * If you're implementing new code you should use `off`.
   */
  addListener<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): this;
  removeListener<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): this;
  once<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): this;
  listenerCount(event: keyof Events): number;

  removeAllListeners(event?: keyof Events): this;
}

/**
 * @public
 */
export type EventsWithWildcard<Events extends Record<EventType, unknown>> =
  Events & {
    '*': Events[keyof Events];
  };

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
export class EventEmitter<Events extends Record<EventType, unknown>>
  implements CommonEventEmitter<EventsWithWildcard<Events>>
{
  #emitter: Emitter<Events & {'*': Events[keyof Events]}>;
  #handlers: EventHandlerMap<Events & {'*': Events[keyof Events]}> = new Map();

  /**
   * @internal
   */
  constructor() {
    this.#emitter = mitt(this.#handlers);
  }

  /**
   * Bind an event listener to fire when an event occurs.
   * @param type - the event type you'd like to listen to. Can be a string or symbol.
   * @param handler - the function to be called when the event occurs.
   * @returns `this` to enable you to chain method calls.
   */
  on<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>
  ): this {
    this.#emitter.on(type, handler);
    return this;
  }

  /**
   * Remove an event listener from firing.
   * @param type - the event type you'd like to stop listening to.
   * @param handler - the function that should be removed.
   * @returns `this` to enable you to chain method calls.
   */
  off<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler?: Handler<EventsWithWildcard<Events>[Key]>
  ): this {
    this.#emitter.off(type, handler);
    return this;
  }

  /**
   * Remove an event listener.
   *
   * @deprecated please use {@link EventEmitter.off} instead.
   */
  removeListener<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>
  ): this {
    this.off(type, handler);
    return this;
  }

  /**
   * Add an event listener.
   *
   * @deprecated please use {@link EventEmitter.on} instead.
   */
  addListener<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>
  ): this {
    this.on(type, handler);
    return this;
  }

  /**
   * Emit an event and call any associated listeners.
   *
   * @param type - the event you'd like to emit
   * @param eventData - any data you'd like to emit with the event
   * @returns `true` if there are any listeners, `false` if there are not.
   */
  emit<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    event: EventsWithWildcard<Events>[Key]
  ): boolean {
    this.#emitter.emit(type, event);
    return this.listenerCount(type) > 0;
  }

  /**
   * Like `on` but the listener will only be fired once and then it will be removed.
   * @param type - the event you'd like to listen to
   * @param handler - the handler function to run when the event occurs
   * @returns `this` to enable you to chain method calls.
   */
  once<Key extends keyof EventsWithWildcard<Events>>(
    type: Key,
    handler: Handler<EventsWithWildcard<Events>[Key]>
  ): this {
    const onceHandler: Handler<EventsWithWildcard<Events>[Key]> = eventData => {
      handler(eventData);
      this.off(type, onceHandler);
    };

    return this.on(type, onceHandler);
  }

  /**
   * Gets the number of listeners for a given event.
   *
   * @param type - the event to get the listener count for
   * @returns the number of listeners bound to the given event
   */
  listenerCount(type: keyof EventsWithWildcard<Events>): number {
    return this.#handlers.get(type)?.length || 0;
  }

  /**
   * Removes all listeners. If given an event argument, it will remove only
   * listeners for that event.
   *
   * @param type - the event to remove listeners for.
   * @returns `this` to enable you to chain method calls.
   */
  removeAllListeners(type?: keyof EventsWithWildcard<Events>): this {
    if (type === undefined || type === '*') {
      this.#handlers.clear();
    } else {
      this.#handlers.delete(type);
    }
    return this;
  }
}

/**
 * @internal
 */
export class EventSubscription<
  Target extends CommonEventEmitter<Record<Type, Event>>,
  Type extends EventType = EventType,
  Event = unknown,
> {
  #target: Target;
  #type: Type;
  #handler: Handler<Event>;

  constructor(target: Target, type: Type, handler: Handler<Event>) {
    this.#target = target;
    this.#type = type;
    this.#handler = handler;
    this.#target.on(this.#type, this.#handler);
  }

  [disposeSymbol](): void {
    this.#target.off(this.#type, this.#handler);
  }
}

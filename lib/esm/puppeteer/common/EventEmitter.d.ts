import { EventType, Handler } from '../../vendor/mitt/src/index.js';
/**
 * @internal
 */
export interface CommonEventEmitter {
    on(event: EventType, handler: Handler): CommonEventEmitter;
    off(event: EventType, handler: Handler): CommonEventEmitter;
    addListener(event: EventType, handler: Handler): CommonEventEmitter;
    removeListener(event: EventType, handler: Handler): CommonEventEmitter;
    emit(event: EventType, eventData?: any): boolean;
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
export declare class EventEmitter implements CommonEventEmitter {
    private emitter;
    private eventsMap;
    /**
     * @internal
     */
    constructor();
    /**
     * Bind an event listener to fire when an event occurs.
     * @param event - the event type you'd like to listen to. Can be a string or symbol.
     * @param handler  - the function to be called when the event occurs.
     * @returns `this` to enable you to chain calls.
     */
    on(event: EventType, handler: Handler): EventEmitter;
    /**
     * Remove an event listener from firing.
     * @param event - the event type you'd like to stop listening to.
     * @param handler  - the function that should be removed.
     * @returns `this` to enable you to chain calls.
     */
    off(event: EventType, handler: Handler): EventEmitter;
    /**
     * Remove an event listener.
     * @deprecated please use `off` instead.
     */
    removeListener(event: EventType, handler: Handler): EventEmitter;
    /**
     * Add an event listener.
     * @deprecated please use `on` instead.
     */
    addListener(event: EventType, handler: Handler): EventEmitter;
    /**
     * Emit an event and call any associated listeners.
     *
     * @param event - the event you'd like to emit
     * @param eventData - any data you'd like to emit with the event
     * @returns `true` if there are any listeners, `false` if there are not.
     */
    emit(event: EventType, eventData?: any): boolean;
    /**
     * Like `on` but the listener will only be fired once and then it will be removed.
     * @param event - the event you'd like to listen to
     * @param handler - the handler function to run when the event occurs
     * @returns `this` to enable you to chain calls.
     */
    once(event: EventType, handler: Handler): EventEmitter;
    /**
     * Gets the number of listeners for a given event.
     *
     * @param event - the event to get the listener count for
     * @returns the number of listeners bound to the given event
     */
    listenerCount(event: EventType): number;
    /**
     * Removes all listeners. If given an event argument, it will remove only
     * listeners for that event.
     * @param event - the event to remove listeners for.
     * @returns `this` to enable you to chain calls.
     */
    removeAllListeners(event?: EventType): EventEmitter;
    private eventListenersCount;
}
//# sourceMappingURL=EventEmitter.d.ts.map
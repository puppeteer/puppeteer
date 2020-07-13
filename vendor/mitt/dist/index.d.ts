export declare type EventType = string | symbol;
export declare type Handler = (event?: any) => void;
export declare type WildcardHandler = (type: EventType, event?: any) => void;
export declare type EventHandlerList = Array<Handler>;
export declare type WildCardEventHandlerList = Array<WildcardHandler>;
export declare type EventHandlerMap = Map<EventType, EventHandlerList | WildCardEventHandlerList>;
export interface Emitter {
    on(type: EventType, handler: Handler): void;
    on(type: '*', handler: WildcardHandler): void;
    off(type: EventType, handler: Handler): void;
    off(type: '*', handler: WildcardHandler): void;
    emit<T = any>(type: EventType, event?: T): void;
    emit(type: '*', event?: any): void;
}
/** Mitt: Tiny (~200b) functional event emitter / pubsub.
 *  @name mitt
 *  @returns {Mitt}
 */
export default function mitt(all?: EventHandlerMap): Emitter;

/**
 * Mitt: Tiny (~200b) functional event emitter / pubsub.
 * @name mitt
 * @returns {Mitt}
 */
export default function mitt(all) {
    all = all || new Map();
    return {
        /**
         * A Map of event names to registered handler functions.
         */
        all,
        /**
         * Register an event handler for the given type.
         * @param {string|symbol} type Type of event to listen for, or `"*"` for all events
         * @param {Function} handler Function to call in response to given event
         * @memberOf mitt
         */
        on(type, handler) {
            const handlers = all.get(type);
            const added = handlers && handlers.push(handler);
            if (!added) {
                all.set(type, [handler]);
            }
        },
        /**
         * Remove an event handler for the given type.
         * @param {string|symbol} type Type of event to unregister `handler` from, or `"*"`
         * @param {Function} handler Handler function to remove
         * @memberOf mitt
         */
        off(type, handler) {
            const handlers = all.get(type);
            if (handlers) {
                handlers.splice(handlers.indexOf(handler) >>> 0, 1);
            }
        },
        /**
         * Invoke all handlers for the given type.
         * If present, `"*"` handlers are invoked after type-matched handlers.
         *
         * Note: Manually firing "*" handlers is not supported.
         *
         * @param {string|symbol} type The event type to invoke
         * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
         * @memberOf mitt
         */
        emit(type, evt) {
            (all.get(type) || []).slice().map((handler) => { handler(evt); });
            (all.get('*') || []).slice().map((handler) => { handler(type, evt); });
        }
    };
}
//# sourceMappingURL=index.js.map
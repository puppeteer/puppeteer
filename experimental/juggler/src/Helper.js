const uuidGen = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

class Helper {
  addObserver(handler, topic) {
    Services.obs.addObserver(handler, topic);
    return () => Services.obs.removeObserver(handler, topic);
  }

  addMessageListener(receiver, eventName, handler) {
    receiver.addMessageListener(eventName, handler);
    return () => receiver.removeMessageListener(eventName, handler);
  }

  addEventListener(receiver, eventName, handler) {
    receiver.addEventListener(eventName, handler);
    return () => receiver.removeEventListener(eventName, handler);
  }

  on(receiver, eventName, handler) {
    // The toolkit/modules/EventEmitter.jsm dispatches event name as a first argument.
    // Fire event listeners without it for convenience.
    const handlerWrapper = (_, ...args) => handler(...args);
    receiver.on(eventName, handlerWrapper);
    return () => receiver.off(eventName, handlerWrapper);
  }

  addProgressListener(progress, listener, flags) {
    progress.addProgressListener(listener, flags);
    return () => progress.removeProgressListener(listener);
  }

  removeListeners(listeners) {
    for (const tearDown of listeners)
      tearDown.call(null);
    listeners.splice(0, listeners.length);
  }

  generateId() {
    return uuidGen.generateUUID().toString();
  }
}

var EXPORTED_SYMBOLS = [ "Helper" ];
this.Helper = Helper;


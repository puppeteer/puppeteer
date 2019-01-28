const {Helper} = ChromeUtils.import('chrome://juggler/content/Helper.js');
const {RuntimeAgent} = ChromeUtils.import('chrome://juggler/content/content/RuntimeAgent.js');
const {PageAgent} = ChromeUtils.import('chrome://juggler/content/content/PageAgent.js');

const helper = new Helper();

class ContentSession {
  /**
   * @param {string} sessionId
   * @param {ContentFrameMessageManager} messageManager
   * @param {FrameTree} frameTree
   */
  constructor(sessionId, messageManager, frameTree, scrollbarManager) {
    this._sessionId = sessionId;
    this._runtimeAgent = new RuntimeAgent();
    this._messageManager = messageManager;
    this._pageAgent = new PageAgent(this, this._runtimeAgent, frameTree, scrollbarManager);
    this._eventListeners = [
      helper.addMessageListener(messageManager, this._sessionId, this._onMessage.bind(this)),
    ];
  }

  emitEvent(eventName, params) {
    this._messageManager.sendAsyncMessage(this._sessionId, {eventName, params});
  }

  mm() {
    return this._messageManager;
  }

  async _onMessage(msg) {
    const id = msg.data.id;
    try {
      const handler = this._pageAgent[msg.data.methodName];
      if (!handler)
        throw new Error('unknown method: "' + msg.data.methodName + '"');
      const result = await handler.call(this._pageAgent, msg.data.params);
      this._messageManager.sendAsyncMessage(this._sessionId, {id, result});
    } catch (e) {
      this._messageManager.sendAsyncMessage(this._sessionId, {id, error: e.message + '\n' + e.stack});
    }
  }

  dispose() {
    helper.removeListeners(this._eventListeners);
    this._pageAgent.dispose();
    this._runtimeAgent.dispose();
  }
}

var EXPORTED_SYMBOLS = ['ContentSession'];
this.ContentSession = ContentSession;


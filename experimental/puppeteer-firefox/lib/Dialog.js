const {helper, assert, debugError} = require('./helper');

class Dialog {
  constructor(client, payload) {
    this._client = client;
    this._dialogId = payload.dialogId;
    this._type = payload.type;
    this._message = payload.message;
    this._handled = false;
    this._defaultValue = payload.defaultValue || '';
  }

  /**
   * @return {string}
   */
  type() {
    return this._type;
  }

  /**
   * @return {string}
   */
  message() {
    return this._message;
  }

  /**
   * @return {string}
   */
  defaultValue() {
    return this._defaultValue;
  }

  /**
   * @param {string=} promptText
   */
  async accept(promptText) {
    assert(!this._handled, 'Cannot accept dialog which is already handled!');
    this._handled = true;
    await this._client.send('Page.handleDialog', {
      dialogId: this._dialogId,
      accept: true,
      promptText: promptText
    }).catch(debugError);
  }

  async dismiss() {
    assert(!this._handled, 'Cannot dismiss dialog which is already handled!');
    this._handled = true;
    await this._client.send('Page.handleDialog', {
      dialogId: this._dialogId,
      accept: false
    }).catch(debugError);
  }
}

module.exports = {Dialog};

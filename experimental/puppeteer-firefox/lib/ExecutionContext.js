const {helper, assert, debugError} = require('./helper');
const {JSHandle, createHandle} = require('./JSHandle');

class ExecutionContext {
  /**
   * @param {!PageSession} session
   * @param {?Frame} frame
   * @param {string} executionContextId
   */
  constructor(session, frame, executionContextId) {
    this._session = session;
    this._frame = frame;
    this._executionContextId = executionContextId;
  }

  async evaluateHandle(pageFunction, ...args) {
    if (helper.isString(pageFunction)) {
      const payload = await this._session.send('Page.evaluate', {
        script: pageFunction,
        executionContextId: this._executionContextId,
      });
      return createHandle(this, payload.result, payload.exceptionDetails);
    }
    args = args.map(arg => {
      if (arg instanceof JSHandle)
        return arg._protocolValue;
      if (Object.is(arg, Infinity))
        return {unserializableValue: 'Infinity'};
      if (Object.is(arg, -Infinity))
        return {unserializableValue: '-Infinity'};
      if (Object.is(arg, -0))
        return {unserializableValue: '-0'};
      if (Object.is(arg, NaN))
        return {unserializableValue: 'NaN'};
      return {value: arg};
    });
    const payload = await this._session.send('Page.evaluate', {
      functionText: pageFunction.toString(),
      args,
      executionContextId: this._executionContextId
    });
    return createHandle(this, payload.result, payload.exceptionDetails);
  }

  frame() {
    return this._frame;
  }

  async evaluate(pageFunction, ...args) {
    try {
      const handle = await this.evaluateHandle(pageFunction, ...args);
      const result = await handle.jsonValue();
      await handle.dispose();
      return result;
    } catch (e) {
      if (e.message.includes('cyclic object value') || e.message.includes('Object is not serializable'))
        return undefined;
      throw e;
    }
  }

}

module.exports = {ExecutionContext};

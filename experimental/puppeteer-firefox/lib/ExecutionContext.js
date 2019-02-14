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
    if (typeof pageFunction !== 'function')
      throw new Error('The following is not a function: ' + pageFunction);

    let functionText = pageFunction.toString();
    try {
      new Function('(' + functionText + ')');
    } catch (e1) {
      // This means we might have a function shorthand. Try another
      // time prefixing 'function '.
      if (functionText.startsWith('async '))
        functionText = 'async function ' + functionText.substring('async '.length);
      else
        functionText = 'function ' + functionText;
      try {
        new Function('(' + functionText  + ')');
      } catch (e2) {
        // We tried hard to serialize, but there's a weird beast here.
        throw new Error('Passed function is not well-serializable!');
      }
    }
    args = args.map(arg => {
      if (arg instanceof JSHandle) {
        if (arg._context !== this)
          throw new Error('JSHandles can be evaluated only in the context they were created!');
        if (arg._disposed)
          throw new Error('JSHandle is disposed!');
        return arg._protocolValue;
      }
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
      functionText,
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

const {Connection} = require('./Connection');
const Browser = require('./Browser');
const {debugError} = require('./helper');

class Launcher {
  /**
   * @param {!LaunchOptions=} options
   * @return {!Promise<!Browser>}
   */
  static async launch(options) {
    throw new Error('Unsupported');
  }

  /**
   * @return {!Array<string>}
   */
  static defaultArgs() {
    throw new Error('Unsupported');
  }

  /**
   * @return {string}
   */
  static executablePath() {
    throw new Error('Unsupported');
  }

  /**
   * @param {!Object=} options
   * @return {!Promise<!Browser>}
   */
  static async connect(options = {}) {
    const connectionDelay = options.slowMo || 0;
    const connection = await Connection.createForWebSocket(options.browserWSEndpoint, connectionDelay);
    return Browser.create(connection, options, null, () => connection.send('Browser.close').catch(debugError));
  }
}

module.exports = Launcher;

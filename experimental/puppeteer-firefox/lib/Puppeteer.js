const {Launcher} = require('./Launcher.js');
const {BrowserFetcher} = require('./BrowserFetcher.js');

class Puppeteer {
  /**
   * @param {string} projectRoot
   * @param {string} preferredRevision
   */
  constructor(projectRoot, preferredRevision) {
    this._projectRoot = projectRoot;
    this._launcher = new Launcher(projectRoot, preferredRevision);
  }

  async launch(options = {}) {
    return this._launcher.launch(options);
  }

  async connect(options) {
    return this._launcher.connect(options);
  }

  createBrowserFetcher(options) {
    return new BrowserFetcher(this._projectRoot, options);
  }

  executablePath() {
    return this._launcher.executablePath();
  }

  defaultArgs(options) {
    return this._launcher.defaultArgs(options);
  }
}

module.exports = {Puppeteer};

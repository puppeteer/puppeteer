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

  createBrowserFetcher(options) {
    return new BrowserFetcher(this._projectRoot, options);
  }

  executablePath() {
    return this._launcher.executablePath();
  }
}

module.exports = {Puppeteer};

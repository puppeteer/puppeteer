const fs = require('fs');
const os = require('os');
const path = require('path');
const {helper} = require('../lib/helper');
const rmAsync = helper.promisify(require('rimraf'));
const mkdtempAsync = helper.promisify(fs.mkdtemp);
const readFileAsync = helper.promisify(fs.readFile);
const statAsync = helper.promisify(fs.stat);
const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');
const utils = require('./utils');

module.exports.addTests = function({testRunner, expect, defaultBrowserOptions, puppeteer, puppeteerPath, CHROME}) {
  const {describe, xdescribe, fdescribe, describe_fails_ffox} = testRunner;
  const {it, fit, xit, it_fails_ffox} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  describe('Fixtures', function() {
    it('should dump browser process stderr', async({server}) => {
      let dumpioData = '';
      const {spawn} = require('child_process');
      const options = Object.assign({}, defaultBrowserOptions, {dumpio: true});
      const res = spawn('node',
          [path.join(__dirname, 'fixtures', 'dumpio.js'), puppeteerPath, JSON.stringify(options)]);
      if (CHROME)
        res.stderr.on('data', data => dumpioData += data.toString('utf8'));
      else
        res.stdout.on('data', data => dumpioData += data.toString('utf8'));
      await new Promise(resolve => res.on('close', resolve));

      if (CHROME)
        expect(dumpioData).toContain('DevTools listening on ws://');
      else
        expect(dumpioData).toContain('Juggler listening on ws://');
    });
    it('should close the browser when the node process closes', async({ server }) => {
      const {spawn, execSync} = require('child_process');
      const res = spawn('node', [path.join(__dirname, 'fixtures', 'closeme.js'), puppeteerPath, JSON.stringify(defaultBrowserOptions)]);
      let wsEndPointCallback;
      const wsEndPointPromise = new Promise(x => wsEndPointCallback = x);
      let output = '';
      res.stdout.on('data', data => {
        output += data;
        if (output.indexOf('\n'))
          wsEndPointCallback(output.substring(0, output.indexOf('\n')));
      });
      const browser = await puppeteer.connect({ browserWSEndpoint: await wsEndPointPromise });
      const promises = [
        new Promise(resolve => browser.once('disconnected', resolve)),
        new Promise(resolve => res.on('close', resolve))
      ];
      if (process.platform === 'win32')
        execSync(`taskkill /pid ${res.pid} /T /F`);
      else
        process.kill(res.pid);
      await Promise.all(promises);
    });
  });
};

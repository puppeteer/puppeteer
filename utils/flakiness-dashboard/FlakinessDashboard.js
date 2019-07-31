const fs = require('fs');
const os = require('os');
const path = require('path');
const spawn = require('child_process').spawn;
const debug = require('debug')('flakiness');

const rmAsync = promisify(require('rimraf'));
const mkdtempAsync = promisify(fs.mkdtemp);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const TMP_FOLDER = path.join(os.tmpdir(), 'flakiness_tmp_folder-');

const RED_COLOR = '\x1b[31m';
const GREEN_COLOR = '\x1b[32m';
const YELLOW_COLOR = '\x1b[33m';
const RESET_COLOR = '\x1b[0m';

class FlakinessDashboard {
  /**
   * @param {{url: string, branch: string, username: string, password: string}} dashboardRepo
   * @param {{url: string, name: string}} checkout
   * @param {{name: string}} testrunInfo
   * @param {{testHistory: number}} options
   */
  constructor({dashboardName, build, dashboardRepo, options}) {
    this._dashboardName = dashboardName;
    this._dashboardRepo = dashboardRepo;
    this._options = options;
    this._build = new Build(Date.now(), build.name, build.url, []);
  }

  reportTestResult(test) {
    this._build.reportTestResult(test);
  }

  async uploadAndCleanup() {
    console.log(`\n${YELLOW_COLOR}=== UPLOADING Flakiness Dashboard${RESET_COLOR}`);
    const startTimestamp = Date.now();
    const branch = this._dashboardRepo.branch || this._dashboardName.trim().toLowerCase().replace(/\s/g, '-').replace(/[^-0-9a-zа-яё]/ig, '');
    const git = await Git.initialize(this._dashboardRepo.url, branch, this._dashboardRepo.username, this._dashboardRepo.email, this._dashboardRepo.password);
    console.log(`  > Dashboard Location: ${git.path()}`);

    // Do at max 5 attempts to upload changes to github.
    let success = false;
    const MAX_ATTEMPTS = 3;
    for (let i = 0; !success && i < MAX_ATTEMPTS; ++i) {
      const dashboard = await Dashboard.create(this._dashboardName, git.path(), this._options);
      dashboard.addBuild(this._build);
      await dashboard.saveJSON();
      await dashboard.generateReadme();
      // if push went through - great! We're done!
      if (await git.commitAllAndPush()) {
        success = true;
        console.log(`  > Push attempt ${YELLOW_COLOR}${i + 1}${RESET_COLOR} of ${YELLOW_COLOR}${MAX_ATTEMPTS}${RESET_COLOR}: ${GREEN_COLOR}SUCCESS${RESET_COLOR}`);
      } else {
        // Otherwise - wait random time between 3 and 11 seconds.
        const cooldown = 3000 + Math.round(Math.random() * 1000) * 8;
        console.log(`  > Push attempt ${YELLOW_COLOR}${i + 1}${RESET_COLOR} of ${YELLOW_COLOR}${MAX_ATTEMPTS}${RESET_COLOR}: ${RED_COLOR}FAILED${RESET_COLOR}, cooldown ${YELLOW_COLOR}${cooldown / 1000}${RESET_COLOR} seconds`);
        await new Promise(x => setTimeout(x, cooldown));
        // Reset our generated dashboard and pull from origin.
        await git.hardResetToOriginMaster();
        await git.pullFromOrigin();
      }
    }
    await rmAsync(git.path());
    console.log(`  > TOTAL TIME: ${YELLOW_COLOR}${(Date.now() - startTimestamp) / 1000}${RESET_COLOR} seconds`);
    if (success)
      console.log(`${YELLOW_COLOR}=== COMPLETE${RESET_COLOR}`);
    else
      console.log(`${RED_COLOR}=== FAILED${RESET_COLOR}`);
    console.log('');
  }
}

const DASHBOARD_VERSION = 1;
const DASHBOARD_FILENAME = 'dashboard.json';

class Dashboard {
  static async create(name, dashboardPath, options = {}) {
    const filePath = path.join(dashboardPath, DASHBOARD_FILENAME);
    let data = null;
    try {
      data = JSON.parse(await readFileAsync(filePath));
    } catch (e) {
      // Looks like there's no dashboard yet - create one.
      return new Dashboard(name, dashboardPath, [], options);
    }
    if (!data.version)
      throw new Error('cannot parse dashboard data: missing "version" field!');
    if (data.version > DASHBOARD_VERSION)
      throw new Error('cannot manage dashboards that are newer then this');
    const builds = data.builds.map(build => new Build(build.timestamp, build.name, build.url, build.tests));
    return new Dashboard(name, dashboardPath, builds, options);
  }

  async saveJSON() {
    const data = { version: DASHBOARD_VERSION };
    data.builds = this._builds.map(build => ({
      timestamp: build._timestamp,
      name: build._name,
      url: build._url,
      tests: build._tests,
    }));
    await writeFileAsync(path.join(this._dashboardPath, DASHBOARD_FILENAME), JSON.stringify(data, null, 2));
  }

  async generateReadme() {
    const flakyTests = new Map();
    for (const build of this._builds) {
      for (const test of build._tests) {
        if (test.result !== 'ok')
          flakyTests.set(test.testId, test);
      }
    }

    const text = [];
    text.push(`# ${this._name}`);
    text.push(``);

    for (const [testId, test] of flakyTests) {
      text.push(`#### [${test.name}](${test.url}) - ${test.description}`);
      text.push('');

      let headers = '|';
      let splitters = '|';
      let dataColumns = '|';
      for (let i = this._builds.length - 1; i >= 0; --i) {
        const build = this._builds[i];
        headers += ` [${build._name}](${build._url}) |`;
        splitters += ' :---: |';
        const test = build._testsMap.get(testId);
        if (test) {
          const r = test.result.toLowerCase();
          let text = r;
          if (r === 'ok')
            text = '✅';
          else if (r.includes('fail'))
            text = '🛑';
          dataColumns += ` [${text}](${test.url}) |`;
        } else {
          dataColumns += ` missing |`;
        }
      }
      text.push(headers);
      text.push(splitters);
      text.push(dataColumns);
      text.push('');
    }

    await writeFileAsync(path.join(this._dashboardPath, 'README.md'), text.join('\n'));
  }

  constructor(name, dashboardPath, builds, options) {
    const {
      maxBuilds = 30,
    } = options;
    this._name = name;
    this._dashboardPath = dashboardPath;
    this._builds = builds.slice(builds.length - maxBuilds);
  }

  addBuild(build) {
    this._builds.push(build);
  }
}

class Build {
  constructor(timestamp, name, url, tests) {
    this._timestamp = timestamp;
    this._name = name;
    this._url = url;
    this._tests = tests;
    this._testsMap = new Map();
    for (const test of tests)
      this._testsMap.set(test.testId, test);
  }

  reportTestResult(test) {
    this._tests.push(test);
    this._testsMap.set(test.testId, test);
  }
}

module.exports = {FlakinessDashboard};

function promisify(nodeFunction) {
  function promisified(...args) {
    return new Promise((resolve, reject) => {
      function callback(err, ...result) {
        if (err)
          return reject(err);
        if (result.length === 1)
          return resolve(result[0]);
        return resolve(result);
      }
      nodeFunction.call(null, ...args, callback);
    });
  }
  return promisified;
}

class Git {
  static async initialize(url, branch, username, email, password) {
    let schemeIndex = url.indexOf('://');
    if (schemeIndex === -1)
      throw new Error(`Malformed URL "${url}": expected to start with "https://"`);
    schemeIndex += '://'.length;
    url = url.substring(0, schemeIndex) + username + ':' + password + '@' + url.substring(schemeIndex);
    const repoPath = await mkdtempAsync(TMP_FOLDER);
    // Check existance of a remote branch for this bot.
    const {stdout} = await spawnAsync('git', 'ls-remote', '--heads', url, branch);
    // If there is no remote branch for this bot - create one.
    if (!stdout.includes(branch)) {
      await spawnAsyncOrDie('git', 'clone', '--no-checkout', '--depth=1', url, repoPath);

      await spawnAsyncOrDie('git', 'checkout', '--orphan', branch, {cwd: repoPath});
      await spawnAsyncOrDie('git', 'reset', '--hard', {cwd: repoPath});
    } else {
      await spawnAsyncOrDie('git', 'clone', '--single-branch', '--branch', `${branch}`, '--depth=1', url, repoPath);
    }
    await spawnAsyncOrDie('git', 'config', 'user.email', `"${email}"`, {cwd: repoPath});
    await spawnAsyncOrDie('git', 'config', 'user.name', `"${username}"`, {cwd: repoPath});
    return new Git(repoPath, url, branch, username);
  }

  async commitAllAndPush() {
    await spawnAsyncOrDie('git', 'add', '.', {cwd: this._repoPath});
    await spawnAsyncOrDie('git', 'commit', '-m', '"update dashboard"', '--author', '"puppeteer-flakiness <aslushnikov+puppeteerflakiness@gmail.com>"', {cwd: this._repoPath});
    const {code} = await spawnAsync('git', 'push', 'origin', this._branch, {cwd: this._repoPath});
    return code === 0;
  }

  async hardResetToOriginMaster() {
    await spawnAsyncOrDie('git', 'reset', '--hard', `origin/${this._branch}`, {cwd: this._repoPath});
  }

  async pullFromOrigin() {
    await spawnAsyncOrDie('git', 'pull', 'origin', this._branch, {cwd: this._repoPath});
  }

  constructor(repoPath, url, branch, username) {
    this._repoPath = repoPath;
    this._url = url;
    this._branch = branch;
    this._username = username;
  }

  path() {
    return this._repoPath;
  }
}

async function spawnAsync(command, ...args) {
  let options = {};
  if (args.length && args[args.length - 1].constructor.name !== 'String')
    options = args.pop();
  const cmd = spawn(command, args, options);
  let stdout = '';
  let stderr = '';
  cmd.stdout.on('data', data => stdout += data);
  cmd.stderr.on('data', data => stderr += data);
  const code = await new Promise(x => cmd.once('close', x));
  if (stdout)
    debug(stdout);
  if (stderr)
    debug(stderr);
  return {code, stdout, stderr};
}

async function spawnAsyncOrDie(command, ...args) {
  const {code, stdout, stderr} = await spawnAsync(command, ...args);
  if (code !== 0)
    throw new Error(`Failed to executed: "${command} ${args.join(' ')}".\n\n=== STDOUT ===\n${stdout}\n\n\n=== STDERR ===\n${stderr}`);
  return {stdout, stderr};
}

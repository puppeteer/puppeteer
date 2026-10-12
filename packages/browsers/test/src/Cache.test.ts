/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import sinon from 'sinon';

import {writeInstallMarker} from '../../lib/installMarker.js';
import {Browser, BrowserPlatform, Cache} from '../../lib/main.js';

describe('Cache', () => {
  let tmpDir = '/tmp/puppeteer-browsers-test';
  let cache: Cache;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
    cache = new Cache(tmpDir);
  });

  afterEach(() => {
    cache.clear();
  });

  it('return empty metadata if .metadata file does not exist', async function () {
    assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
      aliases: {},
    });
  });

  it('throw an error if .metadata is malformed', async function () {
    // @ts-expect-error wrong type on purpose;
    cache.writeMetadata(Browser.CHROME, 'metadata');
    assert.throws(() => {
      return cache.readMetadata(Browser.CHROME);
    }, new Error(`.metadata is not an object`));
  });

  it('writes and reads .metadata', async function () {
    cache.writeMetadata(Browser.CHROME, {
      aliases: {
        canary: '123.0.0.0',
      },
    });
    assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
      aliases: {
        canary: '123.0.0.0',
      },
    });

    assert.deepStrictEqual(
      cache.resolveAlias(Browser.CHROME, 'canary'),
      '123.0.0.0',
    );
  });

  it('resolves latest', async function () {
    cache.writeMetadata(Browser.CHROME, {
      aliases: {
        canary: '115.0.5789',
        stable: '114.0.5789',
      },
    });

    assert.deepStrictEqual(
      cache.resolveAlias(Browser.CHROME, 'latest'),
      '115.0.5789',
    );
  });

  it('prefers the executable path from the install marker', () => {
    const buildId = '123.0.0.0';
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      buildId,
    );
    const relativeExecutablePath = path.join('custom', 'chrome');
    const executablePath = path.join(installationDir, relativeExecutablePath);
    fs.mkdirSync(path.dirname(executablePath), {recursive: true});
    fs.writeFileSync(executablePath, '');
    cache.writeExecutablePath(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      buildId,
      path.join('stale', 'chrome'),
    );
    writeInstallMarker(installationDir, relativeExecutablePath);

    assert.strictEqual(
      cache.computeExecutablePath({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId,
      }),
      executablePath,
    );
  });

  it('does not fall back when the install marker is invalid', () => {
    const buildId = '123.0.0.0';
    const installationDir = cache.installationDir(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      buildId,
    );
    fs.mkdirSync(installationDir, {recursive: true});
    fs.writeFileSync(
      path.join(installationDir, '.puppeteer-install'),
      JSON.stringify({
        version: 2,
        relativeExecutablePath: path.join('custom', 'chrome'),
      }),
    );
    cache.writeExecutablePath(
      Browser.CHROME,
      BrowserPlatform.LINUX,
      buildId,
      path.join('legacy', 'chrome'),
    );

    assert.throws(() => {
      cache.computeExecutablePath({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        buildId,
      });
    }, /unsupported marker version/);
  });

  it('does not overwrite malformed global metadata during an update', () => {
    const metadataPath = cache.metadataFile(Browser.CHROME);
    fs.mkdirSync(path.dirname(metadataPath), {recursive: true});
    fs.writeFileSync(metadataPath, '{');

    assert.throws(() => {
      cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
    });
    assert.strictEqual(fs.readFileSync(metadataPath, 'utf8'), '{');
    assert.deepStrictEqual(fs.readdirSync(cache.browserRoot(Browser.CHROME)), [
      '.metadata',
    ]);
  });

  it('does not write metadata when a mutator throws', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123');
    const failure = new Error('mutator failed');
    assert.throws(
      () => {
        cache.updateMetadata(Browser.CHROME, metadata => {
          metadata.aliases['stable'] = '456';
          throw failure;
        });
      },
      error => {
        return error === failure;
      },
    );
    assert.equal(cache.resolveAlias(Browser.CHROME, 'stable'), '123');
    cache.writeAlias(Browser.CHROME, 'canary', '456');
  });

  it('does not replace metadata for a no-op update', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123');
    const rename = sinon.spy(fs, 'renameSync');
    try {
      assert.equal(
        cache.updateMetadata(Browser.CHROME, metadata => {
          metadata.aliases['stable'] = '123';
        }),
        false,
      );
      assert.equal(
        rename.getCalls().filter(call => {
          return call.args[1] === cache.metadataFile(Browser.CHROME);
        }).length,
        0,
      );
      assert.deepStrictEqual(
        fs.readdirSync(cache.browserRoot(Browser.CHROME)),
        ['.metadata'],
      );
    } finally {
      rename.restore();
    }
  });

  it('removes aliases during uninstall even without an executable-path override', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123');
    cache.writeAlias(Browser.CHROME, 'canary', '456');
    cache.uninstall(Browser.CHROME, BrowserPlatform.WIN64, '123');
    assert.deepStrictEqual(cache.readMetadata(Browser.CHROME), {
      aliases: {canary: '456'},
    });
  });

  it('preserves metadata and removes the temp file when rename fails', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
    const metadataPath = cache.metadataFile(Browser.CHROME);
    const previousMetadata = fs.readFileSync(metadataPath);
    const renameError = new Error('rename failed');
    const filesystemRename = sinon.stub(fs, 'renameSync').callThrough();
    filesystemRename
      .withArgs(sinon.match.any, metadataPath)
      .throws(renameError);

    try {
      assert.throws(
        () => {
          cache.writeAlias(Browser.CHROME, 'stable', '124.0.0.0');
        },
        error => {
          assert.strictEqual(error, renameError);
          return true;
        },
      );
      assert.deepStrictEqual(fs.readFileSync(metadataPath), previousMetadata);
      assert.deepStrictEqual(
        fs.readdirSync(cache.browserRoot(Browser.CHROME)),
        ['.metadata'],
      );
    } finally {
      filesystemRename.restore();
    }
  });

  it('leaves no metadata temp file after an atomic update', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');

    assert.deepStrictEqual(fs.readdirSync(cache.browserRoot(Browser.CHROME)), [
      '.metadata',
    ]);
  });

  for (const code of ['EPERM', 'EBUSY', 'EACCES']) {
    it(`retries transient ${code} while replacing metadata on Windows`, () => {
      cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
      const metadataPath = cache.metadataFile(Browser.CHROME);
      const previousMetadata = fs.readFileSync(metadataPath);
      const renameSync = fs.renameSync;
      const renameError = Object.assign(new Error('rename contention'), {code});
      const sandbox = sinon.createSandbox();
      try {
        sandbox.stub(process, 'platform').value('win32');
        const wait = sandbox.stub(Atomics, 'wait').returns('timed-out');
        const filesystemRename = sandbox.stub(fs, 'renameSync').callThrough();
        const rename = filesystemRename
          .withArgs(sinon.match.any, cache.metadataFile(Browser.CHROME))
          .callsFake((from, to) => {
            assert.ok(fs.existsSync(from));
            assert.deepStrictEqual(fs.readFileSync(to), previousMetadata);
            if (rename.callCount < 3) {
              throw renameError;
            }
            renameSync(from, to);
          });

        assert.strictEqual(
          cache.writeAlias(Browser.CHROME, 'stable', '124.0.0.0'),
          undefined,
        );
        assert.strictEqual(rename.callCount, 3);
        assert.deepStrictEqual(rename.secondCall.args, rename.firstCall.args);
        assert.deepStrictEqual(rename.thirdCall.args, rename.firstCall.args);
        assert.deepStrictEqual(
          wait.getCalls().map(call => {
            return call.args[3];
          }),
          [50, 100],
        );
        assert.strictEqual(
          cache.readMetadata(Browser.CHROME).aliases['stable'],
          '124.0.0.0',
        );
        assert.deepStrictEqual(
          fs.readdirSync(cache.browserRoot(Browser.CHROME)),
          ['.metadata'],
        );
      } finally {
        sandbox.restore();
      }
    });
  }

  it('bounds Windows rename retries and preserves the last error and metadata', () => {
    cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
    const metadataPath = cache.metadataFile(Browser.CHROME);
    const previousMetadata = fs.readFileSync(metadataPath);
    const errors = Array.from({length: 5}, (_, index) => {
      return Object.assign(new Error(`rename failure ${index}`), {
        code: 'EPERM',
      });
    });
    const sandbox = sinon.createSandbox();
    try {
      sandbox.stub(process, 'platform').value('win32');
      const wait = sandbox.stub(Atomics, 'wait').returns('timed-out');
      const filesystemRename = sandbox.stub(fs, 'renameSync').callThrough();
      const rename = filesystemRename
        .withArgs(sinon.match.any, cache.metadataFile(Browser.CHROME))
        .callsFake((from, to) => {
          assert.ok(fs.existsSync(from));
          assert.deepStrictEqual(fs.readFileSync(to), previousMetadata);
          throw errors[rename.callCount - 1];
        });

      assert.throws(
        () => {
          cache.writeAlias(Browser.CHROME, 'stable', '124.0.0.0');
        },
        error => {
          assert.strictEqual(error, errors[4]);
          return true;
        },
      );
      assert.strictEqual(rename.callCount, 5);
      assert.deepStrictEqual(
        wait.getCalls().map(call => {
          return call.args[3];
        }),
        [50, 100, 150, 200],
      );
      assert.ok(
        rename.getCalls().every(call => {
          return call.args[0] === rename.firstCall.args[0];
        }),
      );
      assert.deepStrictEqual(fs.readFileSync(metadataPath), previousMetadata);
      assert.deepStrictEqual(
        fs.readdirSync(cache.browserRoot(Browser.CHROME)),
        ['.metadata'],
      );
    } finally {
      sandbox.restore();
    }
  });

  it('does not retry other Windows rename errors', () => {
    const sandbox = sinon.createSandbox();
    const renameError = Object.assign(new Error('I/O failure'), {code: 'EIO'});
    try {
      sandbox.stub(process, 'platform').value('win32');
      const wait = sandbox.stub(Atomics, 'wait').returns('timed-out');
      const filesystemRename = sandbox.stub(fs, 'renameSync').callThrough();
      const rename = filesystemRename
        .withArgs(sinon.match.any, cache.metadataFile(Browser.CHROME))
        .throws(renameError);
      assert.throws(
        () => {
          cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
        },
        error => {
          assert.strictEqual(error, renameError);
          return true;
        },
      );
      assert.strictEqual(rename.callCount, 1);
      assert.strictEqual(wait.callCount, 0);
      assert.deepStrictEqual(
        fs.readdirSync(cache.browserRoot(Browser.CHROME)),
        [],
      );
    } finally {
      sandbox.restore();
    }
  });

  for (const platform of ['linux', 'darwin']) {
    it(`does not retry metadata rename errors on ${platform}`, () => {
      const sandbox = sinon.createSandbox();
      const renameError = Object.assign(new Error('rename denied'), {
        code: 'EPERM',
      });
      try {
        sandbox.stub(process, 'platform').value(platform);
        const wait = sandbox.stub(Atomics, 'wait').returns('timed-out');
        const filesystemRename = sandbox.stub(fs, 'renameSync').callThrough();
        const rename = filesystemRename
          .withArgs(sinon.match.any, cache.metadataFile(Browser.CHROME))
          .throws(renameError);
        assert.throws(
          () => {
            cache.writeAlias(Browser.CHROME, 'stable', '123.0.0.0');
          },
          error => {
            assert.strictEqual(error, renameError);
            return true;
          },
        );
        assert.strictEqual(rename.callCount, 1);
        assert.strictEqual(wait.callCount, 0);
        assert.deepStrictEqual(
          fs.readdirSync(cache.browserRoot(Browser.CHROME)),
          [],
        );
      } finally {
        sandbox.restore();
      }
    });
  }
});

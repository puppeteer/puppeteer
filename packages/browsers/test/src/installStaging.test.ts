/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
import os from 'node:os';
import path from 'node:path';

import sinon from 'sinon';

import {writeInstallMarker} from '../../lib/installMarker.js';
import {
  AmbiguousInstallPublicationError,
  createInstallAttempt,
  InstallArchivePublicationError,
  internalConstantsForTesting,
  InvalidInstallTreeError,
  publishInstallArchive,
  publishInstallTree,
  removeInstallAttempt,
} from '../../lib/installStaging.js';

describe('install staging', () => {
  let tmpDir: string;
  let browserRoot: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-publication-'));
    browserRoot = path.join(tmpDir, 'browser');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, {recursive: true, force: true});
  });

  it('creates unique attempts under a regular staging directory', async () => {
    const first = await createInstallAttempt(browserRoot);
    const second = await createInstallAttempt(browserRoot);

    assert.notStrictEqual(first.path, second.path);
    assert.strictEqual(
      path.dirname(first.path),
      path.join(browserRoot, '.staging'),
    );
    assert.strictEqual(
      fs.lstatSync(path.join(browserRoot, '.staging')).isDirectory(),
      true,
    );
  });

  it('rejects a staging directory symlink', async () => {
    fs.mkdirSync(browserRoot, {recursive: true});
    const externalDir = path.join(tmpDir, 'external');
    fs.mkdirSync(externalDir);
    fs.symlinkSync(externalDir, path.join(browserRoot, '.staging'), 'junction');

    await assert.rejects(
      createInstallAttempt(browserRoot),
      /Staging path is not a regular directory/,
    );
  });

  it('publishes a completed tree', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const executablePath = prepareOutput(attempt.outputPath, 'first');
    const installationDir = path.join(browserRoot, 'linux-123');

    assert.strictEqual(
      await publishInstallTree(attempt.outputPath, installationDir),
      'published',
    );
    assert.strictEqual(
      fs.readFileSync(path.join(installationDir, executablePath), 'utf8'),
      'first',
    );
    assert.strictEqual(fs.existsSync(attempt.outputPath), false);
  });

  it('preserves a valid winner', async () => {
    const first = await createInstallAttempt(browserRoot);
    const second = await createInstallAttempt(browserRoot);
    const executablePath = prepareOutput(first.outputPath, 'first');
    prepareOutput(second.outputPath, 'second');
    const installationDir = path.join(browserRoot, 'linux-123');

    await publishInstallTree(first.outputPath, installationDir);
    assert.strictEqual(
      await publishInstallTree(second.outputPath, installationDir),
      'winner',
    );
    assert.strictEqual(
      fs.readFileSync(path.join(installationDir, executablePath), 'utf8'),
      'first',
    );
    assert.strictEqual(fs.existsSync(second.outputPath), true);
  });

  it('preserves a valid winner discovered after rename fails', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const executablePath = prepareOutput(attempt.outputPath, 'candidate');
    const installationDir = path.join(browserRoot, 'linux-123');
    const rename = sinon.stub(fsPromises, 'rename').callsFake(async () => {
      // Publish after the initial winner check to exercise the catch recheck.
      prepareOutput(installationDir, 'winner');
      throw new Error('rename failed');
    });
    syncBuiltinESMExports();

    try {
      assert.strictEqual(
        await publishInstallTree(attempt.outputPath, installationDir),
        'winner',
      );
      assert.ok(
        rename.calledOnceWithExactly(attempt.outputPath, installationDir),
      );
      assert.strictEqual(
        fs.readFileSync(path.join(installationDir, executablePath), 'utf8'),
        'winner',
      );
      assert.strictEqual(
        fs.readFileSync(path.join(attempt.outputPath, executablePath), 'utf8'),
        'candidate',
      );
    } finally {
      rename.restore();
      syncBuiltinESMExports();
    }
  });

  it('rejects an installation junction discovered after rename fails', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const executablePath = prepareOutput(attempt.outputPath, 'candidate');
    const installationDir = path.join(browserRoot, 'linux-123');
    const target = path.join(tmpDir, 'external');
    prepareOutput(target, 'existing');
    const rename = sinon.stub(fsPromises, 'rename').callsFake(async () => {
      fs.symlinkSync(target, installationDir, 'junction');
      throw new Error('rename failed');
    });
    syncBuiltinESMExports();

    try {
      await assert.rejects(
        publishInstallTree(attempt.outputPath, installationDir),
        InvalidInstallTreeError,
      );
      assert.ok(
        rename.calledOnceWithExactly(attempt.outputPath, installationDir),
      );
      assert.strictEqual(fs.lstatSync(installationDir).isSymbolicLink(), true);
      assert.strictEqual(
        fs.readFileSync(path.join(target, executablePath), 'utf8'),
        'existing',
      );
      assert.strictEqual(
        fs.readFileSync(path.join(attempt.outputPath, executablePath), 'utf8'),
        'candidate',
      );
    } finally {
      rename.restore();
      syncBuiltinESMExports();
    }
  });

  it('rejects a marker-less directory that appears during publication', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    prepareOutput(attempt.outputPath, 'candidate');
    const installationDir = path.join(browserRoot, 'linux-123');
    fs.mkdirSync(installationDir);

    await assert.rejects(
      publishInstallTree(attempt.outputPath, installationDir),
      AmbiguousInstallPublicationError,
    );
    assert.strictEqual(fs.existsSync(installationDir), true);
  });

  it('publishes a completed archive with a hard link', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const archivePath = path.join(browserRoot, 'archive.zip');
    fs.writeFileSync(attempt.archivePath, 'first');

    await publishInstallArchive(attempt.archivePath, archivePath);

    assert.strictEqual(fs.readFileSync(archivePath, 'utf8'), 'first');
    assert.strictEqual(fs.existsSync(attempt.archivePath), false);
  });

  it('uses bounded retries to remove an attempt', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const nestedDir = path.join(attempt.outputPath, 'nested');
    fs.mkdirSync(nestedDir, {recursive: true});
    fs.writeFileSync(path.join(nestedDir, 'file'), 'contents');
    const originalRm = internalConstantsForTesting.rm;
    let observedTarget: string | undefined;
    let observedOptions:
      | {
          recursive: true;
          force: true;
          maxRetries: number;
          retryDelay: number;
        }
      | undefined;
    internalConstantsForTesting.rm = async (target, options) => {
      observedTarget = target;
      observedOptions = options;
      await originalRm(target, options);
    };

    try {
      await removeInstallAttempt(attempt.path);
      assert.strictEqual(observedTarget, attempt.path);
      assert.deepStrictEqual(observedOptions, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
      assert.strictEqual(fs.existsSync(attempt.path), false);
    } finally {
      internalConstantsForTesting.rm = originalRm;
    }
  });

  it('removes an attempt containing a junction without removing its target', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    prepareOutput(attempt.outputPath, 'candidate');
    const target = path.join(tmpDir, 'external');
    const executablePath = prepareOutput(target, 'existing');
    fs.symlinkSync(target, path.join(attempt.outputPath, 'linked'), 'junction');

    await removeInstallAttempt(attempt.path);

    assert.strictEqual(fs.existsSync(attempt.path), false);
    assert.strictEqual(
      fs.readFileSync(path.join(target, executablePath), 'utf8'),
      'existing',
    );
  });

  it('does not replace an archive that appears during publication', async () => {
    const attempt = await createInstallAttempt(browserRoot);
    const archivePath = path.join(browserRoot, 'archive.zip');
    fs.writeFileSync(attempt.archivePath, 'candidate');
    fs.writeFileSync(archivePath, 'winner');

    await assert.rejects(
      publishInstallArchive(attempt.archivePath, archivePath),
      AmbiguousInstallPublicationError,
    );
    assert.strictEqual(fs.readFileSync(archivePath, 'utf8'), 'winner');
    assert.strictEqual(
      fs.readFileSync(attempt.archivePath, 'utf8'),
      'candidate',
    );
  });

  for (const code of ['ENOTSUP', 'EISDIR']) {
    it(`reports the hard-link requirement when publication fails with ${code}`, async () => {
      const attempt = await createInstallAttempt(browserRoot);
      const archivePath = path.join(browserRoot, 'archive.zip');
      fs.writeFileSync(attempt.archivePath, 'candidate');
      const linkError = Object.assign(new Error('operation not supported'), {
        code,
      });
      const originalLink = internalConstantsForTesting.link;
      internalConstantsForTesting.link = async () => {
        throw linkError;
      };

      try {
        await assert.rejects(
          publishInstallArchive(attempt.archivePath, archivePath),
          (error: unknown) => {
            assert.ok(error instanceof InstallArchivePublicationError);
            assert.match(error.message, /requires hard-link support/);
            assert.strictEqual(
              (error as Error & {cause?: unknown}).cause,
              linkError,
            );
            return true;
          },
        );
        assert.strictEqual(fs.existsSync(archivePath), false);
        assert.strictEqual(
          fs.readFileSync(attempt.archivePath, 'utf8'),
          'candidate',
        );
      } finally {
        internalConstantsForTesting.link = originalLink;
      }
    });
  }

  function prepareOutput(outputPath: string, contents: string): string {
    const relativeExecutablePath = path.join('browser', 'executable');
    const executablePath = path.join(outputPath, relativeExecutablePath);
    fs.mkdirSync(path.dirname(executablePath), {recursive: true});
    fs.writeFileSync(executablePath, contents);
    writeInstallMarker(outputPath, relativeExecutablePath);
    return relativeExecutablePath;
  }
});

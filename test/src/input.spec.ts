/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';

import expect from 'expect';
import {TimeoutError} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

const FILE_TO_UPLOAD = path.join(__dirname, '/../assets/file-to-upload.txt');

describe('input tests', function () {
  setupTestBrowserHooks();

  describe('ElementHandle.uploadFile', function () {
    it('should upload the file', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/fileupload.html');
      using input = (await page.$('input'))!;
      await input.evaluate(e => {
        (globalThis as any)._inputEvents = [];
        e.addEventListener('change', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
        e.addEventListener('input', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
      });

      const file = path.relative(process.cwd(), FILE_TO_UPLOAD);
      await input.uploadFile(file);

      expect(
        await input.evaluate(e => {
          return e.files?.[0]?.name;
        })
      ).toBe('file-to-upload.txt');
      expect(
        await input.evaluate(e => {
          return e.files?.[0]?.type;
        })
      ).toBe('text/plain');
      expect(
        await page.evaluate(() => {
          return (globalThis as any)._inputEvents;
        })
      ).toEqual(['input', 'change']);
    });

    it('should read the file', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/fileupload.html');
      using input = (await page.$('input'))!;
      await input.evaluate(e => {
        (globalThis as any)._inputEvents = [];
        e.addEventListener('change', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
        e.addEventListener('input', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
      });

      const file = path.relative(process.cwd(), FILE_TO_UPLOAD);
      await input.uploadFile(file);

      expect(
        await input.evaluate(e => {
          const file = e.files?.[0];
          if (!file) {
            throw new Error('No file found');
          }

          const reader = new FileReader();
          const promise = new Promise(fulfill => {
            reader.addEventListener('load', fulfill);
          });
          reader.readAsText(file);

          return promise.then(() => {
            return reader.result;
          });
        })
      ).toBe('contents of the file');
    });
  });

  describe('Page.waitForFileChooser', function () {
    it('should work when file input is attached to DOM', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      expect(chooser).toBeTruthy();
    });
    it('should work when file input is not attached to DOM', async () => {
      const {page} = await getTestState();

      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.evaluate(() => {
          const el = document.createElement('input');
          el.type = 'file';
          el.click();
        }),
      ]);
      expect(chooser).toBeTruthy();
    });
    it('should respect timeout', async () => {
      const {page} = await getTestState();

      let error!: Error;
      await page.waitForFileChooser({timeout: 1}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(TimeoutError);
    });
    it('should respect default timeout when there is no custom timeout', async () => {
      const {page} = await getTestState();

      page.setDefaultTimeout(1);
      let error!: Error;
      await page.waitForFileChooser().catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(TimeoutError);
    });
    it('should prioritize exact timeout over default timeout', async () => {
      const {page} = await getTestState();

      page.setDefaultTimeout(0);
      let error!: Error;
      await page.waitForFileChooser({timeout: 1}).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeInstanceOf(TimeoutError);
    });
    it('should work with no timeout', async () => {
      const {page} = await getTestState();

      const [chooser] = await Promise.all([
        page.waitForFileChooser({timeout: 0}),
        page.evaluate(() => {
          return setTimeout(() => {
            const el = document.createElement('input');
            el.type = 'file';
            el.click();
          }, 50);
        }),
      ]);
      expect(chooser).toBeTruthy();
    });
    it('should return the same file chooser when there are many watchdogs simultaneously', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [fileChooser1, fileChooser2] = await Promise.all([
        page.waitForFileChooser(),
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return input.click();
        }),
      ]);
      expect(fileChooser1 === fileChooser2).toBe(true);
    });
  });

  describe('FileChooser.accept', function () {
    it('should accept single file', async () => {
      const {page} = await getTestState();

      await page.setContent(
        `<input type=file oninput='javascript:console.timeStamp()'>`
      );
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      await Promise.all([
        chooser.accept([FILE_TO_UPLOAD]),
        waitEvent(page, 'metrics'),
      ]);
      expect(
        await page.$eval('input', input => {
          return input.files!.length;
        })
      ).toBe(1);
      expect(
        await page.$eval('input', input => {
          return input.files![0]!.name;
        })
      ).toBe('file-to-upload.txt');
    });
    it('should be able to read selected file', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      void page.waitForFileChooser().then(chooser => {
        return chooser.accept([FILE_TO_UPLOAD]);
      });
      expect(
        await page.$eval('input', async pick => {
          pick.click();
          await new Promise(x => {
            return (pick.oninput = x);
          });
          const reader = new FileReader();
          const promise = new Promise(fulfill => {
            return (reader.onload = fulfill);
          });
          reader.readAsText(pick.files![0]!);
          return await promise.then(() => {
            return reader.result;
          });
        })
      ).toBe('contents of the file');
    });
    it('should be able to reset selected files with empty file list', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      void page.waitForFileChooser().then(chooser => {
        return chooser.accept([FILE_TO_UPLOAD]);
      });
      expect(
        await page.$eval('input', async pick => {
          pick.click();
          await new Promise(x => {
            return (pick.oninput = x);
          });
          return pick.files!.length;
        })
      ).toBe(1);
      void page.waitForFileChooser().then(chooser => {
        return chooser.accept([]);
      });
      expect(
        await page.$eval('input', async pick => {
          pick.click();
          await new Promise(x => {
            return (pick.oninput = x);
          });
          return pick.files!.length;
        })
      ).toBe(0);
    });
    it('should not accept multiple files for single-file input', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      let error!: Error;
      await chooser
        .accept([
          path.relative(
            process.cwd(),
            __dirname + '/../assets/file-to-upload.txt'
          ),
          path.relative(process.cwd(), __dirname + '/../assets/pptr.png'),
        ])
        .catch(error_ => {
          return (error = error_);
        });
      expect(error).not.toBe(null);
    });
    it('should succeed even for non-existent files', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      let error!: Error;
      await chooser.accept(['file-does-not-exist.txt']).catch(error_ => {
        return (error = error_);
      });
      expect(error).toBeUndefined();
    });
    it('should error on read of non-existent files', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      void page.waitForFileChooser().then(chooser => {
        return chooser.accept(['file-does-not-exist.txt']);
      });
      expect(
        await page.$eval('input', async pick => {
          pick.click();
          await new Promise(x => {
            return (pick.oninput = x);
          });
          const reader = new FileReader();
          const promise = new Promise(fulfill => {
            return (reader.onerror = fulfill);
          });
          reader.readAsText(pick.files![0]!);
          return await promise.then(() => {
            return false;
          });
        })
      ).toBeFalsy();
    });
    it('should fail when accepting file chooser twice', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return input.click();
        }),
      ]);
      await fileChooser.accept([]);
      let error!: Error;
      await fileChooser.accept([]).catch(error_ => {
        return (error = error_);
      });
      expect(error.message).toBe(
        'Cannot accept FileChooser which is already handled!'
      );
    });
  });

  describe('FileChooser.cancel', function () {
    it('should cancel dialog', async () => {
      const {page} = await getTestState();

      // Consider file chooser canceled if we can summon another one.
      // There's no reliable way in WebPlatform to see that FileChooser was
      // canceled.
      await page.setContent(`<input type=file>`);
      const [fileChooser1] = await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return input.click();
        }),
      ]);
      await fileChooser1.cancel();
      // If this resolves, than we successfully canceled file chooser.
      await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return input.click();
        }),
      ]);
    });
    it('should fail when canceling file chooser twice', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return input.click();
        }),
      ]);
      await fileChooser.cancel();
      let error!: Error;

      try {
        await fileChooser.cancel();
      } catch (error_) {
        error = error_ as Error;
      }

      expect(error.message).toBe(
        'Cannot cancel FileChooser which is already handled!'
      );
    });
  });

  describe('FileChooser.isMultiple', () => {
    it('should work for single file pick', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      expect(chooser.isMultiple()).toBe(false);
    });
    it('should work for "multiple"', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input multiple type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      expect(chooser.isMultiple()).toBe(true);
    });
    it('should work for "webkitdirectory"', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input multiple webkitdirectory type=file>`);
      const [chooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input'),
      ]);
      expect(chooser.isMultiple()).toBe(true);
    });
  });
});

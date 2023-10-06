/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';

import expect from 'expect';
import {TimeoutError} from 'puppeteer';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';
import {waitEvent} from './utils.js';

const FILE_TO_UPLOAD = path.join(__dirname, '/../assets/file-to-upload.txt');

describe('input tests', function () {
  setupTestBrowserHooks();

  describe('input', function () {
    it('should upload the file', async () => {
      const {page, server} = await getTestState();

      await page.goto(server.PREFIX + '/input/fileupload.html');
      const filePath = path.relative(process.cwd(), FILE_TO_UPLOAD);
      using input = (await page.$('input'))!;
      await page.evaluate((e: HTMLElement) => {
        (globalThis as any)._inputEvents = [];
        e.addEventListener('change', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
        e.addEventListener('input', ev => {
          return (globalThis as any)._inputEvents.push(ev.type);
        });
      }, input);
      await input.uploadFile(filePath);
      expect(
        await page.evaluate((e: HTMLInputElement) => {
          return e.files![0]!.name;
        }, input)
      ).toBe('file-to-upload.txt');
      expect(
        await page.evaluate((e: HTMLInputElement) => {
          return e.files![0]!.type;
        }, input)
      ).toBe('text/plain');
      expect(
        await page.evaluate(() => {
          return (globalThis as any)._inputEvents;
        })
      ).toEqual(['input', 'change']);
      expect(
        await page.evaluate((e: HTMLInputElement) => {
          const reader = new FileReader();
          const promise = new Promise(fulfill => {
            return (reader.onload = fulfill);
          });
          reader.readAsText(e.files![0]!);
          return promise.then(() => {
            return reader.result;
          });
        }, input)
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
          return (input as HTMLInputElement).click();
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
          return (input as HTMLInputElement).files!.length;
        })
      ).toBe(1);
      expect(
        await page.$eval('input', input => {
          return (input as HTMLInputElement).files![0]!.name;
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
        await page.$eval('input', async picker => {
          const pick = picker as HTMLInputElement;
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
        await page.$eval('input', async picker => {
          const pick = picker as HTMLInputElement;
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
        await page.$eval('input', async picker => {
          const pick = picker as HTMLInputElement;
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
        await page.$eval('input', async picker => {
          const pick = picker as HTMLInputElement;
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
          return (input as HTMLInputElement).click();
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
          return (input as HTMLInputElement).click();
        }),
      ]);
      await fileChooser1.cancel();
      // If this resolves, than we successfully canceled file chooser.
      await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return (input as HTMLInputElement).click();
        }),
      ]);
    });
    it('should fail when canceling file chooser twice', async () => {
      const {page} = await getTestState();

      await page.setContent(`<input type=file>`);
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.$eval('input', input => {
          return (input as HTMLElement).click();
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

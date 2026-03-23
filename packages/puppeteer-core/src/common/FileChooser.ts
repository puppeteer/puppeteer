/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {FilePayload} from './types.js';
import type {ElementHandle} from '../api/ElementHandle.js';
import {assert} from '../util/assert.js';

/**
 * File choosers let you react to the page requesting for a file.
 *
 * @remarks
 * `FileChooser` instances are returned via the {@link Page.waitForFileChooser} method.
 *
 * In browsers, only one file chooser can be opened at a time.
 * All file choosers must be accepted or canceled. Not doing so will prevent
 * subsequent file choosers from appearing.
 *
 * @example
 *
 * ```ts
 * const [fileChooser] = await Promise.all([
 *   page.waitForFileChooser(),
 *   page.click('#upload-file-button'), // some button that triggers file selection
 * ]);
 * await fileChooser.accept(['/tmp/myfile.pdf']);
 * ```
 *
 * @public
 */
export class FileChooser {
  #element: ElementHandle<HTMLInputElement>;
  #multiple: boolean;
  #handled = false;

  /**
   * @internal
   */
  constructor(element: ElementHandle<HTMLInputElement>, multiple: boolean) {
    this.#element = element;
    this.#multiple = multiple;
  }

  /**
   * Whether file chooser allow for
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple | multiple}
   * file selection.
   */
  isMultiple(): boolean {
    return this.#multiple;
  }

/**
   * Accepts the file chooser request with the given file paths or {@link FilePayload} objects.
   *
   * @param files - An array of file paths or in-memory {@link FilePayload} objects to upload.
   *
   * @remarks
   * When providing file paths, this will not validate whether the file paths
   * exist. Also, if a path is relative, then it is resolved against the
   * {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
   * For local scripts connecting to remote chrome environments, paths must be absolute.
   *
   * When providing {@link FilePayload} objects, the file content is injected
   * directly into the browser from memory. This is highly useful for uploading
   * remote URLs or dynamically generated content without writing to disk.
   *
   * @example
   * ```ts
   * const [fileChooser] = await Promise.all([
   * page.waitForFileChooser(),
   * page.click('#upload-button'),
   * ]);
   *
   * // Uploading from a local file path
   * await fileChooser.accept(['/path/to/file.pdf']);
   *
   * // Uploading from memory (Buffer)
   * await fileChooser.accept([{
   * name: 'data.json',
   * mimeType: 'application/json',
   * buffer: Buffer.from('{"key": "value"}')
   * }]);
   * ```
   *
   * @public
   */
  async accept(files: Array<string | FilePayload>): Promise<void> {
    assert(
      !this.#handled,
      'Cannot accept FileChooser which is already handled!',
    );
    this.#handled = true;
    await this.#element.uploadFile(...files);
  }

  /**
   * Closes the file chooser without selecting any files.
   */
  async cancel(): Promise<void> {
    assert(
      !this.#handled,
      'Cannot cancel FileChooser which is already handled!',
    );
    this.#handled = true;
    // XXX: These events should converted to trusted events. Perhaps do this
    // in `DOM.setFileInputFiles`?
    await this.#element.evaluate(element => {
      element.dispatchEvent(new Event('cancel', {bubbles: true}));
    });
  }
}

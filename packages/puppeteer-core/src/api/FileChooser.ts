/**
 * Copyright 2020 Google Inc. All rights reserved.
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

/**
 * {@link FileChooser} represents a file picker that appears for file input
 * elements.
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
  /**
   * @deprecated Use {@link FileChooser.multiple}.
   */
  isMultiple(): boolean {
    return this.multiple;
  }

  /**
   * Whether
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple | multiple}
   * files are allowed.
   */
  get multiple(): boolean {
    throw new Error('Not implemented');
  }

  /**
   * Accept the file chooser request with the given file paths.
   *
   * @remarks This will not validate whether the file paths exists. Also, if a path is
   * relative, then it is resolved against the
   * {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
   *
   * For locals script connecting to remote chrome environments, paths must be
   * absolute.
   */
  async accept(paths: string[]): Promise<void>;
  async accept(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Closes the file chooser without selecting any files.
   */
  cancel(): Promise<void>;
  cancel(): Promise<void> {
    throw new Error('Not implemented');
  }
}

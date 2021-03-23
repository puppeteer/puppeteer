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
import { ElementHandle } from './JSHandle.js';
import { Protocol } from 'devtools-protocol';
/**
 * File choosers let you react to the page requesting for a file.
 * @remarks
 * `FileChooser` objects are returned via the `page.waitForFileChooser` method.
 * @example
 * An example of using `FileChooser`:
 * ```js
 * const [fileChooser] = await Promise.all([
 *   page.waitForFileChooser(),
 *   page.click('#upload-file-button'), // some button that triggers file selection
 * ]);
 * await fileChooser.accept(['/tmp/myfile.pdf']);
 * ```
 * **NOTE** In browsers, only one file chooser can be opened at a time.
 * All file choosers must be accepted or canceled. Not doing so will prevent
 * subsequent file choosers from appearing.
 */
export declare class FileChooser {
    private _element;
    private _multiple;
    private _handled;
    /**
     * @internal
     */
    constructor(element: ElementHandle, event: Protocol.Page.FileChooserOpenedEvent);
    /**
     * Whether file chooser allow for {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple | multiple} file selection.
     */
    isMultiple(): boolean;
    /**
     * Accept the file chooser request with given paths.
     * @param filePaths - If some of the  `filePaths` are relative paths,
     * then they are resolved relative to the {@link https://nodejs.org/api/process.html#process_process_cwd | current working directory}.
     */
    accept(filePaths: string[]): Promise<void>;
    /**
     * Closes the file chooser without selecting any files.
     */
    cancel(): void;
}
//# sourceMappingURL=FileChooser.d.ts.map
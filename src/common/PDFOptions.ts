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
 * @public
 */
export interface PDFMargin {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

/**
 * @public
 */
export type LowerCasePaperFormat =
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'ledger'
  | 'a0'
  | 'a1'
  | 'a2'
  | 'a3'
  | 'a4'
  | 'a5'
  | 'a6';

/**
 * All the valid paper format types when printing a PDF.
 *
 * @remarks
 *
 * The sizes of each format are as follows:
 *
 * - `Letter`: 8.5in x 11in
 *
 * - `Legal`: 8.5in x 14in
 *
 * - `Tabloid`: 11in x 17in
 *
 * - `Ledger`: 17in x 11in
 *
 * - `A0`: 33.1in x 46.8in
 *
 * - `A1`: 23.4in x 33.1in
 *
 * - `A2`: 16.54in x 23.4in
 *
 * - `A3`: 11.7in x 16.54in
 *
 * - `A4`: 8.27in x 11.7in
 *
 * - `A5`: 5.83in x 8.27in
 *
 * - `A6`: 4.13in x 5.83in
 *
 * @public
 */
export type PaperFormat =
  | Uppercase<LowerCasePaperFormat>
  | Capitalize<LowerCasePaperFormat>
  | LowerCasePaperFormat;

/**
 * Valid options to configure PDF generation via {@link Page.pdf}.
 * @public
 */
export interface PDFOptions {
  /**
   * Scales the rendering of the web page. Amount must be between `0.1` and `2`.
   * @defaultValue 1
   */
  scale?: number;
  /**
   * Whether to show the header and footer.
   * @defaultValue false
   */
  displayHeaderFooter?: boolean;
  /**
   * HTML template for the print header. Should be valid HTML with the following
   * classes used to inject values into them:
   *
   * - `date` formatted print date
   *
   * - `title` document title
   *
   * - `url` document location
   *
   * - `pageNumber` current page number
   *
   * - `totalPages` total pages in the document
   */
  headerTemplate?: string;
  /**
   * HTML template for the print footer. Has the same constraints and support
   * for special classes as {@link PDFOptions.headerTemplate}.
   */
  footerTemplate?: string;
  /**
   * Set to `true` to print background graphics.
   * @defaultValue false
   */
  printBackground?: boolean;
  /**
   * Whether to print in landscape orientation.
   * @defaultValue = false
   */
  landscape?: boolean;
  /**
   * Paper ranges to print, e.g. `1-5, 8, 11-13`.
   * @defaultValue The empty string, which means all pages are printed.
   */
  pageRanges?: string;
  /**
   * @remarks
   * If set, this takes priority over the `width` and `height` options.
   * @defaultValue `letter`.
   */
  format?: PaperFormat;
  /**
   * Sets the width of paper. You can pass in a number or a string with a unit.
   */
  width?: string | number;
  /**
   * Sets the height of paper. You can pass in a number or a string with a unit.
   */
  height?: string | number;
  /**
   * Give any CSS `@page` size declared in the page priority over what is
   * declared in the `width` or `height` or `format` option.
   * @defaultValue `false`, which will scale the content to fit the paper size.
   */
  preferCSSPageSize?: boolean;
  /**
   * Set the PDF margins.
   * @defaultValue no margins are set.
   */
  margin?: PDFMargin;
  /**
   * The path to save the file to.
   *
   * @remarks
   *
   * If the path is relative, it's resolved relative to the current working directory.
   *
   * @defaultValue the empty string, which means the PDF will not be written to disk.
   */
  path?: string;
  /**
   * Hides default white background and allows generating pdfs with transparency.
   * @defaultValue false
   */
  omitBackground?: boolean;
  /**
   * Timeout in milliseconds
   * @defaultValue 30000
   */
  timeout?: number;
}

/**
 * @internal
 */
export interface PaperFormatDimensions {
  width: number;
  height: number;
}

/**
 * @internal
 */
export const _paperFormats: Record<
  LowerCasePaperFormat,
  PaperFormatDimensions
> = {
  letter: {width: 8.5, height: 11},
  legal: {width: 8.5, height: 14},
  tabloid: {width: 11, height: 17},
  ledger: {width: 17, height: 11},
  a0: {width: 33.1, height: 46.8},
  a1: {width: 23.4, height: 33.1},
  a2: {width: 16.54, height: 23.4},
  a3: {width: 11.7, height: 16.54},
  a4: {width: 8.27, height: 11.7},
  a5: {width: 5.83, height: 8.27},
  a6: {width: 4.13, height: 5.83},
} as const;

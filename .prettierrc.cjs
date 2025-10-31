/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @type {import('prettier').Config}
 */
module.exports = {
  bracketSpacing: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  singleAttributePerLine: true,
  htmlWhitespaceSensitivity: 'strict',
  /**
   * Uncomment this while working on Markdown documents.
   * MAKE SURE TO COMMENT THIS BEFORE RUNNING CHECKS/FORMATS
   * OR EVERYTHING WILL BE MODIFIED.
   */
  // proseWrap: 'always',
};

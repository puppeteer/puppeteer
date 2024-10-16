/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @type {import('prettier').Config}
 */
module.exports = {
  ...require('gts/.prettierrc.json'),
  /**
   * Uncomment this while working on Markdown documents.
   * MAKE SURE TO COMMENT THIS BEFORE RUNNING CHECKS/FORMATS
   * OR EVERYTHING WILL BE MODIFIED.
   */
  // proseWrap: 'always',
};

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import checkLicenseRule from './check-license.js';
import enforceExtensionRule from './extensions.js';
import noInvalidSetContentRule from './no-quirks-mode-set-content.js';
import prettierCommentsRule from './prettier-comments.js';
import useUsingRule from './use-using.js';

export default {
  rules: {
    'check-license': checkLicenseRule,
    extensions: enforceExtensionRule,
    'no-quirks-mode-set-content': noInvalidSetContentRule,
    'prettier-comments': prettierCommentsRule,
    'use-using': useUsingRule,
  },
};

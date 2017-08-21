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

const markdownToc = require('markdown-toc');
const Message = require('./Message');

/**
 * @param {!Array<!Source>} sources
 * @return {!Array<!Message>}
 */
module.exports = function(sources) {
  const warnings = [];
  for (const source of sources) {
    const newText = markdownToc.insert(source.text());
    if (source.setText(newText))
      warnings.push('Regenerated table-of-contexts: ' + source.projectPath());
  }
  return warnings.map(warning => Message.warning(warning));
};

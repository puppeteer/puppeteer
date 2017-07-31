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

const Message = require('../Message');

const PUPPETEER_VERSION = require('../../../package.json').version;

module.exports = function(sources) {
  let messages = [];
  let commands = [];
  for (let source of sources) {
    const text = source.text();
    const commandStartRegex = /<!--\s*gen:([a-z]+)(?:\s*\(\s*([^)]*)\s*\))?\s*-->/ig;
    const commandEndRegex = /<!--\s*gen:stop\s*-->/ig;
    let start;

    while (start = commandStartRegex.exec(text)) { // eslint-disable-line no-cond-assign
      commandEndRegex.lastIndex = commandStartRegex.lastIndex;
      const end = commandEndRegex.exec(text);
      if (!end) {
        messages.push(Message.error(`Failed to find 'gen:stop' for comamnd ${start[0]}`));
        break;
      }
      commands.push({
        name: start[1],
        arg: start[2],
        source: source,
        from: commandStartRegex.lastIndex,
        to: end.index,
      });
      commandStartRegex.lastIndex = commandEndRegex.lastIndex;
    }
  }
  commands.sort((a, b) => b.from - a.from);
  let changedSources = new Set();
  for (let command of commands) {
    let newText = command.source.text();
    if (command.name === 'version')
      newText = replaceInText(newText, command.from, command.to, PUPPETEER_VERSION);
    else
      errors.push(`Unknown GEN command in ${command.source.projectPath()}: ${command.name}`);
    if (command.source.setText(newText))
      changedSources.add(command.source);
  }
  for (source of changedSources)
    messages.push(Message.warning(`GEN: updated ${source.projectPath()}`));
  return messages;
};

function replaceInText(text, from, to, newText) {
  return text.substring(0, from) + newText + text.substring(to);
}

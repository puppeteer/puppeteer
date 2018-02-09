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
  const messages = [];
  let commands = [];
  for (const source of sources) {
    const text = source.text();
    const commandStartRegex = /<!--\s*gen:([a-z]+)(?:\s*\(\s*([^)]*)\s*\))?\s*-->/ig;
    const commandEndRegex = /<!--\s*gen:stop\s*-->/ig;
    let start;

    while (start = commandStartRegex.exec(text)) { // eslint-disable-line no-cond-assign
      commandEndRegex.lastIndex = commandStartRegex.lastIndex;
      const end = commandEndRegex.exec(text);
      if (!end) {
        messages.push(Message.error(`Failed to find 'gen:stop' for command ${start[0]}`));
        break;
      }
      const name = start[1];
      const arg = start[2];
      const from = commandStartRegex.lastIndex;
      const to = end.index;
      commandStartRegex.lastIndex = commandEndRegex.lastIndex;
      commands.push({name, arg, from, to, source});
    }
  }

  commands = validateCommands(commands, messages);

  const changedSources = new Set();
  // Iterate commands in reverse order so that edits don't conflict.
  commands.sort((a, b) => b.from - a.from);
  for (const command of commands) {
    let newText = command.source.text();
    if (command.name === 'version')
      newText = replaceInText(newText, command.from, command.to, PUPPETEER_VERSION);
    if (command.source.setText(newText))
      changedSources.add(command.source);
  }
  for (const source of changedSources)
    messages.push(Message.warning(`GEN: updated ${source.projectPath()}`));
  return messages;
};

/**
 * @param {!Array<!Object>} commands
 * @param {!Array<!Message>} outMessages
 * @return {!Array<!Object>}
 */
function validateCommands(commands, outMessages) {
  // Filter sane commands
  const goodCommands = commands.filter(command => {
    if (command.name === 'version')
      return check(command, !command.arg, `"gen:version" should not have argument`);
    check(command, false, `Unknown command: "gen:${command.name}"`);
  });

  return goodCommands;

  function check(command, condition, message) {
    if (condition)
      return true;
    outMessages.push(Message.error(`${command.source.projectPath()}: ${message}`));
    return false;
  }
}

/**
 * @param {string} text
 * @param {number} from
 * @param {number} to
 * @param {string} newText
 * @return {string}
 */
function replaceInText(text, from, to, newText) {
  return text.substring(0, from) + newText + text.substring(to);
}

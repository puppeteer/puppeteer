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
      const name = start[1];
      const arg = start[2];
      const from = commandStartRegex.lastIndex;
      const to = end.index;
      commandStartRegex.lastIndex = commandEndRegex.lastIndex;
      commands.push({name, arg, from, to, source});
    }
  }

  commands = validateCommands(commands, messages);

  // Extract copied text.
  let copyIds = new Map();
  for (let command of commands) {
    if (command.name !== 'copy')
      continue;
    const copyText = command.source.text().substring(command.from, command.to);
    copyIds.set(command.arg, copyText);
  }

  let changedSources = new Set();
  // Iterate commands in reverse order so that edits don't conflict.
  commands.sort((a, b) => b.from - a.from);
  for (let command of commands) {
    let newText = command.source.text();
    if (command.name === 'version') {
      newText = replaceInText(newText, command.from, command.to, PUPPETEER_VERSION);
    } else if (command.name === 'paste') {
      let copyText = copyIds.get(command.arg);
      copyText = `\n<!-- Text below is automatically copied from "gen:copy(${command.arg})" -->` + copyText;
      newText = replaceInText(newText, command.from, command.to, copyText);
    }
    if (command.source.setText(newText))
      changedSources.add(command.source);
  }
  for (source of changedSources)
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
  let goodCommands = commands.filter(command => {
    if (command.name === 'version')
      return check(command, !command.arg, `"gen:version" should not have argument`);
    if (command.name === 'copy')
      return check(command, command.arg, `"gen:copy" should have argument - copyId`);
    if (command.name === 'paste')
      return check(command, command.arg, `"gen:paste" should have argument - name of the register to paste from`);
    check(command, false, `Unknown command: "gen:${command.name}"`);
  });

  // Make sure copy commands don't clash ids.
  let copyIds = new Map();
  goodCommands = goodCommands.filter(command => {
    if (command.name !== 'copy')
      return true;
    const duplicateCopy = copyIds.get(command.arg);
    const duplicatePath = duplicateCopy ? duplicateCopy.source.projectPath() : '';
    if (check(command, !duplicateCopy, `"gen:copy" tries to re-define copy id "${command.arg}" - previously defined in ${duplicatePath}`)) {
      copyIds.set(command.arg, command);
      return true;
    }
    return false;
  });

  // Make sure paste commands refer to proper ids, and every copyId is used at least
  // once.
  let unusedCopyIds = new Set(copyIds.keys());
  goodCommands = goodCommands.filter(command => {
    if (command.name !== 'paste')
      return true;
    unusedCopyIds.delete(command.arg);
    if (check(command, copyIds.has(command.arg), `"gen:paste" refers to unknown copy id "${command.arg}"`))
      return true;
    return false;
  });
  for (let copyId of unusedCopyIds) {
    let command = copyIds.get(copyId);
    check(command, false, `"gen:copy" defines unused copy id "${copyId}"`);
  }
  return goodCommands;

  function check(command, condition, message) {
    if (condition)
      return true;
    outMessages.push(Message.error(`${command.source.projectPath()}: ${message}`));
    return false;
  }
}

function replaceInText(text, from, to, newText) {
  return text.substring(0, from) + newText + text.substring(to);
}

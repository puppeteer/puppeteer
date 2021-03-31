#!/usr/bin/env node
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

const assert = require('assert');
const https = require('https');
// run `npm run dev-install` if lib dir is missing
const BrowserFetcher = require('../lib/cjs/puppeteer/node/BrowserFetcher.js')
  .BrowserFetcher;

const SUPPORTER_PLATFORMS = ['linux', 'mac', 'win32', 'win64'];
const fetchers = SUPPORTER_PLATFORMS.map(
  (platform) => new BrowserFetcher('', { platform })
);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

class Table {
  /**
   * @param {!Array<number>} columnWidths
   */
  constructor(columnWidths) {
    this.widths = columnWidths;
  }

  /**
   * @param {!Array<string>} values
   */
  drawRow(values) {
    assert(values.length === this.widths.length);
    let row = '';
    for (let i = 0; i < values.length; ++i)
      row += padCenter(values[i], this.widths[i]);
    console.log(row);
  }
}

const helpMessage = `
This script checks availability of prebuilt Chromium snapshots.

Usage: node check_availability.js [<options>] [<browser version(s)>]

options
    -f          full mode checks availability of all the platforms, default mode
    -r          roll mode checks for the most recent stable Chromium roll candidate
    -rb         roll mode checks for the most recent beta Chromium roll candidate
    -rd         roll mode checks for the most recent dev Chromium roll candidate
    -h          show this help

browser version(s)
    <revision>  single revision number means checking for this specific revision
    <from> <to> checks all the revisions within a given range, inclusively

Examples
  To check Chromium availability of a certain revision
    node check_availability.js [revision]

  To find a Chromium roll candidate for current stable Linux version
    node check_availability.js -r
  use -rb for beta and -rd for dev versions.

  To check Chromium availability from the latest revision in a descending order
    node check_availability.js
`;

function main() {
  const args = process.argv.slice(2);

  if (args.length > 3) {
    console.log(helpMessage);
    return;
  }

  if (args.length === 0) {
    checkOmahaProxyAvailability();
    return;
  }

  if (args[0].startsWith('-')) {
    const option = args[0].substring(1);
    switch (option) {
      case 'f':
        break;
      case 'r':
        checkRollCandidate('stable');
        return;
      case 'rb':
        checkRollCandidate('beta');
        return;
      case 'rd':
        checkRollCandidate('dev');
        return;
      default:
        console.log(helpMessage);
        return;
    }
    args.splice(0, 1); // remove options arg since we are done with options
  }

  if (args.length === 1) {
    const revision = parseInt(args[0], 10);
    checkRangeAvailability({
      fromRevision: revision,
      toRevision: revision,
      stopWhenAllAvailable: false,
    });
  } else {
    const fromRevision = parseInt(args[0], 10);
    const toRevision = parseInt(args[1], 10);
    checkRangeAvailability({
      fromRevision,
      toRevision,
      stopWhenAllAvailable: false,
    });
  }
}

async function checkOmahaProxyAvailability() {
  const latestRevisions = (
    await Promise.all([
      fetch(
        'https://storage.googleapis.com/chromium-browser-snapshots/Mac/LAST_CHANGE'
      ),
      fetch(
        'https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/LAST_CHANGE'
      ),
      fetch(
        'https://storage.googleapis.com/chromium-browser-snapshots/Win/LAST_CHANGE'
      ),
      fetch(
        'https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/LAST_CHANGE'
      ),
    ])
  ).map((s) => parseInt(s, 10));
  const from = Math.max(...latestRevisions);
  checkRangeAvailability({
    fromRevision: from,
    toRevision: 0,
    stopWhenAllAvailable: false,
  });
}
async function checkRollCandidate(channel) {
  const omahaResponse = await fetch(
    `https://omahaproxy.appspot.com/all.json?channel=${channel}&os=linux`
  );
  const linuxInfo = JSON.parse(omahaResponse)[0];
  if (!linuxInfo) {
    console.error(`no ${channel} linux information available from omahaproxy`);
    return;
  }

  const linuxRevision = parseInt(
    linuxInfo.versions[0].branch_base_position,
    10
  );
  const currentRevision = parseInt(
    require('../lib/cjs/puppeteer/revisions').PUPPETEER_REVISIONS.chromium,
    10
  );

  checkRangeAvailability({
    fromRevision: linuxRevision,
    toRevision: currentRevision,
    stopWhenAllAvailable: true,
  });
}

/**
 * @param {*} options
 */
async function checkRangeAvailability({
  fromRevision,
  toRevision,
  stopWhenAllAvailable,
}) {
  const table = new Table([10, 7, 7, 7, 7]);
  table.drawRow([''].concat(SUPPORTER_PLATFORMS));

  const inc = fromRevision < toRevision ? 1 : -1;
  const revisionToStop = toRevision + inc; // +inc so the range is fully inclusive
  for (
    let revision = fromRevision;
    revision !== revisionToStop;
    revision += inc
  ) {
    const allAvailable = await checkAndDrawRevisionAvailability(
      table,
      '',
      revision
    );
    if (allAvailable && stopWhenAllAvailable) break;
  }
}

/**
 * @param {!Table} table
 * @param {string} name
 * @param {number} revision
 * @returns {boolean}
 */
async function checkAndDrawRevisionAvailability(table, name, revision) {
  const promises = fetchers.map((fetcher) => fetcher.canDownload(revision));
  const availability = await Promise.all(promises);
  const allAvailable = availability.every((e) => !!e);
  const values = [
    name +
      ' ' +
      (allAvailable ? colors.green + revision + colors.reset : revision),
  ];
  for (let i = 0; i < availability.length; ++i) {
    const decoration = availability[i] ? '+' : '-';
    const color = availability[i] ? colors.green : colors.red;
    values.push(color + decoration + colors.reset);
  }
  table.drawRow(values);
  return allAvailable;
}

/**
 * @param {string} url
 * @returns {!Promise<?string>}
 */
function fetch(url) {
  let resolve;
  const promise = new Promise((x) => (resolve = x));
  https
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }
      let body = '';
      response.on('data', function (chunk) {
        body += chunk;
      });
      response.on('end', function () {
        resolve(body);
      });
    })
    .on('error', function (e) {
      console.error('Error fetching json: ' + e);
      resolve(null);
    });
  return promise;
}

/**
 * @param {number} size
 * @returns {string}
 */
function spaceString(size) {
  return new Array(size).fill(' ').join('');
}

/**
 * @param {string} text
 * @returns {string}
 */
function filterOutColors(text) {
  for (const colorName in colors) {
    const color = colors[colorName];
    text = text.replace(color, '');
  }
  return text;
}

/**
 * @param {string} text
 * @param {number} length
 * @returns {string}
 */
function padCenter(text, length) {
  const printableCharacters = filterOutColors(text);
  if (printableCharacters.length >= length) return text;
  const left = Math.floor((length - printableCharacters.length) / 2);
  const right = Math.ceil((length - printableCharacters.length) / 2);
  return spaceString(left) + text + spaceString(right);
}

main();

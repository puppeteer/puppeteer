/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview
 * This test provide a way to verify we are not using Top-level await
 * or other features when importing Puppeteer in CJS
 */
import {exec as execCallback} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

const exec = promisify(execCallback);

/**
 * @returns {Promise<string[]>}
 */
async function discoverSmokeTests() {
  try {
    const files = await fs.readdir('./src');
    return files.map(file => {
      return `node ${path.join('./src', file)}`;
    });
  } catch (error) {
    console.error(`Error reading test directory:`, error);
    process.exit(1);
  }
}

/**
 * @param {string} command
 * @returns {Promise<{command: string, success: boolean, output: string}>}
 */
async function runSmokeFile(command) {
  try {
    const {stdout, stderr} = await exec(command);
    return {command, success: true, output: stdout || stderr};
  } catch (error) {
    return {command, success: false, output: error.stderr || error.message};
  }
}

const results = [];
const commandsToRun = await discoverSmokeTests();
for (const command of commandsToRun) {
  results.push(await runSmokeFile(command));
}

const failedTests = results.filter(r => {
  return !r.success;
});

if (failedTests.length > 0) {
  console.error('Some smoke test failed:');
  for (const test of failedTests) {
    console.error(`- ${test.command}`, test.output);
  }
  process.exit(1);
} else {
  console.log('All smoke tests passed!');
  process.exit(0);
}

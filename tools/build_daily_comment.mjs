/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import actions from '@actions/core';

/**
 *
 * @param {string} env
 * @returns {string}
 */
function getGitHubEnvVariable(env) {
  return process.env[`GITHUB_${env.toUpperCase()}`];
}

function getStatus(result) {
  if (result === 'success') {
    return '✅ Tests succeeded';
  }

  return '❌ Tests failed';
}

const chromeStatus = getStatus(process.env.CHROME_RUN_STATUS);
const firefoxStatus = getStatus(process.env.FIREFOX_RUN_STATUS);
const body = `
| Browser | Status | 
| ------- | ------ | 
| Chrome Canary | ${chromeStatus} |
| Firefox Nightly | ${firefoxStatus} |
`;

const footer = `
---
[Link](${getGitHubEnvVariable('server_url')}/${getGitHubEnvVariable('repository')}/actions/runs/${getGitHubEnvVariable('run_id')})`;

actions.setOutput('body', `${body}${footer}`);

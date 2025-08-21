/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import actions from '@actions/core';
import {resolveBuildId} from '@puppeteer/browsers';
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

const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
};
const today = new Date().toLocaleDateString('en-GB', options);

const chromeStatus = getStatus(process.env.CHROME_RUN_STATUS);
const firefoxStatus = getStatus(process.env.FIREFOX_RUN_STATUS);

const chromeVersion = await resolveBuildId('chrome', 'linux', 'canary');
const firefoxVersion = await resolveBuildId('firefox', 'linux', 'nightly');

const body = `
Date: ${today}

| Browser | Status | Version | 
| ------- | ------ | ------- | 
| Chrome Canary | ${chromeStatus} | ${chromeVersion} |
| Firefox Nightly | ${firefoxStatus} | ${firefoxVersion} |
`;

const footer = `
---
[Link](${getGitHubEnvVariable('server_url')}/${getGitHubEnvVariable('repository')}/actions/runs/${getGitHubEnvVariable('run_id')})`;

actions.setOutput('today', today);
actions.setOutput('body', `${body}${footer}`);

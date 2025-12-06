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

import fs from 'fs';

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

let chromeStatus = getStatus(process.env.CHROME_RUN_STATUS);
let chromeBidiStatus = chromeStatus;
const firefoxStatus = getStatus(process.env.FIREFOX_RUN_STATUS);

try {
  const jobsData = JSON.parse(fs.readFileSync('jobs.json', 'utf8'));
  const jobs = jobsData.jobs;

  const chromeBidiJobs = jobs.filter(job => job.name.includes('chrome-bidi'));
  const otherChromeJobs = jobs.filter(
    job =>
      (job.name.includes('chrome-headless') ||
        job.name.includes('chrome-headful') ||
        job.name.includes('chrome-headless-shell')) &&
      !job.name.includes('chrome-bidi')
  );

  if (chromeBidiJobs.length > 0) {
    const allBidiSuccess = chromeBidiJobs.every(
      job => job.conclusion === 'success'
    );
    chromeBidiStatus = getStatus(allBidiSuccess ? 'success' : 'failure');
  }

  if (otherChromeJobs.length > 0) {
    const allOtherSuccess = otherChromeJobs.every(
      job => job.conclusion === 'success'
    );
    chromeStatus = getStatus(allOtherSuccess ? 'success' : 'failure');
  }
} catch (e) {
  // Fallback to env vars if jobs.json fails
}

const chromeVersion = await resolveBuildId('chrome', 'linux', 'canary');
const firefoxVersion = await resolveBuildId('firefox', 'linux', 'nightly');

const body = `
Date: ${today}

| Browser | Status | Version | 
| ------- | ------ | ------- | 
| Chrome Canary | ${chromeStatus} | ${chromeVersion} |
| Chrome BiDi | ${chromeBidiStatus} | ${chromeVersion} |
| Firefox Nightly | ${firefoxStatus} | ${firefoxVersion} |
`;

const footer = `
---
[Link](${getGitHubEnvVariable('server_url')}/${getGitHubEnvVariable('repository')}/actions/runs/${getGitHubEnvVariable('run_id')})`;

actions.setOutput('today', today);
actions.setOutput('body', `${body}${footer}`);

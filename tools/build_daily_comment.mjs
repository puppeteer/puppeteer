/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as actions from '@actions/core';
import {resolveBuildId} from '@puppeteer/browsers';

/**
 * @param {string} env
 * @returns {string}
 */
function getGitHubEnvVariable(env) {
  return process.env[`GITHUB_${env.toUpperCase()}`];
}

const options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
};
const today = new Date().toLocaleDateString('en-GB', options);

const runId = getGitHubEnvVariable('run_id');
const repo = getGitHubEnvVariable('repository');
const serverUrl = getGitHubEnvVariable('server_url');
const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new Error('GITHUB_TOKEN is not set');
}

// Fetch jobs
const jobsUrl = `${getGitHubEnvVariable('api_url')}/repos/${repo}/actions/runs/${runId}/jobs?per_page=100`;
const response = await fetch(jobsUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
  },
});

if (!response.ok) {
  throw new Error(`Failed to fetch jobs: ${response.statusText}`);
}

const data = await response.json();
const jobs = data.jobs;

const chromeCanaryJobs = jobs.filter(job => {
  return (
    job.name.includes('chrome') && !job.name.toLowerCase().includes('bidi')
  );
});
const chromeBidiJobs = jobs.filter(job => {
  return job.name.includes('chrome') && job.name.toLowerCase().includes('bidi');
});
const firefoxJobs = jobs.filter(job => {
  return job.name.includes('firefox');
});

const chromeVersion = await resolveBuildId('chrome', 'linux', 'canary');
const firefoxVersion = await resolveBuildId('firefox', 'linux', 'nightly');

function getShardId(jobName) {
  const match = jobName.match(/\((\d+-\d+)\)/);
  return match ? match[1] : 'unknown';
}

function getAggregateStatus(jobs) {
  const allCompleted = jobs.every(job => {
    return job.status === 'completed';
  });
  const failedOrCancelled = jobs.filter(job => {
    return job.conclusion === 'failure' || job.conclusion === 'cancelled';
  });

  if (!allCompleted) {
    return '⏳';
  }
  if (failedOrCancelled.length === 0) {
    return '✅';
  }

  // Group failures by shard ID
  const failuresByShard = new Map();
  for (const job of failedOrCancelled) {
    const shardId = getShardId(job.name);
    failuresByShard.set(shardId, (failuresByShard.get(shardId) || 0) + 1);
  }

  // If any shard failed more than once, it's a real failure.
  for (const count of failuresByShard.values()) {
    if (count > 1) {
      return '❌';
    }
  }

  // Otherwise, it's just a warning (flaky or isolated).
  return '⚠️';
}

const table = `
| Browser type | Protocol | Status | Version |
| ------------ | -------- | ------ | ------- |
| Chrome Canary | CDP | ${getAggregateStatus(chromeCanaryJobs)} | ${chromeVersion} |
| Chrome Canary | BiDi | ${getAggregateStatus(chromeBidiJobs)} | ${chromeVersion} |
| Firefox Nightly | BiDi | ${getAggregateStatus(firefoxJobs)} | ${firefoxVersion} |
`;

const body = `
Date: ${today}

${table}
`;

const footer = `
---
[Link](${serverUrl}/${repo}/actions/runs/${runId})`;

actions.setOutput('today', today);
actions.setOutput('body', `${body}${footer}`);

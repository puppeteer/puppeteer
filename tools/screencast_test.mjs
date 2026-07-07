/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    // Disable Puppeteer's default exit behavior on Ctrl+C
    handleSIGINT: false,
  });
  const page = await browser.newPage();

  await page.setViewport({width: 1280, height: 720});

  console.log('Navigating to Aquarium...');
  await page.goto('https://webglsamples.org/aquarium/aquarium.html', {
    waitUntil: 'networkidle2',
  });

  console.log('Starting recording...');
  const recorder = await page.screencast({
    path: '/tmp/recording-aquarium.mp4',
    format: 'mp4',
  });

  // Wait indefinitely until the user triggers SIGINT (Ctrl+C)
  await new Promise(resolve => {
    process.once('SIGINT', () => {
      console.log('\nCtrl+C received. Stopping recording...');
      resolve();
    });
  });

  await recorder.stop();
  await browser.close();

  console.log('Done! Video saved to /tmp/recording-aquarium.mp4');
  process.exit(0);
}

run().catch(console.error);

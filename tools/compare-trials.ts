/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';

/**
 * This command compares two versions (good and bad) of the field trial testing configs
 * (https://source.chromium.org/chromium/chromium/src/+/main:testing/variations/fieldtrial_testing_config.json)
 * and prints features that need to be disabled to go back to the state
 * defined by the good config.
 *
 * Usage:
 *
 * node --experimental-strip-types tools/compare-trials.ts configBad.json configGood.json
 */

// TODO: replace with yargs.
const bad = readConfig(process.argv[2]);
const good = readConfig(process.argv[3]);

function readConfig(filepath: string): object {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function getFeatures(config: object) {
  const enabledFeatures = new Set();
  const distabledFeatures = new Set();
  for (const key of Object.keys(config)) {
    const item = config[key];
    for (const subitem of item) {
      // In field trials, only the first experiment applies.
      // TODO: this should be per platform.
      const exp = subitem['experiments'][0];
      for (const feature of exp['enable_features'] ?? []) {
        enabledFeatures.add(feature);
      }
      for (const feature of exp['disable_features'] ?? []) {
        enabledFeatures.add(feature);
      }
    }
  }
  return {enabledFeatures, distabledFeatures};
}

const {
  enabledFeatures: badEnabledFeatures,
  distabledFeatures: badDisabledFeatures,
} = getFeatures(bad);

const {
  enabledFeatures: goodEnabledFeatures,
  distabledFeatures: goodDisabledFeatures,
} = getFeatures(good);

for (const badFeature of badEnabledFeatures) {
  if (!goodEnabledFeatures.has(badFeature)) {
    console.log(`'${badFeature}',`);
  }
}

for (const goodFeature of goodDisabledFeatures) {
  if (!badDisabledFeatures.has(goodFeature)) {
    console.log(`'${goodFeature}',`);
  }
}

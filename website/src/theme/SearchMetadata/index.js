/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import Head from '@docusaurus/Head';
import React from 'react';

// Tracks the global package version as a local, monotonic counter. This
// prevents Algolia from deleting based on differing package versions and
// instead delete based on the number of versions we intend to keep documented.

class MonotonicCountMap {
  #counter = -1;
  #map = new Map();

  get(key) {
    let counter = this.#map.get(key);
    if (!counter) {
      counter = ++this.#counter;
      this.#map.set(key, counter);
    }
    return counter;
  }
}

export const tagToCounter = new MonotonicCountMap();

export default function SearchMetadata({locale, tag}) {
  const language = locale;
  let counter;
  if (tag) {
    counter = tagToCounter.get(tag);
  }
  return (
    <Head>
      {language && <meta name="docsearch:language" content={language} />}
      {counter && <meta name="docsearch:counter" content={counter} />}
    </Head>
  );
}

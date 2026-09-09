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
    if (!this.#map.has(key)) {
      this.#map.set(key, ++this.#counter);
    }
    return this.#map.get(key);
  }
}

export const tagToCounter = new MonotonicCountMap();

export default function SearchMetadata({locale, tag}) {
  const language = locale;
  const counter = tag ? tagToCounter.get(tag) : undefined;
  return (
    <Head>
      {language && (
        <meta
          name="docsearch:language"
          content={language}
        />
      )}
      {counter !== undefined && (
        <meta
          name="docsearch:counter"
          content={String(counter)}
        />
      )}
    </Head>
  );
}

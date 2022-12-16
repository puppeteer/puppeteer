import React from 'react';
import Head from '@docusaurus/Head';

// Tracks the global package version as a local, monotonic counter. This
// prevents Algolia from deleting based on differing package versions and
// instead delete based on the number of versions we intend to keep documented.
let globalCounter = -1;
const versionToCounter = new Map();

export default function SearchMetadata({locale, version}) {
  const language = locale;
  let counter;
  if (version) {
    counter = versionToCounter.get(version);
    if (!counter) {
      counter = ++globalCounter;
      versionToCounter.set(version, counter);
    }
  }
  return (
    <Head>
      {language && <meta name="docsearch:language" content={language} />}
      {counter && <meta name="docsearch:counter" content={counter} />}
    </Head>
  );
}

/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Tests call these functions through the service worker to discard and to
// reload tabs with the chrome.tabs API.

async function findTab(url) {
  // Compare the URLs here, because match patterns for chrome.tabs.query()
  // do not support all URLs.
  const tabs = (await chrome.tabs.query({})).filter(tab => {
    return tab.url === url || tab.pendingUrl === url;
  });
  if (tabs.length !== 1) {
    throw new Error(`Expected one tab with URL ${url}, found ${tabs.length}`);
  }
  return tabs[0];
}

globalThis.discardTab = async url => {
  const tab = await findTab(url);
  const discardedTab = await chrome.tabs.discard(tab.id);
  if (!discardedTab) {
    throw new Error(`Could not discard the tab with URL ${url}`);
  }
};

globalThis.reloadTab = async url => {
  const tab = await findTab(url);
  await chrome.tabs.reload(tab.id);
};

globalThis.closeTabs = async url => {
  const tabs = (await chrome.tabs.query({})).filter(tab => {
    return tab.url === url || tab.pendingUrl === url;
  });
  await chrome.tabs.remove(
    tabs.map(tab => {
      return tab.id;
    }),
  );
};

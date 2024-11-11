/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
const url = new URL(window.location.href);
if (url.pathname.endsWith('/') && url.pathname !== '/') {
  url.pathname = url.pathname.substring(0, url.pathname.length - 1);
  window.history.replaceState(null, undefined, url.toString());
}

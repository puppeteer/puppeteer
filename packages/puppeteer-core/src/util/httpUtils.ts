/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Normalizes HTTP header values by handling multiline values.
 * Folded multiline header values are unfolded with spaces. Set-Cookie is
 * preserved because multiple Set-Cookie fields cannot be combined safely.
 *
 * @internal
 */
export function normalizeHeaderValue(
  header: string,
  headerName?: string,
): string {
  if (headerName?.toLowerCase() === 'set-cookie') {
    return header;
  }

  if (!header.includes('\n')) {
    return header;
  }

  return header
    .split('\n')
    .map(v => {
      return v.trim();
    })
    .filter(Boolean)
    .join(' ');
}

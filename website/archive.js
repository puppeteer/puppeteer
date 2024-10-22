/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * "Archives" older versions of the website docs to reduce the build time:
 *
 * - keeps one latest version + next
 * - moves older versions to versionsArchived.json
 */

const fs = require('fs');
const path = require('path');

const versionsFilename = path.join(__dirname, 'versions.json');
const versionsArchivedFilename = path.join(__dirname, 'versionsArchived.json');
const versionedDocsDirname = path.join(__dirname, 'versioned_docs');
const versionedSidebarsDirname = path.join(__dirname, 'versioned_sidebars');

const versions = JSON.parse(fs.readFileSync(versionsFilename, 'utf-8'));
const versionsArchived = JSON.parse(
  fs.readFileSync(versionsArchivedFilename, 'utf-8'),
);

if (versions.length > 1) {
  const newVersions = [versions.shift()];

  for (const oldVersion of versions) {
    versionsArchived.unshift(oldVersion);
    fs.rmSync(path.join(versionedDocsDirname, `version-${oldVersion}`), {
      recursive: true,
      force: true,
    });
    fs.rmSync(
      path.join(
        versionedSidebarsDirname,
        `version-${oldVersion}-sidebars.json`,
      ),
      {recursive: true, force: true},
    );
  }

  fs.writeFileSync(versionsFilename, JSON.stringify(newVersions, null, 2));
  fs.writeFileSync(
    versionsArchivedFilename,
    JSON.stringify(versionsArchived, null, 2),
  );
}

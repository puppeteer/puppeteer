/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 *
 * @param {String} directory
 * @param {String[]} files
 */
async function findSchemaFiles(directory, files = []) {
  const items = await fs.readdir(directory);
  const promises = [];
  // Match any listing that has no *.* format
  // Ignore files folder
  const regEx = /^.*\.[^\s]*$/;

  items.forEach(item => {
    if (!item.match(regEx)) {
      promises.push(findSchemaFiles(`${directory}/${item}`, files));
    } else if (item.endsWith('.json') || directory.includes('files')) {
      files.push(`${directory}/${item}`);
    }
  });

  await Promise.all(promises);

  return files;
}

async function copySchemaFiles() {
  const srcDir = path.join(import.meta.dirname, '..', 'src');
  const outputDir = path.join(import.meta.dirname, '..', 'lib');
  const files = await findSchemaFiles(srcDir);

  const moves = files.map(file => {
    const to = file.replace(srcDir, outputDir);

    return {from: file, to};
  });

  // Because fs.cp is Experimental (recursive support)
  // We need to create directories first and copy the files
  await Promise.all(
    moves.map(({to}) => {
      const dir = path.dirname(to);
      return fs.mkdir(dir, {recursive: true});
    }),
  );
  await Promise.all(
    moves.map(({from, to}) => {
      return fs.copyFile(from, to);
    }),
  );
}

copySchemaFiles();

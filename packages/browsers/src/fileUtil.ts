/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {exec as execChildProcess} from 'child_process';
import {createReadStream} from 'fs';
import {mkdir, readdir} from 'fs/promises';
import * as path from 'path';
import {promisify} from 'util';

import extractZip from 'extract-zip';
import tar from 'tar-fs';
import bzip from 'unbzip2-stream';

const exec = promisify(execChildProcess);

/**
 * @internal
 */
export async function unpackArchive(
  archivePath: string,
  folderPath: string
): Promise<void> {
  if (archivePath.endsWith('.zip')) {
    await extractZip(archivePath, {dir: folderPath});
  } else if (archivePath.endsWith('.tar.bz2')) {
    await extractTar(archivePath, folderPath);
  } else if (archivePath.endsWith('.dmg')) {
    await mkdir(folderPath);
    await installDMG(archivePath, folderPath);
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

/**
 * @internal
 */
function extractTar(tarPath: string, folderPath: string): Promise<void> {
  return new Promise((fulfill, reject) => {
    const tarStream = tar.extract(folderPath);
    tarStream.on('error', reject);
    tarStream.on('finish', fulfill);
    const readStream = createReadStream(tarPath);
    readStream.pipe(bzip()).pipe(tarStream);
  });
}

/**
 * @internal
 */
async function installDMG(dmgPath: string, folderPath: string): Promise<void> {
  const {stdout} = await exec(
    `hdiutil attach -nobrowse -noautoopen "${dmgPath}"`
  );

  const volumes = stdout.match(/\/Volumes\/(.*)/m);
  if (!volumes) {
    throw new Error(`Could not find volume path in ${stdout}`);
  }
  const mountPath = volumes[0]!;

  try {
    const fileNames = await readdir(mountPath);
    const appName = fileNames.find(item => {
      return typeof item === 'string' && item.endsWith('.app');
    });
    if (!appName) {
      throw new Error(`Cannot find app in ${mountPath}`);
    }
    const mountedPath = path.join(mountPath!, appName);

    await exec(`cp -R "${mountedPath}" "${folderPath}"`);
  } finally {
    await exec(`hdiutil detach "${mountPath}" -quiet`);
  }
}

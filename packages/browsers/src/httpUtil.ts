/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {createHash} from 'node:crypto';
import {createWriteStream, unlinkSync} from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import {URL, urlToHttpOptions} from 'node:url';

export async function headHttpRequest(url: URL): Promise<boolean> {
  return await new Promise(resolve => {
    httpRequest(
      url,
      'HEAD',
      response => {
        // consume response data free node process
        response.resume();
        resolve(response.statusCode === 200);
      },
      false,
    )
      .then(request => {
        request.on('error', () => {
          resolve(false);
        });
      })
      .catch(() => {
        resolve(false);
      });
  });
}

export async function httpRequest(
  url: URL,
  method: string,
  response: (x: http.IncomingMessage) => void,
  keepAlive = true,
): Promise<http.ClientRequest> {
  let agent: http.Agent | undefined;
  try {
    const {ProxyAgent} = await import('proxy-agent');
    agent = new ProxyAgent();
  } catch {
    // Standard Node.js agents will be used.
  }

  const options: http.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method,
    headers: keepAlive ? {Connection: 'keep-alive'} : undefined,
    auth: urlToHttpOptions(url).auth,
    agent,
  };

  const requestCallback = (res: http.IncomingMessage): void => {
    if (
      res.statusCode &&
      res.statusCode >= 300 &&
      res.statusCode < 400 &&
      res.headers.location
    ) {
      void httpRequest(new URL(res.headers.location), method, response);
      // consume response data to free up memory
      // And prevents the connection from being kept alive
      res.resume();
    } else {
      response(res);
    }
  };
  const request =
    options.protocol === 'https:'
      ? https.request(options, requestCallback)
      : http.request(options, requestCallback);
  request.end();
  return request;
}

/**
 * @internal
 */
export function downloadFile(
  url: URL,
  destinationPath: string,
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void,
  expectedHash?: string,
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    let downloadedBytes = 0;
    let totalBytes = 0;
    const hash = createHash('sha256');

    try {
      const request = await httpRequest(url, 'GET', response => {
        if (response.statusCode !== 200) {
          const error = new Error(
            `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
          );
          // consume response data to free up memory
          response.resume();
          reject(error);
          return;
        }
        const file = createWriteStream(destinationPath);
        file.on('close', () => {
          if (expectedHash) {
            const actualHash = hash.digest('hex');
            if (actualHash !== expectedHash.toLowerCase()) {
              try {
                unlinkSync(destinationPath);
              } catch {}
              reject(
                new Error(
                  `Integrity check failed for downloaded browser archive.\n` +
                    `  URL:      ${url}\n` +
                    `  Expected: ${expectedHash.toLowerCase()}\n` +
                    `  Actual:   ${actualHash}`,
                ),
              );
              return;
            }
          }
          return resolve();
        });
        file.on('error', error => {
          return reject(error);
        });
        totalBytes = parseInt(response.headers['content-length']!, 10);
        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          hash.update(chunk);
          if (progressCallback) {
            progressCallback(downloadedBytes, totalBytes);
          }
        });
        response.pipe(file);
      });
      request.on('error', error => {
        return reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}


export async function getJSON(url: URL): Promise<unknown> {
  const text = await getText(url);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Could not parse JSON from ' + url.toString());
  }
}

export function getText(url: URL): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const request = await httpRequest(
        url,
        'GET',
        response => {
          let data = '';
          if (response.statusCode && response.statusCode >= 400) {
            return reject(new Error(`Got status code ${response.statusCode}`));
          }
          response.on('data', chunk => {
            data += chunk;
          });
          response.on('end', () => {
            try {
              return resolve(String(data));
            } catch {
              return reject(
                new Error(`Failed to read text response from ${url}`),
              );
            }
          });
        },
        false,
      );
      request.on('error', err => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

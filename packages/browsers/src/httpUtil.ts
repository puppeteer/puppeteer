/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {createHash} from 'node:crypto';
import {createWriteStream, unlinkSync} from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import {Transform} from 'node:stream';
import {finished, pipeline} from 'node:stream/promises';
import {URL, urlToHttpOptions} from 'node:url';

export async function headHttpRequest(url: URL): Promise<boolean> {
  return await new Promise(resolve => {
    void httpRequest(
      url,
      'HEAD',
      response => {
        // consume response data free node process
        response.resume();
        resolve(response.statusCode === 200);
      },
      false,
      () => {
        resolve(false);
      },
    ).catch(() => {
      resolve(false);
    });
  });
}

export async function httpRequest(
  url: URL,
  method: string,
  response: (x: http.IncomingMessage) => void,
  keepAlive = true,
  onError?: (error: Error) => void,
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
      void httpRequest(
        new URL(res.headers.location, url),
        method,
        response,
        keepAlive,
        onError,
      ).catch(error => {
        onError?.(error);
      });
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
  if (onError) {
    request.once('error', onError);
  }
  request.end();
  return request;
}

class HashVerifier {
  readonly #hash = createHash('sha256');

  update(chunk: Buffer): void {
    this.#hash.update(chunk);
  }

  verify(url: URL, destinationPath: string, expectedHash: string): void {
    const actualHash = this.#hash.digest('hex');
    if (actualHash !== expectedHash.toLowerCase()) {
      try {
        unlinkSync(destinationPath);
      } catch {}
      throw new Error(
        `Integrity check failed for downloaded browser archive.\n` +
          `  URL:      ${url}\n` +
          `  Expected: ${expectedHash.toLowerCase()}\n` +
          `  Actual:   ${actualHash}`,
      );
    }
  }
}

/**
 * @internal
 */
export async function downloadFile(
  url: URL,
  destinationPath: string,
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void,
  expectedHash?: string,
): Promise<void> {
  // Keep the first failure through request and stream teardown.
  let firstError: Error | undefined;
  let activeResponse: http.IncomingMessage | undefined;
  const response = await new Promise<http.IncomingMessage>(
    (resolve, reject) => {
      const onError = (error: Error): void => {
        firstError ??= error;
        activeResponse?.destroy(firstError);
        reject(error);
      };
      void httpRequest(url, 'GET', resolve, true, onError).catch(onError);
    },
  );

  if (response.statusCode !== 200) {
    const responseClosed = finished(response).catch(() => {});
    response.destroy();
    await responseClosed;
    throw new Error(
      `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
    );
  }

  let downloadedBytes = 0;
  const contentLength = Number.parseInt(
    response.headers['content-length'] ?? '',
    10,
  );
  const totalBytes = Number.isFinite(contentLength) ? contentLength : undefined;
  const downloadError = (cause: unknown): Error => {
    if (totalBytes === undefined) {
      return new Error(
        `Download failed: connection closed before the download completed. URL: ${url}`,
        {cause},
      );
    }
    return new Error(
      `Download failed: expected ${totalBytes} bytes, received ${downloadedBytes} bytes. URL: ${url}`,
      {cause},
    );
  };
  let responseError: Error | undefined;
  const verifier = expectedHash ? new HashVerifier() : null;
  const progress = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      try {
        downloadedBytes += chunk.length;
        verifier?.update(chunk);
        progressCallback?.(downloadedBytes, totalBytes ?? 0);
      } catch (error) {
        const failure =
          error instanceof Error ? error : new Error(String(error));
        firstError ??= failure;
        callback(failure);
        return;
      }
      callback(null, chunk);
    },
  });

  const destination = createWriteStream(destinationPath);
  destination.once('error', error => {
    firstError ??= error;
  });
  response.once('error', error => {
    if (!firstError) {
      responseError = error;
    }
    firstError ??= error;
  });
  try {
    // Attach stream error handlers before stopping an early failed response.
    const download = pipeline(response, progress, destination);
    activeResponse = response;
    if (firstError) {
      response.destroy(firstError);
    }
    await download;
    if (firstError) {
      throw firstError;
    }
  } catch (error) {
    // pipeline waits for teardown before removing the partial download.
    try {
      unlinkSync(destinationPath);
    } catch {}
    const failure = firstError ?? error;
    if (!response.complete && failure === responseError) {
      throw downloadError(failure);
    }
    throw failure;
  }
  if (verifier && expectedHash) {
    verifier.verify(url, destinationPath, expectedHash);
  }
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
  return new Promise((resolve, reject) => {
    void httpRequest(
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
      reject,
    ).catch(reject);
  });
}

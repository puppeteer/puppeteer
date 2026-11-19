/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {createHash} from 'node:crypto';
import {createWriteStream, unlinkSync, type WriteStream} from 'node:fs';
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
      // consume response data to free up memory
      // And prevents the connection from being kept alive
      res.resume();
      // Callers only listen for errors on the initial request, so forward
      // errors from the redirect to it.
      let redirectUrl: URL;
      try {
        redirectUrl = new URL(res.headers.location, url);
      } catch (error) {
        request.emit('error', error);
        return;
      }
      httpRequest(redirectUrl, method, response).then(
        redirectRequest => {
          redirectRequest.on('error', error => {
            request.emit('error', error);
          });
        },
        error => {
          request.emit('error', error);
        },
      );
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

class DownloadError extends Error {
  isTransient: boolean;

  constructor(
    message: string,
    isTransient: boolean,
    options?: {cause?: unknown},
  ) {
    super(message, options);
    this.name = 'DownloadError';
    this.isTransient = isTransient;
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof DownloadError) {
    return error.isTransient;
  }
  if (error && typeof error === 'object') {
    const code = (error as NodeJS.ErrnoException).code;
    if (code) {
      const transientCodes = new Set([
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'EAI_AGAIN',
        'ENOTFOUND',
        'EPIPE',
        'EHOSTUNREACH',
        'ENETUNREACH',
      ]);
      if (transientCodes.has(code)) {
        return true;
      }
    }
  }
  return false;
}

function downloadFileAttempt(
  url: URL,
  destinationPath: string,
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void,
  expectedHash?: string,
): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    let downloadedBytes = 0;
    let totalBytes: number | undefined;
    const verifier = expectedHash ? new HashVerifier() : null;

    let file: WriteStream | undefined;
    let fileClosed = false;
    let fileClosePromise: Promise<void> | undefined;

    const cleanup = (): void => {
      try {
        unlinkSync(destinationPath);
      } catch {}
    };

    const cleanupAndReject = async (err: Error): Promise<void> => {
      if (file && !fileClosed && fileClosePromise) {
        file.destroy();
        await fileClosePromise;
      }
      cleanup();
      reject(err);
    };

    const downloadError = (cause?: Error): Error => {
      const options = cause ? {cause} : undefined;
      if (totalBytes === undefined) {
        return new DownloadError(
          `Download failed: connection closed before the download completed. URL: ${url}`,
          true,
          options,
        );
      }
      return new DownloadError(
        `Download failed: expected ${totalBytes} bytes, received ${downloadedBytes} bytes. URL: ${url}`,
        true,
        options,
      );
    };

    try {
      const request = await httpRequest(url, 'GET', response => {
        if (response.statusCode !== 200) {
          const isTransient =
            response.statusCode === 408 ||
            response.statusCode === 429 ||
            (response.statusCode !== undefined &&
              response.statusCode >= 500 &&
              response.statusCode < 600);
          const error = new DownloadError(
            `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
            isTransient,
          );
          // consume response data to free up memory
          response.resume();
          void cleanupAndReject(error);
          return;
        }
        file = createWriteStream(destinationPath);
        fileClosePromise = new Promise<void>(res => {
          file!.on('close', () => {
            fileClosed = true;
            res();
          });
        });

        let error: Error | undefined;
        const failDownload = (downloadError: Error): void => {
          error ??= downloadError;
          response.destroy();
          file?.destroy();
        };

        file.on('error', failDownload);
        file.on('close', () => {
          if (error) {
            cleanup();
            reject(error);
            return;
          }
          if (verifier && expectedHash) {
            try {
              verifier.verify(url, destinationPath, expectedHash);
            } catch (err) {
              reject(err);
              return;
            }
          }
          return resolve();
        });

        const contentLength = Number.parseInt(
          response.headers['content-length'] ?? '',
          10,
        );
        totalBytes = Number.isFinite(contentLength) ? contentLength : undefined;
        response.on('close', () => {
          if (!response.complete) {
            failDownload(downloadError());
          }
        });
        response.on('error', responseError => {
          failDownload(
            response.complete ? responseError : downloadError(responseError),
          );
        });
        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;
          verifier?.update(chunk);
          if (progressCallback) {
            progressCallback(downloadedBytes, totalBytes ?? 0);
          }
        });
        response.pipe(file);
      });
      request.on('error', async error => {
        await cleanupAndReject(error);
      });
    } catch (error) {
      await cleanupAndReject(error as Error);
    }
  });
}

/**
 * @internal
 */
export async function downloadFile(
  url: URL,
  destinationPath: string,
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void,
  expectedHash?: string,
  retry = 0,
  retryDelay = 1000,
): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      return await downloadFileAttempt(
        url,
        destinationPath,
        progressCallback,
        expectedHash,
      );
    } catch (error) {
      if (!isTransientError(error)) {
        throw error;
      }
      if (attempt < retry) {
        attempt++;
        const backoff =
          retryDelay > 0
            ? Math.min(retryDelay * Math.pow(2, attempt - 1), 10000)
            : 0;
        if (backoff > 0) {
          await new Promise(resolve => {
            setTimeout(resolve, backoff);
          });
        }
        continue;
      }
      throw error;
    }
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

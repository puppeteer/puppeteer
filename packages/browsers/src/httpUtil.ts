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

import {createWriteStream} from 'fs';
import * as http from 'http';
import * as https from 'https';
import {URL, urlToHttpOptions} from 'url';

import {ProxyAgent} from 'proxy-agent';

export function headHttpRequest(url: URL): Promise<boolean> {
  return new Promise(resolve => {
    const request = httpRequest(
      url,
      'HEAD',
      response => {
        resolve(response.statusCode === 200);
      },
      false
    );
    request.on('error', () => {
      resolve(false);
    });
  });
}

export function httpRequest(
  url: URL,
  method: string,
  response: (x: http.IncomingMessage) => void,
  keepAlive = true
): http.ClientRequest {
  const options: http.RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method,
    headers: keepAlive ? {Connection: 'keep-alive'} : undefined,
    auth: urlToHttpOptions(url).auth,
    agent: new ProxyAgent(),
  };

  const requestCallback = (res: http.IncomingMessage): void => {
    if (
      res.statusCode &&
      res.statusCode >= 300 &&
      res.statusCode < 400 &&
      res.headers.location
    ) {
      httpRequest(new URL(res.headers.location), method, response);
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
  progressCallback?: (downloadedBytes: number, totalBytes: number) => void
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let downloadedBytes = 0;
    let totalBytes = 0;

    function onData(chunk: string): void {
      downloadedBytes += chunk.length;
      progressCallback!(downloadedBytes, totalBytes);
    }

    const request = httpRequest(url, 'GET', response => {
      if (response.statusCode !== 200) {
        const error = new Error(
          `Download failed: server returned code ${response.statusCode}. URL: ${url}`
        );
        // consume response data to free up memory
        response.resume();
        reject(error);
        return;
      }
      const file = createWriteStream(destinationPath);
      file.on('finish', () => {
        return resolve();
      });
      file.on('error', error => {
        return reject(error);
      });
      response.pipe(file);
      totalBytes = parseInt(response.headers['content-length']!, 10);
      if (progressCallback) {
        response.on('data', onData);
      }
    });
    request.on('error', error => {
      return reject(error);
    });
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
  return new Promise((resolve, reject) => {
    const request = httpRequest(
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
            return reject(new Error('Chrome version not found'));
          }
        });
      },
      false
    );
    request.on('error', err => {
      reject(err);
    });
  });
}

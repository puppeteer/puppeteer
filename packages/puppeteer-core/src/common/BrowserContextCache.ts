/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Protocol} from 'devtools-protocol';

import type {BrowserContext} from '../puppeteer-core.js';

export interface BrowserContextCache {
  cache: Record<
    string,
    {
      data: Buffer;
      contentType: string;
      timestamp: number;
    }
  >;
  localStorage: Record<string, Record<string, string>>;
}

export class BrowserContextCacheManager {
  private static cacheStore = new Map<string, BrowserContextCache>();

  static async saveCache(id: string, context: BrowserContext): Promise<void> {
    const pages = await context.pages();
    const cache: BrowserContextCache = {
      cache: {},
      localStorage: {},
    };

    // Save cache for each page
    await Promise.all(
      pages.map(async page => {
        const client = await page.target().createCDPSession();

        try {
          // Enable network tracking
          await client.send('Network.enable');

          // Store responses in memory
          const requestCache = new Map<string, Protocol.Network.Response>();

          // Listen for responses
          client.on(
            'Network.responseReceived',
            (params: Protocol.Network.ResponseReceivedEvent) => {
              if (params.response.url && params.response.headers) {
                requestCache.set(params.response.url, params.response);
              }
            },
          );

          // Wait for page load to capture responses
          await page.reload({waitUntil: 'networkidle0'});

          // Store the captured responses
          for (const [url, response] of requestCache) {
            cache.cache[url] = {
              data: Buffer.from(JSON.stringify(response.headers)),
              contentType: response.headers['content-type'] || '',
              timestamp: Date.now(),
            };
          }

          // Get localStorage
          const origins = await page.evaluate(() => {
            const result: Record<string, string> = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                  result[key] = value;
                }
              }
            }
            return result;
          });

          cache.localStorage[page.url()] = origins;
        } finally {
          await client.detach();
        }
      }),
    );

    BrowserContextCacheManager.cacheStore.set(id, cache);
  }

  static async loadCache(id: string, context: BrowserContext): Promise<void> {
    const cache = BrowserContextCacheManager.cacheStore.get(id);
    if (!cache) {
      throw new Error(`No cache found for id: ${id}`);
    }

    const pages = await context.pages();
    await Promise.all(
      pages.map(async page => {
        const client = await page.target().createCDPSession();

        try {
          // Enable network interception
          await client.send('Network.enable');

          // Set up request interception to serve cached responses
          await page.setRequestInterception(true);

          page.on('request', async request => {
            const cachedData = cache.cache[request.url()];
            if (cachedData) {
              await request.respond({
                body: cachedData.data,
                headers: {
                  'content-type': cachedData.contentType,
                  'cache-control': 'public, max-age=31536000',
                },
              });
            } else {
              await request.continue();
            }
          });

          // Restore localStorage
          const originData = cache.localStorage[page.url()];
          if (originData) {
            await page.evaluate((data: Record<string, string>) => {
              for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, value);
              }
            }, originData);
          }
        } finally {
          await client.detach();
        }
      }),
    );
  }

  static deleteCache(id: string): boolean {
    return BrowserContextCacheManager.cacheStore.delete(id);
  }
}

/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import {LazyArg} from 'puppeteer-core/internal/common/LazyArg.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('PuppeteerUtil tests', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    const world = page.mainFrame().isolatedRealm();
    const value = await world.evaluate(
      PuppeteerUtil => {
        return typeof PuppeteerUtil === 'object';
      },
      LazyArg.create(context => {
        return context.puppeteerUtil;
      }),
    );
    expect(value).toBeTruthy();
  });

  for (const kind of ['mutation', 'raf', 'interval'] as const) {
    it(`should not start a stopped ${kind} poller`, async () => {
      const {page} = await getTestState();
      const calls = await page
        .mainFrame()
        .isolatedRealm()
        .evaluate(
          async ({MutationPoller, RAFPoller, IntervalPoller}, kind) => {
            let calls = 0;
            const predicate = async () => {
              ++calls;
              return false;
            };
            const createPoller = () => {
              switch (kind) {
                case 'mutation':
                  return new MutationPoller(predicate, document);
                case 'raf':
                  return new RAFPoller(predicate);
                case 'interval':
                  return new IntervalPoller(predicate, 1);
              }
            };
            const poller = createPoller();
            await poller.stop();
            await poller.start();
            return calls;
          },
          LazyArg.create(context => {
            return context.puppeteerUtil;
          }),
          kind,
        );
      expect(calls).toBe(0);
    });

    it(`should not restart a stopped ${kind} poller after its first predicate await`, async () => {
      const {page} = await getTestState();
      const calls = await page
        .mainFrame()
        .isolatedRealm()
        .evaluate(
          async (
            {Deferred, MutationPoller, RAFPoller, IntervalPoller},
            kind,
          ) => {
            const pending = Deferred.create<boolean>();
            let calls = 0;
            const predicate = async () => {
              ++calls;
              return await pending.valueOrThrow();
            };
            const createPoller = () => {
              switch (kind) {
                case 'mutation':
                  return new MutationPoller(predicate, document);
                case 'raf':
                  return new RAFPoller(predicate);
                case 'interval':
                  return new IntervalPoller(predicate, 1);
              }
            };
            const poller = createPoller();
            const starting = poller.start();
            const result = poller.result().catch(() => {
              // Stopping the poller rejects its pending result.
            });
            await poller.stop();
            pending.resolve(false);
            await starting;
            await result;
            document.body.append(document.createElement('div'));
            await new Promise(resolve => {
              setTimeout(resolve, 50);
            });
            // Also clean up if the regression recreates a polling resource.
            await poller.stop();
            return calls;
          },
          LazyArg.create(context => {
            return context.puppeteerUtil;
          }),
          kind,
        );
      expect(calls).toBe(1);
    });
  }

  describe('createFunction tests', function () {
    it('should work', async () => {
      const {page} = await getTestState();

      const world = page.mainFrame().isolatedRealm();
      const value = await world.evaluate(
        ({createFunction}, fnString) => {
          return createFunction(fnString)(4);
        },
        LazyArg.create(context => {
          return context.puppeteerUtil;
        }),
        (() => {
          return 4;
        }).toString(),
      );
      expect(value).toBe(4);
    });
  });
});

/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {html} from '../utils.js';

describe('CDP binding handle disposal', () => {
  setupTestBrowserHooks();

  for (const queryAll of [false, true]) {
    it(`should release temporary handles after query${queryAll ? 'All' : 'One'}`, async () => {
      const {page} = await getTestState();
      const client = await page.createCDPSession();
      using prototype = await page.evaluateHandle(() => {
        return HTMLButtonElement.prototype;
      });
      const countButtons = async () => {
        await client.send('HeapProfiler.collectGarbage');
        await using objects = await page.queryObjects(prototype);
        return await objects.evaluate(objects => {
          return objects.length;
        });
      };
      await page.setContent(
        html`<div><button>Submit</button><button>Submit</button></div>`,
      );
      if (queryAll) {
        const buttons = await page.$$('div ::-p-aria(Submit)');
        expect(buttons).toHaveLength(2);
        await Promise.all(
          buttons.map(async button => {
            await expect(
              button.evaluate(button => {
                return button.textContent;
              }),
            ).resolves.toBe('Submit');
            await button.dispose();
          }),
        );
      } else {
        using button = await page.waitForSelector('aria/Submit');
        expect(button).not.toBeNull();
        await expect(
          button!.evaluate(button => {
            return button.textContent;
          }),
        ).resolves.toBe('Submit');
        await button!.dispose();
      }
      await page.evaluate(() => {
        document.body.replaceChildren();
      });
      // Replace the last evaluated result in the utility world before collecting.
      await page
        .mainFrame()
        .isolatedRealm()
        .evaluate(() => {
          return 0;
        });
      // Protocol wrappers can require several garbage collection rounds.
      let count = await countButtons();
      for (let i = 0; count !== 0 && i < 4; i++) {
        count = await countButtons();
      }
      expect(count).toBe(0);
    });
  }

  for (const outcome of ['resolve', 'error', 'value']) {
    const description =
      outcome === 'resolve'
        ? 'resolve'
        : outcome === 'error'
          ? 'reject with an Error'
          : 'reject with a value';
    it(`should preserve node arguments when exposed functions ${description}`, async () => {
      const {page} = await getTestState();
      const receivedNodes: ElementHandle[] = [];
      await page.exposeFunction('inspectNode', async (node: ElementHandle) => {
        receivedNodes.push(node);
        await expect(
          node.evaluate(node => {
            return node.nodeName;
          }),
        ).resolves.toBe('BODY');
        if (outcome === 'error') {
          throw new Error('failed');
        }
        if (outcome === 'value') {
          throw 'failed';
        }
        return 'success';
      });
      const result = await page.evaluate(async () => {
        try {
          return await (globalThis as any).inspectNode(document.body);
        } catch (error) {
          return error instanceof Error ? error.message : error;
        }
      });
      expect(result).toBe(outcome === 'resolve' ? 'success' : 'failed');
      // Wait for the binding to finish its response round trip.
      await page.evaluate(() => {});
      expect(receivedNodes).toHaveLength(1);
      await using node = receivedNodes[0]!;
      expect(node.disposed).toBe(false);
      await expect(
        node.evaluate(node => {
          return node.nodeName;
        }),
      ).resolves.toBe('BODY');
    });
  }

  it('should preserve node arguments returned by exposed functions', async () => {
    const {page} = await getTestState();
    const receivedNodes: ElementHandle[] = [];
    await page.exposeFunction('echoNode', async (node: ElementHandle) => {
      receivedNodes.push(node);
      await node.evaluate(node => {
        return node.nodeName;
      });
      return node;
    });
    await expect(
      page.evaluate(async () => {
        return (
          (await (globalThis as any).echoNode(document.body)) === document.body
        );
      }),
    ).resolves.toBe(true);
    await page.evaluate(() => {});
    expect(receivedNodes).toHaveLength(1);
    await using node = receivedNodes[0]!;
    expect(node.disposed).toBe(false);
    await expect(
      node.evaluate(node => {
        return node.nodeName;
      }),
    ).resolves.toBe('BODY');
  });

  it('should preserve handles returned by exposed functions', async () => {
    const {page} = await getTestState();
    using handle = await page.evaluateHandle(() => {
      return {value: 42};
    });
    await page.exposeFunction('getValue', () => {
      return handle;
    });
    for (let i = 0; i < 2; i++) {
      await expect(
        page.evaluate(async () => {
          return (await (globalThis as any).getValue()).value;
        }),
      ).resolves.toBe(42);
      expect(handle.disposed).toBe(false);
    }
  });
});

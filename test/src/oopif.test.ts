/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {assert} from 'chai';
import type {CDPSession} from 'puppeteer-core/internal/api/CDPSession.js';
import {CDPSessionEvent} from 'puppeteer-core/internal/api/CDPSession.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';

import {setupSeparateTestBrowserHooks} from './mocha-utils.js';
import {attachFrame, detachFrame, dumpFrames, navigateFrame} from './utils.js';

describe('OOPIF', function () {
  // We start a new browser instance for this test because we need the
  // --site-per-process flag.
  const state = setupSeparateTestBrowserHooks(
    {
      args: ['--site-per-process'],
    },
    {createContext: true},
  );

  it('should treat OOP iframes and normal iframes the same', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/empty.html');
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);
    await attachFrame(
      page,
      'frame2',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await framePromise;
    assert.lengthOf(page.mainFrame().childFrames(), 2);
  });
  it('should track navigations within OOP iframes', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    const frame = await framePromise;
    assert.include(frame.url(), '/empty.html');
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/assets/frame.html',
    );
    assert.include(frame.url(), '/assets/frame.html');
  });
  it('should support OOP iframes becoming normal iframes again', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    await framePromise;
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    assert.lengthOf(page.frames(), 2);
  });
  it('should support frames within OOP frames', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const frame1Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    const frame2Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 2;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/frames/one-frame.html',
    );

    const [frame1, frame2] = await Promise.all([frame1Promise, frame2Promise]);

    assert.match(
      await frame1.evaluate(() => {
        return document.location.href;
      }),
      /one-frame\.html$/,
    );
    assert.match(
      await frame2.evaluate(() => {
        return document.location.href;
      }),
      /frames\/frame\.html$/,
    );
  });

  it('should recover cross-origin frames on reconnect', async () => {
    const {server, page, puppeteer, browser} = state;

    await page.goto(server.EMPTY_PAGE);
    const frame1Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    const frame2Promise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 2;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/frames/one-frame.html',
    );
    await Promise.all([frame1Promise, frame2Promise]);
    const dump1 = await dumpFrames(page.mainFrame());

    using browserTwo = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
      protocol: browser.protocol,
    });
    const pages = await browserTwo.pages();
    const emptyPages = pages.filter(page => {
      return page.url() === server.EMPTY_PAGE;
    });
    assert.strictEqual(emptyPages.length, 1);
    const dump2 = await dumpFrames(emptyPages[0]!.mainFrame());
    assert.deepEqual(dump1, dump2);
  });

  it('should support OOP iframes getting detached', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    await framePromise;
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await detachFrame(page, 'frame1');
    assert.lengthOf(page.frames(), 1);
  });

  it('should support wait for navigation for transitions from local to OOPIF', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(page, 'frame1', server.EMPTY_PAGE);

    const frame = await framePromise;
    const nav = frame.waitForNavigation();
    await navigateFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    await nav;
    await detachFrame(page, 'frame1');
    assert.lengthOf(page.frames(), 1);
  });

  it('should keep track of a frames OOP state', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    const frame = await framePromise;
    assert.include(frame.url(), '/empty.html');
    await navigateFrame(page, 'frame1', server.EMPTY_PAGE);
    assert.strictEqual(frame.url(), server.EMPTY_PAGE);
  });

  it('should support evaluating in oop iframes', async () => {
    const {server, page} = state;

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    const frame = await framePromise;
    await frame.evaluate(() => {
      (window as any)._test = 'Test 123!';
    });
    const result = await frame.evaluate(() => {
      return (window as any)._test;
    });
    assert.strictEqual(result, 'Test 123!');
  });
  it('should provide access to elements', async () => {
    const {server, isHeadless, headless, page} = state;

    if (!isHeadless || headless === 'true') {
      // TODO: this test is partially blocked on crbug.com/1334119. Enable test once
      // the upstream is fixed.
      // TLDR: when we dispatch events to the frame the compositor might
      // not be up-to-date yet resulting in a misclick (the iframe element
      // becomes the event target instead of the content inside the iframe).
      // The solution is to use InsertVisualCallback on the backend but that causes
      // another issue that events cannot be dispatched to inactive tabs as the
      // visual callback is never invoked.
      // The old headless mode does not have this issue since it operates with
      // special scheduling settings that keep even inactive tabs updating.
      return;
    }

    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );

    const frame = await framePromise;
    await frame.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      button.onclick = () => {
        button.id = 'clicked';
      };
      document.body.appendChild(button);
    });
    await page.evaluate(() => {
      document.body.style.border = '150px solid black';
      document.body.style.margin = '250px';
      document.body.style.padding = '50px';
    });
    await frame.waitForSelector('#test-button', {visible: true});
    await frame.click('#test-button');
    await frame.waitForSelector('#clicked');
  });
  it('should report oopif frames', async () => {
    const {server, page} = state;

    const frame = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    assert.lengthOf(await iframes(page), 1);
    assert.lengthOf(page.frames(), 2);
  });

  it('should wait for inner OOPIFs', async () => {
    const {server, page} = state;
    await page.goto(`http://domain1.test:${server.PORT}/main-frame.html`);
    const frame2 = await page.waitForFrame(frame => {
      return frame.url().endsWith('inner-frame2.html');
    });
    assert.lengthOf(await iframes(page), 2);
    assert.lengthOf(page.frames(), 3);
    assert.strictEqual(
      await frame2.evaluate(() => {
        return document.querySelectorAll('button').length;
      }),
      1,
    );
  });

  it('should load oopif iframes with subresources and request interception', async () => {
    const {server, page} = state;

    const framePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    page.on('request', request => {
      void request.continue();
    });
    await page.setRequestInterception(true);
    const requestPromise = page.waitForRequest(request => {
      return request.url().includes('requestFromOOPIF');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    const frame = await framePromise;
    const request = await requestPromise;
    assert.lengthOf(await iframes(page), 1);
    assert.strictEqual(request.frame(), frame);
  });

  it('should support frames within OOP iframes', async () => {
    const {server, page} = state;

    const oopIframePromise = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    const oopIframe = await oopIframePromise;
    await attachFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );

    const frame1 = oopIframe.childFrames()[0]!;
    assert.match(frame1.url(), /empty.html$/);
    await navigateFrame(
      oopIframe,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/oopif.html',
    );
    assert.match(frame1.url(), /oopif.html$/);
    await frame1.goto(
      server.CROSS_PROCESS_PREFIX + '/oopif.html#navigate-within-document',
      {waitUntil: 'load'},
    );
    assert.match(frame1.url(), /oopif.html#navigate-within-document$/);
    await detachFrame(oopIframe, 'frame1');
    assert.lengthOf(oopIframe.childFrames(), 0);
  });

  it('clickablePoint, boundingBox, boxModel should work for elements inside OOPIFs', async () => {
    const {server, page} = state;
    await page.goto(server.EMPTY_PAGE);
    const framePromise = page.waitForFrame(frame => {
      return page.frames().indexOf(frame) === 1;
    });
    await attachFrame(
      page,
      'frame1',
      server.CROSS_PROCESS_PREFIX + '/empty.html',
    );
    const frame = await framePromise;
    await page.evaluate(() => {
      document.body.style.border = '50px solid black';
      document.body.style.margin = '50px';
      document.body.style.padding = '50px';
    });
    await frame.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.innerText = 'click';
      document.body.appendChild(button);
    });
    using button = (await frame.waitForSelector('#test-button', {
      visible: true,
    }))!;
    const result = await button.clickablePoint();
    assert.isAbove(result.x, 150); // padding + margin + border left
    assert.isAbove(result.y, 150); // padding + margin + border top
    const resultBoxModel = (await button.boxModel())!;
    for (const quad of [
      resultBoxModel.content,
      resultBoxModel.border,
      resultBoxModel.margin,
      resultBoxModel.padding,
    ]) {
      for (const part of quad) {
        assert.isAbove(part.x, 150); // padding + margin + border left
        assert.isAbove(part.y, 150); // padding + margin + border top
      }
    }
    const resultBoundingBox = (await button.boundingBox())!;
    assert.isAbove(resultBoundingBox.x, 150); // padding + margin + border left
    assert.isAbove(resultBoundingBox.y, 150); // padding + margin + border top
  });

  it('should detect existing OOPIFs when Puppeteer connects to an existing page', async () => {
    const {server, puppeteer, browser, page} = state;

    const frame = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    assert.lengthOf(await iframes(page), 1);
    assert.lengthOf(page.frames(), 2);

    using browser1 = await puppeteer.connect({
      browserWSEndpoint: browser.wsEndpoint(),
    });
    const target = await browser1.waitForTarget(target => {
      return target.url().endsWith('dynamic-oopif.html');
    });
    await target.page();
    await browser1.disconnect();
  });

  it('should support lazy OOP frames', async () => {
    const {server, page} = state;

    await page.goto(server.PREFIX + '/lazy-oopif-frame.html');
    await page.setViewport({width: 1000, height: 1000});

    assert.deepEqual(
      page.frames().map(frame => {
        return frame._hasStartedLoading;
      }),
      [true, true, false],
    );
  });

  it('should exposeFunction on a page with a PDF viewer', async () => {
    const {page, server} = state;

    await page.goto(server.PREFIX + '/pdf-viewer.html', {
      waitUntil: 'networkidle2',
    });

    await page.exposeFunction('test', () => {
      console.log('test');
    });
  });

  it('should exposeFunction when an OOP iframe goes away mid-call', async () => {
    const {page, server} = state;
    const frameCount = 8;

    await page.goto(server.EMPTY_PAGE);
    for (let i = 0; i < frameCount; i++) {
      await attachFrame(
        page,
        `oopif${i}`,
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );
    }
    assert.lengthOf(page.frames(), frameCount + 1);

    // Start the teardown first so it lands while the per-frame calls run.
    const detached = page.evaluate(() => {
      for (const frame of document.querySelectorAll('iframe')) {
        frame.remove();
      }
    });
    const exposed = page.exposeFunction('doubleIt', (value: number) => {
      return value * 2;
    });
    await exposed;
    await detached;

    assert.strictEqual(
      await page.evaluate(() => {
        return (window as any).doubleIt(21);
      }),
      42,
    );
  });

  it('should evaluate on a page with a PDF viewer', async () => {
    const {page, server} = state;

    await page.goto(server.PREFIX + '/pdf-viewer.html', {
      waitUntil: 'networkidle2',
    });

    assert.deepEqual(
      await Promise.all(
        page.frames().map(async frame => {
          return await frame.evaluate(() => {
            return window.location.pathname;
          });
        }),
      ),
      ['/pdf-viewer.html', '/sample.pdf', '/index.html', '/sample.pdf'],
    );
  });

  it('should support evaluateOnNewDocument', async () => {
    const {page, server} = state;

    await page.evaluateOnNewDocument(() => {
      (window as any).evaluateOnNewDocument = true;
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    assert.lengthOf(page.frames(), 2);
    for (const frame of page.frames()) {
      assert.isTrue(
        await frame.evaluate(() => {
          return (window as any).evaluateOnNewDocument;
        }),
      );
    }
  });

  it('should support removing evaluateOnNewDocument scripts', async () => {
    const {page, server} = state;

    const {identifier} = await page.evaluateOnNewDocument(() => {
      (window as any).evaluateOnNewDocument = true;
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    assert.lengthOf(page.frames(), 2);
    for (const frame of page.frames()) {
      assert.isTrue(
        await frame.evaluate(() => {
          return (window as any).evaluateOnNewDocument;
        }),
      );
    }
    await page.removeScriptToEvaluateOnNewDocument(identifier);
    await page.reload();
    await page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
  });

  it('should support exposeFunction', async () => {
    const {page, server} = state;

    let count = 0;
    await page.exposeFunction('plusOne', async () => {
      count++;
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    assert.lengthOf(page.frames(), 2);
    for (const frame of page.frames()) {
      await frame.evaluate(async () => {
        // @ts-expect-error different context
        return window.plusOne();
      });
    }
    assert.strictEqual(count, 2);
  });

  it('should support removing exposed function', async () => {
    const {page, server} = state;
    await page.exposeFunction('plusOne', () => {});
    const frame = page.waitForFrame(frame => {
      return frame.url().endsWith('/oopif.html');
    });
    await page.goto(server.PREFIX + '/dynamic-oopif.html');
    await frame;
    assert.lengthOf(page.frames(), 2);
    await page.removeExposedFunction('plusOne');
    for (const frame of page.frames()) {
      assert.isFalse(
        await frame.evaluate(() => {
          // @ts-expect-error different context
          return !!window['plusOne'];
        }),
      );
    }
  });

  describe('waitForFrame', () => {
    it('should resolve immediately if the frame already exists', async () => {
      const {server, page} = state;

      await page.goto(server.EMPTY_PAGE);
      await attachFrame(
        page,
        'frame2',
        server.CROSS_PROCESS_PREFIX + '/empty.html',
      );

      await page.waitForFrame(frame => {
        return frame.url().endsWith('/empty.html');
      });
    });
  });

  it('should report google.com frame', async () => {
    const {server, page} = state;
    await page.goto(server.EMPTY_PAGE);
    await page.setRequestInterception(true);
    page.on('request', r => {
      return r.respond({body: 'YO, GOOGLE.COM'});
    });
    await page.evaluate(() => {
      const frame = document.createElement('iframe');
      frame.setAttribute('src', 'https://google.com/');
      document.body.appendChild(frame);
      return new Promise(x => {
        return (frame.onload = x);
      });
    });
    await page.waitForSelector('iframe[src="https://google.com/"]');
    const urls = page
      .frames()
      .map(frame => {
        return frame.url();
      })
      .sort();
    assert.deepEqual(urls, [server.EMPTY_PAGE, 'https://google.com/']);
  });

  it('should expose events within OOPIFs', async () => {
    const {server, page} = state;

    // Setup our session listeners to observe OOPIF activity.
    const session = await page.createCDPSession();
    const networkEvents: string[] = [];
    const otherSessions: CDPSession[] = [];
    await session.send('Target.setAutoAttach', {
      autoAttach: true,
      flatten: true,
      waitForDebuggerOnStart: true,
    });
    session.on(CDPSessionEvent.SessionAttached, async session => {
      otherSessions.push(session);

      session.on('Network.requestWillBeSent', params => {
        return networkEvents.push(params.request.url);
      });
      await session.send('Network.enable');
      await session.send('Runtime.runIfWaitingForDebugger');
    });

    // Navigate to the empty page and add an OOPIF iframe with at least one request.
    await page.goto(server.EMPTY_PAGE);
    await page.evaluate(
      (frameUrl: string) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('src', frameUrl);
        document.body.appendChild(frame);
        return new Promise((x, y) => {
          frame.onload = x;
          frame.onerror = y;
        });
      },
      server.PREFIX.replace('localhost', 'domain1.test') + '/one-style.html',
    );
    await page.waitForSelector('iframe');

    // Ensure we found the iframe session.
    assert.lengthOf(otherSessions, 1);

    // Resume the iframe and trigger another request.
    const iframeSession = otherSessions[0]!;
    await iframeSession.send('Runtime.evaluate', {
      expression: `fetch('/fetch')`,
      awaitPromise: true,
    });

    assert.include(networkEvents, `http://domain1.test:${server.PORT}/fetch`);
  });

  it('should retrieve body for OOPIF document requests', async () => {
    const {server, page} = state;

    const frameUrl =
      server.PREFIX.replace('localhost', 'domain1.test') +
      '/oopif-response.html';

    let testResponse = null;

    page.on('response', async response => {
      if (response.request().url() === frameUrl) {
        testResponse = response;
      }
    });

    // Navigate to the empty page and add an OOPIF iframe.
    await page.goto(server.EMPTY_PAGE);
    await page.evaluate((frameUrl: string) => {
      const frame = document.createElement('iframe');
      frame.setAttribute('src', frameUrl);
      document.body.appendChild(frame);
      return new Promise((x, y) => {
        frame.onload = x;
        frame.onerror = y;
      });
    }, frameUrl);
    await page.waitForSelector('iframe');

    assert.include(await testResponse!.text(), "I'm an OOPIF");
  });
});

async function iframes(page: Page) {
  const iframes = await Promise.all(
    page.frames().map(async frame => {
      return await frame.frameElement();
    }),
  );
  return iframes.filter(frame => {
    return frame !== null;
  });
}

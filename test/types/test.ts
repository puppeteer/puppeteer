import * as puppeteer from "puppeteer";
import { TimeoutError } from "puppeteer/Errors";
import * as Devices from "puppeteer/DeviceDescriptors";

// Accessibility

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const snap = await page.accessibility.snapshot({
    interestingOnly: true,
    root: undefined,
  });
  for (const child of snap!.children!) {
    console.log(child.name);
  }
});

// Basic nagivation
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://example.com", {
    referer: 'http://google.com',
  });
  await page.screenshot({ path: "example.png" });

  browser.close();
})();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(100000);
  await page.goto("https://news.ycombinator.com", { waitUntil: "networkidle0" });
  await page.pdf({ path: "hn.pdf", format: "A4" });

  const frame = page.frames()[0];
  await frame.goto('/');

  browser.close();
})();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://example.com");

  // Get the "viewport" of the page, as reported by the page.
  const dimensions = await page.evaluate(() => {
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });

  console.log("Dimensions:", dimensions);

  browser.close();
})();

// The following examples are taken from the docs itself
puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on("console", (...args: any[]) => {
    for (let i = 0; i < args.length; ++i) console.log(`${i}: ${args[i]}`);
  });
  page.evaluate(() => console.log(5, "hello", { foo: "bar" }));

  const result = await page.evaluate(() => {
    return Promise.resolve(8 * 7);
  });
  console.log(await page.evaluate("1 + 2"));

  const bodyHandle = await page.$("body");

  // Typings for this are really difficult since they depend on internal state
  // of the page class.
  const html = await page.evaluate(
    (body: HTMLElement) => body.innerHTML,
    bodyHandle
  );
});

import * as crypto from "crypto";
import * as fs from "fs";

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  page.on("console", console.log);
  await page.exposeFunction("md5", (text: string) =>
    crypto
      .createHash("md5")
      .update(text)
      .digest("hex")
  );
  await page.evaluate(async () => {
    // use window.md5 to compute hashes
    const myString = "PUPPETEER";
    const myHash = await (window as any).md5(myString);
    console.log(`md5 of ${myString} is ${myHash}`);
  });
  browser.close();

  page.on("console", console.log);
  await page.exposeFunction("readfile", async (filePath: string) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (err, text) => {
        if (err) reject(err);
        else resolve(text);
      });
    });
  });
  await page.evaluate(async () => {
    // use window.readfile to read contents of a file
    const content = await (window as any).readfile("/etc/hosts");
    console.log(content);
  });

  Devices.forEach(device => console.log(device.name));
  puppeteer.devices.forEach(device => console.log(device.name));

  await page.emulateMediaType("screen");
  await page.emulate(Devices['test']);
  await page.emulate(puppeteer.devices['test']);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.pdf({ path: "page.pdf" });

  await page.setRequestInterception(true);
  page.on("request", interceptedRequest => {
    if (
      interceptedRequest.url().endsWith(".png") ||
      interceptedRequest.url().endsWith(".jpg")
    )
      interceptedRequest.abort();
    else interceptedRequest.continue({
      headers: {
        dope: 'yes',
      }
    });
  });

  page.keyboard.type("Hello"); // Types instantly
  page.keyboard.type("World", { delay: 100 }); // Types slower, like a user

  const watchDog = page.waitForFunction("window.innerWidth < 100");
  page.setViewport({ width: 50, height: 50 });
  await watchDog;

  let currentURL: string;

  page
    .waitForSelector("img", { visible: true })
    .then(() => console.log("First URL with image by selector: " + currentURL));

  page
    .waitForXPath("//img", { visible: true })
    .then(() => console.log("First URL with image by xpath: " + currentURL));

  for (currentURL of [
    "https://example.com",
    "https://google.com",
    "https://bbc.com"
  ]) {
    await page.goto(currentURL);
  }

  page.keyboard.type("Hello World!");
  page.keyboard.press("ArrowLeft");

  page.keyboard.down("Shift");
  for (let i = 0; i < " World".length; i++) {
    page.keyboard.press("ArrowLeft");
  }
  page.keyboard.up("Shift");
  page.keyboard.press("Backspace");
  page.keyboard.sendCharacter("嗨");

  await page.tracing.start({ path: "trace.json" });
  await page.goto("https://www.google.com");
  await page.tracing.stop();

  page.on("dialog", async dialog => {
    console.log(dialog.message());
    await dialog.dismiss();
    browser.close();
  });

  const inputElement = (await page.$("input[type=submit]"))!;
  await inputElement.click();
});

// Example with launch options
(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    defaultViewport: { width: 800, height: 600 },
    handleSIGINT: true,
    handleSIGHUP: true,
    handleSIGTERM: true,
  });
  const page = await browser.newPage();
  await page.goto("https://example.com");
  await page.screenshot({ path: "example.png" });

  browser.close();
})();

// Launching with default viewport disabled
(async () => {
  await puppeteer.launch({
    defaultViewport: null
  });
})();

// Test v0.12 features
(async () => {
  const browser = await puppeteer.launch({
    devtools: true,
    env: {
      JEST_TEST: true
    }
  });
  const page = await browser.newPage();
  const button = (await page.$("#myButton"))!;
  const div = (await page.$("#myDiv"))!;
  const input = (await page.$("#myInput"))!;

  if (!button)
    throw new Error('Unable to select myButton');

  if (!input)
    throw new Error('Unable to select myInput');

  await page.addStyleTag({
    url: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
  });

  console.log(page.url());

  page.type("#myInput", "Hello World!");

  page.on("console", (event: puppeteer.ConsoleMessage, ...args: any[]) => {
    console.log(event.text(), event.type(), event.location());
    for (let i = 0; i < args.length; ++i) console.log(`${i}: ${args[i]}`);
  });

  await button.focus();
  await button.press("Enter");
  const screenshotOpts: puppeteer.BinaryScreenShotOptions = {
    type: "jpeg",
    omitBackground: true,
    clip: {
      x: 0,
      y: 0,
      width: 200,
      height: 100
    }
  };
  await button.screenshot(screenshotOpts);
  console.log(button.toString());
  input.type("Hello World", { delay: 10 });

  const buttonText = await (await button.getProperty('textContent'))!.jsonValue();

  await page.deleteCookie(...await page.cookies());

  const metrics = await page.metrics();
  console.log(metrics.Documents, metrics.Frames, metrics.JSEventListeners);
  page.on('metrics', data => {
    const title: string = data.title;
    const metrics: puppeteer.Metrics = data.metrics;
  });

  const navResponse = await page.waitForNavigation({
    timeout: 1000
  });
  console.log(navResponse.ok(), navResponse.status(), navResponse.url(), navResponse.headers()['Content-Type']);

  // evaluate example
  const bodyHandle = (await page.$('body'))!;
  const html = await page.evaluate(body => body.innerHTML, bodyHandle);
  await bodyHandle.dispose();

  // getProperties example
  const handle = await page.evaluateHandle(() => ({ window, document }));
  const properties = await handle.getProperties();
  const windowHandle = properties.get('window');
  const documentHandle = properties.get('document');
  await handle.dispose();

  // queryObjects example
  // Create a Map object
  await page.evaluate(() => (window as any).map = new Map());
  // Get a handle to the Map object prototype
  const mapPrototype = await page.evaluateHandle(() => Map.prototype);
  // Query all map instances into an array
  const mapInstances = await page.queryObjects(mapPrototype);
  // Count amount of map objects in heap
  const count = await page.evaluate(maps => maps.length, mapInstances);
  await mapInstances.dispose();
  await mapPrototype.dispose();

  // evaluateHandle example
  const aHandle = await page.evaluateHandle(() => document.body);
  await page.evaluateHandle('document.body');
  const resultHandle = await page.evaluateHandle(body => body.innerHTML, aHandle);
  console.log(await resultHandle.jsonValue());
  await resultHandle.dispose();

  browser.close();
})();

// test $eval and $$eval
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://example.com");
  const elementText = await page.$eval(
    '#someElement',
    (
      element, // $ExpectType Element
    ) => {
      element.innerHTML; // $ExpectType string
      return element.innerHTML;
    }
  );
  elementText; // $ExpectType string

  // If one returns a DOM reference, puppeteer will wrap an ElementHandle instead
  const someElement = await page.$$eval(
    '.someClassName',
    (
      elements, // $ExpectType Element[]
    ) => {
      console.log(elements.length);
      console.log(elements[0].outerHTML);
      return elements[3] as HTMLDivElement;
    }
  );
  someElement; // $ExpectType ElementHandle<HTMLDivElement>

  // If one passes an ElementHandle, puppeteer will unwrap its DOM reference instead
  await page.$eval('.hello-world', (e, x1) => (x1 as any).noWrap, someElement);

  browser.close();
})();

// Test request API
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const handler = async (r: puppeteer.Request) => {
    const failure = r.failure();

    console.log(r.headers().Test);

    const response = r.response();
    if (!response) {
      return;
    }
    const text: string = response.statusText();
    const ip: string | undefined = response.remoteAddress().ip;
    const data = (await response.json()) as string;
    const randomHeader = response.headers().Test;

    if (failure == null) {
      console.error("Request completed successfully");
      return;
    }

    console.log("Request failed", failure.errorText.toUpperCase());
  };
  page.on('requestfinished', handler);
  page.on('requestfailed', handler);
})();

// Test 1.0 features
(async () => {
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: true,
  });
  const page = await browser.newPage();
  const args: string[] = puppeteer.defaultArgs();

  await page.pdf({
    headerTemplate: 'header',
    footerTemplate: 'footer',
  });

  await page.coverage.startCSSCoverage();
  await page.coverage.startJSCoverage();
  let cov = await page.coverage.stopCSSCoverage();
  cov = await page.coverage.stopJSCoverage();
  const text: string = cov[0].text;
  const url: string = cov[0].url;
  const firstRange: number = cov[0].ranges[0].end - cov[0].ranges[0].start;

  let [handle]: puppeteer.ElementHandle[] = await page.$x('expression');
  ([handle] = await page.mainFrame().$x('expression'));
  ([handle] = await handle.$x('expression'));

  const target = page.target();
  const session = await target.createCDPSession();
  await session.send('Animation.setPaused', {animations: [], paused: false});
  await session.detach();

  await page.tracing.start({ path: "trace.json", categories: ["one", "two"] });
});

// 1.5: From the BrowserContext example
(async () => {
  const browser = await puppeteer.launch();
  // Create a new incognito browser context
  const context = await browser.createIncognitoBrowserContext();
  // Create a new page inside context.
  const page = await context.newPage();
  // ... do stuff with page ...
  await page.goto('https://example.com');
  // Dispose context once it's no longer needed.
  await context.close();
});

// 1.5: From the Worker example
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('workercreated', worker => console.log('Worker created: ' + worker.url()));
  page.on('workerdestroyed', worker => console.log('Worker destroyed: ' + worker.url()));

  console.log('Current workers:');
  for (const worker of page.workers())
    console.log('  ' + worker.url());
});

// Test conditional types
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const eh = await page.$('tr.something') as puppeteer.ElementHandle<HTMLTableRowElement>;
  const index = await page.$eval(
    '.demo',
    (
      e, // $ExpectType Element
      x1, // $ExpectType HTMLTableRowElement
    ) => x1.rowIndex,
    eh,
  );
  index; // $ExpectType number
});

// Test screenshot with an encoding option
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://example.com");
  const base64string: string = await page.screenshot({ encoding: "base64" });
  const buffer: Buffer = await page.screenshot({ encoding: "binary" });
  const screenshotOptions: puppeteer.ScreenshotOptions = {
    fullPage: true,
  };
  const stringOrBuffer: string | Buffer = await page.screenshot(screenshotOptions);

  browser.close();
})();

// Test waitFor
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.waitFor(1000); // $ExpectType void
  const el: puppeteer.ElementHandle = await page.waitFor('selector');
  const nullableEl: puppeteer.ElementHandle | null = await page.waitFor('selector', {
    hidden: true,
  });
  const el2: puppeteer.ElementHandle = await page.waitFor('selector', {
      timeout: 123,
  });
  await page.waitFor(() => !!document.querySelector('.foo'), {
    hidden: true,
  });
  await page.waitFor((stuff: string) => !!document.querySelector(stuff), {
    hidden: true,
  }, 'asd');

  const frame: puppeteer.Frame = page.frames()[0];
  await frame.waitFor((stuff: string) => !!document.querySelector(stuff), {
    hidden: true,
  }, 'asd');
})();

// Permission tests
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions('https://example.com', ['accelerometer']);
  await ctx.clearPermissionOverrides();
});

// Geoloc
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setGeolocation({
    accuracy: 10,
    latitude: 0,
    longitude: 0,
  });
});

// Errors
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.waitFor('test');
  } catch (err) {
    console.log(err instanceof TimeoutError);
  }
});

// domcontentloaded page event test
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('domcontentloaded', async () => {
    page.evaluate(() => {
      console.log('dom changed');
    });
  });
});

// evaluates return type of inner function
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const s = await page.evaluate(() => document.body.innerHTML);
  console.log('body html has length', s.length);
});

// even through a double promise.
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const s = await page.evaluate(() => Promise.resolve(document.body.innerHTML));
  console.log('body html has length', s.length);
});

// JSHandle.jsonValue produces compatible type
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const s = await page
    .waitForFunction(
      (searchStrs: string[]) => searchStrs.find(v => document.body.innerText.includes(v)),
      { timeout: 2000 },
      ['once', 'upon', 'a', 'midnight', 'dreary'])
    .then(j => j.jsonValue());
  console.log('found in page', (s as string).toLowerCase());
});

// Element access
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const el = await page.$('input');
  const val: string = await (await el!.getProperty('type'))!.jsonValue() as string;
});

// Request manipualtion
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    a: '1'
  });
});

// ElementHandles are well-typed
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const link: puppeteer.JSHandle = await page.evaluateHandle(
    () => document.body.querySelector('a')
  );
  const linkEl: puppeteer.ElementHandle | null = link.asElement();
  if (linkEl !== null) {
    const href = await page.evaluate(
      (el: HTMLElement): string | null => el.getAttribute('href'),
      linkEl);
    console.log('href is', href);
  }
});

// test $$eval return type
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const paragraphContents: string[] = await page.$$eval(
    'p', (ps: Element[]): string[] => ps.map(p => p.textContent || ''));
  console.log('pgraph contents', paragraphContents);
});

// JSHandle of non-serializable works
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const reHandle: puppeteer.JSHandle = await page.evaluateHandle(
    () => /\s*bananas?\s*/i,
  );
  const numMatchingEls: number = await page.$$eval(
    'p', (els: Element[], re: RegExp) =>
      els.filter(el => el.textContent && re.test(el.textContent)).length,
      reHandle
  );
  console.log('there are', numMatchingEls, 'banana paragaphs');
});

(async () => {
  const rev = '630727';
  const defaultFetcher = puppeteer.createBrowserFetcher();
  const options: puppeteer.FetcherOptions = {
    host: 'https://storage.googleapis.com',
    path: '/tmp/.local-chromium',
    platform: 'linux',
  };
  const browserFetcher = puppeteer.createBrowserFetcher(options);
  const canDownload = await browserFetcher.canDownload(rev);
  if (canDownload) {
      const revisionInfo = await browserFetcher.download(rev);
      const localRevisions = await browserFetcher.localRevisions();
      const browser = await puppeteer.launch({executablePath: revisionInfo.executablePath});
      browser.close();
      if (localRevisions.includes(rev)) {
        await browserFetcher.remove(rev);
      }
      await browserFetcher.download(rev, (download, total) => {
        console.log('downloadBytes:', download, 'totalBytes:', total);
      });
      await browserFetcher.remove(rev);
    }
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const url = page.workers()[0].url();
  if (page.target().type() === 'shared_worker') {
      const a: number = await (await page.target().worker())!.evaluate(() => 1);
  }
});

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const fileChooser = await page.waitForFileChooser({ timeout: 999 });
  await fileChooser.cancel();
  const isMultiple: boolean = fileChooser.isMultiple();
  await fileChooser.accept(['/foo/bar']);
});

// .evaluate and .evaluateHandle on ElementHandle and JSHandle, and elementHandle.select
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const elementHandle = (await page.$('.something')) as puppeteer.ElementHandle<HTMLDivElement>;
  elementHandle.evaluate(element => {
    element; // $ExpectType HTMLDivElement
  });
  elementHandle.evaluateHandle(element => {
    element; // $ExpectType HTMLDivElement
  });

  const jsHandle = await page.evaluateHandle(() => 'something');
  jsHandle.evaluate(obj => {});
  jsHandle.evaluateHandle(handle => {});

  const selected: string[] = await elementHandle.select('a', 'b', 'c');
})();

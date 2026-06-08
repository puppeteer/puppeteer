import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    headless: true
  });
  const page = await browser.newPage();

  const result = await page.evaluate(() => {
    const obj = {};
    for (let i = 0; i < 10000; i++) {
      obj[`prop${i}`] = i;
    }

    const descriptors = Object.getOwnPropertyDescriptors(obj);

    function testOriginal() {
      const enumerableProperties = [];
      for (const propertyName of Object.keys(descriptors)) {
        if (descriptors[propertyName]?.enumerable) {
          enumerableProperties.push(propertyName);
        }
      }
      return enumerableProperties;
    }

    function testSimpleKeys() {
      // Just Object.keys(obj) ?
      // Wait, getProperties historically returned string properties. Object.keys() returns only enumerable own string-keyed properties.
      // Let's check what Original does:
      // descriptors = Object.getOwnPropertyDescriptors(object) -> returns own properties (string and symbol keys, enumerable and non-enumerable)
      // Object.keys(descriptors) -> returns enumerable own string keys of the descriptors object itself. The keys of `descriptors` are the string keys (and Symbol keys?) of `object`.
      // WAIT, Object.keys(descriptors) returns string keys of descriptors, which are the string keys of the original object (own properties).
      // What about symbols? `for...in` on `descriptors` does NOT iterate over Symbol keys.
      // So the original code (`for (const propertyName in descriptors)`) only iterated string keys.
      // Therefore, the original code collected: Own String Properties that are enumerable.
      // `Object.keys(object)` returns an array of a given object's own enumerable string-keyed property names.
      // Is `Object.keys(object)` exactly equivalent?
      return Object.keys(obj);
    }

    function runBenchmark(name, fn) {
      // Warmup
      for (let i = 0; i < 100; i++) {
        fn();
      }

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        fn();
      }
      const end = performance.now();
      return `${name}: ${end - start}ms`;
    }

    return {
      original: runBenchmark('keys on descriptors', testOriginal),
      simpleKeys: runBenchmark('Object.keys(object)', testSimpleKeys)
    };
  });

  console.log(result);
  await browser.close();
}

run().catch(console.error);

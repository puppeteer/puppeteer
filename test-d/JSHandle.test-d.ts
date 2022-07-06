import {expectNotAssignable, expectNotType, expectType} from 'tsd';
import {ElementHandle} from '../lib/esm/puppeteer/common/ElementHandle.js';
import {JSHandle} from '../lib/esm/puppeteer/common/JSHandle.js';

declare const handle: JSHandle;

{
  expectType<unknown>(await handle.evaluate('document'));
  expectType<number>(
    await handle.evaluate(() => {
      return 1;
    })
  );
  expectType<HTMLElement>(
    await handle.evaluate(() => {
      return document.body;
    })
  );
  expectType<string>(
    await handle.evaluate(() => {
      return '';
    })
  );
  expectType<string>(
    await handle.evaluate((value, str) => {
      expectNotAssignable<never>(value);
      expectType<string>(str);
      return '';
    }, '')
  );
}

{
  expectType<JSHandle>(await handle.evaluateHandle('document'));
  expectType<JSHandle<number>>(
    await handle.evaluateHandle(() => {
      return 1;
    })
  );
  expectType<JSHandle<string>>(
    await handle.evaluateHandle(() => {
      return '';
    })
  );
  expectType<JSHandle<string>>(
    await handle.evaluateHandle((value, str) => {
      expectNotAssignable<never>(value);
      expectType<string>(str);
      return '';
    }, '')
  );
  expectType<ElementHandle<HTMLElement>>(
    await handle.evaluateHandle(() => {
      return document.body;
    })
  );
}

declare const handle2: JSHandle<{test: number}>;

{
  {
    expectType<JSHandle<number>>(await handle2.getProperty('test'));
    expectNotType<JSHandle<unknown>>(await handle2.getProperty('test'));
  }
  {
    expectType<JSHandle<unknown>>(
      await handle2.getProperty('key-doesnt-exist')
    );
    expectNotType<JSHandle<string>>(
      await handle2.getProperty('key-doesnt-exist')
    );
    expectNotType<JSHandle<number>>(
      await handle2.getProperty('key-doesnt-exist')
    );
  }
}

{
  handle.evaluate((value, other) => {
    expectType<unknown>(value);
    expectType<{test: number}>(other);
  }, handle2);
}

import {expectNotType, expectType} from 'tsd';
import {ElementHandle} from '../lib/esm/puppeteer/common/ElementHandle.js';

declare const handle: ElementHandle;

{
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(await handle.$('a'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('a'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(await handle.$('div'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('div'));
  }
  {
    expectType<ElementHandle<Element> | null>(await handle.$('some-custom'));
  }
}

{
  {
    expectType<Array<ElementHandle<HTMLAnchorElement>>>(await handle.$$('a'));
    expectNotType<Array<ElementHandle<Element>>>(await handle.$$('a'));
  }
  {
    expectType<Array<ElementHandle<HTMLDivElement>>>(await handle.$$('div'));
    expectNotType<Array<ElementHandle<Element>>>(await handle.$$('div'));
  }
  {
    expectType<Array<ElementHandle<Element>>>(await handle.$$('some-custom'));
  }
}

{
  expectType<void>(
    await handle.$eval(
      'a',
      (element, int) => {
        expectType<HTMLAnchorElement>(element);
        expectType<number>(int);
      },
      1
    )
  );
  expectType<void>(
    await handle.$eval(
      'div',
      (element, int, str) => {
        expectType<HTMLDivElement>(element);
        expectType<number>(int);
        expectType<string>(str);
      },
      1,
      ''
    )
  );
  expectType<number>(
    await handle.$eval(
      'a',
      (element, value) => {
        expectType<HTMLAnchorElement>(element);
        return value;
      },
      1
    )
  );
  expectType<number>(
    await handle.$eval(
      'some-element',
      (element, value) => {
        expectType<Element>(element);
        return value;
      },
      1
    )
  );
  expectType<HTMLAnchorElement>(
    await handle.$eval('a', element => {
      return element;
    })
  );
  expectType<unknown>(await handle.$eval('a', 'document'));
}

{
  expectType<void>(
    await handle.$$eval(
      'a',
      (elements, int) => {
        expectType<HTMLAnchorElement[]>(elements);
        expectType<number>(int);
      },
      1
    )
  );
  expectType<void>(
    await handle.$$eval(
      'div',
      (elements, int, str) => {
        expectType<HTMLDivElement[]>(elements);
        expectType<number>(int);
        expectType<string>(str);
      },
      1,
      ''
    )
  );
  expectType<number>(
    await handle.$$eval(
      'a',
      (elements, value) => {
        expectType<HTMLAnchorElement[]>(elements);
        return value;
      },
      1
    )
  );
  expectType<number>(
    await handle.$$eval(
      'some-element',
      (elements, value) => {
        expectType<Element[]>(elements);
        return value;
      },
      1
    )
  );
  expectType<HTMLAnchorElement[]>(
    await handle.$$eval('a', elements => {
      return elements;
    })
  );
  expectType<unknown>(await handle.$$eval('a', 'document'));
}

{
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.waitForSelector('a')
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.waitForSelector('a')
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.waitForSelector('div')
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.waitForSelector('div')
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.waitForSelector('some-custom')
    );
  }
}

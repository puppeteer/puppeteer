/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {expectNotType, expectType} from 'tsd';

import type {ElementHandle} from 'puppeteer';

declare const handle: ElementHandle;

{
  {
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(await handle.$('a'));
      expectNotType<ElementHandle<Element> | null>(await handle.$('a'));
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('a#id')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('a#id'));
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('a.class')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('a.class'));
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('a[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('a[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('a:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('a:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('a:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('a:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<HTMLDivElement> | null>(await handle.$('div'));
      expectNotType<ElementHandle<Element> | null>(await handle.$('div'));
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div#id')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div#id'));
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div.class')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div.class'));
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(await handle.$('some-custom'));
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('some-custom#id')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('some-custom.class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('some-custom[attr=value]')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('some-custom:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(await handle.$(''));
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$('#id'));
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$('.class'));
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$('[attr=value]'));
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$(':pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$(':func(arg)'));
    }
  }
  {
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div > a'));
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a#id')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a#id')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a.class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a.class')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div > div'));
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div#id')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div#id')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div.class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div.class')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom#id')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom.class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom[attr=value]')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(await handle.$('div > #id'));
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$('div > .class'));
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > [attr=value]')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > :pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > :func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div > a'));
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a#id')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a#id')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a.class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a.class')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLAnchorElement> | null>(
        await handle.$('div > a:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > a:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div')
      );
      expectNotType<ElementHandle<Element> | null>(await handle.$('div > div'));
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div#id')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div#id')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div.class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div.class')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div[attr=value]')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div[attr=value]')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div:psuedo-class')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<HTMLDivElement> | null>(
        await handle.$('div > div:func(arg)')
      );
      expectNotType<ElementHandle<Element> | null>(
        await handle.$('div > div:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom#id')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom.class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom[attr=value]')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom:pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<ElementHandle<Element> | null>(await handle.$('div > #id'));
    }
    {
      expectType<ElementHandle<Element> | null>(await handle.$('div > .class'));
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > [attr=value]')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > :pseudo-class')
      );
    }
    {
      expectType<ElementHandle<Element> | null>(
        await handle.$('div > :func(arg)')
      );
    }
  }
}

{
  {
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(await handle.$$('a'));
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('a'));
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('a#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('a#id'));
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('a.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('a.class'));
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('a[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('a[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('a:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('a:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('a:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('a:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(await handle.$$('div'));
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('div'));
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('div#id'));
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div.class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$('some-custom'));
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('some-custom#id')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('some-custom.class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('some-custom[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('some-custom:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$(''));
    }
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$('#id'));
    }
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$('.class'));
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$(':pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$(':func(arg)'));
    }
  }
  {
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a')
      );
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('div > a'));
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a#id')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a.class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div#id')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div.class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom#id')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom.class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$('div > #id'));
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > .class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > [attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > :pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > :func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a')
      );
      expectNotType<Array<ElementHandle<Element>>>(await handle.$$('div > a'));
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a#id')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a.class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLAnchorElement>>>(
        await handle.$$('div > a:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > a:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div#id')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div#id')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div.class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div.class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div[attr=value]')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div:psuedo-class')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<HTMLDivElement>>>(
        await handle.$$('div > div:func(arg)')
      );
      expectNotType<Array<ElementHandle<Element>>>(
        await handle.$$('div > div:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom#id')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom.class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom[attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom:pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > some-custom:func(arg)')
      );
    }
  }
  {
    {
      expectType<Array<ElementHandle<Element>>>(await handle.$$('div > #id'));
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > .class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > [attr=value]')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > :pseudo-class')
      );
    }
    {
      expectType<Array<ElementHandle<Element>>>(
        await handle.$$('div > :func(arg)')
      );
    }
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

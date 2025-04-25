/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {ElementHandle} from 'puppeteer';
import {expectNotType, expectType} from 'tsd';

declare const handle: ElementHandle;

const test = async () => {
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(await handle.$('a'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('a'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(await handle.$('a#id'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('a#id'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('a.class'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('a.class'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('a[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('a[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('a:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('a:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('a:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('a:func(arg)'));
  }

  {
    expectType<ElementHandle<HTMLDivElement> | null>(await handle.$('div'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('div'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(await handle.$('div#id'));
    expectNotType<ElementHandle<Element> | null>(await handle.$('div#id'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div.class'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div.class'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<Element> | null>(await handle.$('some-custom'));
  }
  {
    expectType<ElementHandle<Element> | null>(await handle.$('some-custom#id'));
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('some-custom.class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('some-custom[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('some-custom:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('some-custom:func(arg)'),
    );
  }

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
    expectType<ElementHandle<Element> | null>(await handle.$(':pseudo-class'));
  }
  {
    expectType<ElementHandle<Element> | null>(await handle.$(':func(arg)'));
  }

  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > a'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a#id'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > a#id'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a.class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a.class'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > div'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div#id'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div#id'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div.class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div.class'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom#id'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom.class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<Element> | null>(await handle.$('div > #id'));
  }
  {
    expectType<ElementHandle<Element> | null>(await handle.$('div > .class'));
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > [attr=value]'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > :pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > :func(arg)'),
    );
  }

  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > a'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a#id'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > a#id'));
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a.class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a.class'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.$('div > a:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > a:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div'),
    );
    expectNotType<ElementHandle<Element> | null>(await handle.$('div > div'));
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div#id'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div#id'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div.class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div.class'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div[attr=value]'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div:psuedo-class'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.$('div > div:func(arg)'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.$('div > div:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom#id'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom.class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom[attr=value]'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom:pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > some-custom:func(arg)'),
    );
  }

  {
    expectType<ElementHandle<Element> | null>(await handle.$('div > #id'));
  }
  {
    expectType<ElementHandle<Element> | null>(await handle.$('div > .class'));
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > [attr=value]'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > :pseudo-class'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.$('div > :func(arg)'),
    );
  }

  {
    expectType<ElementHandle<HTMLAnchorElement> | null>(
      await handle.waitForSelector('a'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.waitForSelector('a'),
    );
  }
  {
    expectType<ElementHandle<HTMLDivElement> | null>(
      await handle.waitForSelector('div'),
    );
    expectNotType<ElementHandle<Element> | null>(
      await handle.waitForSelector('div'),
    );
  }
  {
    expectType<ElementHandle<Element> | null>(
      await handle.waitForSelector('some-custom'),
    );
  }
};
void test();

/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {NodeFor} from 'puppeteer';
import {expectType, expectNotType} from 'tsd';

declare const nodeFor: <Selector extends string>(
  selector: Selector,
) => NodeFor<Selector>;

{
  {
    expectType<HTMLTableRowElement>(
      nodeFor(
        '[data-testid="my-component"] div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div tbody tr',
      ),
    );
    expectNotType<Element>(
      nodeFor(
        '[data-testid="my-component"] div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div div tbody tr',
      ),
    );
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a'));
    expectNotType<Element>(nodeFor('a'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a#ignored'));
    expectNotType<Element>(nodeFor('a#ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a.ignored'));
    expectNotType<Element>(nodeFor('a.ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a[ignored'));
    expectNotType<Element>(nodeFor('a[ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a:ignored'));
    expectNotType<Element>(nodeFor('a:ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored a'));
    expectNotType<Element>(nodeFor('ignored a'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored a#ignored'));
    expectNotType<Element>(nodeFor('ignored a#ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored a.ignored'));
    expectNotType<Element>(nodeFor('ignored a.ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored a[ignored'));
    expectNotType<Element>(nodeFor('ignored a[ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored a:ignored'));
    expectNotType<Element>(nodeFor('ignored a:ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored > a'));
    expectNotType<Element>(nodeFor('ignored > a'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored > a#ignored'));
    expectNotType<Element>(nodeFor('ignored > a#ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored > a.ignored'));
    expectNotType<Element>(nodeFor('ignored > a.ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored > a[ignored'));
    expectNotType<Element>(nodeFor('ignored > a[ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored > a:ignored'));
    expectNotType<Element>(nodeFor('ignored > a:ignored'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored + a'));
    expectNotType<Element>(nodeFor('ignored + a'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored ~ a'));
    expectNotType<Element>(nodeFor('ignored ~ a'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('ignored | a'));
    expectNotType<Element>(nodeFor('ignored | a'));
  }
  {
    expectType<HTMLAnchorElement>(
      nodeFor('ignored ignored > ignored + ignored | a#ignore'),
    );
    expectNotType<Element>(
      nodeFor('ignored ignored > ignored + ignored | a#ignore'),
    );
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('custom-element >>> a'));
    expectNotType<Element>(nodeFor('custom-element >>> a'));
  }
  {
    expectType<Element>(nodeFor('div ::-p-text(world)'));
    expectNotType<HTMLDivElement>(nodeFor('div ::-p-text(world)'));
  }
  {
    expectType<HTMLDivElement>(nodeFor('div ::-p-text(world) >>>> div'));
    expectNotType<Element>(nodeFor('div ::-p-text(world) >>>> div'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a::-p-text(Hello)'));
    expectNotType<Element>(nodeFor('a::-p-text(Hello)'));
  }
  {
    expectType<HTMLAnchorElement>(nodeFor('a:is([href], [href])'));
    expectNotType<Element>(nodeFor('a:is([href], [href])'));
  }
}
{
  {
    expectType<Element>(nodeFor(''));
  }
  {
    expectType<Element>(nodeFor('#ignored'));
  }
  {
    expectType<Element>(nodeFor('.ignored'));
  }
  {
    expectType<Element>(nodeFor('[ignored'));
  }
  {
    expectType<Element>(nodeFor(':ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored #ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored .ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored [ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored :ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored > #ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored > .ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored > [ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored > :ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored + #ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored ~ #ignored'));
  }
  {
    expectType<Element>(nodeFor('ignored | #ignored'));
  }
  {
    expectType<Element>(
      nodeFor('ignored ignored > ignored ~ ignored + ignored | #ignored'),
    );
  }
}

/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  TargetType,
  type Browser,
  type BrowserContext,
  type Page,
  type Target,
  type TargetOptions,
} from 'puppeteer';
import {expectAssignable, expectError, expectType} from 'tsd';

declare const browser: Browser;
declare const context: BrowserContext;
declare const target: Target;

{
  expectType<boolean | undefined>(({} as TargetOptions).includeDiscarded);
  expectAssignable<TargetOptions>({});
  expectAssignable<TargetOptions>({includeDiscarded: true});
  expectError<TargetOptions>({includeDiscarded: 'yes'});
}
{
  expectType<Target[]>(browser.targets());
  expectType<Target[]>(browser.targets({includeDiscarded: true}));
  expectType<Target[]>(context.targets());
  expectType<Target[]>(context.targets({includeDiscarded: true}));
}
{
  expectType<boolean>(target.isDiscarded());
  expectType<Promise<Page | null>>(target.page());
  expectType<TargetType.TAB>(TargetType.TAB);
  expectAssignable<TargetType>(TargetType.TAB);
}

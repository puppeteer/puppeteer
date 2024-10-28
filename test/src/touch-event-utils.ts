/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Page} from 'puppeteer-core/internal/api/Page.js';

export type ReportedTouch = [number, number];
export interface ReportedTouchEvent {
  changed: ReportedTouch[];
  touches: ReportedTouch[];
}
export interface TouchEventReport {
  events: ReportedTouchEvent[];
}

export async function initializeTouchEventReport(
  page: Page,
): Promise<TouchEventReport> {
  const events: ReportedTouchEvent[] = [];
  await page.exposeFunction(
    'reportTouchEvent',
    (event: ReportedTouchEvent): void => {
      events.push(event);
    },
  );
  await page.evaluate(() => {
    document.body.addEventListener('touchstart', reportTouchEvent);
    document.body.addEventListener('touchmove', reportTouchEvent);
    document.body.addEventListener('touchend', reportTouchEvent);
    function reportTouchEvent(e: TouchEvent): void {
      const toReport: ReportedTouchEvent = {
        changed: getReportableTouchList(e.changedTouches),
        touches: getReportableTouchList(e.touches),
      };
      (window as any).reportTouchEvent(toReport);
    }
    function getReportableTouchList(list: TouchList): ReportedTouch[] {
      return [...list].map(t => {
        return [t.pageX, t.pageY];
      });
    }
  });
  return {events};
}

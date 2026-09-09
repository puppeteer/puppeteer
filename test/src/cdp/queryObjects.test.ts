/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('page.queryObjects', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();

    // Create a custom class
    using classHandle = await page.evaluateHandle(() => {
      return class CustomClass {};
    });

    // Create an instance.
    await page.evaluate(CustomClass => {
      // @ts-expect-error: Different context.
      self.customClass = new CustomClass();
    }, classHandle);

    // Validate only one has been added.
    using prototypeHandle = await page.evaluateHandle(CustomClass => {
      return CustomClass.prototype;
    }, classHandle);
    using objectsHandle = await page.queryObjects(prototypeHandle);
    await expect(
      page.evaluate(objects => {
        return objects.length;
      }, objectsHandle),
    ).resolves.toBe(1);

    // Check that instances.
    await expect(
      page.evaluate(objects => {
        // @ts-expect-error: Different context.
        return objects[0] === self.customClass;
      }, objectsHandle),
    ).resolves.toBeTruthy();
  });
  it('should work for non-trivial page', async () => {
    const {page, server} = await getTestState();
    await page.goto(server.EMPTY_PAGE);

    // Create a custom class
    using classHandle = await page.evaluateHandle(() => {
      return class CustomClass {};
    });

    // Create an instance.
    await page.evaluate(CustomClass => {
      // @ts-expect-error: Different context.
      self.customClass = new CustomClass();
    }, classHandle);

    // Validate only one has been added.
    using prototypeHandle = await page.evaluateHandle(CustomClass => {
      return CustomClass.prototype;
    }, classHandle);
    using objectsHandle = await page.queryObjects(prototypeHandle);
    await expect(
      page.evaluate(objects => {
        return objects.length;
      }, objectsHandle),
    ).resolves.toBe(1);

    // Check that instances.
    await expect(
      page.evaluate(objects => {
        // @ts-expect-error: Different context.
        return objects[0] === self.customClass;
      }, objectsHandle),
    ).resolves.toBeTruthy();
  });
  it('should fail for disposed handles', async () => {
    const {page} = await getTestState();

    using prototypeHandle = await page.evaluateHandle(() => {
      return HTMLBodyElement.prototype;
    });
    // We want to dispose early.
    await prototypeHandle.dispose();
    let error!: Error;
    await page.queryObjects(prototypeHandle).catch(error_ => {
      return (error = error_);
    });
    expect(error.message).toBe('Prototype JSHandle is disposed!');
  });
  it('should fail primitive values as prototypes', async () => {
    const {page} = await getTestState();

    using prototypeHandle = await page.evaluateHandle(() => {
      return 42;
    });
    let error!: Error;
    await page.queryObjects(prototypeHandle).catch(error_ => {
      return (error = error_);
    });
    expect(error.message).toBe(
      'Prototype JSHandle must not be referencing primitive value',
    );
  });
});

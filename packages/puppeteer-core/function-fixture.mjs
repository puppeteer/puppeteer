/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
// prettier-ignore
class K1 { m() {} }
// prettier-ignore
class K2 { m () {} }
// prettier-ignore
class K3 { async m() {} }
// prettier-ignore
class K4 { async m () {} }

// prettier-ignore
export const variations = [
  // Non-arrow functions.
  function() {},
  function () {},
  function x() {},
  function x () {},
  async function() {},
  async function () {},
  async function x() {},
  async function x () {},
  // Concise methods.
  new K1().m,
  new K2().m,
  new K3().m,
  new K4().m,
  // Arrow functions.
  () => {},
  // @ts-expect-error irrelevant
  (a) => {a;},
  // @ts-expect-error irrelevant
  a => {a;},
  async () => {},
  // @ts-expect-error irrelevant
  async (a) => {a;},
  // @ts-expect-error irrelevant
  async a => {a;},
  // Generator functions
  function*a() {},
  function *a() {},
  function* a() {},
  // Async generator functions
  async function*a() {},
  async function *a() {},
  async function* a() {},
];

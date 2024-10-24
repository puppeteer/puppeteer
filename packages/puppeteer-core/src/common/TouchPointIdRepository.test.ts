/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {describe, it} from 'node:test';

import expect from 'expect';

import {TouchPointIdRepository} from './TouchPointIdRepository.js';

describe('TouchPointIdRepository', () => {
  it('creates ids', () => {
    const repository = new TouchPointIdRepository();
    const id1 = repository.getId();
    const id2 = repository.getId();

    expect(id1).toBe(0);
    expect(id2).toBe(1);
  });

  it('releases ids', () => {
    const repository = new TouchPointIdRepository();
    const id1 = repository.getId();
    const id2 = repository.getId();
    repository.releaseId(id1);
    const id3 = repository.getId();

    expect(id1).toBe(0);
    expect(id2).toBe(1);
    expect(id3).toBe(0);
  });
});

/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import expect from 'expect';
import {Operation} from 'puppeteer-core/internal/common/Operation.js';

describe('Operation', () => {
  it('should work', async () => {
    const values: number[] = [];

    await Operation.create(() => {
      values.push(1);
    })
      .effect(() => {
        values.push(2);
      })
      .effect(() => {
        values.push(3);
      });

    expect(values).toEqual([2, 3, 1]);
  });

  it('should work with error on operation', async () => {
    const values: number[] = [];

    let errored: string | undefined;
    try {
      await Operation.create(() => {
        throw new Error('test');
      })
        .effect(() => {
          values.push(1);
        })
        .effect(() => {
          values.push(2);
        });
    } catch (error) {
      errored = (error as Error).message;
    }

    expect(errored).toBe('test');
    expect(values).toEqual([1, 2]);
  });

  it('should work with error on effect', async () => {
    const values: number[] = [];

    let errored: string | undefined;
    try {
      await Operation.create(() => {
        values.push(1);
      })
        .effect(() => {
          throw new Error('test');
        })
        .effect(() => {
          values.push(2);
        });
    } catch (error) {
      errored = (error as Error).message;
    }

    expect(errored).toBe('test');
    expect(values).toEqual([2, 1]);
  });

  it('should work with error on both operation and effect', async () => {
    const values: number[] = [];

    let errored: string | undefined;
    try {
      await Operation.create(() => {
        throw new Error('test1');
      })
        .effect(() => {
          throw new Error('test2');
        })
        .effect(() => {
          values.push(1);
        });
    } catch (error) {
      errored = (error as Error).message;
    }

    expect(errored).toBe('test1');
    expect(values).toEqual([1]);
  });

  it('should work with delayed error on operation', async () => {
    const values: number[] = [];

    let errored: string | undefined;
    try {
      await Operation.create(() => {
        return new Promise((_, reject) => {
          return setTimeout(() => {
            reject(new Error('test1'));
          }, 10);
        });
      })
        .effect(() => {
          throw new Error('test2');
        })
        .effect(() => {
          values.push(1);
        });
    } catch (error) {
      errored = (error as Error).message;
    }

    expect(errored).toBe('test1');
    expect(values).toEqual([1]);
  });

  it('should work with async error on effects', async () => {
    const values: number[] = [];

    let errored: string | undefined;
    try {
      await Operation.create(() => {
        values.push(1);
      })
        .effect(async () => {
          throw new Error('test');
        })
        .effect(() => {
          values.push(2);
        });
    } catch (error) {
      errored = (error as Error).message;
    }

    expect(errored).toBe('test');
    expect(values).toEqual([2, 1]);
  });

  it('should work with then', async () => {
    const values: number[] = [];

    const operation = Operation.create(() => {
      values.push(1);
    })
      .effect(() => {
        values.push(2);
      })
      .effect(() => {
        values.push(3);
      })
      .then(() => {
        values.push(4);
      });
    await operation;

    expect(operation).toBeInstanceOf(Operation);
    expect(values).toEqual([2, 3, 1, 4]);
  });

  it('should work with catch', async () => {
    const values: number[] = [];

    const operation = Operation.create(() => {
      throw new Error('test');
    })
      .effect(() => {
        values.push(1);
      })
      .effect(() => {
        values.push(2);
      })
      .catch(() => {
        values.push(3);
      });
    await operation;

    expect(operation).toBeInstanceOf(Operation);
    expect(values).toEqual([1, 2, 3]);
  });

  it('should work with finally', async () => {
    const values: number[] = [];

    const operation = Operation.create(() => {
      values.push(1);
    })
      .effect(() => {
        values.push(2);
      })
      .effect(() => {
        values.push(3);
      })
      .finally(() => {
        values.push(4);
      });
    await operation;

    expect(operation).toBeInstanceOf(Operation);
    expect(values).toEqual([2, 3, 1, 4]);
  });

  it('should throw when adding effects on on awaited operation', async () => {
    const values: number[] = [];

    const operation = Operation.create(() => {
      values.push(1);
    });
    await operation;

    expect(() => {
      operation.effect(() => {
        values.push(2);
      });
    }).toThrowError(
      new Error(
        'Attempted to add effect to a completed operation. Make sure effects are added synchronously after the operation is created.'
      )
    );
    expect(operation).toBeInstanceOf(Operation);
    expect(values).toEqual([1]);
  });
});

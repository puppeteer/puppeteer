/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

interface IdRecord {
  id: number;
  inUse: boolean;
}
export class TouchPointIdRepository {
  #ids: IdRecord[] = [];

  #generateNewId(): number {
    return this.#ids.length;
  }

  getId(): number {
    const notInUse = this.#ids.find(id => {
      return !id.inUse;
    });
    if (notInUse) {
      notInUse.inUse = true;
      return notInUse.id;
    }
    const newOne: IdRecord = {id: this.#generateNewId(), inUse: true};
    this.#ids.push(newOne);
    return newOne.id;
  }

  public releaseId(id: number): void {
    const record = this.#ids.find(record => {
      return record.id === id;
    });
    if (!record) {
      return;
    }
    record.inUse = false;
  }
}

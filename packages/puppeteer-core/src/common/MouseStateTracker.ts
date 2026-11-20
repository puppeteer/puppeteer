/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {Point} from '../api/ElementHandle.js';

/**
 * @internal
 */
export interface MouseState {
  /**
   * The current position of the mouse.
   */
  position: Point;
  /**
   * The buttons that are currently being pressed.
   */
  buttons: number;
}

/**
 * @internal
 */
export class MouseStateTracker {
  #_state: Readonly<MouseState> = {
    position: {x: 0, y: 0},
    buttons: 0,
  };
  get #state(): MouseState {
    return Object.assign({...this.#_state}, ...this.#transactions);
  }

  get position(): Point {
    return this.#state.position;
  }

  get buttons(): number {
    return this.#state.buttons;
  }

  // Transactions can run in parallel, so we store each of them in this array.
  #transactions: Array<Partial<MouseState>> = [];
  #createTransaction(): {
    update: (updates: Partial<MouseState>) => void;
    commit: () => void;
    rollback: () => void;
  } {
    const transaction: Partial<MouseState> = {};
    this.#transactions.push(transaction);
    const popTransaction = () => {
      this.#transactions.splice(this.#transactions.indexOf(transaction), 1);
    };
    return {
      update: (updates: Partial<MouseState>) => {
        Object.assign(transaction, updates);
      },
      commit: () => {
        this.#_state = {...this.#_state, ...transaction};
        popTransaction();
      },
      rollback: popTransaction,
    };
  }

  /**
   * This is a shortcut for a typical update, commit/rollback lifecycle based on
   * the error of the action.
   */
  async withTransaction(
    action: (
      update: (updates: Partial<MouseState>) => void,
    ) => Promise<unknown>,
  ): Promise<void> {
    const {update, commit, rollback} = this.#createTransaction();
    try {
      await action(update);
      commit();
    } catch (error) {
      rollback();
      throw error;
    }
  }
}

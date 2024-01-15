/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {EventEmitter} from '../../common/EventEmitter.js';

import type BrowsingContext from './BrowsingContext.js';
import type Connection from './Connection.js';

export type CallFunctionOptions = Omit<
  Bidi.Script.CallFunctionParameters,
  'functionDeclaration' | 'awaitPromise' | 'target'
>;

export type EvaluateOptions = Omit<
  Bidi.Script.EvaluateParameters,
  'expression' | 'awaitPromise' | 'target'
>;

export default abstract class Realm extends EventEmitter<{
  /** Emitted when the realm is destroyed. */
  destroyed: void;
  /** Emitted when a dedicated worker is created in the realm. */
  worker: DedicatedWorkerRealm;
  /** Emitted when a shared worker is created in the realm. */
  sharedworker: SharedWorkerRealm;
}> {
  readonly id: string;
  readonly origin: string;
  protected constructor(id: string, origin: string) {
    super();
    this.id = id;
    this.origin = origin;
  }

  protected initialize(): void {
    this.connection.on('script.realmDestroyed', info => {
      if (info.realm === this.id) {
        this.emit('destroyed', undefined);
      }
    });
  }

  protected abstract get connection(): Connection;

  protected get target(): Bidi.Script.Target {
    return {realm: this.id};
  }

  async disown(handles: string[]): Promise<void> {
    await this.connection.send('script.disown', {
      target: this.target,
      handles,
    });
  }

  async callFunction(
    functionDeclaration: string,
    awaitPromise: boolean,
    options: CallFunctionOptions = {}
  ): Promise<Bidi.Script.EvaluateResult> {
    const {result} = await this.connection.send('script.callFunction', {
      functionDeclaration,
      awaitPromise,
      target: this.target,
      ...options,
    });
    return result;
  }

  async evaluate(
    expression: string,
    awaitPromise: boolean,
    options: EvaluateOptions = {}
  ): Promise<Bidi.Script.EvaluateResult> {
    const {result} = await this.connection.send('script.evaluate', {
      expression,
      awaitPromise,
      target: this.target,
      ...options,
    });
    return result;
  }
}

export class WindowRealm extends Realm {
  static from(context: BrowsingContext, sandbox?: string): WindowRealm {
    const realm = new WindowRealm(context, sandbox);
    realm.initialize();
    return realm;
  }

  readonly browsingContext: BrowsingContext;
  readonly sandbox?: string;

  readonly #workers: {
    dedicated: Map<string, DedicatedWorkerRealm>;
    shared: Map<string, SharedWorkerRealm>;
  } = {
    dedicated: new Map(),
    shared: new Map(),
  };

  constructor(context: BrowsingContext, sandbox?: string) {
    super('', '');
    this.browsingContext = context;
    this.sandbox = sandbox;
  }

  override initialize(): void {
    super.initialize();

    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    this.connection.on('script.realmCreated', info => {
      if (info.type === 'window') {
        // SAFETY: This is the only time we allow mutations.
        (this as any).id = info.realm;
        return;
      }
      if (info.type === 'dedicated-worker') {
        const realm = DedicatedWorkerRealm.from(this, info.realm, info.origin);
        realm.on('destroyed', () => {
          this.#workers.dedicated.delete(realm.id);
        });

        this.#workers.dedicated.set(realm.id, realm);

        this.emit('worker', realm);
      }
    });

    // ///////////////////
    // Parent listeners //
    // ///////////////////
    this.browsingContext.userContext.browser.on('sharedworker', ({realm}) => {
      if (realm.owners.has(this)) {
        realm.on('destroyed', () => {
          this.#workers.shared.delete(realm.id);
        });

        this.#workers.shared.set(realm.id, realm);

        this.emit('sharedworker', realm);
      }
    });
  }

  override get connection(): Connection {
    return this.browsingContext.userContext.browser.session.connection;
  }

  override get target(): Bidi.Script.Target {
    return {context: this.browsingContext.id, sandbox: this.sandbox};
  }
}

export type DedicatedWorkerOwnerRealm =
  | DedicatedWorkerRealm
  | SharedWorkerRealm
  | WindowRealm;

export class DedicatedWorkerRealm extends Realm {
  static from(
    owner: DedicatedWorkerOwnerRealm,
    id: string,
    origin: string
  ): DedicatedWorkerRealm {
    const realm = new DedicatedWorkerRealm(owner, id, origin);
    realm.initialize();
    return realm;
  }

  readonly owners: Set<DedicatedWorkerOwnerRealm>;

  readonly #workers = new Map<string, DedicatedWorkerRealm>();

  constructor(owner: DedicatedWorkerOwnerRealm, id: string, origin: string) {
    super(id, origin);
    this.owners = new Set([owner]);
  }

  override initialize(): void {
    super.initialize();

    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    this.connection.on('script.realmCreated', info => {
      if (info.type === 'dedicated-worker') {
        const realm = DedicatedWorkerRealm.from(this, info.realm, info.origin);
        realm.on('destroyed', () => {
          this.#workers.delete(realm.id);
        });

        this.#workers.set(realm.id, realm);

        this.emit('worker', realm);
      }
    });
  }

  override get connection(): Connection {
    // SAFETY: At least one owner will exist.
    return this.owners.values().next().value.connection;
  }
}

export class SharedWorkerRealm extends Realm {
  static from(
    owners: [WindowRealm, ...WindowRealm[]],
    id: string,
    origin: string
  ): SharedWorkerRealm {
    const realm = new SharedWorkerRealm(owners, id, origin);
    realm.initialize();
    return realm;
  }

  readonly owners: Set<WindowRealm>;

  readonly #workers = new Map<string, DedicatedWorkerRealm>();

  constructor(
    owners: [WindowRealm, ...WindowRealm[]],
    id: string,
    origin: string
  ) {
    super(id, origin);
    this.owners = new Set(owners);
  }

  override initialize(): void {
    super.initialize();

    // ///////////////////////
    // Connection listeners //
    // ///////////////////////
    this.connection.on('script.realmCreated', info => {
      if (info.type === 'dedicated-worker') {
        const realm = DedicatedWorkerRealm.from(this, info.realm, info.origin);
        realm.on('destroyed', () => {
          this.#workers.delete(realm.id);
        });

        this.#workers.set(realm.id, realm);

        this.emit('worker', realm);
      }
    });
  }

  override get connection(): Connection {
    // SAFETY: At least one owner will exist.
    return this.owners.values().next().value.connection;
  }
}

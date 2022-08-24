import Protocol from 'devtools-protocol';
import {assert} from '../util/assert.js';
import {NamedSymbol} from '../util/NamedSymbol.js';
import {CDPSession} from './Connection.js';
import {EventEmitter} from './EventEmitter.js';
import {EVALUATION_SCRIPT_URL, ExecutionContext} from './ExecutionContext.js';
import {Frame} from './Frame.js';
import {IsolatedWorld} from './IsolatedWorld.js';
import {debugError} from './util.js';
import {WebWorker} from './WebWorker.js';

/**
 * We use symbols to prevent external parties listening to these events.
 * They are internal to Puppeteer.
 *
 * @internal
 */
export const IsolatedWorldManagerEmittedEvents = {
  ClientUpdated: Symbol('IsolatedWorldManager.ClientUpdated'),
};

/**
 * @internal
 */
export type IsolatedWorldOwner = Frame | WebWorker;

/**
 * @internal
 */
export type SessionalContextId = string;

export const createSessionalContextId = (
  session: CDPSession,
  contextId: number
): SessionalContextId => {
  return `${contextId}:${session}`;
};

/**
 * @internal
 */
export class IsolatedWorldManager extends EventEmitter {
  static #cache = new Set<string>();

  #owner: IsolatedWorldOwner;
  #client!: CDPSession;

  #initialized!: Promise<void>;

  // Default world is special because it is always created.
  #defaultWorld = new IsolatedWorld(this);
  #worlds = new Map<NamedSymbol, IsolatedWorld>();

  #sessionalContextIdToWorldMap = new Map<SessionalContextId, IsolatedWorld>();

  #callbacks: Array<(client: CDPSession) => Promise<void>> = [];

  constructor(client: CDPSession, owner: IsolatedWorldOwner) {
    super();

    // Keep own reference to client because it might differ from the FrameManager's
    // client for OOP iframes.
    this.#owner = owner;

    this.updateClient(client);
  }

  get owner(): IsolatedWorldOwner {
    return this.#owner;
  }

  get client(): CDPSession {
    return this.#client;
  }

  get worlds(): IsolatedWorld[] {
    return [this.defaultWorld, ...this.#worlds.values()];
  }

  get defaultWorld(): IsolatedWorld {
    return this.#defaultWorld;
  }

  _detach(): void {
    for (const world of this.worlds) {
      world._detach();
    }
  }

  updateClient(client: CDPSession): void {
    this.#client = client;
    this.emit(IsolatedWorldManagerEmittedEvents.ClientUpdated, this.client);

    this.#client.on('Runtime.executionContextCreated', event => {
      this.#onExecutionContextCreated(client, event.context);
    });
    this.#client.on('Runtime.executionContextDestroyed', event => {
      this.#onExecutionContextDestroyed(client, event.executionContextId);
    });
    this.#client.on('Runtime.executionContextsCleared', () => {
      this.#onExecutionContextsCleared(client);
    });

    this.#initialized = this.#client.send('Runtime.enable').then(async () => {
      await Promise.all(
        this.#callbacks.map(callback => {
          return callback(client);
        })
      );
    });
  }

  get(id: NamedSymbol): IsolatedWorld {
    const world = this.#worlds.get(id);
    assert(world);
    return world;
  }

  getBySessionalContextId(
    session: CDPSession,
    contextId: number
  ): IsolatedWorld | undefined {
    return this.#sessionalContextIdToWorldMap.get(
      createSessionalContextId(session, contextId)
    );
  }

  async add(id: NamedSymbol): Promise<void> {
    if (this.has(id)) {
      return;
    }

    // Wait for the runtime to initialize.
    await this.#initialized;

    const world = new IsolatedWorld(this);
    this.#worlds.set(id, world);

    if (this.owner instanceof Frame) {
      const owner = this.owner;
      const callback = async (client: CDPSession) => {
        if (
          !IsolatedWorldManager.#cache.has(
            `${client.id}:${id.name}:${owner._id}`
          )
        ) {
          await client
            .send('Page.createIsolatedWorld', {
              frameId: owner._id,
              worldName: id.name,
              grantUniveralAccess: true,
            })
            .catch(debugError);
          IsolatedWorldManager.#cache.add(
            `${client.id}:${id.name}:${owner._id}`
          );
        }
        if (!IsolatedWorldManager.#cache.has(`${client.id}:${id.name}`)) {
          await client.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `//# sourceURL=${EVALUATION_SCRIPT_URL}`,
            worldName: id.name,
          });
          IsolatedWorldManager.#cache.add(`${client.id}:${id.name}`);
        }
      };
      this.#callbacks.push(callback);
      await callback(this.client);
    }
  }

  has(id: NamedSymbol): boolean {
    return id in this.#worlds;
  }

  #onExecutionContextCreated(
    client: CDPSession,
    info: Protocol.Runtime.ExecutionContextDescription
  ): void {
    if (!this.#filterExecutionContext(client, info)) {
      return;
    }
    const world = this.#identifyWorld(info);
    if (!world) {
      // Implies we don't know the world. Probably created externally.
      return;
    }
    world.setContext(new ExecutionContext(client, info, world));
    this.#sessionalContextIdToWorldMap.set(
      createSessionalContextId(client, info.id),
      world
    );
  }

  async #onExecutionContextDestroyed(
    session: CDPSession,
    contextId: number
  ): Promise<void> {
    const id = createSessionalContextId(session, contextId);
    const world = this.#sessionalContextIdToWorldMap.get(id);
    if (!world) {
      return;
    }
    world.clearContext();
    this.#sessionalContextIdToWorldMap.delete(id);
  }

  async #onExecutionContextsCleared(client: CDPSession): Promise<void> {
    for (const [key, world] of this.#sessionalContextIdToWorldMap.entries()) {
      // Make sure to only clear execution contexts that belong
      // to the current session.
      if ((await world.executionContext())._client !== client) {
        continue;
      }
      world.clearContext();
      this.#sessionalContextIdToWorldMap.delete(key);
    }
  }

  /**
   * @returns `true` iff the execution context applies to the owner.
   */
  #filterExecutionContext(
    client: CDPSession,
    info: Protocol.Runtime.ExecutionContextDescription
  ) {
    if (this.#owner instanceof Frame) {
      return filterFrameExecutionContext(this.#owner, client, info);
    }
    if (this.#owner instanceof WebWorker) {
      return this.#filterWebWorkerExecutionContext(client, info);
    }
    return false;
  }

  /**
   * Do not use directly. Use
   * {@link IsolatedWorldManager.#filterExecutionContext}.
   *
   * @returns `true` iff the execution context applies to the owner assuming the
   * owner is a {@link WebWorker | web worker}.
   */
  #filterWebWorkerExecutionContext(
    __: CDPSession,
    _: Protocol.Runtime.ExecutionContextDescription
  ): boolean {
    return true;
  }

  #identifyWorld(
    info: Protocol.Runtime.ExecutionContextDescription
  ): IsolatedWorld | undefined {
    if (info.auxData && !!info.auxData['isDefault']) {
      return this.#defaultWorld;
    }
    for (const symbol of this.#worlds.keys()) {
      if (symbol.name === info.name) {
        const world = this.#worlds.get(symbol) as IsolatedWorld;
        // In case of multiple sessions to the same target, there's a race between
        // connections so we might end up creating multiple isolated worlds.
        // We can use either.
        if (world.hasContext()) {
          return;
        }
        return world;
      }
    }
    return;
  }
}

/**
 * Do not use directly. Use
 * {@link IsolatedWorldManager.#filterExecutionContext}.
 *
 * @returns `true` iff the execution context applies to the owner assuming the
 * owner is a {@link Frame | frame}.
 */
function filterFrameExecutionContext(
  frame: Frame,
  session: CDPSession,
  info: Protocol.Runtime.ExecutionContextDescription
): boolean {
  if (!info.auxData) {
    return false;
  }

  if (frame._id !== info.auxData['frameId']) {
    // We assume an execution context cannot be created before a frame.
    return false;
  }
  // Only care about execution contexts created for the same session.
  if (frame._client() !== session) {
    return false;
  }
  return true;
}

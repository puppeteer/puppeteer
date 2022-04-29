import { BrowserContext, WaitForTargetOptions } from '../common/Browser.js';
import { EventEmitter } from '../common/EventEmitter.js';
import { Page } from '../common/Page.js';
import { Target } from '../common/Target.js';
import { BiDiSession } from './BiDiSession.js';
import { ChildProcess } from 'child_process';
import { Viewport } from '../common/PuppeteerViewport.js';

export class BiDiBrowser extends EventEmitter {
  #session: BiDiSession;

  /**
   * @internal
   * Used in Target.ts directly so cannot be marked private.
   */
  _targets: Map<string, Target>;

  targets(): Target[] {
    throw new Error('BiDi');
  }

  target(): Target {
    throw new Error('BiDi');
  }

  browserContexts(): BrowserContext[] {
    throw new Error('BiDi');
  }
  defaultBrowserContext(): BrowserContext {
    throw new Error('BiDi');
  }
  async pages(): Promise<Page[]> {
    throw new Error('BiDi');
  }

  waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: WaitForTargetOptions
  ): Promise<Target> {
    throw new Error('BiDi');
  }

  _createPageInContext(contextId?: string): Promise<any> {
    throw new Error('BiDi');
  }

  _disposeContext(contextId?: string): Promise<void> {
    throw new Error('BiDi');
  }

  isConnected(): boolean {
    return true;
  }
  disconnect(): void {}
  wsEndpoint(): string {
    return '';
  }
  process(): ChildProcess | null {
    return null;
  }
  async close(): Promise<void> {}
  async userAgent(): Promise<string> {
    return '';
  }
  async version(): Promise<string> {
    return '';
  }

  constructor(session: BiDiSession) {
    super();
    this.#session = session;
    this.#session.send('session.status', {});
  }

  async newPage(): Promise<Page> {
    const data = await this.#session.send('browsingContext.create', {
      type: 'tab',
    });
    return new BiDiPage(data as any, this) as unknown as Page;
  }

  async createIncognitoBrowserContext(): Promise<any> {
    return this;
  }

  async navigateContext(
    contextId: string,
    url: string
  ): Promise<{ url: string; navigation: string }> {
    return (await this.#session.send('browsingContext.navigate', {
      context: contextId,
      url,
      wait: 'complete',
    })) as { url: string; navigation: string };
  }

  async evaluateInContext(contextId: string, func: string, ...args: unknown[]) {
    return await this.#session.send('script.callFunction', {
      target: {
        context: contextId,
      },
      functionDeclaration: func,
      args: args.map((arg) => {
        // QUESTION: spec says arguments?
        return {
          type: 'string',
          value: arg,
        };
      }),
      awaitPromise: true,
    });
  }

  async sendCDPCommandInContext(contextId, command: string, params: unknown) {
    const { session: sessionId } = (await this.#session.send(
      'PROTO.cdp.getSession',
      {
        context: contextId,
      }
    )) as any;
    await this.#session.send('PROTO.cdp.sendCommand', {
      cdpMethod: command,
      cdpParams: params,
      cdpSession: sessionId,
    });
  }
}

class BiDiPage implements Pick<Page, 'evaluate' | 'goto'> {
  contextId: string;
  url: string;
  children: unknown;
  browser: BiDiBrowser;

  constructor(
    data: { context: string; url: string; children: unknown },
    browser: BiDiBrowser
  ) {
    this.contextId = data.context;
    this.url = data.url;
    this.children = data.children;
    this.browser = browser;
  }

  async goto(url: string, options: any): Promise<any> {
    const { navigation, url: finalUrl } = await this.browser.navigateContext(
      this.contextId,
      url
    );
    this.url = finalUrl;
    return { navigation };
  }

  async evaluate(func: any, ...args: unknown[]): Promise<any> {
    const result = await this.browser.evaluateInContext(
      this.contextId,
      func.toString(),
      ...args
    );

    return (result as any).value;
  }

  async setUserAgent(
    userAgent: string,
    userAgentMetadata?: any
  ): Promise<void> {
    await this.browser.sendCDPCommandInContext(
      this.contextId,
      'Network.setUserAgentOverride',
      {
        userAgent: userAgent,
        userAgentMetadata: userAgentMetadata,
      }
    );
  }
}

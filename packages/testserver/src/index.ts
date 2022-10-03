/**
 * Copyright 2017 Google Inc. All rights reserved.
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

import assert from 'assert';
import {readFile, readFileSync} from 'fs';
import {
  createServer as createHttpServer,
  IncomingMessage,
  RequestListener,
  Server as HttpServer,
  ServerResponse,
} from 'http';
import {
  createServer as createHttpsServer,
  Server as HttpsServer,
  ServerOptions as HttpsServerOptions,
} from 'https';
import {getType as getMimeType} from 'mime';
import {AddressInfo} from 'net';
import {join} from 'path';
import {Duplex} from 'stream';
import {Server as WebSocketServer, WebSocket} from 'ws';
import {gzip} from 'zlib';

interface Subscriber {
  resolve: (msg: IncomingMessage) => void;
  reject: (err?: Error) => void;
  promise: Promise<IncomingMessage>;
}

type TestIncomingMessage = IncomingMessage & {postBody?: Promise<string>};

export class TestServer {
  PORT!: number;
  PREFIX!: string;
  CROSS_PROCESS_PREFIX!: string;
  EMPTY_PAGE!: string;

  #dirPath: string;
  #server: HttpsServer | HttpServer;
  #wsServer: WebSocketServer;

  #startTime = new Date();
  #cachedPathPrefix?: string;

  #connections = new Set<Duplex>();
  #routes = new Map<
    string,
    (msg: IncomingMessage, res: ServerResponse) => void
  >();
  #auths = new Map<string, {username: string; password: string}>();
  #csp = new Map<string, string>();
  #gzipRoutes = new Set<string>();
  #requestSubscribers = new Map<string, Subscriber>();

  static async create(dirPath: string): Promise<TestServer> {
    let res!: (value: unknown) => void;
    const promise = new Promise(resolve => {
      res = resolve;
    });
    const server = new TestServer(dirPath);
    server.#server.once('listening', res);
    server.#server.listen(0);
    await promise;
    return server;
  }

  static async createHTTPS(dirPath: string): Promise<TestServer> {
    let res!: (value: unknown) => void;
    const promise = new Promise(resolve => {
      res = resolve;
    });
    const server = new TestServer(dirPath, {
      key: readFileSync(join(__dirname, '..', 'key.pem')),
      cert: readFileSync(join(__dirname, '..', 'cert.pem')),
      passphrase: 'aaaa',
    });
    server.#server.once('listening', res);
    server.#server.listen(0);
    await promise;
    return server;
  }

  constructor(dirPath: string, sslOptions?: HttpsServerOptions) {
    this.#dirPath = dirPath;

    if (sslOptions) {
      this.#server = createHttpsServer(sslOptions, this.#onRequest);
    } else {
      this.#server = createHttpServer(this.#onRequest);
    }
    this.#server.on('connection', this.#onServerConnection);
    this.#wsServer = new WebSocketServer({server: this.#server});
    this.#wsServer.on('connection', this.#onWebSocketConnection);
  }

  #onServerConnection = (connection: Duplex): void => {
    this.#connections.add(connection);
    // ECONNRESET is a legit error given
    // that tab closing simply kills process.
    connection.on('error', error => {
      if ((error as NodeJS.ErrnoException).code !== 'ECONNRESET') {
        throw error;
      }
    });
    connection.once('close', () => {
      return this.#connections.delete(connection);
    });
  };

  get port(): number {
    return (this.#server.address() as AddressInfo).port;
  }

  enableHTTPCache(pathPrefix: string): void {
    this.#cachedPathPrefix = pathPrefix;
  }

  setAuth(path: string, username: string, password: string): void {
    this.#auths.set(path, {username, password});
  }

  enableGzip(path: string): void {
    this.#gzipRoutes.add(path);
  }

  setCSP(path: string, csp: string): void {
    this.#csp.set(path, csp);
  }

  async stop(): Promise<void> {
    this.reset();
    for (const socket of this.#connections) {
      socket.destroy();
    }
    this.#connections.clear();
    await new Promise(x => {
      return this.#server.close(x);
    });
  }

  setRoute(
    path: string,
    handler: (req: IncomingMessage, res: ServerResponse) => void
  ): void {
    this.#routes.set(path, handler);
  }

  setRedirect(from: string, to: string): void {
    this.setRoute(from, (_, res) => {
      res.writeHead(302, {location: to});
      res.end();
    });
  }

  waitForRequest(path: string): Promise<TestIncomingMessage> {
    const subscriber = this.#requestSubscribers.get(path);
    if (subscriber) {
      return subscriber.promise;
    }
    let resolve!: (value: IncomingMessage) => void;
    let reject!: (reason?: Error) => void;
    const promise = new Promise<IncomingMessage>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.#requestSubscribers.set(path, {resolve, reject, promise});
    return promise;
  }

  reset(): void {
    this.#routes.clear();
    this.#auths.clear();
    this.#csp.clear();
    this.#gzipRoutes.clear();
    const error = new Error('Static Server has been reset');
    for (const subscriber of this.#requestSubscribers.values()) {
      subscriber.reject.call(undefined, error);
    }
    this.#requestSubscribers.clear();
  }

  #onRequest: RequestListener = (
    request: TestIncomingMessage,
    response
  ): void => {
    request.on('error', (error: {code: string}) => {
      if (error.code === 'ECONNRESET') {
        response.end();
      } else {
        throw error;
      }
    });
    request.postBody = new Promise(resolve => {
      let body = '';
      request.on('data', (chunk: string) => {
        return (body += chunk);
      });
      request.on('end', () => {
        return resolve(body);
      });
    });
    assert(request.url);
    const url = new URL(request.url, `https://${request.headers.host}`);
    const path = url.pathname + url.search;
    const auth = this.#auths.get(path);
    if (auth) {
      const credentials = Buffer.from(
        (request.headers.authorization || '').split(' ')[1] || '',
        'base64'
      ).toString();
      if (credentials !== `${auth.username}:${auth.password}`) {
        response.writeHead(401, {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        });
        response.end('HTTP Error 401 Unauthorized: Access is denied');
        return;
      }
    }
    const subscriber = this.#requestSubscribers.get(path);
    if (subscriber) {
      subscriber.resolve.call(undefined, request);
      this.#requestSubscribers.delete(path);
    }
    const handler = this.#routes.get(path);
    if (handler) {
      handler.call(undefined, request, response);
    } else {
      this.serveFile(request, response, path);
    }
  };

  serveFile(
    request: IncomingMessage,
    response: ServerResponse,
    pathName: string
  ): void {
    if (pathName === '/') {
      pathName = '/index.html';
    }
    const filePath = join(this.#dirPath, pathName.substring(1));

    if (this.#cachedPathPrefix && filePath.startsWith(this.#cachedPathPrefix)) {
      if (request.headers['if-modified-since']) {
        response.statusCode = 304; // not modified
        response.end();
        return;
      }
      response.setHeader('Cache-Control', 'public, max-age=31536000');
      response.setHeader('Last-Modified', this.#startTime.toISOString());
    } else {
      response.setHeader('Cache-Control', 'no-cache, no-store');
    }
    const csp = this.#csp.get(pathName);
    if (csp) {
      response.setHeader('Content-Security-Policy', csp);
    }

    readFile(filePath, (err, data) => {
      if (err) {
        response.statusCode = 404;
        response.end(`File not found: ${filePath}`);
        return;
      }
      const mimeType = getMimeType(filePath);
      if (mimeType) {
        const isTextEncoding = /^text\/|^application\/(javascript|json)/.test(
          mimeType
        );
        const contentType = isTextEncoding
          ? `${mimeType}; charset=utf-8`
          : mimeType;
        response.setHeader('Content-Type', contentType);
      }
      if (this.#gzipRoutes.has(pathName)) {
        response.setHeader('Content-Encoding', 'gzip');
        gzip(data, (_, result) => {
          response.end(result);
        });
      } else {
        response.end(data);
      }
    });
  }

  #onWebSocketConnection = (socket: WebSocket): void => {
    socket.send('opened');
  };
}

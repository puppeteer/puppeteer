/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import {describe, it} from 'node:test';

import expect from 'expect';

import {HTTPRequest} from '../api/HTTPRequest.js';
import {HTTPResponse} from '../api/HTTPResponse.js';

import {EventEmitter} from './EventEmitter.js';
import {Frame} from './Frame.js';
import {NetworkManager, NetworkManagerEmittedEvents} from './NetworkManager.js';

// TODO: develop a helper to generate fake network events for attributes that
// are not relevant for the network manager to make tests shorter.

class MockCDPSession extends EventEmitter {
  async send(): Promise<any> {}
  connection() {
    return undefined;
  }
  async detach() {}
  id() {
    return '1';
  }
}

describe('NetworkManager', () => {
  it('should process extra info on multiple redirects', async () => {
    const mockCDPSession = new MockCDPSession();
    new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      loaderId: '7760711DEFCFA23132D98ABA6B4E175C',
      documentURL: 'http://localhost:8907/redirect/1.html',
      request: {
        url: 'http://localhost:8907/redirect/1.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 2111.55635,
      wallTime: 1637315638.473634,
      initiator: {type: 'other'},
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: '099A5216AF03AAFEC988F214B024DF08',
      hasUserGesture: false,
    });

    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      associatedCookies: [],
      headers: {
        Host: 'localhost:8907',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      connectTiming: {requestTime: 2111.557593},
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      blockedCookies: [],
      headers: {
        location: '/redirect/2.html',
        Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 302,
      headersText:
        'HTTP/1.1 302 Found\r\nlocation: /redirect/2.html\r\nDate: Fri, 19 Nov 2021 09:53:58 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nTransfer-Encoding: chunked\r\n\r\n',
    });
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      loaderId: '7760711DEFCFA23132D98ABA6B4E175C',
      documentURL: 'http://localhost:8907/redirect/2.html',
      request: {
        url: 'http://localhost:8907/redirect/2.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 2111.559124,
      wallTime: 1637315638.47642,
      initiator: {type: 'other'},
      redirectHasExtraInfo: true,
      redirectResponse: {
        url: 'http://localhost:8907/redirect/1.html',
        status: 302,
        statusText: 'Found',
        headers: {
          location: '/redirect/2.html',
          Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=5',
          'Transfer-Encoding': 'chunked',
        },
        mimeType: '',
        connectionReused: false,
        connectionId: 322,
        remoteIPAddress: '[::1]',
        remotePort: 8907,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 162,
        timing: {
          requestTime: 2111.557593,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: 0.241,
          dnsEnd: 0.251,
          connectStart: 0.251,
          connectEnd: 0.47,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.537,
          sendEnd: 0.611,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 0.939,
        },
        responseTime: 1.637315638475744e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      type: 'Document',
      frameId: '099A5216AF03AAFEC988F214B024DF08',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      associatedCookies: [],
      headers: {
        Host: 'localhost:8907',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      connectTiming: {requestTime: 2111.559346},
    });
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      loaderId: '7760711DEFCFA23132D98ABA6B4E175C',
      documentURL: 'http://localhost:8907/redirect/3.html',
      request: {
        url: 'http://localhost:8907/redirect/3.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 2111.560249,
      wallTime: 1637315638.477543,
      initiator: {type: 'other'},
      redirectHasExtraInfo: true,
      redirectResponse: {
        url: 'http://localhost:8907/redirect/2.html',
        status: 302,
        statusText: 'Found',
        headers: {
          location: '/redirect/3.html',
          Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=5',
          'Transfer-Encoding': 'chunked',
        },
        mimeType: '',
        connectionReused: true,
        connectionId: 322,
        remoteIPAddress: '[::1]',
        remotePort: 8907,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 162,
        timing: {
          requestTime: 2111.559346,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.15,
          sendEnd: 0.196,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 0.507,
        },
        responseTime: 1.637315638477063e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      type: 'Document',
      frameId: '099A5216AF03AAFEC988F214B024DF08',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      blockedCookies: [],
      headers: {
        location: '/redirect/3.html',
        Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 302,
      headersText:
        'HTTP/1.1 302 Found\r\nlocation: /redirect/3.html\r\nDate: Fri, 19 Nov 2021 09:53:58 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nTransfer-Encoding: chunked\r\n\r\n',
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      associatedCookies: [],
      headers: {
        Host: 'localhost:8907',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      connectTiming: {requestTime: 2111.560482},
    });
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      loaderId: '7760711DEFCFA23132D98ABA6B4E175C',
      documentURL: 'http://localhost:8907/empty.html',
      request: {
        url: 'http://localhost:8907/empty.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 2111.561542,
      wallTime: 1637315638.478837,
      initiator: {type: 'other'},
      redirectHasExtraInfo: true,
      redirectResponse: {
        url: 'http://localhost:8907/redirect/3.html',
        status: 302,
        statusText: 'Found',
        headers: {
          location: 'http://localhost:8907/empty.html',
          Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=5',
          'Transfer-Encoding': 'chunked',
        },
        mimeType: '',
        connectionReused: true,
        connectionId: 322,
        remoteIPAddress: '[::1]',
        remotePort: 8907,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 178,
        timing: {
          requestTime: 2111.560482,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.149,
          sendEnd: 0.198,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 0.478,
        },
        responseTime: 1.637315638478184e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      type: 'Document',
      frameId: '099A5216AF03AAFEC988F214B024DF08',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      blockedCookies: [],
      headers: {
        location: 'http://localhost:8907/empty.html',
        Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 302,
      headersText:
        'HTTP/1.1 302 Found\r\nlocation: http://localhost:8907/empty.html\r\nDate: Fri, 19 Nov 2021 09:53:58 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nTransfer-Encoding: chunked\r\n\r\n',
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      associatedCookies: [],
      headers: {
        Host: 'localhost:8907',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/97.0.4691.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      connectTiming: {requestTime: 2111.561759},
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      blockedCookies: [],
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Content-Type': 'text/html; charset=utf-8',
        Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
        Connection: 'keep-alive',
        'Keep-Alive': 'timeout=5',
        'Content-Length': '0',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\r\nCache-Control: no-cache, no-store\r\nContent-Type: text/html; charset=utf-8\r\nDate: Fri, 19 Nov 2021 09:53:58 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nContent-Length: 0\r\n\r\n',
    });
    mockCDPSession.emit('Network.responseReceived', {
      requestId: '7760711DEFCFA23132D98ABA6B4E175C',
      loaderId: '7760711DEFCFA23132D98ABA6B4E175C',
      timestamp: 2111.563565,
      type: 'Document',
      response: {
        url: 'http://localhost:8907/empty.html',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Fri, 19 Nov 2021 09:53:58 GMT',
          Connection: 'keep-alive',
          'Keep-Alive': 'timeout=5',
          'Content-Length': '0',
        },
        mimeType: 'text/html',
        connectionReused: true,
        connectionId: 322,
        remoteIPAddress: '[::1]',
        remotePort: 8907,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 197,
        timing: {
          requestTime: 2111.561759,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.148,
          sendEnd: 0.19,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 0.925,
        },
        responseTime: 1.637315638479928e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      hasExtraInfo: true,
      frameId: '099A5216AF03AAFEC988F214B024DF08',
    });
  });
  it(`should handle "double pause" (crbug.com/1196004) Fetch.requestPaused events for the same Network.requestWillBeSent event`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });
    await manager.setRequestInterception(true);

    const requests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.Request,
      async (request: HTTPRequest) => {
        requests.push(request);
        await request.continue();
      }
    );

    /**
     * This sequence was taken from an actual CDP session produced by the following
     * test script:
     *
     * ```ts
     * const browser = await puppeteer.launch({headless: false});
     * const page = await browser.newPage();
     * await page.setCacheEnabled(false);
     *
     * await page.setRequestInterception(true);
     * page.on('request', interceptedRequest => {
     *   interceptedRequest.continue();
     * });
     *
     * await page.goto('https://www.google.com');
     * await browser.close();
     * ```
     */
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '11ACE9783588040D644B905E8B55285B',
      loaderId: '11ACE9783588040D644B905E8B55285B',
      documentURL: 'https://www.google.com/',
      request: {
        url: 'https://www.google.com/',
        method: 'GET',
        headers: [Object],
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 224604.980827,
      wallTime: 1637955746.786191,
      initiator: {type: 'other'},
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: '84AC261A351B86932B775B76D1DD79F8',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Fetch.requestPaused', {
      requestId: 'interception-job-1.0',
      request: {
        url: 'https://www.google.com/',
        method: 'GET',
        headers: [Object],
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
      frameId: '84AC261A351B86932B775B76D1DD79F8',
      resourceType: 'Document',
      networkId: '11ACE9783588040D644B905E8B55285B',
    });
    mockCDPSession.emit('Fetch.requestPaused', {
      requestId: 'interception-job-2.0',
      request: {
        url: 'https://www.google.com/',
        method: 'GET',
        headers: [Object],
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
      },
      frameId: '84AC261A351B86932B775B76D1DD79F8',
      resourceType: 'Document',
      networkId: '11ACE9783588040D644B905E8B55285B',
    });

    expect(requests).toHaveLength(2);
  });
  it(`should handle Network.responseReceivedExtraInfo event after Network.responseReceived event (github.com/puppeteer/puppeteer/issues/8234)`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });

    const requests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.RequestFinished,
      (request: HTTPRequest) => {
        requests.push(request);
      }
    );

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '1360.2',
      loaderId: '9E86B0282CC98B77FB0ABD49156DDFDD',
      documentURL: 'http://this.is.the.start.page.com/',
      request: {
        url: 'http://this.is.a.test.com:1080/test.js',
        method: 'GET',
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          Referer: 'http://this.is.the.start.page.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'High',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: false,
      },
      timestamp: 10959.020087,
      wallTime: 1649712607.861365,
      initiator: {
        type: 'parser',
        url: 'http://this.is.the.start.page.com/',
        lineNumber: 9,
        columnNumber: 80,
      },
      redirectHasExtraInfo: false,
      type: 'Script',
      frameId: '60E6C35E7E519F28E646056820095498',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.responseReceived', {
      requestId: '1360.2',
      loaderId: '9E86B0282CC98B77FB0ABD49156DDFDD',
      timestamp: 10959.042529,
      type: 'Script',
      response: {
        url: 'http://this.is.a.test.com:1080',
        status: 200,
        statusText: 'OK',
        headers: {
          connection: 'keep-alive',
          'content-length': '85862',
        },
        mimeType: 'text/plain',
        connectionReused: false,
        connectionId: 119,
        remoteIPAddress: '127.0.0.1',
        remotePort: 1080,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 66,
        timing: {
          requestTime: 10959.023904,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: 0.328,
          dnsEnd: 2.183,
          connectStart: 2.183,
          connectEnd: 2.798,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 2.982,
          sendEnd: 3.757,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 16.373,
        },
        responseTime: 1649712607880.971,
        protocol: 'http/1.1',
        securityState: 'insecure',
      },
      hasExtraInfo: true,
      frameId: '60E6C35E7E519F28E646056820095498',
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '1360.2',
      blockedCookies: [],
      headers: {
        connection: 'keep-alive',
        'content-length': '85862',
      },
      resourceIPAddressSpace: 'Private',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\r\nconnection: keep-alive\r\ncontent-length: 85862\r\n\r\n',
    });
    mockCDPSession.emit('Network.loadingFinished', {
      requestId: '1360.2',
      timestamp: 10959.060708,
      encodedDataLength: 85928,
      shouldReportCorbBlocking: false,
    });

    expect(requests).toHaveLength(1);
  });

  it(`should resolve the response once the late responseReceivedExtraInfo event arrives`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });

    const finishedRequests: HTTPRequest[] = [];
    const pendingRequests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.RequestFinished,
      (request: HTTPRequest) => {
        finishedRequests.push(request);
      }
    );

    manager.on(NetworkManagerEmittedEvents.Request, (request: HTTPRequest) => {
      pendingRequests.push(request);
    });

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: 'LOADERID',
      loaderId: 'LOADERID',
      documentURL: 'http://10.1.0.39:42915/empty.html',
      request: {
        url: 'http://10.1.0.39:42915/empty.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 671.229856,
      wallTime: 1660121157.913774,
      initiator: {type: 'other'},
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: 'FRAMEID',
      hasUserGesture: false,
    });

    mockCDPSession.emit('Network.responseReceived', {
      requestId: 'LOADERID',
      loaderId: 'LOADERID',
      timestamp: 671.236025,
      type: 'Document',
      response: {
        url: 'http://10.1.0.39:42915/empty.html',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
          'Content-Length': '0',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Wed, 10 Aug 2022 08:45:57 GMT',
          'Keep-Alive': 'timeout=5',
        },
        mimeType: 'text/html',
        connectionReused: true,
        connectionId: 18,
        remoteIPAddress: '10.1.0.39',
        remotePort: 42915,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 197,
        timing: {
          requestTime: 671.232585,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.308,
          sendEnd: 0.364,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 1.554,
        },
        responseTime: 1.660121157917951e12,
        protocol: 'http/1.1',
        securityState: 'insecure',
      },
      hasExtraInfo: true,
      frameId: 'FRAMEID',
    });

    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: 'LOADERID',
      associatedCookies: [],
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'keep-alive',
        Host: '10.1.0.39:42915',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      },
      connectTiming: {requestTime: 671.232585},
    });

    mockCDPSession.emit('Network.loadingFinished', {
      requestId: 'LOADERID',
      timestamp: 671.234448,
      encodedDataLength: 197,
      shouldReportCorbBlocking: false,
    });

    expect(pendingRequests).toHaveLength(1);
    expect(finishedRequests).toHaveLength(0);
    expect(pendingRequests[0]!.response()).toEqual(null);

    // The extra info might arrive late.
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: 'LOADERID',
      blockedCookies: [],
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'text/html; charset=utf-8',
        Date: 'Wed, 10 Aug 2022 09:04:39 GMT',
        'Keep-Alive': 'timeout=5',
      },
      resourceIPAddressSpace: 'Private',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\\r\\nCache-Control: no-cache, no-store\\r\\nContent-Type: text/html; charset=utf-8\\r\\nDate: Wed, 10 Aug 2022 09:04:39 GMT\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=5\\r\\nContent-Length: 0\\r\\n\\r\\n',
    });

    expect(pendingRequests).toHaveLength(1);
    expect(finishedRequests).toHaveLength(1);
    expect(pendingRequests[0]!.response()).not.toEqual(null);
  });

  it(`should send responses for iframe that don't receive loadingFinished event`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });

    const responses: HTTPResponse[] = [];
    const requests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.Response,
      (response: HTTPResponse) => {
        responses.push(response);
      }
    );

    manager.on(NetworkManagerEmittedEvents.Request, (request: HTTPRequest) => {
      requests.push(request);
    });

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '94051D839ACF29E53A3D1273FB20B4C4',
      loaderId: '94051D839ACF29E53A3D1273FB20B4C4',
      documentURL: 'http://127.0.0.1:54590/empty.html',
      request: {
        url: 'http://127.0.0.1:54590/empty.html',
        method: 'GET',
        headers: {
          Referer: 'http://localhost:54590/',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/105.0.5173.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: false,
      },
      timestamp: 504903.99901,
      wallTime: 1660125092.026021,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [
            {
              functionName: 'navigateFrame',
              scriptId: '8',
              url: 'pptr://__puppeteer_evaluation_script__',
              lineNumber: 2,
              columnNumber: 18,
            },
          ],
        },
      },
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: '07D18B8630A8161C72B6079B74123D60',
      hasUserGesture: true,
    });

    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '94051D839ACF29E53A3D1273FB20B4C4',
      associatedCookies: [],
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        Host: '127.0.0.1:54590',
        Referer: 'http://localhost:54590/',
        'Sec-Fetch-Dest': 'iframe',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/105.0.5173.0 Safari/537.36',
      },
      connectTiming: {requestTime: 504904.000422},
      clientSecurityState: {
        initiatorIsSecureContext: true,
        initiatorIPAddressSpace: 'Local',
        privateNetworkRequestPolicy: 'Allow',
      },
    });

    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '94051D839ACF29E53A3D1273FB20B4C4',
      blockedCookies: [],
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'text/html; charset=utf-8',
        Date: 'Wed, 10 Aug 2022 09:51:32 GMT',
        'Keep-Alive': 'timeout=5',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\r\nCache-Control: no-cache, no-store\r\nContent-Type: text/html; charset=utf-8\r\nDate: Wed, 10 Aug 2022 09:51:32 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nContent-Length: 0\r\n\r\n',
    });

    mockCDPSession.emit('Network.responseReceived', {
      requestId: '94051D839ACF29E53A3D1273FB20B4C4',
      loaderId: '94051D839ACF29E53A3D1273FB20B4C4',
      timestamp: 504904.00338,
      type: 'Document',
      response: {
        url: 'http://127.0.0.1:54590/empty.html',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
          'Content-Length': '0',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Wed, 10 Aug 2022 09:51:32 GMT',
          'Keep-Alive': 'timeout=5',
        },
        mimeType: 'text/html',
        connectionReused: true,
        connectionId: 13,
        remoteIPAddress: '127.0.0.1',
        remotePort: 54590,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 197,
        timing: {
          requestTime: 504904.000422,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.338,
          sendEnd: 0.413,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 1.877,
        },
        responseTime: 1.660125092029241e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      hasExtraInfo: true,
      frameId: '07D18B8630A8161C72B6079B74123D60',
    });

    expect(requests).toHaveLength(1);
    expect(responses).toHaveLength(1);
    expect(requests[0]!.response()).not.toEqual(null);
  });

  it(`should send responses for iframe that don't receive loadingFinished event`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });

    const responses: HTTPResponse[] = [];
    const requests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.Response,
      (response: HTTPResponse) => {
        responses.push(response);
      }
    );

    manager.on(NetworkManagerEmittedEvents.Request, (request: HTTPRequest) => {
      requests.push(request);
    });

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      loaderId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      documentURL: 'http://localhost:56295/empty.html',
      request: {
        url: 'http://localhost:56295/empty.html',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/105.0.5173.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 510294.105656,
      wallTime: 1660130482.230591,
      initiator: {type: 'other'},
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: 'F9C89A517341F1EFFE63310141630189',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.responseReceived', {
      requestId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      loaderId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      timestamp: 510294.119816,
      type: 'Document',
      response: {
        url: 'http://localhost:56295/empty.html',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          Connection: 'keep-alive',
          'Content-Length': '0',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Wed, 10 Aug 2022 11:21:22 GMT',
          'Keep-Alive': 'timeout=5',
        },
        mimeType: 'text/html',
        connectionReused: true,
        connectionId: 13,
        remoteIPAddress: '[::1]',
        remotePort: 56295,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 197,
        timing: {
          requestTime: 510294.106734,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 2.195,
          sendEnd: 2.29,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 6.493,
        },
        responseTime: 1.660130482238109e12,
        protocol: 'http/1.1',
        securityState: 'secure',
      },
      hasExtraInfo: true,
      frameId: 'F9C89A517341F1EFFE63310141630189',
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      associatedCookies: [],
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        Host: 'localhost:56295',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/105.0.5173.0 Safari/537.36',
      },
      connectTiming: {requestTime: 510294.106734},
    });
    mockCDPSession.emit('Network.loadingFinished', {
      requestId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      timestamp: 510294.113383,
      encodedDataLength: 197,
      shouldReportCorbBlocking: false,
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: 'E18BEB94B486CA8771F9AFA2030FEA37',
      blockedCookies: [],
      headers: {
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'Content-Length': '0',
        'Content-Type': 'text/html; charset=utf-8',
        Date: 'Wed, 10 Aug 2022 11:21:22 GMT',
        'Keep-Alive': 'timeout=5',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\r\nCache-Control: no-cache, no-store\r\nContent-Type: text/html; charset=utf-8\r\nDate: Wed, 10 Aug 2022 11:21:22 GMT\r\nConnection: keep-alive\r\nKeep-Alive: timeout=5\r\nContent-Length: 0\r\n\r\n',
    });

    expect(requests).toHaveLength(1);
    expect(responses).toHaveLength(1);
    expect(requests[0]!.response()).not.toEqual(null);
  });

  it(`should handle cached redirects`, async () => {
    const mockCDPSession = new MockCDPSession();
    const manager = new NetworkManager(mockCDPSession, true, {
      frame(): Frame | null {
        return null;
      },
    });

    const responses: HTTPResponse[] = [];
    const requests: HTTPRequest[] = [];
    manager.on(
      NetworkManagerEmittedEvents.Response,
      (response: HTTPResponse) => {
        responses.push(response);
      }
    );

    manager.on(NetworkManagerEmittedEvents.Request, (request: HTTPRequest) => {
      requests.push(request);
    });

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '6D76C8ACAECE880C722FA515AD380015',
      loaderId: '6D76C8ACAECE880C722FA515AD380015',
      documentURL: 'http://localhost:3000/',
      request: {
        url: 'http://localhost:3000/',
        method: 'GET',
        headers: {
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 31949.95878,
      wallTime: 1680698353.570949,
      initiator: {type: 'other'},
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: '4A6E05B1781795F1B586C1F8F8B2CBE4',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '6D76C8ACAECE880C722FA515AD380015',
      associatedCookies: [],
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        Connection: 'keep-alive',
        Host: 'localhost:3000',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'sec-ch-ua-mobile': '?0',
      },
      connectTiming: {requestTime: 31949.959838},
      siteHasCookieInOtherPartition: false,
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '6D76C8ACAECE880C722FA515AD380015',
      blockedCookies: [],
      headers: {
        'Cache-Control': 'max-age=5',
        Connection: 'keep-alive',
        'Content-Type': 'text/html; charset=utf-8',
        Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
        'Keep-Alive': 'timeout=5',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 200,
      headersText:
        'HTTP/1.1 200 OK\\r\\nContent-Type: text/html; charset=utf-8\\r\\nCache-Control: max-age=5\\r\\nDate: Wed, 05 Apr 2023 12:39:13 GMT\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=5\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n',
      cookiePartitionKey: 'http://localhost',
      cookiePartitionKeyOpaque: false,
    });

    mockCDPSession.emit('Network.responseReceived', {
      requestId: '6D76C8ACAECE880C722FA515AD380015',
      loaderId: '6D76C8ACAECE880C722FA515AD380015',
      timestamp: 31949.965149,
      type: 'Document',
      response: {
        url: 'http://localhost:3000/',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'max-age=5',
          Connection: 'keep-alive',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
          'Keep-Alive': 'timeout=5',
          'Transfer-Encoding': 'chunked',
        },
        mimeType: 'text/html',
        connectionReused: true,
        connectionId: 34,
        remoteIPAddress: '127.0.0.1',
        remotePort: 3000,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 197,
        timing: {
          requestTime: 31949.959838,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.613,
          sendEnd: 0.665,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 3.619,
        },
        responseTime: 1.680698353573552e12,
        protocol: 'http/1.1',
        alternateProtocolUsage: 'unspecifiedReason',
        securityState: 'secure',
      },
      hasExtraInfo: true,
      frameId: '4A6E05B1781795F1B586C1F8F8B2CBE4',
    });
    mockCDPSession.emit('Network.loadingFinished', {
      requestId: '6D76C8ACAECE880C722FA515AD380015',
      timestamp: 31949.963861,
      encodedDataLength: 847,
      shouldReportCorbBlocking: false,
    });

    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      loaderId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      documentURL: 'http://localhost:3000/redirect',
      request: {
        url: 'http://localhost:3000/redirect',
        method: 'GET',
        headers: {
          Referer: 'http://localhost:3000/',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          'sec-ch-ua-mobile': '?0',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 31949.982895,
      wallTime: 1680698353.595079,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [
            {
              functionName: '',
              scriptId: '5',
              url: 'http://localhost:3000/',
              lineNumber: 8,
              columnNumber: 32,
            },
          ],
        },
      },
      redirectHasExtraInfo: false,
      type: 'Document',
      frameId: '4A6E05B1781795F1B586C1F8F8B2CBE4',
      hasUserGesture: false,
    });

    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      associatedCookies: [],
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        Connection: 'keep-alive',
        Host: 'localhost:3000',
        Referer: 'http://localhost:3000/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
        'sec-ch-ua-mobile': '?0',
      },
      connectTiming: {requestTime: 31949.983605},
      siteHasCookieInOtherPartition: false,
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      blockedCookies: [],
      headers: {
        Connection: 'keep-alive',
        Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
        'Keep-Alive': 'timeout=5',
        Location: 'http://localhost:3000/#from-redirect',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 302,
      headersText:
        'HTTP/1.1 302 Found\\r\\nLocation: http://localhost:3000/#from-redirect\\r\\nDate: Wed, 05 Apr 2023 12:39:13 GMT\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=5\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n',
      cookiePartitionKey: 'http://localhost',
      cookiePartitionKeyOpaque: false,
    });
    mockCDPSession.emit('Network.requestWillBeSent', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      loaderId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      documentURL: 'http://localhost:3000/',
      request: {
        url: 'http://localhost:3000/',
        urlFragment: '#from-redirect',
        method: 'GET',
        headers: {
          Referer: 'http://localhost:3000/',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          'sec-ch-ua-mobile': '?0',
        },
        mixedContentType: 'none',
        initialPriority: 'VeryHigh',
        referrerPolicy: 'strict-origin-when-cross-origin',
        isSameSite: true,
      },
      timestamp: 31949.988506,
      wallTime: 1680698353.60069,
      initiator: {
        type: 'script',
        stack: {
          callFrames: [
            {
              functionName: '',
              scriptId: '5',
              url: 'http://localhost:3000/',
              lineNumber: 8,
              columnNumber: 32,
            },
          ],
        },
      },
      redirectHasExtraInfo: true,
      redirectResponse: {
        url: 'http://localhost:3000/redirect',
        status: 302,
        statusText: 'Found',
        headers: {
          Connection: 'keep-alive',
          Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
          'Keep-Alive': 'timeout=5',
          Location: 'http://localhost:3000/#from-redirect',
          'Transfer-Encoding': 'chunked',
        },
        mimeType: '',
        connectionReused: true,
        connectionId: 34,
        remoteIPAddress: '127.0.0.1',
        remotePort: 3000,
        fromDiskCache: false,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 182,
        timing: {
          requestTime: 31949.983605,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.364,
          sendEnd: 0.401,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 4.085,
        },
        responseTime: 1.680698353596548e12,
        protocol: 'http/1.1',
        alternateProtocolUsage: 'unspecifiedReason',
        securityState: 'secure',
      },
      type: 'Document',
      frameId: '4A6E05B1781795F1B586C1F8F8B2CBE4',
      hasUserGesture: false,
    });
    mockCDPSession.emit('Network.requestWillBeSentExtraInfo', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      associatedCookies: [],
      headers: {},
      connectTiming: {requestTime: 31949.988855},
      siteHasCookieInOtherPartition: false,
    });

    mockCDPSession.emit('Network.responseReceived', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      loaderId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      timestamp: 31949.991319,
      type: 'Document',
      response: {
        url: 'http://localhost:3000/',
        status: 200,
        statusText: 'OK',
        headers: {
          'Cache-Control': 'max-age=5',
          'Content-Type': 'text/html; charset=utf-8',
          Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
        },
        mimeType: 'text/html',
        connectionReused: false,
        connectionId: 0,
        remoteIPAddress: '127.0.0.1',
        remotePort: 3000,
        fromDiskCache: true,
        fromServiceWorker: false,
        fromPrefetchCache: false,
        encodedDataLength: 0,
        timing: {
          requestTime: 31949.988855,
          proxyStart: -1,
          proxyEnd: -1,
          dnsStart: -1,
          dnsEnd: -1,
          connectStart: -1,
          connectEnd: -1,
          sslStart: -1,
          sslEnd: -1,
          workerStart: -1,
          workerReady: -1,
          workerFetchStart: -1,
          workerRespondWithSettled: -1,
          sendStart: 0.069,
          sendEnd: 0.069,
          pushStart: 0,
          pushEnd: 0,
          receiveHeadersEnd: 0.321,
        },
        responseTime: 1.680698353573552e12,
        protocol: 'http/1.1',
        alternateProtocolUsage: 'unspecifiedReason',
        securityState: 'secure',
      },
      hasExtraInfo: true,
      frameId: '4A6E05B1781795F1B586C1F8F8B2CBE4',
    });
    mockCDPSession.emit('Network.responseReceivedExtraInfo', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      blockedCookies: [],
      headers: {
        Connection: 'keep-alive',
        Date: 'Wed, 05 Apr 2023 12:39:13 GMT',
        'Keep-Alive': 'timeout=5',
        Location: 'http://localhost:3000/#from-redirect',
        'Transfer-Encoding': 'chunked',
      },
      resourceIPAddressSpace: 'Local',
      statusCode: 302,
      headersText:
        'HTTP/1.1 302 Found\\r\\nLocation: http://localhost:3000/#from-redirect\\r\\nDate: Wed, 05 Apr 2023 12:39:13 GMT\\r\\nConnection: keep-alive\\r\\nKeep-Alive: timeout=5\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n',
      cookiePartitionKey: 'http://localhost',
      cookiePartitionKeyOpaque: false,
    });
    mockCDPSession.emit('Network.loadingFinished', {
      requestId: '4C2CC44FB6A6CAC5BE2780BCC9313105',
      timestamp: 31949.989412,
      encodedDataLength: 0,
      shouldReportCorbBlocking: false,
    });
    expect(
      responses.map(r => {
        return r.status();
      })
    ).toEqual([200, 302, 200]);
  });
});

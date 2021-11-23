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

import { describeChromeOnly } from './mocha-utils'; // eslint-disable-line import/extensions

import { NetworkManager } from '../lib/cjs/puppeteer/common/NetworkManager.js';
import { EventEmitter } from '../lib/cjs/puppeteer/common/EventEmitter.js';
import { Frame } from '../lib/cjs/puppeteer/common/FrameManager.js';

describeChromeOnly('NetworkManager', () => {
  it('should process extra info on multiple redirects', async () => {
    class MockCDPSession extends EventEmitter {
      send(): any {}
    }

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
      initiator: { type: 'other' },
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
      connectTiming: { requestTime: 2111.557593 },
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
      initiator: { type: 'other' },
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
      connectTiming: { requestTime: 2111.559346 },
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
      initiator: { type: 'other' },
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
      connectTiming: { requestTime: 2111.560482 },
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
      initiator: { type: 'other' },
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
      connectTiming: { requestTime: 2111.561759 },
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
});

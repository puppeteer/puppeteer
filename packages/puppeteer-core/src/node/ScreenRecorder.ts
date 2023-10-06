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

import {PassThrough} from 'stream';

import type Protocol from 'devtools-protocol';

import type {Observable} from '../../third_party/rxjs/rxjs.js';
import {
  filter,
  fromEvent,
  lastValueFrom,
  map,
  scan,
  takeUntil,
  tap,
} from '../../third_party/rxjs/rxjs.js';
import {CDPSessionEvent} from '../api/CDPSession.js';
import type {BoundingBox} from '../api/ElementHandle.js';
import type {JSHandle} from '../api/JSHandle.js';
import type {Page} from '../api/Page.js';
import {debugError} from '../common/util.js';
import {guarded} from '../util/decorators.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

const DEFAULT_FPS = 30;

/**
 * @public
 */
export interface ScreenRecorderOptions {
  /**
   * Specifies the region of the viewport to crop.
   */
  crop?: BoundingBox;
  /**
   * Scales the output video.
   *
   * For example, `0.5` will shrink the width and height of the output video by
   * half. `2` will double the width and height of the output video.
   *
   * @defaultValue `1`
   */
  scale?: number;
  /**
   * Specifies the speed to record at.
   *
   * For example, `0.5` will slowdown the output video by 50%. `2` will double
   * the speed of the output video.
   *
   * @defaultValue `1`
   */
  speed?: number;
}

interface FrameRenderer {
  queue(frame: readonly [frame: string, duration: number]): void;
  flush(): Promise<void>;
}

/**
 * @public
 */
export class ScreenRecorder extends PassThrough {
  #page: Page;

  #renderer: Promise<JSHandle<FrameRenderer>>;

  #controller = new AbortController();
  #lastFrame: Promise<readonly [string, number]>;

  /**
   * @internal
   */
  constructor(
    renderer: Page,
    target: Page,
    width: number,
    height: number,
    options: ScreenRecorderOptions = {}
  ) {
    super();

    this.#page = target;
    void this.#page.bringToFront();

    void renderer.exposeFunction('sendChunk', (chunk: string) => {
      this.write(chunk, 'base64');
    });
    this.#renderer = renderer.evaluateHandle(
      async (width, height, options) => {
        type WorkerMessage =
          | {type: 'success'; id: number; image: ImageBitmap}
          | {type: 'failure'; id: number};

        class Renderer implements FrameRenderer {
          readonly #rendered: Array<
            Promise<[bitmap: ImageBitmap, duration: number] | undefined>
          > = [];
          readonly #promises = new Map<
            number,
            (bitmap: ImageBitmap | undefined) => void
          >();
          readonly #controller = new AbortController();
          readonly #loop: Promise<void>;
          readonly #canvas: HTMLCanvasElement;
          readonly #recorder: MediaRecorder;
          readonly #worker: Worker;

          constructor(mimeType: string) {
            this.#canvas = document.body.appendChild(
              document.createElement('canvas')
            );
            this.#canvas.width = width;
            this.#canvas.height = height;
            if (options.crop) {
              this.#canvas.width = options.crop.width;
              this.#canvas.height = options.crop.height;
            }
            if (options.scale) {
              this.#canvas.width *= options.scale;
              this.#canvas.height *= options.scale;
            }

            this.#recorder = new MediaRecorder(this.#canvas.captureStream(0), {
              mimeType,
            });

            // This will send our renderings back to Puppeteer.
            this.#recorder.addEventListener('dataavailable', async event => {
              if (event.data.size === 0) {
                return;
              }
              let binary = '';
              const buffer = await event.data.arrayBuffer();
              const view = new Uint8Array(buffer);
              for (const byte of view) {
                binary += String.fromCharCode(byte);
              }
              await (window as any).sendChunk(btoa(binary));
            });

            this.#recorder.start(1000);
            this.#recorder.pause();

            this.#worker = new Worker(
              URL.createObjectURL(
                new Blob(
                  [
                    `(${String(
                      (x: number, y: number, width: number, height: number) => {
                        self.addEventListener('message', async event => {
                          const {id, data} = event.data;
                          try {
                            const binary = atob(data);
                            const buffer = new ArrayBuffer(binary.length);
                            const view = new Uint8Array(buffer);
                            for (let i = 0; i < view.length; ++i) {
                              view[i] = binary.charCodeAt(i);
                            }
                            const image = await self.createImageBitmap(
                              new Blob([buffer], {type: 'image/png'}),
                              x,
                              y,
                              width,
                              height
                            );
                            self.postMessage(
                              {
                                type: 'success',
                                id,
                                image,
                              } satisfies WorkerMessage,
                              {transfer: [image]}
                            );
                          } catch {
                            self.postMessage({
                              type: 'failure',
                              id,
                            } satisfies WorkerMessage);
                          }
                        });
                      }
                    )})(${options.crop?.x ?? 0},${options.crop?.y ?? 0},${
                      this.#canvas.width / (options.scale ?? 1)
                    },${this.#canvas.height / (options.scale ?? 1)})`,
                  ],
                  {type: 'application/javascript'}
                )
              )
            );
            this.#worker.addEventListener(
              'message',
              (event: MessageEvent<WorkerMessage>) => {
                const {type, id} = event.data;
                const resolve = this.#promises.get(id)!;
                switch (type) {
                  case 'success':
                    resolve(event.data.image);
                    break;
                  case 'failure':
                    resolve(undefined);
                    break;
                }
                this.#promises.delete(id);
              }
            );

            // This loop renders the frames to video.
            this.#loop = this.#run();
          }

          async #run() {
            const track =
              this.#recorder.stream.getTracks()[0] as CanvasCaptureMediaStreamTrack;
            const context = this.#canvas.getContext('2d')!;
            while (
              this.#rendered.length > 0 ||
              !this.#controller.signal.aborted
            ) {
              const rendered = await this.#rendered.shift();
              if (!rendered) {
                await new Promise(resolve => {
                  window.setTimeout(resolve, 10);
                });
                continue;
              }
              const [bitmap, duration] = rendered;

              // Scaling is done automatically here.
              context.drawImage(
                bitmap,
                0,
                0,
                this.#canvas.width,
                this.#canvas.height
              );

              this.#recorder.resume();
              track.requestFrame();
              await new Promise(resolve => {
                setTimeout(
                  resolve,
                  duration * 1000 * (1 / (options.speed ?? 1))
                );
              });
              this.#recorder.pause();
            }
          }

          #i = 0;
          queue([base64, duration]: readonly [
            frame: string,
            duration: number,
          ]) {
            try {
              const id = this.#i++;
              this.#worker.postMessage({id, data: base64});
              this.#rendered.push(
                new Promise(resolve => {
                  this.#promises.set(id, (bitmap: ImageBitmap | undefined) => {
                    resolve(bitmap && [bitmap, duration]);
                  });
                })
              );
            } catch {}
          }

          async flush() {
            this.#controller.abort();
            await this.#loop;
            const stopped = new Promise(resolve => {
              this.#recorder.addEventListener('stop', resolve, {
                once: true,
              });
            });
            this.#recorder.stop();
            this.#worker.terminate();
            await stopped;
          }
        }
        return new Renderer('video/webm;codecs=vp9');
      },
      width,
      height,
      options
    );

    const {client} = this.#page.mainFrame();
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.stop().catch(debugError);
    });

    this.#lastFrame = lastValueFrom(
      (
        fromEvent(
          client,
          'Page.screencastFrame'
        ) as Observable<Protocol.Page.ScreencastFrameEvent>
      ).pipe(
        tap(event => {
          void client.send('Page.screencastFrameAck', {
            sessionId: event.sessionId,
          });
        }),
        filter(event => {
          return event.metadata.timestamp !== undefined;
        }),
        map(event => {
          return {
            frame: event.data,
            timestamp: event.metadata.timestamp!,
          };
        }),
        scan(
          (
            {frame, timestamp, duration, next},
            {frame: nextFrame, timestamp: nextTimestamp}
          ) => {
            if (timestamp === 0) {
              timestamp = nextTimestamp;
            }
            if (next) {
              frame = nextFrame;
              duration = 0;
            }
            const nextDuration = duration + (nextTimestamp - timestamp);
            return {
              frame,
              duration: nextDuration,
              timestamp: nextTimestamp,
              next: nextDuration >= 1 / DEFAULT_FPS,
            };
          },
          {frame: '', timestamp: 0, duration: 0, next: true}
        ),
        filter(({next}) => {
          return next;
        }),
        map(({frame, duration}) => {
          return [frame, duration] as const;
        }),
        takeUntil(fromEvent(this.#controller.signal, 'abort')),
        map(frame => {
          void this.#writeFrame(frame);
          return [frame, performance.now()] as const;
        })
      ),
      {defaultValue: ['', performance.now()] as const}
    ) as Promise<readonly [string, number]>;
  }

  @guarded()
  async #writeFrame(frame: readonly [frame: string, duration: number]) {
    await (
      await this.#renderer
    ).evaluate((renderer, frame) => {
      renderer.queue(frame);
    }, frame);
  }

  /**
   * Stops the recorder.
   *
   * @public
   */
  @guarded()
  async stop(): Promise<void> {
    if (this.#controller.signal.aborted) {
      return;
    }
    // Stopping the screencast will flush the frames.
    await this.#page._stopScreencast().catch(debugError);

    this.#controller.abort();

    // Repeat the last frame for the remaining frames.
    const [buffer, timestamp] = await this.#lastFrame;
    await this.#writeFrame([buffer, (performance.now() - timestamp) / 1000]);

    await (
      await this.#renderer
    ).evaluate(renderer => {
      return renderer.flush();
    });
    await new Promise(resolve => {
      return this.end(resolve);
    });
  }

  /**
   * @internal
   */
  async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
  }
}

/**
 * Copyright 2022 Google Inc. All rights reserved.
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

import {type Frame} from '../api/Frame.js';
import {Deferred} from '../util/Deferred.js';

/**
 * Keeps track of the page frame tree and it's is managed by
 * {@link FrameManager}. FrameTree uses frame IDs to reference frame and it
 * means that referenced frames might not be in the tree anymore. Thus, the tree
 * structure is eventually consistent.
 * @internal
 */
export class FrameTree<FrameType extends Frame> {
  #frames = new Map<string, FrameType>();
  // frameID -> parentFrameID
  #parentIds = new Map<string, string>();
  // frameID -> childFrameIDs
  #childIds = new Map<string, Set<string>>();
  #mainFrame?: FrameType;
  #waitRequests = new Map<string, Set<Deferred<FrameType>>>();

  getMainFrame(): FrameType | undefined {
    return this.#mainFrame;
  }

  getById(frameId: string): FrameType | undefined {
    return this.#frames.get(frameId);
  }

  /**
   * Returns a promise that is resolved once the frame with
   * the given ID is added to the tree.
   */
  waitForFrame(frameId: string): Promise<FrameType> {
    const frame = this.getById(frameId);
    if (frame) {
      return Promise.resolve(frame);
    }
    const deferred = Deferred.create<FrameType>();
    const callbacks =
      this.#waitRequests.get(frameId) || new Set<Deferred<FrameType>>();
    callbacks.add(deferred);
    return deferred.valueOrThrow();
  }

  frames(): FrameType[] {
    return Array.from(this.#frames.values());
  }

  addFrame(frame: FrameType): void {
    this.#frames.set(frame._id, frame);
    if (frame._parentId) {
      this.#parentIds.set(frame._id, frame._parentId);
      if (!this.#childIds.has(frame._parentId)) {
        this.#childIds.set(frame._parentId, new Set());
      }
      this.#childIds.get(frame._parentId)!.add(frame._id);
    } else if (!this.#mainFrame) {
      this.#mainFrame = frame;
    }
    this.#waitRequests.get(frame._id)?.forEach(request => {
      return request.resolve(frame);
    });
  }

  removeFrame(frame: FrameType): void {
    this.#frames.delete(frame._id);
    this.#parentIds.delete(frame._id);
    if (frame._parentId) {
      this.#childIds.get(frame._parentId)?.delete(frame._id);
    } else {
      this.#mainFrame = undefined;
    }
  }

  childFrames(frameId: string): FrameType[] {
    const childIds = this.#childIds.get(frameId);
    if (!childIds) {
      return [];
    }
    return Array.from(childIds)
      .map(id => {
        return this.getById(id);
      })
      .filter((frame): frame is FrameType => {
        return frame !== undefined;
      });
  }

  parentFrame(frameId: string): FrameType | undefined {
    const parentId = this.#parentIds.get(frameId);
    return parentId ? this.getById(parentId) : undefined;
  }
}

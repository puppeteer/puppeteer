/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Bidi from 'chromium-bidi/lib/cjs/protocol/protocol.js';

import {Point} from '../../api/ElementHandle.js';
import {
  Mouse as BaseMouse,
  MouseButton,
  MouseClickOptions,
  MouseMoveOptions,
  MouseOptions,
  MouseWheelOptions,
  Touchscreen as BaseTouchscreen,
} from '../../api/Input.js';

import {BrowsingContext} from './BrowsingContext.js';

/**
 * @internal
 */
interface BidiMouseClickOptions extends MouseClickOptions {
  origin?: Bidi.Input.Origin;
}

/**
 * @internal
 */
interface BidiMouseMoveOptions extends MouseMoveOptions {
  origin?: Bidi.Input.Origin;
}

/**
 * @internal
 */
interface BidiTouchMoveOptions {
  origin?: Bidi.Input.Origin;
}

const getBidiButton = (button: MouseButton) => {
  switch (button) {
    case MouseButton.Left:
      return 0;
    case MouseButton.Middle:
      return 1;
    case MouseButton.Right:
      return 2;
    case MouseButton.Back:
      return 3;
    case MouseButton.Forward:
      return 4;
  }
};

/**
 * @internal
 */
export class Mouse extends BaseMouse {
  #context: BrowsingContext;
  #lastMovePoint?: Point;

  /**
   * @internal
   */
  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
  }

  override async reset(): Promise<void> {
    this.#lastMovePoint = undefined;
    await this.#context.connection.send('input.releaseActions', {
      context: this.#context.id,
    });
  }

  override async move(
    x: number,
    y: number,
    options: Readonly<BidiMouseMoveOptions> = {}
  ): Promise<void> {
    this.#lastMovePoint = {
      x,
      y,
    };
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              duration: (options.steps ?? 0) * 50,
              origin: options.origin,
            },
          ],
        },
      ],
    });
  }

  override async down(options: Readonly<MouseOptions> = {}): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          actions: [
            {
              type: Bidi.Input.ActionType.PointerDown,
              button: getBidiButton(options.button ?? MouseButton.Left),
            },
          ],
        },
      ],
    });
  }

  override async up(options: Readonly<MouseOptions> = {}): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          actions: [
            {
              type: Bidi.Input.ActionType.PointerUp,
              button: getBidiButton(options.button ?? MouseButton.Left),
            },
          ],
        },
      ],
    });
  }

  override async click(
    x: number,
    y: number,
    options: Readonly<BidiMouseClickOptions> = {}
  ): Promise<void> {
    const actions: Bidi.Input.PointerSourceAction[] = [
      {
        type: Bidi.Input.ActionType.PointerMove,
        x,
        y,
        origin: options.origin,
      },
    ];
    const pointerDownAction = {
      type: Bidi.Input.ActionType.PointerDown,
      button: getBidiButton(options.button ?? MouseButton.Left),
    } as const;
    const pointerUpAction = {
      type: Bidi.Input.ActionType.PointerUp,
      button: pointerDownAction.button,
    } as const;
    for (let i = 1; i < (options.count ?? 1); ++i) {
      actions.push(pointerDownAction, pointerUpAction);
    }
    actions.push(pointerDownAction);
    if (options.delay) {
      actions.push({
        type: Bidi.Input.ActionType.Pause,
        duration: options.delay,
      });
    }
    actions.push(pointerUpAction);
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          actions,
        },
      ],
    });
  }

  override async wheel(
    options: Readonly<MouseWheelOptions> = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Wheel,
          id: 'main',
          actions: [
            {
              type: Bidi.Input.ActionType.Scroll,
              ...(this.#lastMovePoint ?? {
                x: 0,
                y: 0,
              }),
              deltaX: options.deltaX ?? 0,
              deltaY: options.deltaY ?? 0,
            },
          ],
        },
      ],
    });
  }
}

/**
 * @internal
 */
export class Touchscreen extends BaseTouchscreen {
  #context: BrowsingContext;

  /**
   * @internal
   */
  constructor(context: BrowsingContext) {
    super();
    this.#context = context;
  }

  override async tap(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.touchStart(x, y, options);
    await this.touchEnd();
  }

  override async touchStart(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              origin: options.origin,
            },
            {
              type: Bidi.Input.ActionType.PointerDown,
              button: 0,
            },
          ],
        },
      ],
    });
  }

  override async touchMove(
    x: number,
    y: number,
    options: BidiTouchMoveOptions = {}
  ): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerMove,
              x,
              y,
              origin: options.origin,
            },
          ],
        },
      ],
    });
  }

  override async touchEnd(): Promise<void> {
    await this.#context.connection.send('input.performActions', {
      context: this.#context.id,
      actions: [
        {
          type: Bidi.Input.SourceActionsType.Pointer,
          id: 'main',
          parameters: {
            pointerType: Bidi.Input.PointerType.Touch,
          },
          actions: [
            {
              type: Bidi.Input.ActionType.PointerUp,
              button: 0,
            },
          ],
        },
      ],
    });
  }
}

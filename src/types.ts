export type AnyFunction = (...args: any[]) => unknown;

export interface ConnectionTransport {
    send(value: string): void;
    close(): void;
    onmessage?(message: string): void;
    onclose?(): void;
}

export interface Viewport {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
    isLandscape?: boolean;
    hasTouch?: boolean;
}

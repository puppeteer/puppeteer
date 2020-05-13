export type Metrics = {
  Timestamp?: number;
  Documents?: number;
  Frames?: number;
  JSEventListeners?: number;
  Nodes?: number;
  LayoutCount?: number;
  RecalcStyleCount?: number;
  LayoutDuration?: number;
  RecalcStyleDuration?: number;
  ScriptDuration?: number;
  TaskDuration?: number;
  JSHeapUsedSize?: number;
  JSHeapTotalSize?: number;
}

export type WaitForOptions = {
  timeout?: number;
  waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
}

export type MediaFeature = {
  name: string;
  value: string;
}

export type ScreenshotClip = {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ScreenshotOptions = {
  type?: 'png' | 'jpeg';
  path?: string;
  fullPage?: boolean;
  clip?: ScreenshotClip;
  quality?: number;
  omitBackground?: boolean;
  encoding?: string;
}

type PDFMargin = {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

export type PDFOptions = {
  scale?: number;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  landscape?: boolean;
  pageRanges?: string;
  format?: string;
  width?: string | number;
  height?: string | number;
  preferCSSPageSize?: boolean;
  margin?: PDFMargin;
  path?: string;
}

export type PaperFormat = {
  width: number;
  height: number;
}

export type PuppeteerLifeCycleEvent =
  | 'load'
  | 'domcontentloaded'
  | 'networkidle0'
  | 'networkidle2';
export type ProtocolLifeCycleEvent =
  | 'load'
  | 'DOMContentLoaded'
  | 'networkIdle'
  | 'networkAlmostIdle';

export interface BrowserActionRecord {
  title: string;
  steps: Step[];
}

export type Step =
  | SetViewportStep
  | NavigateStep
  | ChangeStep
  | ClickStep
  | KeyUpStep
  | KeyDownStep
  | DoubleClickStep;

interface SetViewportStep {
  type: 'setViewport';
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  isLandscape: boolean;
}

interface NavigateStep {
  type: 'navigate';
  url: string;
  assertedEvents: NavigationEvent[];
}

interface NavigationEvent {
  type: 'navigation';
  url: string;
  title: string;
}

interface ChangeStep {
  type: 'change';
  value: string;
  selectors: string[][];
  target: 'main';
}

interface ClickStep {
  type: 'click' | 'doubleClick';
  target: 'main';
  selectors: string[][];
  offsetY?: number;
  offsetX?: number;
  duration?: number;
}

interface KeyUpStep {
  type: 'keyUp';
  key: string;
  target: 'main';
}

interface KeyDownStep {
  type: 'keyDown';
  key: string;
  target: 'main';
}

interface DoubleClickStep {
  type: 'doubleClick';
  target: 'main';
  selectors: string[][];
  offsetY?: number;
  offsetX?: number;
}

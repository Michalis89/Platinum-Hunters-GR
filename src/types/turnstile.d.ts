interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'light' | 'dark';
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
}

export interface TurnstileWindow {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => number;
  reset: (widgetId: number) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileWindow;
  }
}

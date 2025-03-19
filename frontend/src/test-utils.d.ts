import '@testing-library/jest-dom';

declare module '@testing-library/jest-dom' {
  export interface Matchers<R = void, T = {}> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
    toBeVisible(): R;
    toHaveClass(...classNames: string[]): R;
    toHaveStyle(css: Record<string, any>): R;
    toHaveAttribute(attr: string, value?: string): R;
    toBe(expected: any): R;
    toHaveBeenCalledWith(...args: any[]): R;
  }
}
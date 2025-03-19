import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R, T = any> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: Record<string, any>): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBe(expected: any): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}

declare module 'expect' {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeVisible(): R;
    toHaveClass(...classNames: string[]): R;
    toHaveStyle(css: Record<string, any>): R;
    toHaveAttribute(attr: string, value?: string): R;
    toBe(expected: any): R;
    toHaveBeenCalledWith(...args: any[]): R;
  }
}

declare module '@jest/expect' {
  interface AsymmetricMatchers {
    toBeInTheDocument(): void;
    toHaveTextContent(text: string | RegExp): void;
    toBeVisible(): void;
    toHaveClass(...classNames: string[]): void;
    toHaveStyle(css: Record<string, any>): void;
    toHaveAttribute(attr: string, value?: string): void;
  }
}

export {};
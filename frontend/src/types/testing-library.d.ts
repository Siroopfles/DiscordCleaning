import '@testing-library/jest-dom';
import { expect } from '@jest/globals';

type JestMatchers = {
  toBeInTheDocument(): void;
  toHaveTextContent(text: string | RegExp): void;
  toBeVisible(): void;
  toHaveClass(...classNames: string[]): void;
  toHaveStyle(css: Record<string, any>): void;
  toHaveAttribute(attr: string, value?: string): void;
  toBe(expected: any): void;
  toHaveBeenCalledWith(...args: any[]): void;
};

declare module '@testing-library/jest-dom' {
  export interface Matchers<R = void> extends JestMatchers {}
}

declare global {
  namespace jest {
    interface Matchers<R> extends JestMatchers {}
  }
  
  interface Assertion extends JestMatchers {}
}
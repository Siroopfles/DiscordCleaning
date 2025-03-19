import '@testing-library/jest-dom/extend-expect';
import { expect } from '@jest/globals';

declare global {
  namespace jest {
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
}

export { expect };
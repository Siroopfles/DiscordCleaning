/// <reference types="@testing-library/jest-dom" />
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

export {};
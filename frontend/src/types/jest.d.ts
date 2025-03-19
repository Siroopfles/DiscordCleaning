import '@testing-library/jest-dom/extend-expect';

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

// Add global custom matchers
declare global {
  namespace jest {
    interface Expect extends CustomMatchers<any> {}
    interface InverseAssertion extends CustomMatchers<any> {}
    interface Assertion extends CustomMatchers<any> {}
    interface CustomMatchers<R = unknown> {
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

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveTextContent(text: string | RegExp): R;
  toBeVisible(): R;
  toHaveClass(...classNames: string[]): R;
  toHaveStyle(css: Record<string, any>): R;
  toHaveAttribute(attr: string, value?: string): R;
  toBe(expected: any): R;
  toHaveBeenCalledWith(...args: any[]): R;
}

export {};
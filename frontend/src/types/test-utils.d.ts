import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      toBeVisible(): R;
      toHaveClass(className: string): R;
      toHaveStyle(css: Record<string, any>): R;
    }
  }
}
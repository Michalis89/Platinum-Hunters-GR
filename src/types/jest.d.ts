// types/jest.d.ts
import { FetchMock } from 'jest-fetch-mock';

declare global {
  // eslint-disable-next-line no-var
  var fetch: FetchMock;
}
// jest.d.ts
declare namespace jest {
  interface Matchers<R> {
    toHaveTextContent(text: string): R;
    toBeInTheDocument(): R;
    // Add other custom matchers you use
  }
}

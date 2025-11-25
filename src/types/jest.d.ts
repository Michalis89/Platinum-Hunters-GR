import { FetchMock } from 'jest-fetch-mock';

declare global {
  const fetch: FetchMock;
}
declare namespace jest {
  interface Matchers<R> {
    toHaveTextContent(text: string): R;
    toBeInTheDocument(): R;
  }
}

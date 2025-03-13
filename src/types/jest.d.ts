import { FetchMock } from 'jest-fetch-mock';

declare global {
  // eslint-disable-next-line no-var
  var fetch: FetchMock;
}
declare namespace jest {
  interface Matchers<R> {
    toHaveTextContent(text: string): R;
    toBeInTheDocument(): R;
  }
}

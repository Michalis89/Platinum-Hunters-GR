import { FetchMock } from 'jest-fetch-mock';

declare global {
  // Use var so tests can reassign global fetch mocks freely
  // eslint-disable-next-line no-var
  var fetch: FetchMock;
}
declare namespace jest {
  interface Matchers<R> {
    toHaveTextContent(text: string): R;
    toBeInTheDocument(): R;
  }
}

import '@testing-library/jest-dom';
import type { FetchMock } from 'jest-fetch-mock';

declare global {
  // Use var so tests can reassign global fetch mocks freely
  var fetch: FetchMock;
}

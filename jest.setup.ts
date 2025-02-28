import 'whatwg-fetch';
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

const originalError = console.error;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Failed to fetch games') ||
        args[0].includes('Σφάλμα στη φόρτωση των παιχνιδιών'))
    ) {
      return;
    }
    originalError(...args);
  });

  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  server.close();
});

// jest.setup.ts
import 'whatwg-fetch';
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';
import { TextEncoder, TextDecoder } from 'util';

// Add missing Node.js utilities for Jest
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder;

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Configure MSW server
beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'warn',
  });

  // Custom console error handling
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const ignorePatterns = [
      'Failed to fetch games',
      'Σφάλμα στη φόρτωση των παιχνιδιών',
      'React does not recognize the',
    ];

    if (ignorePatterns.some(pattern =>
      args.some(arg => typeof arg === 'string' && arg.includes(pattern))
    ) {
      return;
    }
    originalError(...args);
  });

  // Silence expected warnings
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    const ignorePatterns = [
      'componentWillReceiveProps',
      'Deprecated API usage'
    ];

    if (ignorePatterns.some(pattern =>
      args.some(arg => typeof arg === 'string' && arg.includes(pattern))
    ) {
      return;
    }
    originalWarn(...args);
  });
});

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  server.close();
  jest.restoreAllMocks();
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '',
    route: '',
    query: {},
    asPath: '',
  }),
}));

// Mock Next.js config
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    API_URL: 'http://localhost:3000/api',
  },
}));

// Mock window.scrollTo
window.scrollTo = jest.fn();
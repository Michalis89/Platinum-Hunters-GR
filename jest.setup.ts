import 'whatwg-fetch';
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

global.TextEncoder = TextEncoder;
// @ts-expect-error Node.js environment does not provide TextDecoder
global.TextDecoder = TextDecoder;

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
  jest.restoreAllMocks();
  console.error = originalError;
  console.warn = originalWarn;
});

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

jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    API_URL: 'http://localhost:3000/api',
  },
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));

window.scrollTo = jest.fn();

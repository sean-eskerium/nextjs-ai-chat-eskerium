import '@testing-library/jest-dom';
import { ReadableStream, TransformStream } from 'web-streams-polyfill';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  notFound: jest.fn(),
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
  headers: () => new Map(),
}));

// Set up globals that Next.js expects
global.ReadableStream = ReadableStream as any;
global.TransformStream = TransformStream as any;
global.Response = class extends Object {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super();
    Object.assign(this, {
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      body: body,
    });
  }
} as any;

// Mock MessageChannel (needed for streaming)
class MockMessageChannel {
  port1: any;
  port2: any;
  constructor() {
    this.port1 = {
      postMessage: jest.fn(),
      close: jest.fn(),
      start: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    this.port2 = {
      postMessage: jest.fn(),
      close: jest.fn(),
      start: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  }
}
global.MessageChannel = MockMessageChannel as any; 
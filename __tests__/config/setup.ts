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
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream as any;
global.TransformStream = TransformStream as any;

// Mock Response with streaming support
class MockResponse {
  private status: number;
  private headers: Headers;
  private body: BodyInit | null;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
    this.body = body || null;
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body as string) : null);
  }

  text() {
    return Promise.resolve(this.body as string || '');
  }

  mergeIntoDataStream() {
    return Promise.resolve();
  }
}

global.Response = MockResponse as any;

// Mock Request
class MockRequest {
  private url: string;
  private method: string;
  private headers: Headers;
  private body: BodyInit | null;

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.toString();
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.body = init?.body || null;
  }

  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body as string) : null);
  }

  text() {
    return Promise.resolve(this.body as string || '');
  }
}

global.Request = MockRequest as any;

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

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  useSession: jest.fn(() => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      },
      expires: '2024-01-01',
    },
    status: 'authenticated',
  })),
})); 
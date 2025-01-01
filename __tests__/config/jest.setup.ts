import '@testing-library/jest-dom';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';

// Set up web streams polyfill
Object.assign(global, {
  ReadableStream,
  WritableStream,
  TransformStream
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock MessageChannel which is needed for some React components
class MockMessageChannel {
  port1: any;
  port2: any;

  constructor() {
    this.port1 = { postMessage: jest.fn() };
    this.port2 = { postMessage: jest.fn() };
  }
}

global.MessageChannel = MockMessageChannel as any; 
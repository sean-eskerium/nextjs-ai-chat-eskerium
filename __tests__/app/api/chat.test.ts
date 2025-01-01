import { auth } from '@/app/(auth)/auth';
import { POST } from '@/app/(chat)/api/chat/route';
import { customModel } from '@/lib/ai';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { saveChat, saveMessages, saveSuggestions, getChatById } from '@/lib/db/queries';

// Extend Response type to include mergeIntoDataStream
declare global {
  interface Response {
    mergeIntoDataStream?: (dataStream: any) => void;
  }
}

// Mock TextDecoder
class MockTextDecoder {
  encoding = 'utf-8';
  fatal = false;
  ignoreBOM = false;
  decode() {
    return 'test response';
  }
}
global.TextDecoder = MockTextDecoder as any;

// Mock auth
jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'test-user' } })),
}));

// Mock database queries
jest.mock('@/lib/db/queries', () => ({
  saveChat: jest.fn(() => Promise.resolve({ id: 'test-chat' })),
  saveMessages: jest.fn(() => Promise.resolve()),
  saveSuggestions: jest.fn(() => Promise.resolve()),
  getChatById: jest.fn(() => Promise.resolve({ id: 'test-chat', userId: 'test-user' })),
}));

// Mock AI model
jest.mock('@/lib/ai', () => ({
  customModel: jest.fn(() => ({
    invoke: jest.fn(() => Promise.resolve({ text: 'AI response' })),
  })),
}));

// Mock Vercel AI SDK
jest.mock('ai', () => {
  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue('test response');
      controller.close();
    },
  });

  const mockResponse = new Response(mockStream, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
  mockResponse.mergeIntoDataStream = jest.fn();

  return {
    StreamingTextResponse: jest.fn().mockImplementation(() => mockResponse),
    experimental_StreamData: jest.fn(),
    convertToCoreMessages: jest.fn((messages) => messages),
    createDataStreamResponse: jest.fn(({ execute }) => {
      const dataStream = {
        writeData: jest.fn(),
        close: jest.fn(),
      };
      execute(dataStream);
      return mockResponse;
    }),
    streamText: jest.fn(() => mockResponse),
  };
});

describe('Chat API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/chat', () => {
    it('handles chat message creation', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          messages: [{ role: 'user', content: 'Hello' }],
          id: 'test-chat',
          modelId: DEFAULT_MODEL_NAME,
        }),
      };

      const response = await POST(mockRequest as any);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');

      // Verify stream content
      const reader = response.body?.getReader();
      const { value } = await reader?.read() || {};
      const text = new TextDecoder().decode(value);
      expect(text).toBe('test response');
    });

    it('handles invalid requests', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          messages: [], // Empty messages array should trigger 400
          id: 'test-chat',
          modelId: DEFAULT_MODEL_NAME,
        }),
      };

      const response = await POST(mockRequest as any);
      expect(response.status).toBe(400);
    });

    it('handles unauthenticated requests for private chats', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);

      const mockRequest = {
        json: () => Promise.resolve({
          messages: [{ role: 'user', content: 'Hello' }],
          id: 'test-chat',
          modelId: DEFAULT_MODEL_NAME,
          visibility: 'private',
        }),
      };

      const response = await POST(mockRequest as any);
      expect(response.status).toBe(401);
    });
  });
}); 
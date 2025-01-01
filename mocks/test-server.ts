import { http } from 'msw';
import type { Message, Document, Chat, Vote } from '@/lib/db/schema';

export const handlers = [
  // Chat API
  http.post('/api/chat', async () => {
    return new Response(JSON.stringify({
      messages: [] as Message[],
      status: 'success'
    }));
  }),

  // Document API
  http.get('/api/document', async ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const mockDocument: Document = {
      id: id || 'test-id',
      title: 'Test Document',
      content: 'Test content',
      kind: 'text',
      createdAt: new Date(),
      userId: 'test-user'
    };
    return new Response(JSON.stringify([mockDocument]));
  }),

  // History API
  http.get('/api/history', async () => {
    const mockChat: Chat = {
      id: '1',
      title: 'Test Chat',
      createdAt: new Date(),
      userId: 'test-user',
      visibility: 'private'
    };
    return new Response(JSON.stringify([mockChat]));
  }),

  // Vote API
  http.get('/api/vote', async () => {
    const mockVotes: Vote[] = [];
    return new Response(JSON.stringify(mockVotes));
  }),

  // Suggestions API
  http.get('/api/suggestions', async () => {
    return new Response(JSON.stringify([]));
  })
]; 
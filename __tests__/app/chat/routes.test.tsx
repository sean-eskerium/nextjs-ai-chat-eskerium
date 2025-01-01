import { auth } from '@/app/(auth)/auth';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { render } from '@testing-library/react';
import Page from '@/app/(chat)/chat/[id]/page';

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

// Mock auth
jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(() => Promise.resolve({ user: { id: 'test-user' } })),
}));

// Mock database queries
jest.mock('@/lib/db/queries', () => ({
  getChatById: jest.fn(),
  getMessagesByChatId: jest.fn(() => Promise.resolve([])),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock components
jest.mock('@/components/chat', () => ({
  Chat: () => <div data-testid="chat-component" />,
}));

jest.mock('@/components/data-stream-handler', () => ({
  DataStreamHandler: () => <div data-testid="data-stream-handler" />,
}));

describe('Chat Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Chat ID Route', () => {
    it('loads existing chat', async () => {
      const mockChat = {
        id: 'test-chat',
        title: 'Test Chat',
        visibility: 'public',
        userId: 'test-user',
      };

      (getChatById as jest.Mock).mockResolvedValueOnce(mockChat);
      (getMessagesByChatId as jest.Mock).mockResolvedValueOnce([]);

      const page = await Page({ params: Promise.resolve({ id: 'test-chat' }) });
      const { container } = render(page);

      expect(container).toMatchSnapshot();
      expect(getChatById).toHaveBeenCalledWith({ id: 'test-chat' });
      expect(notFound).not.toHaveBeenCalled();
    });

    it('returns not found for non-existent chat', async () => {
      (getChatById as jest.Mock).mockResolvedValueOnce(null);
      (getMessagesByChatId as jest.Mock).mockResolvedValueOnce([]);

      await Page({ params: Promise.resolve({ id: 'non-existent' }) });

      expect(getChatById).toHaveBeenCalledWith({ id: 'non-existent' });
      expect(notFound).toHaveBeenCalled();
    });

    it('returns not found for private chat without auth', async () => {
      const mockChat = {
        id: 'private-chat',
        title: 'Private Chat',
        visibility: 'private',
        userId: 'other-user',
      };

      (getChatById as jest.Mock).mockResolvedValueOnce(mockChat);
      (getMessagesByChatId as jest.Mock).mockResolvedValueOnce([]);
      (auth as jest.Mock).mockResolvedValueOnce(null);

      await Page({ params: Promise.resolve({ id: 'private-chat' }) });

      expect(getChatById).toHaveBeenCalledWith({ id: 'private-chat' });
      expect(notFound).toHaveBeenCalled();
    });
  });
}); 
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UIMessage } from 'ai';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../lib/storage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Chat History Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveChatHistory', () => {
    it('should save chat messages to localStorage', () => {
      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date('2024-01-01T00:00:01Z'),
        },
      ];

      saveChatHistory(messages);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cocktail-chat-history',
        JSON.stringify(messages)
      );
    });

    it('should handle empty messages array', () => {
      const messages: UIMessage[] = [];

      saveChatHistory(messages);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cocktail-chat-history',
        JSON.stringify([])
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
      ];

      // Should not throw
      expect(() => saveChatHistory(messages)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error saving chat history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('loadChatHistory', () => {
    it('should load chat messages from localStorage', () => {
      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date('2024-01-01T00:00:01Z'),
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(messages));

      const result = loadChatHistory();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('cocktail-chat-history');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].role).toBe('user');
      expect(result[0].content).toBe('Hello');
      expect(result[1].id).toBe('2');
      expect(result[1].role).toBe('assistant');
      expect(result[1].content).toBe('Hi there!');
    });

    it('should return empty array when no history exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadChatHistory();

      expect(result).toEqual([]);
    });

    it('should return empty array when localStorage data is invalid', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = loadChatHistory();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading chat history:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = loadChatHistory();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading chat history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('clearChatHistory', () => {
    it('should remove chat history from localStorage', () => {
      clearChatHistory();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cocktail-chat-history');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => clearChatHistory()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error clearing chat history:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should save and load messages correctly in sequence', () => {
      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'What cocktails can I make with gin?',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Here are some gin cocktails...',
          createdAt: new Date('2024-01-01T00:00:01Z'),
        },
        {
          id: '3',
          role: 'user',
          content: 'Tell me about martinis',
          createdAt: new Date('2024-01-01T00:00:02Z'),
        },
      ];

      // First save the messages
      saveChatHistory(messages);

      // Set up mock to return the saved data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(messages));

      // Load and verify
      const loaded = loadChatHistory();
      expect(loaded).toHaveLength(3);
      expect(loaded[0].role).toBe('user');
      expect(loaded[0].content).toBe('What cocktails can I make with gin?');
      expect(loaded[1].role).toBe('assistant');
      expect(loaded[1].content).toBe('Here are some gin cocktails...');
      expect(loaded[2].role).toBe('user');
      expect(loaded[2].content).toBe('Tell me about martinis');
    });

    it('should handle clearing after saving', () => {
      const messages: UIMessage[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date(),
        },
      ];

      // Save some messages
      saveChatHistory(messages);

      // Clear the history
      clearChatHistory();

      // Verify removeItem was called
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('cocktail-chat-history');
    });
  });
});
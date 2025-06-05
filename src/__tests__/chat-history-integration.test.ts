import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { UIMessage } from 'ai';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../lib/storage';

// Simple integration test to verify chat history persistence works end-to-end
describe('Chat History Integration', () => {
  // Use real localStorage for this integration test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should persist chat messages across save/load cycles', () => {
    // Create some test messages
    const messages: UIMessage[] = [
      {
        id: 'msg1',
        role: 'user',
        content: 'What are some good cocktails with whiskey?',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'msg2',
        role: 'assistant',
        content: 'Here are some great whiskey cocktails: Old Fashioned, Manhattan, Whiskey Sour...',
        createdAt: new Date('2024-01-01T10:00:15Z'),
      },
    ];

    // Save the messages
    saveChatHistory(messages);

    // Verify they were saved by checking localStorage directly
    const stored = localStorage.getItem('cocktail-chat-history');
    expect(stored).not.toBeNull();
    
    // Load the messages back
    const loadedMessages = loadChatHistory();
    
    // Verify the basic structure is preserved
    expect(loadedMessages).toHaveLength(2);
    expect(loadedMessages[0].id).toBe('msg1');
    expect(loadedMessages[0].role).toBe('user');
    expect(loadedMessages[0].content).toBe('What are some good cocktails with whiskey?');
    expect(loadedMessages[1].id).toBe('msg2');
    expect(loadedMessages[1].role).toBe('assistant');
    expect(loadedMessages[1].content).toBe('Here are some great whiskey cocktails: Old Fashioned, Manhattan, Whiskey Sour...');
  });

  it('should properly clear chat history', () => {
    // First save some messages
    const messages: UIMessage[] = [
      {
        id: 'msg1',
        role: 'user',
        content: 'Test message',
        createdAt: new Date(),
      },
    ];

    saveChatHistory(messages);
    
    // Verify they're saved
    expect(loadChatHistory()).toHaveLength(1);
    
    // Clear the history
    clearChatHistory();
    
    // Verify it's cleared
    expect(loadChatHistory()).toHaveLength(0);
    expect(localStorage.getItem('cocktail-chat-history')).toBeNull();
  });

  it('should handle empty message array', () => {
    saveChatHistory([]);
    const loaded = loadChatHistory();
    expect(loaded).toHaveLength(0);
  });

  it('should handle loading when no history exists', () => {
    const loaded = loadChatHistory();
    expect(loaded).toHaveLength(0);
  });
});
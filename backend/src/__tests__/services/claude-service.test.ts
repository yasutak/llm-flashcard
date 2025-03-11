import { verifyApiKey, sendMessageToClaude, generateFlashcardsFromConversation } from '../../services/claude-service';

// Mock the global fetch function
const mockFetch = global.fetch as jest.Mock;

describe('Claude Service', () => {
  const mockApiKey = 'sk-ant-api03-test-key';
  
  beforeEach(() => {
    mockFetch.mockClear();
  });
  
  describe('verifyApiKey', () => {
    it('should return true for a valid API key', async () => {
      // Mock a successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'claude-3-7-sonnet-20250219', type: 'model' },
            { id: 'claude-3-5-sonnet-20241022', type: 'model' }
          ]
        })
      });
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': mockApiKey,
          'anthropic-version': '2023-06-01',
        },
      });
    });
    
    it('should return false for an invalid API key', async () => {
      // Mock an error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          type: 'error',
          error: {
            type: 'authentication_error',
            message: 'Invalid API key'
          }
        })
      });
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    it('should return false when an exception occurs', async () => {
      // Mock a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('sendMessageToClaude', () => {
    const mockMessages = [
      { role: 'user', content: 'Hello, Claude!' }
    ];
    
    it('should send a message and return the response', async () => {
      // Mock a successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello! How can I help you today?' }]
        })
      });
      
      const result = await sendMessageToClaude(mockApiKey, mockMessages);
      
      expect(result).toBe('Hello! How can I help you today?');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': mockApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-latest',
          max_tokens: 4000,
          messages: mockMessages,
        }),
      });
    });
    
    it('should throw an error when the API returns an error', async () => {
      // Mock an error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid request'
          }
        })
      });
      
      await expect(sendMessageToClaude(mockApiKey, mockMessages))
        .rejects
        .toThrow('Claude API error: Invalid request');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error when a network error occurs', async () => {
      // Mock a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(sendMessageToClaude(mockApiKey, mockMessages))
        .rejects
        .toThrow('Failed to communicate with Claude API');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('generateFlashcardsFromConversation', () => {
    const mockConversation = [
      { role: 'user', content: 'What is a neural network?' },
      { role: 'assistant', content: 'A neural network is a computing system inspired by the human brain...' }
    ];
    
    const mockFlashcards = [
      { question: 'What is a neural network?', answer: 'A computing system inspired by the human brain...' }
    ];
    
    it('should generate flashcards from a conversation', async () => {
      // Mock a successful response with JSON in the text
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: `Here are some flashcards based on our conversation:\n\n${JSON.stringify(mockFlashcards)}` }]
        })
      });
      
      const result = await generateFlashcardsFromConversation(mockApiKey, mockConversation);
      
      expect(result).toEqual(mockFlashcards);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Check that the request body contains the expected prompt
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.messages[0].content).toContain('You are an expert at identifying important information');
      expect(requestBody.messages[0].content).toContain('USER: What is a neural network?');
    });
    
    it('should throw an error when no JSON is found in the response', async () => {
      // Mock a response with no JSON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Here are some flashcards based on our conversation:' }]
        })
      });
      
      await expect(generateFlashcardsFromConversation(mockApiKey, mockConversation))
        .rejects
        .toThrow('No JSON array found in Claude response');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error when the API returns an error', async () => {
      // Mock an error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid request'
          }
        })
      });
      
      await expect(generateFlashcardsFromConversation(mockApiKey, mockConversation))
        .rejects
        .toThrow('Claude API error: Invalid request');
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

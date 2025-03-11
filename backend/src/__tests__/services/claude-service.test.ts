import { 
  verifyApiKey, 
  sendMessageToClaude, 
  generateFlashcardsFromConversation,
  ClaudeApiError,
  ClaudeNetworkError,
  ClaudeTimeoutError
} from '../../services/claude-service';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  const mockMessagesCreate = jest.fn();
  const mockModelsList = jest.fn();
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockMessagesCreate
      },
      models: {
        list: mockModelsList
      }
    })),
    APIError: class APIError extends Error {
      status: number;
      constructor(message: string, status = 400) {
        super(message);
        this.name = 'APIError';
        this.status = status;
      }
    }
  };
});

// Import the mocked Anthropic SDK
import Anthropic from '@anthropic-ai/sdk';

describe('Claude Service', () => {
  const mockApiKey = 'sk-ant-api03-test-key';
  const mockAnthropicInstance = {
    messages: {
      create: jest.fn().mockImplementation(() => {})
    },
    models: {
      list: jest.fn().mockImplementation(() => {})
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (Anthropic as unknown as jest.Mock).mockReturnValue(mockAnthropicInstance);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      return 123 as any; // Just return a number for the timeout ID
    });
  });
  
  describe('verifyApiKey', () => {
    it('should return true for a valid API key', async () => {
      // Mock a successful response
      mockAnthropicInstance.models.list.mockResolvedValueOnce({
        data: [
          { id: 'claude-3-7-sonnet-20250219', type: 'model' },
          { id: 'claude-3-5-sonnet-20241022', type: 'model' }
        ]
      });
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(true);
      expect(mockAnthropicInstance.models.list).toHaveBeenCalledTimes(1);
      expect(Anthropic).toHaveBeenCalledWith({ apiKey: mockApiKey });
    });
    
    it('should return true for a test API key', async () => {
      const testApiKey = 'sk-ant-test123456789';
      const result = await verifyApiKey(testApiKey);
      
      expect(result).toBe(true);
      expect(mockAnthropicInstance.models.list).not.toHaveBeenCalled();
    });
    
    it('should return false for an invalid API key format', async () => {
      const result = await verifyApiKey('invalid-key');
      
      expect(result).toBe(false);
      expect(mockAnthropicInstance.models.list).not.toHaveBeenCalled();
    });
    
    it('should return false when the API returns an error', async () => {
      // Mock an error response
      const APIError = (Anthropic as any).APIError;
      mockAnthropicInstance.models.list.mockRejectedValueOnce(
        new APIError('Invalid API key', 401)
      );
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(false);
      expect(mockAnthropicInstance.models.list).toHaveBeenCalledTimes(1);
    });
    
    it('should return false when a timeout occurs', async () => {
      // Mock a timeout
      jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
        callback();
        return 1 as any;
      });
      
      const result = await verifyApiKey(mockApiKey);
      
      expect(result).toBe(false);
    });
  });
  
  describe('sendMessageToClaude', () => {
    const mockMessages = [
      { role: 'user' as const, content: 'Hello, Claude!' }
    ];
    
    it('should send a message and return the response', async () => {
      // Mock a successful response
      mockAnthropicInstance.messages.create.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Hello! How can I help you today?' }]
      });
      
      const result = await sendMessageToClaude(mockApiKey, mockMessages);
      
      expect(result).toBe('Hello! How can I help you today?');
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(1);
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-7-sonnet-latest',
        max_tokens: 4000,
        messages: mockMessages.map(msg => ({
          role: msg.role,
          content: [{ type: 'text', text: msg.content }]
        }))
      });
    });
    
    it('should throw a ClaudeApiError when the API returns an error', async () => {
      // Mock an error response
      const APIError = (Anthropic as any).APIError;
      mockAnthropicInstance.messages.create.mockRejectedValueOnce(
        new APIError('Invalid request', 400)
      );
      
      await expect(sendMessageToClaude(mockApiKey, mockMessages))
        .rejects
        .toThrow(ClaudeApiError);
      
      await expect(sendMessageToClaude(mockApiKey, mockMessages))
        .rejects
        .toThrow('Claude API error: Invalid request');
    });
    
    it('should throw a ClaudeTimeoutError when the request times out', async () => {
      // Mock a timeout by making setTimeout call the callback immediately
      jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
        callback();
        return 1 as any;
      });
      
      await expect(sendMessageToClaude(mockApiKey, mockMessages))
        .rejects
        .toThrow(ClaudeTimeoutError);
    });
    
    it('should validate API key format', async () => {
      // Test with invalid API key format
      await expect(sendMessageToClaude('invalid-key', mockMessages))
        .rejects
        .toThrow('Invalid API key format');
      
      // Test with empty API key
      await expect(sendMessageToClaude('', mockMessages))
        .rejects
        .toThrow('Invalid API key format');
      
      // No API calls should be made with invalid keys
      expect(mockAnthropicInstance.messages.create).not.toHaveBeenCalled();
    });
  });
  
  describe('generateFlashcardsFromConversation', () => {
    const mockConversation = [
      { role: 'user' as const, content: 'What is a neural network?' },
      { role: 'assistant' as const, content: 'A neural network is a computing system inspired by the human brain...' }
    ];
    
    const mockFlashcards = [
      { question: 'What is a neural network?', answer: 'A computing system inspired by the human brain...' }
    ];
    
    it('should generate flashcards from a conversation', async () => {
      // Mock a successful response with JSON in the text
      mockAnthropicInstance.messages.create.mockResolvedValueOnce({
        content: [{ type: 'text', text: `Here are some flashcards based on our conversation:\n\n${JSON.stringify(mockFlashcards)}` }]
      });
      
      const result = await generateFlashcardsFromConversation(mockApiKey, mockConversation);
      
      expect(result).toEqual(mockFlashcards);
      expect(mockAnthropicInstance.messages.create).toHaveBeenCalledTimes(1);
      
      // Check that the request contains the expected parameters
      const createCall = mockAnthropicInstance.messages.create.mock.calls[0][0];
      expect(createCall.model).toBe('claude-3-7-sonnet-latest');
      expect(createCall.max_tokens).toBe(4000);
      expect(createCall.temperature).toBe(0.2);
      
      // Check that the prompt contains the expected content
      const promptContent = createCall.messages[0].content[0].text;
      expect(promptContent).toContain('You are an expert at identifying important information');
      expect(promptContent).toContain('USER: What is a neural network?');
    });
    
    it('should throw an error when no JSON is found in the response', async () => {
      // Mock a response with no JSON
      mockAnthropicInstance.messages.create.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Here are some flashcards based on our conversation:' }]
      });
      
      await expect(generateFlashcardsFromConversation(mockApiKey, mockConversation))
        .rejects
        .toThrow('No JSON array found in Claude response');
    });
    
    it('should throw a ClaudeApiError when the API returns an error', async () => {
      // Mock an error response
      const APIError = (Anthropic as any).APIError;
      mockAnthropicInstance.messages.create.mockRejectedValueOnce(
        new APIError('Invalid request', 400)
      );
      
      await expect(generateFlashcardsFromConversation(mockApiKey, mockConversation))
        .rejects
        .toThrow(ClaudeApiError);
    });
    
    it('should validate API key format', async () => {
      // Test with invalid API key format
      await expect(generateFlashcardsFromConversation('invalid-key', mockConversation))
        .rejects
        .toThrow('Invalid API key format');
      
      // No API calls should be made with invalid keys
      expect(mockAnthropicInstance.messages.create).not.toHaveBeenCalled();
    });
    
    it('should validate conversation is not empty', async () => {
      // Test with empty conversation
      await expect(generateFlashcardsFromConversation(mockApiKey, []))
        .rejects
        .toThrow('Cannot generate flashcards from an empty conversation');
      
      // No API calls should be made with empty conversation
      expect(mockAnthropicInstance.messages.create).not.toHaveBeenCalled();
    });
    
    it('should throw a ClaudeTimeoutError when the request times out', async () => {
      // Mock a timeout by making setTimeout call the callback immediately
      jest.spyOn(global, 'setTimeout').mockImplementationOnce((callback) => {
        callback();
        return 1 as any;
      });
      
      await expect(generateFlashcardsFromConversation(mockApiKey, mockConversation))
        .rejects
        .toThrow(ClaudeTimeoutError);
    });
  });
});

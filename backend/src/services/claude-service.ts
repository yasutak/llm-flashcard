// Service for interacting with the Anthropic Claude API
import Anthropic from '@anthropic-ai/sdk';

// Error types for better error handling
export class ClaudeApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClaudeApiError';
    this.status = status;
  }
}

export class ClaudeNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeNetworkError';
  }
}

export class ClaudeTimeoutError extends Error {
  constructor() {
    super('Request to Claude API timed out');
    this.name = 'ClaudeTimeoutError';
  }
}

// Constants
const API_TIMEOUT_MS = 30000; // 30 seconds timeout
const CLAUDE_MODEL = 'claude-3-7-sonnet-latest';

/**
 * Create an Anthropic client with the provided API key
 * @param apiKey The Anthropic API key
 * @returns An Anthropic client instance
 */
function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey,
  });
}

/**
 * Send a message to Claude and get a response
 * @param apiKey The Anthropic API key
 * @param messages The conversation history
 * @returns The assistant's response
 */
export async function sendMessageToClaude(
  apiKey: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('Invalid API key format:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    throw new ClaudeApiError('Invalid API key format. API key should start with sk-ant-', 401);
  }
  
  // Log request (without full API key)
  console.log('Sending request to Claude API:', {
    model: CLAUDE_MODEL,
    messageCount: messages.length,
    firstMessagePreview: messages.length > 0 ? 
      `${messages[0].role}: ${messages[0].content.substring(0, 50)}...` : 'No messages'
  });
  
  try {
    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the message request promise
    const messagePromise = client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "Always format your responses using Markdown syntax. Use headings, lists, code blocks, and other Markdown features to structure your response clearly. For code, always specify the language in code blocks.",
      messages: messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }]
      })),
    });
    
    // Race the message request against the timeout
    const result = await Promise.race([messagePromise, timeoutPromise]);
    
    console.log('Claude API response received successfully');
    
    // Extract text from the content block
    const contentBlock = result.content[0];
    if ('text' in contentBlock) {
      return contentBlock.text;
    } else {
      throw new ClaudeApiError('Unexpected response format from Claude API', 500);
    }
  } catch (error) {
    // Handle timeout error
    if (error instanceof ClaudeTimeoutError) {
      console.error('Claude API request timed out after', API_TIMEOUT_MS, 'ms');
      throw error;
    }
    
    // Handle Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string };
      console.error('Claude API error:', {
        status: apiError.status,
        message: apiError.message,
        error: error
      });
      
      throw new ClaudeApiError(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        apiError.status || 500
      );
    }
    
    // Log and wrap other errors
    console.error('Error sending message to Claude:', error);
    throw new ClaudeNetworkError(
      error instanceof Error ? error.message : 'Failed to communicate with Claude API'
    );
  }
}

/**
 * Generate flashcards from a conversation
 * @param apiKey The Anthropic API key
 * @param conversation The conversation to generate flashcards from
 * @returns An array of flashcards with question and answer fields
 */
export async function generateFlashcardsFromConversation(
  apiKey: string,
  conversation: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ question: string; answer: string }[]> {
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('Invalid API key format:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    throw new ClaudeApiError('Invalid API key format. API key should start with sk-ant-', 401);
  }
  
  // Validate conversation
  if (!conversation || conversation.length === 0) {
    console.error('Empty conversation provided for flashcard generation');
    throw new Error('Cannot generate flashcards from an empty conversation');
  }
  
  console.log('Generating flashcards from conversation with', conversation.length, 'messages');
  
  try {
    // Create a prompt for flashcard generation
    const conversationText = conversation
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n\n');

    const prompt = `
You are an expert at identifying important information in conversations and creating flashcards.

Review the following conversation and create flashcards in a question-answer format for the most important concepts, facts, or ideas discussed.

For each flashcard:
1. Create a clear, concise question
2. Provide a comprehensive but concise answer
3. Focus on factual information, key concepts, and important relationships

Conversation:
${conversationText}

Return your response as a JSON array of flashcard objects with "question" and "answer" fields.
`;

    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the message request promise
    const messagePromise = client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ 
        role: 'user', 
        content: [{ type: 'text', text: prompt }]
      }],
      temperature: 0.2,
    });
    
    // Race the message request against the timeout
    const result = await Promise.race([messagePromise, timeoutPromise]);
    
    // Extract text from the content block
    const contentBlock = result.content[0];
    if (!('text' in contentBlock)) {
      throw new ClaudeApiError('Unexpected response format from Claude API', 500);
    }
    
    const responseText = contentBlock.text;
    console.log('Received flashcard generation response from Claude');

    // Extract the JSON array from the response
    try {
      // Find JSON in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in Claude response for flashcards');
        throw new Error('No JSON array found in Claude response');
      }

      const flashcards = JSON.parse(jsonMatch[0]);
      console.log('Successfully generated', flashcards.length, 'flashcards');
      return flashcards;
    } catch (parseError) {
      console.error('Error parsing flashcards from Claude response:', parseError);
      console.error('Response text:', responseText.substring(0, 200) + '...');
      throw new Error('Failed to parse flashcards from Claude response');
    }
  } catch (error) {
    // Handle timeout error
    if (error instanceof ClaudeTimeoutError) {
      console.error('Claude API request for flashcard generation timed out after', API_TIMEOUT_MS, 'ms');
      throw error;
    }
    
    // Handle Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string };
      console.error('Claude API error during flashcard generation:', {
        status: apiError.status,
        message: apiError.message,
        error: error
      });
      
      throw new ClaudeApiError(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        apiError.status || 500
      );
    }
    
    // Log and wrap other errors
    console.error('Error generating flashcards:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No JSON array found in Claude response' || 
          error.message === 'Failed to parse flashcards from Claude response') {
        throw error; // Re-throw parsing errors
      }
    }
    
    throw new ClaudeNetworkError(
      error instanceof Error ? error.message : 'Failed to generate flashcards'
    );
  }
}

/**
 * Generate flashcards from a single message
 * @param apiKey The Anthropic API key
 * @param message The message to generate flashcards from
 * @returns An array of flashcards with question and answer fields
 */
export async function generateFlashcardsFromMessage(
  apiKey: string,
  message: string
): Promise<{ question: string; answer: string }[]> {
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('Invalid API key format:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    throw new ClaudeApiError('Invalid API key format. API key should start with sk-ant-', 401);
  }
  
  // Validate message
  if (!message || message.trim().length === 0) {
    console.error('Empty message provided for flashcard generation');
    throw new Error('Cannot generate flashcards from an empty message');
  }
  
  console.log('Generating flashcards from a single message');
  
  try {
    // Create a prompt for flashcard generation
    const prompt = `
You are an expert at identifying important information and creating flashcards.

Review the following content and create flashcards in a question-answer format for the most important concepts, facts, or ideas discussed.

For each flashcard:
1. Create a clear, concise question
2. Provide a comprehensive but concise answer
3. Focus on factual information, key concepts, and important relationships

Content:
${message}

Return your response as a JSON array of flashcard objects with "question" and "answer" fields.
`;

    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the message request promise
    const messagePromise = client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ 
        role: 'user', 
        content: [{ type: 'text', text: prompt }]
      }],
      temperature: 0.2,
    });
    
    // Race the message request against the timeout
    const result = await Promise.race([messagePromise, timeoutPromise]);
    
    // Extract text from the content block
    const contentBlock = result.content[0];
    if (!('text' in contentBlock)) {
      throw new ClaudeApiError('Unexpected response format from Claude API', 500);
    }
    
    const responseText = contentBlock.text;
    console.log('Received flashcard generation response from Claude');

    // Extract the JSON array from the response
    try {
      // Find JSON in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in Claude response for flashcards');
        throw new Error('No JSON array found in Claude response');
      }

      const flashcards = JSON.parse(jsonMatch[0]);
      console.log('Successfully generated', flashcards.length, 'flashcards from message');
      return flashcards;
    } catch (parseError) {
      console.error('Error parsing flashcards from Claude response:', parseError);
      console.error('Response text:', responseText.substring(0, 200) + '...');
      throw new Error('Failed to parse flashcards from Claude response');
    }
  } catch (error) {
    // Handle timeout error
    if (error instanceof ClaudeTimeoutError) {
      console.error('Claude API request for flashcard generation timed out after', API_TIMEOUT_MS, 'ms');
      throw error;
    }
    
    // Handle Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string };
      console.error('Claude API error during flashcard generation:', {
        status: apiError.status,
        message: apiError.message,
        error: error
      });
      
      throw new ClaudeApiError(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        apiError.status || 500
      );
    }
    
    // Log and wrap other errors
    console.error('Error generating flashcards from message:', error);
    
    if (error instanceof Error) {
      if (error.message === 'No JSON array found in Claude response' || 
          error.message === 'Failed to parse flashcards from Claude response') {
        throw error; // Re-throw parsing errors
      }
    }
    
    throw new ClaudeNetworkError(
      error instanceof Error ? error.message : 'Failed to generate flashcards from message'
    );
  }
}

/**
 * Verify that an API key is valid
 * @param apiKey The Anthropic API key to verify
 * @returns True if the API key is valid, false otherwise
 */
/**
 * Generate a title for a chat based on the first assistant response
 * @param apiKey The Anthropic API key
 * @param message The assistant's first response
 * @returns A generated title for the chat
 */
export async function generateChatTitle(
  apiKey: string,
  message: string
): Promise<string> {
  // Validate API key format
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.error('Invalid API key format:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    throw new ClaudeApiError('Invalid API key format. API key should start with sk-ant-', 401);
  }
  
  // Validate message
  if (!message || message.trim().length === 0) {
    console.error('Empty message provided for title generation');
    throw new Error('Cannot generate title from an empty message');
  }
  
  console.log('Generating title from assistant message');
  
  try {
    // Create a prompt for title generation
    const prompt = `
You are an expert at creating concise, descriptive titles.

Review the following content and create a short, descriptive title that captures the main topic or theme.
The title should be no more than 5-7 words.

Content:
${message}

Return only the title text, with no additional formatting or explanation.
`;

    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the message request promise
    const messagePromise = client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 100,
      messages: [{ 
        role: 'user', 
        content: [{ type: 'text', text: prompt }]
      }],
      temperature: 0.2,
    });
    
    // Race the message request against the timeout
    const result = await Promise.race([messagePromise, timeoutPromise]);
    
    // Extract text from the content block
    const contentBlock = result.content[0];
    if (!('text' in contentBlock)) {
      throw new ClaudeApiError('Unexpected response format from Claude API', 500);
    }
    
    const title = contentBlock.text.trim();
    console.log('Generated title:', title);
    
    return title;
  } catch (error) {
    // Handle timeout error
    if (error instanceof ClaudeTimeoutError) {
      console.error('Claude API request for title generation timed out after', API_TIMEOUT_MS, 'ms');
      throw error;
    }
    
    // Handle Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string };
      console.error('Claude API error during title generation:', {
        status: apiError.status,
        message: apiError.message,
        error: error
      });
      
      throw new ClaudeApiError(
        `Claude API error: ${apiError.message || 'Unknown error'}`,
        apiError.status || 500
      );
    }
    
    // Log and wrap other errors
    console.error('Error generating title:', error);
    
    throw new ClaudeNetworkError(
      error instanceof Error ? error.message : 'Failed to generate title'
    );
  }
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  // Basic format validation
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    console.log('Invalid API key format:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    return false;
  }
  
  // Accept test keys in development mode
  if (apiKey.startsWith('sk-ant-test')) {
    console.log('Development mode: Accepting test API key without verification');
    return true;
  }
  
  // Log the API key prefix for debugging
  console.log('API key prefix:', apiKey.substring(0, 10) + '...');
  console.log('API key length:', apiKey.length);
  
  try {
    console.log('Verifying API key with Anthropic...');
    
    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the models list request promise
    const modelsPromise = client.models.list();
    
    // Race the models request against the timeout
    await Promise.race([modelsPromise, timeoutPromise]);
    
    console.log('API key verification successful');
    return true;
  } catch (error) {
    // Handle timeout error
    if (error instanceof ClaudeTimeoutError) {
      console.error('API key verification timed out after', API_TIMEOUT_MS, 'ms');
      return false;
    }
    
    // Handle Anthropic API errors
    if (error instanceof Error && 'status' in error) {
      const apiError = error as { status: number; message: string };
      console.error('API key verification failed:', {
        status: apiError.status,
        message: apiError.message,
        error: error
      });
      return false;
    }
    
    console.error('Error verifying API key:', error);
    return false;
  }
}

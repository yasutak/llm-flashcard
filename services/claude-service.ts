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

export async function sendMessageToClaude(
  apiKey: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  stream: boolean = false
): Promise<string | ReadableStream> {
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
      `${messages[0].role}: ${messages[0].content.substring(0, 50)}...` : 'No messages',
    streaming: stream
  });
  
  try {
    // Create Anthropic client
    const client = createAnthropicClient(apiKey);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ClaudeTimeoutError()), API_TIMEOUT_MS);
    });
    
    // Create the message request promise
    const messageRequest = client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "Always format your responses using Markdown syntax. Use headings, lists, code blocks, and other Markdown features to structure your response clearly. For code, always specify the language in code blocks.",
      messages: messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }]
      })),
      stream: stream,
    });
    
    // Race the message request against the timeout
    const result = await Promise.race([messageRequest, timeoutPromise]);
    
    console.log('Claude API response received successfully');
    
    if (stream) {
      // Convert Anthropic stream to Web standard ReadableStream
      return new ReadableStream({
        async start(controller) {
          try {
            // Use any type here to avoid type errors with different SDK versions
            const anthropicStream = result as any;
            
            // Handle each chunk from the Anthropic stream
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                // Send text chunks to the client
                controller.enqueue(chunk.delta.text);
              }
            }
            controller.close();
          } catch (error) {
            console.error('Error processing stream:', error);
            controller.error(error);
          }
        },
        cancel() {
          try {
            // Attempt to cancel the stream
            (result as any).controller?.abort();
          } catch (e) {
            console.error('Error cancelling stream:', e);
          }
        }
      });
    } else {
      // Extract text from the regular response
      const response = result as any;
      let fullText = '';
      
      // Combine all text blocks in the response
      if (Array.isArray(response.content)) {
        for (const content of response.content) {
          if (content.type === 'text') {
            fullText += content.text;
          }
        }
      } else if (typeof response.content === 'string') {
        fullText = response.content;
      } else {
        throw new ClaudeApiError('Unexpected response format from Claude API', 500);
      }
      
      return fullText;
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
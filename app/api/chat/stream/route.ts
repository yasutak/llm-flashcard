import { Message, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { sendMessageToClaude } from '@/services/claude-service';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

// Test endpoint to verify streaming
export async function GET() {
  const result = streamText({
    model: anthropic('claude-3-7-sonnet-20250219'),
    messages: [{ role: 'user', content: 'Test message' }],
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 12000 },
      },
    },
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // Convert messages to Claude format
    const claudeMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get the API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    const result = streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      messages: claudeMessages,
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 },
        },
      },
    });

    return result.toDataStreamResponse({
      sendReasoning: true,
    });
  } catch (error) {
    console.error('Error in streaming chat:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
} 
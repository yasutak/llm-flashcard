import { NextRequest } from 'next/server';

type RequestData = {
  message: string;
};

// This demo function simulates a streaming response from Claude
// In a real implementation, you would make a call to the Claude API with streaming enabled
async function* generateDemoResponse(message: string) {
  // Demo response based on the user input
  const demoResponses: Record<string, string> = {
    default: `Thank you for your message. I'm a streaming demo response, so you're seeing my text appear character by character, simulating how Claude would respond in real-time.

This helps create a more natural conversation flow and provides immediate feedback to the user.

To implement real streaming with Claude, you would:
1. Use Anthropic's streaming API endpoint
2. Process the incoming chunks of text
3. Update the UI incrementally as new content arrives

Would you like to see how streaming responses can be implemented in different frameworks?`,
    
    hello: `Hello! I'm a streaming demo response. Nice to meet you! 

You're seeing my response appear gradually, character by character, just like in a real conversation. This simulates how Claude's streaming API works.

Streaming responses provide a more interactive experience compared to waiting for the entire response to load at once.`,
    
    weather: `While I don't have real-time weather data, I can tell you how a weather information system might work with streaming responses.

A weather API integration would:
1. Connect to a weather service API
2. Process the request for specific location data
3. Stream back formatted results showing temperature, conditions, and forecast

The advantage of streaming for weather updates is that partial information can be displayed immediately while more complex forecast data continues loading.`,
  };

  // Choose a response based on user input keywords or default to generic response
  let responseText = demoResponses.default;
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    responseText = demoResponses.hello;
  } else if (lowerMessage.includes('weather')) {
    responseText = demoResponses.weather;
  }

  // Split the response into chunks to simulate streaming
  const words = responseText.split(' ');
  let currentText = '';
  
  // Yield the text word by word with a slight delay
  for (const word of words) {
    currentText += (currentText ? ' ' : '') + word;
    yield currentText;
    
    // Simulate network/processing delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// This handler functions like a streaming API endpoint
export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as RequestData;
    const message = data.message || '';
    
    // Prepare for streaming response
    const encoder = new TextEncoder();
    
    // Create a ReadableStream that will emit our text chunks
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate and stream the response
          for await (const text of generateDemoResponse(message)) {
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    // Return the stream as a response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
    
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

# Streaming Chat Implementation with Server-Sent Events (SSE)

This document explains how streaming chat responses from Claude can be implemented using Server-Sent Events (SSE) in a Next.js application.

## Overview

Streaming responses means that Claude's responses are sent in chunks as they are generated, rather than waiting for the complete response to be finished. This provides a more natural chat-like experience where users can see responses appearing in real-time.

The implementation consists of three main parts:

1. **Frontend UI Component**: Handling the incremental display of streaming text
2. **API Route**: Managing the SSE stream from the backend
3. **Integration with Anthropic's API**: Using Claude's streaming endpoint (only simulated in this demo)

## Frontend Implementation

The UI component `StreamingChatDemo` in `components/streaming-chat-demo.tsx` handles:

- Maintaining the chat message state
- Sending user messages to the API
- Processing the streaming response
- Updating the UI incrementally as chunks arrive
- Supporting cancellation of ongoing responses

Key features:

```typescript
// Create an empty assistant message that will be filled incrementally
const assistantMessage: Message = {
  id: assistantMessageId,
  role: "assistant",
  content: "",
  created_at: new Date().toISOString()
}

setMessages(prev => [...prev, assistantMessage])

// Create AbortController for the request
const controller = new AbortController()
setAbortController(controller)

// Make the streaming request with the abort signal
const response = await fetch("/api/streaming-chat", {
  method: "POST",
  // ...
  signal: controller.signal
})

// Process the stream with a Reader
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let accumulatedContent = ""

while (true) {
  const { done, value } = await reader.read()
  
  if (done) {
    setIsStreaming(false)
    break
  }
  
  // Decode the chunk and append
  const chunk = decoder.decode(value, { stream: true })
  accumulatedContent += chunk
  
  // Update the message with accumulated content
  setMessages(prev => {
    const updatedMessages = [...prev]
    // ...update assistant message
    return updatedMessages
  })
}
```

## API Route Implementation

The API route in `app/api/streaming-chat/route.ts` sets up a ReadableStream to deliver chunks of text to the client:

```typescript
// Create a ReadableStream
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
```

## Integrating with Claude's Streaming API

In a real implementation, you would use Anthropic's streaming API to generate responses. The API provides content chunks as they are generated, which can be forwarded to the client.

```typescript
// Example with actual Claude API (replace the demo implementation)
async function* streamFromClaude(message: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
      stream: true, // Enable streaming
    }),
  });

  // Process the SSE stream from Claude
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Process each complete SSE event
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonData = line.slice(6);
        if (jsonData === '[DONE]') continue;
        
        try {
          const data = JSON.parse(jsonData);
          if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
            yield data.delta.text;
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e);
        }
      }
    }
  }
}
```

## Cancel a Streaming Response

The implementation supports cancellation of ongoing requests:

```typescript
// In the component
const handleAbortStreaming = () => {
  if (abortController) {
    abortController.abort()
    setIsStreaming(false)
  }
}

// In the UI
{isStreaming ? (
  <Button
    onClick={handleAbortStreaming}
    className="flex-shrink-0 bg-red-500 hover:bg-red-600 rounded-xl shadow-sm"
  >
    <X className="h-5 w-5" />
  </Button>
) : (
  <Button onClick={handleSendMessage}>
    <Send className="h-5 w-5" />
  </Button>
)}
```

## Key Advantages of Streaming Responses

1. **Better UX**: Users see immediate feedback and can start reading responses sooner
2. **Perceived Performance**: The app feels faster even if total response time is the same
3. **Cancel Capability**: Users can stop generation if they're not satisfied with the direction
4. **Progress Indication**: Users can see that the system is actively working

## Implementation Considerations

- **Error Handling**: Robust error handling for network interruptions
- **Reconnection Logic**: For longer responses, consider reconnection logic
- **Caching Strategy**: Decide how to cache streaming responses
- **Rate Limiting**: Implement rate limiting to prevent API abuse

## Resources

- [Anthropic Claude API Documentation](https://docs.anthropic.com/claude/reference/streaming)
- [Next.js Server-Sent Events](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [ReadableStream API](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)

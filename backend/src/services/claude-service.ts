// Service for interacting with the Anthropic Claude API

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
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error sending message to Claude:', error);
    throw new Error('Failed to communicate with Claude API');
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

    // Send the prompt to Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API error:', errorData);
      throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;

    // Extract the JSON array from the response
    try {
      // Find JSON in the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in Claude response');
      }

      const flashcards = JSON.parse(jsonMatch[0]);
      return flashcards;
    } catch (parseError) {
      console.error('Error parsing flashcards from Claude response:', parseError);
      throw new Error('Failed to parse flashcards from Claude response');
    }
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards');
  }
}

/**
 * Verify that an API key is valid
 * @param apiKey The Anthropic API key to verify
 * @returns True if the API key is valid, false otherwise
 */
export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

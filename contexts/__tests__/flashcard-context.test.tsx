import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FlashcardProvider, useFlashcards } from '../flashcard-context';
import * as flashcardService from '../../services/flashcard-service';
import { useAuth } from '../auth-context';

// Mock the flashcard service
jest.mock('../../services/flashcard-service');

// Mock the auth context
jest.mock('../auth-context', () => ({
  useAuth: jest.fn(),
}));

// Test component that uses the flashcard context
function TestComponent({ onGenerateClick }: { onGenerateClick?: () => void }) {
  const { 
    flashcards, 
    isLoading, 
    generateCardsFromChat,
    fetchFlashcardsForChat
  } = useFlashcards();
  
  const handleGenerateClick = async () => {
    try {
      await generateCardsFromChat('test-chat-id');
      if (onGenerateClick) onGenerateClick();
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
  };
  
  const handleFetchClick = async () => {
    try {
      await fetchFlashcardsForChat('test-chat-id');
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    }
  };
  
  return (
    <div>
      <h1>Flashcards</h1>
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      <button onClick={handleGenerateClick} data-testid="generate-button">
        Generate Flashcards
      </button>
      <button onClick={handleFetchClick} data-testid="fetch-button">
        Fetch Flashcards
      </button>
      <ul>
        {flashcards.map((card) => (
          <li key={card.id} data-testid={`flashcard-${card.id}`}>
            <div data-testid={`question-${card.id}`}>{card.question}</div>
            <div data-testid={`answer-${card.id}`}>{card.answer}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('FlashcardContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the auth context to return a logged-in user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      isLoading: false,
    });
  });
  
  it('should fetch flashcards on mount when user is logged in', async () => {
    const mockFlashcards = [
      {
        id: '1',
        user_id: 'test-user-id',
        chat_id: 'test-chat-id',
        question: 'What is a neural network?',
        answer: 'A computing system inspired by the human brain...',
        created_at: 1000000,
        updated_at: 1000000,
      },
    ];
    
    // Mock the getFlashcards function
    (flashcardService.getFlashcards as jest.Mock).mockResolvedValue(mockFlashcards);
    
    render(
      <FlashcardProvider>
        <TestComponent />
      </FlashcardProvider>
    );
    
    // Wait for the flashcards to be fetched
    await waitFor(() => {
      expect(flashcardService.getFlashcards).toHaveBeenCalled();
    });
    
    // Check that the flashcards are displayed
    expect(screen.getByTestId('flashcard-1')).toBeInTheDocument();
    expect(screen.getByTestId('question-1')).toHaveTextContent('What is a neural network?');
    expect(screen.getByTestId('answer-1')).toHaveTextContent('A computing system inspired by the human brain...');
  });
  
  it('should fetch flashcards for a specific chat', async () => {
    const mockFlashcards = [
      {
        id: '2',
        user_id: 'test-user-id',
        chat_id: 'test-chat-id',
        question: 'What is machine learning?',
        answer: 'A subset of AI that enables systems to learn from data...',
        created_at: 1000000,
        updated_at: 1000000,
      },
    ];
    
    // Mock the getFlashcardsForChat function
    (flashcardService.getFlashcardsForChat as jest.Mock).mockResolvedValue(mockFlashcards);
    
    render(
      <FlashcardProvider>
        <TestComponent />
      </FlashcardProvider>
    );
    
    // Click the fetch button
    await act(async () => {
      userEvent.click(screen.getByTestId('fetch-button'));
    });
    
    // Wait for the flashcards to be fetched
    await waitFor(() => {
      expect(flashcardService.getFlashcardsForChat).toHaveBeenCalledWith('test-chat-id');
    });
    
    // Check that the flashcards are displayed
    expect(screen.getByTestId('flashcard-2')).toBeInTheDocument();
    expect(screen.getByTestId('question-2')).toHaveTextContent('What is machine learning?');
    expect(screen.getByTestId('answer-2')).toHaveTextContent('A subset of AI that enables systems to learn from data...');
  });
  
  it('should generate flashcards from a chat', async () => {
    const mockGeneratedFlashcards = [
      {
        id: '3',
        user_id: 'test-user-id',
        chat_id: 'test-chat-id',
        question: 'What is deep learning?',
        answer: 'A subset of machine learning that uses neural networks with many layers...',
        created_at: 1000000,
        updated_at: 1000000,
      },
    ];
    
    // Mock the generateFlashcards function
    (flashcardService.generateFlashcards as jest.Mock).mockResolvedValue(undefined);
    
    // Mock the getFlashcardsForChat function to return the generated flashcards
    (flashcardService.getFlashcardsForChat as jest.Mock).mockResolvedValue(mockGeneratedFlashcards);
    
    const onGenerateClick = jest.fn();
    
    render(
      <FlashcardProvider>
        <TestComponent onGenerateClick={onGenerateClick} />
      </FlashcardProvider>
    );
    
    // Mock the initial state to include loading
    (flashcardService.getFlashcards as jest.Mock).mockImplementation(() => {
      // This will cause isLoading to be true initially
      return new Promise(resolve => setTimeout(() => resolve(mockGeneratedFlashcards), 100));
    });
    
    // Click the generate button
    await act(async () => {
      userEvent.click(screen.getByTestId('generate-button'));
    });
    
    // Wait for the flashcards to be generated
    await waitFor(() => {
      expect(flashcardService.generateFlashcards).toHaveBeenCalledWith('test-chat-id');
      expect(flashcardService.getFlashcardsForChat).toHaveBeenCalledWith('test-chat-id');
      expect(onGenerateClick).toHaveBeenCalled();
    });
    
    // Check that the flashcards are displayed
    expect(screen.getByTestId('flashcard-3')).toBeInTheDocument();
    expect(screen.getByTestId('question-3')).toHaveTextContent('What is deep learning?');
    expect(screen.getByTestId('answer-3')).toHaveTextContent('A subset of machine learning that uses neural networks with many layers...');
  });
  
  it('should handle errors when generating flashcards', async () => {
    // Mock the console.error function
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the generateFlashcards function to throw an error
    (flashcardService.generateFlashcards as jest.Mock).mockRejectedValue(new Error('API error'));
    
    render(
      <FlashcardProvider>
        <TestComponent />
      </FlashcardProvider>
    );
    
    // Click the generate button
    await act(async () => {
      userEvent.click(screen.getByTestId('generate-button'));
    });
    
    // Wait for the error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating flashcards:', expect.any(Error));
    });
    
    // Restore the console.error function
    consoleErrorSpy.mockRestore();
  });
});

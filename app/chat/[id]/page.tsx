import { ChatMessages } from '@/components/chat-messages';
import { useChat } from '@/contexts/chat-context';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const { id } = useParams();
  const { selectChat, currentChat, messages, isLoading } = useChat();

  useEffect(() => {
    if (id && typeof id === 'string') {
      selectChat(id);
    }
  }, [id, selectChat]);

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Select a chat or start a new one</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onMessageComplete={(message) => {
          // Handle message completion if needed
        }}
      />
    </div>
  );
} 
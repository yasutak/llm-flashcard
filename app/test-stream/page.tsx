"use client";

import { ChatMessages } from '@/components/chat-messages';

export default function TestStreamPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Streaming Test Page</h1>
        <p className="text-sm text-gray-600">This page tests the streaming functionality with a simple test endpoint.</p>
      </div>
      <div className="flex-1">
        <ChatMessages
          messages={[]}
          isLoading={false}
          testMode={true}
        />
      </div>
    </div>
  );
} 
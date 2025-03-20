"use client"

import { MainNav } from "@/components/main-nav"
import StreamingChatDemo from "@/components/streaming-chat-demo"

export default function StreamingChatDemoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Streaming Chat Demo</h1>
            <p className="text-gray-600 mt-2">
              This demo shows how to implement SSE (Server-Sent Events) for streaming responses from Claude. The chat interface displays responses character by character as they are generated.
            </p>
          </div>
          
          <div className="bg-white border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden h-[calc(100vh-12rem)]">
            <StreamingChatDemo />
          </div>
        </div>
      </div>
    </div>
  )
}

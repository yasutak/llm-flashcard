"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Bot, UserIcon, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function StreamingChatDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to abort streaming response
  const handleAbortStreaming = () => {
    if (abortController) {
      abortController.abort()
      setIsStreaming(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return

    try {
      // Create a unique ID for the messages
      const userMessageId = `user-${Date.now()}`
      const assistantMessageId = `assistant-${Date.now()}`
      
      // Add user message immediately
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: input,
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, userMessage])
      
      // Create an empty assistant message that will be filled incrementally
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setInput("")
      setIsStreaming(true)
      
      // Create new AbortController for this request
      const controller = new AbortController()
      setAbortController(controller)
      
      // Make the streaming request
      const response = await fetch("/api/streaming-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: input 
        }),
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Process the streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Failed to get reader from response")
      }
      
      const decoder = new TextDecoder()
      let accumulatedContent = ""
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          setIsStreaming(false)
          break
        }
        
        // Decode the chunk and append to the content
        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk
        
        // Update the assistant message with the new content
        setMessages(prev => {
          const updatedMessages = [...prev]
          const assistantMessageIndex = updatedMessages.findIndex(m => m.id === assistantMessageId)
          
          if (assistantMessageIndex !== -1) {
            updatedMessages[assistantMessageIndex] = {
              ...updatedMessages[assistantMessageIndex],
              content: accumulatedContent
            }
          }
          
          return updatedMessages
        })
      }
      
    } catch (error) {
      // Don't show abort errors as they're intentional
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was aborted')
      } else {
        console.error('Error sending message:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to send message",
          variant: "destructive",
        })
      }
      
      setIsStreaming(false)
    } finally {
      setAbortController(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-0 sm:p-2 md:p-4">
        <div className="space-y-4 pb-20">
          {messages.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="inline-flex p-4 rounded-full bg-[hsl(var(--primary-light))] mb-6">
                <Bot className="h-8 w-8 text-[hsl(var(--primary))]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Streaming Chat Demo</h2>
              <p className="text-gray-500 mb-8 text-lg">
                Try out Server-Sent Events streaming responses
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 sm:px-5 py-3 shadow-sm ${
                    message.role === "user" 
                      ? "bg-[hsl(var(--primary))] text-white max-w-[95%] sm:max-w-[85%] ml-1 sm:ml-0" 
                      : "bg-white border border-[hsl(var(--border))] max-w-[95%] sm:max-w-[85%] mr-1 sm:mr-0"
                  }`}
                >
                  {message.role === "user" ? (
                    <div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="text-xs mt-2 opacity-80">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Override default styling for markdown elements
                          p: (props) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                          h1: (props) => <h1 className="text-xl font-bold my-4 text-gray-800" {...props} />,
                          h2: (props) => <h2 className="text-lg font-bold my-3 text-gray-800" {...props} />,
                          h3: (props) => <h3 className="text-md font-bold my-2 text-gray-800" {...props} />,
                          ul: (props) => <ul className="list-disc ml-6 mb-4 space-y-1" {...props} />,
                          ol: (props) => <ol className="list-decimal ml-6 mb-4 space-y-1" {...props} />,
                          li: (props) => <li className="mb-1" {...props} />,
                          a: (props) => <a className="text-[hsl(var(--primary))] hover:underline" {...props} />,
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeProps = props as { inline?: boolean };
                            const isInline = !match && codeProps.inline;
                            return isInline ? 
                              <code className="bg-[hsl(var(--gray-100))] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code> : 
                              <code className="block bg-[hsl(var(--gray-100))] p-3 rounded-md text-sm font-mono overflow-x-auto my-3" {...props}>{children}</code>;
                          },
                          pre: (props) => <pre className="bg-[hsl(var(--gray-100))] p-3 rounded-md overflow-x-auto my-3 text-sm" {...props} />,
                          blockquote: (props) => <blockquote className="border-l-4 border-[hsl(var(--primary-light))] bg-[hsl(var(--gray-50))] pl-4 py-1 italic my-4 text-gray-700" {...props} />,
                        }}
                      >
                        {message.content || "▋"}
                      </ReactMarkdown>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--gray-200))] shadow-sm">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-white border-t border-[hsl(var(--border))] py-4 px-6 shadow-md">
        <div className="flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[56px] resize-none border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] rounded-xl py-3 px-4 shadow-sm"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              onClick={handleAbortStreaming}
              className="flex-shrink-0 bg-red-500 hover:bg-red-600 rounded-xl shadow-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="flex-shrink-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] rounded-xl shadow-sm"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Bot, UserIcon, Copy, Check, BookOpen, Edit, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ApiError } from "@/services/api"
import { ResponsiveSidebar } from "@/components/responsive-sidebar"

// Generate flashcards from whole chat button
function GenerateFlashcardsButton({ chatId }: { chatId: string }) {
  const [generating, setGenerating] = useState(false)
  const { generateCardsFromChat } = useFlashcards()
  const { toast } = useToast()
  
  // Use useRef to track if the button is already clicked to prevent duplicate requests
  const isProcessingRef = useRef(false)
  
  const handleGenerateFlashcards = async () => {
    // If already processing, don't do anything
    if (isProcessingRef.current || generating) return
    
    // Set both state and ref to prevent duplicate clicks
    setGenerating(true)
    isProcessingRef.current = true
    
    try {
      await generateCardsFromChat(chatId)
      toast({
        title: "Flashcards generated",
        description: "Flashcards have been created from this chat",
      })
    } catch (error) {
      let errorMessage = "Failed to generate flashcards. Please try again.";
      let errorDetails = "";
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
        
        // Check if this is a validation error
        if (error.isValidationError()) {
          const validationErrors = error.getValidationErrors();
          if (validationErrors) {
            // Format validation errors for display
            errorDetails = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error generating flashcards",
        description: errorDetails || errorMessage,
        variant: "destructive",
      })
      
      // Log the full error for debugging
      console.error("Flashcard generation error:", error);
    } finally {
      setGenerating(false)
      // Reset the processing flag after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        isProcessingRef.current = false
      }, 1000)
    }
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateFlashcards}
      disabled={generating}
      className="text-gray-500 hover:text-[hsl(var(--primary))] hover:bg-gray-50"
    >
      {generating ? (
        <div className="h-4 w-4 mr-1.5 border-2 border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      ) : (
        <BookOpen className="h-4 w-4 mr-1.5" />
      )}
      Generate Flashcards
    </Button>
  )
}

// Flashcard button component for individual messages
function FlashcardButton({ chatId, messageId }: { chatId?: string; messageId: string }) {
  const [generating, setGenerating] = useState(false)
  const { generateCardsFromMessage } = useFlashcards()
  const { toast } = useToast()
  
  // Use useRef to track if the button is already clicked to prevent duplicate requests
  const isProcessingRef = useRef(false)
  
  const handleGenerateFlashcards = async () => {
    // If no chatId or already processing, don't do anything
    if (!chatId || isProcessingRef.current || generating) return
    
    // Set both state and ref to prevent duplicate clicks
    setGenerating(true)
    isProcessingRef.current = true
    
    try {
      const result = await generateCardsFromMessage(chatId, messageId)
      toast({
        title: "Flashcards generated",
        description: `Flashcards have been created from this message (Deck ID: ${result.deck_id})`,
      })
    } catch (error) {
      let errorMessage = "Failed to generate flashcards. Please try again.";
      let errorDetails = "";
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
        
        // Check if this is a validation error
        if (error.isValidationError()) {
          const validationErrors = error.getValidationErrors();
          if (validationErrors) {
            // Format validation errors for display
            errorDetails = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error generating flashcards",
        description: errorDetails || errorMessage,
        variant: "destructive",
      })
      
      // Log the full error for debugging
      console.error("Flashcard generation error:", error);
    } finally {
      setGenerating(false)
      // Reset the processing flag after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        isProcessingRef.current = false
      }, 1000)
    }
  }
  
  return (
    <button 
      onClick={handleGenerateFlashcards}
      disabled={generating}
      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      aria-label="Generate flashcards from this message"
      title="Generate flashcards from this message"
    >
      {generating ? (
        <div className="h-4 w-4 border-2 border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
      ) : (
        <BookOpen className="h-4 w-4" />
      )}
    </button>
  )
}

// Copy button component
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }
  
  return (
    <button 
      onClick={handleCopy}
      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      aria-label="Copy to clipboard"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  )
}

export default function ChatPage() {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { hasApiKey } = useAuth()
  const { 
    currentChat, 
    messages, 
    sendingMessage, 
    sendChatMessage, 
    updateChatTitle,
    autoGenerateFlashcards,
    setAutoGenerateFlashcards
  } = useChat()
  
  // State for chat title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || sendingMessage) return

    try {
      // Send the message and get any auto-generated flashcards result
      await sendChatMessage(input)
      setInput("")
    } catch (error) {
      let errorMessage = "Failed to send your message. Please try again.";
      let errorDetails = "";
      
      if (error instanceof ApiError) {
        errorMessage = error.getDetailedMessage();
        
        // Check if this is a validation error
        if (error.isValidationError()) {
          const validationErrors = error.getValidationErrors();
          if (validationErrors) {
            // Format validation errors for display
            errorDetails = validationErrors.map(err => `${err.field}: ${err.message}`).join('\n');
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error sending message",
        description: errorDetails || errorMessage,
        variant: "destructive",
      })
      
      // Log the full error for debugging
      console.error("Message send error:", error);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    if (!hasApiKey) {
      router.push("/api-key")
    }
  }, [hasApiKey, router])

  if (!hasApiKey) {
    return null // Return null while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Use the responsive sidebar component */}
        <ResponsiveSidebar currentChatId={currentChat?.id} />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden">
          {/* Chat header with title */}
          {currentChat && (
            <div className="bg-white border-b border-[hsl(var(--border))] p-4 flex items-center justify-between shadow-sm">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                    placeholder="Enter chat title"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (editedTitle.trim()) {
                          updateChatTitle(currentChat.id, editedTitle.trim())
                            .then(() => {
                              setIsEditingTitle(false);
                              toast({
                                title: "Chat renamed",
                                description: "The chat title has been updated",
                              });
                            })
                            .catch((error) => {
                              toast({
                                title: "Error renaming chat",
                                description: "Failed to update chat title",
                                variant: "destructive",
                              });
                              console.error("Error updating chat title:", error);
                            });
                        }
                      } else if (e.key === "Escape") {
                        setIsEditingTitle(false);
                        setEditedTitle(currentChat.title);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      if (editedTitle.trim()) {
                        updateChatTitle(currentChat.id, editedTitle.trim())
                          .then(() => {
                            setIsEditingTitle(false);
                            toast({
                              title: "Chat renamed",
                              description: "The chat title has been updated",
                            });
                          })
                          .catch((error) => {
                            toast({
                              title: "Error renaming chat",
                              description: "Failed to update chat title",
                              variant: "destructive",
                            });
                            console.error("Error updating chat title:", error);
                          });
                      }
                    }}
                    className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))]"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(currentChat.title);
                    }}
                    className="border-[hsl(var(--border))]"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <h1 className="text-xl font-semibold text-gray-800">{currentChat.title}</h1>
                  <div className="flex items-center gap-3">
                    {/* Auto-generate flashcards toggle */}
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        Auto-generate
                        <span className="hidden sm:inline"> flashcards</span>
                      </div>
                      <Switch
                        checked={autoGenerateFlashcards}
                        onCheckedChange={setAutoGenerateFlashcards}
                        aria-label="Auto-generate flashcards"
                      />
                    </div>
                    <GenerateFlashcardsButton chatId={currentChat.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingTitle(true);
                        setEditedTitle(currentChat.title);
                      }}
                      className="text-gray-500 hover:text-[hsl(var(--primary))]"
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Rename
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-0 sm:p-2 md:p-4 pb-16 md:pb-0">
            <div className="container-max space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center py-16 max-w-md mx-auto">
                  <div className="inline-flex p-4 rounded-full bg-[hsl(var(--primary-light))] mb-6">
                    <Bot className="h-8 w-8 text-[hsl(var(--primary))]" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to LLM Flashcard Chat</h2>
                  <p className="text-gray-500 mb-8 text-lg">
                    Start a conversation with Claude to generate flashcards automatically
                  </p>
                  <div className="flex flex-col gap-3 text-left bg-white p-4 rounded-xl border border-[hsl(var(--border))] shadow-sm">
                    <h3 className="font-medium text-gray-700">Try asking about:</h3>
                    <div className="space-y-2 text-gray-600">
                      <p>• &quot;Explain the basics of quantum computing&quot;</p>
                      <p>• &quot;Teach me about Japanese grammar&quot;</p>
                      <p>• &quot;Summarize the key points of machine learning&quot;</p>
                    </div>
                  </div>
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
                        <div className="markdown-content relative pt-10">
                          <div className="absolute top-1 right-1 flex space-x-1 p-1 rounded-lg bg-gray-50">
                            {/* Generate flashcards button for assistant messages */}
                            <FlashcardButton chatId={currentChat?.id} messageId={message.id} />
                            
                            {/* Copy button for assistant messages */}
                            <CopyButton content={message.content} />
                          </div>
                          
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
                                // Using type assertion with a more specific type
                                const codeProps = props as { inline?: boolean };
                                const isInline = !match && codeProps.inline;
                                return isInline ? 
                                  <code className="bg-[hsl(var(--gray-100))] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code> : 
                                  <code className="block bg-[hsl(var(--gray-100))] p-3 rounded-md text-sm font-mono overflow-x-auto my-3" {...props}>{children}</code>;
                              },
                              pre: (props) => <pre className="bg-[hsl(var(--gray-100))] p-3 rounded-md overflow-x-auto my-3 text-sm" {...props} />,
                              blockquote: (props) => <blockquote className="border-l-4 border-[hsl(var(--primary-light))] bg-[hsl(var(--gray-50))] pl-4 py-1 italic my-4 text-gray-700" {...props} />,
                              table: (props) => <table className="border-collapse border border-[hsl(var(--border))] my-4 w-full" {...props} />,
                              th: (props) => <th className="border border-[hsl(var(--border))] px-4 py-2 bg-[hsl(var(--gray-100))]" {...props} />,
                              td: (props) => <td className="border border-[hsl(var(--border))] px-4 py-2" {...props} />,
                            }}
                          >
                            {message.content}
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
              {sendingMessage && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl bg-white border border-[hsl(var(--border))] px-5 py-4 shadow-sm">
                    <div className="flex space-x-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))] animate-pulse"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))] animate-pulse delay-150"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))] animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-[hsl(var(--border))] py-4 px-6 shadow-md mb-16 md:mb-0">
            <div className="container-max flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Claude..."
                className="min-h-[56px] resize-none border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] rounded-xl py-3 px-4 shadow-sm"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || sendingMessage}
                className="flex-shrink-0 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] rounded-xl shadow-sm hover-lift"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

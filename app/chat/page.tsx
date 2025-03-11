"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Bot, UserIcon, Lightbulb, Plus, MessageSquare, Copy, Check, BookOpen, Edit, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { useFlashcards } from "@/contexts/flashcard-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/services/api"

// Flashcard button component
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
        <div className="h-4 w-4 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
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
    startNewChat, 
    chats, 
    selectChat,
    autoGenerateFlashcards,
    setAutoGenerateFlashcards,
    updateChatTitle
  } = useChat()
  
  // State for chat title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const { generateCardsFromChat } = useFlashcards()
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

  // Use useRef to track if the generate flashcards button is already clicked
  const isGeneratingRef = useRef(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateFlashcards = async () => {
    if (!currentChat || isGeneratingRef.current || isGenerating) return

    // Set both state and ref to prevent duplicate clicks
    setIsGenerating(true)
    isGeneratingRef.current = true

    try {
      const result = await generateCardsFromChat(currentChat.id)
      toast({
        title: "Flashcards generated",
        description: `Flashcards have been created from this conversation (Deck ID: ${result.deck_id})`,
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
      console.error("Chat flashcard generation error:", error);
    } finally {
      setIsGenerating(false)
      // Reset the processing flag after a short delay to prevent rapid re-clicks
      setTimeout(() => {
        isGeneratingRef.current = false
      }, 1000)
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
        {/* Chat sidebar */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="p-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-4" onClick={startNewChat}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={`w-full justify-start text-left truncate ${
                      currentChat?.id === chat.id ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : ""
                    }`}
                    onClick={() => selectChat(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50 to-white">
          {/* Chat header with title */}
          {currentChat && (
            <div className="bg-white border-b p-4 flex items-center justify-between">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
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
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(currentChat.title);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <h1 className="text-xl font-semibold text-gray-800">{currentChat.title}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingTitle(true);
                      setEditedTitle(currentChat.title);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Rename
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-4 pb-20">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to LLM Flashcard Chat</h2>
                  <p className="text-gray-500 mb-6">
                    Start a conversation with Claude to generate flashcards automatically
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Bot className="h-5 w-5" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-blue-200"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="markdown-content relative pt-8">
                          <div className="absolute top-0 right-0 flex space-x-1">
                            {/* Generate flashcards button for assistant messages */}
                            <FlashcardButton chatId={currentChat?.id} messageId={message.id} />
                            
                            {/* Copy button for assistant messages */}
                            <CopyButton content={message.content} />
                          </div>
                          
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Override default styling for markdown elements
                              p: (props) => <p className="mb-4 last:mb-0" {...props} />,
                              h1: (props) => <h1 className="text-xl font-bold my-4" {...props} />,
                              h2: (props) => <h2 className="text-lg font-bold my-3" {...props} />,
                              h3: (props) => <h3 className="text-md font-bold my-2" {...props} />,
                              ul: (props) => <ul className="list-disc ml-6 mb-4" {...props} />,
                              ol: (props) => <ol className="list-decimal ml-6 mb-4" {...props} />,
                              li: (props) => <li className="mb-1" {...props} />,
                              a: (props) => <a className="text-blue-600 hover:underline" {...props} />,
                              code: ({className, children, ...props}) => {
                                const match = /language-(\w+)/.exec(className || '');
                                // Using type assertion with a more specific type
                                const codeProps = props as { inline?: boolean };
                                const isInline = !match && codeProps.inline;
                                return isInline ? 
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>{children}</code> : 
                                  <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto my-2" {...props}>{children}</code>;
                              },
                              pre: (props) => <pre className="bg-gray-100 p-2 rounded overflow-x-auto my-2" {...props} />,
                              blockquote: (props) => <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />,
                              table: (props) => <table className="border-collapse border border-gray-300 my-4" {...props} />,
                              th: (props) => <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />,
                              td: (props) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <div className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendingMessage && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-lg bg-white border border-blue-200 px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-150"></div>
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t p-4">
            <div className="mx-auto max-w-3xl flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0 border-blue-200 text-blue-600"
                    disabled={!currentChat || messages.length === 0}
                  >
                    <Lightbulb className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={handleGenerateFlashcards}
                    disabled={isGenerating}
                    className="flex items-center"
                  >
                    {isGenerating ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate flashcards from this chat"
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => {
                      if (currentChat) {
                        // Navigate to flashcards page with this chat's deck selected
                        router.push(`/flashcards?chatId=${currentChat.id}`);
                      }
                    }}
                    disabled={!currentChat}
                    className="flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View flashcards for this chat
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem
                    onClick={() => {
                      if (currentChat) {
                        // Navigate to side-by-side view
                        router.push(`/chat-with-flashcards?chatId=${currentChat.id}`);
                      }
                    }}
                    disabled={!currentChat}
                    className="flex items-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Side-by-side view
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <div className="px-2 py-1.5 text-sm flex items-center justify-between">
                    <span>Auto-generate flashcards</span>
                    <Switch
                      checked={autoGenerateFlashcards}
                      onCheckedChange={setAutoGenerateFlashcards}
                      aria-label="Toggle auto-generate flashcards"
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Claude..."
                className="min-h-[50px] resize-none border-blue-200 focus:border-blue-500"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || sendingMessage}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
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

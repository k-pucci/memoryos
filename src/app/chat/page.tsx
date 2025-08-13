// /app/chat/page.tsx - Floating chat widget with conversation starters
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  AtSign,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { DashboardLayout } from "@/components/layout/PageLayout";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  agent_used?: string;
  mentioned_agents?: string[];
  sources?: any[];
  timestamp: string;
}

// Quick action suggestions
const quickActions = [
  "Summarize my recent memories",
  "What are my most important tasks?",
  "Find insights from my notes",
  "Create a weekly review",
];

export default function ChatPage() {
  const router = useRouter();
  const { generateEmbedding, isLoading: isEmbeddingLoading } = useEmbeddings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);

    try {
      console.log("🤖 Generating embedding for unified chat...");

      let embedding = null;
      try {
        embedding = await generateEmbedding(currentMessage);
        console.log("✅ Embedding generated successfully");
      } catch (error) {
        console.error("❌ Failed to generate embedding:", error);
      }

      console.log("📤 Calling unified chat API...");

      const response = await fetch("/api/chat/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          embedding,
          chat_history: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Unified chat response:", data);

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.response,
        agent_used: data.agent_used,
        mentioned_agents: data.mentioned_agents,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in unified chat:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          "Sorry, I'm having trouble processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // Copy message to clipboard
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    textareaRef.current?.focus();
  };

  // Handle source click
  const handleSourceClick = (sourceId: string) => {
    router.push(`/memory/${sourceId}`);
  };

  return (
    <DashboardLayout
      currentPage="Chat"
      title="AI Chat"
      description="Intelligent conversations with your knowledge base"
    >
      {/* Floating Chat Container */}
      <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="h-[calc(100vh-16rem)] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-6">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Ready to chat!
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Ask me anything about your memories, or use @ to mention
                  specific agents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="p-3 text-left bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all text-sm card-shadow"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 p-6">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      copyMessage={copyMessage}
                      onSourceClick={handleSourceClick}
                    />
                  ))}

                  {isLoading && <LoadingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex-shrink-0 mt-4">
            <ChatInput
              inputMessage={inputMessage}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              sendMessage={sendMessage}
              isLoading={isLoading}
              isEmbeddingLoading={isEmbeddingLoading}
              textareaRef={textareaRef}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  copyMessage: (content: string) => void;
  onSourceClick: (sourceId: string) => void;
}

function MessageBubble({
  message,
  copyMessage,
  onSourceClick,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  if (message.role === "assistant") {
    // AI messages - Claude-style with no avatar/background
    return (
      <div
        className="flex justify-start"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex flex-col w-full relative group">
          <div className="px-0 py-3 relative">
            <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground">
              {message.content}
            </p>

            {showActions && (
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow"
                  onClick={() => copyMessage(message.content)}
                >
                  <Copy size={10} />
                </button>
                <button className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow">
                  <ThumbsUp size={10} />
                </button>
                <button className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow">
                  <ThumbsDown size={10} />
                </button>
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">
                  Sources from your memories:
                </p>
                <div className="space-y-1">
                  {message.sources.slice(0, 3).map((source, index) => (
                    <button
                      key={source.id || index}
                      onClick={() => onSourceClick(source.id)}
                      className="w-full text-left text-xs p-2 rounded-lg bg-card hover:bg-muted border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group card-shadow"
                    >
                      <div className="font-medium group-hover:text-primary transition-colors">
                        {source.title}
                      </div>
                      {source.summary && (
                        <div className="text-muted-foreground mt-1 line-clamp-1">
                          {source.summary}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    );
  }

  // User messages - keep existing style with avatar and background
  return (
    <div
      className="flex justify-end"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-4 max-w-[80%] flex-row-reverse">
        <div className="h-8 w-8 mt-1 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <User size={16} />
        </div>

        <div className="flex flex-col items-end relative group">
          <div className="rounded-2xl px-4 py-3 relative max-w-none bg-primary text-primary-foreground">
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {message.content}
            </p>

            {showActions && (
              <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow"
                  onClick={() => copyMessage(message.content)}
                >
                  <Copy size={10} />
                </button>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1 text-right">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Indicator Component
function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col w-full">
        <div className="px-0 py-3">
          <div className="flex space-x-1">
            <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
            <div
              className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Input Component
interface ChatInputProps {
  inputMessage: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: () => void;
  isLoading: boolean;
  isEmbeddingLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

function ChatInput({
  inputMessage,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  isLoading,
  isEmbeddingLoading,
  textareaRef,
}: ChatInputProps) {
  return (
    <div className="relative">
      <div className="bg-card border border-border rounded-xl card-shadow p-4">
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Type your message... Use @ to mention agents"
              className={cn(
                "w-full min-h-[44px] max-h-[120px] px-0 py-0",
                "bg-transparent border-0",
                "text-foreground placeholder:text-muted-foreground",
                "resize-none focus:outline-none",
                "text-sm leading-relaxed"
              )}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isEmbeddingLoading}
            />

            {inputMessage.includes("@") && (
              <div className="absolute right-0 top-0 text-primary">
                <AtSign size={16} />
              </div>
            )}
          </div>

          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || isEmbeddingLoading}
            size="sm"
            className="h-10 w-10 p-0 rounded-lg shrink-0"
          >
            {isLoading || isEmbeddingLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>

        {(isLoading || isEmbeddingLoading) && (
          <div className="mt-3 text-xs text-center">
            {isEmbeddingLoading ? (
              <span className="text-amber-600 dark:text-amber-400">
                Generating embedding...
              </span>
            ) : (
              <span className="text-primary">AI is thinking...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

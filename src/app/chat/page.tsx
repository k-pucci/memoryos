// /app/chat/page.tsx - Enhanced Unified Chat Interface
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Bot,
  User,
  Plus,
  Settings,
  AtSign,
  Sparkles,
  MessageSquare,
  Brain,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import Layout from "@/components/layout";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  expertise: string[];
  avatar_url?: string;
  model: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  agent_used?: string;
  mentioned_agents?: string[];
  sources?: any[];
  timestamp: string;
}

export default function UnifiedChatPage() {
  const { generateEmbedding, isLoading: isEmbeddingLoading } = useEmbeddings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's agents
  useEffect(() => {
    loadUserAgents();
    // Initialize with welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your unified AI assistant. I can help you with:\n\n• **General questions** - I'll automatically choose the best agent\n• **@mentions** - Type @agent-name to use a specific agent\n• **Complex requests** - Like "summarize my recent meetings and create next steps"\n\nWhat would you like to explore in your memories?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserAgents = async () => {
    try {
      const response = await fetch("/api/agents/user-agents");
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    }
  };

  // Get agent by name for display
  const getAgentByName = (agentName: string) => {
    return agents.find((a) => a.name === agentName) || agents[0];
  };

  // Insert agent mention
  const insertAgentMention = (agentName: string) => {
    const lastAtIndex = inputMessage.lastIndexOf("@");
    const beforeAt = inputMessage.substring(0, lastAtIndex);
    const newMessage =
      beforeAt + `@${agentName.toLowerCase().replace(" ", "-")} `;
    setInputMessage(newMessage);
    setShowAgentSuggestions(false);
    textareaRef.current?.focus();
  };

  // Handle @mention suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Show agent suggestions when typing @
    const lastAtIndex = value.lastIndexOf("@");
    const afterAt = value.substring(lastAtIndex + 1);

    if (lastAtIndex !== -1 && !afterAt.includes(" ") && afterAt.length >= 0) {
      setShowAgentSuggestions(true);
    } else {
      setShowAgentSuggestions(false);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

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
          chat_history: messages.slice(-10), // Last 10 messages for context
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

  // Copy message to clipboard
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  return (
    <Layout currentPage="Chat">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-4 p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Unified Chat
              </h1>
              <p className="text-muted-foreground mt-2">
                Chat with all your agents in one place
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => (window.location.href = "/agents/create")}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all text-primary cursor-pointer"
              >
                <Brain size={18} />
                <span className="hidden sm:inline">New Agent</span>
                <span className="sm:hidden">New</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer">
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">Settings</span>
              </button>
            </div>
          </div>

          {/* Agent Bar */}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground mb-3">
              <Brain size={20} className="text-primary" />
              Available Agents
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {agents.slice(0, 6).map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer flex-shrink-0"
                  onClick={() =>
                    setInputMessage(
                      (prev) =>
                        prev + `@${agent.name.toLowerCase().replace(" ", "-")} `
                    )
                  }
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={agent.avatar_url} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col h-full p-6 pt-3">
            {/* Chat Messages */}
            <div className="flex-1 min-h-0">
              <Card className="h-full bg-card border-border card-shadow flex flex-col">
                <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          getAgentByName={getAgentByName}
                          copyMessage={copyMessage}
                        />
                      ))}

                      {/* Loading indicator */}
                      {isLoading && <LoadingIndicator />}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Enhanced Input Area */}
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleInputChange={handleInputChange}
                  handleKeyDown={handleKeyDown}
                  sendMessage={sendMessage}
                  isLoading={isLoading}
                  isEmbeddingLoading={isEmbeddingLoading}
                  textareaRef={textareaRef}
                  showAgentSuggestions={showAgentSuggestions}
                  agents={agents}
                  insertAgentMention={insertAgentMention}
                />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: Message;
  getAgentByName: (name: string) => Agent | undefined;
  copyMessage: (content: string) => void;
}

function MessageBubble({
  message,
  getAgentByName,
  copyMessage,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex gap-3 max-w-[85%] ${
          message.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
          {message.role === "assistant" ? (
            message.agent_used ? (
              <>
                <AvatarImage
                  src={getAgentByName(message.agent_used)?.avatar_url}
                />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {message.agent_used.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary">
                <Bot size={18} />
              </AvatarFallback>
            )
          ) : (
            <AvatarFallback className="bg-primary/20 text-primary">
              <User size={18} />
            </AvatarFallback>
          )}
        </Avatar>

        {/* Message Content */}
        <div
          className={`flex flex-col ${
            message.role === "user" ? "items-end" : ""
          } relative`}
        >
          {/* Agent indicator */}
          {message.role === "assistant" && message.agent_used && (
            <div className="text-xs text-muted-foreground mb-1">
              <AtSign size={10} className="inline mr-1" />
              {message.agent_used}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "rounded-xl p-4 relative group",
              message.role === "assistant"
                ? "bg-muted text-foreground"
                : "bg-primary/10 text-foreground border border-primary/20"
            )}
          >
            <p className="whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>

            {/* Message Actions */}
            {showActions && (
              <div
                className={`absolute top-2 ${
                  message.role === "user" ? "left-2" : "right-2"
                } flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-background/80 hover:bg-background"
                  onClick={() => copyMessage(message.content)}
                >
                  <Copy size={12} />
                </Button>
                {message.role === "assistant" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-background/80 hover:bg-background"
                    >
                      <ThumbsUp size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-background/80 hover:bg-background"
                    >
                      <ThumbsDown size={12} />
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Sources from your memories:
                </p>
                <div className="space-y-1">
                  {message.sources.slice(0, 3).map((source) => (
                    <div
                      key={source.id}
                      className="text-xs p-2 rounded bg-secondary hover:bg-brand-coral/10 hover:text-brand-coral transition-colors border border-border cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/memory/${source.id}`)
                      }
                    >
                      <div className="font-medium">{source.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground mt-1">
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
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 mt-1">
          <AvatarFallback className="bg-primary/20 text-primary">
            <Bot size={18} />
          </AvatarFallback>
        </Avatar>
        <div className="bg-muted text-foreground rounded-xl p-4">
          <div className="flex space-x-2">
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
  setInputMessage: (message: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sendMessage: () => void;
  isLoading: boolean;
  isEmbeddingLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  showAgentSuggestions: boolean;
  agents: Agent[];
  insertAgentMention: (agentName: string) => void;
}

function ChatInput({
  inputMessage,
  setInputMessage,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  isLoading,
  isEmbeddingLoading,
  textareaRef,
  showAgentSuggestions,
  agents,
  insertAgentMention,
}: ChatInputProps) {
  return (
    <div className="flex-shrink-0 border-t border-border bg-background relative">
      {/* Agent Suggestions Dropdown */}
      {showAgentSuggestions && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-lg card-shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2">
              Available agents:
            </div>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 p-2 hover:bg-brand-coral/10 hover:text-brand-coral rounded cursor-pointer transition-colors"
                onClick={() => insertAgentMention(agent.name)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={agent.avatar_url} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">{agent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Ask anything... Use @agent-name to mention specific agents"
              className={cn(
                "w-full min-h-[48px] max-h-[120px] px-4 py-3 pr-4",
                "bg-card border border-border rounded-xl",
                "text-foreground placeholder:text-muted-foreground",
                "resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                "shadow-sm"
              )}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isEmbeddingLoading}
            />

            {/* Mention indicator */}
            {inputMessage.includes("@") && (
              <div className="absolute right-3 top-3 text-primary">
                <AtSign size={16} />
              </div>
            )}
          </div>

          <Button
            size="icon"
            className={cn(
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-sm",
              "h-[48px] w-[48px] flex-shrink-0"
            )}
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || isEmbeddingLoading}
          >
            {isLoading || isEmbeddingLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>

        {/* Helper text */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          {isEmbeddingLoading ? (
            <span className="text-amber-600 dark:text-amber-400">
              Generating embedding...
            </span>
          ) : isLoading ? (
            <span className="text-primary">AI is thinking...</span>
          ) : (
            <>
              Type <span className="text-primary">@agent-name</span> to mention
              specific agents •{" "}
              <span className="text-muted-foreground">Press Enter to send</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

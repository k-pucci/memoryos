// /app/chat/page.tsx - Unified Chat Interface
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

  // Insert agent mention - SINGLE DECLARATION
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

  return (
    <Layout currentPage="Chat">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Unified Chat
              </h2>
              <p className="text-xs text-muted-foreground">
                Chat with all your agents in one place
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (window.location.href = "/agents/create")}
              title="Create new agent"
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Manage agents"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Agent Bar */}
        <div className="flex-shrink-0 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {agents.slice(0, 6).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all cursor-pointer flex-shrink-0"
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
                <span className="text-sm text-foreground">{agent.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0">
          <Card className="h-full bg-card border-border card-shadow flex flex-col">
            <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[85%] ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          {message.role === "assistant" ? (
                            message.agent_used ? (
                              <>
                                <AvatarImage
                                  src={
                                    getAgentByName(message.agent_used)
                                      ?.avatar_url
                                  }
                                />
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                  {message.agent_used.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </>
                            ) : (
                              <AvatarFallback className="bg-blue-500/20 text-blue-500">
                                <Bot size={16} />
                              </AvatarFallback>
                            )
                          ) : (
                            <AvatarFallback className="bg-primary/20 text-primary">
                              <User size={16} />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        {/* Message Content */}
                        <div
                          className={`flex flex-col ${
                            message.role === "user" ? "items-end" : ""
                          }`}
                        >
                          {/* Agent indicator */}
                          {message.role === "assistant" &&
                            message.agent_used && (
                              <div className="text-xs text-muted-foreground mb-1">
                                <AtSign size={10} className="inline mr-1" />
                                {message.agent_used}
                              </div>
                            )}

                          {/* Message bubble */}
                          <div
                            className={cn(
                              "rounded-lg p-3",
                              message.role === "assistant"
                                ? "bg-muted text-foreground"
                                : "bg-primary/10 text-foreground border border-primary/20"
                            )}
                          >
                            <p className="whitespace-pre-wrap">
                              {message.content}
                            </p>

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
                                      className="text-xs p-2 rounded bg-secondary hover:bg-accent transition-colors border border-border cursor-pointer"
                                      onClick={() =>
                                        (window.location.href = `/memory/${source.id}`)
                                      }
                                    >
                                      <div className="font-medium text-foreground">
                                        {source.title}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarFallback className="bg-blue-500/20 text-blue-500">
                            <Bot size={16} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted text-foreground rounded-lg p-3">
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
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-border bg-muted/30 relative">
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
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                        onClick={() => insertAgentMention(agent.name)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={agent.avatar_url} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm text-foreground">
                            {agent.name}
                          </div>
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
                <div className="flex items-end gap-3">
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      placeholder="Ask anything... Use @agent-name to mention specific agents"
                      className={cn(
                        "w-full min-h-[44px] max-h-[120px] px-4 py-3 pr-12",
                        "bg-background border border-border rounded-lg",
                        "text-foreground placeholder:text-muted-foreground",
                        "resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      )}
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading || isEmbeddingLoading}
                    />

                    {/* Mention indicator */}
                    {inputMessage.includes("@") && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 text-primary">
                        <AtSign size={14} />
                      </div>
                    )}
                  </div>

                  <Button
                    size="icon"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11 w-11"
                    onClick={sendMessage}
                    disabled={
                      !inputMessage.trim() || isLoading || isEmbeddingLoading
                    }
                  >
                    {isLoading || isEmbeddingLoading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </Button>
                </div>

                {/* Helper text */}
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  {isEmbeddingLoading ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Generating embedding...
                    </span>
                  ) : isLoading ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      AI is thinking...
                    </span>
                  ) : (
                    <>
                      Type <span className="text-primary">@agent-name</span> to
                      mention specific agents •
                      <span className="text-muted-foreground">
                        {" "}
                        Press Enter to send
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

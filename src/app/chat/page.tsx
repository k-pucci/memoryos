// /app/chat/page.tsx - Modern floating chat interface
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SelectionGroup,
  SelectionOption,
} from "@/components/ui/selection-group";
import {
  Send,
  Bot,
  User,
  AtSign,
  Brain,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Plus,
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

// Quick action suggestions
const quickActions = [
  "Summarize my recent memories",
  "What are my most important tasks?",
  "Find insights from my notes",
  "Create a weekly review",
];

export default function ChatPage() {
  const { generateEmbedding, isLoading: isEmbeddingLoading } = useEmbeddings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's agents
  useEffect(() => {
    loadUserAgents();

    // Check if there's a selected agent from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const agentId = urlParams.get("agent");
    if (agentId) {
      setTimeout(() => {
        const agent = agents.find((a) => a.id === agentId);
        if (agent) {
          setSelectedAgent(agent);
          setInputMessage(`@${agent.name.toLowerCase().replace(" ", "-")} `);
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserAgents = async () => {
    try {
      const response = await fetch("/api/agents/user-agents");
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
      setAgents([]);
    }
  };

  // Get agent options for SelectionGroup
  const getAgentOptions = (): SelectionOption[] => {
    return [
      {
        value: "",
        label: "Auto-select",
        icon: <Sparkles size={16} />,
        description: "Let AI choose the best agent",
      },
      ...agents.map((agent) => ({
        value: agent.id,
        label: agent.name,
        icon: agent.avatar_url ? (
          <img src={agent.avatar_url} alt="" className="w-4 h-4 rounded-full" />
        ) : (
          <Bot size={16} />
        ),
        description: agent.description,
      })),
    ];
  };

  // Handle agent selection
  const handleAgentChange = (agentId: string) => {
    if (agentId === "") {
      setSelectedAgent(null);
      window.history.replaceState({}, "", "/chat");
    } else {
      const agent = agents.find((a) => a.id === agentId);
      setSelectedAgent(agent || null);
      if (agent) {
        const url = new URL(window.location.href);
        url.searchParams.set("agent", agent.id);
        window.history.replaceState({}, "", url.toString());
      }
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
          chat_history: messages.slice(-10),
          selected_agent: selectedAgent?.id,
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
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    textareaRef.current?.focus();
  };

  // Start new conversation
  const startNewConversation = () => {
    setMessages([]);
    setSelectedAgent(null);
    setInputMessage("");
    window.history.replaceState({}, "", "/chat");
  };

  return (
    <Layout currentPage="Chat">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Main Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">AI Chat</h1>
              <p className="text-muted-foreground mt-2">
                {selectedAgent
                  ? `Chatting with ${selectedAgent.name}`
                  : "Chat with your AI assistants"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={startNewConversation}>
                <Plus size={18} />
                <span className="ml-2">New Chat</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/agents/view")}
              >
                <Brain size={18} />
                <span className="ml-2">Manage Agents</span>
              </Button>
            </div>
          </div>

          {/* Agent Selection */}
          <SelectionGroup
            options={getAgentOptions()}
            value={selectedAgent?.id || ""}
            onChange={handleAgentChange}
            label="Select Agent"
            variant="buttons"
            size="sm"
          />
        </div>

        {/* Floating Chat Container */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 h-full">
            <div className="w-full max-w-4xl h-full flex flex-col mx-auto">
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
                          getAgentByName={getAgentByName}
                          copyMessage={copyMessage}
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
                  showAgentSuggestions={showAgentSuggestions}
                  agents={agents}
                  insertAgentMention={insertAgentMention}
                  selectedAgent={selectedAgent}
                />
              </div>
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
        className={`flex gap-4 max-w-[80%] ${
          message.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
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
                <Bot size={16} />
              </AvatarFallback>
            )
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary">
              <User size={16} />
            </AvatarFallback>
          )}
        </Avatar>

        <div
          className={`flex flex-col ${
            message.role === "user" ? "items-end" : ""
          } relative group`}
        >
          {message.role === "assistant" && message.agent_used && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <AtSign size={10} />
              {message.agent_used}
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl px-4 py-3 relative max-w-none",
              message.role === "assistant"
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {message.content}
            </p>

            {showActions && (
              <div
                className={`absolute -top-2 ${
                  message.role === "user" ? "-left-2" : "-right-2"
                } flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <button
                  className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow"
                  onClick={() => copyMessage(message.content)}
                >
                  <Copy size={10} />
                </button>
                {message.role === "assistant" && (
                  <>
                    <button className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow">
                      <ThumbsUp size={10} />
                    </button>
                    <button className="h-6 w-6 bg-background border border-border hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer card-shadow">
                      <ThumbsDown size={10} />
                    </button>
                  </>
                )}
              </div>
            )}

            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Sources from your memories:
                </p>
                <div className="space-y-1">
                  {message.sources.slice(0, 3).map((source, index) => (
                    <div
                      key={source.id || index}
                      className="text-xs p-2 rounded-lg bg-background/50 hover:bg-background border border-border/50 hover:border-border transition-colors cursor-pointer"
                    >
                      <div className="font-medium">{source.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`text-xs text-muted-foreground mt-1 ${
              message.role === "user" ? "text-right" : ""
            }`}
          >
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
      <div className="flex gap-4">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-primary/20 text-primary">
            <Bot size={16} />
          </AvatarFallback>
        </Avatar>
        <div className="bg-muted text-foreground rounded-2xl px-4 py-3">
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
  showAgentSuggestions: boolean;
  agents: Agent[];
  insertAgentMention: (agentName: string) => void;
  selectedAgent: Agent | null;
}

function ChatInput({
  inputMessage,
  handleInputChange,
  handleKeyDown,
  sendMessage,
  isLoading,
  isEmbeddingLoading,
  textareaRef,
  showAgentSuggestions,
  agents,
  insertAgentMention,
  selectedAgent,
}: ChatInputProps) {
  return (
    <div className="relative">
      {showAgentSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl card-shadow z-10">
          <div className="p-3">
            <div className="text-xs text-muted-foreground mb-3 font-medium">
              Available agents:
            </div>
            <div className="space-y-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-2 hover:bg-primary/10 hover:text-primary rounded-lg cursor-pointer transition-colors"
                  onClick={() => insertAgentMention(agent.name)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={agent.avatar_url} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {agent.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl card-shadow p-4">
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder={
                selectedAgent
                  ? `Ask ${selectedAgent.name} anything...`
                  : "Type your message... Use @ to mention agents"
              }
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

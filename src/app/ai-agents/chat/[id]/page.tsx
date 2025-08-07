// app/ai-agents/chat/[id]/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bot,
  Send,
  Paperclip,
  ChevronLeft,
  Settings,
  RefreshCw,
  Sparkles,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Sample agents data - this would come from your database in a real app
const sampleAgents = [
  {
    id: "agent-1",
    name: "MemoryOS Assistant",
    description:
      "Your general-purpose memory assistant that can help you find and organize your memories.",
    avatar: "/avatars/robot-blue.png",
    directive:
      "You are a helpful assistant that uses my stored memories to provide accurate information and insights based solely on my personal history and notes.",
    createdAt: "2025-04-10T12:00:00Z",
    specialty: "general",
    color: "blue",
  },
  {
    id: "agent-2",
    name: "Researcher",
    description:
      "Specialized in analyzing research papers and technical content in your memory stack.",
    avatar: "/avatars/robot-purple.png",
    directive:
      "You are a research specialist that analyzes my stored technical content and research papers to extract insights, summarize findings, and connect related concepts.",
    createdAt: "2025-04-15T14:30:00Z",
    specialty: "research",
    color: "purple",
  },
  {
    id: "agent-3",
    name: "Meeting Assistant",
    description:
      "Helps you prepare for meetings by recalling relevant information and previous discussions.",
    avatar: "/avatars/robot-green.png",
    directive:
      "You are a meeting assistant that recalls previous meeting notes, action items, and relevant context to help me prepare for upcoming meetings and follow up on past commitments.",
    createdAt: "2025-04-20T09:15:00Z",
    specialty: "meetings",
    color: "emerald",
  },
];

// Sample message history
const sampleMessages = [
  {
    id: "msg-1",
    role: "assistant",
    content:
      "Hi there! I'm your MemoryOS Assistant. How can I help you access your memories today?",
    timestamp: "2025-05-17T13:00:00Z",
  },
];

// Message interface
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: {
    id: string;
    title: string;
    excerpt: string;
  }[];
}

export default function AgentChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get agent details
  useEffect(() => {
    const foundAgent = sampleAgents.find((a) => a.id === params.id);
    if (foundAgent) {
      setAgent(foundAgent);
      // Initialize with welcome message
      setMessages([
        {
          id: "welcome-msg",
          role: "assistant",
          content: `Hi there! I'm your ${foundAgent.name}. How can I help you access your memories today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      // Redirect if agent not found
      router.push("/ai-agents");
    }
  }, [params.id, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send a message
  // Replace the sendMessage function in your chat component with this:

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage; // Store the message before clearing
    setInputMessage("");
    setIsLoading(true);

    try {
      // Make actual API call to your AI agents endpoint
      const response = await fetch("/api/ai-agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          agentType: getAgentType(agent.specialty), // Map agent specialty to agent type
          // Note: We're not sending embedding here since the client-side embedding generation
          // would require the useEmbeddings hook. For now, the API will fall back to text search
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();

      // Create AI message from API response
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response.",
        timestamp: new Date().toISOString(),
        sources: data.sources
          ? data.sources.map((source: any) => ({
              id: source.id,
              title: source.title,
              excerpt: source.content
                ? source.content.substring(0, 100) + "..."
                : source.summary || "No preview available",
            }))
          : [],
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling AI agent:", error);

      // Error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map agent specialty to agent type
  const getAgentType = (
    specialty: string
  ): "helper" | "analyzer" | "summarizer" => {
    switch (specialty) {
      case "research":
        return "analyzer";
      case "meetings":
        return "summarizer";
      case "general":
      default:
        return "helper";
    }
  };

  // Handle input submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Reset conversation
  const resetConversation = () => {
    if (
      window.confirm(
        "Are you sure you want to reset this conversation? All messages will be cleared."
      )
    ) {
      setMessages([
        {
          id: "welcome-msg-new",
          role: "assistant",
          content: `Hi there! I'm your ${agent?.name}. How can I help you access your memories today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // Back to agents list
  const goBack = () => {
    router.push("/ai-agents");
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!agent) {
    return (
      <Layout currentPage="AI Agents">
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="AI Agents">
      <div className="flex flex-col h-full max-h-[calc(100vh-120px)] overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goBack}
            >
              <ChevronLeft size={20} />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={agent.avatar} alt={agent.name} />
              <AvatarFallback
                className={`bg-${agent.color}-500/20 text-${agent.color}-300`}
              >
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold">{agent.name}</h2>
              <p className="text-xs text-gray-400">{agent.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetConversation}
            >
              <RefreshCw size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/ai-agents/settings/${agent.id}`)}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Chat Container - Takes remaining height */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Card className="flex-1 bg-slate-800/30 border-slate-700 flex flex-col min-h-0">
            {/* Messages Area - Scrollable, takes available space */}
            <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4 pb-2">
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
                        className={`flex gap-3 max-w-[80%] ${
                          message.role === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          {message.role === "assistant" ? (
                            <>
                              <AvatarImage
                                src={agent.avatar}
                                alt={agent.name}
                              />
                              <AvatarFallback
                                className={`bg-${agent.color}-500/20 text-${agent.color}-300`}
                              >
                                {agent.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </>
                          ) : (
                            <AvatarFallback className="bg-purple-500/20 text-purple-300">
                              <User size={16} />
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div
                          className={`flex flex-col min-w-0 ${
                            message.role === "user" ? "items-end" : ""
                          }`}
                        >
                          <div
                            className={`rounded-lg p-3 break-words ${
                              message.role === "assistant"
                                ? "bg-slate-800 text-gray-200"
                                : "bg-purple-500/20 text-gray-100"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>

                            {/* Sources section for assistant messages */}
                            {message.role === "assistant" &&
                              message.sources &&
                              message.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                  <p className="text-xs text-gray-400 mb-2">
                                    Sources:
                                  </p>
                                  <div className="space-y-2">
                                    {message.sources.map((source) => (
                                      <div
                                        key={source.id}
                                        className="text-xs p-3 rounded bg-slate-900/50 cursor-pointer hover:bg-slate-900/70 transition-colors border border-slate-700/50"
                                        onClick={() =>
                                          router.push(`/memory/${source.id}`)
                                        }
                                      >
                                        <div className="font-medium text-gray-300 mb-1">
                                          {source.title}
                                        </div>
                                        <div className="text-gray-400 italic">
                                          "{source.excerpt}"
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={10} className="mr-1" />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3 max-w-[80%]">
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback
                            className={`bg-${agent.color}-500/20 text-${agent.color}-300`}
                          >
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="bg-slate-800 text-gray-200 rounded-lg p-3">
                          <div className="flex space-x-2">
                            <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div
                              className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"
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

            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-800/20">
              <CardFooter className="p-4">
                <div className="flex items-end w-full gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white flex-shrink-0 mb-1"
                  >
                    <Paperclip size={18} />
                  </Button>

                  <div className="relative flex-1 max-w-none">
                    <textarea
                      placeholder="Ask a question about your memories..."
                      className="w-full min-h-[44px] max-h-[120px] px-3 py-2 pr-12 bg-slate-900/50 border border-slate-700 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      style={{
                        height: "auto",
                        minHeight: "44px",
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height =
                          Math.min(target.scrollHeight, 120) + "px";
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 bottom-1 h-8 w-8 text-purple-400 hover:text-purple-300 flex-shrink-0"
                      onClick={() => setInputMessage("")}
                      disabled={!inputMessage}
                    >
                      <Sparkles size={14} />
                    </Button>
                  </div>

                  <Button
                    size="icon"
                    className={`bg-${agent.color}-500 text-white hover:bg-${agent.color}-600 flex-shrink-0 h-11 w-11`}
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send size={18} />
                  </Button>
                </div>

                {/* Helper text */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </CardFooter>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

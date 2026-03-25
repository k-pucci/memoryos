// /app/chat/page.tsx - Floating chat widget with conversation starters
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
import { useChatSettings } from "@/hooks/useChatSettings";
import { DashboardLayout } from "@/components/layout/PageLayout";
import { ChatSettingsDialog } from "@/components/chat/ChatSettingsDialog";
import { MemoryDetailPanel } from "@/components/chat/MemoryDetailPanel";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  return (
    <Suspense fallback={
      <DashboardLayout currentPage="Chat" title="AI Chat" description="Intelligent conversations with your knowledge base">
        <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdFromUrl = searchParams.get("session");

  const { generateEmbedding, isLoading: isEmbeddingLoading } = useEmbeddings();
  const { settings: chatSettings, updateSettings: updateChatSettings } = useChatSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false); // Track if actively streaming
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestore = useRef<string | null>(null);

  // Track sessions we created ourselves (skip loading messages for these)
  const createdSessionsRef = useRef<Set<string>>(new Set());
  // Track if we're currently sending a message (prevent effect interference)
  const isSendingRef = useRef(false);
  // Track the ID of the latest user message for spotlight scroll
  const [latestUserMessageId, setLatestUserMessageId] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  // Get the scroll container element from ScrollArea
  const getScrollContainer = useCallback(() => {
    return scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
  }, []);

  // Save scroll position to sessionStorage
  const saveScrollPosition = useCallback((sessionId: string) => {
    const container = getScrollContainer();
    if (container) {
      const scrollPosition = container.scrollTop;
      sessionStorage.setItem(`chat-scroll-${sessionId}`, String(scrollPosition));
    }
  }, [getScrollContainer]);

  // Restore scroll position from sessionStorage
  const restoreScrollPosition = useCallback((sessionId: string) => {
    const savedPosition = sessionStorage.getItem(`chat-scroll-${sessionId}`);
    if (savedPosition) {
      const container = getScrollContainer();
      if (container) {
        container.scrollTop = parseInt(savedPosition, 10);
      }
    }
  }, [getScrollContainer]);

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    if (!currentSessionId) return;

    const container = getScrollContainer();
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollPosition(currentSessionId);
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [currentSessionId, getScrollContainer, saveScrollPosition]);

  // Save scroll position before unload
  useEffect(() => {
    if (!currentSessionId) return;

    const handleBeforeUnload = () => {
      saveScrollPosition(currentSessionId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSessionId, saveScrollPosition]);

  // Restore scroll position after messages are loaded
  useEffect(() => {
    if (pendingScrollRestore.current && messages.length > 0 && !isLoadingMessages) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        if (pendingScrollRestore.current) {
          restoreScrollPosition(pendingScrollRestore.current);
          pendingScrollRestore.current = null;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoadingMessages, restoreScrollPosition]);

  // Load messages when session ID changes
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id || `msg-${msg.created_at}`,
          content: msg.content,
          role: msg.role,
          agent_used: msg.agent_used,
          sources: msg.sources,
          timestamp: msg.created_at,
        }));
        setMessages(loadedMessages);
        // Mark that we need to restore scroll position after render
        pendingScrollRestore.current = sessionId;
      } else {
        // Session doesn't exist or access denied - redirect to clean chat
        console.warn("Session not found, starting fresh chat");
        setMessages([]);
        setCurrentSessionId(null);
        router.replace('/chat', { scroll: false });
      }
    } catch (error) {
      console.error("Error loading session messages:", error);
      setMessages([]);
      setCurrentSessionId(null);
      router.replace('/chat', { scroll: false });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [router]);

  // Sync session ID from URL and load messages
  useEffect(() => {
    // Don't interfere while actively sending a message
    if (isSendingRef.current) return;

    if (sessionIdFromUrl && sessionIdFromUrl !== currentSessionId) {
      setCurrentSessionId(sessionIdFromUrl);
      // Only load messages if we didn't just create this session
      if (!createdSessionsRef.current.has(sessionIdFromUrl)) {
        loadSessionMessages(sessionIdFromUrl);
      }
    } else if (!sessionIdFromUrl && currentSessionId) {
      // URL cleared (new chat without session)
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [sessionIdFromUrl, currentSessionId, loadSessionMessages]);

  // Spotlight scroll - scroll so user message is near top with room for AI response below
  useEffect(() => {
    if (latestUserMessageId) {
      // Small delay to ensure DOM is updated after state change
      const timer = setTimeout(() => {
        const container = getScrollContainer();
        if (container && latestUserMessageRef.current) {
          // Get the message element's position
          const messageEl = latestUserMessageRef.current;
          const messageTop = messageEl.offsetTop;

          // Position the user message about 15% down from top, leaving ~85% for AI response
          const containerHeight = container.clientHeight;
          const targetOffset = containerHeight * 0.15;

          // Scroll so the user message sits at the target offset from top
          const scrollTarget = Math.max(0, messageTop - targetOffset);
          container.scrollTo({ top: scrollTarget, behavior: "smooth" });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [latestUserMessageId, getScrollContainer]);

  // Create a new session
  const createSession = async (title: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.session.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Mark that we're sending to prevent effect interference
    isSendingRef.current = true;

    const userMessageId = `msg-${Date.now()}-user`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLatestUserMessageId(userMessageId); // Trigger spotlight scroll
    const currentMessage = inputMessage;
    setInputMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);

    try {
      // Create a session if one doesn't exist
      let sessionId = currentSessionId;
      if (!sessionId) {
        const title = currentMessage.length > 50
          ? currentMessage.substring(0, 50) + "..."
          : currentMessage;
        sessionId = await createSession(title);
        if (sessionId) {
          // Mark this session as created by us (skip loading messages for it)
          createdSessionsRef.current.add(sessionId);
          setCurrentSessionId(sessionId);
          // Update URL without triggering React navigation
          window.history.replaceState(null, '', `/chat?session=${sessionId}`);
        }
      }

      console.log("🤖 Generating embedding for unified chat...");

      let embedding = null;
      try {
        embedding = await generateEmbedding(currentMessage);
        console.log("✅ Embedding generated successfully");
      } catch (error) {
        console.error("❌ Failed to generate embedding:", error);
      }

      console.log("📤 Calling streaming chat API...");

      // Create a placeholder message for streaming
      const aiMessageId = `msg-${Date.now()}-ai`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        agent_used: "Memory Assistant",
        sources: [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Use streaming endpoint
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          embedding,
          chat_history: messages.slice(-10),
          session_id: sessionId,
          retrieval_settings: {
            threshold: chatSettings.threshold,
            contentPreviewLength: chatSettings.contentPreviewLength,
            maxResults: chatSettings.maxResults,
            customDirective: chatSettings.customDirective || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let streamedContent = "";
      let streamedSources: any[] = [];
      let hasStartedStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk" && data.content) {
                // Mark streaming started on first content chunk
                if (!hasStartedStreaming) {
                  hasStartedStreaming = true;
                  setIsStreaming(true);
                }
                streamedContent += data.content;
                // Update the message content in real-time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, content: streamedContent }
                      : msg
                  )
                );
              } else if (data.type === "sources") {
                // Store sources but don't render yet — wait until streaming is done
                streamedSources = data.sources || [];
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      setIsStreaming(false);

      // Attach sources after streaming is done so they appear below the response
      if (streamedSources.length > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, sources: streamedSources }
              : msg
          )
        );
      }

      console.log("📥 Streaming complete");
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
      setIsStreaming(false);
      isSendingRef.current = false;
      // Refocus textarea so user can immediately type another message
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Don't send if already loading
      if (!isLoading && !isEmbeddingLoading) {
        sendMessage();
      }
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

  // Handle source click - open in side panel instead of navigating away
  const handleSourceClick = (sourceId: string) => {
    setSelectedMemoryId(sourceId);
  };

  return (
    <>
    <DashboardLayout
      currentPage="Chat"
      title="AI Chat"
      description="Intelligent conversations with your knowledge base"
      actions={
        <ChatSettingsDialog
          settings={chatSettings}
          onUpdateSettings={updateChatSettings}
        />
      }
    >
      {/* Floating Chat Container */}
      <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 min-h-0">
            {(isLoadingMessages || (sessionIdFromUrl && messages.length === 0)) ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            ) : messages.length === 0 ? (
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
              <div className="relative h-full">
                {/* Top fade/blur effect */}
                <div className="absolute top-0 left-0 right-4 h-6 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

                <ScrollArea ref={scrollAreaRef} className="h-full pr-4">
                  <div className="space-y-6 p-6 pt-8">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        ref={message.id === latestUserMessageId ? latestUserMessageRef : null}
                      >
                        <MessageBubble
                          message={message}
                          copyMessage={copyMessage}
                          onSourceClick={handleSourceClick}
                        />
                      </div>
                    ))}

                    {isLoading && !isStreaming && <LoadingIndicator />}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
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

    {/* Memory Detail Side Panel */}
    <MemoryDetailPanel
      memoryId={selectedMemoryId}
      onClose={() => setSelectedMemoryId(null)}
      onDeleted={(deletedId) => {
        setSelectedMemoryId(null);
        // Remove deleted memory from all message sources
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            sources: msg.sources?.filter((s: any) => s.id !== deletedId),
          }))
        );
      }}
    />
    </>
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
    // Don't render empty assistant messages (loading indicator handles this)
    if (!message.content) return null;

    // AI messages - Claude-style with no avatar/background
    return (
      <div
        className="flex justify-start"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex flex-col w-full relative group">
          <div className="px-0 py-3 relative">
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>

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
                      className="w-full text-left text-xs p-2 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer card-shadow group/source"
                    >
                      <div className="font-medium group-hover/source:text-primary transition-colors">
                        {source.title}
                      </div>
                      {source.content && (
                        <div className="text-muted-foreground mt-1 line-clamp-2">
                          {source.content}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Only show timestamp once content exists */}
          {message.content && (
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
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

// Loading Indicator Component - subtle pulsing dots
function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col w-full">
        <div className="px-0 py-3">
          <div className="flex space-x-1.5 items-center">
            <div
              className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-pulse"
            ></div>
            <div
              className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-pulse"
              style={{ animationDelay: "0.15s" }}
            ></div>
            <div
              className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-pulse"
              style={{ animationDelay: "0.3s" }}
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
              placeholder="Type your message..."
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

      </div>
    </div>
  );
}

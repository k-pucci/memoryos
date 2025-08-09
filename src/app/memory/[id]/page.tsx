// src/app/memory/[id]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import {
  Loader2,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  ExternalLink,
  Tag,
  Archive,
  BookOpen,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary: string;
  tags: string[];
  source_url: string | null;
  has_reminder: boolean;
  created_at: string;
  updated_at: string;
}

interface RelatedMemory {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  similarity: number;
}

// Helper function to get memory type styling
const getMemoryTypeClasses = (type: string) => {
  const typeKey = type.toLowerCase().replace(/\s+/g, "-");
  return {
    text: `memory-${typeKey}`,
    bg: `memory-${typeKey}-bg`,
    border: `memory-${typeKey}-border`,
  };
};

// Helper function to get category styling
const getCategoryClasses = (category: string) => {
  const categoryKey = category.toLowerCase().replace(/\s+/g, "-");
  return {
    text: `memory-${categoryKey}`,
    bg: `memory-${categoryKey}-bg`,
    border: `memory-${categoryKey}-border`,
  };
};

export default function MemoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memoryId = params?.id as string;

  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    memory_type: "",
    content: "",
    tags: "",
    source_url: "",
    has_reminder: false,
  });

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000); // Hide after 4 seconds
  };

  // Related memories
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemory[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Fetch memory data on mount
  useEffect(() => {
    if (!memoryId) return;

    async function fetchMemory() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/memories/${memoryId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch memory");
        }

        const data = await response.json();
        setMemory(data);

        // Initialize form data
        setEditForm({
          title: data.title,
          category: data.category,
          memory_type: data.memory_type,
          content: data.content,
          tags: data.tags?.join(", ") || "",
          source_url: data.source_url || "",
          has_reminder: data.has_reminder || false,
        });

        // Fetch related memories
        fetchRelatedMemories(data.content);
      } catch (error: any) {
        console.error("Error fetching memory:", error);
        setError(error.message || "Failed to fetch memory");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMemory();
  }, [memoryId]);

  // Fetch related memories based on content
  const fetchRelatedMemories = async (content: string) => {
    try {
      setIsLoadingRelated(true);
      const response = await fetch("/api/memories/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: content.substring(0, 300), // Use first 300 chars to find related content
          limit: 3,
          // Exclude current memory
          exclude_ids: [memoryId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch related memories");
      }

      const data = await response.json();
      setRelatedMemories(data.results || []);
    } catch (error: any) {
      console.error("Error fetching related memories:", error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle form submission (update memory)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Parse tags
      const parsedTags = editForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          tags: parsedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update memory");
      }

      const result = await response.json();

      // Fetch updated memory
      const updatedMemoryResponse = await fetch(`/api/memories/${memoryId}`);
      const updatedMemory = await updatedMemoryResponse.json();

      setMemory(updatedMemory);
      setIsEditing(false);
      showNotification("success", "Memory updated successfully!");
    } catch (error: any) {
      console.error("Error updating memory:", error);
      showNotification("error", error.message || "Failed to update memory");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle memory deletion
  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteConfirm(false);

      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete memory");
      }

      showNotification("success", "Memory deleted successfully!");
      // Wait a bit for user to see the notification before redirecting
      setTimeout(() => {
        router.push("/library");
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting memory:", error);
      showNotification("error", error.message || "Failed to delete memory");
      setIsDeleting(false);
    }
  };

  // Go back to previous page
  const goBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <Layout currentPage="">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading memory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !memory) {
    return (
      <Layout currentPage="">
        <div className="flex flex-col h-full max-h-screen overflow-hidden">
          <div className="flex-shrink-0 space-y-6 p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold brand-terracotta">
                  Memory Not Found
                </h1>
                <p className="text-muted-foreground mt-2">
                  The memory you're looking for doesn't exist
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="p-6 pt-4">
              <Card className="bg-card border-border card-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Archive
                      size={48}
                      className="text-muted-foreground/50 mb-4"
                    />
                    <h2 className="text-lg font-medium text-foreground mb-2">
                      Memory Not Found
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {error ||
                        "This memory may have been deleted or doesn't exist"}
                    </p>
                    <button
                      onClick={goBack}
                      className="px-6 py-3 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer font-medium"
                    >
                      Go Back
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryClasses = getCategoryClasses(memory.category);
  const typeClasses = getMemoryTypeClasses(memory.memory_type);

  return (
    <Layout currentPage="">
      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 duration-300",
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
            )}
          >
            {notification.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Delete Memory
                </h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-foreground mb-6">
              Are you sure you want to delete "{memory?.title}"? This will
              permanently remove the memory from your collection.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer dark:text-red-400"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete Memory
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Memory Details
              </h1>
              <p className="text-muted-foreground mt-2">
                View and edit your memory
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </button>

              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all text-primary cursor-pointer"
                  >
                    <Edit size={18} />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-all text-destructive cursor-pointer"
                  >
                    {isDeleting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg hover:bg-brand-coral/10 hover:text-brand-coral hover:border-brand-coral/20 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                {/* Memory Content */}
                <Card className="bg-card border-border card-shadow">
                  <CardContent className="p-6">
                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Title
                          </label>
                          <Input
                            name="title"
                            value={editForm.title}
                            onChange={handleInputChange}
                            required
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Category
                            </label>
                            <select
                              name="category"
                              value={editForm.category}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              required
                            >
                              <option value="Research">Research</option>
                              <option value="Product">Product</option>
                              <option value="Meeting">Meeting</option>
                              <option value="Learning">Learning</option>
                              <option value="Idea">Idea</option>
                              <option value="Task">Task</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Memory Type
                            </label>
                            <select
                              name="memory_type"
                              value={editForm.memory_type}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              required
                            >
                              <option value="Note">Note</option>
                              <option value="Link">Link</option>
                              <option value="Document">Document</option>
                              <option value="Analysis">Analysis</option>
                              <option value="Concept">Concept</option>
                              <option value="Event">Event</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Content
                          </label>
                          <textarea
                            name="content"
                            value={editForm.content}
                            onChange={handleInputChange}
                            className="w-full h-48 px-3 py-2 bg-background border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Tags (comma separated)
                          </label>
                          <Input
                            name="tags"
                            value={editForm.tags}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Source URL (optional)
                          </label>
                          <Input
                            name="source_url"
                            value={editForm.source_url}
                            onChange={handleInputChange}
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="has_reminder"
                            name="has_reminder"
                            checked={editForm.has_reminder}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 bg-background border-border rounded text-primary focus:ring-primary/20"
                          />
                          <label
                            htmlFor="has_reminder"
                            className="ml-2 text-sm text-foreground"
                          >
                            Set reminder
                          </label>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">
                            {memory.title}
                          </h2>
                          <div className="flex items-center text-sm text-muted-foreground mt-2 gap-2">
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                categoryClasses.bg,
                                categoryClasses.text
                              )}
                            >
                              {memory.category}
                            </span>
                            <span>•</span>
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                typeClasses.bg,
                                typeClasses.text
                              )}
                            >
                              {memory.memory_type}
                            </span>
                            <span>•</span>
                            <span>
                              Created{" "}
                              {formatDistanceToNow(
                                new Date(memory.created_at),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                            {memory.updated_at !== memory.created_at && (
                              <>
                                <span>•</span>
                                <span>
                                  Updated{" "}
                                  {formatDistanceToNow(
                                    new Date(memory.updated_at),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {memory.source_url && (
                          <div className="flex items-center">
                            <a
                              href={memory.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors text-sm"
                            >
                              <ExternalLink size={14} />
                              <span>Source</span>
                            </a>
                          </div>
                        )}

                        <div className="py-4 border-t border-b border-border">
                          <div className="whitespace-pre-wrap text-foreground">
                            {memory.content}
                          </div>
                        </div>

                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 items-center">
                            <Tag size={14} className="text-muted-foreground" />
                            {memory.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-muted text-xs text-muted-foreground rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Related Memories */}
                {!isEditing && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                      <BookOpen size={20} className="text-primary" />
                      Related Memories
                    </h3>

                    {isLoadingRelated ? (
                      <div className="flex justify-center py-6">
                        <div className="text-center space-y-4">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
                          <p className="text-muted-foreground text-sm">
                            Finding related memories...
                          </p>
                        </div>
                      </div>
                    ) : relatedMemories.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {relatedMemories.map((relatedMemory) => {
                          const relatedCategoryClasses = getCategoryClasses(
                            relatedMemory.category
                          );
                          return (
                            <Card
                              key={relatedMemory.id}
                              className="bg-card border-border card-shadow hover:border-primary/30 transition-colors cursor-pointer"
                              onClick={() =>
                                router.push(`/memory/${relatedMemory.id}`)
                              }
                            >
                              <CardContent className="p-4">
                                <h4 className="font-medium text-foreground mb-1">
                                  {relatedMemory.title}
                                </h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {relatedMemory.summary ||
                                    relatedMemory.content.substring(0, 100) +
                                      "..."}
                                </p>
                                <div className="flex justify-between items-center mt-2 text-xs">
                                  <span
                                    className={cn(
                                      "px-2 py-1 rounded font-medium",
                                      relatedCategoryClasses.bg,
                                      relatedCategoryClasses.text
                                    )}
                                  >
                                    {relatedMemory.category}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {Math.round(relatedMemory.similarity * 100)}
                                    % match
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <BookOpen
                          size={40}
                          className="text-muted-foreground/50 mb-4"
                        />
                        <p className="text-muted-foreground">
                          No related memories found
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// src/app/memory/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { EmptyState } from "@/components/shared/EmptyState";
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
  ChevronDown,
  Hash,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMemoryTypeClass, MEMORY_CATEGORIES } from "@/lib/memory-utils";

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

// Quick tags for consistency with new memory page
const QUICK_TAGS = ["important", "reference", "idea", "follow-up"];

// Helper functions (keep these, they're reusable utilities)
const getMemoryTypeClasses = (type: string) => {
  const typeKey = type.toLowerCase().replace(/\s+/g, "-");
  return {
    text: `memory-${typeKey}`,
    bg: `memory-${typeKey}-bg`,
    border: `memory-${typeKey}-border`,
  };
};

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
  const [relatedMemories, setRelatedMemories] = useState<RelatedMemory[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    memory_type: "",
    content: "",
    source_url: "",
  });

  // Tags management (matching new memory page)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

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
          source_url: data.source_url || "",
        });

        // Initialize tags
        setSelectedTags(data.tags || []);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: content.substring(0, 300),
          limit: 3,
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tag toggling (matching new memory page)
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle custom tag addition
  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;

    setSelectedTags((prev) => [...prev, trimmed]);
    setCustomTag("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  // Handle form submission (update memory)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update memory");
      }

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
      setTimeout(() => {
        router.push("/library");
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting memory:", error);
      showNotification("error", error.message || "Failed to delete memory");
      setIsDeleting(false);
    }
  };

  // Category and memory type options
  const categoryOptions = MEMORY_CATEGORIES.slice(1).map((cat) => ({
    value: cat,
    label: cat,
  }));

  const memoryTypeOptions = [
    { value: "note", label: "Note" },
    { value: "link", label: "Link" },
    { value: "document", label: "Document" },
    { value: "analysis", label: "Analysis" },
    { value: "concept", label: "Concept" },
    { value: "event", label: "Event" },
  ];

  // Page actions
  const pageActions = !isEditing ? (
    <>
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft size={18} />
        <span className="hidden sm:inline ml-2">Back</span>
      </Button>
      <Button variant="outline" onClick={() => setIsEditing(true)}>
        <Edit size={18} />
        <span className="hidden sm:inline ml-2">Edit</span>
      </Button>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Trash2 size={18} />
        )}
        <span className="hidden sm:inline ml-2">Delete</span>
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" onClick={() => setIsEditing(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isSaving}>
        {isSaving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        <span className="hidden sm:inline ml-2">Save</span>
      </Button>
    </>
  );

  if (isLoading) {
    return (
      <PageLayout
        currentPage=""
        title="Memory Details"
        description="Loading memory..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading memory...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !memory) {
    return (
      <PageLayout
        currentPage=""
        title="Memory Not Found"
        description="The memory you're looking for doesn't exist"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span className="ml-2">Go Back</span>
          </Button>
        }
      >
        <Card className="bg-card border-border card-shadow">
          <CardContent className="p-6">
            <EmptyState
              icon={<Archive size={48} />}
              title="Memory Not Found"
              description={
                error || "This memory may have been deleted or doesn't exist"
              }
              action={{
                label: "Go Back",
                onClick: () => router.back(),
              }}
            />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const categoryClasses = getCategoryClasses(memory.category);
  const typeClasses = getMemoryTypeClasses(memory.memory_type);

  return (
    <PageLayout
      currentPage=""
      title={isEditing ? "Edit Memory" : "Memory Details"}
      description={
        isEditing ? "Make changes to your memory" : "View and edit your memory"
      }
      actions={pageActions}
    >
      {/* Notification */}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-70 h-6 w-6"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Memory"
        itemName={memory?.title || ""}
        itemType="memory"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="max-w-6xl mx-auto">
        {isEditing ? (
          /* Edit Mode - 2 Column Layout like New Memory Page */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <Input
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                placeholder="Memory title..."
                className="text-lg font-medium h-12 border focus:border-primary"
              />

              <Textarea
                name="content"
                value={editForm.content}
                onChange={handleInputChange}
                placeholder="Edit your memory content..."
                className="min-h-[500px] text-base resize-none border focus:border-primary"
              />
            </div>

            {/* Right Column - Metadata (1/3 width) */}
            <div className="space-y-6">
              {/* Tags Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Tags
                  </span>
                </div>

                {/* Quick Tags */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Tags Input */}
                  <div className="flex gap-2">
                    <Input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add tags..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomTag}
                      disabled={!customTag.trim()}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>

                  {/* Selected Tags Display */}
                  {selectedTags.length > 0 && (
                    <div className="max-h-16 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-muted text-muted-foreground text-sm rounded flex items-center gap-1"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleTag(tag)}
                              className="h-4 w-4 p-0 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <X size={10} />
                            </Button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Category & Type */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <Select
                    name="category"
                    value={editForm.category}
                    onChange={(value) =>
                      setEditForm((prev) => ({ ...prev, category: value }))
                    }
                    options={categoryOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type
                  </label>
                  <Select
                    name="memory_type"
                    value={editForm.memory_type}
                    onChange={(value) =>
                      setEditForm((prev) => ({ ...prev, memory_type: value }))
                    }
                    options={memoryTypeOptions}
                  />
                </div>
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Source URL
                </label>
                <Input
                  name="source_url"
                  type="url"
                  value={editForm.source_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <ScrollArea className="h-full">
            <div className="space-y-6 pr-4">
              {/* Memory Content */}
              <Card className="bg-card border-border card-shadow">
                <CardContent className="p-6">
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
                          {formatDistanceToNow(new Date(memory.created_at), {
                            addSuffix: true,
                          })}
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
                </CardContent>
              </Card>

              {/* Related Memories */}
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
                                relatedMemory.content.substring(0, 100) + "..."}
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
                                {Math.round(relatedMemory.similarity * 100)}%
                                match
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={<BookOpen size={40} />}
                    title="No related memories found"
                    description="No similar memories were found for this content"
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </PageLayout>
  );
}

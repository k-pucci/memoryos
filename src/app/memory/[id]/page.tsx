// src/app/memory/[id]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// Custom Select Component
interface SelectProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  required?: boolean;
  placeholder?: string;
}

function CustomSelect({
  name,
  value,
  onChange,
  options,
  className,
  required,
  placeholder,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(() => {
    const selected = options.find((option) => option.value === value);
    return selected ? selected.label : placeholder || "Select...";
  });

  const handleSelect = (optionValue: string, optionLabel: string) => {
    onChange(optionValue);
    setSelectedLabel(optionLabel);
    setIsOpen(false);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`[data-select="${name}"]`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, name]);

  return (
    <div className="relative" data-select={name}>
      <button
        type="button"
        onClick={toggleOpen}
        className={cn(
          "w-full h-10 px-3 py-2 text-sm bg-card border border-border rounded-md text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "cursor-pointer transition-all text-left",
          "hover:border-primary/50",
          isOpen && "border-primary ring-2 ring-primary/20",
          className
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value, option.label)}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
                "focus:outline-none focus:bg-muted",
                option.value === value &&
                  "bg-primary/10 text-primary font-medium"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Notification Component
interface NotificationProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

function Notification({ type, message, onClose }: NotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 duration-300",
          type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
            : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"
        )}
      >
        {type === "success" ? (
          <CheckCircle size={20} />
        ) : (
          <AlertCircle size={20} />
        )}
        <span className="font-medium">{message}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-2 hover:opacity-70 h-6 w-6"
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
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

  // Category options - using shared categories
  const categoryOptions = MEMORY_CATEGORIES.slice(1).map((cat) => ({
    value: cat,
    label: cat,
  }));

  // Memory type options
  const memoryTypeOptions = [
    { value: "note", label: "Note" },
    { value: "link", label: "Link" },
    { value: "document", label: "Document" },
    { value: "analysis", label: "Analysis" },
    { value: "concept", label: "Concept" },
    { value: "event", label: "Event" },
  ];

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
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft size={18} />
                  <span className="ml-2">Go Back</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="p-6 pt-4">
              <Card className="bg-card border-border card-shadow">
                <CardContent className="p-6">
                  <EmptyState
                    icon={<Archive size={48} />}
                    title="Memory Not Found"
                    description={
                      error ||
                      "This memory may have been deleted or doesn't exist"
                    }
                    action={{
                      label: "Go Back",
                      onClick: goBack,
                    }}
                  />
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
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
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
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft size={18} />
                <span className="hidden sm:inline ml-2">Back</span>
              </Button>

              {!isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit size={18} />
                    <span className="hidden sm:inline ml-2">Edit</span>
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDelete}
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
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Title
                          </label>
                          <Input
                            name="title"
                            value={editForm.title}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter memory title..."
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Category
                            </label>
                            <CustomSelect
                              name="category"
                              value={editForm.category}
                              onChange={(value) =>
                                handleSelectChange("category", value)
                              }
                              options={categoryOptions}
                              required
                              placeholder="Select category..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Memory Type
                            </label>
                            <CustomSelect
                              name="memory_type"
                              value={editForm.memory_type}
                              onChange={(value) =>
                                handleSelectChange("memory_type", value)
                              }
                              options={memoryTypeOptions}
                              required
                              placeholder="Select memory type..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Content
                          </label>
                          <Textarea
                            name="content"
                            value={editForm.content}
                            onChange={handleInputChange}
                            className="h-40 resize-none"
                            placeholder="Enter your memory content..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Tags{" "}
                            <span className="text-muted-foreground font-normal">
                              (comma separated)
                            </span>
                          </label>
                          <Input
                            name="tags"
                            value={editForm.tags}
                            onChange={handleInputChange}
                            placeholder="tag1, tag2, tag3..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Source URL{" "}
                            <span className="text-muted-foreground font-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            name="source_url"
                            value={editForm.source_url}
                            onChange={handleInputChange}
                            placeholder="https://example.com"
                          />
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                          <input
                            type="checkbox"
                            id="has_reminder"
                            name="has_reminder"
                            checked={editForm.has_reminder}
                            onChange={handleCheckboxChange}
                            className="w-4 h-4 bg-card border-border rounded text-primary focus:ring-primary/20 focus:ring-2"
                          />
                          <label
                            htmlFor="has_reminder"
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            Set reminder for this memory
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
                      <EmptyState
                        icon={<BookOpen size={40} />}
                        title="No related memories found"
                        description="No similar memories were found for this content"
                      />
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

// src/app/memory/[id]/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
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
      alert("Memory updated successfully");
    } catch (error: any) {
      console.error("Error updating memory:", error);
      alert(error.message || "Failed to update memory");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle memory deletion
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this memory? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete memory");
      }

      alert("Memory deleted successfully");
      router.push("/memory-stack");
    } catch (error: any) {
      console.error("Error deleting memory:", error);
      alert(error.message || "Failed to delete memory");
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
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !memory) {
    return (
      <Layout currentPage="">
        <div className="space-y-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={goBack} className="gap-2">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
          </div>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-medium text-destructive mb-2">
                  Error
                </h2>
                <p className="text-muted-foreground">
                  {error || "Memory not found"}
                </p>
                <Button onClick={goBack} className="mt-4">
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const categoryClasses = getCategoryClasses(memory.category);
  const typeClasses = getMemoryTypeClasses(memory.memory_type);

  return (
    <Layout currentPage="">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} className="gap-2">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Button>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  <span>Delete</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>

                <Button
                  onClick={handleSubmit}
                  className="gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Memory Content */}
        <Card className="card-shadow">
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
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-full h-48 px-3 py-2 bg-input border border-border rounded-md text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="has_reminder"
                    name="has_reminder"
                    checked={editForm.has_reminder}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 bg-input border-border rounded text-primary focus:ring-ring"
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
                  <h1 className="text-2xl font-bold text-foreground">
                    {memory.title}
                  </h1>
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
                          {formatDistanceToNow(new Date(memory.updated_at), {
                            addSuffix: true,
                          })}
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
            <h3 className="text-lg font-medium text-foreground">
              Related Memories
            </h3>

            {isLoadingRelated ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
                      className="card-shadow hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/memory/${relatedMemory.id}`)}
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
                            {Math.round(relatedMemory.similarity * 100)}% match
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No related memories found
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

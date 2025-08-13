// src/app/new-memory/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, X, Plus, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SelectionGroup } from "@/components/ui/selection-group";
import { Select } from "@/components/ui/select";
import { MEMORY_CATEGORIES } from "@/lib/memory-utils";
import { PageLayout } from "@/components/layout/PageLayout";

// Quick tags for easy selection
const QUICK_TAGS = ["important", "reference", "idea", "follow-up"];

// AI Status Indicator Component
function AIStatusIndicator({
  isReady,
  isLoading,
}: {
  isReady: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        <span>Loading AI...</span>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>AI Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
      <span>AI Initializing</span>
    </div>
  );
}

export default function NewMemoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    generateEmbedding,
    isLoading: isEmbeddingLoading,
    isReady,
  } = useEmbeddings();

  // Form state with smart defaults
  const [formData, setFormData] = useState({
    title: "",
    category: "Research",
    memory_type: "note",
    content: "",
  });

  // Tags management
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const isRemoving = prev.includes(tag);
      const newTags = isRemoving
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];

      // Auto-scroll to bottom when adding a tag (but not when removing)
      if (!isRemoving) {
        setTimeout(() => {
          if (scrollAreaViewportRef.current) {
            scrollAreaViewportRef.current.scrollTop =
              scrollAreaViewportRef.current.scrollHeight;
          }
        }, 50);
      }

      return newTags;
    });
  };

  const handleAddTag = () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && !selectedTags.includes(tag));

    if (tags.length > 0) {
      setSelectedTags((prev) => {
        const newTags = [...prev, ...tags];

        // Auto-scroll to bottom when adding tags
        setTimeout(() => {
          if (scrollAreaViewportRef.current) {
            scrollAreaViewportRef.current.scrollTop =
              scrollAreaViewportRef.current.scrollHeight;
          }
        }, 50);

        return newTags;
      });
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCreateMemory = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please add a title and some content");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.loading("Creating memory...", { id: "creating" });

      const embeddingText = `${formData.title} ${
        formData.content
      } ${selectedTags.join(" ")}`;
      const embedding = await generateEmbedding(embeddingText);

      const payload = {
        ...formData,
        tags: selectedTags,
        embedding,
      };

      const response = await fetch("/api/memories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      toast.dismiss("creating");

      if (!response.ok) {
        throw new Error(result.error || "Failed to create memory");
      }

      toast.success("Memory created!");
      router.push("/library");
    } catch (error: any) {
      console.error("Error creating memory:", error);
      toast.dismiss("creating");

      // Fallback without embedding
      try {
        const payload = { ...formData, tags: selectedTags };
        const response = await fetch("/api/memories/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success("Memory created (AI features limited)");
          router.push("/library");
        } else {
          throw new Error("Failed to create memory");
        }
      } catch (fallbackError) {
        toast.error("Failed to create memory");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.title.trim() && formData.content.trim();

  return (
    <PageLayout
      currentPage="New Memory"
      title="New Memory"
      description="Capture your thoughts and knowledge"
      actions={
        <div className="flex items-center gap-3">
          <AIStatusIndicator isReady={isReady} isLoading={isEmbeddingLoading} />
          <Button variant="outline" onClick={() => router.push("/library")}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <Input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Give your memory a title..."
              className="text-lg font-medium h-12 border focus:border-primary"
            />

            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Start writing your memory..."
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
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tags..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                  <div
                    ref={scrollAreaViewportRef}
                    className="max-h-16 overflow-y-auto"
                  >
                    <div className="flex flex-wrap gap-2 pr-2">
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
                  value={formData.category}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                  options={MEMORY_CATEGORIES.slice(1).map((cat) => ({
                    value: cat,
                    label: cat,
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <Select
                  name="memory_type"
                  value={formData.memory_type}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, memory_type: value }))
                  }
                  options={[
                    { value: "note", label: "Note" },
                    { value: "link", label: "Link" },
                    { value: "document", label: "Document" },
                    { value: "analysis", label: "Analysis" },
                    { value: "concept", label: "Concept" },
                    { value: "event", label: "Event" },
                  ]}
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-4">
              <Button
                onClick={handleCreateMemory}
                disabled={!isFormValid || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Create Memory
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

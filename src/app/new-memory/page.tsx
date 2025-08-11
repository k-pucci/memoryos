// src/app/new-memory/page.tsx

"use client";

import React, { useState } from "react";
import Layout from "@/components/layout";
import { Plus, ArrowRight, Loader2, X, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SelectionGroup,
  SelectionOption,
} from "@/components/ui/selection-group";
import { getMemoryTypeIcon, MEMORY_CATEGORIES } from "@/lib/memory-utils";

// Create category options for SelectionGroup
const getCategoryOptions = (): SelectionOption[] => {
  const iconMap: { [key: string]: React.ReactNode } = {
    research: <Brain size={16} />,
    product: <Plus size={16} />,
    meeting: getMemoryTypeIcon("meeting"),
    learning: getMemoryTypeIcon("learning"),
    idea: getMemoryTypeIcon("idea"),
    task: getMemoryTypeIcon("task"),
  };

  return MEMORY_CATEGORIES.slice(1).map((category) => ({
    value: category,
    label: category,
    icon: iconMap[category.toLowerCase()] || <Brain size={16} />,
  }));
};

// Create memory type options
const getMemoryTypeOptions = (): SelectionOption[] => {
  const memoryTypes = [
    "note",
    "link",
    "document",
    "analysis",
    "concept",
    "event",
  ];

  return memoryTypes.map((type) => ({
    value: type,
    label: type,
    icon: getMemoryTypeIcon(type),
  }));
};

export default function NewMemoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    generateEmbedding,
    isLoading: isEmbeddingLoading,
    isReady,
  } = useEmbeddings();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "Research",
    memory_type: "note",
    content: "",
    tags: "",
    has_reminder: false,
  });

  // Tags management
  const [tagsList, setTagsList] = useState<string[]>([
    "important",
    "reference",
    "follow-up",
    "idea",
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, has_reminder: e.target.checked }));
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleTypeChange = (type: string) => {
    setFormData((prev) => ({ ...prev, memory_type: type }));
  };

  const handleAddTag = () => {
    if (!formData.tags.trim()) return;

    const newTags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag && !tagsList.includes(tag));

    if (newTags.length > 0) {
      setTagsList((prev) => [...prev, ...newTags]);
      setFormData((prev) => ({ ...prev, tags: "" }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleCreateMemory = async () => {
    if (!formData.title.trim() || !formData.content) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.loading("Generating AI embedding...", { id: "embedding" });
      const embeddingText = `${formData.title} ${
        formData.content
      } ${tagsList.join(" ")}`;
      const embedding = await generateEmbedding(embeddingText);
      toast.dismiss("embedding");

      const payload = {
        ...formData,
        tags: tagsList,
        embedding,
      };

      toast.loading("Creating memory...", { id: "creating" });
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

      toast.success("Memory created successfully!");
      router.push("/library");
    } catch (error: any) {
      console.error("Error creating memory:", error);
      toast.dismiss("embedding");
      toast.dismiss("creating");

      if (error.message.includes("embedding")) {
        toast.error(
          "Failed to generate AI embedding. Memory saved without semantic search."
        );
        try {
          const payload = { ...formData, tags: tagsList };
          const response = await fetch("/api/memories/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            toast.success("Memory created (without AI features)");
            router.push("/library");
          } else {
            throw new Error("Failed to create memory");
          }
        } catch (fallbackError) {
          toast.error("Failed to create memory");
        }
      } else {
        toast.error(error.message || "Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout currentPage="">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Create New Memory
              </h1>
              <p className="text-muted-foreground mt-2">
                Capture and store your knowledge with AI-powered search
                {!isReady && (
                  <span className="brand-coral ml-2">
                    (AI features loading...)
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-sm px-4 py-2 bg-muted border border-border rounded-lg">
                {isEmbeddingLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin brand-coral" />
                    <span className="brand-coral">Loading AI...</span>
                  </>
                ) : isReady ? (
                  <>
                    <div className="w-2 h-2 bg-brand-sage rounded-full"></div>
                    <span className="brand-sage">AI Ready</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                    <span className="text-muted-foreground">
                      AI Initializing
                    </span>
                  </>
                )}
              </div>
              <Button variant="outline" onClick={() => router.push("/library")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                <Card className="bg-card border-border card-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Memory Title
                        </label>
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Enter a descriptive title..."
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* Category Selection using SelectionGroup */}
                      <SelectionGroup
                        options={getCategoryOptions()}
                        value={formData.category}
                        onChange={handleCategoryChange}
                        label="Category"
                        variant="buttons"
                        size="sm"
                      />

                      {/* Memory Type Selection using SelectionGroup */}
                      <SelectionGroup
                        options={getMemoryTypeOptions()}
                        value={formData.memory_type}
                        onChange={handleTypeChange}
                        label="Memory Type"
                        variant="grid"
                        columns={3}
                      />

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Content
                        </label>
                        <Textarea
                          name="content"
                          value={formData.content}
                          onChange={handleInputChange}
                          placeholder="Write your memory content..."
                          className="h-40 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Tags
                        </label>
                        <div className="flex gap-2">
                          <Input
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Add tags separated by commas..."
                            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddTag}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tagsList.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1 border border-primary/20"
                            >
                              {tag}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-primary/70 hover:text-primary h-4 w-4 p-0"
                              >
                                <X size={14} />
                              </Button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-border">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="reminder"
                            checked={formData.has_reminder}
                            onChange={handleReminderChange}
                            className={cn(
                              "w-4 h-4 rounded text-primary",
                              "bg-background border-border",
                              "focus:ring-primary/20 focus:ring-2"
                            )}
                          />
                          <label
                            htmlFor="reminder"
                            className="ml-2 text-sm text-foreground"
                          >
                            Set reminder
                          </label>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => router.push("/library")}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleCreateMemory}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin mr-2"
                                />
                                Creating...
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
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </Layout>
  );
}

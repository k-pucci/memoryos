// src/app/new-memory/page.tsx

"use client";

import React, { useState } from "react";
import Layout from "@/components/layout";
import { Plus, ArrowRight, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useEmbeddings } from "@/hooks/useEmbeddings";
import { cn } from "@/lib/utils";

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
    category: "Research", // Default category
    memory_type: "Note", // Default memory type
    content: "",
    tags: "",
    has_reminder: false,
  });

  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState("Research");

  // Selected memory type state
  const [selectedType, setSelectedType] = useState("Note");

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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, memory_type: type }));
  };

  const handleAddTag = () => {
    if (!formData.tags.trim()) return;

    // Split by commas and add each tag
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
      // Generate embedding on client-side
      toast.loading("Generating AI embedding...", { id: "embedding" });
      const embeddingText = `${formData.title} ${
        formData.content
      } ${tagsList.join(" ")}`;
      const embedding = await generateEmbedding(embeddingText);
      toast.dismiss("embedding");

      // Prepare payload with embedding
      const payload = {
        ...formData,
        tags: tagsList,
        embedding, // Add the generated embedding
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
        // Still try to save without embedding
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
      <div className="space-y-6 overflow-auto max-h-[calc(100vh-130px)] pr-2 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Plus className="text-primary mr-2" size={22} />
            <h1 className="text-2xl font-bold text-foreground">
              Create New Memory
            </h1>
          </div>

          {/* AI Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isEmbeddingLoading ? (
              <div className="flex items-center gap-2 brand-coral">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading AI...</span>
              </div>
            ) : isReady ? (
              <div className="flex items-center gap-2 brand-sage">
                <div className="w-2 h-2 bg-brand-sage rounded-full"></div>
                <span>AI Ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span>AI Initializing</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          Capture and store your knowledge in your personal memory system with
          AI-powered search.
          {!isReady && (
            <span className="brand-coral ml-2">(AI features loading...)</span>
          )}
        </p>

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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Research",
                    "Product",
                    "Meeting",
                    "Learning",
                    "Idea",
                    "Task",
                  ].map((category, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer",
                        selectedCategory === category
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground border border-border hover:bg-secondary/20 hover:text-foreground"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Memory Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { icon: "📝", name: "Note" },
                    { icon: "🔗", name: "Link" },
                    { icon: "📄", name: "Document" },
                    { icon: "📊", name: "Analysis" },
                    { icon: "🧩", name: "Concept" },
                    { icon: "📅", name: "Event" },
                  ].map((type, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTypeSelect(type.name)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                        selectedType === type.name
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground border border-border hover:bg-secondary/20 hover:text-foreground"
                      )}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your memory content..."
                  className={cn(
                    "w-full h-40 px-3 py-2 rounded-lg resize-none",
                    "bg-background border border-border text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:border-primary focus:ring focus:ring-primary/20 transition-all"
                  )}
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
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {tagsList.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1 border border-primary/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary/70 hover:text-primary transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-border">
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
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-secondary/20 hover:text-foreground transition-all cursor-pointer"
                    onClick={() => router.push("/library")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateMemory}
                    disabled={isSubmitting}
                    className="bg-primary px-6 py-2 rounded-lg text-primary-foreground hover:bg-primary/90 transition-all flex items-center cursor-pointer disabled:opacity-50 font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Memory
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

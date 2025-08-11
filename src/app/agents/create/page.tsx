// /app/agents/create/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Save,
  ArrowLeft,
  Sparkles,
  Brain,
  Zap,
  Upload,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function CreateAgentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    expertise: "",
    system_prompt: "",
    model: "llama3-8b-8192",
    search_threshold: 0.4,
    search_categories: "",
    time_preference: "recent",
    image: null as File | null,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  // Agent templates for quick setup
  const agentTemplates = [
    {
      name: "Personal Journal Agent",
      description: "Analyzes personal thoughts, mood patterns, and life events",
      expertise:
        "journal, personal, mood, reflection, life, thoughts, feelings",
      system_prompt:
        "You are a personal reflection assistant. Help users understand patterns in their thoughts, track personal growth, and provide gentle insights about their life journey. Be supportive and encouraging.",
      categories: "Personal, Journal, Life",
      icon: "📓",
      color: "from-rose-500/20 to-pink-500/20",
    },
    {
      name: "Project Manager Agent",
      description: "Tracks project progress, deadlines, and team coordination",
      expertise:
        "project, deadline, milestone, team, coordination, progress, task",
      system_prompt:
        "You are a project management specialist. Help track project progress, identify blockers, coordinate team efforts, and ensure deadlines are met. Be organized and action-oriented.",
      categories: "Project, Work, Task",
      icon: "📋",
      color: "from-blue-500/20 to-cyan-500/20",
    },
    {
      name: "Learning Coach Agent",
      description:
        "Tracks learning progress, study notes, and skill development",
      expertise: "learning, study, skill, course, education, knowledge, growth",
      system_prompt:
        "You are a learning coach. Help users track their educational progress, connect related concepts, and suggest study strategies based on their learning patterns. Be encouraging and educational.",
      categories: "Learning, Education, Skill",
      icon: "🎓",
      color: "from-emerald-500/20 to-green-500/20",
    },
    {
      name: "Health & Wellness Agent",
      description:
        "Monitors health patterns, wellness goals, and lifestyle insights",
      expertise:
        "health, wellness, fitness, nutrition, sleep, exercise, habits",
      system_prompt:
        "You are a wellness coach. Help users track health patterns, identify wellness trends, and provide gentle guidance based on their health and lifestyle data. Always encourage consulting healthcare professionals for medical advice.",
      categories: "Health, Wellness, Fitness",
      icon: "🏃‍♂️",
      color: "from-orange-500/20 to-amber-500/20",
    },
  ];

  const handleTemplateSelect = (template: any, index: number) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      expertise: template.expertise,
      system_prompt: template.system_prompt,
      search_categories: template.categories,
    });
    setSelectedTemplate(index);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Image size must be less than 5MB");
        return;
      }

      setFormData({ ...formData, image: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.system_prompt) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append(
        "expertise",
        JSON.stringify(formData.expertise.split(",").map((s) => s.trim()))
      );
      submitData.append("system_prompt", formData.system_prompt);
      submitData.append("model", formData.model);
      submitData.append(
        "search_threshold",
        formData.search_threshold.toString()
      );
      submitData.append(
        "search_categories",
        JSON.stringify(
          formData.search_categories.split(",").map((s) => s.trim())
        )
      );
      submitData.append("time_preference", formData.time_preference);

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      const response = await fetch("/api/agents/create", {
        method: "POST",
        body: submitData, // Send as FormData instead of JSON
      });

      if (response.ok) {
        router.push("/chat");
      } else {
        throw new Error("Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Failed to create agent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    formData.name && formData.description && formData.system_prompt;

  return (
    <Layout currentPage="Create Agents">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">
                Create AI Agent
              </h1>
              <p className="text-muted-foreground mt-2">
                Build a specialized assistant for your knowledge domain
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft size={18} />
                <span className="hidden sm:inline ml-2">Back</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-5xl mx-auto px-6 py-4 space-y-8 pr-4">
              {/* Templates */}
              <Card className="bg-card border-border card-shadow">
                <CardHeader className="pt-6 pb-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                    <Sparkles size={20} className="text-primary" />
                    Quick Start Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agentTemplates.map((template, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-6 rounded-lg border cursor-pointer transition-all group",
                          selectedTemplate === index
                            ? "bg-primary/10 border-primary text-primary card-shadow"
                            : "bg-muted border-border hover:bg-primary/10 hover:border-primary/30 hover:card-shadow"
                        )}
                        onClick={() => handleTemplateSelect(template, index)}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-2xl">{template.icon}</span>
                          <h3
                            className={cn(
                              "font-semibold text-lg transition-colors",
                              selectedTemplate === index
                                ? "text-primary"
                                : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {template.name}
                          </h3>
                        </div>
                        <p
                          className={cn(
                            "text-sm leading-relaxed",
                            selectedTemplate === index
                              ? "text-primary/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {template.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Creation Form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Info */}
                  <Card className="bg-card border-border card-shadow">
                    <CardHeader className="pt-6 pb-4">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Bot size={20} className="text-primary" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-6">
                      {/* Agent Image Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Agent Avatar
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-24 h-24 bg-muted border-2 border-border rounded-full flex items-center justify-center overflow-hidden">
                              {imagePreview ? (
                                <Image
                                  src={imagePreview}
                                  alt="Agent avatar"
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Bot
                                  size={36}
                                  className="text-muted-foreground"
                                />
                              )}
                            </div>
                            {imagePreview && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full"
                              >
                                <X size={14} />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload size={16} />
                              <span className="ml-2">Upload Image</span>
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Agent Name*
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="e.g., Recipe Assistant"
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Description*
                        </label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder="What does this agent help with?"
                          className="min-h-[100px] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Expertise Keywords*
                        </label>
                        <Input
                          value={formData.expertise}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              expertise: e.target.value,
                            })
                          }
                          placeholder="recipe, cooking, food, ingredients (comma-separated)"
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Keywords used for intelligent routing
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration */}
                  <Card className="bg-card border-border card-shadow">
                    <CardHeader className="pt-6 pb-4">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Settings size={20} className="text-primary" />
                        Search Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-6 pb-6">
                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          AI Model
                        </label>
                        <select
                          value={formData.model}
                          onChange={(e) =>
                            setFormData({ ...formData, model: e.target.value })
                          }
                          className="w-full h-11 px-4 py-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring focus:ring-primary/20"
                        >
                          <option value="llama3-8b-8192">
                            Llama3-8b (Fast, efficient)
                          </option>
                          <option value="llama3-70b-8192">
                            Llama3-70b (Powerful, slower)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-4 text-foreground">
                          Search Threshold
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="0.8"
                          step="0.1"
                          value={formData.search_threshold}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              search_threshold: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-primary h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Broad (0.1)</span>
                          <span className="text-primary font-medium">
                            {formData.search_threshold}
                          </span>
                          <span>Precise (0.8)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Memory Categories
                        </label>
                        <Input
                          value={formData.search_categories}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              search_categories: e.target.value,
                            })
                          }
                          placeholder="Product, Research, Meeting (comma-separated)"
                          className="h-11"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-3 text-foreground">
                          Time Preference
                        </label>
                        <select
                          value={formData.time_preference}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              time_preference: e.target.value,
                            })
                          }
                          className="w-full h-11 px-4 py-2 bg-background border border-border rounded-md text-foreground focus:border-primary focus:ring focus:ring-primary/20"
                        >
                          <option value="recent">Recent (last 30 days)</option>
                          <option value="all">All time</option>
                          <option value="archive">
                            Archive (older than 6 months)
                          </option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* System Prompt */}
                <Card className="bg-card border-border card-shadow">
                  <CardHeader className="pt-6 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                      <Brain size={20} className="text-primary" />
                      Agent Personality & Instructions*
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <Textarea
                      value={formData.system_prompt}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          system_prompt: e.target.value,
                        })
                      }
                      placeholder="You are a helpful assistant that specializes in... Focus on... Always provide..."
                      className="min-h-[140px] resize-none"
                    />
                    <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Define how your agent should behave, what it specializes
                      in, and how it should format responses.
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Section */}
                {previewMode && (
                  <Card className="bg-card border-border card-shadow">
                    <CardHeader className="pt-6 pb-4">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Bot size={20} className="text-primary" />
                        Agent Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-6 bg-muted rounded-lg">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                            {imagePreview ? (
                              <Image
                                src={imagePreview}
                                alt="Agent avatar"
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                <Bot size={24} className="text-primary" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-foreground mb-1">
                              {formData.name || "Your Agent"}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {formData.description || "Agent description"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground font-medium">
                              Expertise:
                            </span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.expertise.split(",").map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                                >
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground font-medium">
                              Model:
                            </span>
                            <p className="text-foreground mt-1">
                              {formData.model}
                            </p>
                          </div>

                          <div>
                            <span className="text-muted-foreground font-medium">
                              Search Threshold:
                            </span>
                            <p className="text-foreground mt-1">
                              {formData.search_threshold}
                            </p>
                          </div>

                          <div>
                            <span className="text-muted-foreground font-medium">
                              Time Preference:
                            </span>
                            <p className="text-foreground capitalize mt-1">
                              {formData.time_preference}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground font-medium">
                            System Prompt:
                          </span>
                          <div className="mt-2 p-4 bg-muted rounded-lg text-sm text-foreground leading-relaxed">
                            {formData.system_prompt ||
                              "System prompt will appear here..."}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card className="bg-card border-border card-shadow">
                  <CardContent className="pt-6 pb-6 px-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setPreviewMode(!previewMode)}
                        >
                          {previewMode ? (
                            <>
                              <ArrowLeft size={16} />
                              <span className="ml-2">Edit Agent</span>
                            </>
                          ) : (
                            <>
                              <Bot size={16} />
                              <span className="ml-2">Preview Agent</span>
                            </>
                          )}
                        </Button>

                        {/* Validation Status */}
                        <div className="flex items-center gap-2 text-sm">
                          {isFormValid ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={16} />
                              Ready to create
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                              <AlertCircle size={16} />
                              Fill required fields
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 w-full sm:w-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.back()}
                          className="flex-1 sm:flex-none"
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          disabled={isLoading || !isFormValid}
                          className="flex-1 sm:flex-none min-w-[160px]"
                        >
                          {isLoading ? (
                            <>
                              <Loader2
                                size={16}
                                className="animate-spin mr-2"
                              />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span className="ml-2">Create Agent</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}

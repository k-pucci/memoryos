// /app/agents/create/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    },
    {
      name: "Project Manager Agent",
      description: "Tracks project progress, deadlines, and team coordination",
      expertise:
        "project, deadline, milestone, team, coordination, progress, task",
      system_prompt:
        "You are a project management specialist. Help track project progress, identify blockers, coordinate team efforts, and ensure deadlines are met. Be organized and action-oriented.",
      categories: "Project, Work, Task",
    },
    {
      name: "Learning Coach Agent",
      description:
        "Tracks learning progress, study notes, and skill development",
      expertise: "learning, study, skill, course, education, knowledge, growth",
      system_prompt:
        "You are a learning coach. Help users track their educational progress, connect related concepts, and suggest study strategies based on their learning patterns. Be encouraging and educational.",
      categories: "Learning, Education, Skill",
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
    },
  ];

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      expertise: template.expertise,
      system_prompt: template.system_prompt,
      search_categories: template.categories,
    });
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

  return (
    <Layout currentPage="Create Agents">
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Create AI Agent</h1>
                <p className="text-gray-400">
                  Build a specialized assistant for your knowledge domain
                </p>
              </div>
            </div>
          </div>

          {/* Templates */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Quick Start Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTemplates.map((template, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-purple-500/50 cursor-pointer transition-all"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h3 className="font-semibold text-white mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {template.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Creation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Agent Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Agent Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gray-900/50 border-2 border-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt="Agent avatar"
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Bot size={32} className="text-gray-400" />
                          )}
                        </div>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-gray-700"
                        >
                          <Upload size={16} className="mr-2" />
                          Upload Image
                        </Button>
                        <p className="text-xs text-gray-400">
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
                    <label className="block text-sm font-medium mb-2">
                      Agent Name*
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Recipe Assistant"
                      className="bg-gray-900/50 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="bg-gray-900/50 border-gray-700 min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Expertise Keywords*
                    </label>
                    <Input
                      value={formData.expertise}
                      onChange={(e) =>
                        setFormData({ ...formData, expertise: e.target.value })
                      }
                      placeholder="recipe, cooking, food, ingredients (comma-separated)"
                      className="bg-gray-900/50 border-gray-700"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Keywords used for intelligent routing
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Search Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      AI Model
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
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
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Broad (0.1)</span>
                      <span>{formData.search_threshold}</span>
                      <span>Precise (0.8)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="bg-gray-900/50 border-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
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
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white"
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
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain size={18} className="text-purple-400" />
                  Agent Personality & Instructions*
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.system_prompt}
                  onChange={(e) =>
                    setFormData({ ...formData, system_prompt: e.target.value })
                  }
                  placeholder="You are a helpful assistant that specializes in... Focus on... Always provide..."
                  className="bg-gray-900/50 border-gray-700 min-h-[120px]"
                />
                <div className="mt-2 text-xs text-gray-400">
                  Define how your agent should behave, what it specializes in,
                  and how it should format responses.
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {previewMode && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot size={18} className="text-purple-400" />
                    Agent Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/20">
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Agent avatar"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
                            <Bot size={20} className="text-purple-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {formData.name || "Your Agent"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {formData.description || "Agent description"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Expertise:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.expertise.split(",").map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-400">Model:</span>
                        <p className="text-white">{formData.model}</p>
                      </div>

                      <div>
                        <span className="text-gray-400">Search Threshold:</span>
                        <p className="text-white">
                          {formData.search_threshold}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-400">Time Preference:</span>
                        <p className="text-white capitalize">
                          {formData.time_preference}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-400">System Prompt:</span>
                      <div className="mt-1 p-3 bg-gray-900/50 rounded text-sm text-gray-300">
                        {formData.system_prompt ||
                          "System prompt will appear here..."}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="border-gray-700 hover:bg-gray-700/50"
                    >
                      {previewMode ? (
                        <>
                          <ArrowLeft size={16} className="mr-2" />
                          Edit Agent
                        </>
                      ) : (
                        <>
                          <Bot size={16} className="mr-2" />
                          Preview Agent
                        </>
                      )}
                    </Button>

                    {/* Validation Status */}
                    <div className="flex items-center gap-2 text-sm">
                      {formData.name &&
                      formData.description &&
                      formData.system_prompt ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Ready to create
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          Fill required fields
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        !formData.name ||
                        !formData.description ||
                        !formData.system_prompt
                      }
                      className="bg-purple-500 hover:bg-purple-600 flex-1 sm:flex-none min-w-[140px]"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Create Agent
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </Layout>
  );
}

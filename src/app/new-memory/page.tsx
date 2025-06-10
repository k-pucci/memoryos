"use client";

import React, { useState } from "react";
import Layout from "@/components/layout";
import { Plus, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // Make sure to install this package

export default function NewMemoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "Research", // Default category
    memory_type: "Note", // Default memory type
    content: "",
    tags: "",
    has_reminder: false
  });
  
  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState("Research");
  
  // Selected memory type state
  const [selectedType, setSelectedType] = useState("Note");
  
  // Tags management
  const [tagsList, setTagsList] = useState<string[]>(["important", "reference", "follow-up", "idea"]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReminderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, has_reminder: e.target.checked }));
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category }));
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, memory_type: type }));
  };

  const handleAddTag = () => {
    if (!formData.tags.trim()) return;
    
    // Split by commas and add each tag
    const newTags = formData.tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag && !tagsList.includes(tag));
    
    if (newTags.length > 0) {
      setTagsList(prev => [...prev, ...newTags]);
      setFormData(prev => ({ ...prev, tags: "" }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
    
    // Prepare payload
    const payload = {
      ...formData,
      tags: tagsList
    };
    
    try {
      const response = await fetch('/api/memories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create memory');
      }
      
      toast.success("Memory created successfully!");
      router.push('/memory-stack');
    } catch (error: any) {
      console.error('Error creating memory:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout currentPage="">
      <div className="space-y-6 overflow-auto max-h-[calc(100vh-130px)] pr-2 pb-8">
        <div className="flex items-center">
          <Plus className="text-purple-400 mr-2" size={22} />
          <h1 className="text-2xl font-bold">Create New Memory</h1>
        </div>
        
        <p className="text-gray-300 mb-6">Capture and store your knowledge in your personal memory system.</p>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Memory Title</label>
                <Input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter a descriptive title..." 
                  className="bg-slate-900/70 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["Research", "Product", "Meeting", "Learning", "Idea", "Task"].map((category, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1.5 rounded-full text-sm ${selectedCategory === category ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800/50 text-gray-300 border border-slate-700 hover:bg-slate-700/50 transition-all'} cursor-pointer`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Memory Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "📝", name: "Note" },
                    { icon: "🔗", name: "Link" },
                    { icon: "📄", name: "Document" },
                    { icon: "📊", name: "Analysis" },
                    { icon: "🧩", name: "Concept" },
                    { icon: "📅", name: "Event" }
                  ].map((type, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTypeSelect(type.name)}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm ${selectedType === type.name ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800/50 text-gray-300 border border-slate-700 hover:bg-slate-700/50 transition-all'} cursor-pointer`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                <textarea 
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Write your memory content..." 
                  className="w-full h-40 px-3 py-2 bg-slate-900/70 border border-slate-700 rounded-xl text-white focus:border-purple-500 focus:ring focus:ring-purple-500/20 transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
                <div className="flex gap-2">
                  <Input 
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Add tags separated by commas..." 
                    className="bg-slate-900/70 border-slate-700 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 bg-slate-700 rounded-md text-white hover:bg-slate-600"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagsList.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-800 text-xs text-gray-300 rounded-full flex items-center">
                      {tag}
                      <button 
                        type="button"
                        onClick={() => handleRemoveTag(tag)} 
                        className="ml-1 text-gray-400 hover:text-gray-200 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="reminder" 
                    checked={formData.has_reminder}
                    onChange={handleReminderChange}
                    className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-purple-500 focus:ring-purple-500/20"
                  />
                  <label htmlFor="reminder" className="ml-2 text-sm text-gray-300">Set reminder</label>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    className="px-4 py-2 border border-slate-700 rounded-lg text-gray-300 hover:bg-slate-800 transition-all cursor-pointer"
                    onClick={() => router.push('/memory-stack')}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleCreateMemory}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Memory"} 
                    {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
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
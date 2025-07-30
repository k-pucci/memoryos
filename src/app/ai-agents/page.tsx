"use client";

import React, { useState } from 'react';
import Layout from "@/components/layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Bot, 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  Brain, 
  Settings,
  Upload,
  Sparkles,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data for AI agents
const sampleAgents = [
  {
    id: "agent-1",
    name: "MemoryOS Assistant",
    description: "Your general-purpose memory assistant that can help you find and organize your memories.",
    avatar: "/avatars/robot-blue.png",
    directive: "You are a helpful assistant that uses my stored memories to provide accurate information and insights based solely on my personal history and notes.",
    createdAt: "2025-04-10T12:00:00Z",
    specialty: "general",
    color: "blue"
  },
  {
    id: "agent-2",
    name: "Research Specialist",
    description: "Specialized in analyzing research papers and technical content in your memory stack.",
    avatar: "/avatars/robot-purple.png",
    directive: "You are a research specialist that analyzes my stored technical content and research papers to extract insights, summarize findings, and connect related concepts.",
    createdAt: "2025-04-15T14:30:00Z",
    specialty: "research",
    color: "purple"
  },
  {
    id: "agent-3",
    name: "Meeting Assistant",
    description: "Helps you prepare for meetings by recalling relevant information and previous discussions.",
    avatar: "/avatars/robot-green.png",
    directive: "You are a meeting assistant that recalls previous meeting notes, action items, and relevant context to help me prepare for upcoming meetings and follow up on past commitments.",
    createdAt: "2025-04-20T09:15:00Z",
    specialty: "meetings",
    color: "emerald"
  }
];

// Default agent avatars for selection
const defaultAvatars = [
  { id: "avatar-1", path: "/avatars/robot-blue.png", color: "blue" },
  { id: "avatar-2", path: "/avatars/robot-purple.png", color: "purple" },
  { id: "avatar-3", path: "/avatars/robot-green.png", color: "emerald" },
  { id: "avatar-4", path: "/avatars/robot-orange.png", color: "amber" },
  { id: "avatar-5", path: "/avatars/robot-red.png", color: "rose" },
  { id: "avatar-6", path: "/avatars/robot-cyan.png", color: "cyan" },
];

// Agent specialties
const specialties = [
  { id: "general", name: "General Purpose", description: "Helps with all types of memories and questions", emoji: "🤖" },
  { id: "research", name: "Research Specialist", description: "Focuses on technical content and research papers", emoji: "🔬" },
  { id: "meetings", name: "Meeting Assistant", description: "Specializes in meeting notes and follow-ups", emoji: "📅" },
  { id: "creativity", name: "Creative Assistant", description: "Helps with brainstorming and idea generation", emoji: "💡" },
  { id: "tasks", name: "Task Manager", description: "Focuses on tracking tasks and commitments", emoji: "✅" },
];

export default function AIAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState(sampleAgents);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatars[0]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0]);
  
  // Form state for new/edit agent
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    directive: "",
    avatar: defaultAvatars[0].path,
    specialty: "general",
    color: "blue"
  });
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar selection
  const handleAvatarSelect = (avatar: any) => {
    setSelectedAvatar(avatar);
    setFormData(prev => ({ ...prev, avatar: avatar.path, color: avatar.color }));
  };
  
  // Handle specialty selection
  const handleSpecialtySelect = (specialty: any) => {
    setSelectedSpecialty(specialty);
    setFormData(prev => ({ ...prev, specialty: specialty.id }));
  };
  
  // Create new agent
  const handleCreateAgent = () => {
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      avatar: formData.avatar,
      directive: formData.directive,
      createdAt: new Date().toISOString(),
      specialty: formData.specialty,
      color: formData.color
    };
    
    setAgents([...agents, newAgent]);
    resetForm();
    setIsCreating(false);
  };
  
  // Edit existing agent
  const handleEditAgent = () => {
    if (!editingAgent) return;
    
    const updatedAgents = agents.map(agent => 
      agent.id === editingAgent.id 
        ? { 
            ...agent, 
            name: formData.name,
            description: formData.description,
            avatar: formData.avatar,
            directive: formData.directive,
            specialty: formData.specialty,
            color: formData.color
          } 
        : agent
    );
    
    setAgents(updatedAgents);
    resetForm();
    setEditingAgent(null);
  };
  
  // Start editing agent
  const startEditingAgent = (agent: any) => {
    setFormData({
      name: agent.name,
      description: agent.description,
      directive: agent.directive,
      avatar: agent.avatar,
      specialty: agent.specialty,
      color: agent.color
    });
    
    // Find and set the selected avatar
    const avatar = defaultAvatars.find(a => a.path === agent.avatar);
    if (avatar) setSelectedAvatar(avatar);
    
    // Find and set the selected specialty
    const specialty = specialties.find(s => s.id === agent.specialty);
    if (specialty) setSelectedSpecialty(specialty);
    
    setEditingAgent(agent);
  };
  
  // Delete agent
  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter(agent => agent.id !== agentId));
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      directive: "",
      avatar: defaultAvatars[0].path,
      specialty: "general",
      color: "blue"
    });
    setSelectedAvatar(defaultAvatars[0]);
    setSelectedSpecialty(specialties[0]);
  };
  
  // Navigate to chat with agent
  const navigateToChat = (agentId: string) => {
    router.push(`/ai-agents/chat/${agentId}`);
  };

  return (
    <Layout currentPage="AI Agents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="text-purple-400 mr-2" size={22} />
            <div>
              <h1 className="text-2xl font-bold">AI Memory Agents</h1>
              <p className="text-gray-400 text-sm">Customize AI agents to help you access your memories</p>
            </div>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                <Plus size={16} className="mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">Create New AI Agent</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Customize your AI agent to help you access your memories in different ways.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid grid-cols-3 bg-slate-800">
                    <TabsTrigger value="basic">Basics</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="directive">Directive</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="mt-4 space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-300">Agent Name</label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder="e.g., Research Assistant, Meeting Helper..." 
                        className="bg-slate-800 border-slate-700 text-white" 
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium text-gray-300">Description</label>
                      <Textarea 
                        id="description" 
                        name="description"
                        placeholder="What does this agent specialize in?" 
                        className="bg-slate-800 border-slate-700 text-white min-h-[80px]" 
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-300">Specialty</label>
                      <div className="grid grid-cols-1 gap-2">
                        {specialties.map(specialty => (
                          <div 
                            key={specialty.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedSpecialty.id === specialty.id 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-slate-700 bg-slate-800 hover:border-purple-400/50'
                            }`}
                            onClick={() => handleSpecialtySelect(specialty)}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{specialty.emoji}</span>
                              <div>
                                <div className="font-medium text-white">{specialty.name}</div>
                                <div className="text-xs text-gray-400">{specialty.description}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="appearance" className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-3">Choose Avatar</label>
                      <div className="grid grid-cols-3 gap-3">
                        {defaultAvatars.map(avatar => (
                          <div 
                            key={avatar.id}
                            className={`p-2 border rounded-lg cursor-pointer flex items-center justify-center transition-all ${
                              selectedAvatar.id === avatar.id 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                            }`}
                            onClick={() => handleAvatarSelect(avatar)}
                          >
                            <Avatar className="h-16 w-16">
                              <AvatarFallback className={`bg-${avatar.color}-500/20 text-${avatar.color}-300`}>
                                AI
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="directive" className="mt-4 space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="directive" className="text-sm font-medium text-gray-300">Agent Instructions</label>
                      <Textarea 
                        id="directive" 
                        name="directive"
                        placeholder="Tell your agent how it should behave and what memories to focus on..." 
                        className="bg-slate-800 border-slate-700 text-white min-h-[120px]" 
                        value={formData.directive}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-gray-500">
                        Be specific about what type of memories this agent should focus on and how it should respond.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="border-slate-700 text-gray-300 hover:bg-slate-800">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  disabled={!formData.name || !formData.description}
                  onClick={handleCreateAgent}
                >
                  Create Agent
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map(agent => (
            <AIAgentCard 
              key={agent.id}
              agent={agent}
              onEdit={startEditingAgent}
              onDelete={handleDeleteAgent}
              onChat={navigateToChat}
            />
          ))}
        </div>
        
        {/* Edit Agent Dialog */}
        {editingAgent && (
          <Dialog open={!!editingAgent} onOpenChange={(isOpen: boolean) => !isOpen && setEditingAgent(null)}>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">Edit {editingAgent.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Update your AI agent's settings and behavior.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="edit-name" className="text-sm font-medium text-gray-300">Agent Name</label>
                  <Input 
                    id="edit-name" 
                    name="name"
                    className="bg-slate-800 border-slate-700 text-white" 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="edit-description" className="text-sm font-medium text-gray-300">Description</label>
                  <Textarea 
                    id="edit-description" 
                    name="description"
                    className="bg-slate-800 border-slate-700 text-white min-h-[80px]" 
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="edit-directive" className="text-sm font-medium text-gray-300">Instructions</label>
                  <Textarea 
                    id="edit-directive" 
                    name="directive"
                    className="bg-slate-800 border-slate-700 text-white min-h-[120px]" 
                    value={formData.directive}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="border-slate-700 text-gray-300 hover:bg-slate-800">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  disabled={!formData.name}
                  onClick={handleEditAgent}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}

// Improved AI Agent Card Component
interface AIAgentCardProps {
  agent: any;
  onEdit: (agent: any) => void;
  onDelete: (agentId: string) => void;
  onChat: (agentId: string) => void;
}

function AIAgentCard({ agent, onEdit, onDelete, onChat }: AIAgentCardProps) {
  const specialty = specialties.find(s => s.id === agent.specialty);
  const [showActions, setShowActions] = useState(false);
  
  return (
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden relative group hover:shadow-lg hover:border-purple-500/30 transition-all">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${agent.color}-500 to-${agent.color}-400`}></div>
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-slate-600">
              <AvatarFallback className={`bg-${agent.color}-500/20 text-${agent.color}-300 font-bold`}>
                {specialty?.emoji || "🤖"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                <Brain size={12} className="mr-1" />
                {specialty?.name || "General Purpose"}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical size={16} />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-10 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit(agent);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-slate-700 hover:text-white flex items-center transition-colors cursor-pointer"
                >
                  <Edit2 size={14} className="mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(agent.id);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center transition-colors cursor-pointer"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <CardDescription className="text-gray-300 text-sm leading-relaxed">
          {agent.description}
        </CardDescription>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <Button 
            className={`w-full bg-gradient-to-r from-${agent.color}-500 to-${agent.color}-400 text-white hover:from-${agent.color}-400 hover:to-${agent.color}-300 hover:shadow-lg hover:shadow-${agent.color}-500/20 transition-all cursor-pointer`}
            onClick={() => onChat(agent.id)}
          >
            Start Chat
          </Button>
        </div>
      </CardContent>
      
      {/* Click outside to close actions */}
      {showActions && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowActions(false)}
        />
      )}
    </Card>
  );
}

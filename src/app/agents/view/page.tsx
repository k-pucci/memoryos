// Enhanced Agents Management Page
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import {
  SelectionGroup,
  SelectionOption,
} from "@/components/ui/selection-group";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Bot,
  Plus,
  Settings,
  Search,
  Edit3,
  Trash2,
  MoreVertical,
  Grid3X3,
  List,
  Users,
  Brain,
  MessageSquare,
  Calendar,
  Filter,
  SortAsc,
  Eye,
  Copy,
  Download,
  Upload,
  Loader2,
  Clock,
  UserX,
  TrendingUp,
  Type,
} from "lucide-react";
import Layout from "@/components/layout";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { ViewToggle } from "@/components/shared/ViewToggle";

interface Agent {
  id: string;
  name: string;
  description: string;
  expertise: string[];
  avatar_url?: string;
  model: string;
  created_at: string;
  last_used?: string;
  message_count?: number;
  search_threshold: number;
  search_categories: string[];
  time_preference: string;
  system_prompt: string;
}

// Filter options for SelectionGroup
const getFilterOptions = (): SelectionOption[] => [
  {
    value: "all",
    label: "All Agents",
    icon: <Users size={16} />,
    description: "Show all agents",
  },
  {
    value: "recent",
    label: "Recently Used",
    icon: <Clock size={16} />,
    description: "Used in the last 7 days",
  },
  {
    value: "unused",
    label: "Unused",
    icon: <UserX size={16} />,
    description: "Never used or no messages",
  },
];

// Sort options for SelectionGroup
const getSortOptions = (): SelectionOption[] => [
  {
    value: "created",
    label: "Created Date",
    icon: <Calendar size={16} />,
    description: "Sort by creation date",
  },
  {
    value: "name",
    label: "Name",
    icon: <Type size={16} />,
    description: "Sort alphabetically",
  },
  {
    value: "used",
    label: "Last Used",
    icon: <TrendingUp size={16} />,
    description: "Sort by last activity",
  },
];

export default function EnhancedAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "created" | "used">("created");
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "unused">("all");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/agents/user-agents");
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAgents(agents.filter((a) => a.id !== agent.id));
        setAgentToDelete(null);
        setShowDeleteModal(false);
      } else {
        throw new Error("Failed to delete agent");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Failed to delete agent. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateAgent = async (agent: Agent) => {
    try {
      const duplicatedAgent = {
        ...agent,
        name: `${agent.name} (Copy)`,
        id: undefined, // Let the backend generate a new ID
      };

      const response = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedAgent),
      });

      if (response.ok) {
        loadAgents(); // Reload to get the new agent
      } else {
        throw new Error("Failed to duplicate agent");
      }
    } catch (error) {
      console.error("Error duplicating agent:", error);
      alert("Failed to duplicate agent. Please try again.");
    }
  };

  const filteredAndSortedAgents = agents
    .filter((agent) => {
      // Search filter
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.expertise.some((exp) =>
          exp.toLowerCase().includes(searchQuery.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Category filter
      switch (filterBy) {
        case "recent":
          return (
            agent.last_used &&
            new Date(agent.last_used) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
        case "unused":
          return !agent.last_used || (agent.message_count || 0) === 0;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "used":
          return (
            new Date(b.last_used || 0).getTime() -
            new Date(a.last_used || 0).getTime()
          );
        case "created":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  if (isLoading) {
    return (
      <Layout currentPage="Agents">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your agents...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="Agents">
      <div className="flex flex-col h-full max-h-screen overflow-hidden">
        {/* Fixed Header Section */}
        <div className="flex-shrink-0 space-y-6 p-6 pb-0">
          {/* Main Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold brand-terracotta">AI Agents</h1>
              <p className="text-muted-foreground mt-2">
                Manage your specialized AI assistants
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push("/agents/create")}>
                <Plus size={18} />
                <span className="ml-2">Create New Agent</span>
              </Button>
              <Button variant="outline">
                <Upload size={18} />
                <span className="hidden sm:inline ml-2">Import</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <SearchBar
                placeholder="Search agents..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="flex-1"
                showDropdown={false}
                variant="default"
                size="md"
              />

              {/* View Toggle */}
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

              {/* Filter Toggle */}
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} />
              </Button>
            </div>

            {/* Collapsible Filter Controls */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SelectionGroup
                    options={getFilterOptions()}
                    value={filterBy}
                    onChange={(value) => setFilterBy(value as typeof filterBy)}
                    label="Filter by Status"
                    variant="buttons"
                    size="sm"
                  />
                </div>

                <div className="flex-1">
                  <SelectionGroup
                    options={getSortOptions()}
                    value={sortBy}
                    onChange={(value) => setSortBy(value as typeof sortBy)}
                    label="Sort by"
                    variant="buttons"
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 pt-4">
              {filteredAndSortedAgents.length === 0 ? (
                <EmptyState
                  icon={<Bot size={48} />}
                  title={searchQuery ? "No agents found" : "No agents yet"}
                  description={
                    searchQuery
                      ? `No agents match "${searchQuery}". Try adjusting your search or filters.`
                      : "Create your first AI agent to get started with personalized assistance."
                  }
                  action={
                    !searchQuery
                      ? {
                          label: "Create Your First Agent",
                          onClick: () => router.push("/agents/create"),
                        }
                      : undefined
                  }
                />
              ) : (
                <div
                  className={cn(
                    "gap-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                      : "space-y-4"
                  )}
                >
                  {filteredAndSortedAgents.map((agent) =>
                    viewMode === "grid" ? (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onEdit={() => router.push(`/agents/${agent.id}/edit`)}
                        onDelete={() => {
                          setAgentToDelete(agent);
                          setShowDeleteModal(true);
                        }}
                        onDuplicate={() => handleDuplicateAgent(agent)}
                        onChat={() => router.push(`/chat?agent=${agent.id}`)}
                      />
                    ) : (
                      <AgentListItem
                        key={agent.id}
                        agent={agent}
                        onEdit={() => router.push(`/agents/${agent.id}/edit`)}
                        onDelete={() => {
                          setAgentToDelete(agent);
                          setShowDeleteModal(true);
                        }}
                        onDuplicate={() => handleDuplicateAgent(agent)}
                        onChat={() => router.push(`/chat?agent=${agent.id}`)}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Agent"
        itemName={agentToDelete?.name || ""}
        itemType="agent"
        isDeleting={isDeleting}
        onConfirm={() => agentToDelete && handleDeleteAgent(agentToDelete)}
        onCancel={() => {
          setShowDeleteModal(false);
          setAgentToDelete(null);
        }}
      />
    </Layout>
  );
}

// Agent Card Component for Grid View
interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChat: () => void;
}

function AgentCard({
  agent,
  onEdit,
  onDelete,
  onDuplicate,
  onChat,
}: AgentCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card
      className="bg-card border-border card-shadow hover:card-shadow-lg hover:border-primary/30 transition-all duration-200 group cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onChat}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={agent.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary font-medium">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
              {agent.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {agent.description}
            </p>
          </div>

          {/* Action Menu */}
          <div
            className={cn(
              "transition-opacity duration-200",
              showActions ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit3 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.expertise.slice(0, 3).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {agent.expertise.length > 3 && (
            <span className="text-xs text-muted-foreground px-2 py-1">
              +{agent.expertise.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span>{agent.message_count || 0} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>
              {agent.last_used
                ? new Date(agent.last_used).toLocaleDateString()
                : "Never used"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Agent List Item Component for List View
function AgentListItem({
  agent,
  onEdit,
  onDelete,
  onDuplicate,
  onChat,
}: AgentCardProps) {
  return (
    <Card
      className="bg-card border-border card-shadow hover:card-shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer"
      onClick={onChat}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={agent.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-foreground">{agent.name}</h3>
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                {agent.model}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {agent.description}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="text-center">
              <div className="font-medium text-foreground">
                {agent.message_count || 0}
              </div>
              <div>messages</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground">
                {agent.last_used
                  ? new Date(agent.last_used).toLocaleDateString()
                  : "Never"}
              </div>
              <div>last used</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit3 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

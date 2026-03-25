"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import {
  X,
  Edit,
  Trash2,
  Save,
  Loader2,
  ExternalLink,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MEMORY_CATEGORIES } from "@/lib/memory-utils";

interface Memory {
  id: string;
  title: string;
  category: string;
  memory_type: string;
  content: string;
  summary: string;
  tags: string[];
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

interface MemoryDetailPanelProps {
  memoryId: string | null;
  onClose: () => void;
  onDeleted?: (memoryId: string) => void;
}

const categoryOptions = MEMORY_CATEGORIES.filter((c) => c !== "All").map(
  (cat) => ({ value: cat, label: cat })
);

const memoryTypeOptions = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "document", label: "Document" },
  { value: "analysis", label: "Analysis" },
  { value: "concept", label: "Concept" },
  { value: "event", label: "Event" },
];

export function MemoryDetailPanel({
  memoryId,
  onClose,
  onDeleted,
}: MemoryDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    memory_type: "",
    content: "",
    source_url: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 3000);
    },
    []
  );

  // Fetch memory when ID changes
  useEffect(() => {
    if (!memoryId) return;
    setIsEditing(false);
    setNotification(null);
    setShowDeleteConfirm(false);

    const fetchMemory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/memories/${memoryId}`);
        if (!response.ok) throw new Error("Failed to load memory");
        const data = await response.json();
        setMemory(data);
        setEditForm({
          title: data.title || "",
          category: data.category || "",
          memory_type: data.memory_type || "",
          content: data.content || "",
          source_url: data.source_url || "",
        });
        setSelectedTags(data.tags || []);
      } catch {
        showNotification("error", "Failed to load memory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemory();
  }, [memoryId, showNotification]);

  // Close on escape
  useEffect(() => {
    if (!memoryId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [memoryId, isEditing, onClose]);

  // Close on click outside (skip when delete dialog is open)
  useEffect(() => {
    if (!memoryId) return;
    const handleClick = (e: MouseEvent) => {
      if (showDeleteConfirm) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [memoryId, onClose, showDeleteConfirm]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!memoryId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, tags: selectedTags }),
      });
      if (!response.ok) throw new Error("Failed to update memory");

      // Refetch to get the updated data
      const updated = await fetch(`/api/memories/${memoryId}`);
      const data = await updated.json();
      setMemory(data);
      setIsEditing(false);
      showNotification("success", "Memory updated");
    } catch {
      showNotification("error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memoryId) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete memory");
      showNotification("success", "Memory deleted");
      setTimeout(() => {
        onDeleted?.(memoryId);
        onClose();
      }, 800);
    } catch {
      showNotification("error", "Failed to delete memory");
      setIsDeleting(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (!memoryId) return null;

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Panel */}
        <div
          ref={panelRef}
          className="absolute top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2 min-w-0">
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer flex-shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-lg font-bold text-foreground truncate">
                {isEditing ? "Edit Memory" : "Memory Details"}
              </h2>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isEditing && !isLoading && memory && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={cn(
                "mx-5 mt-3 px-3 py-2 rounded-md text-sm",
                notification.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {notification.message}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">
                  Loading memory...
                </p>
              </div>
            ) : !memory ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">
                  Memory not found
                </p>
              </div>
            ) : isEditing ? (
              /* Edit Mode */
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Title
                  </label>
                  <Input
                    name="title"
                    value={editForm.title}
                    onChange={handleInputChange}
                    placeholder="Memory title..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Content
                  </label>
                  <Textarea
                    name="content"
                    value={editForm.content}
                    onChange={handleInputChange}
                    placeholder="Memory content..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Category
                    </label>
                    <Select
                      name="category"
                      value={editForm.category}
                      onChange={(value) =>
                        setEditForm((prev) => ({ ...prev, category: value }))
                      }
                      options={categoryOptions}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Type
                    </label>
                    <Select
                      name="memory_type"
                      value={editForm.memory_type}
                      onChange={(value) =>
                        setEditForm((prev) => ({
                          ...prev,
                          memory_type: value,
                        }))
                      }
                      options={memoryTypeOptions}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Source URL
                  </label>
                  <Input
                    name="source_url"
                    type="url"
                    value={editForm.source_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Tags
                  </label>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className="hover:text-destructive transition-colors cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {memory.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted font-medium">
                      {memory.category}
                    </span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-muted font-medium">
                      {memory.memory_type}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(memory.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                {memory.source_url && (
                  <a
                    href={memory.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors text-sm"
                  >
                    <ExternalLink size={14} />
                    <span>Source</span>
                  </a>
                )}

                <div className="py-4 border-t border-b border-border">
                  <div className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                    {memory.content}
                  </div>
                </div>

                {memory.summary && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Summary
                    </p>
                    <p className="text-sm text-foreground">{memory.summary}</p>
                  </div>
                )}

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
          </div>

          {/* Footer - only in edit mode */}
          {isEditing && memory && (
            <div className="p-5 border-t border-border flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Save size={14} className="mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Memory"
        itemName={memory?.title || ""}
        itemType="memory"
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

// components/layout/LayoutHeader.tsx - Extract header logic
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SearchBar, SearchResult } from "@/components/ui/search-bar";
import { Plus } from "lucide-react";

interface LayoutHeaderProps {
  onNewMemory: () => void;
  searchFunction: (query: string) => Promise<SearchResult[]>;
  renderResult: (result: SearchResult) => React.ReactNode;
  onResultClick: (result: SearchResult) => void;
  onViewAllResults: (query: string) => void;
}

export function LayoutHeader({
  onNewMemory,
  searchFunction,
  renderResult,
  onResultClick,
  onViewAllResults
}: LayoutHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <SearchBar
        placeholder="Search your memories..."
        searchFunction={searchFunction}
        renderResult={renderResult}
        onResultClick={onResultClick}
        onViewAllResults={onViewAllResults}
        className="flex-1"
        size="lg"
        variant="default"
      />
      <Button onClick={onNewMemory} className="h-10 px-4">
        <Plus size={18} />
        <span className="ml-2">New Memory</span>
      </Button>
    </div>
  );
}
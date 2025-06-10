// components/layout.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  Database, 
  Search, 
  BookOpen, 
  Calendar,
  Bell,
  Settings,
  Plus,
  Menu,
  Edit,
  Globe,
  FileText,
  Archive,
  X,
  Loader2,
  Bot,
  Moon,
  Sun
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}

interface MemoryResult {
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
  similarity: number;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

// Simple debounce implementation
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Layout({ children, currentPage = "Home" }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemoryResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Navigation items with their paths
  const navItems: NavItem[] = [
    { icon: <Home size={18} />, label: "Home", path: "/" },
    { icon: <Database size={18} />, label: "Memory Stack", path: "/memory-stack" },
    { icon: <BookOpen size={18} />, label: "Library", path: "/library" },
    { icon: <Bot size={18} />, label: "AI Agents", path: "/ai-agents" },
    { icon: <Calendar size={18} />, label: "Calendar", path: "/calendar" },
  ];
  
  const bottomNavItems: NavItem[] = [
    { icon: <Bell size={18} />, label: "Notifications", path: "/notifications" },
    { icon: <Settings size={18} />, label: "Settings", path: "/settings" },
  ];

  // Handle navigation
  const navigateTo = (path: string) => {
    router.push(path);
  };

  // Handle clicks outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current && 
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300),
    []
  );

  // Function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    
    if (newQuery.trim().length >= 2) {
      setShowSearchResults(true);
      debouncedSearch(newQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  
  // Function to perform the search
  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch("/api/memories/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: query,
          limit: 5 // Limit to top 5 results for the dropdown
        }),
      });
      
      if (!response.ok) {
        throw new Error("Search failed");
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching memories:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Function to view a memory
  const viewMemory = (memoryId: string) => {
    clearSearch();
    navigateTo(`/memory/${memoryId}`);
  };

  // Function to view all results
  const viewAllResults = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      clearSearch();
    }
  };

  // Get icon for memory type
  const getMemoryTypeIcon = (memoryType: string) => {
    switch (memoryType.toLowerCase()) {
      case "note":
        return <Edit size={14} />;
      case "link":
        return <Globe size={14} />;
      case "document":
        return <FileText size={14} />;
      case "analysis":
        return <Search size={14} />;
      case "concept":
        return <BookOpen size={14} />;
      case "event":
        return <Calendar size={14} />;
      default:
        return <Archive size={14} />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 p-4 flex flex-col gap-4 relative border-r border-sidebar-border bg-sidebar`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {!sidebarCollapsed && (
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigateTo('/')}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 text-2xl font-bold mr-1">Memory</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400 text-2xl font-bold">OS</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div 
              className="mx-auto text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 text-2xl font-bold cursor-pointer"
              onClick={() => navigateTo('/')}
            >
              M
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col space-y-1">
          {navItems.map((item, index) => (
            <NavButton 
              key={index}
              icon={item.icon} 
              label={item.label} 
              collapsed={sidebarCollapsed}
              active={currentPage === item.label || (currentPage === "Home" && item.path === "/" && pathname === "/")} 
              onClick={() => navigateTo(item.path)}
            />
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="mt-auto flex flex-col space-y-1">
          {/* Theme toggle button */}
          <button 
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent/50 transition-colors relative group cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={toggleTheme}
          >
            <div className="text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            
            {!sidebarCollapsed && (
              <span className="text-sm">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>

          {bottomNavItems.map((item, index) => (
            <NavButton 
              key={index}
              icon={item.icon} 
              label={item.label} 
              collapsed={sidebarCollapsed} 
              active={currentPage === item.label}
              onClick={() => navigateTo(item.path)}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          {/* Search Bar with real-time search */}
          <div className="relative w-2/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-muted-foreground" />
            </div>
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search your memories..."
              className="bg-secondary/50 border-border text-foreground pl-10 h-12 rounded-xl focus:border-primary focus:ring focus:ring-primary/20 transition-all"
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  viewAllResults();
                }
              }}
            />
            {searchQuery && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
              >
                <X size={16} />
              </button>
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl blur-sm"></div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div 
                ref={searchResultsRef}
                className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-20"
              >
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-sidebar-primary animate-spin" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.map((memory) => (
                      <div 
                        key={memory.id}
                        className="p-3 border-b border-border last:border-b-0 hover:bg-secondary/50 cursor-pointer"
                        onClick={() => viewMemory(memory.id)}
                      >
                        <div className="flex justify-between mb-1">
                          <h4 className="font-medium text-foreground">{memory.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2">
                          {memory.summary || memory.content.substring(0, 120) + (memory.content.length > 120 ? '...' : '')}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex gap-1 items-center text-xs text-muted-foreground">
                            {getMemoryTypeIcon(memory.memory_type)}
                            <span className="ml-1">{memory.memory_type}</span>
                          </div>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-foreground/80">
                            {memory.category}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="p-3 text-center bg-popover hover:bg-secondary cursor-pointer text-sidebar-primary hover:text-sidebar-primary/80 text-sm"
                      onClick={viewAllResults}
                    >
                      See all results for "{searchQuery}"
                    </div>
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No results found for "{searchQuery}"</p>
                    <button 
                      className="mt-2 text-sidebar-primary hover:text-sidebar-primary/80 text-sm"
                      onClick={() => navigateTo('/new-memory')}
                    >
                      + Add a new memory
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <button 
              className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              onClick={() => navigateTo('/new-memory')}
            >
              <Plus size={18} />
            </button>
            <Avatar className="border-2 border-purple-500/30 h-10 w-10 cursor-pointer" onClick={() => navigateTo('/profile')}>
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500">
                MS
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

// Navigation Button Component with proper TypeScript typing
function NavButton({ icon, label, collapsed, active = false, onClick }: NavButtonProps) {
  return (
    <button 
      className={`flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent/50 transition-colors relative group cursor-pointer ${
        active 
          ? "bg-gradient-to-r from-sidebar-primary/20 to-blue-500/20 text-sidebar-foreground" 
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
      }`}
      onClick={onClick}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-sidebar-primary to-blue-500 rounded-r-full" />
      )}

      <div className={active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80"}>
        {icon}
      </div>
      
      {!collapsed && <span className="text-sm">{label}</span>}
    </button>
  );
}
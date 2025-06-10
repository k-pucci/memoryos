// app/api/memory-stack/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { formatDistanceToNow } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for better TypeScript support
interface MemoryItem {
  category: string;
  count: number;
  last_updated?: string;
}

interface MemoryStack {
  title: string;
  description: string;
  item_count: number;
  last_updated: string;
  color: string;
}

export async function GET() {
  try {
    // First try to query the memory_stacks view if it exists
    let data: MemoryStack[] = [];
    let hasError = false;
    
    try {
      // Try to use the view
      const result = await supabase
        .from('memory_stacks')
        .select('*');
      
      if (result.error) {
        hasError = true;
      } else {
        data = result.data as MemoryStack[];
      }
    } catch (e) {
      // If view doesn't exist, use aggregation query
      console.log('Memory stacks view not found, using fallback query');
      hasError = true;
    }
    
    if (hasError) {
      // Fallback to direct query if view doesn't exist
      
      // First get category counts
      const countResult = await supabase.rpc('get_category_counts');
      
      if (countResult.error) {
        // If RPC function doesn't exist, handle raw SQL or return empty data
        console.error('RPC function not available, returning sample data');
        
        // Return sample data when everything fails
        data = getSampleStacks();
      } else {
        // Map the aggregation results to match expected format
        const items = countResult.data as MemoryItem[];
        
        data = items.map((item: MemoryItem) => ({
          title: item.category,
          description: `Collection of ${item.category} memories`,
          item_count: item.count,
          last_updated: item.last_updated || new Date().toISOString(),
          color: getColorForCategory(item.category)
        }));
      }
    }

    // Format the data to match your frontend structure
    const formattedStacks = data.map((stack: MemoryStack) => ({
      title: stack.title,
      description: stack.description,
      itemCount: stack.item_count,
      lastUpdated: formatTimeAgo(stack.last_updated),
      color: stack.color || getColorForCategory(stack.title)
    }));

    return NextResponse.json({ stacks: formattedStacks });
  } catch (error: any) {
    console.error('Error fetching memory stacks:', error);
    
    // Return sample data on error
    const sampleStacks = getSampleStacks();
    const formattedStacks = sampleStacks.map((stack: MemoryStack) => ({
      title: stack.title,
      description: stack.description,
      itemCount: stack.item_count,
      lastUpdated: formatTimeAgo(stack.last_updated),
      color: stack.color || getColorForCategory(stack.title)
    }));
    
    return NextResponse.json({ 
      stacks: formattedStacks,
      error: 'Failed to fetch memory stacks' 
    });
  }
}

// Helper function to format the time
function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return 'Recently';
  }
}

// Helper function to assign colors based on category
function getColorForCategory(category: string): string {
  // Map categories to specific colors
  const colorMap: Record<string, string> = {
    'Research': 'blue',
    'Product': 'purple',
    'Meeting': 'amber',
    'Learning': 'pink',
    'Idea': 'emerald',
    'Task': 'indigo'
  };
  
  return colorMap[category] || 'purple';
}

// Sample data for fallback
function getSampleStacks(): MemoryStack[] {
  return [
    {
      title: "Research",
      description: "Research notes and insights",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "blue"
    },
    {
      title: "Product",
      description: "Product development and ideas",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "purple"
    },
    {
      title: "Meeting",
      description: "Meeting notes and action items",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "amber"
    },
    {
      title: "Learning",
      description: "Learning resources and notes",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "pink"
    },
    {
      title: "Idea",
      description: "Creative ideas and brainstorms",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "emerald"
    },
    {
      title: "Task",
      description: "Tasks and to-dos",
      item_count: 0,
      last_updated: new Date().toISOString(),
      color: "indigo"
    }
  ];
}
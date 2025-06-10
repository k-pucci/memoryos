// app/api/analytics/memories/route.ts (Fixed version)
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Category colors mapping
const categoryColors: Record<string, string> = {
  'Research': '#3b82f6', // blue
  'Product': '#8b5cf6',  // purple
  'Meeting': '#f59e0b',  // amber
  'Learning': '#ec4899', // pink
  'Idea': '#10b981',     // emerald
  'Task': '#6366f1',     // indigo
};

// Memory type colors mapping
const typeColors: Record<string, string> = {
  'Note': '#8b5cf6',     // purple
  'Link': '#3b82f6',     // blue
  'Document': '#f59e0b', // amber
  'Analysis': '#10b981', // emerald
  'Concept': '#ec4899',  // pink
  'Event': '#6366f1',    // indigo
};

interface CategoryCount {
  category: string;
  count: string | number;
}

interface TypeCount {
  memory_type: string;
  count: string | number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    
    // Get date range based on selected time range
    let fromDate: Date | null = null;
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        fromDate = subDays(now, 7);
        break;
      case 'month':
        fromDate = subMonths(now, 1);
        break;
      case 'year':
        fromDate = subYears(now, 1);
        break;
      case 'all':
      default:
        fromDate = null;
        break;
    }
    
    // 1. Get overall memory stats
    const { data: statsData, error: statsError } = await supabase.rpc('get_memory_stats');
    
    if (statsError) {
      console.error('Error fetching memory stats:', statsError);
      throw new Error('Failed to fetch memory statistics');
    }
    
    const stats = statsData[0] || {
      total_memories: 0,
      total_categories: 0,
      newest_memory: null,
      oldest_memory: null,
      memories_last_week: 0,
      memories_last_month: 0
    };
    
    // 2. Get distribution by category
    // Use SQL query instead of group function
    let categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM memories
    `;
    
    if (fromDate) {
      categoryQuery += ` WHERE created_at >= '${fromDate.toISOString()}'`;
    }
    
    categoryQuery += ` GROUP BY category`;
    
    const { data: categoryData, error: categoryError } = await supabase.rpc('execute_sql', {
      sql_query: categoryQuery
    });
    
    if (categoryError) {
      console.error('Error fetching category distribution:', categoryError);
      throw new Error('Failed to fetch category distribution');
    }
    
    const byCategory = (categoryData || []).map((item: CategoryCount) => ({
      category: item.category,
      count: parseInt(item.count as string),
      color: categoryColors[item.category] || '#64748b' // default to slate
    }));
    
    // 3. Get distribution by memory type
    // Use SQL query instead of group function
    let typeQuery = `
      SELECT memory_type, COUNT(*) as count
      FROM memories
    `;
    
    if (fromDate) {
      typeQuery += ` WHERE created_at >= '${fromDate.toISOString()}'`;
    }
    
    typeQuery += ` GROUP BY memory_type`;
    
    const { data: typeData, error: typeError } = await supabase.rpc('execute_sql', {
      sql_query: typeQuery
    });
    
    if (typeError) {
      console.error('Error fetching memory types:', typeError);
      throw new Error('Failed to fetch memory types');
    }
    
    const byType = (typeData || []).map((item: TypeCount) => ({
      type: item.memory_type,
      count: parseInt(item.count as string),
      color: typeColors[item.memory_type] || '#64748b' // default to slate
    }));
    
    // 4. Get memory creation over time
    let timeQuery = supabase.from('memories').select('created_at');
    
    if (fromDate) {
      timeQuery = timeQuery.gte('created_at', fromDate.toISOString());
    }
    
    const { data: timeData, error: timeError } = await timeQuery.order('created_at', { ascending: true });
    
    if (timeError) {
      console.error('Error fetching memory timeline:', timeError);
      throw new Error('Failed to fetch memory timeline');
    }
    
    // Format the time data based on selected time range
    const timeFormat = timeRange === 'week' ? 'EEE' : 
                      timeRange === 'month' ? 'MMM dd' : 
                      timeRange === 'year' ? 'MMM' : 'yyyy-MM';
    
    const timeMap: Record<string, number> = {};
    
    (timeData || []).forEach(item => {
      const date = parseISO(item.created_at);
      const formattedDate = format(date, timeFormat);
      
      if (!timeMap[formattedDate]) {
        timeMap[formattedDate] = 0;
      }
      
      timeMap[formattedDate]++;
    });
    
    const byTime = Object.entries(timeMap).map(([date, count]) => ({ date, count }));
    
    // 5. Get popular tags
    const { data: tagsData, error: tagsError } = await supabase.rpc('get_all_tags');
    
    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      throw new Error('Failed to fetch popular tags');
    }
    
    // Limit to top 10 tags
    const popularTags = (tagsData || [])
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)
      .map((item: any) => ({
        tag: item.tag,
        count: parseInt(item.count)
      }));
    
    // Combine all data
    const response = {
      ...stats,
      by_category: byCategory,
      by_type: byType,
      by_time: byTime,
      popular_tags: popularTags
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
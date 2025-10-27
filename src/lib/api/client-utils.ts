// lib/api/client-utils.ts - Client-side safe
export { createClient } from '@/lib/supabase/client';

// Helper function stays here since it's for server use
export async function getAuthenticatedUser(request: Request) {
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore cookie setting errors in API routes
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}
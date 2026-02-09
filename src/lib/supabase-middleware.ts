/**
 * Supabase Client for Next.js Middleware
 * Handles authentication cookies and session management at the edge
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Creates a Supabase client for middleware with cookie handling
 * This allows server-side session checks without client-side JavaScript
 */
export async function createMiddlewareClient(request: NextRequest) {
  // Create a mutable response that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Get user session - this automatically refreshes expired tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, response };
}

/**
 * Gets user session from middleware without creating a client
 * Useful for quick auth checks
 */
export async function getSession(request: NextRequest) {
  const { supabase, user } = await createMiddlewareClient(request);
  return { supabase, user };
}

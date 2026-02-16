import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ApplicationLogLevel = 'info' | 'warn' | 'error';

type ApplicationLogEvent = {
  level: ApplicationLogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown> | null;
  path?: string | null;
  method?: string | null;
  status?: number | null;
  durationMs?: number | null;
  userId?: string | null;
};

export type ApplicationLogsDatabase = {
  public: {
    Tables: {
      application_logs: {
        Row: {
          id: number;
          created_at: string;
          level: ApplicationLogLevel;
          source: string;
          message: string;
          details: Record<string, unknown> | null;
          path: string | null;
          method: string | null;
          status: number | null;
          duration_ms: number | null;
          user_id: string | null;
        };
        Insert: {
          level: ApplicationLogLevel;
          source: string;
          message: string;
          details?: Record<string, unknown> | null;
          path?: string | null;
          method?: string | null;
          status?: number | null;
          duration_ms?: number | null;
          user_id?: string | null;
        };
        Update: {
          level?: ApplicationLogLevel;
          source?: string;
          message?: string;
          details?: Record<string, unknown> | null;
          path?: string | null;
          method?: string | null;
          status?: number | null;
          duration_ms?: number | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function toSafeJson(details: Record<string, unknown> | null | undefined) {
  if (!details) {return null;}
  try {
    return JSON.parse(JSON.stringify(details));
  } catch {
    return { note: 'Failed to serialize log details safely.' };
  }
}

export async function logApplicationEvent(event: ApplicationLogEvent): Promise<void> {
  try {
    const admin = createSupabaseAdminClient() as unknown as SupabaseClient<ApplicationLogsDatabase>;
    await admin.from('application_logs').insert({
      level: event.level,
      source: event.source,
      message: event.message,
      details: toSafeJson(event.details),
      path: event.path ?? null,
      method: event.method ?? null,
      status: event.status ?? null,
      duration_ms: event.durationMs ?? null,
      user_id: event.userId ?? null,
    });
  } catch (error) {
    console.error('Application log write failed:', error);
  }
}

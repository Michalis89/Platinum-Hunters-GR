'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';

type AdminLog = {
  id: number;
  created_at: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details: Record<string, unknown> | null;
  path: string | null;
  method: string | null;
  status: number | null;
  duration_ms: number | null;
  user_id: string | null;
};

type FiltersState = {
  level: string;
  q: string;
  path: string;
};

const DEFAULT_LIMIT = 50;

const initialFilters: FiltersState = {
  level: '',
  q: '',
  path: '',
};

const levelBadgeVariant: Record<AdminLog['level'], 'secondary' | 'outline' | 'destructive'> = {
  info: 'secondary',
  warn: 'outline',
  error: 'destructive',
};

export default function AdminApplicationLogsPane() {
  const [rows, setRows] = useState<AdminLog[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', String(DEFAULT_LIMIT));
    params.set('offset', String((page - 1) * DEFAULT_LIMIT));
    for (const [key, value] of Object.entries(filters)) {
      if (value.trim()) {
        params.set(key, value.trim());
      }
    }
    return params.toString();
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/logs?${queryString}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to fetch logs');
        }
        if (!ignore) {
          setRows(Array.isArray(payload?.data) ? payload.data : []);
          setTotal(Number(payload?.meta?.total ?? 0));
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [queryString]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Application Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Level"
            value={filters.level}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, level: value }));
            }}
            options={['', 'info', 'warn', 'error']}
            placeholder="All"
          />
          <Input
            label="Path filter"
            value={filters.path}
            onChange={event => {
              setPage(1);
              setFilters(prev => ({ ...prev, path: event.target.value }));
            }}
            placeholder="/api/admin/..."
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Search</label>
            <div className="flex items-center gap-2">
              <Input
                value={filters.q}
                onChange={event => {
                  setPage(1);
                  setFilters(prev => ({ ...prev, q: event.target.value }));
                }}
                placeholder="message, source, path"
              />
              <Button type="button" variant="secondary" size="icon" aria-label="Search logs">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error ? <ErrorAlert message={error} /> : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No logs found" description="Try broader filters." />
        ) : (
          <div className="space-y-3">
            {rows.map(log => (
              <div key={log.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={levelBadgeVariant[log.level]}>{log.level.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{log.source}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">{log.message}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Path: {log.path ?? '-'}</span>
                  <span>Method: {log.method ?? '-'}</span>
                  <span>Status: {log.status ?? '-'}</span>
                  <span>Duration: {log.duration_ms ?? '-'} ms</span>
                </div>
                {log.details ? (
                  <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            Total logs: <span className="font-medium text-foreground">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

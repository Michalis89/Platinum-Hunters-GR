'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Save, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserRole } from '@/types/user';

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  email: string;
  account_status: string | null;
  country: string | null;
  roles: string[];
  created_at: string | null;
  updated_at: string | null;
  last_login: string | null;
};

type FiltersState = {
  q: string;
  role: string;
  status: string;
};

type MetaState = {
  total: number;
  limit: number;
  offset: number;
  filters: {
    roles: string[];
    statuses: string[];
  };
};

type EditingState = {
  display_name: string;
  full_name: string;
  country: string;
  account_status: string;
  roles: UserRole[];
};

const ROLE_OPTIONS: UserRole[] = ['user', 'author', 'reviewer', 'moderator', 'admin', 'owner'];
const ROLE_LABELS: Record<UserRole, string> = {
  user: 'User',
  author: 'Author',
  reviewer: 'Reviewer',
  moderator: 'Moderator',
  admin: 'Admin',
  owner: 'Owner',
};

const DEFAULT_LIMIT = 20;

const initialFilters: FiltersState = {
  q: '',
  role: '',
  status: '',
};

const emptyMeta: MetaState = {
  total: 0,
  limit: DEFAULT_LIMIT,
  offset: 0,
  filters: {
    roles: ROLE_OPTIONS,
    statuses: [],
  },
};

function normalizeRoleList(input: string[]): UserRole[] {
  const normalized = Array.from(
    new Set(
      input
        .map(role => role.toLowerCase())
        .filter((role): role is UserRole => ROLE_OPTIONS.includes(role as UserRole)),
    ),
  );
  return normalized.length > 0 ? normalized : ['user'];
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString();
}

export default function AdminUsersManagementTable() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<MetaState>(emptyMeta);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil((meta.total || 0) / DEFAULT_LIMIT));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${DEFAULT_LIMIT}`);
    params.set('offset', `${(page - 1) * DEFAULT_LIMIT}`);
    if (filters.q.trim()) {
      params.set('q', filters.q.trim());
    }
    if (filters.role.trim()) {
      params.set('role', filters.role.trim());
    }
    if (filters.status.trim()) {
      params.set('status', filters.status.trim());
    }
    return params.toString();
  }, [filters, page]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/support/users?${queryString}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to fetch users');
      }

      const nextRows = Array.isArray(payload?.data) ? (payload.data as UserRow[]) : [];
      const nextMeta = payload?.meta as MetaState | undefined;
      setRows(nextRows);
      setMeta(nextMeta ?? emptyMeta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const startEditing = (row: UserRow) => {
    setEditingId(row.id);
    setEditingState({
      display_name: row.display_name ?? '',
      full_name: row.full_name ?? '',
      country: row.country ?? '',
      account_status: row.account_status ?? '',
      roles: normalizeRoleList(row.roles),
    });
  };

  const resetEdit = () => {
    setEditingId(null);
    setEditingState(null);
  };

  const toggleRole = (role: UserRole, checked: boolean) => {
    if (!editingState) {
      return;
    }
    const nextRoles = checked
      ? Array.from(new Set([...editingState.roles, role]))
      : editingState.roles.filter(item => item !== role);
    setEditingState(prev =>
      prev
        ? {
            ...prev,
            roles: nextRoles.length > 0 ? nextRoles : ['user'],
          }
        : prev,
    );
  };

  const saveRow = async (rowId: string) => {
    if (!editingState) {
      return;
    }
    setSavingId(rowId);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/support/users/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            display_name: editingState.display_name,
            full_name: editingState.full_name,
            country: editingState.country,
            account_status: editingState.account_status,
            roles: editingState.roles,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to update user');
      }

      const updated = payload?.data as UserRow | undefined;
      if (updated) {
        setRows(prev => prev.map(row => (row.id === rowId ? updated : row)));
      }
      setSuccessMessage('User updated successfully.');
      resetEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/admin/support/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete user');
      }

      setRows(prev => prev.filter(row => row.id !== deleteTarget.id));
      setSuccessMessage(`Deleted user "${deleteTarget.username}".`);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-foreground">User Management</CardTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void fetchRows()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Search</label>
            <Input
              value={filters.q}
              onChange={event => {
                setPage(1);
                setFilters(prev => ({ ...prev, q: event.target.value }));
              }}
              placeholder="Username, display name, full name, or email"
            />
          </div>
          <Select
            label="Role"
            value={filters.role}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, role: value }));
            }}
            options={['', ...(meta.filters.roles ?? ROLE_OPTIONS)]}
            optionLabels={{
              '': 'All',
              user: 'User',
              author: 'Author',
              reviewer: 'Reviewer',
              moderator: 'Moderator',
              admin: 'Admin',
              owner: 'Owner',
            }}
            placeholder="All"
          />
          <Select
            label="Account status"
            value={filters.status}
            onChange={value => {
              setPage(1);
              setFilters(prev => ({ ...prev, status: value }));
            }}
            options={['', ...(meta.filters.statuses ?? [])]}
            optionLabels={{ '': 'All' }}
            placeholder="All"
          />
        </div>

        {error ? <ErrorAlert message={error} /> : null}
        {successMessage ? (
          <p className="text-sm font-medium text-emerald-400">{successMessage}</p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No users found" description="Try changing filters or search terms." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="min-w-[260px]">Roles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const isEditing = editingId === row.id && editingState !== null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.username}</TableCell>
                      <TableCell className="min-w-[180px]">
                        {isEditing ? (
                          <Input
                            value={editingState.display_name}
                            onChange={event =>
                              setEditingState(prev =>
                                prev ? { ...prev, display_name: event.target.value } : prev,
                              )
                            }
                          />
                        ) : (
                          row.display_name || '-'
                        )}
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        {isEditing ? (
                          <Input
                            value={editingState.full_name}
                            onChange={event =>
                              setEditingState(prev =>
                                prev ? { ...prev, full_name: event.target.value } : prev,
                              )
                            }
                          />
                        ) : (
                          row.full_name || '-'
                        )}
                      </TableCell>
                      <TableCell className="min-w-[220px]">{row.email}</TableCell>
                      <TableCell className="min-w-[150px]">
                        {isEditing ? (
                          <Input
                            value={editingState.account_status}
                            onChange={event =>
                              setEditingState(prev =>
                                prev ? { ...prev, account_status: event.target.value } : prev,
                              )
                            }
                            placeholder="active"
                          />
                        ) : (
                          row.account_status || '-'
                        )}
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        {isEditing ? (
                          <Input
                            value={editingState.country}
                            onChange={event =>
                              setEditingState(prev =>
                                prev ? { ...prev, country: event.target.value } : prev,
                              )
                            }
                          />
                        ) : (
                          row.country || '-'
                        )}
                      </TableCell>
                      <TableCell className="min-w-[260px]">
                        {isEditing ? (
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                            {ROLE_OPTIONS.map(role => (
                              <label
                                key={role}
                                className="flex items-center gap-2 text-xs text-foreground"
                              >
                                <Checkbox
                                  checked={editingState.roles.includes(role)}
                                  onCheckedChange={checked => toggleRole(role, checked === true)}
                                />
                                {ROLE_LABELS[role]}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {normalizeRoleList(row.roles).map(role => (
                              <Badge
                                key={`${row.id}-${role}`}
                                variant={role === 'owner' ? 'destructive' : 'secondary'}
                              >
                                {ROLE_LABELS[role]}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(row.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(row.last_login)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={resetEdit}
                                disabled={savingId === row.id}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void saveRow(row.id)}
                                disabled={savingId === row.id}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(row)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Total users: <span className="font-medium text-foreground">{meta.total}</span>
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

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {deleteTarget
                ? `This will permanently delete "${deleteTarget.username}" from users and authentication. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void deleteUser();
              }}
              className="bg-destructive text-destructive-foreground hover:brightness-110"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

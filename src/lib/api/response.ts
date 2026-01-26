import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function okWithMeta<T, M extends Record<string, unknown>>(
  data: T,
  meta: M,
  init?: ResponseInit,
) {
  return NextResponse.json({ data, meta }, init);
}

export function okWithPagination<T>(
  data: T,
  pagination: { page: number; limit: number; total: number },
  init?: ResponseInit,
) {
  return NextResponse.json({ data, pagination }, init);
}

export function fail(
  error: { error: string; code?: string },
  status: number,
  init?: ResponseInit,
) {
  return NextResponse.json(error, { ...init, status });
}

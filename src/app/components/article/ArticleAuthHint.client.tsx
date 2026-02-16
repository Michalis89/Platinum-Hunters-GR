'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/slices/authSlice';

export default function ArticleAuthHint() {
  const user = useSelector(selectUser);
  if (user) {
    return null;
  }

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Want to leave a like or comment? You need an account.{' '}
      <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
        Log in
      </Link>{' '}
      or{' '}
      <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
        Sign up
      </Link>
      .
    </p>
  );
}
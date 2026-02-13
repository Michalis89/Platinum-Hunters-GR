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
      Θες να κάνεις like ή σχόλιο; Χρειάζεται να έχεις λογαριασμό.{' '}
      <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
        Σύνδεση
      </Link>{' '}
      ή{' '}
      <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
        Εγγραφή
      </Link>
    </p>
  );
}

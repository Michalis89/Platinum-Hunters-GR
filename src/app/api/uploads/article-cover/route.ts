import { withApiRoute } from '@/lib/observability/withApiRoute';

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import getSupabaseServer from '@/lib/supabase-server';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';

const BUCKET_NAME = 'articles';
const ALLOWED_ROLES = ['admin', 'owner', 'author', 'reviewer'] as const;

const sanitizeExtension = (fileName: string) => {
  const rawExt = fileName.split('.').pop() || 'jpg';
  const cleaned = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return cleaned || 'jpg';
};

const buildStoragePath = (extension: string) => {
  const uuid = randomUUID ? randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `articles/cover-${uuid}.${extension}`;
};

async function POSTHandler(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'Δεν βρέθηκε αρχείο.' }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userError || !user) {
      console.error('Cover upload: failed to load user role', userError);
      return NextResponse.json({ message: 'Δεν επιτρέπεται η ενέργεια.' }, { status: 403 });
    }

    const role = user.role;
    if (!role || !ALLOWED_ROLES.includes(role as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json({ message: 'Δεν έχεις δικαίωμα για αυτή τη δράση.' }, { status: 403 });
    }

    const extension = sanitizeExtension(file.name);
    const storagePath = buildStoragePath(extension);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('Cover upload failed', uploadError);
      return NextResponse.json({ message: 'Αστοχία ανέβασματος.' }, { status: 500 });
    }

    const { data: urlData } = await supabaseServer
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      console.error('Cover upload failed to get public url');
      return NextResponse.json(
        { message: 'Δεν μπορούμε να επιστρέψουμε το URL εικόνας.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Μη εξουσιοδοτημένη πρόσβαση.' }, { status: 401 });
    }
    console.error('Article cover upload error:', error);
    return NextResponse.json({ message: 'Σφάλμα ανέβασμα εικόνας.' }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);

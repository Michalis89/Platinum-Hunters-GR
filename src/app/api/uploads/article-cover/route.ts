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
  const uuid = randomUUID
    ? randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `articles/cover-${uuid}.${extension}`;
};

async function POSTHandler(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const session = await requireAuth(supabase);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'File not found.' }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (userError || !user) {
      console.error('Cover upload: failed to load user role', userError);
      return NextResponse.json({ message: 'Action is not allowed.' }, { status: 403 });
    }

    const role = user.role;
    if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json(
        { message: 'You do not have permission for this action.' },
        { status: 403 },
      );
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
      return NextResponse.json({ message: 'Upload failed.' }, { status: 500 });
    }

    const { data: urlData } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      console.error('Cover upload failed to get public url');
      return NextResponse.json({ message: 'We cannot return the image URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: 'Unauthorized access.' }, { status: 401 });
    }
    console.error('Article cover upload error:', error);
    return NextResponse.json({ message: 'Image upload error.' }, { status: 500 });
  }
}

export const POST = withApiRoute(POSTHandler);

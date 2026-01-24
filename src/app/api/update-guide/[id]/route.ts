/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';

type IncomingStep = {
  title?: string;
  description?: string;
  content_rich?: unknown;
  content_html?: string | null;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();

async function insertActivity(
  supabase: Awaited<ReturnType<typeof createRouteHandlerClient>>,
  userId: string,
  payload: Record<string, unknown>,
) {
  try {
    await (supabase.from('activity_log') as any).insert({
      user_id: userId,
      type: 'guide_created', // reuse type with action=updated to satisfy current constraint
      payload: { action: 'updated', ...payload },
    });
  } catch (err) {
    console.warn('⚠️ Activity insert (guide update) failed:', err);
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const supabase = (await createRouteHandlerClient()) as any;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Μη εξουσιοδοτημένη πρόσβαση' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userData || !['admin', 'author'].includes(userData.role as string)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    if (!(await context.params)?.id) {
      return NextResponse.json({ error: 'Missing game ID' }, { status: 400 });
    }

    const gameId = Number((await context.params).id);
    const {
      steps,
      content_rich: guideContentRich,
      content_html: guideContentHtml,
      description,
      title,
      difficulty_rating,
      estimated_hours,
      estimated_playthroughs,
      cover_image,
      background_image,
    } = await req.json();
    if (title !== undefined) {
      const titleValidation = validatePlainText(title, 'Ο τίτλος');
      if (!titleValidation.isValid) {
        return NextResponse.json({ error: titleValidation.error }, { status: 400 });
      }
    }
    if (description !== undefined) {
      const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
      if (!descriptionValidation.isValid) {
        return NextResponse.json({ error: descriptionValidation.error }, { status: 400 });
      }
    }
    if (steps && Array.isArray(steps)) {
      const stepTitles = steps.map((step: IncomingStep) => step.title ?? '').filter(Boolean);
      const stepDescriptions = steps
        .map((step: IncomingStep) => step.description ?? '')
        .filter(Boolean);
      const stepTitleValidation = validatePlainTextArray(stepTitles, 'Οι τίτλοι βημάτων');
      if (!stepTitleValidation.isValid) {
        return NextResponse.json({ error: stepTitleValidation.error }, { status: 400 });
      }
      const stepDescriptionValidation = validatePlainTextArray(
        stepDescriptions,
        'Οι περιγραφές βημάτων',
      );
      if (!stepDescriptionValidation.isValid) {
        return NextResponse.json({ error: stepDescriptionValidation.error }, { status: 400 });
      }
    }

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid steps data' }, { status: 400 });
    }

    const { data: existingGuide, error: fetchError } = await supabase
      .from('guides')
      .select('*, games (id, title, slug, cover_image, background_image)')
      .eq('game_id', gameId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Σφάλμα εύρεσης οδηγού:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingGuide) {
      return NextResponse.json({ error: 'Guide not found for this game' }, { status: 404 });
    }

    const guideId = existingGuide.id;
    const gameData = Array.isArray((existingGuide as any).games)
      ? (existingGuide as any).games[0]
      : (existingGuide as any).games;

    // Update guide-level content if provided
    const guideUpdatePayload: Record<string, unknown> = {};
    if (guideContentRich !== undefined) guideUpdatePayload.content_rich = guideContentRich;
    if (guideContentHtml !== undefined) {
      guideUpdatePayload.content_html = sanitizeHtmlContent(guideContentHtml).trim() || null;
    }
    if (description !== undefined) guideUpdatePayload.description = description;
    if (title !== undefined) guideUpdatePayload.title = title;
    if (difficulty_rating !== undefined) guideUpdatePayload.difficulty_rating = difficulty_rating;
    if (estimated_hours !== undefined) guideUpdatePayload.estimated_hours = estimated_hours;
    if (estimated_playthroughs !== undefined)
      guideUpdatePayload.estimated_playthroughs = estimated_playthroughs;

    if (Object.keys(guideUpdatePayload).length > 0) {
      const { error: guideUpdateError } = await supabase
        .from('guides')
        .update(guideUpdatePayload)
        .eq('id', guideId);

      if (guideUpdateError) {
        console.error('❌ Σφάλμα ενημέρωσης guide:', guideUpdateError);
        return NextResponse.json({ error: 'Failed to update guide content' }, { status: 500 });
      }
    }

    // Update game images if provided
    if (cover_image !== undefined || background_image !== undefined) {
      const gameUpdate: Record<string, unknown> = {};
      if (cover_image !== undefined) gameUpdate.cover_image = cover_image;
      if (background_image !== undefined) gameUpdate.background_image = background_image;

      if (Object.keys(gameUpdate).length > 0) {
        const { error: gameUpdateError } = await supabase
          .from('games')
          .update(gameUpdate)
          .eq('id', gameId);

        if (gameUpdateError) {
          console.error('❌ Σφάλμα ενημέρωσης εικόνας παιχνιδιού:', gameUpdateError);
        }
      }
    }

    // Delete existing guide_steps
    const { error: deleteError } = await supabase
      .from('guide_steps')
      .delete()
      .eq('guide_id', guideId);

    if (deleteError) {
      console.error('❌ Σφάλμα διαγραφής παλιών steps:', deleteError);
      return NextResponse.json({ error: 'Failed to delete old steps' }, { status: 500 });
    }

    // Insert new guide_steps
    const newSteps = steps.map((step: IncomingStep, index: number) => {
      const sanitizedStepHtml = sanitizeHtmlContent(step.content_html).trim() || null;
      return {
        guide_id: guideId,
        step_number: index + 1,
        title: (step.title ?? `Βήμα ${index + 1}`).toString(),
        description: step.description ?? (sanitizedStepHtml ? stripHtml(sanitizedStepHtml) : ''),
        content_rich: step.content_rich ?? null,
        content_html: sanitizedStepHtml,
      };
    });

    const { error: insertError } = await supabase.from('guide_steps').insert(newSteps);

    if (insertError) {
      console.error('❌ Σφάλμα εισαγωγής νέων steps:', insertError);
      console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to insert new steps',
          details: insertError.message,
          code: insertError.code,
        },
        { status: 500 },
      );
    }

    // Activity log: guide updated
    const profile = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    await insertActivity(supabase, session.user.id, {
      guideId,
      gameId,
      gameTitle: (gameData as { title?: string })?.title ?? undefined,
      gameSlug: (gameData as { slug?: string })?.slug ?? undefined,
      username: profile.data?.username,
      display_name: profile.data?.display_name,
      avatar_url: profile.data?.avatar_url,
    });

    return NextResponse.json({ message: '✅ Ο οδηγός ενημερώθηκε επιτυχώς!' });
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

type IncomingStep = {
  title?: string;
  description?: string;
  content_rich?: unknown;
  content_html?: string | null;
};

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '').trim();

export async function PUT(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
) {
  try {
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
  } = await req.json();

    if (!steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid steps data' }, { status: 400 });
    }

    const { data: existingGuide, error: fetchError } = await supabase
      .from('guides')
      .select('*')
      .eq('game_id', gameId)
      .maybeSingle();

    console.log('🔎 Supabase query result:', existingGuide, 'Error:', fetchError);

    if (fetchError) {
      console.error('❌ Σφάλμα εύρεσης οδηγού:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingGuide) {
      return NextResponse.json({ error: 'Guide not found for this game' }, { status: 404 });
    }

  const guideId = existingGuide.id;

  // Update guide-level content if provided
  const guideUpdatePayload: Record<string, unknown> = {};
  if (guideContentRich !== undefined) guideUpdatePayload.content_rich = guideContentRich;
  if (guideContentHtml !== undefined) guideUpdatePayload.content_html = guideContentHtml;
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
    const newSteps = steps.map((step: IncomingStep, index: number) => ({
      guide_id: guideId,
      step_number: index + 1,
      title: (step.title ?? `Βήμα ${index + 1}`).toString(),
      description: step.description ?? (step.content_html ? stripHtml(step.content_html) : ''),
      content_rich: step.content_rich ?? null,
      content_html: step.content_html ?? null,
    }));

    console.log('📝 Attempting to insert steps:', JSON.stringify(newSteps, null, 2));

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

    return NextResponse.json({ message: '✅ Ο οδηγός ενημερώθηκε επιτυχώς!' });
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

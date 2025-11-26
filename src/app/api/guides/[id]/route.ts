import { NextResponse } from 'next/server';
import supabase from '@/lib/db';

interface GuideStep {
  step_number: number;
  title: string;
  description: string;
  trophies?: unknown[];
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Λάθος ID οδηγού' }, { status: 400 });
    }

    const { data: guides, error } = await supabase
      .from('guides')
      .select(
        `
        *,
        guide_steps (*),
        games!inner(slug, title)
      `,
      )
      .eq('game_id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 },
      );
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    // Transform guide_steps array to steps array with proper structure
    const transformedGuides = guides.map(guide => ({
      ...guide,
      steps: (guide.guide_steps || [])
        .sort((a: GuideStep, b: GuideStep) => a.step_number - b.step_number)
        .map((step: GuideStep) => ({
          title: step.title,
          description: step.description,
          trophies: step.trophies || [],
        })),
      guide_steps: undefined, // Remove the nested guide_steps property
    }));

    return NextResponse.json(transformedGuides);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import supabase from '@/lib/db';
import { API_ERRORS } from '@/lib/api/errors';
import { fail, ok } from '@/lib/api/response';

interface GuideStep {
  step_number: number;
  title: string;
  description: string;
  content_rich?: unknown;
  content_html?: string | null;
  trophies?: unknown[];
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const idParam = params.id;
    const id = Number.parseInt(idParam, 10);

    if (!idParam || Number.isNaN(id)) {
      return fail({ error: 'Λάθος ID οδηγού' }, 400);
    }

    const { data: guides, error } = await supabase
      .from('guides')
      .select(
        `
        *,
        guide_steps (*),
        games!inner(slug, title, cover_image, background_image)
      `,
      )
      .eq('game_id', id);

    if (error) {
      console.error('Database error:', error);
      return fail({ error: 'Σφάλμα βάσης δεδομένων' }, 500);
    }

    if (!guides || guides.length === 0) {
      return fail({ error: 'Ο οδηγός δεν βρέθηκε' }, 404);
    }

    // Transform guide_steps array to steps array with proper structure
    const transformedGuides = guides.map(guide => ({
      ...guide,
      steps: (guide.guide_steps || [])
        .sort((a: GuideStep, b: GuideStep) => a.step_number - b.step_number)
        .map((step: GuideStep) => ({
          title: step.title,
          description: step.description,
          content_rich: step.content_rich ?? null,
          content_html: step.content_html ?? null,
          trophies: step.trophies || [],
        })),
      guide_steps: undefined, // Remove the nested guide_steps property
    }));

    return ok(transformedGuides);
  } catch (error) {
    console.error('❌ Σφάλμα διακομιστή:', error);
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

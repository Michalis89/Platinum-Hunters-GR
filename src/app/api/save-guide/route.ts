import { createRouteHandlerClient } from '@/lib/supabase-route-handler';
import { sanitizeHtmlContent } from '@/utils/security/sanitizeHtml';
import { validatePlainText, validatePlainTextArray } from '@/utils/validation/text';
import { insertActivity } from '@/lib/services/activityService';
import { API_ERRORS } from '@/lib/api/errors';
import { requireAuth, UnauthorizedError } from '@/lib/api/auth';
import { fail, ok } from '@/lib/api/response';

interface ScrapedStep {
  title: string;
  description: string;
  trophies?: unknown[];
  content_rich?: unknown;
  content_html?: string | null;
}

export async function POST(req: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createRouteHandlerClient()) as any;

    const session = await requireAuth(supabase);

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userData || !['admin', 'author'].includes(userData.role as string)) {
      return fail({ error: 'Απαγορεύεται η πρόσβαση' }, 403);
    }

    const {
      title,
      platform,
      gameImage,
      release_year,
      rating,
      metacritic,
      trophies,
      difficulty,
      hours,
      playthroughs,
      steps,
      content_rich: guideContentRich,
      content_html: guideContentHtml,
      description,
      background_image,
    } = await req.json();
    const titleValidation = validatePlainText(title, 'Ο τίτλος');
    if (!titleValidation.isValid) {
      return fail({ error: titleValidation.error || 'Μη έγκυρος τίτλος' }, 400);
    }
    const descriptionValidation = validatePlainText(description, 'Η περιγραφή');
    if (!descriptionValidation.isValid) {
      return fail({ error: descriptionValidation.error || 'Μη έγκυρη περιγραφή' }, 400);
    }
    if (steps && Array.isArray(steps)) {
      const stepTitles = steps.map((step: ScrapedStep) => step.title).filter(Boolean);
      const stepDescriptions = steps.map((step: ScrapedStep) => step.description).filter(Boolean);
      const stepTitleValidation = validatePlainTextArray(stepTitles, 'Οι τίτλοι βημάτων');
      if (!stepTitleValidation.isValid) {
        return fail({ error: stepTitleValidation.error || 'Μη έγκυροι τίτλοι βημάτων' }, 400);
      }
      const stepDescriptionValidation = validatePlainTextArray(
        stepDescriptions,
        'Οι περιγραφές βημάτων',
      );
      if (!stepDescriptionValidation.isValid) {
        return fail(
          { error: stepDescriptionValidation.error || 'Μη έγκυρες περιγραφές βημάτων' },
          400,
        );
      }
    }
    const sanitizedGuideContentHtml = sanitizeHtmlContent(guideContentHtml).trim() || null;

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-+)|(-+$)/g, '');

    // Check if game already exists by title
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (existingGame) {
      return fail(
        {
          error: `⚠️ Ο οδηγός "${existingGame.title}" υπάρχει ήδη στη βάση!`,
          code: 'CONFLICT',
        },
        409,
      );
    }

    // Insert game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([
        {
          title,
          slug,
          cover_image: gameImage,
          background_image: background_image ?? gameImage,
          trophy_platinum: parseInt(trophies?.Platinum) || 0,
          trophy_gold: parseInt(trophies?.Gold) || 0,
          trophy_silver: parseInt(trophies?.Silver) || 0,
          trophy_bronze: parseInt(trophies?.Bronze) || 0,
          release_year: release_year ?? null,
          rating: rating ?? null,
          metacritic_score: metacritic ?? null,
        },
      ])
      .select('*')
      .single();

    if (gameError) {
      console.error('❌ Σφάλμα αποθήκευσης παιχνιδιού:', gameError);
      return fail({ error: 'Σφάλμα αποθήκευσης παιχνιδιού' }, 500);
    }

    // Handle platform - find or create platform and link it
    if (platform) {
      const { data: platformData } = await supabase
        .from('platforms')
        .select('id')
        .eq('short_name', platform)
        .maybeSingle();

      let platformId = platformData?.id;

      if (!platformId) {
        const { data: newPlatform } = await supabase
          .from('platforms')
          .insert({ name: platform, short_name: platform })
          .select('id')
          .single();
        platformId = newPlatform?.id;
      }

      if (platformId) {
        await supabase.from('game_platforms').insert({ game_id: game.id, platform_id: platformId });
      }
    }

    // Parse difficulty to rating (1-10 scale)
    const difficultyRating = Number.parseFloat(difficulty) || null;
    const estimatedHours = Number.parseFloat(hours) || null;
    const estimatedPlaythroughs = Number.parseInt(playthroughs) || 1;

    // Insert guide
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert([
        {
          game_id: game.id,
          title: `${title} Trophy Guide`,
          description: description ?? null,
          difficulty_rating: difficultyRating,
          estimated_hours: estimatedHours,
          estimated_playthroughs: estimatedPlaythroughs,
          status: 'published',
          content_rich: guideContentRich ?? null,
          content_html: sanitizedGuideContentHtml,
        },
      ])
      .select('*')
      .single();

    if (guideError) {
      console.error('❌ Σφάλμα αποθήκευσης guide:', guideError);
      return fail({ error: 'Σφάλμα αποθήκευσης οδηγού' }, 500);
    }

    // Insert guide steps
    if (steps && Array.isArray(steps) && steps.length > 0) {
      const guideSteps = steps.map((step: ScrapedStep, index: number) => ({
        guide_id: guide.id,
        step_number: index + 1,
        title: step.title,
        description: step.description,
        content_rich: step.content_rich ?? null,
        content_html: sanitizeHtmlContent(step.content_html).trim() || null,
      }));

      const { error: stepsError } = await supabase.from('guide_steps').insert(guideSteps);

      if (stepsError) {
        console.error('❌ Σφάλμα αποθήκευσης steps:', stepsError);
      } else {
        console.log(`✅ Αποθηκεύτηκαν ${steps.length} steps`);
      }
    }

    // Activity log for guide_created
    const profile = await supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();

    await insertActivity(supabase, session.user.id, 'guide_created', {
      guideId: guide.id,
      guideTitle: guide.title,
      gameId: game.id,
      gameTitle: game.title,
      gameSlug: game.slug,
      username: profile.data?.username,
      display_name: profile.data?.display_name,
      avatar_url: profile.data?.avatar_url,
    });

    return ok({
      message: '✅ Ο οδηγός αποθηκεύτηκε!',
      game,
      guide,
    });
  } catch (error) {
    console.error('❌ Σφάλμα αποθήκευσης:', error);
    if (error instanceof UnauthorizedError) {
      return fail(API_ERRORS.UNAUTHORIZED, API_ERRORS.UNAUTHORIZED.status);
    }
    return fail(API_ERRORS.INTERNAL, API_ERRORS.INTERNAL.status);
  }
}

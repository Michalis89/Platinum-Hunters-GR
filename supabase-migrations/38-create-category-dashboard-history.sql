-- =====================================================
-- CATEGORY DASHBOARD HISTORY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.category_dashboard_history(
  p_user_id UUID,
  p_category TEXT,
  p_since TIMESTAMPTZ
)
RETURNS TABLE(
  day DATE,
  completed INTEGER,
  dropped INTEGER
)
LANGUAGE SQL STABLE AS $$
  SELECT
    date_trunc('day', ume.updated_at)::date AS day,
    COUNT(*) FILTER (WHERE ume.status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE ume.status = 'dropped') AS dropped
  FROM public.user_media_entries ume
  JOIN public.media_items mi ON mi.id = ume.media_id
  WHERE ume.user_id = p_user_id
    AND LOWER(mi.category) = LOWER(p_category)
    AND ume.updated_at >= p_since
  GROUP BY day
  ORDER BY day ASC;
$$;

COMMENT ON FUNCTION public.category_dashboard_history IS 'Aggregates completions and drops per category to power the dashboard area chart.';


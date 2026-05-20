ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_games_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_ai_game_date date;

CREATE OR REPLACE FUNCTION public.consume_ai_game(p_limit integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_pro_user boolean;
  today date := (now() at time zone 'utc')::date;
  last_date date;
  cnt integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'reason', 'unauthenticated');
  END IF;

  SELECT is_pro, last_ai_game_date, ai_games_today
    INTO is_pro_user, last_date, cnt
    FROM profiles WHERE id = auth.uid();

  IF is_pro_user THEN
    UPDATE profiles SET ai_games_today = CASE WHEN last_ai_game_date = today THEN ai_games_today + 1 ELSE 1 END,
                        last_ai_game_date = today
      WHERE id = auth.uid();
    RETURN jsonb_build_object('allowed', true, 'remaining', 9999, 'pro', true);
  END IF;

  IF last_date IS DISTINCT FROM today THEN
    cnt := 0;
  END IF;

  IF cnt >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'pro', false, 'reason', 'daily_limit');
  END IF;

  UPDATE profiles
    SET ai_games_today = cnt + 1,
        last_ai_game_date = today
    WHERE id = auth.uid();

  RETURN jsonb_build_object('allowed', true, 'remaining', p_limit - (cnt + 1), 'pro', false);
END;
$$;
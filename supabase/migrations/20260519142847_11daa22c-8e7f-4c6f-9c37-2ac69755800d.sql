
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date date,
  ADD COLUMN IF NOT EXISTS lessons_completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS board_theme text NOT NULL DEFAULT 'wall_street',
  ADD COLUMN IF NOT EXISTS piece_skin text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS unlocked_skins jsonb NOT NULL DEFAULT '["classic"]'::jsonb,
  ADD COLUMN IF NOT EXISTS wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS losses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS draws integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_win_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cb_earned integer NOT NULL DEFAULT 0;

-- Extend games
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS bet integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS winner_id uuid,
  ADD COLUMN IF NOT EXISTS time_white_ms integer,
  ADD COLUMN IF NOT EXISTS time_black_ms integer;

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  user_id uuid NOT NULL,
  username text,
  message text NOT NULL CHECK (length(message) <= 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_game ON public.chat_messages(game_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat readable by all" ON public.chat_messages;
CREATE POLICY "chat readable by all" ON public.chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "chat insert by self" ON public.chat_messages;
CREATE POLICY "chat insert by self" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Matchmaking queue
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  elo integer NOT NULL,
  time_control text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "queue readable" ON public.matchmaking_queue;
CREATE POLICY "queue readable" ON public.matchmaking_queue FOR SELECT USING (true);
DROP POLICY IF EXISTS "queue insert self" ON public.matchmaking_queue;
CREATE POLICY "queue insert self" ON public.matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "queue delete self" ON public.matchmaking_queue;
CREATE POLICY "queue delete self" ON public.matchmaking_queue FOR DELETE USING (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ach readable" ON public.achievements;
CREATE POLICY "ach readable" ON public.achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "ach insert self" ON public.achievements;
CREATE POLICY "ach insert self" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Atomic bet RPC
CREATE OR REPLACE FUNCTION public.place_bet(p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF p_amount <= 0 THEN RETURN true; END IF;
  SELECT corporate_budget INTO bal FROM profiles WHERE id = auth.uid();
  IF bal IS NULL OR bal < p_amount THEN RETURN false; END IF;
  UPDATE profiles SET corporate_budget = corporate_budget - p_amount WHERE id = auth.uid();
  RETURN true;
END;
$$;

-- Settle game result (called from client; uses auth.uid() to scope updates)
CREATE OR REPLACE FUNCTION public.settle_game(
  p_result text, p_bet integer, p_elo_delta integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout integer := 0;
  new_streak integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF p_result = 'win' THEN
    payout := p_bet * 2;
    UPDATE profiles SET
      corporate_budget = corporate_budget + payout,
      wins = wins + 1,
      current_win_streak = current_win_streak + 1,
      best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
      cb_earned = cb_earned + p_bet,
      elo_rating = GREATEST(100, elo_rating + p_elo_delta),
      xp = xp + 50
    WHERE id = auth.uid();
  ELSIF p_result = 'loss' THEN
    UPDATE profiles SET
      losses = losses + 1,
      current_win_streak = 0,
      elo_rating = GREATEST(100, elo_rating + p_elo_delta),
      xp = xp + 10
    WHERE id = auth.uid();
  ELSE
    payout := p_bet;
    UPDATE profiles SET
      corporate_budget = corporate_budget + payout,
      draws = draws + 1,
      elo_rating = GREATEST(100, elo_rating + p_elo_delta),
      xp = xp + 20
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Avatar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

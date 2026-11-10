
-- Enum for skill tracks
DO $$ BEGIN
  CREATE TYPE public.skill_track AS ENUM ('addition', 'subtraction', 'multiplication', 'division', 'percentage');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Placement test results
CREATE TABLE public.placement_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  per_skill jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_results TO authenticated;
GRANT ALL ON public.placement_results TO service_role;
ALTER TABLE public.placement_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own placement" ON public.placement_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own placement" ON public.placement_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX placement_results_user_idx ON public.placement_results(user_id, created_at DESC);

-- Track progress (one row per user per track)
CREATE TABLE public.track_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track public.skill_track NOT NULL,
  current_level integer NOT NULL DEFAULT 1,
  highest_level_passed integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, track)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.track_progress TO authenticated;
GRANT ALL ON public.track_progress TO service_role;
ALTER TABLE public.track_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own track progress" ON public.track_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own track progress" ON public.track_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own track progress" ON public.track_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER track_progress_set_updated_at BEFORE UPDATE ON public.track_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Lesson attempts
CREATE TABLE public.lesson_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track public.skill_track NOT NULL,
  level integer NOT NULL,
  correct integer NOT NULL,
  total integer NOT NULL,
  passed boolean NOT NULL,
  duration_ms integer NOT NULL,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_attempts TO authenticated;
GRANT ALL ON public.lesson_attempts TO service_role;
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own lesson attempts" ON public.lesson_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lesson attempts" ON public.lesson_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX lesson_attempts_user_created_idx ON public.lesson_attempts(user_id, created_at DESC);

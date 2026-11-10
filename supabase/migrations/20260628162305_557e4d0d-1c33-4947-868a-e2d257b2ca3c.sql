
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.advanced_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question_id text not null,
  selected_index integer not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.advanced_attempts TO authenticated;
GRANT ALL ON public.advanced_attempts TO service_role;
ALTER TABLE public.advanced_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own advanced attempts" ON public.advanced_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own advanced attempts" ON public.advanced_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_advanced_attempts_user_day ON public.advanced_attempts (user_id, created_at DESC);

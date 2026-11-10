-- Feedback and feature requests from inside the app.
-- Users can send messages but can't read anyone's (including their own) back;
-- read them in the Supabase dashboard: Table Editor > feedback.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  kind text not null check (kind in ('feature', 'problem', 'idea', 'other')),
  message text not null check (length(message) between 1 and 2000),
  app_version text,
  platform text,
  created_at timestamptz not null default now()
);
create index feedback_created_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;

create function public.submit_feedback(p_kind text, p_message text, p_app_version text, p_platform text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  sent_today integer;
  msg text := btrim(coalesce(p_message, ''));
begin
  if p_kind not in ('feature', 'problem', 'idea', 'other') then
    raise exception 'Unknown feedback type';
  end if;
  if length(msg) = 0 or length(msg) > 2000 then
    raise exception 'Please write between 1 and 2,000 characters';
  end if;
  select count(*) into sent_today from public.feedback
   where user_id = uid and created_at >= public._utc_day_start();
  if sent_today >= 10 then
    raise exception 'Thanks! You''ve sent a lot today. Please try again tomorrow.';
  end if;

  insert into public.feedback (user_id, email, kind, message, app_version, platform)
  values (
    uid,
    (select email from public.profiles where id = uid),
    p_kind,
    msg,
    left(coalesce(p_app_version, ''), 20),
    left(coalesce(p_platform, ''), 20)
  );
end;
$$;

revoke all on function public.submit_feedback(text, text, text, text) from public, anon;
grant execute on function public.submit_feedback(text, text, text, text) to authenticated;

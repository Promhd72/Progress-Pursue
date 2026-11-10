-- Rapid Math: complete schema for a fresh Supabase project.
--
-- Security model: the app talks to Supabase directly with the public key, so
-- users can READ their own rows but cannot write scores, XP, streaks, levels or
-- Pro status themselves. All of that goes through the SECURITY DEFINER
-- functions at the bottom, which enforce the same rules the old server did
-- (daily limits, Pro-only levels, level progression, XP maths).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  onboarding_completed boolean not null default false,
  is_pro boolean not null default false,
  pro_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.placement_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null,
  total integer not null,
  per_skill jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index placement_results_user_idx on public.placement_results (user_id);

create table public.track_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null check (track in ('addition', 'subtraction', 'multiplication', 'division', 'percentage')),
  current_level integer not null default 1 check (current_level between 1 and 10),
  highest_level_passed integer not null default 0 check (highest_level_passed between 0 and 10),
  updated_at timestamptz not null default now(),
  unique (user_id, track)
);

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  track text not null,
  level integer not null,
  correct integer not null,
  total integer not null,
  passed boolean not null,
  duration_ms integer not null,
  xp_earned integer not null,
  created_at timestamptz not null default now()
);
create index lesson_attempts_user_created_idx on public.lesson_attempts (user_id, created_at desc);

create table public.advanced_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  selected_index integer not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index advanced_attempts_user_created_idx on public.advanced_attempts (user_id, created_at desc);

-- Legacy quick-drill sessions (kept so history/accuracy views keep working).
create table public.drill_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  difficulty text not null,
  total_questions integer not null,
  correct integer not null,
  duration_ms integer not null,
  avg_ms_per_question integer not null,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  grants_pro boolean not null default true,
  active boolean not null default true,
  expires_at timestamptz,
  max_redemptions integer,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coupon_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Row level security: users read their own rows; no direct writes
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.placement_results enable row level security;
alter table public.track_progress enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.advanced_attempts enable row level security;
alter table public.drill_sessions enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

revoke all on public.profiles, public.placement_results, public.track_progress,
  public.lesson_attempts, public.advanced_attempts, public.drill_sessions,
  public.coupons, public.coupon_redemptions from anon, authenticated;

grant select on public.profiles, public.placement_results, public.track_progress,
  public.lesson_attempts, public.advanced_attempts, public.drill_sessions to authenticated;

-- The only columns a user may change directly.
grant update (name, onboarding_completed) on public.profiles to authenticated;

create policy "own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own placement" on public.placement_results for select to authenticated using (auth.uid() = user_id);
create policy "own progress" on public.track_progress for select to authenticated using (auth.uid() = user_id);
create policy "own lessons" on public.lesson_attempts for select to authenticated using (auth.uid() = user_id);
create policy "own advanced" on public.advanced_attempts for select to authenticated using (auth.uid() = user_id);
create policy "own drills" on public.drill_sessions for select to authenticated using (auth.uid() = user_id);
-- coupons / coupon_redemptions: no policies, so only the functions below can touch them.

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger track_progress_set_updated_at before update on public.track_progress
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public._require_user() returns uuid
language plpgsql stable set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  return uid;
end;
$$;

create function public._utc_day_start() returns timestamptz
language sql stable as $$
  select date_trunc('day', now(), 'UTC');
$$;

-- Streak: same day keeps it, next day extends it, a gap resets to 1.
create function public._touch_streak(uid uuid, add_xp integer) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.profiles%rowtype;
  today date := (now() at time zone 'UTC')::date;
  cur integer;
begin
  select * into p from public.profiles where id = uid for update;
  if not found then
    insert into public.profiles (id) values (uid) returning * into p;
  end if;

  if p.last_active_date is null then
    cur := 1;
  elsif today - p.last_active_date = 0 then
    cur := greatest(p.current_streak, 1);
  elsif today - p.last_active_date = 1 then
    cur := p.current_streak + 1;
  else
    cur := 1;
  end if;

  update public.profiles
     set xp = xp + add_xp,
         current_streak = cur,
         longest_streak = greatest(longest_streak, cur),
         last_active_date = today
   where id = uid;
end;
$$;

revoke all on function public._require_user() from public, anon, authenticated;
revoke all on function public._utc_day_start() from public, anon, authenticated;
revoke all on function public._touch_streak(uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- App API (called with supabase.rpc)
-- ---------------------------------------------------------------------------

-- Records a finished lesson; returns { passed, xpEarned, newCurrentLevel, newHighestPassed }.
create function public.submit_lesson(
  p_track text, p_level integer, p_correct integer, p_total integer, p_duration_ms integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  pro boolean;
  used_today integer;
  cur_level integer;
  highest integer;
  did_pass boolean;
  xp integer;
  new_current integer;
  new_highest integer;
begin
  if p_track not in ('addition', 'subtraction', 'multiplication', 'division', 'percentage') then
    raise exception 'Unknown track';
  end if;
  if p_level not between 1 and 10 or p_total not between 1 and 50
     or p_correct not between 0 and p_total or p_duration_ms not between 0 and 3600000 then
    raise exception 'Invalid lesson result';
  end if;

  select is_pro into pro from public.profiles where id = uid;
  pro := coalesce(pro, false);

  select count(*) into used_today from public.lesson_attempts
   where user_id = uid and created_at >= public._utc_day_start();
  if not pro and used_today >= 3 then
    raise exception 'Daily lesson limit reached';
  end if;
  if not pro and p_level > 2 then
    raise exception 'This level is Pro-only';
  end if;

  select current_level, highest_level_passed into cur_level, highest
    from public.track_progress where user_id = uid and track = p_track;
  cur_level := coalesce(cur_level, 1);
  highest := coalesce(highest, 0);
  if p_level > cur_level then
    raise exception 'Finish earlier levels first';
  end if;

  did_pass := p_correct::numeric / p_total >= 0.8;
  xp := p_correct * greatest(1, ceil(p_level / 2.0)::integer);
  new_highest := case when did_pass and p_level > highest then p_level else highest end;
  new_current := case when did_pass and p_level = cur_level and cur_level < 10 then cur_level + 1 else cur_level end;

  insert into public.lesson_attempts (user_id, track, level, correct, total, passed, duration_ms, xp_earned)
  values (uid, p_track, p_level, p_correct, p_total, did_pass, p_duration_ms, xp);

  insert into public.track_progress (user_id, track, current_level, highest_level_passed)
  values (uid, p_track, new_current, new_highest)
  on conflict (user_id, track) do update
    set current_level = excluded.current_level, highest_level_passed = excluded.highest_level_passed;

  perform public._touch_streak(uid, xp);

  return jsonb_build_object(
    'passed', did_pass, 'xpEarned', xp,
    'newCurrentLevel', new_current, 'newHighestPassed', new_highest
  );
end;
$$;

-- Saves a placement test; p_per_skill = { track: { score, max } }. Returns { startingLevels }.
create function public.submit_placement(p_per_skill jsonb, p_total_correct integer, p_total integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  t text;
  score numeric;
  max_score numeric;
  ratio numeric;
  lvl integer;
  levels jsonb := '{}'::jsonb;
begin
  if p_total not between 1 and 50 or p_total_correct not between 0 and p_total then
    raise exception 'Invalid placement result';
  end if;

  foreach t in array array['addition', 'subtraction', 'multiplication', 'division', 'percentage'] loop
    score := coalesce((p_per_skill -> t ->> 'score')::numeric, 0);
    max_score := coalesce((p_per_skill -> t ->> 'max')::numeric, 0);
    if max_score <= 0 then
      lvl := 1;
    else
      ratio := least(greatest(score / max_score, 0), 1);
      lvl := case when ratio >= 1 then 5 when ratio >= 0.75 then 4 when ratio >= 0.5 then 3
                  when ratio >= 0.25 then 2 else 1 end;
    end if;
    levels := levels || jsonb_build_object(t, lvl);

    insert into public.track_progress (user_id, track, current_level)
    values (uid, t, lvl)
    on conflict (user_id, track) do update
      set current_level = greatest(public.track_progress.current_level, excluded.current_level);
  end loop;

  insert into public.placement_results (user_id, score, total, per_skill)
  values (uid, p_total_correct, p_total, p_per_skill);

  return jsonb_build_object('startingLevels', levels);
end;
$$;

-- Records an Advanced scenario answer; returns { remainingToday, isPro }.
create function public.submit_advanced_attempt(p_question_id text, p_selected_index integer, p_is_correct boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  pro boolean;
  used_today integer;
begin
  if length(coalesce(p_question_id, '')) not between 1 and 100 or p_selected_index not between 0 and 10 then
    raise exception 'Invalid answer';
  end if;

  select is_pro into pro from public.profiles where id = uid;
  pro := coalesce(pro, false);

  select count(*) into used_today from public.advanced_attempts
   where user_id = uid and created_at >= public._utc_day_start();
  if not pro and used_today >= 3 then
    raise exception 'Daily Advanced limit reached';
  end if;

  insert into public.advanced_attempts (user_id, question_id, selected_index, is_correct)
  values (uid, p_question_id, p_selected_index, p_is_correct);

  if p_is_correct then
    update public.profiles set xp = xp + 8 where id = uid;
  end if;

  return jsonb_build_object(
    'isPro', pro,
    'remainingToday', case when pro then null else greatest(0, 3 - (used_today + 1)) end
  );
end;
$$;

-- Redeems a Pro coupon; returns { ok, message }.
create function public.redeem_coupon(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  normalized text := lower(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  c public.coupons%rowtype;
  used integer;
begin
  select * into c from public.coupons where code = normalized;
  if not found or not c.active then
    return jsonb_build_object('ok', false, 'message', 'Invalid coupon code.');
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return jsonb_build_object('ok', false, 'message', 'This coupon has expired.');
  end if;
  if exists (select 1 from public.coupon_redemptions where coupon_id = c.id and user_id = uid) then
    return jsonb_build_object('ok', false, 'message', 'You''ve already used this code.');
  end if;
  if c.max_redemptions is not null then
    select count(*) into used from public.coupon_redemptions where coupon_id = c.id;
    if used >= c.max_redemptions then
      return jsonb_build_object('ok', false, 'message', 'This coupon has reached its limit.');
    end if;
  end if;

  insert into public.coupon_redemptions (coupon_id, user_id) values (c.id, uid);
  if c.grants_pro then
    update public.profiles set is_pro = true, pro_source = 'coupon' where id = uid;
  end if;
  return jsonb_build_object('ok', true, 'message', 'Pro unlocked. Enjoy unlimited drills!');
end;
$$;

-- Permanently deletes the caller's account and all their data (App Store 5.1.1(v)).
create function public.delete_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := public._require_user();
begin
  delete from auth.users where id = uid; -- every table cascades from auth.users
end;
$$;

revoke all on function public.submit_lesson(text, integer, integer, integer, integer) from public, anon;
revoke all on function public.submit_placement(jsonb, integer, integer) from public, anon;
revoke all on function public.submit_advanced_attempt(text, integer, boolean) from public, anon;
revoke all on function public.redeem_coupon(text) from public, anon;
revoke all on function public.delete_account() from public, anon;

grant execute on function public.submit_lesson(text, integer, integer, integer, integer) to authenticated;
grant execute on function public.submit_placement(jsonb, integer, integer) to authenticated;
grant execute on function public.submit_advanced_attempt(text, integer, boolean) to authenticated;
grant execute on function public.redeem_coupon(text) to authenticated;
grant execute on function public.delete_account() to authenticated;

-- To create a coupon (run in the Supabase SQL editor):
--   insert into public.coupons (code, description) values ('launchpro', 'Launch Pro code');

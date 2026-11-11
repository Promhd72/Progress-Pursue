-- Rapid Math: Pro subscriptions (App Store, via RevenueCat) and a bigger free tier.
--
-- 1. Free users can now play Levels 1 to 4 (was 1 to 2).
-- 2. Pro bought in the app is written only by set_store_pro(), which only the
--    service role can call. The `revenuecat` Edge Function calls it after asking
--    RevenueCat whether the user's subscription is active, so the app can never
--    grant itself Pro.

alter table public.profiles add column if not exists pro_expires_at timestamptz;

-- Same as before, with the free level cap raised from 2 to 4.
create or replace function public.submit_lesson(
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
  if not pro and p_level > 4 then
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

-- Sets Pro from the App Store subscription state. Server-only (service role).
-- Turning Pro off only affects store-granted Pro, so a manual grant stays.
create or replace function public.set_store_pro(p_user uuid, p_active boolean, p_expires timestamptz)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_active then
    update public.profiles
       set is_pro = true, pro_source = 'store', pro_expires_at = p_expires
     where id = p_user;
  else
    update public.profiles
       set is_pro = false, pro_expires_at = p_expires
     where id = p_user and pro_source = 'store';
  end if;
end;
$$;

revoke all on function public.set_store_pro(uuid, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.set_store_pro(uuid, boolean, timestamptz) to service_role;

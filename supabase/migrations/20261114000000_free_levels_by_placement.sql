-- Rapid Math: free levels now depend on the placement test, per skill.
--
--   No placement, or placed at Level 1 or 2  -> Levels 1-2 free
--   Placed at Level 3                        -> Levels 1-3 free
--   Placed at Level 4 or higher              -> Levels 1-4 free
--
-- Passing levels does not raise the free cap; only placement does. Retaking
-- the placement test never lowers it. Pro unlocks every level, as before.

alter table public.track_progress
  add column if not exists placement_level integer check (placement_level between 1 and 10);

-- Placement score -> starting level (same rule as the app's placementToLevel).
create or replace function public._placement_level(p_score numeric, p_max numeric)
returns integer language sql immutable as $$
  select case
    when coalesce(p_max, 0) <= 0 then 1
    when p_score / p_max >= 1 then 5
    when p_score / p_max >= 0.75 then 4
    when p_score / p_max >= 0.5 then 3
    when p_score / p_max >= 0.25 then 2
    else 1
  end;
$$;

-- Highest free level for a user on one skill.
create or replace function public._free_max_level(p_user uuid, p_track text)
returns integer language sql stable set search_path = public as $$
  select greatest(2, least(4, coalesce(
    (select placement_level from public.track_progress where user_id = p_user and track = p_track), 2)));
$$;

revoke all on function public._placement_level(numeric, numeric) from public, anon, authenticated;
revoke all on function public._free_max_level(uuid, text) from public, anon, authenticated;

-- Backfill placement_level for anyone who already took the test (best result per skill).
update public.track_progress tp
   set placement_level = best.lvl
  from (
    select pr.user_id, s.track,
           max(public._placement_level((pr.per_skill -> s.track ->> 'score')::numeric,
                                       (pr.per_skill -> s.track ->> 'max')::numeric)) as lvl
      from public.placement_results pr
     cross join (values ('addition'), ('subtraction'), ('multiplication'), ('division'), ('percentage')) as s(track)
     group by pr.user_id, s.track
  ) best
 where tp.user_id = best.user_id and tp.track = best.track;

-- Placement: also remember the placed level per skill (never lowered by a retake).
create or replace function public.submit_placement(p_per_skill jsonb, p_total_correct integer, p_total integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public._require_user();
  t text;
  lvl integer;
  levels jsonb := '{}'::jsonb;
begin
  if p_total not between 1 and 50 or p_total_correct not between 0 and p_total then
    raise exception 'Invalid placement result';
  end if;

  foreach t in array array['addition', 'subtraction', 'multiplication', 'division', 'percentage'] loop
    lvl := public._placement_level(
      least(greatest(coalesce((p_per_skill -> t ->> 'score')::numeric, 0), 0),
            coalesce((p_per_skill -> t ->> 'max')::numeric, 0)),
      coalesce((p_per_skill -> t ->> 'max')::numeric, 0));
    levels := levels || jsonb_build_object(t, lvl);

    insert into public.track_progress (user_id, track, current_level, placement_level)
    values (uid, t, lvl, lvl)
    on conflict (user_id, track) do update
      set current_level = greatest(public.track_progress.current_level, excluded.current_level),
          placement_level = greatest(coalesce(public.track_progress.placement_level, 0), excluded.placement_level);
  end loop;

  insert into public.placement_results (user_id, score, total, per_skill)
  values (uid, p_total_correct, p_total, p_per_skill);

  return jsonb_build_object('startingLevels', levels);
end;
$$;

-- Lessons: the free cap is now per skill (see _free_max_level).
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
  if not pro and p_level > public._free_max_level(uid, p_track) then
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

revoke all on function public.submit_placement(jsonb, integer, integer) from public, anon;
revoke all on function public.submit_lesson(text, integer, integer, integer, integer) from public, anon;
grant execute on function public.submit_placement(jsonb, integer, integer) to authenticated;
grant execute on function public.submit_lesson(text, integer, integer, integer, integer) to authenticated;

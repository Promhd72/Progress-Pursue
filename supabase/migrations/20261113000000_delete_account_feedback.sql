-- Account deletion must remove everything tied to the person (App Store 5.1.1(v)).
-- Feedback rows kept the sender's email after their account was deleted
-- (user_id was only set to null). Delete those rows as part of delete_account.

create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := public._require_user();
begin
  delete from public.feedback where user_id = uid;
  delete from auth.users where id = uid; -- every other table cascades from auth.users
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

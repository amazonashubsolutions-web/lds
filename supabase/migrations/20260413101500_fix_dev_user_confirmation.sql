begin;

create or replace function public.confirm_panel_user_email_dev(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_user() then
    raise exception 'Solo un super_user puede confirmar usuarios desde LDS.';
  end if;

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, timezone('utc', now())),
         updated_at = timezone('utc', now())
   where id = target_user_id;
end;
$$;

delete from auth.users
where lower(email) = lower('profemairamartinez@hotmail.com');

commit;

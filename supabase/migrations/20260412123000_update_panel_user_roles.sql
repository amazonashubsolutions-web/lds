begin;

update public.users
set role = 'super_user',
    updated_at = now()
where lower(email) = 'ed_ramirez470@hotmail.com';

update public.users
set role = 'agency_admin',
    updated_at = now()
where lower(email) = 'profemairamartinez@hotmail.com';

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'super_user')
where lower(email) = 'ed_ramirez470@hotmail.com';

update auth.users
set raw_user_meta_data =
  coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'agency_admin')
where lower(email) = 'profemairamartinez@hotmail.com';

commit;

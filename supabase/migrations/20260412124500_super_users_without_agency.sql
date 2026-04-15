begin;

with super_user_ids as (
  select id
  from public.users
  where role = 'super_user'
)
update public.users
set agency_id = null,
    updated_at = timezone('utc', now())
where id in (select id from super_user_ids)
  and agency_id is not null;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'agency_id'
where id in (
  select id
  from public.users
  where role = 'super_user'
);

commit;

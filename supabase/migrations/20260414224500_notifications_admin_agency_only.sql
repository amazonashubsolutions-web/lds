begin;

create or replace function public.can_access_notification(
  target_user_id uuid,
  target_agency_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_user()
    or (
      public.is_agency_admin()
      and target_agency_id = public.current_agency_id()
    )
    or (
      public.current_user_role() = 'travel_agent'
      and target_user_id = auth.uid()
    );
$$;

commit;

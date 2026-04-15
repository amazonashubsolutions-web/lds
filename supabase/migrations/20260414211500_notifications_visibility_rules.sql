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
      and (
        target_agency_id = public.current_agency_id()
        or exists (
          select 1
          from public.users u
          where u.id = target_user_id
            and u.agency_id = public.current_agency_id()
        )
      )
    )
    or (
      public.current_user_role() = 'travel_agent'
      and target_user_id = auth.uid()
    );
$$;

drop policy if exists notifications_select_policy on public.notifications;
create policy notifications_select_policy on public.notifications
for select using (public.can_access_notification(user_id, agency_id));

drop policy if exists notifications_update_policy on public.notifications;
create policy notifications_update_policy on public.notifications
for update using (public.can_access_notification(user_id, agency_id))
with check (public.can_access_notification(user_id, agency_id));

commit;

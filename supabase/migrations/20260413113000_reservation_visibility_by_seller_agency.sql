begin;

create or replace function public.can_access_reservation(target_reservation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reservations r
    where r.id = target_reservation_id
      and (
        public.is_super_user()
        or r.created_by_user_id = auth.uid()
        or (
          public.is_agency_admin()
          and r.seller_agency_id = public.current_agency_id()
        )
      )
  );
$$;

create or replace function public.can_manage_reservation(target_reservation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reservations r
    where r.id = target_reservation_id
      and (
        public.is_super_user()
        or r.created_by_user_id = auth.uid()
        or (
          public.is_agency_admin()
          and r.seller_agency_id = public.current_agency_id()
        )
      )
  );
$$;

commit;

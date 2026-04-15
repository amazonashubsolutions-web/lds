-- Supabase migration: helper functions and RLS policies
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select agency_id from public.users where id = auth.uid();
$$;

create or replace function public.is_super_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'super_user' from public.users where id = auth.uid()), false);
$$;

create or replace function public.is_agency_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'agency_admin' from public.users where id = auth.uid()), false);
$$;

create or replace function public.can_access_agency(target_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_user() or public.current_agency_id() = target_agency_id;
$$;

create or replace function public.can_manage_provider_agency(target_agency_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_user() or (
    public.is_agency_admin()
    and public.current_agency_id() = target_agency_id
    and exists (
      select 1 from public.agencies a
      where a.id = target_agency_id and a.agency_type = 'provider'
    )
  );
$$;

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
        or r.seller_agency_id = public.current_agency_id()
        or r.product_owner_agency_id = public.current_agency_id()
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
          and (
            r.seller_agency_id = public.current_agency_id()
            or r.product_owner_agency_id = public.current_agency_id()
          )
        )
      )
  );
$$;

create or replace function public.can_operate_passenger_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.passenger_lists pl
    join public.products p on p.id = pl.product_id
    where pl.id = target_list_id
      and (
        public.is_super_user()
        or (
          p.provider_agency_id = public.current_agency_id()
          and public.current_user_role() in ('travel_agent', 'agency_admin')
        )
      )
  );
$$;

alter table public.agencies enable row level security;
alter table public.agency_legal_representatives enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_seasons enable row level security;
alter table public.product_penalty_rules enable row level security;
alter table public.product_active_ranges enable row level security;
alter table public.product_calendar_dates enable row level security;
alter table public.quotations enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_passengers enable row level security;
alter table public.reservation_notes enable row level security;
alter table public.reservation_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.cancellations enable row level security;
alter table public.coupons enable row level security;
alter table public.refunds enable row level security;
alter table public.passenger_lists enable row level security;
alter table public.passenger_list_items enable row level security;
alter table public.alliances enable row level security;
alter table public.alliance_movements enable row level security;

create policy agencies_select_policy on public.agencies
for select using (public.can_access_agency(id));
create policy agencies_insert_policy on public.agencies
for insert with check (public.is_super_user());
create policy agencies_update_policy on public.agencies
for update using (public.is_super_user()) with check (public.is_super_user());

create policy legal_rep_select_policy on public.agency_legal_representatives
for select using (public.can_access_agency(agency_id));
create policy legal_rep_manage_policy on public.agency_legal_representatives
for all using (public.is_super_user()) with check (public.is_super_user());

create policy users_select_policy on public.users
for select using (
  id = auth.uid()
  or public.is_super_user()
  or (public.is_agency_admin() and agency_id = public.current_agency_id())
);
create policy users_insert_policy on public.users
for insert with check (
  public.is_super_user()
  or (public.is_agency_admin() and agency_id = public.current_agency_id() and role <> 'super_user')
);
create policy users_update_policy on public.users
for update using (
  id = auth.uid()
  or public.is_super_user()
  or (public.is_agency_admin() and agency_id = public.current_agency_id())
)
with check (
  id = auth.uid()
  or public.is_super_user()
  or (public.is_agency_admin() and agency_id = public.current_agency_id() and role <> 'super_user')
);

create policy products_select_policy on public.products
for select using (auth.uid() is not null);
create policy products_insert_policy on public.products
for insert with check (public.can_manage_provider_agency(provider_agency_id));
create policy products_update_policy on public.products
for update using (public.can_manage_provider_agency(provider_agency_id)) with check (public.can_manage_provider_agency(provider_agency_id));

create policy product_seasons_select_policy on public.product_seasons
for select using (auth.uid() is not null);
create policy product_seasons_manage_policy on public.product_seasons
for all using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)))
with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)));

create policy product_penalties_select_policy on public.product_penalty_rules
for select using (auth.uid() is not null);
create policy product_penalties_manage_policy on public.product_penalty_rules
for all using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)))
with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)));

create policy product_active_ranges_select_policy on public.product_active_ranges
for select using (auth.uid() is not null);
create policy product_active_ranges_manage_policy on public.product_active_ranges
for all using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)))
with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)));

create policy product_calendar_dates_select_policy on public.product_calendar_dates
for select using (auth.uid() is not null);
create policy product_calendar_dates_manage_policy on public.product_calendar_dates
for all using (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)))
with check (exists (select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)));

create policy quotations_select_policy on public.quotations
for select using (public.is_super_user() or user_id = auth.uid() or agency_id = public.current_agency_id());
create policy quotations_insert_policy on public.quotations
for insert with check (public.is_super_user() or user_id = auth.uid() or agency_id = public.current_agency_id());
create policy quotations_update_policy on public.quotations
for update using (public.is_super_user() or user_id = auth.uid() or (public.is_agency_admin() and agency_id = public.current_agency_id()))
with check (public.is_super_user() or user_id = auth.uid() or (public.is_agency_admin() and agency_id = public.current_agency_id()));

create policy reservations_select_policy on public.reservations
for select using (public.can_access_reservation(id));
create policy reservations_insert_policy on public.reservations
for insert with check (public.is_super_user() or seller_agency_id = public.current_agency_id());
create policy reservations_update_policy on public.reservations
for update using (public.can_manage_reservation(id)) with check (public.can_manage_reservation(id));

create policy reservation_passengers_select_policy on public.reservation_passengers
for select using (public.can_access_reservation(reservation_id));
create policy reservation_passengers_manage_policy on public.reservation_passengers
for all using (public.can_manage_reservation(reservation_id)) with check (public.can_manage_reservation(reservation_id));

create policy reservation_notes_select_policy on public.reservation_notes
for select using (public.can_access_reservation(reservation_id));
create policy reservation_notes_insert_policy on public.reservation_notes
for insert with check (public.can_manage_reservation(reservation_id));

create policy reservation_history_select_policy on public.reservation_status_history
for select using (public.can_access_reservation(reservation_id));
create policy reservation_history_insert_policy on public.reservation_status_history
for insert with check (public.can_manage_reservation(reservation_id));

create policy cancellations_select_policy on public.cancellations
for select using (public.can_access_reservation(reservation_id));
create policy cancellations_insert_policy on public.cancellations
for insert with check (public.can_manage_reservation(reservation_id));

create policy coupons_select_policy on public.coupons
for select using (public.can_access_reservation(reservation_id));
create policy coupons_manage_policy on public.coupons
for all using (public.can_manage_reservation(reservation_id)) with check (public.can_manage_reservation(reservation_id));

create policy refunds_select_policy on public.refunds
for select using (public.can_access_reservation(reservation_id));
create policy refunds_manage_policy on public.refunds
for all using (public.can_manage_reservation(reservation_id)) with check (public.can_manage_reservation(reservation_id));

create policy notifications_select_policy on public.notifications
for select using (public.is_super_user() or user_id = auth.uid() or agency_id = public.current_agency_id());
create policy notifications_update_policy on public.notifications
for update using (public.is_super_user() or user_id = auth.uid()) with check (public.is_super_user() or user_id = auth.uid());

create policy passenger_lists_select_policy on public.passenger_lists
for select using (public.can_operate_passenger_list(id));
create policy passenger_lists_manage_policy on public.passenger_lists
for all using (
  public.is_super_user() or exists (
    select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  public.is_super_user() or exists (
    select 1 from public.products p where p.id = product_id and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

create policy passenger_list_items_select_policy on public.passenger_list_items
for select using (public.can_operate_passenger_list(passenger_list_id));
create policy passenger_list_items_update_policy on public.passenger_list_items
for update using (public.can_operate_passenger_list(passenger_list_id)) with check (public.can_operate_passenger_list(passenger_list_id));
create policy passenger_list_items_insert_policy on public.passenger_list_items
for insert with check (public.can_operate_passenger_list(passenger_list_id));

create policy alliances_select_policy on public.alliances
for select using (public.is_super_user() or (public.is_agency_admin() and provider_agency_id = public.current_agency_id()));
create policy alliances_manage_policy on public.alliances
for all using (public.is_super_user() or (public.is_agency_admin() and provider_agency_id = public.current_agency_id()))
with check (public.is_super_user() or (public.is_agency_admin() and provider_agency_id = public.current_agency_id()));

create policy alliance_movements_select_policy on public.alliance_movements
for select using (exists (select 1 from public.alliances a where a.id = alliance_id and (public.is_super_user() or (public.is_agency_admin() and a.provider_agency_id = public.current_agency_id()))));
create policy alliance_movements_manage_policy on public.alliance_movements
for all using (exists (select 1 from public.alliances a where a.id = alliance_id and (public.is_super_user() or (public.is_agency_admin() and a.provider_agency_id = public.current_agency_id()))))
with check (exists (select 1 from public.alliances a where a.id = alliance_id and (public.is_super_user() or (public.is_agency_admin() and a.provider_agency_id = public.current_agency_id()))));

-- Supabase migration: helpers and RLS policies for backlog alignment entities

create or replace function public.can_access_refund(target_refund_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refunds r
    where r.id = target_refund_id
      and public.can_access_reservation(r.reservation_id)
  );
$$;

create or replace function public.can_upload_refund_receipt(target_refund_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refunds r
    where r.id = target_refund_id
      and (
        public.is_super_user()
        or r.seller_agency_id = public.current_agency_id()
      )
  );
$$;

create or replace function public.can_request_refund_payment(target_refund_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.refunds r
    where r.id = target_refund_id
      and (
        public.is_super_user()
        or r.buyer_agency_id = public.current_agency_id()
      )
  );
$$;

create or replace function public.can_manage_passenger_list_state(target_list_id uuid)
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
        or public.can_manage_provider_agency(p.provider_agency_id)
      )
  );
$$;

create or replace function public.search_agencies_for_alliance(search_term text, result_limit integer default 20)
returns table (
  id uuid,
  nombre varchar(180),
  nit varchar(60),
  tipo_persona varchar(20),
  direccion varchar(255),
  telefono_contacto varchar(40),
  email_empresa varchar(180),
  ciudad varchar(120),
  pais varchar(120)
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.nombre,
    a.nit,
    a.tipo_persona,
    a.direccion,
    a.telefono_contacto,
    a.email_empresa,
    a.ciudad,
    a.pais
  from public.agencies a
  where a.agency_type = 'seller'
    and a.status = 'active'
    and (
      public.is_super_user()
      or exists (
        select 1
        from public.users u
        join public.agencies owner_agency on owner_agency.id = u.agency_id
        where u.id = auth.uid()
          and u.role = 'agency_admin'
          and owner_agency.agency_type = 'provider'
      )
    )
    and (
      coalesce(search_term, '') = ''
      or a.nombre ilike '%' || search_term || '%'
      or a.nit ilike '%' || search_term || '%'
      or coalesce(a.ciudad, '') ilike '%' || search_term || '%'
    )
  order by a.nombre asc
  limit greatest(coalesce(result_limit, 20), 1);
$$;

alter table public.product_subcategories enable row level security;
alter table public.product_subcategory_links enable row level security;
alter table public.product_detail_content enable row level security;
alter table public.product_gallery_images enable row level security;
alter table public.refund_receipts enable row level security;
alter table public.refund_payment_reminders enable row level security;
alter table public.passenger_list_status_history enable row level security;
alter table public.checkin_events enable row level security;
alter table public.no_show_events enable row level security;
alter table public.alliance_status_history enable row level security;

create policy product_subcategories_select_policy on public.product_subcategories
for select using (auth.uid() is not null);
create policy product_subcategories_manage_policy on public.product_subcategories
for all using (public.is_super_user()) with check (public.is_super_user());

create policy product_subcategory_links_select_policy on public.product_subcategory_links
for select using (auth.uid() is not null);
create policy product_subcategory_links_manage_policy on public.product_subcategory_links
for all using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

create policy product_detail_content_select_policy on public.product_detail_content
for select using (auth.uid() is not null);
create policy product_detail_content_manage_policy on public.product_detail_content
for all using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

create policy product_gallery_images_select_policy on public.product_gallery_images
for select using (auth.uid() is not null);
create policy product_gallery_images_manage_policy on public.product_gallery_images
for all using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
)
with check (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and public.can_manage_provider_agency(p.provider_agency_id)
  )
);

create policy refund_receipts_select_policy on public.refund_receipts
for select using (public.can_access_refund(refund_id));
create policy refund_receipts_insert_policy on public.refund_receipts
for insert with check (
  public.can_upload_refund_receipt(refund_id)
  and uploaded_by_user_id = auth.uid()
  and (
    public.is_super_user()
    or uploaded_by_agency_id = public.current_agency_id()
  )
);

create policy refund_payment_reminders_select_policy on public.refund_payment_reminders
for select using (public.can_access_refund(refund_id));
create policy refund_payment_reminders_insert_policy on public.refund_payment_reminders
for insert with check (
  public.can_request_refund_payment(refund_id)
  and requested_by_user_id = auth.uid()
  and (
    public.is_super_user()
    or requested_by_agency_id = public.current_agency_id()
  )
  and exists (
    select 1
    from public.refunds r
    where r.id = refund_id
      and r.status <> 'pagado'
  )
);

create policy passenger_list_status_history_select_policy on public.passenger_list_status_history
for select using (public.can_operate_passenger_list(passenger_list_id));
create policy passenger_list_status_history_insert_policy on public.passenger_list_status_history
for insert with check (
  public.can_manage_passenger_list_state(passenger_list_id)
  and changed_by_user_id = auth.uid()
);

create policy checkin_events_select_policy on public.checkin_events
for select using (public.can_operate_passenger_list(passenger_list_id));
create policy checkin_events_insert_policy on public.checkin_events
for insert with check (
  public.can_operate_passenger_list(passenger_list_id)
  and checked_in_by_user_id = auth.uid()
);

create policy no_show_events_select_policy on public.no_show_events
for select using (public.can_operate_passenger_list(passenger_list_id));
create policy no_show_events_insert_policy on public.no_show_events
for insert with check (
  public.can_operate_passenger_list(passenger_list_id)
  and marked_by_user_id = auth.uid()
);

create policy alliance_status_history_select_policy on public.alliance_status_history
for select using (
  exists (
    select 1
    from public.alliances a
    where a.id = alliance_id
      and (
        public.is_super_user()
        or (public.is_agency_admin() and a.provider_agency_id = public.current_agency_id())
      )
  )
);
create policy alliance_status_history_insert_policy on public.alliance_status_history
for insert with check (
  exists (
    select 1
    from public.alliances a
    where a.id = alliance_id
      and (
        public.is_super_user()
        or (public.is_agency_admin() and a.provider_agency_id = public.current_agency_id())
      )
  )
  and changed_by_user_id = auth.uid()
);

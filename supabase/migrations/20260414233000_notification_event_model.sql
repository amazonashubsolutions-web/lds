begin;

create table if not exists public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  recipient_user_id uuid null references public.users(id) on delete cascade,
  recipient_agency_id uuid null references public.agencies(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint notification_recipients_target_check check (
    ((recipient_user_id is not null)::integer + (recipient_agency_id is not null)::integer) = 1
  )
);

create unique index if not exists idx_notification_recipients_unique_user
  on public.notification_recipients(notification_id, recipient_user_id)
  where recipient_user_id is not null;

create unique index if not exists idx_notification_recipients_unique_agency
  on public.notification_recipients(notification_id, recipient_agency_id)
  where recipient_agency_id is not null;

create index if not exists idx_notification_recipients_user
  on public.notification_recipients(recipient_user_id);

create index if not exists idx_notification_recipients_agency
  on public.notification_recipients(recipient_agency_id);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists idx_notification_reads_user
  on public.notification_reads(user_id, read_at desc);

alter table public.notification_recipients enable row level security;
alter table public.notification_reads enable row level security;

create temp table notification_legacy on commit drop as
select
  n.*,
  case
    when n.reservation_id is not null then concat_ws('|', n.reservation_id::text, coalesce(n.type, ''), coalesce(n.title, ''))
    else n.id::text
  end as group_key
from public.notifications n;

create temp table notification_canonical on commit drop as
with picked as (
  select distinct on (group_key)
    group_key,
    reservation_id,
    type,
    title,
    body,
    severity,
    agency_name,
    city_name,
    travel_date_string,
    reason
  from notification_legacy
  order by group_key, length(coalesce(body, '')) desc, created_at desc, id desc
),
rolled as (
  select
    group_key,
    min(created_at) as created_at,
    (array_agg(user_id order by user_id) filter (where user_id is not null))[1] as user_id,
    (array_agg(agency_id order by agency_id) filter (where agency_id is not null))[1] as agency_id
  from notification_legacy
  group by group_key
)
select
  gen_random_uuid() as id,
  rolled.user_id,
  rolled.agency_id,
  picked.reservation_id,
  picked.type,
  picked.title,
  picked.body,
  coalesce(picked.severity, 'low') as severity,
  picked.agency_name,
  picked.city_name,
  picked.travel_date_string,
  picked.reason,
  rolled.created_at,
  picked.group_key
from picked
join rolled using (group_key);

create temp table notification_mapping on commit drop as
select
  legacy.id as legacy_id,
  canonical.id as canonical_id,
  legacy.user_id,
  legacy.agency_id,
  legacy.read_at
from notification_legacy legacy
join notification_canonical canonical using (group_key);

delete from public.notification_reads;
delete from public.notification_recipients;
delete from public.notifications;

insert into public.notifications (
  id,
  user_id,
  agency_id,
  reservation_id,
  type,
  title,
  body,
  created_at,
  severity,
  agency_name,
  city_name,
  travel_date_string,
  reason
)
select
  id,
  user_id,
  agency_id,
  reservation_id,
  type,
  title,
  body,
  created_at,
  severity,
  agency_name,
  city_name,
  travel_date_string,
  reason
from notification_canonical;

insert into public.notification_recipients (notification_id, recipient_user_id)
select distinct canonical_id, user_id
from notification_mapping
where user_id is not null;

insert into public.notification_recipients (notification_id, recipient_agency_id)
select distinct canonical_id, agency_id
from notification_mapping
where agency_id is not null;

insert into public.notification_reads (notification_id, user_id, read_at, created_at)
select distinct on (canonical_id, user_id)
  canonical_id,
  user_id,
  read_at,
  read_at
from notification_mapping
where user_id is not null
  and read_at is not null
order by canonical_id, user_id, read_at desc;

alter table public.notifications drop column if exists read_at;

create unique index if not exists idx_notifications_unique_reservation_event
  on public.notifications(reservation_id, type, title)
  where reservation_id is not null;

drop policy if exists notifications_select_policy on public.notifications;
drop policy if exists notifications_update_policy on public.notifications;

drop function if exists public.can_access_notification(uuid, uuid);

create or replace function public.can_access_notification(target_notification_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_user()
    or exists (
      select 1
      from public.notification_recipients nr
      where nr.notification_id = target_notification_id
        and (
          nr.recipient_user_id = auth.uid()
          or (
            public.is_agency_admin()
            and nr.recipient_agency_id = public.current_agency_id()
          )
        )
    );
$$;

create policy notifications_select_policy on public.notifications
for select using (public.can_access_notification(id));

drop policy if exists notification_reads_select_policy on public.notification_reads;
create policy notification_reads_select_policy on public.notification_reads
for select using (user_id = auth.uid());

drop policy if exists notification_reads_insert_policy on public.notification_reads;
create policy notification_reads_insert_policy on public.notification_reads
for insert with check (user_id = auth.uid() and public.can_access_notification(notification_id));

drop policy if exists notification_reads_update_policy on public.notification_reads;
create policy notification_reads_update_policy on public.notification_reads
for update using (user_id = auth.uid() and public.can_access_notification(notification_id))
with check (user_id = auth.uid() and public.can_access_notification(notification_id));

create or replace function public.get_my_notifications(notification_limit integer default 50)
returns table (
  id uuid,
  user_id uuid,
  agency_id uuid,
  reservation_id uuid,
  type varchar,
  title varchar,
  body text,
  severity varchar,
  agency_name varchar,
  city_name varchar,
  travel_date_string varchar,
  reason text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    n.id,
    n.user_id,
    n.agency_id,
    n.reservation_id,
    n.type,
    n.title,
    n.body,
    n.severity,
    n.agency_name,
    n.city_name,
    n.travel_date_string,
    n.reason,
    nr.read_at,
    n.created_at
  from public.notifications n
  left join public.notification_reads nr
    on nr.notification_id = n.id
   and nr.user_id = auth.uid()
  where public.can_access_notification(n.id)
  order by n.created_at desc
  limit greatest(coalesce(notification_limit, 50), 1);
$$;

grant execute on function public.get_my_notifications(integer) to authenticated;

create or replace function public.mark_my_notification_as_read(target_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No hay una sesion activa en Supabase.';
  end if;

  if not public.can_access_notification(target_notification_id) then
    raise exception 'No tienes permiso para marcar esta notificacion.';
  end if;

  insert into public.notification_reads (
    notification_id,
    user_id,
    read_at,
    created_at
  )
  values (
    target_notification_id,
    auth.uid(),
    now(),
    now()
  )
  on conflict (notification_id, user_id) do update
    set read_at = excluded.read_at;
end;
$$;

grant execute on function public.mark_my_notification_as_read(uuid) to authenticated;

create or replace function public.cancel_expired_reserved_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cancelled_count integer := 0;
begin
  with expired_rows as (
    update public.reservations r
    set status = 'cancelled_by_expiration',
        updated_at = now()
    where r.status = 'reserved'
      and r.expires_at is not null
      and now() >= r.expires_at
    returning
      r.id,
      r.locator,
      r.created_by_user_id,
      r.seller_agency_id,
      r.product_owner_agency_id,
      r.travel_date,
      r.expires_at,
      r.product_id
  ),
  expired_details as (
    select
      er.*,
      p.ciudad as product_city,
      sa.nombre as seller_agency_name,
      pa.nombre as provider_agency_name
    from expired_rows er
    left join public.products p on p.id = er.product_id
    left join public.agencies sa on sa.id = er.seller_agency_id
    left join public.agencies pa on pa.id = er.product_owner_agency_id
  ),
  inserted_history as (
    insert into public.reservation_status_history (
      reservation_id,
      previous_status,
      new_status,
      reason,
      changed_by_user_id,
      changed_at
    )
    select
      expired_details.id,
      'reserved',
      'cancelled_by_expiration',
      'Reserva cancelada automaticamente por vencimiento.',
      null,
      now()
    from expired_details
    returning reservation_id
  ),
  notification_payload as (
    select
      expired_details.id as reservation_id,
      expired_details.created_by_user_id as target_user_id,
      expired_details.seller_agency_id as target_agency_id,
      expired_details.product_owner_agency_id as provider_agency_id,
      'cancelada'::varchar(40) as type,
      'Reserva cancelada por vencimiento'::varchar(180) as title,
      format(
        'La reserva %s fue cancelada automaticamente por vencimiento. La fecha de actividad es %s y el limite de reserva se cumplio en %s.',
        expired_details.locator,
        to_char(expired_details.travel_date, 'YYYY-MM-DD'),
        to_char(expired_details.expires_at at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI')
      ) as body,
      'high'::varchar(20) as severity,
      coalesce(expired_details.seller_agency_name, expired_details.provider_agency_name) as agency_name,
      expired_details.product_city as city_name,
      to_char(expired_details.travel_date, 'YYYY-MM-DD') as travel_date_string,
      'La reserva expiro debido a falta de confirmacion en el tiempo limite.'::text as reason
    from expired_details
  ),
  inserted_notifications as (
    insert into public.notifications (
      user_id,
      agency_id,
      reservation_id,
      type,
      title,
      body,
      severity,
      agency_name,
      city_name,
      travel_date_string,
      reason
    )
    select
      notification_payload.target_user_id,
      notification_payload.target_agency_id,
      notification_payload.reservation_id,
      notification_payload.type,
      notification_payload.title,
      notification_payload.body,
      notification_payload.severity,
      notification_payload.agency_name,
      notification_payload.city_name,
      notification_payload.travel_date_string,
      notification_payload.reason
    from notification_payload
    returning id, reservation_id
  ),
  inserted_user_recipients as (
    insert into public.notification_recipients (notification_id, recipient_user_id)
    select
      inserted_notifications.id,
      notification_payload.target_user_id
    from inserted_notifications
    join notification_payload using (reservation_id)
    where notification_payload.target_user_id is not null
    returning notification_id
  ),
  inserted_seller_recipients as (
    insert into public.notification_recipients (notification_id, recipient_agency_id)
    select
      inserted_notifications.id,
      notification_payload.target_agency_id
    from inserted_notifications
    join notification_payload using (reservation_id)
    where notification_payload.target_agency_id is not null
    returning notification_id
  ),
  inserted_provider_recipients as (
    insert into public.notification_recipients (notification_id, recipient_agency_id)
    select
      inserted_notifications.id,
      notification_payload.provider_agency_id
    from inserted_notifications
    join notification_payload using (reservation_id)
    where notification_payload.provider_agency_id is not null
      and notification_payload.provider_agency_id <> notification_payload.target_agency_id
    returning notification_id
  )
  select count(*) into v_cancelled_count
  from inserted_history;

  return coalesce(v_cancelled_count, 0);
end;
$$;

commit;

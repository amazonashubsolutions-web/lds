begin;

alter table public.notifications
  add column if not exists severity varchar(20) not null default 'low' check (severity in ('high', 'medium', 'low')),
  add column if not exists agency_name varchar(120),
  add column if not exists city_name varchar(120),
  add column if not exists travel_date_string varchar(60),
  add column if not exists reason text;

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
  inserted_user_notifications as (
    insert into public.notifications (
      user_id,
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
      expired_details.created_by_user_id,
      expired_details.id,
      'cancelada',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s fue cancelada automaticamente por vencimiento. La fecha de actividad es %s y el limite de reserva se cumplio en %s.',
        expired_details.locator,
        to_char(expired_details.travel_date, 'YYYY-MM-DD'),
        to_char(expired_details.expires_at at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI')
      ),
      'high',
      expired_details.seller_agency_name,
      expired_details.product_city,
      to_char(expired_details.travel_date, 'YYYY-MM-DD'),
      'La reserva expiro debido a falta de confirmacion en el tiempo limite.'
    from expired_details
    where expired_details.created_by_user_id is not null
    returning reservation_id
  ),
  inserted_seller_agency_notifications as (
    insert into public.notifications (
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
      expired_details.seller_agency_id,
      expired_details.id,
      'cancelada',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s fue cancelada automaticamente por vencimiento antes de la actividad del %s.',
        expired_details.locator,
        to_char(expired_details.travel_date, 'YYYY-MM-DD')
      ),
      'high',
      expired_details.seller_agency_name,
      expired_details.product_city,
      to_char(expired_details.travel_date, 'YYYY-MM-DD'),
      'La reserva expiro debido a falta de confirmacion.'
    from expired_details
    where expired_details.seller_agency_id is not null
    returning reservation_id
  ),
  inserted_provider_agency_notifications as (
    insert into public.notifications (
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
      expired_details.product_owner_agency_id,
      expired_details.id,
      'cancelada',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s asociada a tu producto fue cancelada automaticamente por vencimiento antes de la actividad del %s.',
        expired_details.locator,
        to_char(expired_details.travel_date, 'YYYY-MM-DD')
      ),
      'high',
      expired_details.provider_agency_name,
      expired_details.product_city,
      to_char(expired_details.travel_date, 'YYYY-MM-DD'),
      'Cancelacion automatica por tiempo limite de reserva superado.'
    from expired_details
    where expired_details.product_owner_agency_id is not null
      and expired_details.product_owner_agency_id <> expired_details.seller_agency_id
    returning reservation_id
  )
  select count(*) into v_cancelled_count
  from inserted_history;

  return coalesce(v_cancelled_count, 0);
end;
$$;

commit;

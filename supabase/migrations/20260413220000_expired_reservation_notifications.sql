begin;

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
      r.expires_at
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
      expired_rows.id,
      'reserved',
      'cancelled_by_expiration',
      'Reserva cancelada automaticamente por vencimiento.',
      null,
      now()
    from expired_rows
    returning reservation_id
  ),
  inserted_user_notifications as (
    insert into public.notifications (
      user_id,
      reservation_id,
      type,
      title,
      body
    )
    select
      expired_rows.created_by_user_id,
      expired_rows.id,
      'reservation_expired',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s fue cancelada automaticamente por vencimiento. La fecha de actividad es %s y el limite de reserva se cumplio en %s.',
        expired_rows.locator,
        to_char(expired_rows.travel_date, 'YYYY-MM-DD'),
        to_char(expired_rows.expires_at at time zone 'America/Bogota', 'YYYY-MM-DD HH24:MI')
      )
    from expired_rows
    where expired_rows.created_by_user_id is not null
    returning reservation_id
  ),
  inserted_seller_agency_notifications as (
    insert into public.notifications (
      agency_id,
      reservation_id,
      type,
      title,
      body
    )
    select
      expired_rows.seller_agency_id,
      expired_rows.id,
      'reservation_expired',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s fue cancelada automaticamente por vencimiento antes de la actividad del %s.',
        expired_rows.locator,
        to_char(expired_rows.travel_date, 'YYYY-MM-DD')
      )
    from expired_rows
    where expired_rows.seller_agency_id is not null
    returning reservation_id
  ),
  inserted_provider_agency_notifications as (
    insert into public.notifications (
      agency_id,
      reservation_id,
      type,
      title,
      body
    )
    select
      expired_rows.product_owner_agency_id,
      expired_rows.id,
      'reservation_expired',
      'Reserva cancelada por vencimiento',
      format(
        'La reserva %s asociada a tu producto fue cancelada automaticamente por vencimiento antes de la actividad del %s.',
        expired_rows.locator,
        to_char(expired_rows.travel_date, 'YYYY-MM-DD')
      )
    from expired_rows
    where expired_rows.product_owner_agency_id is not null
      and expired_rows.product_owner_agency_id <> expired_rows.seller_agency_id
    returning reservation_id
  )
  select count(*) into v_cancelled_count
  from inserted_history;

  return coalesce(v_cancelled_count, 0);
end;
$$;

commit;

begin;

create or replace function public.calculate_reservation_expires_at(
  p_created_at timestamptz
)
returns timestamptz
language sql
immutable
returns null on null input
as $$
  select p_created_at + interval '24 hours';
$$;

update public.reservations
set expires_at = case
  when status = 'reserved'
    then public.calculate_reservation_expires_at(created_at)
  else null
end
where (
  status = 'reserved'
  and expires_at is distinct from public.calculate_reservation_expires_at(created_at)
) or (
  status <> 'reserved'
  and expires_at is not null
);

create or replace function public.create_reservation_checkout(
  p_locator varchar,
  p_product_id uuid,
  p_product_owner_agency_id uuid,
  p_seller_agency_id uuid,
  p_status varchar,
  p_booking_date date,
  p_issue_date date,
  p_travel_date date,
  p_embark_time time,
  p_payment_type varchar,
  p_payment_status varchar,
  p_total_amount numeric,
  p_currency varchar,
  p_season_type varchar,
  p_notes_summary text,
  p_passengers jsonb,
  p_checkout_snapshot jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_actor_role text;
  v_actor_agency_id uuid;
  v_reservation_id uuid;
  v_expires_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'No hay una sesion activa para crear la reserva.';
  end if;

  select u.role, u.agency_id
  into v_actor_role, v_actor_agency_id
  from public.users u
  where u.id = v_actor_user_id;

  if v_actor_role is null then
    raise exception 'No encontramos el perfil del usuario autenticado.';
  end if;

  if not (
    v_actor_role = 'super_user'
    or p_seller_agency_id = v_actor_agency_id
    or exists (
      select 1
      from public.products p
      where p.id = p_product_id
        and public.can_manage_provider_agency(p.provider_agency_id)
    )
  ) then
    raise exception 'El usuario autenticado no tiene permisos para crear esta reserva.';
  end if;

  if p_status = 'reserved' then
    v_expires_at := public.calculate_reservation_expires_at(now());

    if now() >= (((p_travel_date::timestamp + p_embark_time) at time zone 'America/Bogota') - interval '24 hours') then
      raise exception 'Esta reserva esta siendo creada menos de 24 horas antes de la fecha de la actividad. Ya no se puede reservar; unicamente emitir.';
    end if;
  else
    v_expires_at := null;
  end if;

  insert into public.reservations (
    locator,
    product_id,
    product_owner_agency_id,
    seller_agency_id,
    created_by_user_id,
    origin_type,
    status,
    reservation_type,
    booking_date,
    issue_date,
    travel_date,
    embark_time,
    payment_type,
    payment_status,
    total_amount,
    currency,
    season_type,
    notes_summary,
    expires_at
  )
  values (
    p_locator,
    p_product_id,
    p_product_owner_agency_id,
    p_seller_agency_id,
    v_actor_user_id,
    'direct',
    p_status,
    'full',
    p_booking_date,
    p_issue_date,
    p_travel_date,
    p_embark_time,
    p_payment_type,
    p_payment_status,
    p_total_amount,
    p_currency,
    p_season_type,
    p_notes_summary,
    v_expires_at
  )
  returning id into v_reservation_id;

  insert into public.reservation_passengers (
    reservation_id,
    first_name,
    last_name,
    passenger_type,
    document_type,
    document_number,
    country,
    sex,
    birth_date,
    phone,
    passenger_status
  )
  select
    v_reservation_id,
    passenger.first_name,
    passenger.last_name,
    passenger.passenger_type,
    passenger.document_type,
    passenger.document_number,
    passenger.country,
    passenger.sex,
    passenger.birth_date,
    passenger.phone,
    coalesce(passenger.passenger_status, 'active')
  from jsonb_to_recordset(coalesce(p_passengers, '[]'::jsonb)) as passenger(
    first_name text,
    last_name text,
    passenger_type text,
    document_type text,
    document_number text,
    country text,
    sex text,
    birth_date date,
    phone text,
    passenger_status text
  );

  insert into public.reservation_status_history (
    reservation_id,
    previous_status,
    new_status,
    reason,
    changed_by_user_id
  )
  values (
    v_reservation_id,
    null,
    p_status,
    'Reserva creada desde el detalle del producto.',
    v_actor_user_id
  );

  insert into public.payment_attempts (
    reservation_id,
    created_by_user_id,
    provider,
    status,
    locator,
    amount,
    currency,
    checkout_snapshot
  )
  values (
    v_reservation_id,
    v_actor_user_id,
    'pending_integration',
    'pending',
    p_locator,
    p_total_amount,
    coalesce(p_currency, 'COP'),
    coalesce(p_checkout_snapshot, '{}'::jsonb)
  );

  return v_reservation_id;
end;
$$;

grant execute on function public.create_reservation_checkout(
  varchar,
  uuid,
  uuid,
  uuid,
  varchar,
  date,
  date,
  date,
  time,
  varchar,
  varchar,
  numeric,
  varchar,
  varchar,
  text,
  jsonb,
  jsonb
) to authenticated;

select public.cancel_expired_reserved_reservations();

commit;

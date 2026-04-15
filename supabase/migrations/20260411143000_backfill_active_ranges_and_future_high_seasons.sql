begin;

with config as (
  select
    date '2026-04-11' as active_start_date,
    date '2027-01-31' as active_end_date
),
active_products as (
  select
    p.id as product_id,
    coalesce(p.updated_by, p.created_by, fallback.user_id) as actor_user_id
  from public.products p
  left join lateral (
    select u.id as user_id
    from public.users u
    where u.role = 'super_user'
    order by u.created_at asc
    limit 1
  ) fallback on true
  where p.status = 'active'
)
insert into public.product_active_ranges (
  product_id,
  fecha_inicio,
  fecha_fin,
  created_by
)
select
  ap.product_id,
  c.active_start_date,
  c.active_end_date,
  ap.actor_user_id
from active_products ap
cross join config c
where ap.actor_user_id is not null
and not exists (
  select 1
  from public.product_active_ranges par
  where par.product_id = ap.product_id
    and par.fecha_inicio = c.active_start_date
    and par.fecha_fin = c.active_end_date
);

with config as (
  select
    date '2026-04-11' as active_start_date,
    date '2027-01-31' as active_end_date
),
active_product_detail as (
  select
    p.id as product_id,
    d.booking_config
  from public.products p
  join public.product_detail_content d
    on d.product_id = p.id
  where p.status = 'active'
),
raw_periods as (
  select
    apd.product_id,
    coalesce(nullif(trim(period ->> 'label'), ''), 'Temporada alta') as nombre_opcional,
    trim(period ->> 'startMonthDay') as start_month_day,
    trim(period ->> 'endMonthDay') as end_month_day
  from active_product_detail apd
  cross join lateral jsonb_array_elements(
    coalesce(
      apd.booking_config #> '{pricingDetails,seasons,high,periods}',
      '[]'::jsonb
    )
  ) period
  where trim(coalesce(period ->> 'startMonthDay', '')) ~ '^\d{2}-\d{2}$'
    and trim(coalesce(period ->> 'endMonthDay', '')) ~ '^\d{2}-\d{2}$'
),
future_season_ranges as (
  select
    rp.product_id,
    'high'::varchar(20) as season_type,
    case
      when rp.start_month_day <= rp.end_month_day then
        make_date(
          2026,
          split_part(rp.start_month_day, '-', 1)::int,
          split_part(rp.start_month_day, '-', 2)::int
        )
      else
        make_date(
          2026,
          split_part(rp.start_month_day, '-', 1)::int,
          split_part(rp.start_month_day, '-', 2)::int
        )
    end as fecha_inicio,
    case
      when rp.start_month_day <= rp.end_month_day then
        make_date(
          2026,
          split_part(rp.end_month_day, '-', 1)::int,
          split_part(rp.end_month_day, '-', 2)::int
        )
      else
        make_date(
          2027,
          split_part(rp.end_month_day, '-', 1)::int,
          split_part(rp.end_month_day, '-', 2)::int
        )
    end as fecha_fin,
    rp.nombre_opcional
  from raw_periods rp
),
filtered_future_seasons as (
  select
    fsr.product_id,
    fsr.season_type,
    fsr.fecha_inicio,
    fsr.fecha_fin,
    fsr.nombre_opcional
  from future_season_ranges fsr
  cross join config c
  where fsr.fecha_fin >= c.active_start_date
    and fsr.fecha_inicio <= c.active_end_date
)
insert into public.product_seasons (
  product_id,
  season_type,
  fecha_inicio,
  fecha_fin,
  nombre_opcional
)
select
  ffs.product_id,
  ffs.season_type,
  ffs.fecha_inicio,
  ffs.fecha_fin,
  ffs.nombre_opcional
from filtered_future_seasons ffs
where not exists (
  select 1
  from public.product_seasons ps
  where ps.product_id = ffs.product_id
    and ps.season_type = ffs.season_type
    and ps.fecha_inicio = ffs.fecha_inicio
    and ps.fecha_fin = ffs.fecha_fin
);

commit;

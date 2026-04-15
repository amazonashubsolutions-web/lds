-- Seed for product_coupons based on the original frontend mock data.
-- Safe to run after frontend_products_seed.sql and 20260411100000_product_coupons.sql.

begin;

with actor as (
  select id
  from public.users
  where role = 'super_user'
  order by created_at asc
  limit 1
),
coupon_rows as (
  select
    'CACAO10'::varchar(60) as code,
    'Taller de cacao y caminata en Minca'::text as product_name,
    'Descuento promocional para reservas online del tour.'::text as description,
    'percentage'::varchar(20) as value_type,
    10::numeric(12,2) as value_amount,
    'COP'::varchar(10) as currency_code,
    'booking_total'::varchar(40) as discount_target,
    '2026-04-01'::date as starts_at,
    '2026-04-30'::date as ends_at,
    'passenger_conditions'::varchar(40) as rule_type,
    'and'::varchar(10) as rule_logic,
    '[{"passengerType":"adult","operator":">","value":2}]'::jsonb as rule_conditions,
    'active'::varchar(20) as status
  union all
  select
    'TERMALES20',
    'Pasa dia termales y paisaje cultural cafetero',
    'Bono fijo para impulsar ventas de temporada baja.',
    'percentage',
    20::numeric(12,2),
    'COP',
    'children_subtotal',
    '2026-03-10'::date,
    '2026-05-10'::date,
    'passenger_conditions',
    'and',
    '[{"passengerType":"child","operator":">","value":1}]'::jsonb,
    'active'
  union all
  select
    'KAYAK15',
    'Ruta de kayak media jornada en Guatape',
    'Promocion para grupos pequenos en fechas seleccionadas.',
    'percentage',
    15::numeric(12,2),
    'COP',
    'booking_total',
    '2026-02-01'::date,
    '2026-03-15'::date,
    'passenger_conditions',
    'and',
    '[{"passengerType":"adult","operator":"=","value":2},{"passengerType":"child","operator":"=","value":0}]'::jsonb,
    'inactive'
),
resolved_rows as (
  select
    p.id as product_id,
    c.code,
    c.description,
    c.value_type,
    c.value_amount,
    c.currency_code,
    c.discount_target,
    c.starts_at,
    c.ends_at,
    c.rule_type,
    c.rule_logic,
    c.rule_conditions,
    c.status,
    a.id as actor_user_id
  from coupon_rows c
  join public.products p
    on p.nombre = c.product_name
  cross join actor a
)
insert into public.product_coupons (
  product_id,
  code,
  description,
  value_type,
  value_amount,
  currency_code,
  discount_target,
  starts_at,
  ends_at,
  rule_type,
  rule_logic,
  rule_conditions,
  status,
  created_by_user_id,
  updated_by_user_id
)
select
  product_id,
  code,
  description,
  value_type,
  value_amount,
  currency_code,
  discount_target,
  starts_at,
  ends_at,
  rule_type,
  rule_logic,
  rule_conditions,
  status,
  actor_user_id,
  actor_user_id
from resolved_rows
on conflict (code) do update
set product_id = excluded.product_id,
    description = excluded.description,
    value_type = excluded.value_type,
    value_amount = excluded.value_amount,
    currency_code = excluded.currency_code,
    discount_target = excluded.discount_target,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    rule_type = excluded.rule_type,
    rule_logic = excluded.rule_logic,
    rule_conditions = excluded.rule_conditions,
    status = excluded.status,
    updated_by_user_id = excluded.updated_by_user_id,
    updated_at = now();

commit;

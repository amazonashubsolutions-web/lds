begin;

alter table public.reservations
  add column if not exists operation_group_id uuid null references public.product_operation_groups(id);

create index if not exists idx_reservations_operation_group_id
  on public.reservations(operation_group_id);

with ranked_groups as (
  select
    pog.id,
    pog.product_id,
    pog.operation_date,
    row_number() over (
      partition by pog.product_id, pog.operation_date
      order by pog.group_order asc, pog.created_at asc
    ) as group_rank
  from public.product_operation_groups pog
  where pog.status in ('open', 'full')
),
target_groups as (
  select
    r.id as reservation_id,
    rg.id as operation_group_id
  from public.reservations r
  inner join ranked_groups rg
    on rg.product_id = r.product_id
   and rg.operation_date = r.travel_date
   and rg.group_rank = 1
  where r.operation_group_id is null
)
update public.reservations r
set operation_group_id = tg.operation_group_id
from target_groups tg
where r.id = tg.reservation_id;

commit;

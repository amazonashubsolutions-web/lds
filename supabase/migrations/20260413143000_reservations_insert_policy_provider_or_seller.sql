begin;

drop policy if exists reservations_insert_policy on public.reservations;

create policy reservations_insert_policy on public.reservations
for insert
with check (
  auth.uid() is not null
  and (
    public.is_super_user()
    or seller_agency_id = public.current_agency_id()
    or exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.provider_agency_id = public.current_agency_id()
    )
  )
);

commit;

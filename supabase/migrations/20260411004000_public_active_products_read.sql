-- Allow simple public catalog reads for active products and their related records.

create policy products_public_active_select_policy on public.products
for select
to anon
using (status = 'active');

create policy product_subcategories_public_select_policy on public.product_subcategories
for select
to anon
using (true);

create policy product_subcategory_links_public_active_select_policy on public.product_subcategory_links
for select
to anon
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);

create policy product_detail_content_public_active_select_policy on public.product_detail_content
for select
to anon
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);

create policy product_gallery_images_public_active_select_policy on public.product_gallery_images
for select
to anon
using (
  exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
);

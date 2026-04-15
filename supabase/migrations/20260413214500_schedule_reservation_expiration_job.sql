begin;

create extension if not exists pg_cron;

select cron.schedule(
  'cancel-expired-reservations',
  '*/10 * * * *',
  $$select public.cancel_expired_reserved_reservations();$$
);

commit;

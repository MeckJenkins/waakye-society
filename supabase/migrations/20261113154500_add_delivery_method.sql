alter table public.orders
  add column if not exists delivery_method text not null default 'delivery';

update public.orders
set delivery_fee = 0
where delivery_fee is not null;

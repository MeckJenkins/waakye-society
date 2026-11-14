alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists paystack_reference text,
  add column if not exists payment_method text,
  add column if not exists paid_at timestamptz;

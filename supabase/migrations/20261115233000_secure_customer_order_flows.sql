-- Secure customer order data and create trusted order/payment RPCs.
-- Apply only after the Edge Functions are configured and tested locally.
-- Preflight duplicate non-null references before creating the unique index:
-- SELECT paystack_reference, count(*)
-- FROM public.orders
-- WHERE paystack_reference IS NOT NULL
-- GROUP BY paystack_reference
-- HAVING count(*) > 1;

alter table public.orders
  add column if not exists tracking_token_hash text;

create table if not exists public.order_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  reference text not null unique,
  amount_pesewas bigint not null check (amount_pesewas > 0),
  currency text not null check (currency = 'GHS'),
  status text not null default 'initializing'
    check (status in ('initializing', 'initialized', 'failed', 'succeeded', 'duplicate_paid')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists order_payment_attempts_order_id_idx
  on public.order_payment_attempts (order_id);

grant select on table public.orders, public.order_items to service_role;
alter table public.order_payment_attempts enable row level security;
revoke all on table public.order_payment_attempts from public, anon, authenticated;
grant select, update on table public.order_payment_attempts to service_role;

create unique index if not exists orders_paystack_reference_unique
  on public.orders (paystack_reference)
  where paystack_reference is not null;

drop policy if exists restrict_orders_inserts_to_admins on public.orders;
create policy restrict_orders_inserts_to_admins
  on public.orders
  as restrictive
  for insert
  to public
  with check (public.is_admin());

drop policy if exists restrict_order_items_inserts_to_admins on public.order_items;
create policy restrict_order_items_inserts_to_admins
  on public.order_items
  as restrictive
  for insert
  to public
  with check (public.is_admin());

create or replace function public.create_customer_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_delivery_method text,
  p_delivery_address text,
  p_delivery_notes text,
  p_items jsonb,
  p_tracking_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_item jsonb;
  v_extra jsonb;
  v_line jsonb;
  v_meal record;
  v_extra_count integer;
  v_extra_name text;
  v_extra_price numeric;
  v_extra_quantity integer;
  v_quantity integer;
  v_extra_ordinal bigint;
  v_extras jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_line_total numeric;
  v_total numeric := 0;
  v_order_id uuid;
  v_special_instructions text;
  v_meal_id uuid;
begin
  if length(trim(coalesce(p_customer_name, ''))) not between 2 and 120
    or length(trim(coalesce(p_customer_phone, ''))) not between 7 and 32
    or length(trim(coalesce(p_customer_email, ''))) not between 3 and 254
    or position('@' in p_customer_email) < 2 then
    raise exception 'Invalid customer details.';
  end if;

  if p_delivery_method is null
    or p_delivery_method not in ('delivery', 'pickup')
    or (p_delivery_method = 'delivery' and length(trim(coalesce(p_delivery_address, ''))) < 3)
    or length(coalesce(p_delivery_notes, '')) > 1000 then
    raise exception 'Invalid delivery details.';
  end if;

  if p_tracking_token_hash is null
    or p_tracking_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid order tracking token.';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
    or jsonb_array_length(p_items) not between 1 and 25 then
    raise exception 'Invalid order items.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) is distinct from 'object'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]?$' then
      raise exception 'Invalid order item.';
    end if;

    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity > 20 then
      raise exception 'Invalid order quantity.';
    end if;

    begin
      v_meal_id := (v_item->>'mealId')::uuid;
    exception when others then
      raise exception 'Invalid menu item.';
    end;

    select id, name, description, price
      into v_meal
      from public.menu_items
      where id = v_meal_id
        and is_available = true;

    if not found or v_meal.price is null or v_meal.price < 0 then
      raise exception 'A selected menu item is unavailable.';
    end if;

    v_extras := '[]'::jsonb;
    if v_item ? 'extras' then
      if jsonb_typeof(v_item->'extras') is distinct from 'array' then
        raise exception 'Invalid extras.';
      end if;

      for v_extra, v_extra_ordinal in
        select value, ordinality
        from jsonb_array_elements(v_item->'extras') with ordinality
      loop
        if jsonb_typeof(v_extra) is distinct from 'object'
          or coalesce(v_extra->>'quantity', '') !~ '^[1-9][0-9]?$'
          or length(trim(coalesce(v_extra->>'name', ''))) = 0 then
          raise exception 'Invalid extra.';
        end if;

        v_extra_quantity := (v_extra->>'quantity')::integer;
        if v_extra_quantity > 10 then
          raise exception 'Invalid extra quantity.';
        end if;

        select count(*)::integer, min(name), min(price)
          into v_extra_count, v_extra_name, v_extra_price
          from public.extras
          where lower(name) = lower(trim(v_extra->>'name'))
            and is_available = true;

        if v_extra_count <> 1 or v_extra_price is null or v_extra_price < 0 then
          raise exception 'A selected extra is unavailable.';
        end if;

        v_extras := v_extras || jsonb_build_array(jsonb_build_object(
          'id', v_extra_ordinal,
          'name', v_extra_name,
          'price', v_extra_price,
          'quantity', v_extra_quantity
        ));
      end loop;
    end if;

    select coalesce(sum((extra->>'price')::numeric * (extra->>'quantity')::integer), 0)
      into v_line_total
      from jsonb_array_elements(v_extras) as selected(extra);

    v_line_total := round(v_meal.price * v_quantity + v_line_total, 2);
    v_total := v_total + v_line_total;
    v_special_instructions := left(trim(coalesce(v_item->>'specialInstructions', '')), 500);

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'meal_id', v_meal.id,
      'meal_name', v_meal.name,
      'meal_description', v_meal.description,
      'meal_price', v_meal.price,
      'quantity', v_quantity,
      'special_instructions', nullif(v_special_instructions, ''),
      'extras', v_extras,
      'line_total', v_line_total
    ));
  end loop;

  insert into public.orders (
    customer_name,
    customer_phone,
    customer_email,
    delivery_method,
    delivery_address,
    delivery_notes,
    subtotal,
    delivery_fee,
    total,
    status,
    payment_status,
    tracking_token_hash
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    lower(trim(p_customer_email)),
    p_delivery_method,
    case when p_delivery_method = 'pickup' then '' else trim(p_delivery_address) end,
    nullif(trim(coalesce(p_delivery_notes, '')), ''),
    v_total,
    0,
    v_total,
    'pending',
    'pending',
    p_tracking_token_hash
  )
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id,
      meal_id,
      meal_name,
      meal_description,
      meal_price,
      quantity,
      special_instructions,
      extras,
      line_total
    )
    values (
      v_order_id,
      (v_line->>'meal_id')::uuid,
      v_line->>'meal_name',
      v_line->>'meal_description',
      (v_line->>'meal_price')::numeric,
      (v_line->>'quantity')::integer,
      v_line->>'special_instructions',
      v_line->'extras',
      (v_line->>'line_total')::numeric
    );
  end loop;

  return jsonb_build_object(
    'orderId', v_order_id,
    'subtotal', v_total,
    'total', v_total
  );
end;
$function$;

revoke all on function public.create_customer_order(text, text, text, text, text, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.create_customer_order(text, text, text, text, text, text, jsonb, text)
  to service_role;

create or replace function public.create_order_payment_attempt(
  p_order_id uuid,
  p_tracking_token_hash text,
  p_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order record;
  v_amount_pesewas bigint;
begin
  select id, total, customer_email, payment_status, status, tracking_token_hash
    into v_order
    from public.orders
    where id = p_order_id
    for update;

  if not found
    or v_order.tracking_token_hash is distinct from p_tracking_token_hash
    or v_order.payment_status = 'paid'
    or v_order.status = 'cancelled' then
    raise exception 'Order is unavailable for payment.';
  end if;

  if p_reference !~ '^waakye_[A-Za-z0-9_-]{20,80}$' then
    raise exception 'Invalid payment reference.';
  end if;

  v_amount_pesewas := round(v_order.total * 100)::bigint;
  if v_amount_pesewas <= 0 then
    raise exception 'Invalid order amount.';
  end if;

  insert into public.order_payment_attempts (
    order_id,
    reference,
    amount_pesewas,
    currency
  )
  values (
    p_order_id,
    p_reference,
    v_amount_pesewas,
    'GHS'
  );

  return jsonb_build_object(
    'orderId', v_order.id,
    'amountPesewas', v_amount_pesewas,
    'currency', 'GHS',
    'email', v_order.customer_email
  );
end;
$function$;

revoke all on function public.create_order_payment_attempt(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_order_payment_attempt(uuid, text, text)
  to service_role;

create or replace function public.mark_order_paid(
  p_reference text,
  p_amount_pesewas bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment record;
begin
  select a.order_id, a.reference, a.amount_pesewas, a.status as attempt_status,
         o.total, o.payment_status, o.paystack_reference, o.status as order_status
    into v_payment
    from public.order_payment_attempts a
    join public.orders o on o.id = a.order_id
    where a.reference = p_reference
    for update of a, o;

  if not found then
    raise exception 'Payment reference is not recognized.';
  end if;

  if p_currency <> 'GHS'
    or p_amount_pesewas <> v_payment.amount_pesewas
    or p_amount_pesewas <> round(v_payment.total * 100)::bigint then
    raise exception 'Verified payment amount does not match the order.';
  end if;

  if v_payment.payment_status = 'paid' then
    if v_payment.paystack_reference = p_reference then
      return jsonb_build_object('paid', true, 'alreadyProcessed', true);
    end if;

    update public.order_payment_attempts
      set status = 'duplicate_paid',
          verified_at = coalesce(verified_at, now())
      where reference = p_reference;

    return jsonb_build_object('paid', false, 'duplicatePayment', true);
  end if;

  update public.orders
    set payment_status = 'paid',
        paystack_reference = p_reference,
        payment_method = 'paystack',
        paid_at = coalesce(paid_at, now()),
        status = case when status = 'pending' then 'confirmed' else status end
    where id = v_payment.order_id;

  update public.order_payment_attempts
    set status = 'succeeded',
        verified_at = coalesce(verified_at, now())
    where reference = p_reference;

  return jsonb_build_object('paid', true, 'alreadyProcessed', false);
end;
$function$;

revoke all on function public.mark_order_paid(text, bigint, text)
  from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, bigint, text)
  to service_role;

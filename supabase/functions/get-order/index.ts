import { getCorsHeaders, handleOptions, isRecord, jsonResponse, readJson } from '../_shared/http.ts';
import {
  constantTimeEqual,
  isTrackingToken,
  sha256Hex,
  createServiceClient,
} from '../_shared/supabase.ts';

Deno.serve(async (request: Request) => {
  const headers = getCorsHeaders(request);
  if (!headers) {
    return new Response('Origin not allowed', { status: 403 });
  }
  if (request.method === 'OPTIONS') {
    return handleOptions(headers);
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, headers);
  }

  try {
    const body = await readJson(request);
    if (
      !isRecord(body) ||
      typeof body.orderId !== 'string' ||
      !isTrackingToken(body.trackingToken)
    ) {
      return jsonResponse({ error: 'Order number and access code are required.' }, 400, headers);
    }

    const service = createServiceClient();
    const { data: order, error: orderError } = await service
      .from('orders')
      .select('id, created_at, status, total, tracking_token_hash')
      .eq('id', body.orderId)
      .maybeSingle();

    if (
      orderError ||
      !order ||
      typeof order.tracking_token_hash !== 'string' ||
      !constantTimeEqual(order.tracking_token_hash, await sha256Hex(body.trackingToken))
    ) {
      return jsonResponse({ error: 'Order number or access code is incorrect.' }, 404, headers);
    }

    const { data: items, error: itemsError } = await service
      .from('order_items')
      .select('id, meal_name, quantity, extras, special_instructions, line_total')
      .eq('order_id', body.orderId);

    if (itemsError || !items) {
      console.error('Order items could not be loaded.', itemsError?.code ?? 'not_found');
      return jsonResponse({ error: 'Order details could not be loaded.' }, 500, headers);
    }

    return jsonResponse({
      order: {
        id: order.id,
        created_at: order.created_at,
        status: order.status,
        total: order.total,
        order_items: items,
      },
    }, 200, headers);
  } catch (error) {
    console.error(
      'Order tracking request failed.',
      error instanceof Error ? error.message : 'unknown_error',
    );
    return jsonResponse({ error: 'Could not retrieve this order.' }, 400, headers);
  }
});

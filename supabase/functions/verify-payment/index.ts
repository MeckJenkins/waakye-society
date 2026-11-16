import { getCorsHeaders, handleOptions, isRecord, jsonResponse, readJson } from '../_shared/http.ts';
import {
  constantTimeEqual,
  isTrackingToken,
  sha256Hex,
  createServiceClient,
} from '../_shared/supabase.ts';
import { verifyAndRecordPayment } from '../_shared/payment.ts';

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
      typeof body.reference !== 'string' ||
      !isTrackingToken(body.trackingToken)
    ) {
      return jsonResponse({ error: 'Payment verification request is invalid.' }, 400, headers);
    }

    const service = createServiceClient();
    const { data: order, error: orderError } = await service
      .from('orders')
      .select('id, tracking_token_hash')
      .eq('id', body.orderId)
      .maybeSingle();

    if (
      orderError ||
      !order ||
      typeof order.tracking_token_hash !== 'string' ||
      !constantTimeEqual(order.tracking_token_hash, await sha256Hex(body.trackingToken))
    ) {
      return jsonResponse({ error: 'Order authorization is invalid.' }, 404, headers);
    }

    const { data: attempt, error: attemptError } = await service
      .from('order_payment_attempts')
      .select('order_id')
      .eq('reference', body.reference)
      .maybeSingle();

    if (attemptError || !attempt || attempt.order_id !== body.orderId) {
      return jsonResponse({ error: 'Payment reference is not valid for this order.' }, 400, headers);
    }

    const result = await verifyAndRecordPayment(body.reference);
    if (!isRecord(result)) {
      return jsonResponse({ error: 'Payment verification failed.' }, 502, headers);
    }
    return jsonResponse(result, result.duplicatePayment === true ? 409 : 200, headers);
  } catch (error) {
    console.error(
      'Payment verification request failed.',
      error instanceof Error ? error.message : 'unknown_error',
    );
    return jsonResponse({ error: 'Payment verification failed. Please try again.' }, 502, headers);
  }
});

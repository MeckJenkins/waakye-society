import { getCorsHeaders, handleOptions, isRecord, jsonResponse, readJson } from '../_shared/http.ts';
import {
  constantTimeEqual,
  isTrackingToken,
  sha256Hex,
  createServiceClient,
} from '../_shared/supabase.ts';
import { initializePaystackTransaction } from '../_shared/paystack.ts';

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
      return jsonResponse({ error: 'Order authorization is invalid.' }, 400, headers);
    }

    const service = createServiceClient();
    const { data: order, error: orderError } = await service
      .from('orders')
      .select('id, customer_email, payment_status, tracking_token_hash')
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
    if (order.payment_status === 'paid') {
      return jsonResponse({ error: 'This order has already been paid.' }, 409, headers);
    }

    const reference = `waakye_${crypto.randomUUID().replaceAll('-', '')}`;
    const { data: attempt, error: attemptError } = await service.rpc(
      'create_order_payment_attempt',
      {
        p_order_id: body.orderId,
        p_tracking_token_hash: await sha256Hex(body.trackingToken),
        p_reference: reference,
      },
    );

    if (
      attemptError ||
      !isRecord(attempt) ||
      typeof attempt.amountPesewas !== 'number' ||
      typeof attempt.email !== 'string'
    ) {
      console.error('Payment attempt creation failed.', attemptError?.code ?? 'invalid_response');
      return jsonResponse({ error: 'Payment could not be started. Please try again.' }, 409, headers);
    }

    try {
      const initialized = await initializePaystackTransaction({
        email: attempt.email,
        amountPesewas: attempt.amountPesewas,
        reference,
        orderId: body.orderId,
      });

      const { error: initializedUpdateError } = await service
        .from('order_payment_attempts')
        .update({ status: 'initialized' })
        .eq('reference', reference);
      if (initializedUpdateError) {
        console.error('Payment attempt state could not be updated.', initializedUpdateError.code);
      }

      return jsonResponse(initialized, 200, headers);
    } catch (error) {
      const { error: failedUpdateError } = await service
        .from('order_payment_attempts')
        .update({ status: 'failed' })
        .eq('reference', reference);
      if (failedUpdateError) {
        console.error('Failed payment attempt state could not be updated.', failedUpdateError.code);
      }
      console.error(
        'Paystack initialization failed.',
        error instanceof Error ? error.message : 'unknown_error',
      );
      return jsonResponse({ error: 'Payment could not be started. Please try again.' }, 502, headers);
    }
  } catch (error) {
    console.error(
      'Payment initialization request failed.',
      error instanceof Error ? error.message : 'unknown_error',
    );
    return jsonResponse({ error: 'Payment could not be started. Please try again.' }, 400, headers);
  }
});

import { isRecord, jsonResponse } from '../_shared/http.ts';
import { constantTimeEqual, createServiceClient } from '../_shared/supabase.ts';
import { createPaystackWebhookSignature } from '../_shared/paystack.ts';
import { verifyAndRecordPayment } from '../_shared/payment.ts';

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-paystack-signature')?.toLowerCase();
    if (!signature || !constantTimeEqual(signature, await createPaystackWebhookSignature(bodyText))) {
      return jsonResponse({ error: 'Invalid webhook signature.' }, 401);
    }

    const event: unknown = JSON.parse(bodyText);
    if (!isRecord(event) || event.event !== 'charge.success' || !isRecord(event.data)) {
      return jsonResponse({ received: true }, 200);
    }

    const reference = event.data.reference;
    if (typeof reference !== 'string') {
      return jsonResponse({ error: 'Webhook reference is invalid.' }, 400);
    }

    const service = createServiceClient();
    const { data: attempt, error } = await service
      .from('order_payment_attempts')
      .select('reference')
      .eq('reference', reference)
      .maybeSingle();
    if (error || !attempt) {
      return jsonResponse({ received: true }, 200);
    }

    const result = await verifyAndRecordPayment(reference);
    if (!result.paid && !result.duplicatePayment) {
      return jsonResponse({ error: 'Payment is not confirmed yet.' }, 503);
    }
    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error(
      'Paystack webhook processing failed.',
      error instanceof Error ? error.message : 'unknown_error',
    );
    return jsonResponse({ error: 'Webhook processing failed.' }, 500);
  }
});

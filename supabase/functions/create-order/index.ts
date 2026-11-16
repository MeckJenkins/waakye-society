import { getCorsHeaders, handleOptions, isRecord, jsonResponse, readJson } from '../_shared/http.ts';
import {
  createServiceClient,
  createTrackingToken,
  sha256Hex,
} from '../_shared/supabase.ts';

const isNonEmptyString = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

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
      !isNonEmptyString(body.customerName, 120) ||
      !isNonEmptyString(body.customerPhone, 32) ||
      !isNonEmptyString(body.customerEmail, 254) ||
      !body.customerEmail.includes('@') ||
      !['delivery', 'pickup'].includes(String(body.deliveryMethod)) ||
      typeof body.deliveryAddress !== 'string' ||
      typeof body.deliveryNotes !== 'string' ||
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 25
    ) {
      return jsonResponse({ error: 'Check the order details and try again.' }, 400, headers);
    }

    const items = body.items.map((item) => {
      if (
        !isRecord(item) ||
        typeof item.mealId !== 'string' ||
        !Number.isInteger(item.quantity) ||
        !Array.isArray(item.extras)
      ) {
        throw new Error('Invalid order item.');
      }

      const extras = item.extras.map((extra) => {
        if (
          !isRecord(extra) ||
          !isNonEmptyString(extra.name, 100) ||
          !Number.isInteger(extra.quantity)
        ) {
          throw new Error('Invalid order extra.');
        }
        return { name: extra.name.trim(), quantity: extra.quantity };
      });

      return {
        mealId: item.mealId,
        quantity: item.quantity,
        extras,
        specialInstructions:
          typeof item.specialInstructions === 'string' ? item.specialInstructions.slice(0, 500) : '',
      };
    });

    if (
      body.deliveryMethod === 'delivery' &&
      body.deliveryAddress.trim().length < 3
    ) {
      return jsonResponse({ error: 'A delivery address is required.' }, 400, headers);
    }

    const trackingToken = createTrackingToken();
    const service = createServiceClient();
    const { data, error } = await service.rpc('create_customer_order', {
      p_customer_name: body.customerName.trim(),
      p_customer_phone: body.customerPhone.trim(),
      p_customer_email: body.customerEmail.trim().toLowerCase(),
      p_delivery_method: body.deliveryMethod,
      p_delivery_address: body.deliveryAddress.trim(),
      p_delivery_notes: body.deliveryNotes.trim(),
      p_items: items,
      p_tracking_token_hash: await sha256Hex(trackingToken),
    });

    if (error || !isRecord(data) || typeof data.orderId !== 'string' || typeof data.total !== 'number') {
      console.error('Trusted order creation failed.', error?.code ?? 'invalid_response');
      return jsonResponse(
        { error: 'We could not create your order. Please try again.' },
        500,
        headers,
      );
    }

    return jsonResponse({
      orderId: data.orderId,
      total: data.total,
      trackingToken,
    }, 201, headers);
  } catch (error) {
    console.error(
      'Order creation request failed.',
      error instanceof Error ? error.message : 'unknown_error',
    );
    return jsonResponse({ error: 'Check the order details and try again.' }, 400, headers);
  }
});

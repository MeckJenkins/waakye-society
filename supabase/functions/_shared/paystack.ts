export interface VerifiedPaystackTransaction {
  reference: string;
  status: string;
  amount: number;
  currency: string;
}

const getPaystackSecret = () => {
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) {
    throw new Error('Paystack Edge Function secret is not configured.');
  }
  return secret;
};

export const initializePaystackTransaction = async (input: {
  email: string;
  amountPesewas: number;
  reference: string;
  orderId: string;
}) => {
  const siteUrl = Deno.env.get('SITE_URL');
  if (!siteUrl) {
    throw new Error('Site URL is not configured for payment callbacks.');
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountPesewas,
      currency: 'GHS',
      reference: input.reference,
      callback_url: `${siteUrl.replace(/\/+$/, '')}/order-success?id=${encodeURIComponent(input.orderId)}`,
      metadata: { order_id: input.orderId },
    }),
  });

  const payload: unknown = await response.json();
  if (!response.ok || !isRecord(payload) || payload.status !== true || !isRecord(payload.data)) {
    throw new Error('Paystack could not initialize the transaction.');
  }

  const authorizationUrl = payload.data.authorization_url;
  const returnedReference = payload.data.reference;
  if (typeof authorizationUrl !== 'string' || returnedReference !== input.reference) {
    throw new Error('Paystack returned an invalid transaction initialization response.');
  }

  return { authorizationUrl, reference: returnedReference };
};

export const verifyPaystackTransaction = async (
  reference: string,
): Promise<VerifiedPaystackTransaction> => {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${getPaystackSecret()}` } },
  );
  const payload: unknown = await response.json();

  if (!response.ok || !isRecord(payload) || payload.status !== true || !isRecord(payload.data)) {
    throw new Error('Paystack transaction verification failed.');
  }

  const data = payload.data;
  if (
    typeof data.reference !== 'string' ||
    typeof data.status !== 'string' ||
    typeof data.amount !== 'number' ||
    typeof data.currency !== 'string'
  ) {
    throw new Error('Paystack returned an invalid verification response.');
  }

  return {
    reference: data.reference,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createPaystackWebhookSignature = async (body: string) => {
  const secret = getPaystackSecret();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

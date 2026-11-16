import { supabase } from '@/lib/supabase';

interface PaymentInitialization {
  authorizationUrl: string;
  reference: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const initializePayment = async (
  orderId: string,
  trackingToken: string,
): Promise<PaymentInitialization> => {
  const { data, error } = await supabase.functions.invoke('initialize-payment', {
    body: { orderId, trackingToken },
  });

  if (
    error ||
    !isRecord(data) ||
    typeof data.authorizationUrl !== 'string' ||
    typeof data.reference !== 'string'
  ) {
    console.error('Paystack initialization failed:', error);
    throw new Error('Payment could not be started. Please try again.');
  }

  return {
    authorizationUrl: data.authorizationUrl,
    reference: data.reference,
  };
};

export const verifyPayment = async (
  orderId: string,
  reference: string,
  trackingToken: string,
): Promise<{ paid: boolean }> => {
  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { orderId, reference, trackingToken },
  });

  if (error || !isRecord(data) || typeof data.paid !== 'boolean') {
    console.error('Payment verification failed:', error);
    throw new Error('Payment status could not be confirmed yet.');
  }

  return { paid: data.paid };
};

import { createServiceClient } from './supabase.ts';
import { isRecord } from './http.ts';
import { verifyPaystackTransaction } from './paystack.ts';

export const verifyAndRecordPayment = async (reference: string) => {
  const service = createServiceClient();
  const { data: attempt, error: attemptError } = await service
    .from('order_payment_attempts')
    .select('amount_pesewas')
    .eq('reference', reference)
    .maybeSingle();

  if (attemptError || !attempt) {
    throw new Error('Payment reference is not recognized.');
  }

  const transaction = await verifyPaystackTransaction(reference);
  if (transaction.reference !== reference) {
    throw new Error('Verified payment reference does not match.');
  }
  if (transaction.status !== 'success') {
    return { paid: false, status: transaction.status };
  }
  if (
    transaction.currency !== 'GHS' ||
    transaction.amount !== attempt.amount_pesewas
  ) {
    throw new Error('Verified payment does not match the order amount.');
  }

  const { data, error } = await service.rpc('mark_order_paid', {
    p_reference: reference,
    p_amount_pesewas: transaction.amount,
    p_currency: transaction.currency,
  });

  if (error || !isRecord(data)) {
    console.error('Recording verified payment failed.', error?.code ?? 'invalid_response');
    throw new Error('Verified payment could not be recorded.');
  }

  return data;
};

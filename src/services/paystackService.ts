// Paystack service for handling payments
// Note: This service ONLY handles the frontend part (initializing payment)
// Payment verification happens on the server (Edge Function) for security

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

interface PaystackReferenceResponse {
  reference: string;
  trans: string;
  status: string;
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
  };
  callback: (response: PaystackReferenceResponse) => void;
  onClose: () => void;
}

interface PaystackHandler {
  openIframe: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}

interface PaystackConfig {
  email: string;
  amount: number; // In Ghana Cedis
  reference: string;
  customerName: string;
  customerPhone: string;
  onSuccess: (reference: PaystackReferenceResponse) => void;
  onClose: () => void;
}

// Generate unique reference for each transaction
export const generatePaystackReference = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `waakye_${timestamp}_${random}`;
};

// Initialize Paystack payment popup
export const initializePaystackPayment = (config: PaystackConfig) => {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack public key is not configured. Check your .env file.');
  }
  if (!window.PaystackPop) {
    throw new Error('Paystack checkout script is not loaded.');
  }

  // Convert amount from Ghana Cedis to pesewas (Paystack expects amount in kobo/pesewas)
  const amountInPesewas = Math.round(config.amount * 100);

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: amountInPesewas,
    currency: 'GHS',
    ref: config.reference,
    metadata: {
      custom_fields: [
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: config.customerName,
        },
        {
          display_name: 'Customer Phone',
          variable_name: 'customer_phone',
          value: config.customerPhone,
        },
      ],
    },
    callback: (response) => {
      config.onSuccess({
        reference: response.reference,
        trans: response.trans,
        status: response.status,
      });
    },
    onClose: () => {
      config.onClose();
    },
  });

  handler.openIframe();
};

// Verify payment on the backend (calls our Edge Function)
export const verifyPayment = async (reference: string) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ reference }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Payment verification failed');
  }

  return response.json();
};
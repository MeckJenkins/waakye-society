import { createContext } from 'react';

export type AdminAuthStatus = 'loading' | 'signedOut' | 'admin' | 'notAdmin' | 'error';

interface AdminAuthContextValue {
  status: AdminAuthStatus;
  errorMessage: string | null;
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

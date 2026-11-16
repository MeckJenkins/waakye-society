import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminAuthContext, type AdminAuthStatus } from './adminAuthState';

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [status, setStatus] = useState<AdminAuthStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentGeneration = ++generation.current;
      setErrorMessage(null);

      if (!session) {
        setStatus('signedOut');
        return;
      }

      setStatus('loading');
      setTimeout(() => {
        void (async () => {
          try {
            const { data, error } = await supabase.rpc('is_admin');
            if (!isMounted || generation.current !== currentGeneration) {
              return;
            }

            if (error) {
              console.error('Failed to verify admin authorization:', error);
              setErrorMessage(
                'Could not verify administrator access. Confirm the admin authorization SQL has been applied.',
              );
              setStatus('error');
              return;
            }

            setStatus(data === true ? 'admin' : 'notAdmin');
          } catch (error) {
            if (!isMounted || generation.current !== currentGeneration) {
              return;
            }
            console.error('Failed to verify admin authorization:', error);
            setErrorMessage('Could not verify administrator access. Please try again.');
            setStatus('error');
          }
        })();
      }, 0);
    });

    return () => {
      isMounted = false;
      generation.current += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AdminAuthContext.Provider value={{ status, errorMessage }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

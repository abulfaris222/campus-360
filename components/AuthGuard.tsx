'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

const VISIT_KEY = 'smart-campus-360-logged-in';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const loggedInForThisVisit = sessionStorage.getItem(VISIT_KEY) === 'true';

      if (pathname === '/login') {
        if (data.session && loggedInForThisVisit) {
          router.replace('/');
          return;
        }
        setChecking(false);
        return;
      }

      if (!data.session || !loggedInForThisVisit) {
        if (data.session && !loggedInForThisVisit) {
          await supabase.auth.signOut();
        }
        router.replace('/login');
        return;
      }

      setChecking(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const loggedInForThisVisit = sessionStorage.getItem(VISIT_KEY) === 'true';

      if (!session && pathname !== '/login') {
        router.replace('/login');
        return;
      }

      if (session && pathname === '/login' && loggedInForThisVisit) {
        router.replace('/');
        return;
      }

      setChecking(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checking && pathname !== '/login') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <p>Checking your campus account...</p>
      </main>
    );
  }

  return <>{children}</>;
}

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

    async function applyRoleVisibility(userId: string | null) {
      if (!userId) {
        document.body.classList.remove('admin-user');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!mounted) return;
      document.body.classList.toggle('admin-user', profile?.role === 'admin');
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const loggedInForThisVisit = sessionStorage.getItem(VISIT_KEY) === 'true';

      if (pathname === '/login') {
        document.body.classList.remove('admin-user');
        if (data.session && loggedInForThisVisit) {
          router.replace('/');
          return;
        }
        setChecking(false);
        return;
      }

      if (!data.session || !loggedInForThisVisit) {
        document.body.classList.remove('admin-user');
        if (data.session && !loggedInForThisVisit) {
          await supabase.auth.signOut();
        }
        router.replace('/login');
        return;
      }

      await applyRoleVisibility(data.session.user.id);
      setChecking(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const loggedInForThisVisit = sessionStorage.getItem(VISIT_KEY) === 'true';

      if (!session) {
        document.body.classList.remove('admin-user');
        if (pathname !== '/login') router.replace('/login');
        setChecking(false);
        return;
      }

      if (session && pathname === '/login' && loggedInForThisVisit) {
        router.replace('/');
        return;
      }

      if (loggedInForThisVisit) {
        await applyRoleVisibility(session.user.id);
      } else {
        document.body.classList.remove('admin-user');
      }

      setChecking(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      document.body.classList.remove('admin-user');
    };
  }, [pathname, router]);

  if (checking && pathname !== '/login') {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <p>Checking your campus account...</p>
      </main>
    );
  }

  return (
    <>
      <style>{`
        body:not(.admin-user) a[href="/admin"] {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}

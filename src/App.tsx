import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { HomePage } from '@/pages/HomePage';
import { supabase } from '@/lib/supabase';
import { checkForUpdate } from '@/components/UpdateChecker';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    checkForUpdate();
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      {/* Auth screen omitted here for brevity: redirect to a login form when userId is null. */}
      {userId ? <HomePage userId={userId} /> : <div>Connexion requise</div>}
    </ThemeProvider>
  );
}

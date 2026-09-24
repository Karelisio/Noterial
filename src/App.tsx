import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { HomePage } from '@/pages/HomePage';
import { AuthScreen } from '@/components/AuthScreen';
import { supabase } from '@/lib/supabase';
import { checkForUpdate } from '@/components/UpdateChecker';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setCheckingSession(false);
    });
    checkForUpdate();
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      {checkingSession ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : userId ? (
        <HomePage userId={userId} />
      ) : (
        <AuthScreen />
      )}
    </ThemeProvider>
  );
}

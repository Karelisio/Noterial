import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { HomePage } from '@/pages/HomePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useAuth } from '@/hooks/useAuth';
import { checkForUpdate } from '@/components/UpdateChecker';

export default function App() {
  const { loading, userId } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  return (
    <ThemeProvider>
      {loading || !userId ? (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      ) : showSettings ? (
        <SettingsPage onBack={() => setShowSettings(false)} />
      ) : (
        <HomePage userId={userId} onOpenSettings={() => setShowSettings(true)} />
      )}
    </ThemeProvider>
  );
}

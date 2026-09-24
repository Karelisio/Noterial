import { AppBar, Toolbar, IconButton, Typography, Box, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/AuthScreen';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { isAuthenticated, email, signOut } = useAuth();

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" onClick={onBack} aria-label="retour">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Paramètres</Typography>
        </Toolbar>
      </AppBar>

      <Box px={2} py={1} display="flex" flexDirection="column" gap={3} maxWidth={420} overflow="auto">
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Thème
          </Typography>
          <ThemeToggle />
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Compte
          </Typography>

          {isAuthenticated ? (
            <Box>
              <Typography mb={2}>{email}</Typography>
              <Button variant="outlined" color="error" onClick={() => signOut()}>
                Se déconnecter
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Noterial fonctionne entièrement hors-ligne sans compte. Connecte-toi uniquement si tu
                veux synchroniser tes notes entre plusieurs appareils.
              </Typography>
              <AuthScreen />
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

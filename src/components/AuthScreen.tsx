import { useState, type FormEvent } from 'react';
import { Box, Button, Paper, TextField, Typography, Alert, Link as MuiLink } from '@mui/material';
import { supabase } from '@/lib/supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setInfo('Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={2}
    >
      <Paper component="form" onSubmit={handleSubmit} elevation={0} variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 360 }}>
        <Typography variant="h5" fontWeight={600} mb={1}>
          Noterial
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {mode === 'signIn' ? 'Connecte-toi pour synchroniser tes notes.' : 'Crée un compte pour synchroniser tes notes.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {info && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {info}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <TextField
          label="Mot de passe"
          type="password"
          fullWidth
          required
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          inputProps={{ minLength: 6 }}
        />

        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 3, mb: 1.5 }}>
          {mode === 'signIn' ? 'Se connecter' : 'Créer un compte'}
        </Button>

        <Typography variant="body2" textAlign="center">
          {mode === 'signIn' ? "Pas encore de compte ? " : 'Déjà un compte ? '}
          <MuiLink
            component="button"
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
              setInfo(null);
            }}
          >
            {mode === 'signIn' ? "S'inscrire" : 'Se connecter'}
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}

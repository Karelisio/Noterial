import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Alert,
} from '@mui/material';
import type { Note } from '@/lib/types';

interface Props {
  notes: Note[];
  loading: boolean;
  error: string | null;
  selectedId?: string | null;
  onSelect: (note: Note) => void;
}

function preview(content: string) {
  return content.replace(/[#*_`>-]/g, '').slice(0, 90);
}

export function NoteList({ notes, loading, error, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (notes.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">Aucune note pour l’instant.</Typography>
        <Typography variant="body2" color="text.secondary">
          Touchez le bouton + pour en créer une.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {notes.map((note) => (
        <ListItemButton
          key={note.id}
          selected={note.id === selectedId}
          onClick={() => onSelect(note)}
          sx={{ borderRadius: 2, mb: 0.5, mx: 1 }}
        >
          <ListItemText
            primary={note.title || 'Sans titre'}
            secondary={preview(note.content)}
            primaryTypographyProps={{ noWrap: true, fontWeight: 500 }}
            secondaryTypographyProps={{ noWrap: true }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}

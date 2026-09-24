import { List, ListItem, ListItemText, IconButton, Box, Typography } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { sqliteService } from '@/db/sqlite.service';
import { syncService } from '@/sync/sync.service';
import type { Note } from '@/lib/types';

/** Corbeille : restauration ou suppression définitive. Liste chargée par l'appelant via sqliteService.listTrash(). */
export function Trash({ notes, onChange }: { notes: Note[]; onChange: () => void }) {
  const restore = async (id: string) => {
    await sqliteService.restore(id);
    syncService.scheduleSync();
    onChange();
  };
  const purge = async (id: string) => {
    await sqliteService.hardDelete(id);
    onChange();
  };

  if (notes.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography color="text.secondary">Corbeille vide</Typography>
      </Box>
    );
  }

  return (
    <List>
      {notes.map((n) => (
        <ListItem
          key={n.id}
          secondaryAction={
            <>
              <IconButton onClick={() => restore(n.id)} aria-label="restaurer">
                <RestoreIcon />
              </IconButton>
              <IconButton onClick={() => purge(n.id)} aria-label="supprimer définitivement">
                <DeleteForeverIcon />
              </IconButton>
            </>
          }
        >
          <ListItemText primary={n.title || 'Sans titre'} secondary={n.deleted_at} />
        </ListItem>
      ))}
    </List>
  );
}

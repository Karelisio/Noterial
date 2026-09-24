import { useState } from 'react';
import { Box, Fab, AppBar, Toolbar, Typography, useMediaQuery, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { NoteList } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { SearchBar } from '@/components/SearchBar';
import { SyncBadge } from '@/components/SyncBadge';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/lib/types';

export function HomePage({ userId, onOpenSettings }: { userId: string; onOpenSettings: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Note | null>(null);
  const { notes, loading, error, createNote, updateNote } = useNotes(userId, query);
  const isTablet = useMediaQuery('(min-width:900px)');

  const handleNew = async () => {
    const note = await createNote('', '');
    if (note) setSelected(note);
  };

  const showList = isTablet || !selected;
  const showDetail = isTablet || !!selected;

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          {!isTablet && selected && (
            <IconButton edge="start" onClick={() => setSelected(null)} aria-label="retour">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Noterial
          </Typography>
          <SyncBadge />
          <IconButton onClick={onOpenSettings} aria-label="paramètres">
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box display="flex" flexGrow={1} overflow="hidden">
        {showList && (
          <Box
            width={isTablet ? 360 : '100%'}
            borderRight={isTablet ? 1 : 0}
            borderColor="divider"
            display="flex"
            flexDirection="column"
            overflow="auto"
          >
            <Box px={2} py={1}>
              <SearchBar onSearch={setQuery} />
            </Box>
            <NoteList
              notes={notes}
              loading={loading}
              error={error}
              selectedId={selected?.id}
              onSelect={setSelected}
            />
          </Box>
        )}

        {showDetail && (
          <Box flexGrow={1} overflow="hidden">
            {selected ? (
              <NoteEditor
                note={selected}
                onChange={(title, content) => {
                  updateNote(selected.id, title, content);
                  setSelected({ ...selected, title, content });
                }}
              />
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                <Typography color="text.secondary">Sélectionnez une note</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Fab
        color="primary"
        onClick={handleNew}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        aria-label="nouvelle note"
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}

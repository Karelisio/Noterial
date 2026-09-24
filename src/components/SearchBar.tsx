import { useEffect, useRef, useState } from 'react';
import { InputBase, Paper, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface Props {
  onSearch: (query: string) => void;
  debounceMs?: number;
}

export function SearchBar({ onSearch, debounceMs = 200 }: Props) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(value), debounceMs);
    return () => timer.current && clearTimeout(timer.current);
  }, [value, debounceMs, onSearch]);

  return (
    <Paper
      component="form"
      onSubmit={(e) => e.preventDefault()}
      sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 3 }}
      elevation={0}
      variant="outlined"
    >
      <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
      <InputBase
        fullWidth
        placeholder="Rechercher une note…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputProps={{ 'aria-label': 'rechercher' }}
      />
      {value && (
        <IconButton size="small" onClick={() => setValue('')} aria-label="effacer">
          <ClearIcon fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { sqliteService } from '@/db/sqlite.service';
import { syncService } from '@/sync/sync.service';
import type { Note } from '@/lib/types';

export function useNotes(userId: string | null, searchQuery: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const rows = searchQuery.trim()
        ? await sqliteService.search(userId, searchQuery)
        : await sqliteService.listActive(userId);
      setNotes(rows);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (title: string, content: string) => {
      if (!userId) return null;
      const note = await sqliteService.createNote(userId, title, content);
      await refresh();
      syncService.scheduleSync();
      return note;
    },
    [userId, refresh],
  );

  const updateNote = useCallback(
    async (id: string, title: string, content: string) => {
      await sqliteService.updateNote(id, title, content);
      await refresh();
      syncService.scheduleSync();
    },
    [refresh],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await sqliteService.softDelete(id);
      await refresh();
      syncService.scheduleSync();
    },
    [refresh],
  );

  return { notes, loading, error, refresh, createNote, updateNote, deleteNote };
}

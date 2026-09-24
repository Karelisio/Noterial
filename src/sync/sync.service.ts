import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/lib/supabase';
import { sqliteService } from '@/db/sqlite.service';
import type { Note, SyncStatus } from '@/lib/types';

const CURSOR_KEY = 'sync_cursor';
type Listener = (status: SyncStatus) => void;

class SyncService {
  private listeners = new Set<Listener>();
  private status: SyncStatus = 'pending';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;

  onStatusChange(fn: Listener) {
    this.listeners.add(fn);
    fn(this.status);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setStatus(s: SyncStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  init() {
    Network.addListener('networkStatusChange', (state) => {
      if (state.connected) this.syncNow();
    });
    this.syncNow();
  }

  /** Called after each local mutation; coalesces bursts of edits. */
  scheduleSync(delayMs = 800) {
    this.setStatus('pending');
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.syncNow(), delayMs);
  }

  async syncNow() {
    if (this.syncing) return;
    const { connected } = await Network.getStatus();
    if (!connected) {
      this.setStatus('pending');
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    this.syncing = true;
    try {
      await this.push(userId);
      await this.pull(userId);
      this.setStatus('synced');
    } catch (err) {
      console.error('[sync] failed', err);
      this.setStatus('error');
    } finally {
      this.syncing = false;
    }
  }

  private async push(userId: string) {
    const dirty = await sqliteService.getDirty(userId);
    if (dirty.length === 0) return;

    const { error } = await supabase.from('notes').upsert(
      dirty.map((n) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        content: n.content,
        created_at: n.created_at,
        updated_at: n.updated_at,
        deleted_at: n.deleted_at,
      })),
      { onConflict: 'id' },
    );
    if (error) throw error;

    const syncedAt = new Date().toISOString();
    await Promise.all(dirty.map((n) => sqliteService.markSynced(n.id, syncedAt)));
  }

  private async pull(userId: string) {
    const { value: cursor } = await Preferences.get({ key: CURSOR_KEY });
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });
    if (cursor) query = query.gt('updated_at', cursor);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return;

    const now = new Date().toISOString();
    for (const remote of data as Note[]) {
      await sqliteService.upsertFromRemote({ ...remote, synced_at: now });
    }
    const latest = data[data.length - 1].updated_at;
    await Preferences.set({ key: CURSOR_KEY, value: latest });
  }
}

export const syncService = new SyncService();

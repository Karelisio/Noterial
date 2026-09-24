export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  synced_at: string | null;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

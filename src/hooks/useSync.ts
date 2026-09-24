import { useEffect, useState } from 'react';
import { syncService } from '@/sync/sync.service';
import type { SyncStatus } from '@/lib/types';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('pending');

  useEffect(() => {
    const unsub = syncService.onStatusChange(setStatus);
    syncService.init();
    return unsub;
  }, []);

  return { status, syncNow: () => syncService.syncNow() };
}

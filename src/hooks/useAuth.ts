import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrCreateLocalUserId } from '@/lib/localUser';
import { sqliteService } from '@/db/sqlite.service';
import { syncService } from '@/sync/sync.service';

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
  email: string | null;
  /** Real account id once logged in, otherwise a stable per-device id — notes always have an owner. */
  userId: string | null;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [session, setSession] = useState<{ id: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const localUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getOrCreateLocalUserId().then((id) => {
      localUserIdRef.current = id;
      if (mounted) setLocalUserId(id);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ? { id: data.session.user.id, email: data.session.user.email ?? null } : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      const previousLocalId = localUserIdRef.current;
      if (event === 'SIGNED_IN' && newSession && previousLocalId && previousLocalId !== newSession.user.id) {
        sqliteService.reassignOwner(previousLocalId, newSession.user.id).then(() => syncService.scheduleSync(0));
      }
      setSession(newSession ? { id: newSession.user.id, email: newSession.user.email ?? null } : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    loading: loading || localUserId === null,
    isAuthenticated: !!session,
    email: session?.email ?? null,
    userId: session?.id ?? localUserId,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}

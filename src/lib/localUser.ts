import { Preferences } from '@capacitor/preferences';
import { v4 as uuid } from 'uuid';

const LOCAL_USER_ID_KEY = 'local_user_id';

/** Stable per-device id used to own notes before the user ever logs in. */
export async function getOrCreateLocalUserId(): Promise<string> {
  const { value } = await Preferences.get({ key: LOCAL_USER_ID_KEY });
  if (value) return value;
  const id = uuid();
  await Preferences.set({ key: LOCAL_USER_ID_KEY, value: id });
  return id;
}

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { sqliteService } from '@/db/sqlite.service';
import { syncService } from '@/sync/sync.service';
import type { Note } from '@/lib/types';

/** Export d'une note en .md ou .txt puis partage natif. */
export async function exportNote(note: Note, format: 'md' | 'txt') {
  const fileName = `${note.title || 'note'}.${format}`;
  const content = format === 'md' ? note.content : note.content.replace(/[#*_`>-]/g, '');

  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  await Share.share({ title: fileName, url: uri, dialogTitle: 'Exporter la note' });
}

/** Import multi-fichiers .md/.txt (sur web : drag-drop appelle directement cette fonction avec les File). */
export async function importFiles(userId: string, files: FileList | File[]) {
  for (const file of Array.from(files)) {
    if (!/\.(md|txt)$/i.test(file.name)) continue;
    const content = await file.text();
    const title = file.name.replace(/\.(md|txt)$/i, '');
    await sqliteService.createNote(userId, title, content);
  }
  syncService.scheduleSync();
}

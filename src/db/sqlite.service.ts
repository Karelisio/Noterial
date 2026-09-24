import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { v4 as uuid } from 'uuid';
import type { Note } from '@/lib/types';

const DB_NAME = 'noterial.db';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title, content, content='notes', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES ('delete', old.rowid, old.title, old.content);
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
END;
`;

class SqliteService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init() {
    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.initWebStore();
    }
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;
    this.db = isConn
      ? await this.sqlite.retrieveConnection(DB_NAME, false)
      : await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.db.execute(SCHEMA);
  }

  async whenReady() {
    await this.ready;
    return this.db;
  }

  async createNote(userId: string, title: string, content: string): Promise<Note> {
    const db = await this.whenReady();
    const now = new Date().toISOString();
    const note: Note = {
      id: uuid(),
      user_id: userId,
      title,
      content,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      synced_at: null,
    };
    await db.run(
      `INSERT INTO notes (id, user_id, title, content, created_at, updated_at, deleted_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [note.id, note.user_id, note.title, note.content, note.created_at, note.updated_at],
    );
    return note;
  }

  async updateNote(id: string, title: string, content: string) {
    const db = await this.whenReady();
    const now = new Date().toISOString();
    await db.run(`UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?`, [
      title,
      content,
      now,
      id,
    ]);
  }

  async softDelete(id: string) {
    const db = await this.whenReady();
    const now = new Date().toISOString();
    await db.run(`UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
  }

  async restore(id: string) {
    const db = await this.whenReady();
    const now = new Date().toISOString();
    await db.run(`UPDATE notes SET deleted_at = NULL, updated_at = ? WHERE id = ?`, [now, id]);
  }

  async hardDelete(id: string) {
    const db = await this.whenReady();
    await db.run(`DELETE FROM notes WHERE id = ?`, [id]);
  }

  async listActive(userId: string): Promise<Note[]> {
    const db = await this.whenReady();
    const res = await db.query(
      `SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC`,
      [userId],
    );
    return (res.values as Note[]) ?? [];
  }

  async listTrash(userId: string): Promise<Note[]> {
    const db = await this.whenReady();
    const res = await db.query(
      `SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
      [userId],
    );
    return (res.values as Note[]) ?? [];
  }

  async search(userId: string, query: string): Promise<Note[]> {
    const db = await this.whenReady();
    if (!query.trim()) return this.listActive(userId);
    const res = await db.query(
      `SELECT notes.* FROM notes
       JOIN notes_fts ON notes.rowid = notes_fts.rowid
       WHERE notes.user_id = ? AND notes.deleted_at IS NULL AND notes_fts MATCH ?
       ORDER BY notes.updated_at DESC`,
      [userId, `${query}*`],
    );
    return (res.values as Note[]) ?? [];
  }

  /** Rows needing push: local update newer than last sync. */
  async getDirty(userId: string): Promise<Note[]> {
    const db = await this.whenReady();
    const res = await db.query(
      `SELECT * FROM notes WHERE user_id = ? AND (synced_at IS NULL OR updated_at > synced_at)`,
      [userId],
    );
    return (res.values as Note[]) ?? [];
  }

  async markSynced(id: string, syncedAt: string) {
    const db = await this.whenReady();
    await db.run(`UPDATE notes SET synced_at = ? WHERE id = ?`, [syncedAt, id]);
  }

  /** Upsert a row pulled from the remote (last-write-wins on updated_at). */
  async upsertFromRemote(note: Note) {
    const db = await this.whenReady();
    const existing = await db.query(`SELECT updated_at FROM notes WHERE id = ?`, [note.id]);
    const row = existing.values?.[0];
    if (row && new Date(row.updated_at) >= new Date(note.updated_at)) return;
    await db.run(
      `INSERT INTO notes (id, user_id, title, content, created_at, updated_at, deleted_at, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, content = excluded.content,
         updated_at = excluded.updated_at, deleted_at = excluded.deleted_at,
         synced_at = excluded.synced_at`,
      [
        note.id,
        note.user_id,
        note.title,
        note.content,
        note.created_at,
        note.updated_at,
        note.deleted_at,
        note.synced_at,
      ],
    );
  }
}

export const sqliteService = new SqliteService();

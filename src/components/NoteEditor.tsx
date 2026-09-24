import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Divider, TextField, Tabs, Tab, Paper } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TitleIcon from '@mui/icons-material/Title';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { marked } from 'marked';
import type { Note } from '@/lib/types';

interface Props {
  note: Note;
  onChange: (title: string, content: string) => void;
}

type Wrap = 'bold' | 'italic' | 'heading' | 'list';

function applyWrap(text: string, start: number, end: number, kind: Wrap) {
  const selected = text.slice(start, end);

  if (kind === 'bold' || kind === 'italic') {
    const marker = kind === 'bold' ? '**' : '_';
    const isWrapped = selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2;
    const next = isWrapped ? selected.slice(marker.length, -marker.length) : `${marker}${selected}${marker}`;
    return {
      text: text.slice(0, start) + next + text.slice(end),
      selectionStart: start,
      selectionEnd: start + next.length,
    };
  }

  if (kind === 'heading') {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const line = text.slice(lineStart, text.indexOf('\n', start) === -1 ? text.length : text.indexOf('\n', start));
    const hasHeading = line.startsWith('# ');
    const newLine = hasHeading ? line.slice(2) : `# ${line}`;
    const lineEnd = lineStart + line.length;
    return {
      text: text.slice(0, lineStart) + newLine + text.slice(lineEnd),
      selectionStart: lineStart,
      selectionEnd: lineStart + newLine.length,
    };
  }

  // list: toggle "- " on each selected line
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const blockEnd = text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end);
  const block = text.slice(lineStart, blockEnd);
  const lines = block.split('\n');
  const allListed = lines.every((l) => l.startsWith('- ') || l.trim() === '');
  const newLines = lines.map((l) => {
    if (l.trim() === '') return l;
    return allListed ? l.replace(/^- /, '') : `- ${l}`;
  });
  const newBlock = newLines.join('\n');
  return {
    text: text.slice(0, lineStart) + newBlock + text.slice(blockEnd),
    selectionStart: lineStart,
    selectionEnd: lineStart + newBlock.length,
  };
}

export function NoteEditor({ note, onChange }: Props) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (title !== note.title || content !== note.content) onChange(title, content);
    }, 400);
    return () => clearTimeout(t);
  }, [title, content]);

  const html = useMemo(() => marked.parse(content) as string, [content]);

  const format = (kind: Wrap) => {
    const el = textareaRef.current;
    if (!el) return;
    const result = applyWrap(content, el.selectionStart, el.selectionEnd, kind);
    setContent(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <TextField
        variant="standard"
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        InputProps={{ disableUnderline: true, sx: { fontSize: 24, fontWeight: 600 } }}
        sx={{ px: 2, pt: 2 }}
      />

      <Box display="flex" alignItems="center" px={1} py={0.5}>
        <IconButton size="small" onClick={() => format('bold')} aria-label="gras">
          <FormatBoldIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => format('italic')} aria-label="italique">
          <FormatItalicIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => format('heading')} aria-label="titre">
          <TitleIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => format('list')} aria-label="liste">
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
        <Box flexGrow={1} />
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 32 }}>
          <Tab value="write" label="Édition" sx={{ minHeight: 32, py: 0 }} />
          <Tab value="preview" label="Aperçu" sx={{ minHeight: 32, py: 0 }} />
        </Tabs>
      </Box>
      <Divider />

      {tab === 'write' ? (
        <TextField
          inputRef={textareaRef}
          multiline
          fullWidth
          variant="standard"
          placeholder="Écrivez en Markdown…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          InputProps={{ disableUnderline: true }}
          sx={{ px: 2, py: 1, flexGrow: 1, overflow: 'auto', '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
        />
      ) : (
        <Paper
          elevation={0}
          sx={{ px: 2, py: 1, flexGrow: 1, overflow: 'auto' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </Box>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Table, ImageIcon, Underline, Code } from 'lucide-react';

interface RichTextEditorProps {
  readonly label?: string;
  readonly value?: string;
  readonly onChange?: (html: string) => void;
  readonly placeholder?: string;
}

const toolbarButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/70 text-slate-200 shadow-sm transition hover:border-sky-500/60 hover:text-white';

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Γράψε εδώ…',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const nextValue = value || '';
    if (el.innerHTML === nextValue) return;
    el.innerHTML = nextValue;
  }, [value]);

  const handleCommand = (command: string, arg?: string) => {
    if (!mounted) return;
    document.execCommand(command, false, arg);
    notifyChange();
  };

  const insertTable = () => {
    if (!editorRef.current) return;
    const tableHtml =
      '<table class="min-w-full border border-slate-700 text-left text-sm text-slate-200"><thead><tr><th class="border border-slate-700 px-3 py-2">Col 1</th><th class="border border-slate-700 px-3 py-2">Col 2</th></tr></thead><tbody><tr><td class="border border-slate-700 px-3 py-2">---</td><td class="border border-slate-700 px-3 py-2">---</td></tr></tbody></table>';
    editorRef.current.focus();
    document.execCommand('insertHTML', false, tableHtml);
    notifyChange();
  };

  const insertImage = () => {
    const url = window.prompt('Εισαγωγή εικόνας από URL:');
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  const notifyChange = () => {
    if (!editorRef.current) return;
    onChange?.(editorRef.current.innerHTML);
  };

  const showPlaceholder = mounted && !focused && (!value || value.trim() === '');

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-slate-200">{label}</label>}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800/70 bg-slate-900/70 p-2">
        <button type="button" onClick={() => handleCommand('bold')} className={toolbarButton}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => handleCommand('italic')} className={toolbarButton}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => handleCommand('underline')} className={toolbarButton}>
          <Underline className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => handleCommand('insertUnorderedList')} className={toolbarButton}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => handleCommand('insertOrderedList')} className={toolbarButton}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => handleCommand('formatBlock', '<pre>')} className={toolbarButton}>
          <Code className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertTable} className={toolbarButton}>
          <Table className="h-4 w-4" />
        </button>
        <button type="button" onClick={insertImage} className={toolbarButton}>
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative">
        {showPlaceholder && (
          <span className="pointer-events-none absolute left-3 top-3 text-slate-500">{placeholder}</span>
        )}
        <div
          ref={editorRef}
          className="min-h-[200px] whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left text-slate-100 outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={notifyChange}
          onBlur={() => {
            setFocused(false);
            notifyChange();
          }}
          onFocus={() => setFocused(true)}
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'plaintext', textAlign: 'left' }}
          data-testid="rich-text-editor"
        />
      </div>
    </div>
  );
}

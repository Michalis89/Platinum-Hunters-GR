'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, Quote } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type DiaryTiptapEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: 'en' | 'el' | 'und';
  placeholder?: string;
  showOfflineDraftHint?: boolean;
  onReconnectSync?: () => Promise<number>;
};

function ToolbarButton({
  isActive,
  onClick,
  label,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={isActive ? 'primary' : 'ghost'}
      iconOnly
      className={[
        'min-h-11 min-w-11 rounded-[var(--radius-md)] border',
        isActive
          ? 'border-[hsl(var(--accent-primary)/0.45)] bg-[hsl(var(--accent-muted)/0.92)] text-[hsl(var(--text-primary))]'
          : 'border-[hsl(var(--border-subtle)/0.76)] bg-[hsl(var(--surface-overlay)/0.45)] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover)/0.76)] hover:text-[hsl(var(--text-primary))]',
      ].join(' ')}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  );
}

export default function DiaryTiptapEditor({
  value,
  onChange,
  language = 'und',
  placeholder = 'Write freely. Your words stay encrypted before they ever leave this browser.',
  showOfflineDraftHint = false,
  onReconnectSync,
}: DiaryTiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-[hsl(var(--text-tertiary))] before:float-left before:h-0 before:pointer-events-none',
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        lang: language,
        class:
          'min-h-full px-7 py-6 text-[16px] leading-[1.85] text-[hsl(var(--text-primary))] outline-none sm:px-8 sm:py-7',
      },
    },
    onUpdate: ({ editor: editorInstance }) => {
      onChange(editorInstance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.view.dom.setAttribute('lang', language);
  }, [editor, language]);

  useEffect(() => {
    if (!onReconnectSync) {
      return;
    }

    const handleOnline = async () => {
      const syncedCount = await onReconnectSync();
      if (syncedCount > 0) {
        toast.success('Draft synced');
      }
    };
    const onOnline = () => {
      void handleOnline();
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, [onReconnectSync]);

  if (!editor) {
    return (
      <div className="h-full min-h-[360px] animate-pulse rounded-[var(--radius-lg)] border border-[hsl(var(--border-subtle)/0.7)] bg-[hsl(var(--surface-overlay)/0.52)]" />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[hsl(var(--border-strong)/0.9)] bg-[hsl(var(--surface-overlay)/0.9)] shadow-[var(--shadow-md)]">
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-[hsl(var(--border-default)/0.82)] bg-[hsl(var(--surface-raised)/0.94)] px-2.5 py-2">
        <ToolbarButton
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-0 flex-1 overflow-y-auto pb-8 [&_.ProseMirror]:min-h-full [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[hsl(var(--accent-primary)/0.6)] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_li]:my-1 [&_.ProseMirror_p]:my-2.5 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
      />
      {showOfflineDraftHint ? (
        <p className="border-t border-[hsl(var(--border-subtle)/0.7)] px-4 py-2 text-xs text-muted-foreground sm:px-5">
          Saved offline - will sync on reconnect
        </p>
      ) : null}
    </div>
  );
}

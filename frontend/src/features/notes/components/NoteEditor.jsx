import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef } from 'react';
import { NOTE_CONTENT_PLACEHOLDER } from '../constants/index.js';

/**
 * Rich text editor component wrapping TipTap.
 * Uses ProseMirror JSON for structured persistence.
 *
 * @param {Object} props
 * @param {Object|null} props.initialContent - ProseMirror JSON document
 * @param {Function} props.onChange - Callback invoked when content changes, receiving JSON
 * @param {boolean} [props.editable=true] - Whether the editor is read-only
 */
export function NoteEditor({ initialContent, onChange, editable = true }) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: NOTE_CONTENT_PLACEHOLDER,
      }),
    ],
    content: initialContent || { type: 'doc', content: [] },
    onUpdate: ({ editor: activeEditor }) => {
      if (isUpdatingRef.current) return;
      if (onChange) {
        const json = activeEditor.getJSON();
        onChange(json);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[350px] px-6 py-4 text-foreground',
      },
    },
  });

  // Synchronize external note content change when switching notes
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentJson = JSON.stringify(editor.getJSON());
      const nextJson = JSON.stringify(initialContent || { type: 'doc', content: [] });

      if (currentJson !== nextJson) {
        isUpdatingRef.current = true;
        editor.commands.setContent(initialContent || { type: 'doc', content: [] });
        isUpdatingRef.current = false;
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-border bg-card">
      {/* Editor Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2 text-xs">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 font-bold ${
            editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 italic ${
            editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded px-2 py-1 underline ${
            editor.isActive('underline') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded px-2 py-1 line-through ${
            editor.isActive('strike') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          S
        </button>

        <span className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded px-2 py-1 font-semibold ${
            editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 font-semibold ${
            editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded px-2 py-1 font-semibold ${
            editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          H3
        </button>

        <span className="h-4 w-px bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 ${
            editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Bullet List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-2 py-1 ${
            editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Ordered List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`rounded px-2 py-1 ${
            editor.isActive('taskList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Tasks
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`rounded px-2 py-1 font-mono ${
            editor.isActive('codeBlock') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Code
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}

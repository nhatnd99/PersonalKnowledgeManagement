import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';

import { FontSize } from '../extensions/FontSize.js';
import { InternalNoteLink } from '../extensions/InternalNoteLink.js';
import { SlashCommands } from '../extensions/SlashCommands.js';
import { SLASH_COMMANDS } from './editor/slashCommandItems.js';

import { EditorToolbar } from './editor/EditorToolbar.jsx';
import { EditorBubbleMenu } from './editor/EditorBubbleMenu.jsx';
import { SlashCommandMenu } from './editor/SlashCommandMenu.jsx';
import { LinkDialog } from './editor/LinkDialog.jsx';
import { ImageDialog } from './editor/ImageDialog.jsx';
import { InternalNoteLinkDialog } from './editor/InternalNoteLinkDialog.jsx';

/**
 * Advanced Note Rich Text Editor wrapping TipTap.
 * Provides Notion/Obsidian/Confluence-style writing experience with:
 * - Full inline formatting, multi-color highlighting, and text colors
 * - Blockquote, CodeBlock with syntax highlighting, tables, responsive images
 * - Floating BubbleMenu on text selection
 * - Lightweight Slash Commands palette (`/`)
 * - In-text Internal Note Links (`data-note-id`)
 * - ProseMirror JSON structured persistence
 */
export function NoteEditor({ initialContent, onChange, editable = true }) {
  const navigate = useNavigate();
  const isUpdatingRef = useRef(false);

  // Modal dialog states
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isNoteLinkDialogOpen, setIsNoteLinkDialogOpen] = useState(false);

  // Slash command menu state
  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    props: null,
    clientRect: null,
  });

  const handleOpenLinkDialog = useCallback(() => setIsLinkDialogOpen(true), []);
  const handleOpenImageDialog = useCallback(() => setIsImageDialogOpen(true), []);
  const handleOpenNoteLinkDialog = useCallback(() => setIsNoteLinkDialogOpen(true), []);

  const slashSuggestionConfig = useMemo(
    () => ({
      char: '/',
      items: ({ query }) => {
        const q = query.toLowerCase();
        return SLASH_COMMANDS.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.aliases.some((a) => a.toLowerCase().includes(q))
        );
      },
      render: () => ({
        onStart: (props) => {
          setSlashMenuState({
            isOpen: true,
            props,
            clientRect: props.clientRect,
          });
        },
        onUpdate: (props) => {
          setSlashMenuState({
            isOpen: true,
            props,
            clientRect: props.clientRect,
          });
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            setSlashMenuState({ isOpen: false, props: null, clientRect: null });
            return true;
          }
          if (window.__slashMenuKeyDown) {
            return window.__slashMenuKeyDown(props.event);
          }
          return false;
        },
        onExit: () => {
          setSlashMenuState({ isOpen: false, props: null, clientRect: null });
        },
      }),
    }),
    []
  );

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // Replaced by CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      InternalNoteLink,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or start writing...",
      }),
      SlashCommands.configure({
        suggestion: slashSuggestionConfig,
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
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[420px] px-8 py-6 text-foreground font-normal leading-relaxed',
      },
    },
  });

  // Synchronize external note content when switching active note
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

  // Handle in-text internal note link clicks
  const handleEditorClick = useCallback(
    (e) => {
      const internalLinkEl = e.target.closest('a[data-note-id]');
      if (internalLinkEl) {
        e.preventDefault();
        const noteId = internalLinkEl.getAttribute('data-note-id');
        if (noteId) {
          navigate(`/notes/${noteId}`);
        }
      }
    },
    [navigate]
  );

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-xs animate-pulse">
        Initializing Rich Text Editor...
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Master Toolbar */}
      <EditorToolbar
        editor={editor}
        onOpenLinkDialog={handleOpenLinkDialog}
        onOpenImageDialog={handleOpenImageDialog}
        onOpenNoteLinkDialog={handleOpenNoteLinkDialog}
      />

      {/* Floating Contextual Bubble Menu on Selection */}
      <EditorBubbleMenu
        editor={editor}
        onOpenLinkDialog={handleOpenLinkDialog}
      />

      {/* Slash Commands Floating Menu */}
      <SlashCommandMenu
        isOpen={slashMenuState.isOpen}
        props={slashMenuState.props}
        clientRect={slashMenuState.clientRect}
        onClose={() => setSlashMenuState({ isOpen: false, props: null, clientRect: null })}
        onOpenImageDialog={handleOpenImageDialog}
        onOpenNoteLinkDialog={handleOpenNoteLinkDialog}
      />

      {/* Editor Content Area */}
      <div
        onClick={handleEditorClick}
        className="flex-1 overflow-y-auto cursor-text bg-background/50"
      >
        <EditorContent editor={editor} />
      </div>

      {/* Dialog Modals */}
      <LinkDialog
        editor={editor}
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
      />

      <ImageDialog
        editor={editor}
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
      />

      <InternalNoteLinkDialog
        editor={editor}
        isOpen={isNoteLinkDialogOpen}
        onClose={() => setIsNoteLinkDialogOpen(false)}
      />
    </div>
  );
}

NoteEditor.propTypes = {
  initialContent: PropTypes.object,
  onChange: PropTypes.func,
  editable: PropTypes.bool,
};

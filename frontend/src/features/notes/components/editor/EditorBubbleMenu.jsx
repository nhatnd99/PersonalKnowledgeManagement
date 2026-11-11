import PropTypes from 'prop-types';
import { BubbleMenu } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
} from 'lucide-react';

/**
 * Contextual floating formatting toolbar displayed upon text selection.
 */
export function EditorBubbleMenu({ editor, onOpenLinkDialog }) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150, zIndex: 40 }}
      shouldShow={({ state, from, to }) => {
        const { doc, selection } = state;
        const { empty } = selection;
        // Only show if there is non-empty text selection and not inside a code block
        if (empty || from === to || editor.isActive('codeBlock')) {
          return false;
        }
        const text = doc.textBetween(from, to).trim();
        return text.length > 0;
      }}
      className="flex items-center gap-0.5 rounded-xl border border-border bg-card/95 p-1 shadow-2xl backdrop-blur-md text-xs"
    >
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        title="Bold (Ctrl+B)"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('bold')
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Bold className="h-3.5 w-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleItalic().run();
        }}
        title="Italic (Ctrl+I)"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('italic')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleUnderline().run();
        }}
        title="Underline (Ctrl+U)"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('underline')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleStrike().run();
        }}
        title="Strikethrough"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('strike')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </button>

      {/* Inline Code */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleCode().run();
        }}
        title="Inline Code"
        className={`p-1.5 rounded-md font-mono transition-colors ${
          editor.isActive('code')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Code className="h-3.5 w-3.5" />
      </button>

      {/* Highlight Toggle */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run();
        }}
        title="Highlight"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('highlight')
            ? 'bg-amber-400/30 text-amber-600 dark:text-amber-300 font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <Highlighter className="h-3.5 w-3.5" />
      </button>

      <div className="h-3.5 w-px bg-border mx-0.5" />

      {/* Link */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (onOpenLinkDialog) {
            onOpenLinkDialog();
          }
        }}
        title="Insert/Edit Link (Ctrl+K)"
        className={`p-1.5 rounded-md transition-colors ${
          editor.isActive('link')
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
    </BubbleMenu>
  );
}

EditorBubbleMenu.propTypes = {
  editor: PropTypes.object,
  onOpenLinkDialog: PropTypes.func,
};

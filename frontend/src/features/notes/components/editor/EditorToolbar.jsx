import PropTypes from 'prop-types';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Bookmark,
} from 'lucide-react';

import { HeadingSelector } from './HeadingSelector.jsx';
import { TextColorPicker } from './TextColorPicker.jsx';
import { HighlightColorPicker } from './HighlightColorPicker.jsx';
import { TableMenu } from './TableMenu.jsx';
import { AlignmentMenu } from './AlignmentMenu.jsx';

/**
 * Redesigned master toolbar for NoteEditor.
 * Organized into logical groups: History, Headings, Text formatting, Colors, Alignment, Lists, Rich Blocks, Actions.
 */
export function EditorToolbar({
  editor,
  onOpenLinkDialog,
  onOpenImageDialog,
  onOpenNoteLinkDialog,
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1.5 text-xs select-none">
      {/* Group 1: Undo & Redo */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 2: Headings & Paragraph Selector */}
      <HeadingSelector editor={editor} />

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 3: Inline Text Formatting */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bold')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('italic')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('underline')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('strike')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
          className={`p-1.5 rounded-md font-mono transition-colors ${
            editor.isActive('code')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 4: Colors (Text Color & Highlight) */}
      <div className="flex items-center gap-1">
        <TextColorPicker editor={editor} />
        <HighlightColorPicker editor={editor} />
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 5: Text Alignment */}
      <AlignmentMenu editor={editor} />

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 6: Lists */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List (Ctrl+Shift+8)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List (Ctrl+Shift+7)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Task List"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('taskList')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 7: Blocks & Elements */}
      <div className="flex items-center gap-0.5">
        {/* Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        {/* Code Block */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('codeBlock')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
        </button>

        {/* Horizontal Divider */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Divider"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Table Menu */}
        <TableMenu editor={editor} />

        {/* Hyperlink */}
        <button
          type="button"
          onClick={onOpenLinkDialog}
          title="Hyperlink (Ctrl+K)"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('link')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* Internal Note Link */}
        <button
          type="button"
          onClick={onOpenNoteLinkDialog}
          title="Internal Note Link"
          className={`p-1.5 rounded-md transition-colors ${
            editor.isActive('internalNoteLink')
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
        </button>

        {/* Image Dialog */}
        <button
          type="button"
          onClick={onOpenImageDialog}
          title="Insert Image"
          className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Group 8: Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-auto"
      >
        <RemoveFormatting className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

EditorToolbar.propTypes = {
  editor: PropTypes.object,
  onOpenLinkDialog: PropTypes.func.isRequired,
  onOpenImageDialog: PropTypes.func.isRequired,
  onOpenNoteLinkDialog: PropTypes.func.isRequired,
};

import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Table,
  Image as ImageIcon,
  Link,
} from 'lucide-react';

export const SLASH_COMMANDS = [
  {
    title: 'Text',
    description: 'Just start writing with plain text paragraph',
    icon: Pilcrow,
    aliases: ['p', 'paragraph', 'text'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Large primary section heading',
    icon: Heading1,
    aliases: ['h1', 'heading1', 'title'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium subsection heading',
    icon: Heading2,
    aliases: ['h2', 'heading2', 'subtitle'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section sub-heading',
    icon: Heading3,
    aliases: ['h3', 'heading3'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bulleted list',
    icon: List,
    aliases: ['ul', 'bullet', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with ordered numbers',
    icon: ListOrdered,
    aliases: ['ol', 'numbered', 'ordered'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Track tasks with checkboxes',
    icon: CheckSquare,
    aliases: ['todo', 'task', 'checklist'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote or highlighted callout',
    icon: Quote,
    aliases: ['quote', 'blockquote'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Display syntax-highlighted code snippet',
    icon: Code,
    aliases: ['code', 'codeblock'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Divider',
    description: 'Visually separate content sections',
    icon: Minus,
    aliases: ['divider', 'hr', 'line'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table with header row',
    icon: Table,
    aliases: ['table', 'grid'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: 'Image',
    description: 'Insert an image via URL or upload',
    icon: ImageIcon,
    aliases: ['image', 'img', 'photo'],
    command: ({ editor, range, onOpenImageDialog }) => {
      editor.chain().focus().deleteRange(range).run();
      if (onOpenImageDialog) {
        onOpenImageDialog();
      }
    },
  },
  {
    title: 'Internal Note Link',
    description: 'Link to another note in your knowledge base',
    icon: Link,
    aliases: ['note', 'link', 'internal'],
    command: ({ editor, range, onOpenNoteLinkDialog }) => {
      editor.chain().focus().deleteRange(range).run();
      if (onOpenNoteLinkDialog) {
        onOpenNoteLinkDialog();
      }
    },
  },
];

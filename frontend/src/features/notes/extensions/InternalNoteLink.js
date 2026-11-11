import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap Mark for Internal Note Links.
 * Renders an in-text link with distinct visual styling (e.g. badge/wiki-link style)
 * pointing to another note in the Knowledge App without mutating NoteRelationship records.
 */
export const InternalNoteLink = Mark.create({
  name: 'internalNoteLink',

  priority: 1000,

  keepOnSplit: false,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-note-id'),
        renderHTML: (attributes) => {
          if (!attributes.noteId) return {};
          return {
            'data-note-id': attributes.noteId,
          };
        },
      },
      noteTitle: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-note-title') || element.textContent,
        renderHTML: (attributes) => {
          if (!attributes.noteTitle) return {};
          return {
            'data-note-title': attributes.noteTitle,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-note-id]',
      },
      {
        tag: 'span[data-note-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        class:
          'internal-note-link inline-flex items-center gap-0.5 font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-1.5 py-0.2 rounded transition-colors cursor-pointer border border-primary/20 no-underline',
        href: `/notes/${HTMLAttributes['data-note-id'] || ''}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInternalNoteLink:
        (attributes) =>
        ({ chain }) => {
          return chain().setMark(this.name, attributes).setMeta('preventAutolink', true).run();
        },
      unsetInternalNoteLink:
        () =>
        ({ chain }) => {
          return chain().unsetMark(this.name, { extendEmptyMarkRange: true }).run();
        },
    };
  },
});

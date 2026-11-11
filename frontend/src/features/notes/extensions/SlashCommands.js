import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

/**
 * Tiptap Extension for Slash Commands (`/`).
 * Integrates with SlashCommandMenu to provide Notion/Confluence style command palette.
 */
export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Service handling knowledge note import and export (Markdown and JSON).
 */

/**
 * Recursively converts a ProseMirror document AST to readable Markdown.
 *
 * @param {Object} doc - ProseMirror JSON document
 * @returns {string} Markdown representation
 */
export function proseMirrorToMarkdown(doc) {
  if (!doc || !doc.content || !Array.isArray(doc.content)) {
    return '';
  }

  function renderNodes(nodes) {
    return nodes.map(renderNode).join('');
  }

  function renderNode(node) {
    if (!node) return '';

    switch (node.type) {
      case 'paragraph': {
        const text = node.content ? renderNodes(node.content) : '';
        return `${text}\n\n`;
      }
      case 'heading': {
        const level = '#'.repeat(node.attrs?.level || 1);
        const text = node.content ? renderNodes(node.content) : '';
        return `${level} ${text}\n\n`;
      }
      case 'text': {
        let text = node.text || '';
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') text = `**${text}**`;
            if (mark.type === 'italic') text = `*${text}*`;
            if (mark.type === 'strike') text = `~~${text}~~`;
            if (mark.type === 'link') text = `[${text}](${mark.attrs?.href || ''})`;
            if (mark.type === 'code') text = `\`${text}\``;
          }
        }
        return text;
      }
      case 'codeBlock': {
        const lang = node.attrs?.language || '';
        const code = node.content ? renderNodes(node.content) : '';
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
      }
      case 'bulletList': {
        return `${renderNodes(node.content)}\n`;
      }
      case 'orderedList': {
        return `${renderNodes(node.content)}\n`;
      }
      case 'listItem': {
        const inner = node.content ? renderNodes(node.content).trim() : '';
        return `- ${inner}\n`;
      }
      case 'taskList': {
        return `${renderNodes(node.content)}\n`;
      }
      case 'taskItem': {
        const checked = node.attrs?.checked ? 'x' : ' ';
        const inner = node.content ? renderNodes(node.content).trim() : '';
        return `- [${checked}] ${inner}\n`;
      }
      case 'horizontalRule': {
        return `---\n\n`;
      }
      default:
        return node.content ? renderNodes(node.content) : '';
    }
  }

  return renderNodes(doc.content).trim();
}

/**
 * Export a single note as portable JSON.
 *
 * @param {string} noteId - Note UUID
 * @returns {Promise<Object>} Formatted note export object
 */
export async function exportNoteAsJson(noteId) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      tags: { include: { tag: true } },
      outgoingRelationships: {
        include: { targetNote: { select: { id: true, title: true } } },
      },
      incomingRelationships: {
        include: { sourceNote: { select: { id: true, title: true } } },
      },
    },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    note: {
      id: note.id,
      title: note.title,
      type: note.type,
      isFavorite: note.isFavorite,
      content: note.content,
      contentFormat: note.contentFormat,
      tags: note.tags.map((t) => t.tag.name),
      outgoing: note.outgoingRelationships.map((r) => ({
        type: r.relationshipType,
        targetNoteTitle: r.targetNote.title,
        description: r.description,
      })),
      incoming: note.incomingRelationships.map((r) => ({
        type: r.relationshipType,
        sourceNoteTitle: r.sourceNote.title,
        description: r.description,
      })),
    },
  };
}

/**
 * Export a note as standard Markdown with YAML frontmatter.
 *
 * @param {string} noteId - Note UUID
 * @returns {Promise<{ filename: string, markdown: string }>}
 */
export async function exportNoteAsMarkdown(noteId) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      tags: { include: { tag: true } },
      outgoingRelationships: {
        include: { targetNote: { select: { title: true } } },
      },
    },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  const tagsList = note.tags.map((t) => `  - ${t.tag.name}`).join('\n');
  const relList = note.outgoingRelationships
    .map((r) => `  - [[${r.targetNote.title}]] (${r.relationshipType})`)
    .join('\n');

  let frontmatter = '---\n';
  frontmatter += `title: "${note.title.replace(/"/g, '\\"')}"\n`;
  frontmatter += `type: ${note.type}\n`;
  frontmatter += `isFavorite: ${note.isFavorite}\n`;
  frontmatter += `exportedAt: ${new Date().toISOString()}\n`;
  if (note.tags.length > 0) {
    frontmatter += `tags:\n${tagsList}\n`;
  }
  if (note.outgoingRelationships.length > 0) {
    frontmatter += `connections:\n${relList}\n`;
  }
  frontmatter += '---\n\n';

  const bodyMarkdown = proseMirrorToMarkdown(note.content);
  const fullMarkdown = `${frontmatter}# ${note.title}\n\n${bodyMarkdown}`;
  const filename = `${note.title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50) || 'note'}.md`;

  return {
    filename,
    markdown: fullMarkdown,
  };
}

/**
 * Import a note from Markdown or JSON text.
 *
 * @param {Object} data - Import payload
 * @param {string} data.title - Title
 * @param {string} [data.markdown] - Raw markdown content
 * @param {Object} [data.jsonContent] - Structured JSON
 * @returns {Promise<Object>} Created Note
 */
export async function importNote(data) {
  const { title, markdown, jsonContent } = data;

  if (!title || !title.trim()) {
    throw new AppError('Title is required for importing note', 400);
  }

  let content = jsonContent || null;

  // If raw markdown is provided, wrap as simple ProseMirror paragraph node
  if (markdown && !content) {
    content = {
      type: 'doc',
      content: markdown.split('\n\n').filter(Boolean).map((para) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: para.replace(/^[#-]\s+/, '') }],
      })),
    };
  }

  const note = await prisma.note.create({
    data: {
      title: title.trim(),
      type: 'NOTE',
      content,
      contentFormat: 'json',
    },
  });

  return note;
}

import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { NOTE_TYPES, CONTENT_FORMATS, DEFAULT_PAGE, DEFAULT_LIMIT } from '../../constants/index.js';

/**
 * Service handling business logic and Prisma database operations for notes.
 */

/**
 * Create a new note or folder.
 * @param {Object} data - Note creation payload
 * @returns {Promise<Object>} Created note record
 */
export async function createNote(data) {
  const {
    title,
    type = NOTE_TYPES.NOTE,
    content = null,
    contentFormat = CONTENT_FORMATS.JSON,
    parentId = null,
    sortOrder = 0,
    isFavorite = false,
  } = data;

  // If parentId is specified, verify that parent note exists
  if (parentId) {
    const parentNote = await prisma.note.findUnique({
      where: { id: parentId },
    });
    if (!parentNote) {
      throw new AppError(`Parent note with ID ${parentId} not found`, 404);
    }
  }

  const createdNote = await prisma.note.create({
    data: {
      title,
      type,
      content,
      contentFormat,
      parentId: parentId || null,
      sortOrder,
      isFavorite,
    },
    include: {
      parent: {
        select: { id: true, title: true, type: true },
      },
      tags: {
        include: { tag: true },
      },
    },
  });

  return createdNote;
}

/**
 * Get note by UUID with optional include of relations.
 * @param {string} noteId - Note UUID
 * @returns {Promise<Object>} Note record
 * @throws {AppError} 404 if not found
 */
export async function getNoteById(noteId) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: {
      parent: {
        select: { id: true, title: true, type: true },
      },
      children: {
        select: { id: true, title: true, type: true, sortOrder: true, isFavorite: true },
        orderBy: { sortOrder: 'asc' },
      },
      tags: {
        include: { tag: true },
      },
      outgoingRelationships: {
        include: {
          targetNote: { select: { id: true, title: true, type: true } },
        },
      },
      incomingRelationships: {
        include: {
          sourceNote: { select: { id: true, title: true, type: true } },
        },
      },
    },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  return note;
}

/**
 * List notes with filtering and pagination.
 * @param {Object} filterOptions
 * @returns {Promise<{ notes: Array, total: number, page: number, limit: number }>}
 */
export async function listNotes(filterOptions = {}) {
  const page = parseInt(filterOptions.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(filterOptions.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {};

  // Filter by parentId
  if (filterOptions.parentId !== undefined) {
    if (filterOptions.parentId === 'null' || filterOptions.parentId === null) {
      where.parentId = null;
    } else {
      where.parentId = filterOptions.parentId;
    }
  }

  // Filter by type
  if (filterOptions.type) {
    where.type = filterOptions.type;
  }

  // Filter by favorite
  if (filterOptions.isFavorite !== undefined) {
    where.isFavorite = filterOptions.isFavorite === true || filterOptions.isFavorite === 'true';
  }

  // Filter by archived
  if (filterOptions.isArchived !== undefined) {
    const isArchived = filterOptions.isArchived === true || filterOptions.isArchived === 'true';
    where.archivedAt = isArchived ? { not: null } : null;
  }

  const [total, notes] = await Promise.all([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      include: {
        tags: {
          include: { tag: true },
        },
      },
    }),
  ]);

  return { notes, total, page, limit };
}

/**
 * Update note fields.
 * @param {string} noteId - Note UUID
 * @param {Object} updateData - Partial update payload
 * @returns {Promise<Object>} Updated note record
 */
export async function updateNote(noteId, updateData) {
  // Verify existence
  const existingNote = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!existingNote) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  // Disallow direct cycle creation through parentId update in updateNote
  if (updateData.parentId !== undefined && updateData.parentId !== existingNote.parentId) {
    if (updateData.parentId === noteId) {
      throw new AppError('A note cannot be its own parent', 400);
    }
    if (updateData.parentId) {
      await assertNoCycle(noteId, updateData.parentId);
    }
  }

  // Build clean update object
  const data = {};
  if (updateData.title !== undefined) data.title = updateData.title;
  if (updateData.content !== undefined) data.content = updateData.content;
  if (updateData.contentFormat !== undefined) data.contentFormat = updateData.contentFormat;
  if (updateData.type !== undefined) data.type = updateData.type;
  if (updateData.parentId !== undefined) data.parentId = updateData.parentId;
  if (updateData.sortOrder !== undefined) data.sortOrder = updateData.sortOrder;
  if (updateData.isFavorite !== undefined) data.isFavorite = updateData.isFavorite;
  if (updateData.archivedAt !== undefined) {
    data.archivedAt = updateData.archivedAt ? new Date(updateData.archivedAt) : null;
  }

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data,
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return updatedNote;
}

/**
 * Update note content specifically (ProseMirror / TipTap JSON).
 * Preserves title and metadata without modification.
 * @param {string} noteId - Note UUID
 * @param {Object} contentPayload - Payload containing content or contentJson
 * @returns {Promise<Object>} Updated note record
 */
export async function updateNoteContent(noteId, contentPayload) {
  const existingNote = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!existingNote) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  const content =
    contentPayload.contentJson !== undefined
      ? contentPayload.contentJson
      : contentPayload.content !== undefined
      ? contentPayload.content
      : null;

  const contentFormat = contentPayload.contentFormat || existingNote.contentFormat || 'json';

  const updatedNote = await prisma.note.update({
    where: { id: noteId },
    data: {
      content,
      contentFormat,
    },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  return updatedNote;
}

/**
 * Move a note to a new parent location with circular reference prevention.
 * @param {string} noteId - Note to move
 * @param {string|null} newParentId - Target parent note ID or null for root
 * @returns {Promise<Object>} Updated note
 */
export async function moveNote(noteId, newParentId) {
  const existingNote = await prisma.note.findUnique({
    where: { id: noteId },
  });
  if (!existingNote) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  // Self-parenting check
  if (newParentId === noteId) {
    throw new AppError('Cannot set note as its own parent', 400);
  }

  if (newParentId) {
    const targetParent = await prisma.note.findUnique({
      where: { id: newParentId },
    });
    if (!targetParent) {
      throw new AppError(`Target parent note with ID ${newParentId} not found`, 404);
    }

    // Circular reference check
    await assertNoCycle(noteId, newParentId);
  }

  const movedNote = await prisma.note.update({
    where: { id: noteId },
    data: {
      parentId: newParentId || null,
    },
    include: {
      parent: {
        select: { id: true, title: true, type: true },
      },
    },
  });

  return movedNote;
}

/**
 * Delete a note.
 * Policy:
 * - cascade=false (default): re-parents direct children to the deleted note's parentId.
 * - cascade=true: recursively deletes descendant notes.
 * - In ALL cases: associated NoteRelationship records where note is source or target are cascade deleted by DB foreign keys.
 * @param {string} noteId - Note to delete
 * @param {Object} options - { cascade: boolean }
 * @returns {Promise<void>}
 */
export async function deleteNote(noteId, options = {}) {
  const cascade = options.cascade === true || options.cascade === 'true';

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    include: { children: { select: { id: true } } },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  if (cascade) {
    // Collect all descendant IDs recursively
    const descendantIds = await getDescendantIds(noteId);
    const allIdsToDelete = [noteId, ...descendantIds];

    // Delete notes (Prisma CASCADE will clean up note_relationships and note_tags)
    await prisma.note.deleteMany({
      where: { id: { in: allIdsToDelete } },
    });
  } else {
    // Default deletion: re-parent direct children to the deleted note's parent
    await prisma.$transaction([
      prisma.note.updateMany({
        where: { parentId: noteId },
        data: { parentId: note.parentId },
      }),
      prisma.note.delete({
        where: { id: noteId },
      }),
    ]);
  }
}

/**
 * Traverses ancestors of candidate parent upward to root.
 * Throws AppError(400) if noteId is encountered in the ancestry chain.
 * @param {string} noteId - The note being moved
 * @param {string} candidateParentId - The proposed parent
 */
async function assertNoCycle(noteId, candidateParentId) {
  let currentId = candidateParentId;

  while (currentId) {
    if (currentId === noteId) {
      throw new AppError('Circular reference detected: target parent is a descendant of the note', 400);
    }

    const currentNote = await prisma.note.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!currentNote) break;
    currentId = currentNote.parentId;
  }
}

/**
 * Recursively collects all descendant note IDs of a given note.
 * @param {string} parentId
 * @returns {Promise<string[]>}
 */
async function getDescendantIds(parentId) {
  const descendants = [];
  const directChildren = await prisma.note.findMany({
    where: { parentId },
    select: { id: true },
  });

  for (const child of directChildren) {
    descendants.push(child.id);
    const subDescendants = await getDescendantIds(child.id);
    descendants.push(...subDescendants);
  }

  return descendants;
}

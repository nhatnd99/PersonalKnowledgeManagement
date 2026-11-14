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

    if (existingNote.type === 'FOLDER' && targetParent.type === 'NOTE') {
      throw new AppError('A folder cannot have a note as parent', 400);
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
/**
 * Recursively collects all descendant entities (notes and folders) at all nesting levels.
 * Uses iterative breadth-first collection with visited set to prevent cycles and stack overflows.
 * @param {string} parentId - Parent note/folder UUID
 * @returns {Promise<Array<{ id: string, title: string, type: string, parentId: string }>>}
 */
export async function getDescendantEntities(parentId) {
  const allDescendants = [];
  const visitedIds = new Set([parentId]);
  let currentLevelParentIds = [parentId];

  while (currentLevelParentIds.length > 0) {
    const children = await prisma.note.findMany({
      where: { parentId: { in: currentLevelParentIds } },
      select: {
        id: true,
        title: true,
        type: true,
        parentId: true,
      },
    });

    // Guard against cycles or repeated mock data
    const newChildren = children.filter((c) => !visitedIds.has(c.id));
    if (newChildren.length === 0) break;

    for (const child of newChildren) {
      visitedIds.add(child.id);
      allDescendants.push(child);
    }

    currentLevelParentIds = newChildren.map((c) => c.id);
  }

  return allDescendants;
}

/**
 * Computes deletion preview metrics (descendant folder/note counts and affected relationships).
 * @param {string} noteId - Target entity UUID
 * @returns {Promise<Object>}
 */
export async function getDeletePreview(noteId) {
  const target = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      type: true,
      parentId: true,
    },
  });

  if (!target) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  const descendants = await getDescendantEntities(noteId);
  const descendantFolders = descendants.filter((d) => d.type === 'FOLDER');
  const descendantNotes = descendants.filter((d) => d.type === 'NOTE');

  const allIdsToDelete = [noteId, ...descendants.map((d) => d.id)];

  const affectedRelationshipsCount = prisma.noteRelationship?.count
    ? await prisma.noteRelationship.count({
        where: {
          OR: [
            { sourceNoteId: { in: allIdsToDelete } },
            { targetNoteId: { in: allIdsToDelete } },
          ],
        },
      })
    : 0;

  return {
    target,
    descendants: {
      folders: descendantFolders.length,
      notes: descendantNotes.length,
      total: descendants.length,
    },
    affectedRelationships: affectedRelationshipsCount,
    totalEntitiesToDelete: allIdsToDelete.length,
  };
}

/**
 * Deletes a note or folder with comprehensive cascade deletion and semantic relationship cleanup.
 * Executed atomically inside a database transaction.
 * @param {string} noteId - UUID of the entity to delete
 * @param {Object} [options] - Options
 * @param {boolean} [options.cascade=true] - Whether to recursively delete descendants (defaults to true)
 * @returns {Promise<{ success: boolean, deletedEntitiesCount: number }>}
 */
export async function deleteNote(noteId, options = {}) {
  const cascade = options.cascade !== false && options.cascade !== 'false';

  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      type: true,
      parentId: true,
    },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  if (cascade) {
    // 1. Collect all descendant entities across all nesting depths
    const descendants = await getDescendantEntities(noteId);
    const allIdsToDelete = [noteId, ...descendants.map((d) => d.id)];

    // 2. Perform atomic cascade deletion within a single transaction
    const operations = [];

    // Step A: Explicitly delete all semantic relationships referencing any deleted entity
    // Crucial: Relationships where deleted entity is source OR target are deleted,
    // but foreign notes/folders outside allIdsToDelete remain untouched!
    if (prisma.noteRelationship?.deleteMany) {
      operations.push(
        prisma.noteRelationship.deleteMany({
          where: {
            OR: [
              { sourceNoteId: { in: allIdsToDelete } },
              { targetNoteId: { in: allIdsToDelete } },
            ],
          },
        })
      );
    }

    // Step B: Clean up note tags associations
    if (prisma.noteTag?.deleteMany) {
      operations.push(
        prisma.noteTag.deleteMany({
          where: { noteId: { in: allIdsToDelete } },
        })
      );
    }

    // Step C: Nullify parentId of deleted entities to prevent self-referential FK locks
    if (prisma.note?.updateMany) {
      operations.push(
        prisma.note.updateMany({
          where: { id: { in: allIdsToDelete } },
          data: { parentId: null },
        })
      );
    }

    // Step D: Batch delete all entities in the deletion set
    if (prisma.note?.deleteMany) {
      operations.push(
        prisma.note.deleteMany({
          where: { id: { in: allIdsToDelete } },
        })
      );
    }

    await prisma.$transaction(operations);

    return {
      success: true,
      deletedEntitiesCount: allIdsToDelete.length,
    };
  } else {
    // Reparent direct children to parent
    const operations = [];

    if (prisma.noteRelationship?.deleteMany) {
      operations.push(
        prisma.noteRelationship.deleteMany({
          where: {
            OR: [{ sourceNoteId: noteId }, { targetNoteId: noteId }],
          },
        })
      );
    }

    if (prisma.noteTag?.deleteMany) {
      operations.push(
        prisma.noteTag.deleteMany({
          where: { noteId },
        })
      );
    }

    if (prisma.note?.updateMany) {
      operations.push(
        prisma.note.updateMany({
          where: { parentId: noteId },
          data: { parentId: note.parentId },
        })
      );
    }

    if (prisma.note?.delete) {
      operations.push(
        prisma.note.delete({
          where: { id: noteId },
        })
      );
    }

    await prisma.$transaction(operations);

    return {
      success: true,
      deletedEntitiesCount: 1,
    };
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
export async function getDescendantIds(parentId) {
  const descendants = await getDescendantEntities(parentId);
  return descendants.map((d) => d.id);
}

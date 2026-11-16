import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { NOTE_TYPES, CONTENT_FORMATS, DEFAULT_PAGE, DEFAULT_LIMIT } from '../../constants/index.js';

export const DEFAULT_WORKSPACE_USER_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Service handling business logic and Prisma database operations for notes.
 * Enforces multi-user ownership and isolation.
 */

async function findNoteRecord(where, options = {}) {
  const query = { where, ...options };
  if (typeof prisma.note.findFirst === 'function') {
    return prisma.note.findFirst(query);
  }
  if (typeof prisma.note.findUnique === 'function' && where.id) {
    const found = await prisma.note.findUnique({ where: { id: where.id }, ...options });
    if (found && where.userId && found.userId && found.userId !== where.userId) {
      return null;
    }
    return found;
  }
  return null;
}

/**
 * Create a new note or folder.
 * @param {Object} data - Note creation payload
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Created note record
 */
export async function createNote(data, userId = null) {
  const effectiveUserId = userId || data.userId || DEFAULT_WORKSPACE_USER_ID;
  const {
    title,
    type = NOTE_TYPES.NOTE,
    content = null,
    contentFormat = CONTENT_FORMATS.JSON,
    parentId = null,
    sortOrder = 0,
    isFavorite = false,
  } = data;

  // If parentId is specified, verify that parent note exists and belongs to the same user
  if (parentId) {
    const parentWhere = { id: parentId };
    if (userId) parentWhere.userId = userId;

    const parentNote = await prisma.note.findFirst({
      where: parentWhere,
    });
    if (!parentNote) {
      throw new AppError(`Parent note with ID ${parentId} not found`, 404);
    }
  }

  const createdNote = await prisma.note.create({
    data: {
      userId: effectiveUserId,
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
 * Scoped to authenticated user when userId is provided.
 * @param {string} noteId - Note UUID
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Note record
 * @throws {AppError} 404 if not found
 */
export async function getNoteById(noteId, userId = null) {
  const where = { id: noteId };
  if (userId) where.userId = userId;

  const note = await findNoteRecord(where, {
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
 * Scoped to authenticated user.
 * @param {Object} filterOptions
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<{ notes: Array, total: number, page: number, limit: number }>}
 */
export async function listNotes(filterOptions = {}, userId = null) {
  const page = parseInt(filterOptions.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(filterOptions.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;

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
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Updated note record
 */
export async function updateNote(noteId, updateData, userId = null) {
  const where = { id: noteId };
  if (userId) where.userId = userId;

  const existingNote = await findNoteRecord(where);
  if (!existingNote) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  // Disallow direct cycle creation through parentId update in updateNote
  if (updateData.parentId !== undefined && updateData.parentId !== existingNote.parentId) {
    if (updateData.parentId === noteId) {
      throw new AppError('A note cannot be its own parent', 400);
    }
    if (updateData.parentId) {
      await assertNoCycle(noteId, updateData.parentId, userId);
    }
  }

  // Build clean update object
  const data = {};
  if (updateData.title !== undefined) {
    data.title = typeof updateData.title === 'string' ? updateData.title.trim() : (updateData.title || '');
  }
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
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Updated note record
 */
export async function updateNoteContent(noteId, contentPayload, userId = null) {
  const where = { id: noteId };
  if (userId) where.userId = userId;

  const existingNote = await findNoteRecord(where);
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
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Updated note
 */
export async function moveNote(noteId, newParentId, userId = null) {
  const noteWhere = { id: noteId };
  if (userId) noteWhere.userId = userId;

  const existingNote = await findNoteRecord(noteWhere);
  if (!existingNote) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  // Self-parenting check
  if (newParentId === noteId) {
    throw new AppError('Cannot set note as its own parent', 400);
  }

  if (newParentId) {
    const parentWhere = { id: newParentId };
    if (userId) parentWhere.userId = userId;

    const targetParent = await findNoteRecord(parentWhere);
    if (!targetParent) {
      throw new AppError(`Target parent note with ID ${newParentId} not found`, 404);
    }

    if (existingNote.type === 'FOLDER' && targetParent.type === 'NOTE') {
      throw new AppError('A folder cannot have a note as parent', 400);
    }

    // Circular reference check
    await assertNoCycle(noteId, newParentId, userId);
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
 * Recursively collects all descendant entities (notes and folders) at all nesting levels.
 * Uses iterative breadth-first collection with visited set to prevent cycles and stack overflows.
 * @param {string} parentId - Parent note/folder UUID
 * @param {string} [userId] - Optional user UUID
 * @returns {Promise<Array<{ id: string, title: string, type: string, parentId: string }>>}
 */
export async function getDescendantEntities(parentId, userId = null) {
  const allDescendants = [];
  const visitedIds = new Set([parentId]);
  let currentLevelParentIds = [parentId];

  while (currentLevelParentIds.length > 0) {
    const where = { parentId: { in: currentLevelParentIds } };
    if (userId) where.userId = userId;

    const children = await prisma.note.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        parentId: true,
      },
    });

    // Guard against cycles or repeated mock data
    const nextLevelParentIds = [];
    for (const child of children) {
      if (!visitedIds.has(child.id)) {
        visitedIds.add(child.id);
        allDescendants.push(child);
        nextLevelParentIds.push(child.id);
      }
    }

    currentLevelParentIds = nextLevelParentIds;
  }

  return allDescendants;
}

/**
 * Generates an accurate preview of what will be deleted if a note/folder is deleted.
 * @param {string} noteId - UUID of the entity to preview
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Detailed deletion preview
 */
export async function getDeletePreview(noteId, userId = null) {
  const where = { id: noteId };
  if (userId) where.userId = userId;

  const note = await findNoteRecord(where, {
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

  const descendants = await getDescendantEntities(noteId, userId);
  const allIdsToDelete = [noteId, ...descendants.map((d) => d.id)];

  const affectedSubfolderCount = descendants.filter((d) => d.type === 'FOLDER').length;
  const affectedChildNoteCount = descendants.filter((d) => d.type === 'NOTE').length;

  // Count relationships involving any of the entities to be deleted
  const affectedRelationshipCount = await prisma.noteRelationship.count({
    where: {
      OR: [
        { sourceNoteId: { in: allIdsToDelete } },
        { targetNoteId: { in: allIdsToDelete } },
      ],
      ...(userId ? { userId } : {}),
    },
  });

  return {
    target: {
      id: note.id,
      title: note.title,
      type: note.type,
    },
    descendants: {
      folders: affectedSubfolderCount,
      notes: affectedChildNoteCount,
      total: descendants.length,
    },
    affectedSubfolderCount,
    affectedChildNoteCount,
    affectedRelationships: affectedRelationshipCount,
    affectedRelationshipCount,
    totalEntitiesToDelete: allIdsToDelete.length,
  };
}

/**
 * Deletes a note or folder with comprehensive cascade deletion and semantic relationship cleanup.
 * Executed atomically inside a database transaction.
 * @param {string} noteId - UUID of the entity to delete
 * @param {Object} [options] - Options
 * @param {boolean} [options.cascade=true] - Whether to recursively delete descendants (defaults to true)
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<{ success: boolean, deletedEntitiesCount: number }>}
 */
export async function deleteNote(noteId, options = {}, userId = null) {
  const cascade = options.cascade !== false && options.cascade !== 'false';

  const where = { id: noteId };
  if (userId) where.userId = userId;

  const note = await findNoteRecord(where, {
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
    const descendants = await getDescendantEntities(noteId, userId);
    const allIdsToDelete = [noteId, ...descendants.map((d) => d.id)];

    // 2. Perform atomic cascade deletion within a single transaction
    const operations = [];

    // Step A: Explicitly delete all semantic relationships referencing any deleted entity
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

    // Step D: Delete all collected entities in one atomic operation
    operations.push(
      prisma.note.deleteMany({
        where: { id: { in: allIdsToDelete } },
      })
    );

    await prisma.$transaction(operations);

    return {
      success: true,
      deletedEntitiesCount: allIdsToDelete.length,
    };
  }

  // Non-cascade: Re-parent direct children to the deleted note's parentId
  const directChildren = await prisma.note.findMany({
    where: { parentId: noteId },
    select: { id: true },
  });

  const operations = [];

  // Re-parent direct children
  if (directChildren.length > 0) {
    operations.push(
      prisma.note.updateMany({
        where: { parentId: noteId },
        data: { parentId: note.parentId },
      })
    );
  }

  // Clean up relationships of the single deleted note
  if (prisma.noteRelationship?.deleteMany) {
    operations.push(
      prisma.noteRelationship.deleteMany({
        where: {
          OR: [{ sourceNoteId: noteId }, { targetNoteId: noteId }],
        },
      })
    );
  }

  // Delete the note itself
  operations.push(
    prisma.note.delete({
      where: { id: noteId },
    })
  );

  await prisma.$transaction(operations);

  return {
    success: true,
    deletedEntitiesCount: 1,
  };
}

/**
 * Traverse up the ancestor chain to ensure targetParentId is not a descendant of noteId.
 * @param {string} noteId - ID of note being moved
 * @param {string} targetParentId - ID of prospective parent
 * @param {string} [userId] - User ID
 * @throws {AppError} If a cycle is detected
 */
async function assertNoCycle(noteId, targetParentId, userId = null) {
  let currentId = targetParentId;
  const visited = new Set();

  while (currentId) {
    if (currentId === noteId) {
      throw new AppError(
        'Circular reference detected: target parent is a descendant of the note',
        400
      );
    }

    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const where = { id: currentId };
    if (userId) where.userId = userId;

    const currentNote = await findNoteRecord(where, {
      select: { parentId: true },
    });

    currentId = currentNote ? currentNote.parentId : null;
  }
}

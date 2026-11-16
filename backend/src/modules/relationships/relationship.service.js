import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

export const DEFAULT_WORKSPACE_USER_ID = '00000000-0000-4000-8000-000000000000';

/**
 * Service handling business logic and Prisma operations for note relationships.
 * Enforces authenticated user ownership and cross-user isolation.
 */

const NOTE_SELECT_FIELDS = {
  id: true,
  title: true,
  type: true,
  updatedAt: true,
};

async function findNoteRecord(where, options = {}) {
  if (typeof prisma.note?.findFirst === 'function') {
    return prisma.note.findFirst({ where, ...options });
  }
  if (typeof prisma.note?.findUnique === 'function' && where.id) {
    const record = await prisma.note.findUnique({ where: { id: where.id }, ...options });
    if (record && where.userId && record.userId && record.userId !== where.userId) {
      return null;
    }
    return record;
  }
  return null;
}

async function findRelationshipRecord(where, options = {}) {
  if (typeof prisma.noteRelationship?.findFirst === 'function') {
    return prisma.noteRelationship.findFirst({ where, ...options });
  }
  if (typeof prisma.noteRelationship?.findUnique === 'function' && where.id) {
    const record = await prisma.noteRelationship.findUnique({ where: { id: where.id }, ...options });
    if (record && where.userId && record.userId && record.userId !== where.userId) {
      return null;
    }
    return record;
  }
  return null;
}

/**
 * Create a directional relationship between two notes.
 *
 * @param {Object} data - Relationship payload
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Created relationship with source and target note details
 * @throws {AppError} 400 if self-referencing, 404 if either note not found, 409 if duplicate, 403 if cross-user
 */
export async function createRelationship(data, userId = null) {
  const effectiveUserId = userId || data.userId || DEFAULT_WORKSPACE_USER_ID;
  const sourceNoteId = data.sourceNoteId || data.sourceId;
  const targetNoteId = data.targetNoteId || data.targetId;
  const { relationshipType, description = null, label = null } = data;

  if (sourceNoteId === targetNoteId) {
    throw new AppError('A note cannot have a relationship with itself', 400);
  }

  // Verify source note exists and belongs to the user
  const sourceWhere = { id: sourceNoteId };
  if (userId) sourceWhere.userId = userId;

  const sourceNote = await findNoteRecord(sourceWhere, {
    select: { id: true, type: true, userId: true },
  });
  if (!sourceNote) {
    throw new AppError(`Source note with ID ${sourceNoteId} not found`, 404);
  }

  // Verify target note exists and belongs to the user
  const targetWhere = { id: targetNoteId };
  if (userId) targetWhere.userId = userId;

  const targetNote = await findNoteRecord(targetWhere, {
    select: { id: true, type: true, userId: true },
  });
  if (!targetNote) {
    throw new AppError(`Target note with ID ${targetNoteId} not found`, 404);
  }

  // Prevent cross-user relationships
  if (sourceNote.userId && targetNote.userId && sourceNote.userId !== targetNote.userId) {
    throw new AppError('Cross-user relationships are not permitted', 403);
  }

  const effectiveLabel = label || description || null;
  const effectiveDescription = description || label || null;

  try {
    const relationship = await prisma.noteRelationship.create({
      data: {
        userId: effectiveUserId,
        sourceNoteId,
        sourceType: sourceNote.type,
        targetNoteId,
        targetType: targetNote.type,
        relationshipType,
        description: effectiveDescription,
        label: effectiveLabel,
      },
      include: {
        sourceNote: { select: NOTE_SELECT_FIELDS },
        targetNote: { select: NOTE_SELECT_FIELDS },
      },
    });

    return relationship;
  } catch (error) {
    // Prisma unique constraint code
    if (error.code === 'P2002') {
      throw new AppError(
        `Relationship of type "${relationshipType}" between these notes already exists`,
        409
      );
    }
    throw error;
  }
}

/**
 * Get all relationships (incoming, outgoing, or both) for a specific note.
 *
 * @param {string} noteId - Note UUID
 * @param {Object} [options] - Filter options
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Relationships grouped by direction
 * @throws {AppError} 404 if note not found
 */
export async function getRelationshipsForNote(noteId, options = {}, userId = null) {
  const { direction = 'both', type } = options;

  // Verify note exists and belongs to user
  const noteWhere = { id: noteId };
  if (userId) noteWhere.userId = userId;

  const note = await findNoteRecord(noteWhere, {
    select: { id: true, title: true, type: true },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  const outgoingFilter = {
    sourceNoteId: noteId,
    ...(type ? { relationshipType: type } : {}),
    ...(userId ? { userId } : {}),
  };

  const incomingFilter = {
    targetNoteId: noteId,
    ...(type ? { relationshipType: type } : {}),
    ...(userId ? { userId } : {}),
  };

  let outgoing = [];
  let incoming = [];

  if (direction === 'outgoing' || direction === 'both') {
    outgoing = await prisma.noteRelationship.findMany({
      where: outgoingFilter,
      include: {
        targetNote: { select: NOTE_SELECT_FIELDS },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  if (direction === 'incoming' || direction === 'both') {
    incoming = await prisma.noteRelationship.findMany({
      where: incomingFilter,
      include: {
        sourceNote: { select: NOTE_SELECT_FIELDS },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return {
    note,
    direction,
    outgoing,
    incoming,
    total: outgoing.length + incoming.length,
  };
}

/**
 * List relationships with optional filters.
 *
 * @param {Object} [filter={}] - Query filters
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Array>} List of relationships
 */
export async function listRelationships(filter = {}, userId = null) {
  const { sourceNoteId, targetNoteId, relationshipType } = filter;

  const where = {};
  if (userId) where.userId = userId;
  if (sourceNoteId) where.sourceNoteId = sourceNoteId;
  if (targetNoteId) where.targetNoteId = targetNoteId;
  if (relationshipType) where.relationshipType = relationshipType;

  return prisma.noteRelationship.findMany({
    where,
    include: {
      sourceNote: { select: NOTE_SELECT_FIELDS },
      targetNote: { select: NOTE_SELECT_FIELDS },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a single relationship by UUID.
 *
 * @param {string} id - Relationship UUID
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Relationship record
 * @throws {AppError} 404 if not found
 */
export async function getRelationshipById(id, userId = null) {
  const where = { id };
  if (userId) where.userId = userId;

  const relationship = await findRelationshipRecord(where, {
    include: {
      sourceNote: { select: NOTE_SELECT_FIELDS },
      targetNote: { select: NOTE_SELECT_FIELDS },
    },
  });

  if (!relationship) {
    throw new AppError(`Relationship with ID ${id} not found`, 404);
  }

  return relationship;
}

/**
 * Update an existing relationship (type, label, or description).
 *
 * @param {string} id - Relationship UUID
 * @param {Object} data - Update payload
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<Object>} Updated relationship
 */
export async function updateRelationship(id, data, userId = null) {
  const where = { id };
  if (userId) where.userId = userId;

  const existing = await findRelationshipRecord(where);

  if (!existing) {
    throw new AppError(`Relationship with ID ${id} not found`, 404);
  }

  const { relationshipType, description, label } = data;

  const updateData = {};
  if (relationshipType !== undefined) {
    updateData.relationshipType = relationshipType;
  }
  if (label !== undefined) {
    updateData.label = label;
    if (description === undefined && !existing.description) {
      updateData.description = label;
    }
  }
  if (description !== undefined) {
    updateData.description = description;
    if (label === undefined && !existing.label) {
      updateData.label = description;
    }
  }

  try {
    const updated = await prisma.noteRelationship.update({
      where: { id },
      data: updateData,
      include: {
        sourceNote: { select: NOTE_SELECT_FIELDS },
        targetNote: { select: NOTE_SELECT_FIELDS },
      },
    });

    return updated;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError(
        `Relationship of type "${relationshipType}" between these entities already exists`,
        409
      );
    }
    throw error;
  }
}

/**
 * Delete a relationship by UUID.
 *
 * @param {string} id - Relationship UUID
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<void>}
 * @throws {AppError} 404 if not found
 */
export async function deleteRelationship(id, userId = null) {
  const where = { id };
  if (userId) where.userId = userId;

  const relationship = await findRelationshipRecord(where, {
    select: { id: true },
  });

  if (!relationship) {
    throw new AppError(`Relationship with ID ${id} not found`, 404);
  }

  await prisma.noteRelationship.delete({
    where: { id },
  });
}

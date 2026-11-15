import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Service handling business logic and Prisma operations for note relationships.
 */

const NOTE_SELECT_FIELDS = {
  id: true,
  title: true,
  type: true,
  updatedAt: true,
};

/**
 * Create a directional relationship between two notes.
 *
 * @param {Object} data - Relationship payload
 * @param {string} data.sourceNoteId - Source Note UUID
 * @param {string} data.targetNoteId - Target Note UUID
 * @param {string} data.relationshipType - Enum value from RelationshipType
 * @param {string} [data.description] - Optional contextual note
 * @returns {Promise<Object>} Created relationship with source and target note details
 * @throws {AppError} 400 if self-referencing, 404 if either note not found, 409 if duplicate
 */
export async function createRelationship(data) {
  const sourceNoteId = data.sourceNoteId || data.sourceId;
  const targetNoteId = data.targetNoteId || data.targetId;
  const { relationshipType, description = null, label = null } = data;

  if (sourceNoteId === targetNoteId) {
    throw new AppError('A note cannot have a relationship with itself', 400);
  }

  // Verify source note exists
  const sourceNote = await prisma.note.findUnique({
    where: { id: sourceNoteId },
    select: { id: true, type: true },
  });
  if (!sourceNote) {
    throw new AppError(`Source note with ID ${sourceNoteId} not found`, 404);
  }

  // Verify target note exists
  const targetNote = await prisma.note.findUnique({
    where: { id: targetNoteId },
    select: { id: true, type: true },
  });
  if (!targetNote) {
    throw new AppError(`Target note with ID ${targetNoteId} not found`, 404);
  }

  const effectiveLabel = label || description || null;
  const effectiveDescription = description || label || null;

  try {
    const relationship = await prisma.noteRelationship.create({
      data: {
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
 * @param {'both'|'outgoing'|'incoming'} [options.direction='both'] - Direction filter
 * @param {string} [options.type] - RelationshipType filter
 * @returns {Promise<Object>} Relationships grouped by direction
 * @throws {AppError} 404 if note not found
 */
export async function getRelationshipsForNote(noteId, options = {}) {
  const { direction = 'both', type } = options;

  // Verify note exists
  const note = await prisma.note.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, type: true },
  });

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }

  const outgoingFilter = {
    sourceNoteId: noteId,
    ...(type ? { relationshipType: type } : {}),
  };

  const incomingFilter = {
    targetNoteId: noteId,
    ...(type ? { relationshipType: type } : {}),
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
 * List relationships with optional filters (e.g. for knowledge graph rendering).
 *
 * @param {Object} [filter={}] - Query filters
 * @returns {Promise<Array>} List of relationships
 */
export async function listRelationships(filter = {}) {
  const { sourceNoteId, targetNoteId, relationshipType } = filter;

  const where = {};
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
 * @returns {Promise<Object>} Relationship record
 * @throws {AppError} 404 if not found
 */
export async function getRelationshipById(id) {
  const relationship = await prisma.noteRelationship.findUnique({
    where: { id },
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
 * @returns {Promise<Object>} Updated relationship
 * @throws {AppError} 404 if not found, 409 if changing type to an existing duplicate
 */
export async function updateRelationship(id, data) {
  const existing = await prisma.noteRelationship.findUnique({
    where: { id },
  });

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
 * @returns {Promise<void>}
 * @throws {AppError} 404 if not found
 */
export async function deleteRelationship(id) {
  const relationship = await prisma.noteRelationship.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!relationship) {
    throw new AppError(`Relationship with ID ${id} not found`, 404);
  }

  await prisma.noteRelationship.delete({
    where: { id },
  });
}

import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Service handling business logic and Prisma operations for tags and tag assignments.
 */

/**
 * List all tags with the count of associated notes.
 * @returns {Promise<Array>} List of tags with note counts
 */
export async function listTags() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { notes: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    description: tag.description,
    notesCount: tag._count.notes,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }));
}

/**
 * Get tag by ID with associated notes.
 * @param {string} tagId - Tag UUID
 * @returns {Promise<Object>} Tag record with notes
 * @throws {AppError} 404 if tag not found
 */
export async function getTagById(tagId) {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      notes: {
        include: {
          note: {
            select: {
              id: true,
              title: true,
              type: true,
              isFavorite: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!tag) {
    throw new AppError(`Tag with ID ${tagId} not found`, 404);
  }

  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    description: tag.description,
    notesCount: tag.notes.length,
    notes: tag.notes.map((nt) => nt.note),
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

/**
 * Create a new tag.
 * @param {Object} data
 * @param {string} data.name - Tag label
 * @param {string} [data.color] - Hex color code
 * @param {string} [data.description] - Description
 * @returns {Promise<Object>} Created tag
 * @throws {AppError} 409 if tag name already exists
 */
export async function createTag(data) {
  const { name, color = null, description = null } = data;

  try {
    const tag = await prisma.tag.create({
      data: {
        name: name.trim(),
        color,
        description,
      },
    });

    return tag;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError(`Tag with name "${name}" already exists`, 409);
    }
    throw error;
  }
}

/**
 * Update an existing tag.
 * @param {string} tagId - Tag UUID
 * @param {Object} data - Update payload
 * @returns {Promise<Object>} Updated tag
 * @throws {AppError} 404 if not found, 409 if duplicate name
 */
export async function updateTag(tagId, data) {
  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!existing) {
    throw new AppError(`Tag with ID ${tagId} not found`, 404);
  }

  const updatePayload = {};
  if (data.name !== undefined) updatePayload.name = data.name.trim();
  if (data.color !== undefined) updatePayload.color = data.color;
  if (data.description !== undefined) updatePayload.description = data.description;

  try {
    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: updatePayload,
    });
    return updated;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError(`Tag with name "${data.name}" already exists`, 409);
    }
    throw error;
  }
}

/**
 * Delete a tag. Associated note_tags entries are cascade-deleted in DB.
 * @param {string} tagId - Tag UUID
 * @returns {Promise<void>}
 * @throws {AppError} 404 if not found
 */
export async function deleteTag(tagId) {
  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(`Tag with ID ${tagId} not found`, 404);
  }

  await prisma.tag.delete({
    where: { id: tagId },
  });
}

/**
 * Assign a tag to a note.
 * @param {string} noteId - Note UUID
 * @param {string} tagId - Tag UUID
 * @returns {Promise<Object>} The assigned note_tag record
 * @throws {AppError} 404 if note or tag not found
 */
export async function assignTagToNote(noteId, tagId) {
  const [note, tag] = await Promise.all([
    prisma.note.findUnique({ where: { id: noteId }, select: { id: true } }),
    prisma.tag.findUnique({ where: { id: tagId }, select: { id: true } }),
  ]);

  if (!note) {
    throw new AppError(`Note with ID ${noteId} not found`, 404);
  }
  if (!tag) {
    throw new AppError(`Tag with ID ${tagId} not found`, 404);
  }

  // Upsert to ensure idempotent assignment
  const noteTag = await prisma.noteTag.upsert({
    where: {
      noteId_tagId: {
        noteId,
        tagId,
      },
    },
    update: {},
    create: {
      noteId,
      tagId,
    },
    include: {
      tag: true,
    },
  });

  return noteTag;
}

/**
 * Remove a tag from a note.
 * @param {string} noteId - Note UUID
 * @param {string} tagId - Tag UUID
 * @returns {Promise<void>}
 * @throws {AppError} 404 if assignment not found
 */
export async function removeTagFromNote(noteId, tagId) {
  try {
    await prisma.noteTag.delete({
      where: {
        noteId_tagId: {
          noteId,
          tagId,
        },
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new AppError('Tag is not associated with this note', 404);
    }
    throw error;
  }
}

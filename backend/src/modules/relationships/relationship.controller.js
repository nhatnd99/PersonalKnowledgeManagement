import * as relationshipService from './relationship.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for note relationships.
 */

/**
 * Create a new relationship.
 * POST /api/v1/relationships
 */
export async function createRelationshipHandler(req, res) {
  const relationship = await relationshipService.createRelationship(req.body);
  return sendCreated(res, relationship, 'Relationship created successfully');
}

/**
 * Get all relationships for a specific note.
 * GET /api/v1/notes/:noteId/relationships
 */
export async function getNoteRelationshipsHandler(req, res) {
  const { noteId } = req.params;
  const { direction, type } = req.query;

  const result = await relationshipService.getRelationshipsForNote(noteId, {
    direction,
    type,
  });

  return sendSuccess(res, result, 'Relationships retrieved successfully');
}

/**
 * List relationships with optional query filters.
 * GET /api/v1/relationships
 */
export async function listRelationshipsHandler(req, res) {
  const { sourceNoteId, targetNoteId, relationshipType } = req.query;

  const relationships = await relationshipService.listRelationships({
    sourceNoteId,
    targetNoteId,
    relationshipType,
  });

  return sendSuccess(res, relationships, 'Relationships retrieved successfully');
}

/**
 * Get single relationship by ID.
 * GET /api/v1/relationships/:id
 */
export async function getRelationshipByIdHandler(req, res) {
  const { id } = req.params;
  const relationship = await relationshipService.getRelationshipById(id);
  return sendSuccess(res, relationship, 'Relationship retrieved successfully');
}

/**
 * Delete relationship by ID.
 * DELETE /api/v1/relationships/:id
 */
export async function deleteRelationshipHandler(req, res) {
  const { id } = req.params;
  await relationshipService.deleteRelationship(id);
  return sendNoContent(res);
}

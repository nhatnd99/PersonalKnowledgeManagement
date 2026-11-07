import * as tagService from './tag.service.js';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for tags and note tag assignments.
 */

/**
 * List all tags.
 * GET /api/v1/tags
 */
export async function listTagsHandler(_req, res) {
  const tags = await tagService.listTags();
  return sendSuccess(res, tags, 'Tags retrieved successfully');
}

/**
 * Get single tag by ID.
 * GET /api/v1/tags/:tagId
 */
export async function getTagByIdHandler(req, res) {
  const { tagId } = req.params;
  const tag = await tagService.getTagById(tagId);
  return sendSuccess(res, tag, 'Tag retrieved successfully');
}

/**
 * Create a new tag.
 * POST /api/v1/tags
 */
export async function createTagHandler(req, res) {
  const tag = await tagService.createTag(req.body);
  return sendCreated(res, tag, 'Tag created successfully');
}

/**
 * Update a tag.
 * PATCH /api/v1/tags/:tagId
 */
export async function updateTagHandler(req, res) {
  const { tagId } = req.params;
  const updated = await tagService.updateTag(tagId, req.body);
  return sendSuccess(res, updated, 'Tag updated successfully');
}

/**
 * Delete a tag.
 * DELETE /api/v1/tags/:tagId
 */
export async function deleteTagHandler(req, res) {
  const { tagId } = req.params;
  await tagService.deleteTag(tagId);
  return sendNoContent(res);
}

/**
 * Assign a tag to a note.
 * POST /api/v1/notes/:noteId/tags
 */
export async function assignTagToNoteHandler(req, res) {
  const { noteId } = req.params;
  const { tagId } = req.body;
  const noteTag = await tagService.assignTagToNote(noteId, tagId);
  return sendCreated(res, noteTag, 'Tag assigned to note successfully');
}

/**
 * Remove a tag from a note.
 * DELETE /api/v1/notes/:noteId/tags/:tagId
 */
export async function removeTagFromNoteHandler(req, res) {
  const { noteId, tagId } = req.params;
  await tagService.removeTagFromNote(noteId, tagId);
  return sendNoContent(res);
}

import * as noteService from './note.service.js';
import { sendSuccess, sendCreated, sendNoContent, buildPaginationMeta } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for the notes domain.
 */

/**
 * POST /api/v1/notes
 */
export async function createNote(req, res) {
  const note = await noteService.createNote(req.body);
  return sendCreated(res, note, 'Note created successfully');
}

/**
 * GET /api/v1/notes/:noteId
 */
export async function getNoteById(req, res) {
  const note = await noteService.getNoteById(req.params.noteId);
  return sendSuccess(res, note, 'Note retrieved successfully');
}

/**
 * GET /api/v1/notes
 */
export async function listNotes(req, res) {
  const { notes, total, page, limit } = await noteService.listNotes(req.query);
  const meta = buildPaginationMeta(total, page, limit);
  return sendSuccess(res, notes, 'Notes retrieved successfully', 200, meta);
}

/**
 * PATCH /api/v1/notes/:noteId
 */
export async function updateNote(req, res) {
  const note = await noteService.updateNote(req.params.noteId, req.body);
  return sendSuccess(res, note, 'Note updated successfully');
}

/**
 * PATCH /api/v1/notes/:noteId/move
 */
export async function moveNote(req, res) {
  const { newParentId } = req.body;
  const note = await noteService.moveNote(req.params.noteId, newParentId);
  return sendSuccess(res, note, 'Note moved successfully');
}

/**
 * DELETE /api/v1/notes/:noteId
 */
export async function deleteNote(req, res) {
  const { cascade } = req.query;
  await noteService.deleteNote(req.params.noteId, { cascade });
  return sendNoContent(res);
}

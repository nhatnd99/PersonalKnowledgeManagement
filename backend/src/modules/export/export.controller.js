import * as exportService from './export.service.js';
import { sendSuccess, sendCreated } from '../../utils/apiResponse.js';

/**
 * Controller handling export and import HTTP endpoints.
 */

/**
 * Export note as Markdown or JSON.
 * GET /api/v1/notes/:noteId/export
 */
export async function exportNoteHandler(req, res) {
  const { noteId } = req.params;
  const { format = 'markdown', download } = req.query;

  if (format === 'json') {
    const data = await exportService.exportNoteAsJson(noteId);
    if (download === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="note-${noteId}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }
    return sendSuccess(res, data, 'Note exported as JSON successfully');
  }

  // Default: Markdown
  const { filename, markdown } = await exportService.exportNoteAsMarkdown(noteId);

  if (download === 'true') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return res.send(markdown);
  }

  return sendSuccess(res, { filename, markdown }, 'Note exported as Markdown successfully');
}

/**
 * Import a note.
 * POST /api/v1/notes/import
 */
export async function importNoteHandler(req, res) {
  const note = await exportService.importNote(req.body);
  return sendCreated(res, note, 'Note imported successfully');
}

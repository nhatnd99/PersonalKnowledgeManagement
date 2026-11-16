import * as searchService from './search.service.js';
import { sendPaginatedSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for search.
 * Scoped to authenticated user.
 */

/**
 * Search notes with keyword, tag, type, and favorite filters.
 * GET /api/v1/search
 */
export async function searchNotesHandler(req, res) {
  const { q, tag, type, isFavorite, page, limit } = req.query;

  const { notes, meta } = await searchService.searchNotes(
    {
      q,
      tag,
      type,
      isFavorite,
      page,
      limit,
    },
    req.user?.id
  );

  return sendPaginatedSuccess(res, notes, meta, 'Search results retrieved successfully');
}

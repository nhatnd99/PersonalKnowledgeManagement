import { prisma } from '../../config/database.js';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../../constants/index.js';
import { buildPaginationMeta } from '../../utils/apiResponse.js';

/**
 * Service for full search across notes, titles, tags, and favorites.
 * Enforces authenticated user scoping.
 */

/**
 * Search notes matching query string, tag, type, and favorite status.
 *
 * @param {Object} [params={}] - Search criteria
 * @param {string} [userId] - Authenticated user UUID
 * @returns {Promise<{ notes: Array, meta: Object }>}
 */
export async function searchNotes(params = {}, userId = null) {
  const {
    q,
    tag,
    type,
    isFavorite,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
  } = params;

  const where = {
    archivedAt: null,
  };

  if (userId) {
    where.userId = userId;
  }

  // Keyword query
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
    ];
  }

  // Tag filter
  if (tag && tag.trim()) {
    const tagTerm = tag.trim();
    where.tags = {
      some: {
        tag: {
          OR: [
            { id: tagTerm },
            { name: { equals: tagTerm, mode: 'insensitive' } },
          ],
        },
      },
    };
  }

  // Type filter
  if (type) {
    where.type = type;
  }

  // Favorite filter
  if (typeof isFavorite === 'boolean') {
    where.isFavorite = isFavorite;
  } else if (isFavorite === 'true' || isFavorite === 'false') {
    where.isFavorite = isFavorite === 'true';
  }

  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
      include: {
        parent: {
          select: { id: true, title: true, type: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.note.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { notes, meta };
}

import { prisma } from '../../config/database.js';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../../constants/index.js';
import { buildPaginationMeta } from '../../utils/apiResponse.js';

/**
 * Service for full search across notes, titles, tags, and favorites.
 */

/**
 * Search notes matching query string, tag, type, and favorite status.
 *
 * @param {Object} [params={}] - Search criteria
 * @param {string} [params.q] - Keyword search
 * @param {string} [params.tag] - Tag name or tag ID filter
 * @param {string} [params.type] - NOTE or FOLDER filter
 * @param {boolean} [params.isFavorite] - Starred filter
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Page size
 * @returns {Promise<{ notes: Array, meta: Object }>}
 */
export async function searchNotes(params = {}) {
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
  }

  const skip = (page - 1) * limit;

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip,
      take: limit,
      include: {
        parent: {
          select: { id: true, title: true, type: true },
        },
        tags: {
          include: { tag: true },
        },
        _count: {
          select: {
            children: true,
            outgoingRelationships: true,
            incomingRelationships: true,
          },
        },
      },
      orderBy: [
        { isFavorite: 'desc' },
        { updatedAt: 'desc' },
      ],
    }),
    prisma.note.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { notes, meta };
}

import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_NOTE_ID = '11111111-1111-4111-8111-111111111111';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const mockNote = {
    id: VALID_NOTE_ID,
    title: 'Spring Framework Masterclass',
    type: 'NOTE',
    isFavorite: true,
    sortOrder: 0,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: null,
    tags: [
      {
        tag: { id: '44444444-4444-4444-8444-444444444444', name: 'spring', color: '#10b981' },
      },
    ],
    _count: { children: 0, outgoingRelationships: 1, incomingRelationships: 0 },
  };

  return {
    prisma: {
      note: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.isFavorite === false) {
            return Promise.resolve([]);
          }
          return Promise.resolve([mockNote]);
        }),
        count: jest.fn().mockResolvedValue(1),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { createApp } = await import('../../app.js');

describe('Search API Endpoints (/api/v1/search)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/search', () => {
    it('searches notes with keyword query and returns 200 with pagination meta', async () => {
      const res = await request(app).get('/api/v1/search?q=spring');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Spring Framework Masterclass');
      expect(res.body.meta).toHaveProperty('total', 1);
      expect(res.body.meta).toHaveProperty('page', 1);
    });

    it('filters notes by tag with 200', async () => {
      const res = await request(app).get('/api/v1/search?tag=spring');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].tags[0].tag.name).toBe('spring');
    });

    it('filters notes by favorite status with 200', async () => {
      const res = await request(app).get('/api/v1/search?isFavorite=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].isFavorite).toBe(true);
    });

    it('rejects invalid query parameter length with 400', async () => {
      const longQuery = 'a'.repeat(201);
      const res = await request(app).get(`/api/v1/search?q=${longQuery}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

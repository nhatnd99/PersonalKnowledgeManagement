import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_TAG_ID = '44444444-4444-4444-8444-444444444444';
const VALID_NOTE_ID = '11111111-1111-4111-8111-111111111111';
const NON_EXISTENT_ID = '99999999-9999-4999-8999-999999999999';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const mockTag = {
    id: VALID_TAG_ID,
    name: 'architecture',
    color: '#3b82f6',
    description: 'System design and architectural patterns',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { notes: 2 },
    notes: [
      {
        note: {
          id: VALID_NOTE_ID,
          title: 'Spring Architecture',
          type: 'NOTE',
          isFavorite: false,
          updatedAt: new Date(),
        },
      },
    ],
  };

  const mockNote = {
    id: VALID_NOTE_ID,
    title: 'Spring Architecture',
    type: 'NOTE',
  };

  return {
    prisma: {
      tag: {
        findMany: jest.fn().mockResolvedValue([mockTag]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_TAG_ID) return Promise.resolve(mockTag);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          if (data.name === 'duplicate') {
            const err = new Error('Unique constraint failed');
            err.code = 'P2002';
            return Promise.reject(err);
          }
          return Promise.resolve({
            id: VALID_TAG_ID,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          if (where.id === VALID_TAG_ID) {
            return Promise.resolve({ ...mockTag, ...data });
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn().mockResolvedValue(mockTag),
      },
      note: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_NOTE_ID) return Promise.resolve(mockNote);
          return Promise.resolve(null);
        }),
      },
      noteTag: {
        upsert: jest.fn().mockResolvedValue({
          noteId: VALID_NOTE_ID,
          tagId: VALID_TAG_ID,
          tag: mockTag,
        }),
        delete: jest.fn().mockResolvedValue({
          noteId: VALID_NOTE_ID,
          tagId: VALID_TAG_ID,
        }),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { createApp } = await import('../../app.js');

describe('Tags API Endpoints (/api/v1/tags & /api/v1/notes/:noteId/tags)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/tags', () => {
    it('returns list of tags with note counts with 200', async () => {
      const res = await request(app).get('/api/v1/tags');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('notesCount');
    });
  });

  describe('POST /api/v1/tags', () => {
    it('creates tag with valid payload and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/tags')
        .send({
          name: 'backend',
          color: '#10b981',
          description: 'Server-side concepts',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('backend');
    });

    it('rejects empty name with 400', async () => {
      const res = await request(app)
        .post('/api/v1/tags')
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 409 Conflict when tag name already exists', async () => {
      const res = await request(app)
        .post('/api/v1/tags')
        .send({ name: 'duplicate' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('GET /api/v1/tags/:tagId', () => {
    it('returns tag details with 200', async () => {
      const res = await request(app).get(`/api/v1/tags/${VALID_TAG_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('architecture');
      expect(res.body.data).toHaveProperty('notes');
    });

    it('returns 404 for non-existent tag', async () => {
      const res = await request(app).get(`/api/v1/tags/${NON_EXISTENT_ID}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/tags/:tagId', () => {
    it('updates tag with 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/tags/${VALID_TAG_ID}`)
        .send({ name: 'architecture-v2' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('architecture-v2');
    });
  });

  describe('DELETE /api/v1/tags/:tagId', () => {
    it('deletes tag with 204 No Content', async () => {
      const res = await request(app).delete(`/api/v1/tags/${VALID_TAG_ID}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent tag deletion', async () => {
      const res = await request(app).delete(`/api/v1/tags/${NON_EXISTENT_ID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/notes/:noteId/tags (assign tag)', () => {
    it('assigns tag to note with 201', async () => {
      const res = await request(app)
        .post(`/api/v1/notes/${VALID_NOTE_ID}/tags`)
        .send({ tagId: VALID_TAG_ID });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tagId).toBe(VALID_TAG_ID);
    });

    it('returns 404 when note does not exist', async () => {
      const res = await request(app)
        .post(`/api/v1/notes/${NON_EXISTENT_ID}/tags`)
        .send({ tagId: VALID_TAG_ID });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/notes/:noteId/tags/:tagId (remove tag)', () => {
    it('removes tag from note with 204', async () => {
      const res = await request(app)
        .delete(`/api/v1/notes/${VALID_NOTE_ID}/tags/${VALID_TAG_ID}`);

      expect(res.status).toBe(204);
    });
  });
});

import { jest } from '@jest/globals';
import request from 'supertest';

// Valid UUIDv4 strings for test fixtures
const VALID_NOTE_ID = '11111111-1111-4111-8111-111111111111';
const VALID_FOLDER_ID = '22222222-2222-4222-8222-222222222222';
const NON_EXISTENT_ID = '99999999-9999-4999-8999-999999999999';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const mockNote = {
    id: VALID_NOTE_ID,
    title: 'Test Note',
    type: 'NOTE',
    content: { type: 'doc', content: [] },
    contentFormat: 'json',
    parentId: null,
    sortOrder: 0,
    isFavorite: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    children: [],
    outgoingRelationships: [],
    incomingRelationships: [],
  };

  return {
    prisma: {
      note: {
        create: jest.fn().mockResolvedValue(mockNote),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_NOTE_ID) {
            return Promise.resolve(mockNote);
          }
          if (where.id === VALID_FOLDER_ID) {
            return Promise.resolve({
              ...mockNote,
              id: VALID_FOLDER_ID,
              title: 'Folder',
              type: 'FOLDER',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([mockNote]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockImplementation(({ where, data }) => {
          return Promise.resolve({
            ...mockNote,
            ...data,
            id: where.id,
          });
        }),
        delete: jest.fn().mockResolvedValue(mockNote),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation((callbacks) => {
        return Promise.all(callbacks);
      }),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { createApp } = await import('../../app.js');

describe('Notes API Endpoints (/api/v1/notes)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/notes', () => {
    it('creates note with valid payload and returns 201', async () => {
      const payload = {
        title: 'New Architectures',
        type: 'NOTE',
      };

      const res = await request(app)
        .post('/api/v1/notes')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.message).toMatch(/created/i);
    });

    it('rejects creation with empty title and returns 400', async () => {
      const res = await request(app)
        .post('/api/v1/notes')
        .send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0].field).toBe('title');
    });

    it('rejects creation with invalid type and returns 400', async () => {
      const res = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Valid Title', type: 'INVALID_TYPE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].field).toBe('type');
    });
  });

  describe('GET /api/v1/notes/:noteId', () => {
    it('returns note by UUID with 200', async () => {
      const res = await request(app)
        .get(`/api/v1/notes/${VALID_NOTE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(VALID_NOTE_ID);
    });

    it('rejects non-UUID parameter with 400', async () => {
      const res = await request(app)
        .get('/api/v1/notes/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .get(`/api/v1/notes/${NON_EXISTENT_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notes', () => {
    it('lists notes with pagination metadata with 200', async () => {
      const res = await request(app)
        .get('/api/v1/notes?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
    });
  });

  describe('PATCH /api/v1/notes/:noteId', () => {
    it('updates note with partial payload with 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/notes/${VALID_NOTE_ID}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  describe('PATCH /api/v1/notes/:noteId/move', () => {
    it('moves note to new parent with 200', async () => {
      const res = await request(app)
        .patch(`/api/v1/notes/${VALID_NOTE_ID}/move`)
        .send({ newParentId: VALID_FOLDER_ID });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects self-parenting with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/notes/${VALID_NOTE_ID}/move`)
        .send({ newParentId: VALID_NOTE_ID });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot set note as its own parent/i);
    });
  });

  describe('DELETE /api/v1/notes/:noteId', () => {
    it('deletes note with 204 No Content', async () => {
      const res = await request(app)
        .delete(`/api/v1/notes/${VALID_NOTE_ID}`);

      expect(res.status).toBe(204);
    });
  });
});

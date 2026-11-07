import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_NOTE_1 = '11111111-1111-4111-8111-111111111111';
const VALID_NOTE_2 = '22222222-2222-4222-8222-222222222222';
const VALID_RELATION_ID = '33333333-3333-4333-8333-333333333333';
const NON_EXISTENT_ID = '99999999-9999-4999-8999-999999999999';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const note1 = { id: VALID_NOTE_1, title: 'Spring Boot', type: 'NOTE' };
  const note2 = { id: VALID_NOTE_2, title: 'JWT Auth', type: 'NOTE' };

  const mockRelation = {
    id: VALID_RELATION_ID,
    sourceNoteId: VALID_NOTE_1,
    targetNoteId: VALID_NOTE_2,
    relationshipType: 'DEPENDS_ON',
    description: 'Requires token validation',
    createdAt: new Date(),
    sourceNote: note1,
    targetNote: note2,
  };

  return {
    prisma: {
      note: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_NOTE_1) return Promise.resolve(note1);
          if (where.id === VALID_NOTE_2) return Promise.resolve(note2);
          return Promise.resolve(null);
        }),
      },
      noteRelationship: {
        create: jest.fn().mockImplementation(({ data }) => {
          if (
            data.sourceNoteId === VALID_NOTE_1 &&
            data.targetNoteId === VALID_NOTE_2 &&
            data.relationshipType === 'CONTRADICTS'
          ) {
            const error = new Error('Unique constraint failed');
            error.code = 'P2002';
            return Promise.reject(error);
          }
          return Promise.resolve({
            id: VALID_RELATION_ID,
            ...data,
            sourceNote: note1,
            targetNote: note2,
            createdAt: new Date(),
          });
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_RELATION_ID) {
            return Promise.resolve(mockRelation);
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.sourceNoteId === VALID_NOTE_1 || where.targetNoteId === VALID_NOTE_1) {
            return Promise.resolve([mockRelation]);
          }
          return Promise.resolve([]);
        }),
        delete: jest.fn().mockResolvedValue(mockRelation),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { createApp } = await import('../../app.js');

describe('Relationships API Endpoints (/api/v1/relationships & /api/v1/notes/:noteId/relationships)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/relationships', () => {
    it('creates relationship with valid payload and returns 201', async () => {
      const payload = {
        sourceNoteId: VALID_NOTE_1,
        targetNoteId: VALID_NOTE_2,
        relationshipType: 'DEPENDS_ON',
        description: 'Requires token validation',
      };

      const res = await request(app)
        .post('/api/v1/relationships')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.relationshipType).toBe('DEPENDS_ON');
      expect(res.body.data.sourceNote.id).toBe(VALID_NOTE_1);
      expect(res.body.data.targetNote.id).toBe(VALID_NOTE_2);
    });

    it('rejects self-referencing relationship with 400', async () => {
      const payload = {
        sourceNoteId: VALID_NOTE_1,
        targetNoteId: VALID_NOTE_1,
        relationshipType: 'RELATED_TO',
      };

      const res = await request(app)
        .post('/api/v1/relationships')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors[0].message).toMatch(/cannot have a relationship with itself/i);
    });

    it('rejects invalid relationship type with 400', async () => {
      const payload = {
        sourceNoteId: VALID_NOTE_1,
        targetNoteId: VALID_NOTE_2,
        relationshipType: 'INVALID_TYPE',
      };

      const res = await request(app)
        .post('/api/v1/relationships')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 when target note does not exist', async () => {
      const payload = {
        sourceNoteId: VALID_NOTE_1,
        targetNoteId: NON_EXISTENT_ID,
        relationshipType: 'REFERENCES',
      };

      const res = await request(app)
        .post('/api/v1/relationships')
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns 409 Conflict when relationship of same type already exists', async () => {
      const payload = {
        sourceNoteId: VALID_NOTE_1,
        targetNoteId: VALID_NOTE_2,
        relationshipType: 'CONTRADICTS',
      };

      const res = await request(app)
        .post('/api/v1/relationships')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('GET /api/v1/notes/:noteId/relationships', () => {
    it('returns incoming and outgoing relationships with 200', async () => {
      const res = await request(app)
        .get(`/api/v1/notes/${VALID_NOTE_1}/relationships?direction=both`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('outgoing');
      expect(res.body.data).toHaveProperty('incoming');
      expect(res.body.data).toHaveProperty('total');
    });

    it('filters incoming backlinks with 200', async () => {
      const res = await request(app)
        .get(`/api/v1/notes/${VALID_NOTE_1}/relationships?direction=incoming`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.direction).toBe('incoming');
      expect(res.body.data.outgoing).toHaveLength(0);
      expect(res.body.data.incoming).toHaveLength(1);
    });

    it('rejects invalid note UUID with 400', async () => {
      const res = await request(app)
        .get('/api/v1/notes/not-a-uuid/relationships');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app)
        .get(`/api/v1/notes/${NON_EXISTENT_ID}/relationships`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/relationships/:id', () => {
    it('deletes relationship and returns 204', async () => {
      const res = await request(app)
        .delete(`/api/v1/relationships/${VALID_RELATION_ID}`);

      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent relationship', async () => {
      const res = await request(app)
        .delete(`/api/v1/relationships/${NON_EXISTENT_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

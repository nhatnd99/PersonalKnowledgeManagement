import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_NOTE_1 = '11111111-1111-4111-8111-111111111111';
const VALID_NOTE_2 = '22222222-2222-4222-8222-222222222222';
const VALID_RELATION = '33333333-3333-4333-8333-333333333333';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const note1 = {
    id: VALID_NOTE_1,
    title: 'Spring Framework',
    type: 'NOTE',
    parentId: null,
    isFavorite: true,
    updatedAt: new Date(),
    tags: [],
  };

  const note2 = {
    id: VALID_NOTE_2,
    title: 'Dependency Injection',
    type: 'NOTE',
    parentId: VALID_NOTE_1,
    isFavorite: false,
    updatedAt: new Date(),
    tags: [],
  };

  const mockRelation = {
    id: VALID_RELATION,
    sourceNoteId: VALID_NOTE_1,
    targetNoteId: VALID_NOTE_2,
    relationshipType: 'DEPENDS_ON',
    description: 'Core spring concept',
  };

  return {
    prisma: {
      note: {
        findMany: jest.fn().mockResolvedValue([note1, note2]),
      },
      noteRelationship: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.relationshipType && where.relationshipType !== 'DEPENDS_ON') {
            return Promise.resolve([]);
          }
          return Promise.resolve([mockRelation]);
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

describe('Knowledge Graph API Endpoints (/api/v1/graph)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/v1/graph', () => {
    it('returns full graph nodes and edges with 200', async () => {
      const res = await request(app).get('/api/v1/graph');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nodes');
      expect(res.body.data).toHaveProperty('edges');
      expect(res.body.data.nodes).toHaveLength(2);
      expect(res.body.data.edges).toHaveLength(1);
      expect(res.body.data.edges[0].relationshipType).toBe('DEPENDS_ON');
    });

    it('includes hierarchy edges when includeHierarchy=true', async () => {
      const res = await request(app).get('/api/v1/graph?includeHierarchy=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // 1 relationship edge + 1 parent-child hierarchy edge = 2 edges
      expect(res.body.data.edges).toHaveLength(2);
      const hierarchyEdge = res.body.data.edges.find((e) => e.isHierarchy === true);
      expect(hierarchyEdge).toBeDefined();
      expect(hierarchyEdge.relationshipType).toBe('PARENT_OF');
    });

    it('filters edges by relationshipType', async () => {
      const res = await request(app).get('/api/v1/graph?relationshipType=CONTRADICTS');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.edges).toHaveLength(0);
    });

    it('returns localized subgraph around rootId', async () => {
      const res = await request(app).get(`/api/v1/graph?rootId=${VALID_NOTE_1}&depth=1`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nodes.length).toBeGreaterThan(0);
    });
  });
});

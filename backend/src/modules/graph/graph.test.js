import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_NOTE_1 = '11111111-1111-4111-8111-111111111111';
const VALID_NOTE_2 = '22222222-2222-4222-8222-222222222222';
const VALID_FOLDER_1 = '44444444-4444-4444-8444-444444444444';
const VALID_CHILD_NOTE = '55555555-5555-4555-8555-555555555555';
const VALID_CHILD_FOLDER = '66666666-6666-4666-8666-666666666666';
const VALID_RELATION = '33333333-3333-4333-8333-333333333333';
const VALID_FOLDER_RELATION = '77777777-7777-4777-8777-777777777777';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const note1 = {
    id: VALID_NOTE_1,
    title: 'Spring Framework',
    type: 'NOTE',
    parentId: null,
    isFavorite: true,
    updatedAt: new Date(),
    archivedAt: null,
    tags: [],
  };

  const note2 = {
    id: VALID_NOTE_2,
    title: 'Dependency Injection',
    type: 'NOTE',
    parentId: VALID_NOTE_1,
    isFavorite: false,
    updatedAt: new Date(),
    archivedAt: null,
    tags: [],
  };

  const folder1 = {
    id: VALID_FOLDER_1,
    title: 'System Design Course',
    type: 'FOLDER',
    parentId: null,
    isFavorite: false,
    updatedAt: new Date(),
    archivedAt: null,
    tags: [],
  };

  const childNote = {
    id: VALID_CHILD_NOTE,
    title: 'Microservices',
    type: 'NOTE',
    parentId: VALID_FOLDER_1,
    isFavorite: false,
    updatedAt: new Date(),
    archivedAt: null,
    tags: [],
  };

  const childFolder = {
    id: VALID_CHILD_FOLDER,
    title: 'Architecture',
    type: 'FOLDER',
    parentId: VALID_FOLDER_1,
    isFavorite: false,
    updatedAt: new Date(),
    archivedAt: null,
    tags: [],
  };

  const allNotes = [note1, note2, folder1, childNote, childFolder];

  const mockRelation = {
    id: VALID_RELATION,
    sourceNoteId: VALID_NOTE_1,
    targetNoteId: VALID_NOTE_2,
    relationshipType: 'DEPENDS_ON',
    description: 'Core spring concept',
  };

  const mockFolderRelation = {
    id: VALID_FOLDER_RELATION,
    sourceNoteId: VALID_CHILD_NOTE,
    targetNoteId: VALID_CHILD_FOLDER,
    relationshipType: 'RELATED_TO',
    description: 'Child note relates to child folder',
  };

  return {
    prisma: {
      note: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const found = allNotes.find((n) => n.id === where.id);
          return Promise.resolve(found || null);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (!where) return Promise.resolve(allNotes);
          let filtered = allNotes.filter((n) => n.archivedAt === null);
          if (where.parentId !== undefined) {
            filtered = filtered.filter((n) => n.parentId === where.parentId);
          }
          return Promise.resolve(filtered);
        }),
        groupBy: jest.fn().mockResolvedValue([
          { parentId: VALID_FOLDER_1, _count: { id: 2 } },
        ]),
      },
      noteRelationship: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          let rels = [mockRelation, mockFolderRelation];
          if (where?.relationshipType) {
            rels = rels.filter((r) => r.relationshipType === where.relationshipType);
          }
          if (where?.OR) {
            const scopeIds = new Set(where.OR[0].sourceNoteId.in);
            rels = rels.filter((r) => scopeIds.has(r.sourceNoteId) || scopeIds.has(r.targetNoteId));
          }
          return Promise.resolve(rels);
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

  describe('GET /api/v1/graph (Legacy Global Query)', () => {
    it('returns full graph nodes and edges with 200', async () => {
      const res = await request(app).get('/api/v1/graph');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('nodes');
      expect(res.body.data).toHaveProperty('edges');
      expect(res.body.data.nodes.length).toBeGreaterThan(0);
      expect(res.body.data.edges.length).toBeGreaterThan(0);
    });

    it('includes hierarchy edges when includeHierarchy=true', async () => {
      const res = await request(app).get('/api/v1/graph?includeHierarchy=true');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const hierarchyEdges = res.body.data.edges.filter((e) => e.isHierarchy === true);
      expect(hierarchyEdges.length).toBeGreaterThan(0);
      expect(hierarchyEdges[0].relationshipType).toBe('PARENT_OF');
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

  describe('GET /api/v1/graph/root (Root Workspace Graph)', () => {
    it('returns only top-level notes and folders (parentId: null)', async () => {
      const res = await request(app).get('/api/v1/graph/root');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scope');
      expect(res.body.data.scope.id).toBe('root');
      expect(res.body.data.scope.type).toBe('ROOT');

      // Top-level entities only
      res.body.data.nodes.forEach((node) => {
        expect(node.parentId).toBeNull();
      });
      expect(res.body.data.meta).toHaveProperty('folderCount');
      expect(res.body.data.meta).toHaveProperty('noteCount');
    });
  });

  describe('GET /api/v1/graph/folders/:folderId (Folder-Scoped Graph)', () => {
    it('returns scoped folder graph containing folder node and direct children', async () => {
      const res = await request(app).get(`/api/v1/graph/folders/${VALID_FOLDER_1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scope.id).toBe(VALID_FOLDER_1);
      expect(res.body.data.scope.type).toBe('FOLDER');
      expect(res.body.data.scope.breadcrumbs).toBeDefined();

      const nodeIds = res.body.data.nodes.map((n) => n.id);
      expect(nodeIds).toContain(VALID_FOLDER_1);
      expect(nodeIds).toContain(VALID_CHILD_NOTE);
      expect(nodeIds).toContain(VALID_CHILD_FOLDER);
      // External notes should NOT be in scope
      expect(nodeIds).not.toContain(VALID_NOTE_2);
    });

    it('includes hierarchy edges between folder and its direct children when requested', async () => {
      const res = await request(app).get(
        `/api/v1/graph/folders/${VALID_FOLDER_1}?includeHierarchy=true`
      );

      expect(res.status).toBe(200);
      const hierarchyEdges = res.body.data.edges.filter((e) => e.isHierarchy === true);
      expect(hierarchyEdges.length).toBe(2);
      expect(hierarchyEdges[0].source).toBe(VALID_FOLDER_1);
    });

    it('returns 404 for non-existent folder ID', async () => {
      const res = await request(app).get(
        '/api/v1/graph/folders/99999999-9999-4999-8999-999999999999'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when folderId refers to a NOTE instead of a FOLDER', async () => {
      const res = await request(app).get(`/api/v1/graph/folders/${VALID_NOTE_1}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/is a NOTE, not a FOLDER/i);
    });
  });
});


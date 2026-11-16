import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 7 & 8: State Synchronization, Concurrency & API Resilience', () => {
  let app;
  const createdNoteIds = new Set();
  const createdRelIds = new Set();

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    if (createdRelIds.size > 0) {
      await prisma.noteRelationship.deleteMany({
        where: { id: { in: Array.from(createdRelIds) } },
      });
    }
    if (createdNoteIds.size > 0) {
      const ids = Array.from(createdNoteIds);
      await prisma.noteRelationship.deleteMany({
        where: {
          OR: [
            { sourceNoteId: { in: ids } },
            { targetNoteId: { in: ids } },
          ],
        },
      });
      await prisma.note.deleteMany({
        where: { id: { in: ids } },
      });
    }
  });

  // TC-STATE-001: Selected Folder Synchronization
  it('TC-STATE-001: verifies folder scope and breadcrumb consistency across API endpoints', async () => {
    const rootFolder = (await request(app).post('/api/v1/notes').send({ title: 'Sync Root Folder', type: 'FOLDER' })).body.data;
    const subFolder = (await request(app).post('/api/v1/notes').send({ title: 'Sync Sub Folder', type: 'FOLDER', parentId: rootFolder.id })).body.data;
    createdNoteIds.add(rootFolder.id);
    createdNoteIds.add(subFolder.id);

    // 1. Check folder list endpoint
    const listRes = await request(app).get('/api/v1/graph/folders');
    expect(listRes.status).toBe(200);
    const foundSub = listRes.body.data.folders.find((f) => f.id === subFolder.id);
    expect(foundSub).toBeDefined();
    expect(foundSub.path).toContain('Sync Root Folder');

    // 2. Check folder graph endpoint
    const graphRes = await request(app).get(`/api/v1/graph/folders/${subFolder.id}`);
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.data.scope.id).toBe(subFolder.id);
    expect(graphRes.body.data.scope.breadcrumbs.length).toBe(3); // Root -> Sync Root Folder -> Sync Sub Folder
  });

  // TC-STATE-002: Rapid Updates & Concurrency
  it('TC-STATE-002: handles parallel asynchronous requests safely without race corruption', async () => {
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Race Note', type: 'NOTE' })).body.data;
    createdNoteIds.add(note.id);

    // Fire 5 concurrent title updates with distinct values
    const promises = [1, 2, 3, 4, 5].map((i) =>
      request(app).patch(`/api/v1/notes/${note.id}`).send({ title: `Race Title ${i}` })
    );

    const responses = await Promise.all(promises);
    expect(responses.every((r) => r.status === 200)).toBe(true);

    // Verify database record has one of the valid titles and is not corrupted
    const dbNote = await prisma.note.findUnique({ where: { id: note.id } });
    expect(dbNote.title).toMatch(/^Race Title [1-5]$/);
  });

  // TC-STATE-003: Concurrent Updates to Title and Favorite
  it('TC-STATE-003: updates different attributes concurrently without mutual overwrites', async () => {
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Concurrent Attr Note', type: 'NOTE', isFavorite: false })).body.data;
    createdNoteIds.add(note.id);

    const [res1, res2] = await Promise.all([
      request(app).patch(`/api/v1/notes/${note.id}`).send({ title: 'New Valid Title' }),
      request(app).patch(`/api/v1/notes/${note.id}`).send({ isFavorite: true }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const checkNote = await prisma.note.findUnique({ where: { id: note.id } });
    expect(checkNote.title).toBe('New Valid Title');
    expect(checkNote.isFavorite).toBe(true);
  });

  // TC-STATE-004: Browser Refresh Simulation
  it('TC-STATE-004: ensures all persisted data survives simulated browser refresh', async () => {
    const note = (await request(app).post('/api/v1/notes').send({
      title: 'Refresh Test Note',
      type: 'NOTE',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Persisted Content' }] }] },
      isFavorite: true,
    })).body.data;
    createdNoteIds.add(note.id);

    // Simulated refresh: clean query to backend API
    const freshFetch = await request(app).get(`/api/v1/notes/${note.id}`);
    expect(freshFetch.status).toBe(200);
    expect(freshFetch.body.data.title).toBe('Refresh Test Note');
    expect(freshFetch.body.data.isFavorite).toBe(true);
    expect(freshFetch.body.data.content).toBeDefined();
  });

  // Phase 8: API Boundary & Malformed Inputs
  describe('Phase 8: API Validation & Security Resilience', () => {
    it('handles special characters and Unicode in note titles safely', async () => {
      const specialTitle = '🚀 Knowledge & Graph: "Testing" <XML> / \\ `quotes` & symbols 日本語';
      const res = await request(app).post('/api/v1/notes').send({
        title: specialTitle,
        type: 'NOTE',
      });

      expect(res.status).toBe(201);
      const noteId = res.body.data.id;
      createdNoteIds.add(noteId);

      const fetchRes = await request(app).get(`/api/v1/notes/${noteId}`);
      expect(fetchRes.body.data.title).toBe(specialTitle);
    });

    it('rejects oversized note titles exceeding 500 characters', async () => {
      const longTitle = 'A'.repeat(501);
      const res = await request(app).post('/api/v1/notes').send({
        title: longTitle,
        type: 'NOTE',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('enforces UUID validation across all parameter routes', async () => {
      const paths = [
        ['GET', '/api/v1/notes/123-not-a-uuid'],
        ['PATCH', '/api/v1/notes/invalid/move'],
        ['DELETE', '/api/v1/notes/bad-id'],
        ['GET', '/api/v1/relationships/bad-id'],
        ['DELETE', '/api/v1/relationships/bad-id'],
        ['GET', '/api/v1/graph/folders/bad-id'],
      ];

      for (const [method, path] of paths) {
        let req;
        if (method === 'GET') req = request(app).get(path);
        else if (method === 'PATCH') req = request(app).patch(path).send({ newParentId: null });
        else if (method === 'DELETE') req = request(app).delete(path);

        const res = await req;
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('returns consistent JSON error structure on validation failures', async () => {
      const res = await request(app).post('/api/v1/notes').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('errors');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });
});

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 9: Performance Benchmarks & Realistic Dataset Metrics', () => {
  let app;
  const createdNoteIds = new Set();
  const createdRelIds = new Set();

  beforeAll(async () => {
    app = createApp();

    // Seed realistic dataset (5 folders, 25 notes, 15 relationships)
    const folders = [];
    for (let f = 1; f <= 5; f++) {
      const folderRes = await request(app).post('/api/v1/notes').send({
        title: `Perf Folder ${f}`,
        type: 'FOLDER',
      });
      folders.push(folderRes.body.data);
      createdNoteIds.add(folderRes.body.data.id);
    }

    const notes = [];
    for (let i = 1; i <= 25; i++) {
      const assignedFolder = folders[i % folders.length];
      const noteRes = await request(app).post('/api/v1/notes').send({
        title: `Perf Benchmark Note ${i}`,
        type: 'NOTE',
        parentId: assignedFolder.id,
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: `Benchmark body text for note ${i}` }] },
          ],
        },
      });
      notes.push(noteRes.body.data);
      createdNoteIds.add(noteRes.body.data.id);
    }

    // Connect 15 relationships
    const types = ['RELATED_TO', 'DEPENDS_ON', 'REFERENCES', 'EXTENDS'];
    for (let r = 0; r < 15; r++) {
      const source = notes[r];
      const target = notes[(r + 1) % notes.length];
      const relType = types[r % types.length];

      const relRes = await request(app).post('/api/v1/relationships').send({
        sourceNoteId: source.id,
        targetNoteId: target.id,
        relationshipType: relType,
      });
      if (relRes.status === 201) {
        createdRelIds.add(relRes.body.data.id);
      }
    }
  }, 30000); // 30s timeout for dataset creation

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

  it('measures folder listing API response time', async () => {
    const startTime = Date.now();
    const res = await request(app).get('/api/v1/graph/folders');
    const durationMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.data.folders.length).toBeGreaterThanOrEqual(5);

    console.info(`[Perf Metric] Folder list API duration: ${durationMs}ms`);
    // Should be responsive (less than 2000ms over network/pooler)
    expect(durationMs).toBeLessThan(2000);
  });

  it('measures individual note fetch response time', async () => {
    const firstNoteId = Array.from(createdNoteIds)[1]; // Pick a created note
    const startTime = Date.now();
    const res = await request(app).get(`/api/v1/notes/${firstNoteId}`);
    const durationMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(firstNoteId);

    console.info(`[Perf Metric] Note fetch API duration: ${durationMs}ms`);
    expect(durationMs).toBeLessThan(1500);
  });

  it('measures folder-scoped graph query response time with hierarchy and knowledge edges', async () => {
    const firstFolderId = Array.from(createdNoteIds)[0];
    const startTime = Date.now();
    const res = await request(app).get(`/api/v1/graph/folders/${firstFolderId}?includeHierarchy=true&includeKnowledge=true&includeExternal=true`);
    const durationMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.data.scope.id).toBe(firstFolderId);

    console.info(`[Perf Metric] Scoped graph query duration: ${durationMs}ms`);
    expect(durationMs).toBeLessThan(2000);
  });

  it('measures search API response time across notes', async () => {
    const startTime = Date.now();
    const res = await request(app).get('/api/v1/search?q=Benchmark');
    const durationMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    console.info(`[Perf Metric] Search query duration: ${durationMs}ms`);
    expect(durationMs).toBeLessThan(2000);
  });
});

import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { COOKIE_NAME } from '../../src/modules/auth/auth.constants.js';

describe('Phase 5: Multi-User Data Isolation & Access Authorization', () => {
  jest.setTimeout(30000);
  let app;
  const createdUserIds = new Set();
  const createdNoteIds = new Set();
  const createdTagIds = new Set();

  let cookieA = '';
  let cookieB = '';
  let userA = null;
  let userB = null;

  let folderA = null;
  let noteA = null;
  let relA = null;
  let tagA = null;

  let folderB = null;
  let noteB = null;
  let relB = null;
  let tagB = null;

  beforeAll(async () => {
    app = createApp();

    // 1. Create and Login User A
    const regA = await request(app).post('/api/auth/register').send({
      email: `user_alpha_${Date.now()}@knowledge.app`,
      password: 'PasswordAlpha123!',
      displayName: 'User Alpha',
    });
    userA = regA.body.data.user;
    createdUserIds.add(userA.id);
    cookieA = regA.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`)).split(';')[0];

    // 2. Create and Login User B
    const regB = await request(app).post('/api/auth/register').send({
      email: `user_beta_${Date.now()}@knowledge.app`,
      password: 'PasswordBeta123!',
      displayName: 'User Beta',
    });
    userB = regB.body.data.user;
    createdUserIds.add(userB.id);
    cookieB = regB.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`)).split(';')[0];

    // 3. User A creates resources
    const fARes = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookieA)
      .send({ title: 'Folder Alpha', type: 'FOLDER' });
    folderA = fARes.body.data;
    createdNoteIds.add(folderA.id);

    const nARes = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookieA)
      .send({ title: 'Note Alpha', type: 'NOTE', parentId: folderA.id });
    noteA = nARes.body.data;
    createdNoteIds.add(noteA.id);

    const rARes = await request(app)
      .post('/api/v1/relationships')
      .set('Cookie', cookieA)
      .send({
        sourceNoteId: noteA.id,
        targetNoteId: folderA.id,
        relationshipType: 'RELATED_TO',
        description: 'Alpha connection',
      });
    relA = rARes.body.data;

    const tARes = await request(app)
      .post('/api/v1/tags')
      .set('Cookie', cookieA)
      .send({ name: 'AlphaTag', color: '#3b82f6' });
    tagA = tARes.body.data;
    createdTagIds.add(tagA.id);

    // 4. User B creates resources
    const fBRes = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookieB)
      .send({ title: 'Folder Beta', type: 'FOLDER' });
    folderB = fBRes.body.data;
    createdNoteIds.add(folderB.id);

    const nBRes = await request(app)
      .post('/api/v1/notes')
      .set('Cookie', cookieB)
      .send({ title: 'Note Beta', type: 'NOTE', parentId: folderB.id });
    noteB = nBRes.body.data;
    createdNoteIds.add(noteB.id);

    const rBRes = await request(app)
      .post('/api/v1/relationships')
      .set('Cookie', cookieB)
      .send({
        sourceNoteId: noteB.id,
        targetNoteId: folderB.id,
        relationshipType: 'RELATED_TO',
        description: 'Beta connection',
      });
    relB = rBRes.body.data;

    const tBRes = await request(app)
      .post('/api/v1/tags')
      .set('Cookie', cookieB)
      .send({ name: 'BetaTag', color: '#10b981' });
    tagB = tBRes.body.data;
    createdTagIds.add(tagB.id);
  });

  afterAll(async () => {
    if (createdUserIds.size > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: Array.from(createdUserIds) } },
      }).catch(() => {});
    }
  });

  // ─── 1. NOTE & FOLDER ISOLATION ─────────────────────────────────────────────

  it('prevents User A from reading User B note (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/v1/notes/${noteB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(404);
  });

  it('prevents User A from updating User B note (returns 404)', async () => {
    const res = await request(app)
      .patch(`/api/v1/notes/${noteB.id}`)
      .set('Cookie', cookieA)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);

    // Verify User B note title is untouched
    const checkRes = await request(app)
      .get(`/api/v1/notes/${noteB.id}`)
      .set('Cookie', cookieB);
    expect(checkRes.body.data.title).toBe('Note Beta');
  });

  it('prevents User A from deleting User B note (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/v1/notes/${noteB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(404);

    // Verify User B note still exists
    const checkRes = await request(app)
      .get(`/api/v1/notes/${noteB.id}`)
      .set('Cookie', cookieB);
    expect(checkRes.status).toBe(200);
  });

  it('prevents User A from reading User B folder (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/v1/notes/${folderB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(404);
  });

  // ─── 2. HIERARCHY CROSS-USER MOVEMENT PREVENTION ───────────────────────────

  it('prevents User A from moving User B note into User A folder', async () => {
    const res = await request(app)
      .patch(`/api/v1/notes/${noteB.id}/move`)
      .set('Cookie', cookieA)
      .send({ newParentId: folderA.id });

    expect(res.status).toBe(404);
  });

  it('prevents User A from moving User A note into User B folder', async () => {
    const res = await request(app)
      .patch(`/api/v1/notes/${noteA.id}/move`)
      .set('Cookie', cookieA)
      .send({ newParentId: folderB.id });

    expect(res.status).toBe(404);
  });

  // ─── 3. RELATIONSHIP CROSS-USER ISOLATION ──────────────────────────────────

  it('strictly rejects connecting User A note to User B note with 403 or 404', async () => {
    const res = await request(app)
      .post('/api/v1/relationships')
      .set('Cookie', cookieA)
      .send({
        sourceNoteId: noteA.id,
        targetNoteId: noteB.id,
        relationshipType: 'RELATED_TO',
      });

    // Must be rejected (cannot find foreign note or cross-user forbidden)
    expect([400, 403, 404]).toContain(res.status);
  });

  it('prevents User A from deleting User B relationship (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/v1/relationships/${relB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(404);

    // Verify relationship still exists for User B
    const checkRes = await request(app)
      .get(`/api/v1/relationships/${relB.id}`)
      .set('Cookie', cookieB);
    expect(checkRes.status).toBe(200);
  });

  // ─── 4. KNOWLEDGE GRAPH SCOPING ────────────────────────────────────────────

  it('prevents User A from querying User B folder graph (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/v1/graph/folders/${folderB.id}`)
      .set('Cookie', cookieA);

    expect(res.status).toBe(404);
  });

  it('scopes Root Graph strictly to User A items, with zero User B nodes or edges', async () => {
    const res = await request(app)
      .get('/api/v1/graph/root')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    const nodeIds = res.body.data.nodes.map((n) => n.id);
    expect(nodeIds).toContain(folderA.id);
    expect(nodeIds).not.toContain(folderB.id);
    expect(nodeIds).not.toContain(noteB.id);

    const edgeIds = res.body.data.edges.map((e) => e.id);
    expect(edgeIds).not.toContain(relB.id);
  });

  // ─── 5. SEARCH & TAG ISOLATION ─────────────────────────────────────────────

  it('scopes search queries to authenticated user only', async () => {
    const searchRes = await request(app)
      .get('/api/v1/search?q=Beta')
      .set('Cookie', cookieA);

    expect(searchRes.status).toBe(200);
    // User A should find 0 results for "Beta"
    const titles = searchRes.body.data.map((n) => n.title);
    expect(titles).not.toContain('Note Beta');
    expect(titles).not.toContain('Folder Beta');
  });

  it('scopes tag listing so User A cannot view User B tags', async () => {
    const res = await request(app)
      .get('/api/v1/tags')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    const tagNames = res.body.data.map((t) => t.name);
    expect(tagNames).toContain('AlphaTag');
    expect(tagNames).not.toContain('BetaTag');
  });

  it('allows User B to create a tag with the same name as User A without collision', async () => {
    // User B creates a tag also named "AlphaTag" (per-user unique namespace)
    const res = await request(app)
      .post('/api/v1/tags')
      .set('Cookie', cookieB)
      .send({ name: 'AlphaTag', color: '#ef4444' });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('AlphaTag');
    createdTagIds.add(res.body.data.id);
  });
});

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 4: Relationship Testing (TC-REL-001 to TC-REL-009)', () => {
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

  // TC-REL-001: Create Note-to-Note Relationship
  it('TC-REL-001: creates directional note-to-note relationship with metadata', async () => {
    const noteA = (await request(app).post('/api/v1/notes').send({ title: 'Rel Note A', type: 'NOTE' })).body.data;
    const noteB = (await request(app).post('/api/v1/notes').send({ title: 'Rel Note B', type: 'NOTE' })).body.data;
    createdNoteIds.add(noteA.id);
    createdNoteIds.add(noteB.id);

    const relRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteA.id,
      targetNoteId: noteB.id,
      relationshipType: 'RELATED_TO',
      description: 'Note A is related to Note B',
    });

    expect(relRes.status).toBe(201);
    expect(relRes.body.success).toBe(true);
    expect(relRes.body.data.sourceNoteId).toBe(noteA.id);
    expect(relRes.body.data.targetNoteId).toBe(noteB.id);
    expect(relRes.body.data.relationshipType).toBe('RELATED_TO');

    createdRelIds.add(relRes.body.data.id);

    // Verify retrieval by note
    const fetchRes = await request(app).get(`/api/v1/notes/${noteA.id}/relationships?direction=outgoing`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.data.outgoing.length).toBeGreaterThanOrEqual(1);
  });

  // TC-REL-002: Different Relationship Types
  it('TC-REL-002: validates supported relationship types and rejects unsupported types', async () => {
    const n1 = (await request(app).post('/api/v1/notes').send({ title: 'Type Note 1', type: 'NOTE' })).body.data;
    const n2 = (await request(app).post('/api/v1/notes').send({ title: 'Type Note 2', type: 'NOTE' })).body.data;
    createdNoteIds.add(n1.id);
    createdNoteIds.add(n2.id);

    const validTypes = ['RELATED_TO', 'DEPENDS_ON', 'REFERENCES', 'EXTENDS', 'CONTRADICTS'];

    // Verify first supported type
    const supportedRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: n1.id,
      targetNoteId: n2.id,
      relationshipType: 'DEPENDS_ON',
    });
    expect(supportedRes.status).toBe(201);
    createdRelIds.add(supportedRes.body.data.id);

    // Verify unsupported type (e.g. IMPLEMENTS or UNKNOWN_TYPE) is rejected with 400
    const unsupportedRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: n1.id,
      targetNoteId: n2.id,
      relationshipType: 'IMPLEMENTS',
    });
    expect(unsupportedRes.status).toBe(400);
    expect(unsupportedRes.body.success).toBe(false);
  });

  // TC-REL-003: Cross-Folder Relationships
  it('TC-REL-003: establishes relationships across different folder boundaries', async () => {
    const fA = (await request(app).post('/api/v1/notes').send({ title: 'Cross Folder A', type: 'FOLDER' })).body.data;
    const fB = (await request(app).post('/api/v1/notes').send({ title: 'Cross Folder B', type: 'FOLDER' })).body.data;
    const noteA = (await request(app).post('/api/v1/notes').send({ title: 'Note in A', type: 'NOTE', parentId: fA.id })).body.data;
    const noteB = (await request(app).post('/api/v1/notes').send({ title: 'Note in B', type: 'NOTE', parentId: fB.id })).body.data;

    createdNoteIds.add(fA.id);
    createdNoteIds.add(fB.id);
    createdNoteIds.add(noteA.id);
    createdNoteIds.add(noteB.id);

    const relRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteA.id,
      targetNoteId: noteB.id,
      relationshipType: 'REFERENCES',
      description: 'Cross-folder reference',
    });
    expect(relRes.status).toBe(201);
    createdRelIds.add(relRes.body.data.id);

    // Verify that viewing Folder A detects Note B as an external connection
    const graphA = await request(app).get(`/api/v1/graph/folders/${fA.id}?includeExternal=true`);
    expect(graphA.status).toBe(200);
    const extNode = graphA.body.data.nodes.find((n) => n.id === noteB.id);
    expect(extNode).toBeDefined();
    expect(extNode.isExternal).toBe(true);
  });

  // TC-REL-004: Folder-to-Note Relationship
  it('TC-REL-004: supports conceptual relationship from a Folder to a Note without altering hierarchy', async () => {
    const folder = (await request(app).post('/api/v1/notes').send({ title: 'Conceptual Folder', type: 'FOLDER' })).body.data;
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Independent Note', type: 'NOTE' })).body.data;
    createdNoteIds.add(folder.id);
    createdNoteIds.add(note.id);

    const relRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: folder.id,
      targetNoteId: note.id,
      relationshipType: 'RELATED_TO',
      description: 'Folder conceptually relates to Note',
    });
    expect(relRes.status).toBe(201);
    createdRelIds.add(relRes.body.data.id);

    // Verify hierarchy remains completely untouched (folder has null parentId, note has null parentId)
    const checkFolder = await prisma.note.findUnique({ where: { id: folder.id } });
    const checkNote = await prisma.note.findUnique({ where: { id: note.id } });
    expect(checkFolder.parentId).toBeNull();
    expect(checkNote.parentId).toBeNull();
  });

  // TC-REL-005: Folder-to-Folder Relationship
  it('TC-REL-005: supports semantic relationship between two independent folders', async () => {
    const f1 = (await request(app).post('/api/v1/notes').send({ title: 'Topic A Folder', type: 'FOLDER' })).body.data;
    const f2 = (await request(app).post('/api/v1/notes').send({ title: 'Topic B Folder', type: 'FOLDER' })).body.data;
    createdNoteIds.add(f1.id);
    createdNoteIds.add(f2.id);

    const relRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: f1.id,
      targetNoteId: f2.id,
      relationshipType: 'EXTENDS',
      description: 'Topic A extends Topic B',
    });
    expect(relRes.status).toBe(201);
    createdRelIds.add(relRes.body.data.id);
  });

  // TC-REL-006: Duplicate Relationship Policy
  it('TC-REL-006: rejects duplicate relationship of same type with 409 but allows coexisting distinct types', async () => {
    const nA = (await request(app).post('/api/v1/notes').send({ title: 'Dup Source', type: 'NOTE' })).body.data;
    const nB = (await request(app).post('/api/v1/notes').send({ title: 'Dup Target', type: 'NOTE' })).body.data;
    createdNoteIds.add(nA.id);
    createdNoteIds.add(nB.id);

    // First creation
    const rel1 = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'RELATED_TO',
    });
    expect(rel1.status).toBe(201);
    createdRelIds.add(rel1.body.data.id);

    // Duplicate creation: same source, target, and type -> 409 Conflict
    const dupRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'RELATED_TO',
    });
    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);

    // Distinct relationship type between same notes -> 201 Allowed
    const distinctRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'REFERENCES',
    });
    expect(distinctRes.status).toBe(201);
    createdRelIds.add(distinctRes.body.data.id);
  });

  // TC-REL-007: Self-Relationship Rejection
  it('TC-REL-007: rejects self-referencing relationship with 400 Bad Request', async () => {
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Self Rel Note', type: 'NOTE' })).body.data;
    createdNoteIds.add(note.id);

    const selfRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: note.id,
      targetNoteId: note.id,
      relationshipType: 'RELATED_TO',
    });
    expect(selfRes.status).toBe(400);
    const hasSelfError = selfRes.body.errors?.some((e) => /cannot have a relationship with itself/i.test(e.message))
      || /cannot have a relationship with itself/i.test(selfRes.body.message);
    expect(hasSelfError).toBe(true);
  });

  // TC-REL-008: Edit Relationship
  it('TC-REL-008: updates relationship type and description correctly', async () => {
    const nA = (await request(app).post('/api/v1/notes').send({ title: 'Edit Rel A', type: 'NOTE' })).body.data;
    const nB = (await request(app).post('/api/v1/notes').send({ title: 'Edit Rel B', type: 'NOTE' })).body.data;
    createdNoteIds.add(nA.id);
    createdNoteIds.add(nB.id);

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'RELATED_TO',
      description: 'Initial description',
    })).body.data;
    createdRelIds.add(rel.id);

    // Update
    const updateRes = await request(app).patch(`/api/v1/relationships/${rel.id}`).send({
      relationshipType: 'CONTRADICTS',
      description: 'Updated contradiction note',
      label: 'Contradicts premise',
    });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.relationshipType).toBe('CONTRADICTS');
    expect(updateRes.body.data.description).toBe('Updated contradiction note');

    // Verify in DB
    const dbRel = await prisma.noteRelationship.findUnique({ where: { id: rel.id } });
    expect(dbRel.relationshipType).toBe('CONTRADICTS');
    expect(dbRel.description).toBe('Updated contradiction note');
  });

  // TC-REL-009: Delete Relationship
  it('TC-REL-009: removes relationship edge while preserving source and target notes', async () => {
    const nA = (await request(app).post('/api/v1/notes').send({ title: 'Delete Rel Note A', type: 'NOTE' })).body.data;
    const nB = (await request(app).post('/api/v1/notes').send({ title: 'Delete Rel Note B', type: 'NOTE' })).body.data;
    createdNoteIds.add(nA.id);
    createdNoteIds.add(nB.id);

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'RELATED_TO',
    })).body.data;

    // Delete relationship
    const delRes = await request(app).delete(`/api/v1/relationships/${rel.id}`);
    expect(delRes.status).toBe(204);

    // Verify relationship is gone
    const checkRel = await prisma.noteRelationship.findUnique({ where: { id: rel.id } });
    expect(checkRel).toBeNull();

    // Verify source and target notes STILL EXIST
    const checkA = await prisma.note.findUnique({ where: { id: nA.id } });
    const checkB = await prisma.note.findUnique({ where: { id: nB.id } });
    expect(checkA).not.toBeNull();
    expect(checkB).not.toBeNull();
  });
});

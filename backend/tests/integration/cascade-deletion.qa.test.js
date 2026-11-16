import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 6: Deletion & Cascade Testing (TC-DELETE-001 to TC-DELETE-005)', () => {
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

  // TC-DELETE-001: Delete Note Without Connections
  it('TC-DELETE-001: deletes an isolated note cleanly without affecting its parent folder', async () => {
    const parentFolder = (await request(app).post('/api/v1/notes').send({ title: 'Del Parent Folder', type: 'FOLDER' })).body.data;
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Del Target Note', type: 'NOTE', parentId: parentFolder.id })).body.data;
    createdNoteIds.add(parentFolder.id);

    // Delete note
    const delRes = await request(app).delete(`/api/v1/notes/${note.id}`);
    expect(delRes.status).toBe(204);

    // Verify note is gone
    const checkNote = await prisma.note.findUnique({ where: { id: note.id } });
    expect(checkNote).toBeNull();

    // Verify parent folder still exists
    const checkParent = await prisma.note.findUnique({ where: { id: parentFolder.id } });
    expect(checkParent).not.toBeNull();
  });

  // TC-DELETE-002: Delete Connected Note
  it('TC-DELETE-002: deletes a connected note and purges its relationships while preserving the other endpoint note', async () => {
    const noteA = (await request(app).post('/api/v1/notes').send({ title: 'Connected A', type: 'NOTE' })).body.data;
    const noteB = (await request(app).post('/api/v1/notes').send({ title: 'Connected B (Preserved)', type: 'NOTE' })).body.data;
    createdNoteIds.add(noteB.id); // noteA will be deleted

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteA.id,
      targetNoteId: noteB.id,
      relationshipType: 'RELATED_TO',
    })).body.data;

    // Delete Note A
    const delRes = await request(app).delete(`/api/v1/notes/${noteA.id}`);
    expect(delRes.status).toBe(204);

    // Verify Note A is deleted
    const checkA = await prisma.note.findUnique({ where: { id: noteA.id } });
    expect(checkA).toBeNull();

    // Verify relationship is purged
    const checkRel = await prisma.noteRelationship.findUnique({ where: { id: rel.id } });
    expect(checkRel).toBeNull();

    // Verify Note B remains completely intact
    const checkB = await prisma.note.findUnique({ where: { id: noteB.id } });
    expect(checkB).not.toBeNull();
  });

  // TC-DELETE-003: Delete Folder With Nested Descendants
  it('TC-DELETE-003: recursively cascade deletes subfolders and notes at all nesting levels', async () => {
    // Structure:
    // Root Folder
    // ├── Subfolder 1
    // │   ├── Note X
    // │   └── Note Y
    // └── Subfolder 2
    //     └── Note Z
    const rootF = (await request(app).post('/api/v1/notes').send({ title: 'Cascade Root', type: 'FOLDER' })).body.data;
    const sub1 = (await request(app).post('/api/v1/notes').send({ title: 'Sub 1', type: 'FOLDER', parentId: rootF.id })).body.data;
    const sub2 = (await request(app).post('/api/v1/notes').send({ title: 'Sub 2', type: 'FOLDER', parentId: rootF.id })).body.data;
    const noteX = (await request(app).post('/api/v1/notes').send({ title: 'Note X', type: 'NOTE', parentId: sub1.id })).body.data;
    const noteY = (await request(app).post('/api/v1/notes').send({ title: 'Note Y', type: 'NOTE', parentId: sub1.id })).body.data;
    const noteZ = (await request(app).post('/api/v1/notes').send({ title: 'Note Z', type: 'NOTE', parentId: sub2.id })).body.data;

    // Connect X to Y
    await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteX.id,
      targetNoteId: noteY.id,
      relationshipType: 'DEPENDS_ON',
    });

    // Check delete preview first
    const previewRes = await request(app).get(`/api/v1/notes/${rootF.id}/delete-preview`);
    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.descendants.total).toBe(5); // sub1, sub2, noteX, noteY, noteZ
    expect(previewRes.body.data.descendants.folders).toBe(2);
    expect(previewRes.body.data.descendants.notes).toBe(3);
    expect(previewRes.body.data.affectedRelationships).toBeGreaterThanOrEqual(1);

    // Perform cascade delete
    const delRes = await request(app).delete(`/api/v1/notes/${rootF.id}?cascade=true`);
    expect(delRes.status).toBe(204);

    // Verify all deleted in database
    const allIds = [rootF.id, sub1.id, sub2.id, noteX.id, noteY.id, noteZ.id];
    const remaining = await prisma.note.findMany({ where: { id: { in: allIds } } });
    expect(remaining.length).toBe(0);
  });

  // TC-DELETE-004: Delete Folder With External Connections
  it('TC-DELETE-004: deletes folder and cleans up relationships while strictly preserving external notes', async () => {
    const folderA = (await request(app).post('/api/v1/notes').send({ title: 'Folder A to delete', type: 'FOLDER' })).body.data;
    const noteX = (await request(app).post('/api/v1/notes').send({ title: 'Note X inside A', type: 'NOTE', parentId: folderA.id })).body.data;

    const folderB = (await request(app).post('/api/v1/notes').send({ title: 'External Folder B', type: 'FOLDER' })).body.data;
    const noteY = (await request(app).post('/api/v1/notes').send({ title: 'External Note Y', type: 'NOTE', parentId: folderB.id })).body.data;
    createdNoteIds.add(folderB.id);
    createdNoteIds.add(noteY.id);

    // Connect X -> Y
    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteX.id,
      targetNoteId: noteY.id,
      relationshipType: 'REFERENCES',
    })).body.data;

    // Delete Folder A (with cascade=true)
    const delRes = await request(app).delete(`/api/v1/notes/${folderA.id}?cascade=true`);
    expect(delRes.status).toBe(204);

    // Folder A and Note X must be gone
    const checkA = await prisma.note.findUnique({ where: { id: folderA.id } });
    const checkX = await prisma.note.findUnique({ where: { id: noteX.id } });
    expect(checkA).toBeNull();
    expect(checkX).toBeNull();

    // Relationship must be purged
    const checkRel = await prisma.noteRelationship.findUnique({ where: { id: rel.id } });
    expect(checkRel).toBeNull();

    // External Folder B and Note Y MUST still exist
    const checkB = await prisma.note.findUnique({ where: { id: folderB.id } });
    const checkY = await prisma.note.findUnique({ where: { id: noteY.id } });
    expect(checkB).not.toBeNull();
    expect(checkY).not.toBeNull();
  });

  // TC-DELETE-005: Delete Error Handling
  it('TC-DELETE-005: returns 404 when attempting to delete a non-existent note', async () => {
    const res = await request(app).delete('/api/v1/notes/00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

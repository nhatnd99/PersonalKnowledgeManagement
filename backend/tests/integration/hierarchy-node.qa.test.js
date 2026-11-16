import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 3: Folder & Node Hierarchy Testing (TC-NODE-001 to TC-NODE-007)', () => {
  let app;
  const createdNoteIds = new Set();

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
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

  // TC-NODE-001: Create Nested Folders
  it('TC-NODE-001: creates multi-level nested folders with correct parentIds', async () => {
    // 1. Root-level System Design
    const sysDesignRes = await request(app).post('/api/v1/notes').send({
      title: 'QA System Design',
      type: 'FOLDER',
      parentId: null,
    });
    expect(sysDesignRes.status).toBe(201);
    const sysDesign = sysDesignRes.body.data;
    createdNoteIds.add(sysDesign.id);
    expect(sysDesign.parentId).toBeNull();

    // 2. Foundation under System Design
    const foundationRes = await request(app).post('/api/v1/notes').send({
      title: 'QA Foundation',
      type: 'FOLDER',
      parentId: sysDesign.id,
    });
    expect(foundationRes.status).toBe(201);
    const foundation = foundationRes.body.data;
    createdNoteIds.add(foundation.id);
    expect(foundation.parentId).toBe(sysDesign.id);

    // 3. Advanced Concepts under Foundation (3rd level)
    const advRes = await request(app).post('/api/v1/notes').send({
      title: 'QA Advanced Concepts',
      type: 'FOLDER',
      parentId: foundation.id,
    });
    expect(advRes.status).toBe(201);
    const adv = advRes.body.data;
    createdNoteIds.add(adv.id);
    expect(adv.parentId).toBe(foundation.id);

    // 4. Architecture under System Design (sibling to Foundation)
    const archRes = await request(app).post('/api/v1/notes').send({
      title: 'QA Architecture',
      type: 'FOLDER',
      parentId: sysDesign.id,
    });
    expect(archRes.status).toBe(201);
    const arch = archRes.body.data;
    createdNoteIds.add(arch.id);
    expect(arch.parentId).toBe(sysDesign.id);
  });

  // TC-NODE-002: Create Notes Inside Folders
  it('TC-NODE-002: creates notes inside specific nested folders and verifies child counts', async () => {
    // Create folder
    const folderRes = await request(app).post('/api/v1/notes').send({
      title: 'Container Folder',
      type: 'FOLDER',
    });
    const folderId = folderRes.body.data.id;
    createdNoteIds.add(folderId);

    // Create 3 notes inside
    const note1 = await request(app).post('/api/v1/notes').send({ title: 'Child Note A', type: 'NOTE', parentId: folderId });
    const note2 = await request(app).post('/api/v1/notes').send({ title: 'Child Note B', type: 'NOTE', parentId: folderId });
    const note3 = await request(app).post('/api/v1/notes').send({ title: 'Child Note C', type: 'NOTE', parentId: folderId });

    createdNoteIds.add(note1.body.data.id);
    createdNoteIds.add(note2.body.data.id);
    createdNoteIds.add(note3.body.data.id);

    expect(note1.body.data.parentId).toBe(folderId);
    expect(note2.body.data.parentId).toBe(folderId);
    expect(note3.body.data.parentId).toBe(folderId);

    // Verify folder children query
    const listRes = await request(app).get(`/api/v1/notes?parentId=${folderId}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.meta.total).toBe(3);
    expect(listRes.body.data.map((n) => n.id)).toEqual(
      expect.arrayContaining([note1.body.data.id, note2.body.data.id, note3.body.data.id])
    );
  });

  // TC-NODE-003: Rename Node
  it('TC-NODE-003: renames root folder, nested folder, and note with database persistence', async () => {
    // Create root folder
    const fRootRes = await request(app).post('/api/v1/notes').send({ title: 'Initial Root Name', type: 'FOLDER' });
    const fRootId = fRootRes.body.data.id;
    createdNoteIds.add(fRootId);

    // Create nested note
    const nRes = await request(app).post('/api/v1/notes').send({ title: 'Initial Note Name', type: 'NOTE', parentId: fRootId });
    const nId = nRes.body.data.id;
    createdNoteIds.add(nId);

    // Rename Folder
    const renameFolderRes = await request(app).patch(`/api/v1/notes/${fRootId}`).send({ title: 'Renamed Root Folder' });
    expect(renameFolderRes.status).toBe(200);
    expect(renameFolderRes.body.data.title).toBe('Renamed Root Folder');

    // Rename Note
    const renameNoteRes = await request(app).patch(`/api/v1/notes/${nId}`).send({ title: 'Renamed Knowledge Note' });
    expect(renameNoteRes.status).toBe(200);
    expect(renameNoteRes.body.data.title).toBe('Renamed Knowledge Note');

    // Verify from DB directly
    const dbFolder = await prisma.note.findUnique({ where: { id: fRootId } });
    const dbNote = await prisma.note.findUnique({ where: { id: nId } });
    expect(dbFolder.title).toBe('Renamed Root Folder');
    expect(dbNote.title).toBe('Renamed Knowledge Note');
  });

  // TC-NODE-004: Move Note Between Folders preserving Knowledge Relationships
  it('TC-NODE-004: moves note to another folder while preserving knowledge graph relationships', async () => {
    const f1 = (await request(app).post('/api/v1/notes').send({ title: 'Source Folder 1', type: 'FOLDER' })).body.data;
    const f2 = (await request(app).post('/api/v1/notes').send({ title: 'Target Folder 2', type: 'FOLDER' })).body.data;
    const noteX = (await request(app).post('/api/v1/notes').send({ title: 'Note X', type: 'NOTE', parentId: f1.id })).body.data;
    const noteY = (await request(app).post('/api/v1/notes').send({ title: 'Note Y', type: 'NOTE', parentId: f2.id })).body.data;

    createdNoteIds.add(f1.id);
    createdNoteIds.add(f2.id);
    createdNoteIds.add(noteX.id);
    createdNoteIds.add(noteY.id);

    // Connect Note X to Note Y
    const relRes = await request(app).post('/api/v1/relationships').send({
      sourceNoteId: noteX.id,
      targetNoteId: noteY.id,
      relationshipType: 'DEPENDS_ON',
      description: 'X depends on Y',
    });
    expect(relRes.status).toBe(201);
    const relId = relRes.body.data.id;

    // Move Note X into Folder 2
    const moveRes = await request(app).patch(`/api/v1/notes/${noteX.id}/move`).send({ newParentId: f2.id });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.parentId).toBe(f2.id);

    // Verify relationship is STILL intact in database
    const dbRel = await prisma.noteRelationship.findUnique({ where: { id: relId } });
    expect(dbRel).not.toBeNull();
    expect(dbRel.sourceNoteId).toBe(noteX.id);
    expect(dbRel.targetNoteId).toBe(noteY.id);
    expect(dbRel.relationshipType).toBe('DEPENDS_ON');
  });

  // TC-NODE-005: Move Folder Between Parents
  it('TC-NODE-005: moves an entire subfolder subtree under a new parent correctly', async () => {
    const rootA = (await request(app).post('/api/v1/notes').send({ title: 'Root A', type: 'FOLDER' })).body.data;
    const rootB = (await request(app).post('/api/v1/notes').send({ title: 'Root B', type: 'FOLDER' })).body.data;
    const childF = (await request(app).post('/api/v1/notes').send({ title: 'Child Folder', type: 'FOLDER', parentId: rootA.id })).body.data;
    const grandChild = (await request(app).post('/api/v1/notes').send({ title: 'Grandchild Note', type: 'NOTE', parentId: childF.id })).body.data;

    createdNoteIds.add(rootA.id);
    createdNoteIds.add(rootB.id);
    createdNoteIds.add(childF.id);
    createdNoteIds.add(grandChild.id);

    // Move Child Folder from Root A to Root B
    const moveRes = await request(app).patch(`/api/v1/notes/${childF.id}/move`).send({ newParentId: rootB.id });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.parentId).toBe(rootB.id);

    // Verify grandChild still has childF as parent
    const checkGrandChild = await prisma.note.findUnique({ where: { id: grandChild.id } });
    expect(checkGrandChild.parentId).toBe(childF.id);
  });

  // TC-NODE-006: Invalid Move Operations
  it('TC-NODE-006: prevents circular move, moving into self, and moving to invalid parent', async () => {
    const fA = (await request(app).post('/api/v1/notes').send({ title: 'Folder Alpha', type: 'FOLDER' })).body.data;
    const fB = (await request(app).post('/api/v1/notes').send({ title: 'Folder Beta', type: 'FOLDER', parentId: fA.id })).body.data;
    const leafNote = (await request(app).post('/api/v1/notes').send({ title: 'Leaf Note', type: 'NOTE', parentId: fB.id })).body.data;

    createdNoteIds.add(fA.id);
    createdNoteIds.add(fB.id);
    createdNoteIds.add(leafNote.id);

    // 1. Move folder into itself
    const selfMove = await request(app).patch(`/api/v1/notes/${fA.id}/move`).send({ newParentId: fA.id });
    expect(selfMove.status).toBe(400);

    // 2. Move folder into its descendant (cycle: Alpha -> Beta, moving Alpha into Beta)
    const cycleMove = await request(app).patch(`/api/v1/notes/${fA.id}/move`).send({ newParentId: fB.id });
    expect(cycleMove.status).toBe(400);
    expect(cycleMove.body.message).toMatch(/circular reference|cannot move a note under its own descendant|cycle/i);

    // 3. Move folder to a note (folder cannot be child of a note)
    const folderUnderNote = await request(app).patch(`/api/v1/notes/${fA.id}/move`).send({ newParentId: leafNote.id });
    expect(folderUnderNote.status).toBe(400);

    // 4. Move to non-existent parent
    const badParent = await request(app).patch(`/api/v1/notes/${fA.id}/move`).send({ newParentId: '00000000-0000-4000-8000-000000000000' });
    expect(badParent.status).toBe(404);
  });

  // TC-NODE-007: Root-Level Operations
  it('TC-NODE-007: allows moving nested items to root level (parentId: null)', async () => {
    const parentF = (await request(app).post('/api/v1/notes').send({ title: 'Parent For Root Test', type: 'FOLDER' })).body.data;
    const childNote = (await request(app).post('/api/v1/notes').send({ title: 'Nested Note to Root', type: 'NOTE', parentId: parentF.id })).body.data;

    createdNoteIds.add(parentF.id);
    createdNoteIds.add(childNote.id);

    // Move childNote to root (newParentId: null)
    const toRootRes = await request(app).patch(`/api/v1/notes/${childNote.id}/move`).send({ newParentId: null });
    expect(toRootRes.status).toBe(200);
    expect(toRootRes.body.data.parentId).toBeNull();

    const dbNote = await prisma.note.findUnique({ where: { id: childNote.id } });
    expect(dbNote.parentId).toBeNull();
  });
});

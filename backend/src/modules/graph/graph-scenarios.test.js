import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Knowledge Graph End-to-End Scenarios (Real Database Integration)', () => {
  let app;
  let testFolder;
  let childFolder;
  let note1;
  let note2;
  let relationship;

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    // Cleanup any created test items
    if (testFolder?.id) {
      await prisma.noteRelationship.deleteMany({
        where: {
          OR: [
            { sourceNoteId: { in: [testFolder.id, childFolder?.id, note1?.id, note2?.id].filter(Boolean) } },
            { targetNoteId: { in: [testFolder.id, childFolder?.id, note1?.id, note2?.id].filter(Boolean) } },
          ],
        },
      });
      await prisma.note.deleteMany({
        where: {
          id: { in: [testFolder.id, childFolder?.id, note1?.id, note2?.id].filter(Boolean) },
        },
      });
    }
  });

  // Scenario 1: Create and visualize a folder.
  it('Scenario 1: Creates folder System Design and verifies it appears in Root Workspace Graph', async () => {
    // 1. Create folder System Design
    const createRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'System Design E2E Test',
        type: 'FOLDER',
      });

    expect(createRes.status).toBe(201);
    testFolder = createRes.body.data;
    expect(testFolder.title).toBe('System Design E2E Test');
    expect(testFolder.type).toBe('FOLDER');

    // 2. Open Root Workspace Graph
    const graphRes = await request(app).get('/api/v1/graph/root');
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.success).toBe(true);
    expect(graphRes.body.data.scope.id).toBe('root');

    // 3. Verify System Design appears as a folder node
    const folderNode = graphRes.body.data.nodes.find((n) => n.id === testFolder.id);
    expect(folderNode).toBeDefined();
    expect(folderNode.title).toBe('System Design E2E Test');
    expect(folderNode.type).toBe('FOLDER');
  });

  // Scenario 2: Create and visualize a note.
  it('Scenario 2: Creates note Foundation inside System Design and visualizes it in folder graph', async () => {
    // 1. Create note Foundation under System Design
    const noteRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Foundation',
        type: 'NOTE',
        parentId: testFolder.id,
      });

    expect(noteRes.status).toBe(201);
    note1 = noteRes.body.data;
    expect(note1.parentId).toBe(testFolder.id);

    // 2. Open System Design folder Graph
    const folderGraphRes = await request(app)
      .get(`/api/v1/graph/folders/${testFolder.id}?includeHierarchy=true`);

    expect(folderGraphRes.status).toBe(200);
    expect(folderGraphRes.body.data.scope.id).toBe(testFolder.id);

    // 3. Verify Foundation appears as note node
    const foundNote = folderGraphRes.body.data.nodes.find((n) => n.id === note1.id);
    expect(foundNote).toBeDefined();
    expect(foundNote.title).toBe('Foundation');
    expect(foundNote.type).toBe('NOTE');

    // 4. Verify folder hierarchy edge exists
    const hierarchyEdge = folderGraphRes.body.data.edges.find(
      (e) => e.isHierarchy === true && e.source === testFolder.id && e.target === note1.id
    );
    expect(hierarchyEdge).toBeDefined();
    expect(hierarchyEdge.relationshipType).toBe('PARENT_OF');
  });

  // Scenario 3: Create a knowledge relationship.
  it('Scenario 3: Creates Architecture Overview note and connects it to Foundation via RELATED_TO', async () => {
    // 1. Create Architecture Overview
    const note2Res = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Architecture Overview',
        type: 'NOTE',
        parentId: testFolder.id,
      });

    expect(note2Res.status).toBe(201);
    note2 = note2Res.body.data;

    // 2. Connect both notes using RELATED_TO
    const relRes = await request(app)
      .post('/api/v1/relationships')
      .send({
        sourceNoteId: note1.id,
        targetNoteId: note2.id,
        relationshipType: 'RELATED_TO',
        label: 'Foundation to Architecture',
      });

    expect(relRes.status).toBe(201);
    relationship = relRes.body.data;
    expect(relationship.relationshipType).toBe('RELATED_TO');

    // 3. Verify relationship appears as an edge in folder graph
    const graphRes = await request(app).get(`/api/v1/graph/folders/${testFolder.id}`);
    expect(graphRes.status).toBe(200);

    const relEdge = graphRes.body.data.edges.find((e) => e.id === relationship.id);
    expect(relEdge).toBeDefined();
    expect(relEdge.source).toBe(note1.id);
    expect(relEdge.target).toBe(note2.id);
    expect(relEdge.relationshipType).toBe('RELATED_TO');

    // 4. Update relationship label/type via PATCH
    const patchRes = await request(app)
      .patch(`/api/v1/relationships/${relationship.id}`)
      .send({
        label: 'Updated Semantic Link',
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.label).toBe('Updated Semantic Link');
  });

  // Scenario 4: Folder navigation and child folders.
  it('Scenario 4: Creates child folder Database Design and verifies child folder navigation', async () => {
    // 1. Create child folder Database Design under System Design
    const childFolderRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Database Design',
        type: 'FOLDER',
        parentId: testFolder.id,
      });

    expect(childFolderRes.status).toBe(201);
    childFolder = childFolderRes.body.data;

    // 2. Verify Database Design appears in System Design Graph
    const parentGraphRes = await request(app).get(`/api/v1/graph/folders/${testFolder.id}`);
    expect(parentGraphRes.status).toBe(200);

    const childFolderNode = parentGraphRes.body.data.nodes.find((n) => n.id === childFolder.id);
    expect(childFolderNode).toBeDefined();
    expect(childFolderNode.title).toBe('Database Design');
    expect(childFolderNode.type).toBe('FOLDER');

    // 3. Open Database Design child folder Graph
    const childGraphRes = await request(app).get(`/api/v1/graph/folders/${childFolder.id}`);
    expect(childGraphRes.status).toBe(200);
    expect(childGraphRes.body.data.scope.id).toBe(childFolder.id);
    expect(childGraphRes.body.data.scope.title).toBe('Database Design');

    // Breadcrumb verification
    expect(childGraphRes.body.data.scope.breadcrumbs.length).toBeGreaterThanOrEqual(2);
    expect(childGraphRes.body.data.scope.breadcrumbs[0].id).toBe('root');
    expect(childGraphRes.body.data.scope.breadcrumbs[1].id).toBe(testFolder.id);
  });

  // Scenario 5: Move note and preserve knowledge relationships.
  it('Scenario 5: Moves note Foundation to child folder and verifies knowledge relationships remain intact', async () => {
    // 1. Move Foundation into Database Design child folder
    const moveRes = await request(app)
      .patch(`/api/v1/notes/${note1.id}/move`)
      .send({
        newParentId: childFolder.id,
      });

    expect(moveRes.status).toBe(200);
    expect(moveRes.body.data.parentId).toBe(childFolder.id);

    // 2. Verify Database Design Graph now contains Foundation
    const childGraphRes = await request(app).get(`/api/v1/graph/folders/${childFolder.id}`);
    expect(childGraphRes.status).toBe(200);
    const inChildGraph = childGraphRes.body.data.nodes.find((n) => n.id === note1.id);
    expect(inChildGraph).toBeDefined();

    // 3. Verify knowledge relationship between note1 and note2 still exists in DB
    const relCheck = await prisma.noteRelationship.findUnique({
      where: { id: relationship.id },
    });
    expect(relCheck).toBeDefined();
    expect(relCheck.sourceNoteId).toBe(note1.id);
    expect(relCheck.targetNoteId).toBe(note2.id);
  });

  // Scenario 6: Cascade delete and clean up relationships.
  it('Scenario 6: Cascade deletes folder and verifies descendants and relationships are cleaned up', async () => {
    // 1. Delete parent testFolder with cascade=true
    const delRes = await request(app).delete(`/api/v1/notes/${testFolder.id}?cascade=true`);
    expect(delRes.status).toBe(204);

    // 2. Verify testFolder, childFolder, note1, note2 no longer exist
    const notesInDb = await prisma.note.findMany({
      where: {
        id: { in: [testFolder.id, childFolder.id, note1.id, note2.id] },
      },
    });
    expect(notesInDb).toHaveLength(0);

    // 3. Verify relationship was deleted (zero orphaned relationships)
    const relInDb = await prisma.noteRelationship.findUnique({
      where: { id: relationship.id },
    });
    expect(relInDb).toBeNull();

    // 4. Verify accessing deleted folder Graph returns 404
    const notFoundRes = await request(app).get(`/api/v1/graph/folders/${testFolder.id}`);
    expect(notFoundRes.status).toBe(404);
  });
});

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 5: Knowledge Graph Testing (TC-GRAPH-001 to TC-GRAPH-009)', () => {
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

  // TC-GRAPH-001: Empty Folder Graph
  it('TC-GRAPH-001: handles an empty folder graph gracefully without false errors', async () => {
    const emptyFolder = (await request(app).post('/api/v1/notes').send({
      title: 'Empty QA Folder',
      type: 'FOLDER',
    })).body.data;
    createdNoteIds.add(emptyFolder.id);

    const graphRes = await request(app).get(`/api/v1/graph/folders/${emptyFolder.id}`);
    expect(graphRes.status).toBe(200);
    expect(graphRes.body.success).toBe(true);
    expect(graphRes.body.data.scope.id).toBe(emptyFolder.id);
    expect(graphRes.body.data.scope.title).toBe('Empty QA Folder');
    expect(graphRes.body.data.nodes.length).toBe(1); // Central folder itself
    expect(graphRes.body.data.nodes[0].isCentralNode).toBe(true);
    expect(graphRes.body.data.edges.length).toBe(0);
    expect(graphRes.body.data.metadata.edgeCount).toBe(0);
  });

  // TC-GRAPH-002: Folder-Scoped Graph (Direct children only)
  it('TC-GRAPH-002: loads only direct children for folder scope and does not load deep descendants', async () => {
    // Structure:
    // System Design
    // ├── Foundation
    // │   ├── SOLID
    // │   └── Design Patterns
    // └── Architecture
    const sysDesign = (await request(app).post('/api/v1/notes').send({ title: 'SD Scope Test', type: 'FOLDER' })).body.data;
    const foundation = (await request(app).post('/api/v1/notes').send({ title: 'Foundation Scope', type: 'FOLDER', parentId: sysDesign.id })).body.data;
    const arch = (await request(app).post('/api/v1/notes').send({ title: 'Architecture Scope', type: 'FOLDER', parentId: sysDesign.id })).body.data;
    const solid = (await request(app).post('/api/v1/notes').send({ title: 'SOLID Note', type: 'NOTE', parentId: foundation.id })).body.data;
    const dp = (await request(app).post('/api/v1/notes').send({ title: 'Design Patterns Note', type: 'NOTE', parentId: foundation.id })).body.data;

    createdNoteIds.add(sysDesign.id);
    createdNoteIds.add(foundation.id);
    createdNoteIds.add(arch.id);
    createdNoteIds.add(solid.id);
    createdNoteIds.add(dp.id);

    // 1. Query System Design Graph
    const sdGraphRes = await request(app).get(`/api/v1/graph/folders/${sysDesign.id}`);
    expect(sdGraphRes.status).toBe(200);
    const sdNodeIds = sdGraphRes.body.data.nodes.map((n) => n.id);

    // Must contain System Design, Foundation, Architecture
    expect(sdNodeIds).toContain(sysDesign.id);
    expect(sdNodeIds).toContain(foundation.id);
    expect(sdNodeIds).toContain(arch.id);

    // Must NOT contain SOLID or Design Patterns (deep descendants of Foundation)
    expect(sdNodeIds).not.toContain(solid.id);
    expect(sdNodeIds).not.toContain(dp.id);

    // 2. Query Foundation Graph
    const fGraphRes = await request(app).get(`/api/v1/graph/folders/${foundation.id}`);
    expect(fGraphRes.status).toBe(200);
    const fNodeIds = fGraphRes.body.data.nodes.map((n) => n.id);

    // Must contain Foundation, SOLID, Design Patterns
    expect(fNodeIds).toContain(foundation.id);
    expect(fNodeIds).toContain(solid.id);
    expect(fNodeIds).toContain(dp.id);

    // Must NOT contain Architecture or System Design
    expect(fNodeIds).not.toContain(arch.id);
    expect(fNodeIds).not.toContain(sysDesign.id);
  });

  // TC-GRAPH-003: Hierarchy Edges
  it('TC-GRAPH-003: returns hierarchy edges between parent folder and direct children when includeHierarchy=true', async () => {
    const parentF = (await request(app).post('/api/v1/notes').send({ title: 'Parent H Edges', type: 'FOLDER' })).body.data;
    const child1 = (await request(app).post('/api/v1/notes').send({ title: 'Child H 1', type: 'NOTE', parentId: parentF.id })).body.data;
    const child2 = (await request(app).post('/api/v1/notes').send({ title: 'Child H 2', type: 'NOTE', parentId: parentF.id })).body.data;

    createdNoteIds.add(parentF.id);
    createdNoteIds.add(child1.id);
    createdNoteIds.add(child2.id);

    const res = await request(app).get(`/api/v1/graph/folders/${parentF.id}?includeHierarchy=true`);
    expect(res.status).toBe(200);

    const hierarchyEdges = res.body.data.edges.filter((e) => e.isHierarchy === true);
    expect(hierarchyEdges.length).toBe(2);
    expect(hierarchyEdges.every((e) => e.relationshipType === 'PARENT_OF')).toBe(true);
    expect(hierarchyEdges.every((e) => e.source === parentF.id)).toBe(true);
  });

  // TC-GRAPH-004: Knowledge Edges
  it('TC-GRAPH-004: returns semantic knowledge edges with correct types and direction', async () => {
    const f = (await request(app).post('/api/v1/notes').send({ title: 'Folder K Edges', type: 'FOLDER' })).body.data;
    const nA = (await request(app).post('/api/v1/notes').send({ title: 'Node A', type: 'NOTE', parentId: f.id })).body.data;
    const nB = (await request(app).post('/api/v1/notes').send({ title: 'Node B', type: 'NOTE', parentId: f.id })).body.data;

    createdNoteIds.add(f.id);
    createdNoteIds.add(nA.id);
    createdNoteIds.add(nB.id);

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: nA.id,
      targetNoteId: nB.id,
      relationshipType: 'DEPENDS_ON',
      description: 'A depends on B',
    })).body.data;
    createdRelIds.add(rel.id);

    const res = await request(app).get(`/api/v1/graph/folders/${f.id}`);
    expect(res.status).toBe(200);

    const knowledgeEdges = res.body.data.edges.filter((e) => !e.isHierarchy);
    expect(knowledgeEdges.length).toBe(1);
    expect(knowledgeEdges[0].source).toBe(nA.id);
    expect(knowledgeEdges[0].target).toBe(nB.id);
    expect(knowledgeEdges[0].relationshipType).toBe('DEPENDS_ON');
  });

  // TC-GRAPH-005: Independent Edge Visibility
  it('TC-GRAPH-005: toggles hierarchy edges and knowledge edges independently', async () => {
    const f = (await request(app).post('/api/v1/notes').send({ title: 'Toggle Edges Folder', type: 'FOLDER' })).body.data;
    const n1 = (await request(app).post('/api/v1/notes').send({ title: 'Toggle N1', type: 'NOTE', parentId: f.id })).body.data;
    const n2 = (await request(app).post('/api/v1/notes').send({ title: 'Toggle N2', type: 'NOTE', parentId: f.id })).body.data;

    createdNoteIds.add(f.id);
    createdNoteIds.add(n1.id);
    createdNoteIds.add(n2.id);

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: n1.id,
      targetNoteId: n2.id,
      relationshipType: 'RELATED_TO',
    })).body.data;
    createdRelIds.add(rel.id);

    // 1. Both enabled
    const bothRes = await request(app).get(`/api/v1/graph/folders/${f.id}?includeHierarchy=true&includeKnowledge=true`);
    const bothHierarchy = bothRes.body.data.edges.filter((e) => e.isHierarchy);
    const bothKnowledge = bothRes.body.data.edges.filter((e) => !e.isHierarchy);
    expect(bothHierarchy.length).toBe(2);
    expect(bothKnowledge.length).toBe(1);

    // 2. Only hierarchy (includeKnowledge=false)
    const hierarchyOnlyRes = await request(app).get(`/api/v1/graph/folders/${f.id}?includeHierarchy=true&includeKnowledge=false`);
    const hOnlyH = hierarchyOnlyRes.body.data.edges.filter((e) => e.isHierarchy);
    const hOnlyK = hierarchyOnlyRes.body.data.edges.filter((e) => !e.isHierarchy);
    expect(hOnlyH.length).toBe(2);
    expect(hOnlyK.length).toBe(0);

    // 3. Only knowledge (includeHierarchy=false)
    const knowledgeOnlyRes = await request(app).get(`/api/v1/graph/folders/${f.id}?includeHierarchy=false&includeKnowledge=true`);
    const kOnlyH = knowledgeOnlyRes.body.data.edges.filter((e) => e.isHierarchy);
    const kOnlyK = knowledgeOnlyRes.body.data.edges.filter((e) => !e.isHierarchy);
    expect(kOnlyH.length).toBe(0);
    expect(kOnlyK.length).toBe(1);
  });

  // TC-GRAPH-006: External Connections
  it('TC-GRAPH-006: marks external connected nodes as isExternal: true without loading their subtrees', async () => {
    const fIn = (await request(app).post('/api/v1/notes').send({ title: 'In Scope Folder', type: 'FOLDER' })).body.data;
    const fOut = (await request(app).post('/api/v1/notes').send({ title: 'Out of Scope Folder', type: 'FOLDER' })).body.data;
    const internalNote = (await request(app).post('/api/v1/notes').send({ title: 'Internal Note', type: 'NOTE', parentId: fIn.id })).body.data;
    const externalTarget = (await request(app).post('/api/v1/notes').send({ title: 'External Note Target', type: 'NOTE', parentId: fOut.id })).body.data;
    const externalSibling = (await request(app).post('/api/v1/notes').send({ title: 'External Sibling', type: 'NOTE', parentId: fOut.id })).body.data;

    createdNoteIds.add(fIn.id);
    createdNoteIds.add(fOut.id);
    createdNoteIds.add(internalNote.id);
    createdNoteIds.add(externalTarget.id);
    createdNoteIds.add(externalSibling.id);

    const rel = (await request(app).post('/api/v1/relationships').send({
      sourceNoteId: internalNote.id,
      targetNoteId: externalTarget.id,
      relationshipType: 'REFERENCES',
    })).body.data;
    createdRelIds.add(rel.id);

    // 1. With includeExternal=true
    const withExtRes = await request(app).get(`/api/v1/graph/folders/${fIn.id}?includeExternal=true`);
    const extNode = withExtRes.body.data.nodes.find((n) => n.id === externalTarget.id);
    expect(extNode).toBeDefined();
    expect(extNode.isExternal).toBe(true);

    // External sibling should NOT be loaded
    const siblingNode = withExtRes.body.data.nodes.find((n) => n.id === externalSibling.id);
    expect(siblingNode).toBeUndefined();

    // 2. With includeExternal=false
    const noExtRes = await request(app).get(`/api/v1/graph/folders/${fIn.id}?includeExternal=false`);
    const excludedNode = noExtRes.body.data.nodes.find((n) => n.id === externalTarget.id);
    expect(excludedNode).toBeUndefined();
  });

  // TC-GRAPH-007: Graph Navigation & Breadcrumbs
  it('TC-GRAPH-007: builds accurate breadcrumbs hierarchy chain from root to current folder', async () => {
    const rootF = (await request(app).post('/api/v1/notes').send({ title: 'BC Root', type: 'FOLDER' })).body.data;
    const midF = (await request(app).post('/api/v1/notes').send({ title: 'BC Mid', type: 'FOLDER', parentId: rootF.id })).body.data;
    const leafF = (await request(app).post('/api/v1/notes').send({ title: 'BC Leaf', type: 'FOLDER', parentId: midF.id })).body.data;

    createdNoteIds.add(rootF.id);
    createdNoteIds.add(midF.id);
    createdNoteIds.add(leafF.id);

    const res = await request(app).get(`/api/v1/graph/folders/${leafF.id}`);
    expect(res.status).toBe(200);

    const breadcrumbs = res.body.data.scope.breadcrumbs;
    expect(breadcrumbs).toBeDefined();
    expect(breadcrumbs.length).toBe(4); // Root -> BC Root -> BC Mid -> BC Leaf
    expect(breadcrumbs[0].id).toBe('root');
    expect(breadcrumbs[1].id).toBe(rootF.id);
    expect(breadcrumbs[2].id).toBe(midF.id);
    expect(breadcrumbs[3].id).toBe(leafF.id);
  });

  // TC-GRAPH-008: Graph Layout Metadata
  it('TC-GRAPH-008: calculates accurate folder/note counts and metadata', async () => {
    const parentF = (await request(app).post('/api/v1/notes').send({ title: 'Layout Meta Folder', type: 'FOLDER' })).body.data;
    const subF = (await request(app).post('/api/v1/notes').send({ title: 'SubF', type: 'FOLDER', parentId: parentF.id })).body.data;
    const n1 = (await request(app).post('/api/v1/notes').send({ title: 'Note 1', type: 'NOTE', parentId: parentF.id })).body.data;
    const n2 = (await request(app).post('/api/v1/notes').send({ title: 'Note 2', type: 'NOTE', parentId: parentF.id })).body.data;

    createdNoteIds.add(parentF.id);
    createdNoteIds.add(subF.id);
    createdNoteIds.add(n1.id);
    createdNoteIds.add(n2.id);

    const res = await request(app).get(`/api/v1/graph/folders/${parentF.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.metadata.folderCount).toBe(2); // parentF + subF
    expect(res.body.data.metadata.noteCount).toBe(2); // n1 + n2
  });

  // TC-GRAPH-009: Invalid Graph Data & Error Handling
  it('TC-GRAPH-009: handles invalid folder IDs, non-existent folders, and non-folder entities with clear errors', async () => {
    // 1. Non-existent UUID
    const nonExistent = await request(app).get('/api/v1/graph/folders/00000000-0000-4000-8000-000000000000');
    expect(nonExistent.status).toBe(404);
    expect(nonExistent.body.success).toBe(false);

    // 2. Entity is a NOTE instead of a FOLDER
    const note = (await request(app).post('/api/v1/notes').send({ title: 'Just a Note', type: 'NOTE' })).body.data;
    createdNoteIds.add(note.id);

    const noteScope = await request(app).get(`/api/v1/graph/folders/${note.id}`);
    expect(noteScope.status).toBe(400);
    expect(noteScope.body.message).toMatch(/is a NOTE, not a FOLDER/i);

    // 3. Malformed UUID parameter
    const malformed = await request(app).get('/api/v1/graph/folders/invalid-not-a-uuid');
    expect(malformed.status).toBe(400);
  });
});

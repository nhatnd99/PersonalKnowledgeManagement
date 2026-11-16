import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';

describe('QA Phase 2: Note Management & Editor Testing (TC-NOTE-001 to TC-NOTE-007)', () => {
  let app;
  const createdNoteIds = new Set();
  let testFolder;

  beforeAll(async () => {
    app = createApp();

    // Setup an isolated parent folder
    const folderRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'QA Notes Parent Folder',
        type: 'FOLDER',
      });
    testFolder = folderRes.body.data;
    createdNoteIds.add(testFolder.id);
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

  // TC-NOTE-001: Create Note
  it('TC-NOTE-001: creates a new note inside a folder with correct parentId and persists in PostgreSQL', async () => {
    const res = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'System Design Intro',
        type: 'NOTE',
        parentId: testFolder.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe('System Design Intro');
    expect(res.body.data.type).toBe('NOTE');
    expect(res.body.data.parentId).toBe(testFolder.id);

    const noteId = res.body.data.id;
    createdNoteIds.add(noteId);

    // Verify in database
    const dbNote = await prisma.note.findUnique({ where: { id: noteId } });
    expect(dbNote).not.toBeNull();
    expect(dbNote.title).toBe('System Design Intro');
    expect(dbNote.parentId).toBe(testFolder.id);
  });

  // TC-NOTE-002: Edit Note Title
  it('TC-NOTE-002: updates note title to "System Design Foundation" and persists without reverting', async () => {
    const createRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Untitled Note',
        type: 'NOTE',
        parentId: testFolder.id,
      });
    const noteId = createRes.body.data.id;
    createdNoteIds.add(noteId);

    // Edit title
    const updateRes = await request(app)
      .patch(`/api/v1/notes/${noteId}`)
      .send({
        title: 'System Design Foundation',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.title).toBe('System Design Foundation');

    // Verify via GET request (simulating page reload)
    const getRes = await request(app).get(`/api/v1/notes/${noteId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe('System Design Foundation');

    // Verify in PostgreSQL
    const dbNote = await prisma.note.findUnique({ where: { id: noteId } });
    expect(dbNote.title).toBe('System Design Foundation');
  });

  // TC-NOTE-003: Edit Rich Text Content
  it('TC-NOTE-003: persists rich text content (headings, bold, lists, links, tables) without data loss', async () => {
    const createRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Rich Content Note',
        type: 'NOTE',
      });
    const noteId = createRes.body.data.id;
    createdNoteIds.add(noteId);

    const complexTipTapDoc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '1. Core Principles' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This paragraph has ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'bold text' },
            { type: 'text', text: ' and ' },
            { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
            { type: 'text', text: ' and a ' },
            {
              type: 'text',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
              text: 'hyperlink',
            },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Scalability' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Maintainability' }],
                },
              ],
            },
          ],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Step One' }],
                },
              ],
            },
          ],
        },
      ],
    };

    // Save content via content endpoint
    const saveContentRes = await request(app)
      .put(`/api/v1/notes/${noteId}/content`)
      .send({
        content: complexTipTapDoc,
        contentFormat: 'json',
      });

    expect(saveContentRes.status).toBe(200);
    expect(saveContentRes.body.success).toBe(true);

    // Verify GET retrieves exact ProseMirror structure
    const getRes = await request(app).get(`/api/v1/notes/${noteId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.content).toEqual(complexTipTapDoc);

    // Verify title was not overwritten
    expect(getRes.body.data.title).toBe('Rich Content Note');
  });

  // TC-NOTE-004: Simultaneous Title and Content Editing
  it('TC-NOTE-004: independently persists title and content without overwriting each other', async () => {
    const createRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Initial Title',
        type: 'NOTE',
      });
    const noteId = createRes.body.data.id;
    createdNoteIds.add(noteId);

    const docContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body content' }] }],
    };

    // Concurrent requests: title patch and content put
    const [titleRes, contentRes] = await Promise.all([
      request(app).patch(`/api/v1/notes/${noteId}`).send({ title: 'Updated Title Concurrently' }),
      request(app).put(`/api/v1/notes/${noteId}/content`).send({ content: docContent }),
    ]);

    expect(titleRes.status).toBe(200);
    expect(contentRes.status).toBe(200);

    // Final verification from database
    const finalNote = await request(app).get(`/api/v1/notes/${noteId}`);
    expect(finalNote.status).toBe(200);
    expect(finalNote.body.data.title).toBe('Updated Title Concurrently');
    expect(finalNote.body.data.content).toEqual(docContent);
  });

  // TC-NOTE-005: Rapid Editing
  it('TC-NOTE-005: handles rapid successive updates and ensures latest values persist', async () => {
    const createRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Rapid Note',
        type: 'NOTE',
      });
    const noteId = createRes.body.data.id;
    createdNoteIds.add(noteId);

    // Fire 5 rapid title updates in sequence
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .patch(`/api/v1/notes/${noteId}`)
        .send({ title: `Rapid Title Revision ${i}` });
    }

    const finalRes = await request(app).get(`/api/v1/notes/${noteId}`);
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.data.title).toBe('Rapid Title Revision 5');
  });

  // TC-NOTE-006: Network & Input Failure Scenarios
  it('TC-NOTE-006: rejects invalid inputs with appropriate 400 and 404 status codes', async () => {
    // 1. Invalid UUID format
    const invalidUuidRes = await request(app).get('/api/v1/notes/not-a-valid-uuid');
    expect(invalidUuidRes.status).toBe(400);
    expect(invalidUuidRes.body.success).toBe(false);

    // 2. Non-existent UUID
    const nonExistentRes = await request(app).get('/api/v1/notes/00000000-0000-4000-8000-000000000000');
    expect(nonExistentRes.status).toBe(404);
    expect(nonExistentRes.body.success).toBe(false);

    // 3. Create Note with empty title
    const emptyTitleRes = await request(app)
      .post('/api/v1/notes')
      .send({ title: '   ', type: 'NOTE' });
    expect(emptyTitleRes.status).toBe(400);

    // 4. Create Note with non-existent parentId
    const badParentRes = await request(app)
      .post('/api/v1/notes')
      .send({
        title: 'Child of Nowhere',
        type: 'NOTE',
        parentId: '99999999-9999-4999-8999-999999999999',
      });
    expect(badParentRes.status).toBe(404);
  });

  // TC-NOTE-007: Note Navigation & State Isolation
  it('TC-NOTE-007: isolates state between different notes without cross-contamination', async () => {
    const resA = await request(app).post('/api/v1/notes').send({ title: 'Note Alpha', type: 'NOTE' });
    const resB = await request(app).post('/api/v1/notes').send({ title: 'Note Beta', type: 'NOTE' });
    const noteAId = resA.body.data.id;
    const noteBId = resB.body.data.id;
    createdNoteIds.add(noteAId);
    createdNoteIds.add(noteBId);

    const contentA = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alpha text' }] }] };
    const contentB = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Beta text' }] }] };

    await request(app).put(`/api/v1/notes/${noteAId}/content`).send({ content: contentA });
    await request(app).put(`/api/v1/notes/${noteBId}/content`).send({ content: contentB });

    const fetchA = await request(app).get(`/api/v1/notes/${noteAId}`);
    const fetchB = await request(app).get(`/api/v1/notes/${noteBId}`);

    expect(fetchA.body.data.title).toBe('Note Alpha');
    expect(fetchA.body.data.content).toEqual(contentA);

    expect(fetchB.body.data.title).toBe('Note Beta');
    expect(fetchB.body.data.content).toEqual(contentB);
  });
});

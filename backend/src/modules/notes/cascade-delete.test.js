import { jest } from '@jest/globals';

// Test fixtures with valid UUID v4 format
const FOLDER_A_ID = '11111111-1111-4111-8111-111111111111';
const SUBFOLDER_B_ID = '22222222-2222-4222-8222-222222222222';
const NOTE_INSIDE_A_ID = '33333333-3333-4333-8333-333333333333';
const CHILD_NOTE_ID = '44444444-4444-4444-8444-444444444444';
const EXTERNAL_FOLDER_ID = '55555555-5555-4555-8555-555555555555';
const EXTERNAL_NOTE_ID = '66666666-6666-4666-8666-666666666666';
const ROOT_NOTE_ID = '77777777-7777-4777-8777-777777777777';
const REL_A_TO_EXT_ID = '88888888-8888-4888-8888-888888888888';
const REL_EXT_TO_A_ID = '99999999-9999-4999-8999-999999999999';

// In-memory mock database state for testing cascade deletion logic
let mockNotesDb = [];
let mockRelationshipsDb = [];

function resetDb() {
  mockNotesDb = [
    { id: FOLDER_A_ID, title: 'Folder A', type: 'FOLDER', parentId: null },
    { id: SUBFOLDER_B_ID, title: 'Subfolder B', type: 'FOLDER', parentId: FOLDER_A_ID },
    { id: NOTE_INSIDE_A_ID, title: 'Note in A', type: 'NOTE', parentId: FOLDER_A_ID },
    { id: CHILD_NOTE_ID, title: 'Child Note of Note in A', type: 'NOTE', parentId: NOTE_INSIDE_A_ID },
    { id: EXTERNAL_FOLDER_ID, title: 'External Folder', type: 'FOLDER', parentId: null },
    { id: EXTERNAL_NOTE_ID, title: 'External Note', type: 'NOTE', parentId: EXTERNAL_FOLDER_ID },
    { id: ROOT_NOTE_ID, title: 'Independent Root Note', type: 'NOTE', parentId: null },
  ];

  mockRelationshipsDb = [
    {
      id: REL_A_TO_EXT_ID,
      sourceNoteId: NOTE_INSIDE_A_ID,
      targetNoteId: EXTERNAL_NOTE_ID,
      relationshipType: 'REFERENCES',
    },
    {
      id: REL_EXT_TO_A_ID,
      sourceNoteId: EXTERNAL_NOTE_ID,
      targetNoteId: NOTE_INSIDE_A_ID,
      relationshipType: 'RELATED_TO',
    },
  ];
}

jest.unstable_mockModule('../../config/database.js', () => {
  return {
    prisma: {
      note: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const found = mockNotesDb.find((n) => n.id === where.id);
          return Promise.resolve(found || null);
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          let list = [...mockNotesDb];
          if (where?.parentId?.in) {
            list = list.filter((n) => where.parentId.in.includes(n.parentId));
          } else if (where?.parentId !== undefined) {
            list = list.filter((n) => n.parentId === where.parentId);
          }
          return Promise.resolve(list);
        }),
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          let count = 0;
          mockNotesDb.forEach((n) => {
            if (where?.id?.in?.includes(n.id) || where?.parentId === n.parentId) {
              Object.assign(n, data);
              count++;
            }
          });
          return Promise.resolve({ count });
        }),
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          const idsToDelete = where?.id?.in || [];
          const initialLen = mockNotesDb.length;
          mockNotesDb = mockNotesDb.filter((n) => !idsToDelete.includes(n.id));
          return Promise.resolve({ count: initialLen - mockNotesDb.length });
        }),
        delete: jest.fn().mockImplementation(({ where }) => {
          const idx = mockNotesDb.findIndex((n) => n.id === where.id);
          if (idx !== -1) {
            const [deleted] = mockNotesDb.splice(idx, 1);
            return Promise.resolve(deleted);
          }
          return Promise.resolve(null);
        }),
      },
      noteRelationship: {
        count: jest.fn().mockImplementation(({ where }) => {
          const ids = where?.OR?.[0]?.sourceNoteId?.in || [];
          const matches = mockRelationshipsDb.filter(
            (r) => ids.includes(r.sourceNoteId) || ids.includes(r.targetNoteId)
          );
          return Promise.resolve(matches.length);
        }),
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          const ids = where?.OR?.[0]?.sourceNoteId?.in || [];
          const initialLen = mockRelationshipsDb.length;
          mockRelationshipsDb = mockRelationshipsDb.filter(
            (r) => !ids.includes(r.sourceNoteId) && !ids.includes(r.targetNoteId)
          );
          return Promise.resolve({ count: initialLen - mockRelationshipsDb.length });
        }),
      },
      noteTag: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation((operations) => {
        return Promise.all(operations);
      }),
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const noteService = await import('./note.service.js');

describe('Cascade Deletion & Semantic Relationship Cleanup', () => {
  beforeEach(() => {
    resetDb();
  });

  // Test 1: Delete an empty Folder
  it('1. deletes an empty Folder successfully', async () => {
    mockNotesDb.push({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Empty Folder',
      type: 'FOLDER',
      parentId: null,
    });

    const result = await noteService.deleteNote('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(result.success).toBe(true);
    expect(mockNotesDb.find((n) => n.id === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBeUndefined();
  });

  // Test 2: Delete Folder containing Notes
  it('2. deletes Folder containing Notes, removing notes inside it', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    expect(mockNotesDb.find((n) => n.id === FOLDER_A_ID)).toBeUndefined();
    expect(mockNotesDb.find((n) => n.id === NOTE_INSIDE_A_ID)).toBeUndefined();
  });

  // Test 3: Delete Folder containing nested Subfolders
  it('3. deletes Folder containing nested Subfolders recursively', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    expect(mockNotesDb.find((n) => n.id === SUBFOLDER_B_ID)).toBeUndefined();
  });

  // Test 4: Delete Folder containing nested Notes
  it('4. deletes Folder containing nested Notes and child notes', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    expect(mockNotesDb.find((n) => n.id === CHILD_NOTE_ID)).toBeUndefined();
  });

  // Test 5: Delete Note with child Notes
  it('5. deletes Note with child Notes, removing both', async () => {
    await noteService.deleteNote(NOTE_INSIDE_A_ID);
    expect(mockNotesDb.find((n) => n.id === NOTE_INSIDE_A_ID)).toBeUndefined();
    expect(mockNotesDb.find((n) => n.id === CHILD_NOTE_ID)).toBeUndefined();
    // Parent folder A must still exist!
    expect(mockNotesDb.find((n) => n.id === FOLDER_A_ID)).toBeDefined();
  });

  // Test 6: Delete independent Root Note
  it('6. deletes independent Root Note without affecting other notes', async () => {
    await noteService.deleteNote(ROOT_NOTE_ID);
    expect(mockNotesDb.find((n) => n.id === ROOT_NOTE_ID)).toBeUndefined();
    expect(mockNotesDb.find((n) => n.id === FOLDER_A_ID)).toBeDefined();
    expect(mockNotesDb.find((n) => n.id === EXTERNAL_NOTE_ID)).toBeDefined();
  });

  // Test 7: Delete node with outgoing relationships
  it('7. deletes node with outgoing relationships and removes the relationship', async () => {
    await noteService.deleteNote(NOTE_INSIDE_A_ID);
    expect(mockRelationshipsDb.find((r) => r.id === REL_A_TO_EXT_ID)).toBeUndefined();
  });

  // Test 8: Delete node with incoming relationships
  it('8. deletes node with incoming relationships and removes the relationship', async () => {
    await noteService.deleteNote(NOTE_INSIDE_A_ID);
    expect(mockRelationshipsDb.find((r) => r.id === REL_EXT_TO_A_ID)).toBeUndefined();
  });

  // Test 9: Delete Folder with external semantic relationships
  it('9. deletes Folder with external semantic relationships', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    expect(mockRelationshipsDb.find((r) => r.id === REL_A_TO_EXT_ID)).toBeUndefined();
    expect(mockRelationshipsDb.find((r) => r.id === REL_EXT_TO_A_ID)).toBeUndefined();
  });

  // Test 10: Verify external Notes remain intact
  it('10. verifies external Notes remain intact when target of relationship is deleted', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    const externalNote = mockNotesDb.find((n) => n.id === EXTERNAL_NOTE_ID);
    expect(externalNote).toBeDefined();
    expect(externalNote.title).toBe('External Note');
  });

  // Test 11: Verify external Folders remain intact
  it('11. verifies external Folders remain intact', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    const externalFolder = mockNotesDb.find((n) => n.id === EXTERNAL_FOLDER_ID);
    expect(externalFolder).toBeDefined();
    expect(externalFolder.title).toBe('External Folder');
  });

  // Test 12: Verify no orphaned relationships remain
  it('12. verifies no orphaned relationships remain referencing deleted IDs', async () => {
    await noteService.deleteNote(FOLDER_A_ID);
    const deletedIds = [FOLDER_A_ID, SUBFOLDER_B_ID, NOTE_INSIDE_A_ID, CHILD_NOTE_ID];
    const orphaned = mockRelationshipsDb.filter(
      (r) => deletedIds.includes(r.sourceNoteId) || deletedIds.includes(r.targetNoteId)
    );
    expect(orphaned.length).toBe(0);
  });

  // Test 13: Delete Preview returns accurate metrics
  it('13. computes accurate delete preview metrics for Folder with descendants', async () => {
    const preview = await noteService.getDeletePreview(FOLDER_A_ID);
    expect(preview.target.id).toBe(FOLDER_A_ID);
    expect(preview.descendants.folders).toBe(1); // Subfolder B
    expect(preview.descendants.notes).toBe(2); // Note in A, Child Note
    expect(preview.affectedRelationships).toBe(2);
    expect(preview.totalEntitiesToDelete).toBe(4);
  });

  // Test 14: Throws 404 when deleting non-existent note
  it('14. throws 404 when attempting to delete a non-existent entity', async () => {
    await expect(noteService.deleteNote('00000000-0000-4000-8000-000000000000')).rejects.toThrow(
      'Note with ID 00000000-0000-4000-8000-000000000000 not found'
    );
  });
});

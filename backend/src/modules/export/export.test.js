import { jest } from '@jest/globals';
import request from 'supertest';

const VALID_NOTE_ID = '11111111-1111-4111-8111-111111111111';

// Mock prisma before importing any service or app
jest.unstable_mockModule('../../config/database.js', () => {
  const mockNote = {
    id: VALID_NOTE_ID,
    title: 'Spring Security Architecture',
    type: 'NOTE',
    isFavorite: true,
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'JWT Filters' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Token validation via ' },
            { type: 'text', text: 'OncePerRequestFilter', marks: [{ type: 'bold' }] },
            { type: 'text', text: '.' },
          ],
        },
      ],
    },
    contentFormat: 'json',
    tags: [{ tag: { name: 'security' } }],
    outgoingRelationships: [
      {
        relationshipType: 'DEPENDS_ON',
        description: 'Requires token parser',
        targetNote: { id: '22222222-2222-4222-8222-222222222222', title: 'JWT Token' },
      },
    ],
    incomingRelationships: [],
  };

  return {
    prisma: {
      note: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === VALID_NOTE_ID) return Promise.resolve(mockNote);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: '55555555-5555-4555-8555-555555555555',
            ...data,
          });
        }),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { proseMirrorToMarkdown } = await import('./export.service.js');
const { createApp } = await import('../../app.js');

describe('Export and Import API Endpoints', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('proseMirrorToMarkdown utility', () => {
    it('converts heading and formatted text to markdown correctly', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Overview' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'World', marks: [{ type: 'bold' }] },
            ],
          },
        ],
      };

      const md = proseMirrorToMarkdown(doc);
      expect(md).toContain('# Overview');
      expect(md).toContain('Hello **World**');
    });
  });

  describe('GET /api/v1/notes/:noteId/export', () => {
    it('exports note as Markdown with frontmatter with 200', async () => {
      const res = await request(app).get(`/api/v1/notes/${VALID_NOTE_ID}/export?format=markdown`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('filename');
      expect(res.body.data).toHaveProperty('markdown');
      expect(res.body.data.markdown).toContain('title: "Spring Security Architecture"');
      expect(res.body.data.markdown).toContain('## JWT Filters');
      expect(res.body.data.markdown).toContain('**OncePerRequestFilter**');
    });

    it('exports note as portable JSON with 200', async () => {
      const res = await request(app).get(`/api/v1/notes/${VALID_NOTE_ID}/export?format=json`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.note.title).toBe('Spring Security Architecture');
      expect(res.body.data.note.tags).toContain('security');
      expect(res.body.data.note.outgoing[0].type).toBe('DEPENDS_ON');
    });
  });

  describe('POST /api/v1/notes/import', () => {
    it('imports note and returns 201 Created', async () => {
      const payload = {
        title: 'Imported Architecture Note',
        markdown: '# Section\n\nContent paragraph here.',
      };

      const res = await request(app).post('/api/v1/notes/import').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Imported Architecture Note');
    });

    it('rejects import without title with 400', async () => {
      const res = await request(app).post('/api/v1/notes/import').send({ title: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

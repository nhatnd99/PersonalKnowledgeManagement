import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Rich seed script for local development and manual testing.
 * Sets up a realistic PKM workspace with hierarchy, relationships, tags, and rich content.
 * Executed via: npm run prisma:seed (or npx prisma db seed)
 */
async function main() {
  console.info('[Prisma Seed] Starting comprehensive database seed for local development...');

  // 1. Tags
  const tagArchitecture = await prisma.tag.upsert({
    where: { name: 'architecture' },
    update: {},
    create: {
      name: 'architecture',
      color: '#3b82f6',
      description: 'System design, patterns, and principles',
    },
  });

  const tagBackend = await prisma.tag.upsert({
    where: { name: 'backend' },
    update: {},
    create: {
      name: 'backend',
      color: '#10b981',
      description: 'Server-side engineering and APIs',
    },
  });

  const tagSecurity = await prisma.tag.upsert({
    where: { name: 'security' },
    update: {},
    create: {
      name: 'security',
      color: '#f59e0b',
      description: 'Authentication, authorization, cryptography',
    },
  });

  const tagDatabase = await prisma.tag.upsert({
    where: { name: 'database' },
    update: {},
    create: {
      name: 'database',
      color: '#8b5cf6',
      description: 'Storage engines, SQL, indexes, and queries',
    },
  });

  // 2. Root Folders
  const folderBackend = await prisma.note.upsert({
    where: { id: '10000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      title: 'Backend Engineering',
      type: 'FOLDER',
      content: null,
      contentFormat: 'json',
      parentId: null,
      sortOrder: 0,
      isFavorite: true,
    },
  });

  const folderDatabase = await prisma.note.upsert({
    where: { id: '10000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000002',
      title: 'Databases & Storage',
      type: 'FOLDER',
      content: null,
      contentFormat: 'json',
      parentId: null,
      sortOrder: 1,
      isFavorite: false,
    },
  });

  // 3. Child Notes
  const noteSpringBoot = await prisma.note.upsert({
    where: { id: '20000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000001',
      title: 'Spring Boot Architecture',
      type: 'NOTE',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Spring Boot Architecture Overview' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Spring Boot provides opinionated starter dependencies and auto-configuration for modern enterprise Java applications.' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Core Concepts' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Inversion of Control (IoC) and Dependency Injection (DI)' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Component scanning and configuration classes' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Actuator metrics and production health indicators' }] }],
              },
            ],
          },
        ],
      },
      contentFormat: 'json',
      parentId: folderBackend.id,
      sortOrder: 0,
      isFavorite: true,
    },
  });

  const noteJwtAuth = await prisma.note.upsert({
    where: { id: '20000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000002',
      title: 'JWT Authentication & Authorization',
      type: 'NOTE',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Stateless Authentication with JSON Web Tokens' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'JSON Web Tokens consist of three base64url-encoded segments: Header, Payload, and Signature.' },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Tokens should be stored in secure HttpOnly cookies to defend against XSS attacks.' },
            ],
          },
        ],
      },
      contentFormat: 'json',
      parentId: folderBackend.id,
      sortOrder: 1,
      isFavorite: false,
    },
  });

  const notePostgreSQL = await prisma.note.upsert({
    where: { id: '20000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '20000000-0000-4000-8000-000000000003',
      title: 'PostgreSQL Relational Design & JSONB',
      type: 'NOTE',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'PostgreSQL & Relational Data Modeling' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'PostgreSQL blends ACID relational reliability with native binary JSON (JSONB) column storage for flexible document trees like TipTap ProseMirror content.' },
            ],
          },
        ],
      },
      contentFormat: 'json',
      parentId: folderDatabase.id,
      sortOrder: 0,
      isFavorite: true,
    },
  });

  // 4. Note Tag joins
  await prisma.noteTag.upsert({
    where: { noteId_tagId: { noteId: noteSpringBoot.id, tagId: tagBackend.id } },
    update: {},
    create: { noteId: noteSpringBoot.id, tagId: tagBackend.id },
  });

  await prisma.noteTag.upsert({
    where: { noteId_tagId: { noteId: noteSpringBoot.id, tagId: tagArchitecture.id } },
    update: {},
    create: { noteId: noteSpringBoot.id, tagId: tagArchitecture.id },
  });

  await prisma.noteTag.upsert({
    where: { noteId_tagId: { noteId: noteJwtAuth.id, tagId: tagSecurity.id } },
    update: {},
    create: { noteId: noteJwtAuth.id, tagId: tagSecurity.id },
  });

  await prisma.noteTag.upsert({
    where: { noteId_tagId: { noteId: notePostgreSQL.id, tagId: tagDatabase.id } },
    update: {},
    create: { noteId: notePostgreSQL.id, tagId: tagDatabase.id },
  });

  // 5. Knowledge Graph Relationships
  await prisma.noteRelationship.upsert({
    where: {
      sourceNoteId_targetNoteId_relationshipType: {
        sourceNoteId: noteSpringBoot.id,
        targetNoteId: noteJwtAuth.id,
        relationshipType: 'DEPENDS_ON',
      },
    },
    update: {},
    create: {
      sourceNoteId: noteSpringBoot.id,
      targetNoteId: noteJwtAuth.id,
      relationshipType: 'DEPENDS_ON',
      description: 'Spring Security relies on JWT filters for stateless API authentication',
    },
  });

  await prisma.noteRelationship.upsert({
    where: {
      sourceNoteId_targetNoteId_relationshipType: {
        sourceNoteId: noteSpringBoot.id,
        targetNoteId: notePostgreSQL.id,
        relationshipType: 'REFERENCES',
      },
    },
    update: {},
    create: {
      sourceNoteId: noteSpringBoot.id,
      targetNoteId: notePostgreSQL.id,
      relationshipType: 'REFERENCES',
      description: 'Backend services persist knowledge records into PostgreSQL with Prisma Client',
    },
  });

  console.info('[Prisma Seed] Seed complete: Created 2 folders, 3 notes, 4 tags, and 2 directional relationships.');
}

main()
  .catch((e) => {
    console.error('[Prisma Seed] Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

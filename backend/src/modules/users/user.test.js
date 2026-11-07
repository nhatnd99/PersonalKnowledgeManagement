import { jest } from '@jest/globals';
import request from 'supertest';

// Mock prisma before importing app
jest.unstable_mockModule('../../config/database.js', () => {
  const mockUser = {
    id: '00000000-0000-4000-8000-000000000000',
    name: 'Knowledge Architect',
    email: 'architect@knowledge.app',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    prisma: {
      user: {
        findFirst: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockImplementation(({ data }) => {
          return Promise.resolve({ ...mockUser, ...data });
        }),
      },
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    },
    connectDatabase: jest.fn().mockResolvedValue(undefined),
    disconnectDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

const { createApp } = await import('../../app.js');

describe('User Profile API Endpoints (/api/v1/user/profile)', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/v1/user/profile returns 200 with current profile', async () => {
    const res = await request(app).get('/api/v1/user/profile');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Knowledge Architect');
  });

  it('PATCH /api/v1/user/profile updates name and returns 200', async () => {
    const res = await request(app)
      .patch('/api/v1/user/profile')
      .send({ name: 'Lead Architect' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Lead Architect');
  });
});

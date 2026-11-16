import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { COOKIE_NAME } from '../../src/modules/auth/auth.constants.js';
import { devEmailOutbox } from '../../src/modules/auth/email.service.js';

describe('Phase 2 & 4: Authentication, Session Management & Password Lifecycle', () => {
  jest.setTimeout(30000);
  let app;
  const testUserIds = new Set();

  beforeAll(async () => {
    app = createApp();
  });

  afterAll(async () => {
    if (testUserIds.size > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: Array.from(testUserIds) } },
      }).catch(() => {});
    }
  });

  const testUser = {
    email: `auth_test_${Date.now()}@knowledge.app`,
    password: 'ValidPassword123!',
    displayName: 'Auth Test User',
  };

  let sessionCookie = '';

  // ─── 1. REGISTRATION ────────────────────────────────────────────────────────

  it('registers a new user successfully, hashes password, and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.displayName).toBe(testUser.displayName);
    expect(res.body.data.user.passwordHash).toBeUndefined();

    testUserIds.add(res.body.data.user.id);

    // Verify Set-Cookie header contains HttpOnly session cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieStr = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
    expect(cookieStr).toBeDefined();
    expect(cookieStr).toContain('HttpOnly');

    sessionCookie = cookieStr.split(';')[0];
  });

  it('rejects registration with duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email.toUpperCase(), // Case insensitive check
        password: 'ValidPassword123!',
        displayName: 'Duplicate User',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with weak password (<12 chars or missing variety) with 400', async () => {
    const resShort = await request(app)
      .post('/api/auth/register')
      .send({
        email: `short_${Date.now()}@knowledge.app`,
        password: 'Short1!',
      });
    expect(resShort.status).toBe(400);

    const resNoUpper = await request(app)
      .post('/api/auth/register')
      .send({
        email: `noupper_${Date.now()}@knowledge.app`,
        password: 'validpassword123!',
      });
    expect(resNoUpper.status).toBe(400);
  });

  it('rejects registration with malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'ValidPassword123!',
      });
    expect(res.status).toBe(400);
  });

  // ─── 2. LOGIN & CREDENTIALS ────────────────────────────────────────────────

  it('authenticates user with valid credentials and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        rememberMe: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

    const cookies = res.headers['set-cookie'];
    const cookieStr = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
    expect(cookieStr).toBeDefined();
    sessionCookie = cookieStr.split(';')[0];
  });

  it('rejects login with incorrect password with 401 generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('rejects login with unknown email with 401 generic message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent_user_9999@knowledge.app',
        password: 'SomePassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  // ─── 3. SESSION VALIDATION (/api/auth/me) ───────────────────────────────────

  it('validates active session and returns authenticated user via GET /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('rejects unauthenticated request to /api/auth/me with 401 when cookie is missing', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('X-Anonymous', 'true');

    expect(res.status).toBe(401);
  });

  it('rejects request with invalid or tampered session token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${COOKIE_NAME}=tampered_token_abcdef1234567890`);

    expect(res.status).toBe(401);
  });

  // ─── 4. SESSIONS & DEVICE MANAGEMENT ────────────────────────────────────────

  it('lists active sessions for user via GET /api/auth/sessions', async () => {
    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const currentSession = res.body.data.find((s) => s.isCurrent === true);
    expect(currentSession).toBeDefined();
    expect(currentSession.tokenHash).toBeUndefined(); // Never expose token hash!
  });

  it('revokes an individual session via DELETE /api/auth/sessions/:id', async () => {
    // Create second session
    const login2 = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Secondary Device Test')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    const cookie2 = login2.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`)).split(';')[0];

    const listRes = await request(app)
      .get('/api/auth/sessions')
      .set('Cookie', sessionCookie);

    const otherSession = listRes.body.data.find((s) => !s.isCurrent);
    expect(otherSession).toBeDefined();

    // Revoke the other session using session 1
    const revokeRes = await request(app)
      .delete(`/api/auth/sessions/${otherSession.id}`)
      .set('Cookie', sessionCookie);

    expect(revokeRes.status).toBe(200);

    // Verify revoked session cannot authenticate
    const testRevokedRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie2);

    expect(testRevokedRes.status).toBe(401);
  });

  // ─── 5. PASSWORD RECOVERY & RESET ──────────────────────────────────────────

  it('handles forgot password request and records single-use reset token', async () => {
    devEmailOutbox.length = 0; // Clear dev outbox

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password reset link has been sent/i);

    // Verify reset token was captured in dev outbox
    expect(devEmailOutbox.length).toBe(1);
    expect(devEmailOutbox[0].to).toBe(testUser.email.toLowerCase());
    expect(devEmailOutbox[0].resetToken).toBeDefined();

    const resetToken = devEmailOutbox[0].resetToken;

    // Reset password using the token
    const newPassword = 'NewSecretPassword456!';
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword,
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toMatch(/password has been reset successfully/i);

    // Verify old password is now rejected
    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    expect(oldLoginRes.status).toBe(401);

    // Verify new password logs in successfully
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: newPassword,
      });
    expect(newLoginRes.status).toBe(200);

    // Update active cookie and password
    testUser.password = newPassword;
    sessionCookie = newLoginRes.headers['set-cookie'].find((c) => c.startsWith(`${COOKIE_NAME}=`)).split(';')[0];

    // Reusing the same reset token must be rejected
    const reuseRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'AnotherPassword789!',
      });
    expect(reuseRes.status).toBe(400);
  });

  // ─── 6. CHANGE PASSWORD ────────────────────────────────────────────────────

  it('allows authenticated user to change password and preserves current session', async () => {
    const updatedPassword = 'FinalUpdatedPassword999!';

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Cookie', sessionCookie)
      .send({
        currentPassword: testUser.password,
        newPassword: updatedPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/password changed successfully/i);

    testUser.password = updatedPassword;

    // Current session remains valid
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);
    expect(meRes.status).toBe(200);
  });

  // ─── 7. USER PROFILE ───────────────────────────────────────────────────────

  it('retrieves and updates user profile via /api/users/me', async () => {
    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Cookie', sessionCookie);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.displayName).toBe(testUser.displayName);

    const updateRes = await request(app)
      .patch('/api/users/me')
      .set('Cookie', sessionCookie)
      .send({
        displayName: 'Senior Knowledge Architect',
        avatarUrl: 'https://example.com/avatar.png',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.displayName).toBe('Senior Knowledge Architect');
    expect(updateRes.body.data.avatarUrl).toBe('https://example.com/avatar.png');
  });

  // ─── 8. LOGOUT ─────────────────────────────────────────────────────────────

  it('logs out current session and clears cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);

    const clearedCookies = res.headers['set-cookie'];
    const cleared = clearedCookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
    expect(cleared).toContain('Expires=Thu, 01 Jan 1970');

    // Token cannot be reused
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);
    expect(meRes.status).toBe(401);
  });
});

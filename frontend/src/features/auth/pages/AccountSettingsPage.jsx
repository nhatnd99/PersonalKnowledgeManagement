import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import * as authApi from '../api/authApi.js';
import {
  User,
  Shield,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  LogOut,
  Lock,
  Key,
} from 'lucide-react';

export function AccountSettingsPage() {
  const { user, updateProfile, changePassword, logoutAll } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'sessions'

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  // Password Policy Checks
  const hasMinLength = newPassword.length >= 12;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumberOrSymbol;
  const doPasswordsMatch = newPassword && newPassword === confirmPassword;

  // Load Sessions
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      const data = await authApi.getSessions();
      setSessions(data || []);
    } catch (err) {
      setSessionsError(err.message || 'Failed to load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });
      setProfileSuccess('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (!isPasswordValid) {
      setPasswordError('New password must be at least 12 characters and contain uppercase, lowercase, and a number or symbol.');
      setPasswordLoading(false);
      return;
    }

    if (!doPasswordsMatch) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully. Other active sessions were revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Revoke Individual Session
  const handleRevokeSession = async (sessionId) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setSessionsError(err.message || 'Failed to revoke session.');
    }
  };

  // Log Out All Devices
  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to log out of all devices? You will need to sign in again.')) {
      await logoutAll();
      window.location.href = '/login';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile, security credentials, and active device sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'security'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === 'sessions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Laptop className="h-4 w-4" />
          Active Sessions
        </button>
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{user?.displayName}</h3>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Email Address (Account Owner)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-md border border-input bg-muted/50 py-2 px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Email is unique to your knowledge workspace and cannot be modified directly.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Knowledge Architect"
                disabled={profileLoading}
                className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                disabled={profileLoading}
                className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center justify-center rounded-md bg-primary py-2 px-4 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Change Password
            </h3>
            <p className="text-xs text-muted-foreground">
              Update your account password. Changing your password automatically invalidates all other active sessions.
            </p>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-green-500/10 text-green-600 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={passwordLoading}
                className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 12 characters"
                disabled={passwordLoading}
                className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                disabled={passwordLoading}
                className="w-full rounded-md border border-input bg-background py-2 px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Strength guidance */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Password Policy:</p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasMinLength ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>12+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasUpper ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Uppercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasLower ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Lowercase letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-primary font-medium' : ''}`}>
                  <CheckCircle2 className={`h-3.5 w-3.5 ${hasNumberOrSymbol ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  <span>Number / symbol</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !isPasswordValid || !doPasswordsMatch}
              className="flex items-center justify-center rounded-md bg-primary py-2 px-4 text-xs font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                Active Device Sessions
              </h3>
              <p className="text-xs text-muted-foreground">
                Every browser or device authenticated to your workspace has an independent session token.
              </p>
            </div>
            <button
              onClick={handleLogoutAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out All Devices
            </button>
          </div>

          {sessionsError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sessionsError}</span>
            </div>
          )}

          {sessionsLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active sessions found.</p>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground shrink-0 mt-0.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {sess.deviceName || 'Web Session'}
                        </span>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                        IP: {sess.ipAddress || 'Unknown'} • Last Active: {new Date(sess.lastActivityAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      title="Revoke session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

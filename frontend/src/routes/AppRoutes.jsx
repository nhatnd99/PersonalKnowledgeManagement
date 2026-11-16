import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout.jsx';
import { NoteEditorView } from '../features/notes/components/NoteEditorView.jsx';
import { SearchView } from '../features/search/components/SearchView.jsx';
import { TagsView } from '../features/tags/components/TagsView.jsx';
import { KnowledgeGraphView } from '../features/knowledge-graph/components/KnowledgeGraphView.jsx';

// Auth Features
import { ProtectedRoute } from '../features/auth/routes/ProtectedRoute.jsx';
import { GuestRoute } from '../features/auth/routes/GuestRoute.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { RegisterPage } from '../features/auth/pages/RegisterPage.jsx';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage.jsx';
import { AccountSettingsPage } from '../features/auth/pages/AccountSettingsPage.jsx';

/**
 * Central route definitions for Knowledge App.
 * Configured with GuestRoutes (public auth) and ProtectedRoutes (user-scoped application workspace).
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public Guest Routes (Unauthenticated only) ─────────────────────────── */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />

      {/* ─── Protected Application Routes (Authenticated only) ────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NoteEditorView />} />
        <Route path="/notes/:noteId" element={<NoteEditorView />} />
        <Route path="/graph" element={<KnowledgeGraphView />} />
        <Route path="/graph/root" element={<KnowledgeGraphView />} />
        <Route path="/graph/folders/:folderId" element={<KnowledgeGraphView />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/tags" element={<TagsView />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
      </Route>
    </Routes>
  );
}

/**
 * 404 Placeholder Page component.
 */
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          The requested page could not be found.
        </p>
      </div>
    </div>
  );
}

export default AppRoutes;

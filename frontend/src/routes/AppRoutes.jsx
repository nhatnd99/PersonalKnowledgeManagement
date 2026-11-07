import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

/**
 * Central route definitions for Knowledge App.
 *
 * Route structure:
 * /                    → Redirect to /notes
 * /notes               → Notes list / home view
 * /notes/:noteId       → Individual note view and editor
 * /graph               → Knowledge graph visualization
 * /search              → Search results
 * /tags                → Tag management
 *
 * Note: Route components are placeholders until features are implemented.
 * Replace placeholder components with real feature components in Phase 1+.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/notes" replace />} />
      <Route path="/notes" element={<PlaceholderPage title="Notes" />} />
      <Route path="/notes/:noteId" element={<PlaceholderPage title="Note Editor" />} />
      <Route path="/graph" element={<PlaceholderPage title="Knowledge Graph" />} />
      <Route path="/search" element={<PlaceholderPage title="Search" />} />
      <Route path="/tags" element={<PlaceholderPage title="Tags" />} />
      <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
    </Routes>
  );
}

/**
 * Temporary placeholder component used during project initialization.
 * Replace with actual feature components as features are implemented.
 */
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          This page will be implemented in an upcoming phase.
        </p>
        <p className="text-sm text-muted-foreground">
          Knowledge App — Foundation Phase
        </p>
      </div>
    </div>
  );
}

export default AppRoutes;

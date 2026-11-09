import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout.jsx';
import { NoteEditorView } from '../features/notes/components/NoteEditorView.jsx';
import { SearchView } from '../features/search/components/SearchView.jsx';
import { TagsView } from '../features/tags/components/TagsView.jsx';
import { KnowledgeGraphView } from '../features/knowledge-graph/components/KnowledgeGraphView.jsx';

/**
 * Central route definitions for Knowledge App.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NoteEditorView />} />
        <Route path="/notes/:noteId" element={<NoteEditorView />} />
        <Route path="/graph" element={<KnowledgeGraphView />} />
        <Route path="/graph/root" element={<KnowledgeGraphView />} />
        <Route path="/graph/folders/:folderId" element={<KnowledgeGraphView />} />
        <Route path="/search" element={<SearchView />} />
        <Route path="/tags" element={<TagsView />} />
        <Route path="*" element={<PlaceholderPage title="404 - Not Found" />} />
      </Route>
    </Routes>
  );
}

/**
 * Temporary placeholder component for pending feature queues.
 */
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">
          This feature queue will be connected in upcoming phases.
        </p>
      </div>
    </div>
  );
}

export default AppRoutes;

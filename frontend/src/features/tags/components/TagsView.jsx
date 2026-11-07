import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tagService } from '../services/tagService.js';
import { Tag, Plus, Edit2, Trash2, Search, AlertCircle, FileText, X } from 'lucide-react';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

/**
 * TagsView: Comprehensive tag management and taxonomy dashboard.
 */
export function TagsView() {
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  // Form states
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);
  const [tagDescription, setTagDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadTags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tagService.getTags();
      setTags(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const openCreateModal = () => {
    setTagName('');
    setTagColor(PRESET_COLORS[0]);
    setTagDescription('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color || PRESET_COLORS[0]);
    setTagDescription(tag.description || '');
    setFormError(null);
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setFormError('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await tagService.createTag({
        name: tagName.trim(),
        color: tagColor,
        description: tagDescription.trim() || undefined,
      });
      setTags((prev) => [...prev, { ...created, notesCount: 0 }]);
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setFormError('Tag name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const updated = await tagService.updateTag(editingTag.id, {
        name: tagName.trim(),
        color: tagColor,
        description: tagDescription.trim() || undefined,
      });
      setTags((prev) =>
        prev.map((t) => (t.id === editingTag.id ? { ...t, ...updated } : t))
      );
      setEditingTag(null);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? It will be removed from all associated notes.')) {
      return;
    }

    try {
      await tagService.deleteTag(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tag');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            <span>Tags & Taxonomy</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage reusable labels for organizing and categorizing knowledge notes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Tag</span>
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading tags...</div>
      ) : tags.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No tags yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Create tags to categorize notes across different topics and knowledge domains.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create your first tag</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color || '#3b82f6' }}
                    />
                    <h3 className="font-semibold text-foreground text-sm">#{tag.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(tag)}
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Edit tag"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {tag.description ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {tag.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/40 italic mb-3">
                    No description
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{tag.notesCount || 0} notes</span>
                </span>

                <Link
                  to={`/search?tag=${encodeURIComponent(tag.name)}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <Search className="h-3 w-3" />
                  <span>Explore</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create or Edit Tag */}
      {(isCreateOpen || editingTag) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <span>{editingTag ? 'Edit Tag' : 'Create New Tag'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTag(null);
                }}
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded bg-destructive/10 text-destructive text-xs border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="space-y-4">
              <div>
                <label htmlFor="tag-name-input" className="block text-xs font-medium text-foreground mb-1">
                  Tag Name
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-muted-foreground text-xs">#</span>
                  <input
                    id="tag-name-input"
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="e.g. spring-boot"
                    maxLength={100}
                    className="w-full rounded-md border border-input bg-background pl-6 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tag Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTagColor(c)}
                      className={`h-6 w-6 rounded-full border transition-transform ${
                        tagColor === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="tag-desc-input" className="block text-xs font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="tag-desc-input"
                  value={tagDescription}
                  onChange={(e) => setTagDescription(e.target.value)}
                  placeholder="What knowledge does this tag encompass?"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTag(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !tagName.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingTag ? 'Save Changes' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

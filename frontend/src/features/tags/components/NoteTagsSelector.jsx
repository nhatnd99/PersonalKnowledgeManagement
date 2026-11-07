import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { tagService } from '../services/tagService.js';
import { Tag as TagIcon, Plus, X, Check } from 'lucide-react';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

/**
 * Interactive Tag Selector and Chip Bar for a specific Note.
 */
export function NoteTagsSelector({ noteId, initialTags = [], onTagsUpdated }) {
  const [assignedTags, setAssignedTags] = useState(initialTags);
  const [allTags, setAllTags] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setAssignedTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    if (isOpen) {
      tagService.getTags().then(setAllTags).catch(() => {});
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const assignedTagIds = new Set(
    assignedTags.map((t) => t.tag?.id || t.id)
  );

  const handleAssignExistingTag = async (tag) => {
    try {
      await tagService.assignTag(noteId, tag.id);
      const updated = [...assignedTags, { tag }];
      setAssignedTags(updated);
      if (onTagsUpdated) onTagsUpdated(updated);
    } catch {
      // Ignored if already attached
    }
  };

  const handleCreateAndAssignTag = async (e) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      // Try to find if tag already exists in allTags
      let targetTag = allTags.find(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      );

      if (!targetTag) {
        targetTag = await tagService.createTag({
          name: trimmed,
          color: selectedColor,
        });
      }

      await tagService.assignTag(noteId, targetTag.id);
      const updated = [...assignedTags, { tag: targetTag }];
      setAssignedTags(updated);
      if (onTagsUpdated) onTagsUpdated(updated);
      setNewTagName('');
      setIsOpen(false);
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTag = async (tagId, e) => {
    e.stopPropagation();
    try {
      await tagService.removeTag(noteId, tagId);
      const updated = assignedTags.filter(
        (t) => (t.tag?.id || t.id) !== tagId
      );
      setAssignedTags(updated);
      if (onTagsUpdated) onTagsUpdated(updated);
    } catch {
      // handled
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <TagIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />

      {assignedTags.map((item) => {
        const tag = item.tag || item;
        const color = tag.color || '#3b82f6';
        return (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-muted/50 border-border text-foreground transition-colors group"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>#{tag.name}</span>
            <button
              type="button"
              onClick={(e) => handleRemoveTag(tag.id, e)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      {/* Add Tag Dropdown Anchor */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add Tag</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 top-7 z-50 w-64 rounded-md border border-border bg-popover p-2 shadow-lg text-xs space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Select or Create Tag
            </div>

            {/* List of existing tags */}
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {allTags.filter((t) => !assignedTagIds.has(t.id)).length === 0 ? (
                <div className="px-2 py-1 text-muted-foreground italic">
                  No other tags available
                </div>
              ) : (
                allTags
                  .filter((t) => !assignedTagIds.has(t.id))
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleAssignExistingTag(tag)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-muted text-foreground text-left transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || '#3b82f6' }}
                        />
                        <span>#{tag.name}</span>
                      </div>
                      <Check className="h-3 w-3 opacity-0 hover:opacity-100 text-primary" />
                    </button>
                  ))
              )}
            </div>

            {/* Quick create inline form */}
            <form onSubmit={handleCreateAndAssignTag} className="pt-2 border-t border-border space-y-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name..."
                maxLength={50}
                className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-4 w-4 rounded-full border ${
                        selectedColor === c ? 'ring-2 ring-primary ring-offset-1' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newTagName.trim()}
                  className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

NoteTagsSelector.propTypes = {
  noteId: PropTypes.string.isRequired,
  initialTags: PropTypes.array,
  onTagsUpdated: PropTypes.func,
};

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService } from '../services/searchService.js';
import { tagService } from '../../tags/services/tagService.js';
import {
  Search,
  FileText,
  Folder,
  Star,
  Tag,
  Share2,
  Clock,
  X,
  Filter,
} from 'lucide-react';

/**
 * SearchView: Full-text search and faceted knowledge discovery page.
 */
export function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const tagParam = searchParams.get('tag') || '';
  const typeParam = searchParams.get('type') || '';
  const favoriteParam = searchParams.get('isFavorite') === 'true';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedTag, setSelectedTag] = useState(tagParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [isFavoriteOnly, setIsFavoriteOnly] = useState(favoriteParam);

  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(queryParam);
    setSelectedTag(tagParam);
    setSelectedType(typeParam);
    setIsFavoriteOnly(favoriteParam);
  }, [queryParam, tagParam, typeParam, favoriteParam]);

  // Load available tags for filter chips
  useEffect(() => {
    tagService.getTags().then(setAvailableTags).catch(() => {});
  }, []);

  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.q = searchTerm.trim();
      if (selectedTag) params.tag = selectedTag;
      if (selectedType) params.type = selectedType;
      if (isFavoriteOnly) params.isFavorite = true;

      const data = await searchService.searchNotes(params);
      setResults(data.notes || []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedTag, selectedType, isFavoriteOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch();
    }, 250);

    return () => clearTimeout(timer);
  }, [executeSearch]);

  const updateFilters = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) {
        updated.set(k, v);
      } else {
        updated.delete(k);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    updateFilters({ q: val });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    updateFilters({ q: '' });
  };

  const handleTagToggle = (tagName) => {
    const next = selectedTag === tagName ? '' : tagName;
    setSelectedTag(next);
    updateFilters({ tag: next });
  };

  const handleTypeSelect = (type) => {
    const next = selectedType === type ? '' : type;
    setSelectedType(next);
    updateFilters({ type: next });
  };

  const handleFavoriteToggle = () => {
    const next = !isFavoriteOnly;
    setIsFavoriteOnly(next);
    updateFilters({ isFavorite: next ? 'true' : '' });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="pb-4 mb-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <span>Knowledge Discovery</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Search note titles, content, tags, and cross-references.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search knowledge by keyword, title, or topic..."
          className="w-full rounded-lg border border-input bg-card pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-3 p-0.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground font-medium mr-1">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        {/* Type Filter */}
        <button
          type="button"
          onClick={() => handleTypeSelect('')}
          className={`px-2.5 py-1 rounded-full border transition-colors ${
            !selectedType
              ? 'bg-primary text-primary-foreground border-primary font-medium'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          All Types
        </button>
        <button
          type="button"
          onClick={() => handleTypeSelect('NOTE')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
            selectedType === 'NOTE'
              ? 'bg-primary text-primary-foreground border-primary font-medium'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          <FileText className="h-3 w-3" />
          <span>Notes Only</span>
        </button>
        <button
          type="button"
          onClick={() => handleTypeSelect('FOLDER')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
            selectedType === 'FOLDER'
              ? 'bg-primary text-primary-foreground border-primary font-medium'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          <Folder className="h-3 w-3" />
          <span>Folders Only</span>
        </button>

        {/* Favorite Filter */}
        <button
          type="button"
          onClick={handleFavoriteToggle}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
            isFavoriteOnly
              ? 'bg-amber-500 text-amber-950 border-amber-500 font-medium'
              : 'bg-card text-muted-foreground border-border hover:bg-muted'
          }`}
        >
          <Star className={`h-3 w-3 ${isFavoriteOnly ? 'fill-amber-950' : ''}`} />
          <span>Starred</span>
        </button>
      </div>

      {/* Available Tag Pills */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-4 border-b border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Tags:
          </span>
          {availableTags.map((tag) => {
            const isSelected = selectedTag === tag.name;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.name)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : tag.color || '#3b82f6' }}
                />
                <span>#{tag.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
        <span>
          {isLoading
            ? 'Searching...'
            : `${meta?.total ?? results.length} result${results.length === 1 ? '' : 's'} found`}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error}
        </div>
      )}

      {/* Results List */}
      {!isLoading && results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-sm">No notes found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            No notes matched your query or selected filters. Try broadening your keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((note) => {
            const relCount =
              (note._count?.outgoingRelationships || 0) +
              (note._count?.incomingRelationships || 0);

            return (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      {note.type === 'FOLDER' ? (
                        <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {note.title || 'Untitled Note'}
                      </h3>
                      {note.isFavorite && (
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      )}
                    </div>

                    {/* Hierarchy Breadcrumb Context */}
                    {note.parent && (
                      <p className="text-[11px] text-muted-foreground">
                        in <span className="font-medium text-foreground">{note.parent.title}</span>
                      </p>
                    )}

                    {/* Tags List */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {note.tags.map((nt) => {
                          const t = nt.tag || nt;
                          return (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              <span>#{t.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 text-[11px] text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {relCount > 0 && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                        <Share2 className="h-2.5 w-2.5 text-primary" />
                        <span>{relCount} links</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

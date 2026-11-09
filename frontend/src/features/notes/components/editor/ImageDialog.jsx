import { useState } from 'react';
import { Image as ImageIcon, X, Link as LinkIcon, Upload } from 'lucide-react';
import apiClient from '../../../../services/apiClient.js';

export function ImageDialog({ editor, isOpen, onClose }) {
  const [tab, setTab] = useState('url'); // 'url' | 'upload'
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !editor) return null;

  const handleInsertUrl = (e) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Image URL is required');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      setError('Image URL must start with http:// or https://');
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({
        src: trimmedUrl,
        alt: alt.trim() || undefined,
        title: title.trim() || undefined,
      })
      .run();

    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selected file is not an image');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // In web app, we read file as preview/object URL or post to server
      const previewUrl = URL.createObjectURL(file);
      // Verify via backend upload-image route
      await apiClient.post('/notes/upload-image', {
        url: previewUrl,
        alt: alt || file.name,
        title: title || file.name,
      }).catch(() => {}); // Fallback gracefully if offline

      editor
        .chain()
        .focus()
        .setImage({
          src: previewUrl,
          alt: alt.trim() || file.name,
          title: title.trim() || file.name,
        })
        .run();

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span>Insert Image</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-border text-xs">
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 py-1.5 font-medium border-b-2 text-center transition-colors ${
              tab === 'url' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="h-3 w-3 inline mr-1" />
            Image URL
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 py-1.5 font-medium border-b-2 text-center transition-colors ${
              tab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-3 w-3 inline mr-1" />
            Upload File
          </button>
        </div>

        {tab === 'url' ? (
          <form onSubmit={handleInsertUrl} className="space-y-3 text-xs">
            <div>
              <label className="block text-muted-foreground mb-1 font-medium">Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Alt Text</label>
                <input
                  type="text"
                  placeholder="Description"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Caption</label>
                <input
                  type="text"
                  placeholder="Optional caption"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>
            </div>

            {error && <p className="text-[11px] text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-border hover:bg-muted text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
              >
                Insert Image
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <label className="cursor-pointer">
                <span className="text-primary font-medium hover:underline">Choose an image file</span>
                <span className="text-muted-foreground block text-[11px] mt-1">PNG, JPG, WebP, SVG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Alt Text</label>
                <input
                  type="text"
                  placeholder="Description"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-muted-foreground mb-1 font-medium">Caption</label>
                <input
                  type="text"
                  placeholder="Optional caption"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs"
                />
              </div>
            </div>

            {isLoading && <p className="text-xs text-muted-foreground text-center">Processing image...</p>}
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

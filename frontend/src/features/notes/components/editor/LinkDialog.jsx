import { useState, useEffect } from 'react';
import { Link as LinkIcon, ExternalLink, Unlink, X } from 'lucide-react';

export function LinkDialog({ editor, isOpen, onClose }) {
  const [url, setUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && editor) {
      const previousUrl = editor.getAttributes('link').href || '';
      const previousTarget = editor.getAttributes('link').target;
      setUrl(previousUrl);
      setOpenInNewTab(previousTarget === '_blank' || !previousUrl);
      setError('');
    }
  }, [isOpen, editor]);

  if (!isOpen || !editor) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      // Unlink
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      onClose();
      return;
    }

    // Basic URL validation
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: finalUrl,
        target: openInNewTab ? '_blank' : null,
      })
      .run();

    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <LinkIcon className="h-4 w-4 text-primary" />
            <span>Hyperlink</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1 font-medium">Link URL</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              autoFocus
              className="w-full h-8 rounded border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
            />
            <span className="text-muted-foreground flex items-center gap-1">
              Open in new tab <ExternalLink className="h-3 w-3" />
            </span>
          </label>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            {editor.isActive('link') ? (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 text-destructive hover:underline text-xs"
              >
                <Unlink className="h-3 w-3" />
                Remove Link
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
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
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

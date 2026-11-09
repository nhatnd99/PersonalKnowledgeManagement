import { useState, useRef, useEffect } from 'react';
import { Highlighter, X } from 'lucide-react';
import { HIGHLIGHT_COLORS } from './ColorConstants.js';

export function HighlightColorPicker({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customHex, setCustomHex] = useState('');
  const popoverRef = useRef(null);

  const isHighlighted = editor?.isActive('highlight');
  const highlightAttrs = editor?.getAttributes('highlight') || {};
  const currentColor = highlightAttrs.color || null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!editor) return null;

  const handleSelectColor = (color) => {
    if (!color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setIsOpen(false);
  };

  const handleApplyCustomHex = (e) => {
    e.preventDefault();
    if (customHex.trim()) {
      let hex = customHex.trim();
      if (!hex.startsWith('#')) hex = `#${hex}`;
      handleSelectColor(hex);
      setCustomHex('');
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Highlight Color"
        className={`flex h-7 items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-muted ${
          isHighlighted ? 'bg-muted' : ''
        }`}
      >
        <Highlighter className="h-3.5 w-3.5" style={{ color: currentColor || 'currentColor' }} />
        <div
          className="h-1 w-3 rounded-sm border border-border"
          style={{ backgroundColor: currentColor || 'transparent' }}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-md border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Highlight Color
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleSelectColor(c.value)}
                title={c.name}
                className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform relative flex items-center justify-center"
                style={{
                  backgroundColor: c.value || 'transparent',
                }}
              >
                {!c.value && <X className="h-3 w-3 text-muted-foreground" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleApplyCustomHex} className="mt-3 flex items-center gap-1.5 pt-2 border-t border-border">
            <input
              type="text"
              placeholder="#HEX"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="h-6 flex-1 rounded border border-border bg-background px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              className="h-6 rounded bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Apply
            </button>
          </form>

          {isHighlighted && (
            <button
              type="button"
              onClick={() => handleSelectColor(null)}
              className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1 border-t border-border"
            >
              Remove Highlight
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, Heading1, Heading2, Heading3, Pilcrow } from 'lucide-react';

const STYLES = [
  {
    label: 'Paragraph',
    value: 'p',
    icon: Pilcrow,
    shortcut: 'Ctrl+Alt+0',
    isActive: (editor) => editor.isActive('paragraph') && !editor.isActive('heading'),
  },
  {
    label: 'Heading 1',
    value: '1',
    icon: Heading1,
    shortcut: 'Ctrl+Alt+1',
    level: 1,
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    label: 'Heading 2',
    value: '2',
    icon: Heading2,
    shortcut: 'Ctrl+Alt+2',
    level: 2,
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    label: 'Heading 3',
    value: '3',
    icon: Heading3,
    shortcut: 'Ctrl+Alt+3',
    level: 3,
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
  },
];

/**
 * Custom accessible dropdown for choosing Paragraph / Heading 1 / 2 / 3.
 * Uses onMouseDown preventDefault to preserve editor focus and selection.
 */
export function HeadingSelector({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  if (!editor) return null;

  const currentStyle =
    STYLES.find((s) => s.isActive(editor)) || STYLES[0];
  const CurrentIcon = currentStyle.icon;

  const handleSelect = (item) => {
    if (item.value === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: item.level }).run();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Change text block format"
        className="flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted focus:outline-none transition-colors"
      >
        <CurrentIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate max-w-[80px]">{currentStyle.label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground/70" />
      </button>

      {isOpen && (
        <div
          onMouseDown={(e) => {
            // Prevent blur of editor
            e.preventDefault();
          }}
          className="absolute left-0 top-8 z-50 min-w-[170px] rounded-lg border border-border bg-card p-1 shadow-lg text-xs animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Turn into
          </div>
          {STYLES.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(editor);

            return (
              <button
                key={item.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={() => handleSelect(item)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 font-mono">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

HeadingSelector.propTypes = {
  editor: PropTypes.object,
};

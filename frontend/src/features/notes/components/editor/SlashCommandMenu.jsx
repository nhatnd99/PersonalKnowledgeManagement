import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * SlashCommandMenu: Notion/Confluence style popup menu triggered by `/`.
 * Supports full keyboard navigation (Up/Down/Enter/Escape) and click selection.
 */
export function SlashCommandMenu({
  isOpen,
  props,
  clientRect,
  onClose,
  onOpenImageDialog,
  onOpenNoteLinkDialog,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  const items = useMemo(() => props?.items || [], [props?.items]);

  // Reset selectedIndex when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = useCallback(
    (index) => {
      const item = items[index];
      if (item && props) {
        item.command({
          editor: props.editor,
          range: props.range,
          onOpenImageDialog,
          onOpenNoteLinkDialog,
        });
        onClose();
      }
    },
    [items, props, onClose, onOpenImageDialog, onOpenNoteLinkDialog]
  );

  // Keyboard navigation handler registered on window for suggestion
  useEffect(() => {
    if (!isOpen) {
      window.__slashMenuKeyDown = null;
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        return true;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return true;
      }

      return false;
    };

    window.__slashMenuKeyDown = handleKeyDown;

    return () => {
      window.__slashMenuKeyDown = null;
    };
  }, [isOpen, items, selectedIndex, selectItem, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector('[data-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || items.length === 0 || !clientRect) {
    return null;
  }

  const rect = typeof clientRect === 'function' ? clientRect() : clientRect;
  if (!rect) return null;

  // Position popup below cursor position
  const top = rect.bottom + 8;
  const left = Math.min(Math.max(rect.left, 16), window.innerWidth - 300);

  return (
    <div
      ref={containerRef}
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur-md text-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 mb-1">
        Basic Blocks
      </div>

      <div className="space-y-0.5">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              data-selected={isSelected}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md border shrink-0 ${
                  isSelected
                    ? 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground'
                    : 'border-border bg-muted/60 text-muted-foreground'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium text-xs leading-none">{item.title}</div>
                <div
                  className={`text-[10px] truncate mt-1 ${
                    isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

SlashCommandMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  props: PropTypes.object,
  clientRect: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  onClose: PropTypes.func.isRequired,
  onOpenImageDialog: PropTypes.func,
  onOpenNoteLinkDialog: PropTypes.func,
};

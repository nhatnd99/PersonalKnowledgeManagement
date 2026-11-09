import { useState, useRef, useEffect } from 'react';
import { Table as TableIcon, Plus, Trash2, ChevronDown } from 'lucide-react';

export function TableMenu({ editor }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const menuRef = useRef(null);

  const isInsideTable = editor?.isActive('table');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  const handleInsertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: Math.max(1, rows), cols: Math.max(1, cols), withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Table Operations"
        className={`flex h-7 items-center gap-1 rounded px-2 text-xs font-medium border border-border ${
          isInsideTable ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        }`}
      >
        <TableIcon className="h-3.5 w-3.5" />
        <span>Table</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-card p-2.5 shadow-lg text-xs space-y-2">
          {!isInsideTable ? (
            <div>
              <div className="font-semibold text-foreground mb-2">Insert Table</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-7 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-7 rounded border border-border bg-background px-2 text-xs"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleInsertTable}
                className="w-full h-7 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Insert {rows}x{cols} Table
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-foreground pb-1 border-b border-border mb-1">Table Controls</div>

              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addRowBefore().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-muted-foreground hover:text-foreground text-[11px]"
                >
                  + Row Above
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addRowAfter().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-muted-foreground hover:text-foreground text-[11px]"
                >
                  + Row Below
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addColumnBefore().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-muted-foreground hover:text-foreground text-[11px]"
                >
                  + Col Left
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().addColumnAfter().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-muted-foreground hover:text-foreground text-[11px]"
                >
                  + Col Right
                </button>
              </div>

              <div className="pt-1 border-t border-border grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteRow().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left text-destructive hover:bg-destructive/10 text-[11px]"
                >
                  Delete Row
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteColumn().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left text-destructive hover:bg-destructive/10 text-[11px]"
                >
                  Delete Col
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().mergeCells().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-[11px]"
                >
                  Merge Cells
                </button>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().splitCell().run();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded text-left hover:bg-muted text-[11px]"
                >
                  Split Cell
                </button>
              </div>

              <div className="pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setIsOpen(false);
                  }}
                  className="w-full p-1 rounded text-left text-destructive hover:bg-destructive/10 flex items-center gap-1 font-medium text-[11px]"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Entire Table
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

export function AlignmentMenu({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 border border-border rounded p-0.5 bg-background">
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
        className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        }`}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
        className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        }`}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
        className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        }`}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justify"
        className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
          editor.isActive({ textAlign: 'justify' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
        }`}
      >
        <AlignJustify className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

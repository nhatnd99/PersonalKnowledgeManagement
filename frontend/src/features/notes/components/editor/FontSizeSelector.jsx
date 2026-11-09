import { FONT_SIZES } from './ColorConstants.js';

export function FontSizeSelector({ editor }) {
  if (!editor) return null;

  // Extract current font size from textStyle mark if active
  const textStyleAttrs = editor.getAttributes('textStyle') || {};
  const currentSize = textStyleAttrs.fontSize || '16px';

  const handleChange = (e) => {
    const size = e.target.value;
    if (size === 'default') {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(size).run();
    }
  };

  return (
    <select
      value={currentSize}
      onChange={handleChange}
      title="Font Size"
      className="h-7 text-xs rounded border border-border bg-background px-1.5 py-0.5 text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring w-[64px]"
    >
      <option value="default">Size</option>
      {FONT_SIZES.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  );
}

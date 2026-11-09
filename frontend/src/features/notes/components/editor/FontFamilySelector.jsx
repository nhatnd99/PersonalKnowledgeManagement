import { FONT_FAMILIES } from './ColorConstants.js';

export function FontFamilySelector({ editor }) {
  if (!editor) return null;

  // Determine active font family
  const currentFont = FONT_FAMILIES.find((f) =>
    f.value !== 'inherit' && editor.isActive('textStyle', { fontFamily: f.value })
  );

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === 'inherit') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(val).run();
    }
  };

  return (
    <select
      value={currentFont ? currentFont.value : 'inherit'}
      onChange={handleChange}
      title="Font Family"
      className="h-7 text-xs rounded border border-border bg-background px-1.5 py-0.5 text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring max-w-[110px]"
    >
      {FONT_FAMILIES.map((font) => (
        <option key={font.label} value={font.value}>
          {font.label}
        </option>
      ))}
    </select>
  );
}

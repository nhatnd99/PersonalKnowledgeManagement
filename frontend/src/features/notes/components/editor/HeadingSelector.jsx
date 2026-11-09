const PARAGRAPH_STYLES = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: '1' },
  { label: 'Heading 2', value: '2' },
  { label: 'Heading 3', value: '3' },
  { label: 'Heading 4', value: '4' },
  { label: 'Heading 5', value: '5' },
  { label: 'Heading 6', value: '6' },
];

export function HeadingSelector({ editor }) {
  if (!editor) return null;

  let currentStyle = 'p';
  for (let level = 1; level <= 6; level++) {
    if (editor.isActive('heading', { level })) {
      currentStyle = String(level);
      break;
    }
  }

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level: parseInt(val, 10) }).run();
    }
  };

  return (
    <select
      value={currentStyle}
      onChange={handleChange}
      title="Paragraph Format"
      className="h-7 text-xs rounded border border-border bg-background px-1.5 py-0.5 font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring w-[105px]"
    >
      {PARAGRAPH_STYLES.map((style) => (
        <option key={style.value} value={style.value}>
          {style.label}
        </option>
      ))}
    </select>
  );
}

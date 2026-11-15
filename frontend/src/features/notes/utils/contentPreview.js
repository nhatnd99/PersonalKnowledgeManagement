/**
 * Extracts a plain text excerpt from a ProseMirror / TipTap JSON document.
 *
 * @param {Object|string} content - ProseMirror JSON or string
 * @param {number} [maxLength=120] - Maximum length of excerpt
 * @returns {string} Truncated plain text excerpt
 */
export function extractTextPreview(content, maxLength = 120) {
  if (!content) return '';

  let text = '';

  if (typeof content === 'string') {
    text = content.replace(/<[^>]*>/g, '').trim();
  } else if (typeof content === 'object') {
    const collectText = (node) => {
      if (!node) return;
      if (node.text) {
        text += (text ? ' ' : '') + node.text;
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          collectText(child);
          if (text.length >= maxLength * 2) break;
        }
      }
    };

    collectText(content);
  }

  text = text.replace(/\s+/g, ' ').trim();
  if (text.length > maxLength) {
    return `${text.slice(0, maxLength)}...`;
  }
  return text;
}

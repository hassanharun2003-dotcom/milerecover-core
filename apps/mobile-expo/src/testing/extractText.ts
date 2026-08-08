/** Walk a react-test-renderer JSON tree and collect text node values. */
export type RendererNode =
  | { children?: Array<string | RendererNode> | null }
  | string
  | RendererNode[]
  | null;

export function extractText(node: RendererNode): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((child) => extractText(child));
  if (typeof node === 'string') return [node];
  const children = node.children ?? [];
  return children.flatMap((child) => {
    if (typeof child === 'string') return [child];
    return extractText(child);
  });
}

export function extractVisibleCopy(node: RendererNode): string {
  return extractText(node).join(' ').replace(/\s+/g, ' ').trim();
}

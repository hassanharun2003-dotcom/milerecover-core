import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Chip, ChipRow } from '../src/design-system';

function collectText(node: renderer.ReactTestRendererJSON | string | null | renderer.ReactTestRendererJSON[]): string[] {
  if (node == null || typeof node === 'string') return typeof node === 'string' ? [node] : [];
  if (Array.isArray(node)) return node.flatMap((child) => collectText(child));
  return (node.children ?? []).flatMap((child) =>
    typeof child === 'string' ? [child] : collectText(child as renderer.ReactTestRendererJSON),
  );
}

describe('Purpose chip layout', () => {
  it('keeps full purpose words on a single line', () => {
    const labels = ['Client visit', 'Meeting', 'Errand', 'Work site', 'Other'];
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ChipRow>
          {labels.map((label) => (
            <Chip key={label} label={label} selected={label === 'Meeting'} onPress={() => undefined} />
          ))}
        </ChipRow>,
      );
    });
    const texts = collectText(tree!.toJSON());
    for (const label of labels) {
      expect(texts).toContain(label);
      expect(texts.join('|')).not.toMatch(/Cli\|ent|Meet\|ing|Erra\|nd|Othe\|r/);
    }
    const chips = tree!.root.findAll(
      (node) => node.props?.accessibilityRole === 'button' && node.props?.accessibilityLabel === 'Meeting',
    );
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].props.accessibilityState?.selected).toBe(true);
  });
});

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ListRow } from '../src/design-system';

function collectText(node: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[] | string | null): string[] {
  if (node == null || typeof node === 'string') {
    return typeof node === 'string' ? [node] : [];
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectText(child));
  }
  const children = node.children ?? [];
  return children.flatMap((child) =>
    typeof child === 'string' ? [child] : collectText(child as renderer.ReactTestRendererJSON),
  );
}

describe('ListRow long-value layout', () => {
  it('keeps label, long value, and chevron as separate readable parts', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ListRow
          label="What gets in the way"
          value="I have older mileage to recover"
          onPress={() => undefined}
        />,
      );
    });
    const texts = collectText(tree!.toJSON());
    expect(texts).toEqual(
      expect.arrayContaining(['What gets in the way', 'I have older mileage to recover', '›']),
    );
    const pressable = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(pressable.props.accessibilityLabel).toContain('What gets in the way');
    expect(pressable.props.accessibilityLabel).toContain('I have older mileage to recover');
  });

  it('shows preparing state and disables the row while busy', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ListRow label="Share CSV" value="Preparing CSV…" onPress={() => undefined} busy />,
      );
    });
    const pressable = tree!.root.findByProps({ accessibilityRole: 'button' });
    expect(pressable.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    expect(collectText(tree!.toJSON())).toContain('Preparing CSV…');
  });
});

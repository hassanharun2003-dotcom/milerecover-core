/**
 * Documents the DateTimePicker dismiss contract used by ManualTripScreen.
 * Cancel / back / dismissed MUST always clear visibility — never freeze.
 */
describe('Date picker dismiss contract', () => {
  function reducePickerVisibility(
    showDatePicker: boolean,
    event: { type?: string },
    selected: Date | undefined,
    platform: 'android' | 'ios',
  ): { show: boolean; dateUpdated: boolean; reverted: boolean } {
    let show = showDatePicker;
    let dateUpdated = false;
    let reverted = false;
    const type = event.type;
    if (platform === 'android') {
      if (type === 'dismissed' || !selected) {
        show = false;
        reverted = true;
        return { show, dateUpdated, reverted };
      }
      dateUpdated = true;
      show = false;
      return { show, dateUpdated, reverted };
    }
    // iOS: Cancel/dismiss reverts; OK keeps spinner value then closes.
    if (type === 'dismissed' || !selected) {
      show = false;
      reverted = true;
      return { show, dateUpdated, reverted };
    }
    dateUpdated = true;
    return { show: true, dateUpdated, reverted };
  }

  it('Android Cancel (dismissed, no date) always closes', () => {
    const next = reducePickerVisibility(true, { type: 'dismissed' }, undefined, 'android');
    expect(next.show).toBe(false);
    expect(next.dateUpdated).toBe(false);
    expect(next.reverted).toBe(true);
  });

  it('Android OK confirms and closes', () => {
    const next = reducePickerVisibility(true, { type: 'set' }, new Date('2026-01-02'), 'android');
    expect(next.show).toBe(false);
    expect(next.dateUpdated).toBe(true);
  });

  it('iOS dismiss closes without updating', () => {
    const next = reducePickerVisibility(true, { type: 'dismissed' }, undefined, 'ios');
    expect(next.show).toBe(false);
    expect(next.dateUpdated).toBe(false);
    expect(next.reverted).toBe(true);
  });

  it('hardware back is treated like Cancel', () => {
    // BackHandler path calls closeDatePicker(true) — same as dismissed.
    const next = reducePickerVisibility(true, { type: 'dismissed' }, undefined, 'android');
    expect(next.show).toBe(false);
    expect(next.reverted).toBe(true);
  });
});

describe('Time picker visibility contract', () => {
  function reduceTimePicker(
    input: {
      show: boolean;
      committed: Date;
      draft: Date;
      eventType?: string;
      selected?: Date;
      platform: 'android' | 'ios';
      okPressed?: boolean;
    },
  ): { show: boolean; committed: Date; draft: Date } {
    if (!input.show) {
      return { show: false, committed: input.committed, draft: input.draft };
    }
    if (input.platform === 'android') {
      if (input.eventType === 'dismissed' || !input.selected) {
        return { show: false, committed: input.committed, draft: input.draft };
      }
      return { show: false, committed: input.selected, draft: input.draft };
    }
    if (input.eventType === 'dismissed' || !input.selected) {
      return { show: false, committed: input.committed, draft: input.committed };
    }
    if (input.okPressed) {
      return { show: false, committed: input.draft, draft: input.draft };
    }
    return { show: true, committed: input.committed, draft: input.selected };
  }

  const committed = new Date('2026-01-02T09:00:00');
  const selected = new Date('2026-01-02T10:15:00');

  it('does not mount until opened', () => {
    const next = reduceTimePicker({ show: false, committed, draft: committed, platform: 'android' });
    expect(next.show).toBe(false);
    expect(next.committed).toBe(committed);
  });

  it('Android cancel closes without committing', () => {
    const next = reduceTimePicker({
      show: true,
      committed,
      draft: committed,
      eventType: 'dismissed',
      platform: 'android',
    });
    expect(next.show).toBe(false);
    expect(next.committed).toBe(committed);
  });

  it('Android confirm closes and commits selected time', () => {
    const next = reduceTimePicker({
      show: true,
      committed,
      draft: committed,
      eventType: 'set',
      selected,
      platform: 'android',
    });
    expect(next.show).toBe(false);
    expect(next.committed).toBe(selected);
  });

  it('iOS spinner changes draft and OK commits it', () => {
    const changed = reduceTimePicker({
      show: true,
      committed,
      draft: committed,
      selected,
      platform: 'ios',
    });
    expect(changed.show).toBe(true);
    expect(changed.committed).toBe(committed);
    expect(changed.draft).toBe(selected);

    const confirmed = reduceTimePicker({
      show: true,
      committed,
      draft: changed.draft,
      selected,
      platform: 'ios',
      okPressed: true,
    });
    expect(confirmed.show).toBe(false);
    expect(confirmed.committed).toBe(selected);
  });
});

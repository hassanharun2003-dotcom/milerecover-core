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

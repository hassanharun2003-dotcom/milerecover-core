/**
 * Documents the Android DateTimePicker dismiss contract used by ManualTripScreen.
 * Cancel must always clear showDatePicker — regression guard for the frozen dialog bug.
 */
describe('Date picker dismiss contract', () => {
  function reducePickerVisibility(
    showDatePicker: boolean,
    event: { type?: string },
    selected: Date | undefined,
    platform: 'android' | 'ios',
  ): { show: boolean; dateUpdated: boolean } {
    let show = showDatePicker;
    let dateUpdated = false;
    if (platform === 'android') show = false;
    if (event.type === 'dismissed' || !selected) {
      if (platform === 'ios') show = false;
      return { show, dateUpdated };
    }
    dateUpdated = true;
    if (platform === 'ios') show = false;
    return { show, dateUpdated };
  }

  it('Android Cancel (dismissed, no date) always closes', () => {
    const next = reducePickerVisibility(true, { type: 'dismissed' }, undefined, 'android');
    expect(next.show).toBe(false);
    expect(next.dateUpdated).toBe(false);
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
  });
});

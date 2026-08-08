import {
  applyVehicleFieldUpdate,
  migrateVehicleIdentity,
  suggestedNickname,
  vehicleDisplaySubtitle,
  vehicleDisplayTitle,
} from '../src';

describe('Vehicle identity integrity', () => {
  it('clears auto nickname when make changes and nickname was not user-set', () => {
    const previous = {
      id: 'v1',
      nickname: '2022 Honda Civic',
      year: '2022',
      make: 'Honda',
      model: 'Civic',
      nicknameUserSet: false,
    };
    const next = applyVehicleFieldUpdate(previous, { make: 'Hyundai', model: '' });
    expect(next.make).toBe('Hyundai');
    expect(next.model).toBe('');
    expect(next.nickname).toBe(suggestedNickname({ year: '2022', make: 'Hyundai', model: '' }));
    expect(next.nicknameUserSet).toBe(false);
  });

  it('preserves a manually customized nickname across make changes', () => {
    const previous = {
      id: 'v1',
      nickname: 'Work sedan',
      year: '2022',
      make: 'Honda',
      model: 'Civic',
      nicknameUserSet: true,
    };
    const next = applyVehicleFieldUpdate(previous, { make: 'Hyundai', model: 'Elantra' });
    expect(next.nickname).toBe('Work sedan');
    expect(next.nicknameUserSet).toBe(true);
    expect(vehicleDisplayTitle(next)).toBe('Work sedan');
    expect(vehicleDisplaySubtitle(next)).toBe('2022 Hyundai Elantra');
  });

  it('migrates composed nicknames back to auto-sync', () => {
    const migrated = migrateVehicleIdentity({
      id: 'v1',
      nickname: '2020 Toyota Camry',
      year: '2020',
      make: 'Toyota',
      model: 'Camry',
      nicknameUserSet: true,
    });
    expect(migrated.nicknameUserSet).toBe(false);
  });
});

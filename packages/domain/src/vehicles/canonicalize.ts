export interface VehicleIdentity {
  id: string;
  nickname: string;
  year: string;
  make: string;
  model: string;
  plate?: string;
  isPrimary?: boolean;
  /** True once the user explicitly edits nickname (stops auto-sync). */
  nicknameUserSet?: boolean;
}

/** Canonical display title — never contradicts make/model fields. */
export function vehicleDisplayTitle(vehicle: Pick<VehicleIdentity, 'nickname' | 'year' | 'make' | 'model'>): string {
  const nick = vehicle.nickname.trim();
  const composed = [vehicle.year, vehicle.make, vehicle.model].map((s) => s.trim()).filter(Boolean).join(' ');
  if (nick && nick !== composed) return nick;
  if (composed) return composed;
  if (nick) return nick;
  return 'My vehicle';
}

/** Subtitle under the title — year/make/model when nickname is the title. */
export function vehicleDisplaySubtitle(
  vehicle: Pick<VehicleIdentity, 'nickname' | 'year' | 'make' | 'model'>,
): string | null {
  const title = vehicleDisplayTitle(vehicle);
  const composed = [vehicle.year, vehicle.make, vehicle.model].map((s) => s.trim()).filter(Boolean).join(' ');
  if (!composed) return null;
  if (title === composed) return null;
  return composed;
}

/**
 * Suggest nickname from year/make/model only when the user has not locked a custom nickname.
 */
export function suggestedNickname(
  vehicle: Pick<VehicleIdentity, 'year' | 'make' | 'model'>,
): string {
  return [vehicle.year, vehicle.make, vehicle.model].map((s) => s.trim()).filter(Boolean).join(' ') || 'My vehicle';
}

/**
 * Apply field edits without corrupting an existing saved vehicle.
 * - Changing make/model updates those fields only
 * - Nickname auto-follows composed title until nicknameUserSet
 */
export function applyVehicleFieldUpdate(
  previous: VehicleIdentity,
  patch: Partial<Pick<VehicleIdentity, 'year' | 'make' | 'model' | 'plate' | 'nickname' | 'isPrimary'>>,
  options?: { nicknameEdited?: boolean },
): VehicleIdentity {
  const next: VehicleIdentity = {
    ...previous,
    year: patch.year ?? previous.year,
    make: patch.make ?? previous.make,
    model: patch.model ?? previous.model,
    plate: patch.plate ?? previous.plate,
    isPrimary: patch.isPrimary ?? previous.isPrimary,
  };

  if (options?.nicknameEdited || patch.nickname != null) {
    const nick = (patch.nickname ?? previous.nickname).trim();
    next.nickname = nick || suggestedNickname(next);
    next.nicknameUserSet = Boolean(nick) || previous.nicknameUserSet === true;
  } else if (!previous.nicknameUserSet) {
    next.nickname = suggestedNickname(next);
    next.nicknameUserSet = false;
  } else {
    next.nickname = previous.nickname;
    next.nicknameUserSet = true;
  }

  return next;
}

/** Repair impossible composites on load (e.g. nickname equals garbage composite). */
export function migrateVehicleIdentity(raw: Partial<VehicleIdentity> & { id: string }): VehicleIdentity {
  const year = (raw.year ?? '').trim();
  const make = (raw.make ?? '').trim();
  const model = (raw.model ?? '').trim();
  const composed = [year, make, model].filter(Boolean).join(' ');
  let nickname = (raw.nickname ?? '').trim();
  let nicknameUserSet = raw.nicknameUserSet === true;

  // If nickname was auto-filled as the composed string, treat as not user-set.
  if (nickname && composed && nickname === composed) {
    nicknameUserSet = false;
  }
  if (!nickname) {
    nickname = composed || 'My vehicle';
    nicknameUserSet = false;
  }

  return {
    id: raw.id,
    nickname,
    year,
    make,
    model,
    plate: (raw.plate ?? '').trim(),
    isPrimary: raw.isPrimary !== false,
    nicknameUserSet,
  };
}

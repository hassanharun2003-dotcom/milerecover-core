/** Native permission states mapped consistently across Android/iOS. */
export type PermissionState =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'not_determined';

export type OptionalPermissionState = PermissionState | 'not_applicable';

export interface PermissionSnapshot {
  location: PermissionState;
  backgroundLocation: OptionalPermissionState;
  motion: OptionalPermissionState;
  /** When true, OS may suspend background capture (Android battery opt). */
  batteryOptimizationRestricted: boolean;
}

export function mapLocationAuthorization(
  status: 'granted' | 'denied' | 'restricted' | 'not_determined'
): PermissionState {
  return status;
}

export function isAutomaticCapturePossible(snapshot: PermissionSnapshot): boolean {
  return snapshot.location === 'granted' && snapshot.backgroundLocation === 'granted';
}

export function permissionFixPriority(snapshot: PermissionSnapshot): string[] {
  const steps: string[] = [];
  if (snapshot.location !== 'granted') {
    steps.push('enable_location');
  }
  if (snapshot.backgroundLocation === 'denied' || snapshot.backgroundLocation === 'restricted') {
    steps.push('enable_background_location');
  }
  if (snapshot.motion === 'denied') {
    steps.push('enable_motion_optional');
  }
  if (snapshot.batteryOptimizationRestricted) {
    steps.push('disable_battery_optimization');
  }
  return steps;
}

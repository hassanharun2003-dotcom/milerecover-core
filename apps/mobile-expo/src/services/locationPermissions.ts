import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import type { PermissionSnapshot, PermissionState } from '@milerecover/domain';

function mapExpoStatus(status: Location.PermissionStatus, canAskAgain: boolean): PermissionState {
  if (status === Location.PermissionStatus.GRANTED) return 'granted';
  if (status === Location.PermissionStatus.DENIED) {
    return canAskAgain ? 'denied' : 'restricted';
  }
  return 'not_determined';
}

export async function readLocationPermissionSnapshot(
  previous: PermissionSnapshot,
): Promise<PermissionSnapshot> {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    return {
      ...previous,
      location: mapExpoStatus(foreground.status, foreground.canAskAgain),
      backgroundLocation: mapExpoStatus(background.status, background.canAskAgain),
    };
  } catch {
    return previous;
  }
}

export async function requestForegroundLocation(): Promise<PermissionSnapshot> {
  const previous: PermissionSnapshot = {
    location: 'not_determined',
    backgroundLocation: 'not_determined',
    motion: Platform.OS === 'ios' ? 'not_determined' : 'not_applicable',
    batteryOptimizationRestricted: false,
  };
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    return {
      ...previous,
      location: mapExpoStatus(foreground.status, foreground.canAskAgain),
      backgroundLocation: mapExpoStatus(background.status, background.canAskAgain),
    };
  } catch {
    return { ...previous, location: 'denied' };
  }
}

export async function requestBackgroundLocation(
  previous: PermissionSnapshot,
): Promise<PermissionSnapshot> {
  if (previous.location !== 'granted') {
    return previous;
  }
  try {
    const background = await Location.requestBackgroundPermissionsAsync();
    return {
      ...previous,
      backgroundLocation: mapExpoStatus(background.status, background.canAskAgain),
    };
  } catch {
    return { ...previous, backgroundLocation: 'denied' };
  }
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Tracking engine is not shipped in this RC — keep the boundary honest. */
export const AUTOMATIC_CAPTURE_AVAILABLE = false;

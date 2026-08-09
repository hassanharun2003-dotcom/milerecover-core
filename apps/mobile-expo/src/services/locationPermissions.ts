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

/**
 * Best-effort battery optimization detection.
 * Expo does not expose a first-class API; we keep false unless a native probe is available.
 * Deep-link still helps users open the right settings screen.
 */
async function probeBatteryOptimizationRestricted(): Promise<boolean> {
  // Without a dedicated native module, do not invent a restriction.
  // Android education + deep-link remains available via openBatteryOptimizationSettings.
  return false;
}

export async function readLocationPermissionSnapshot(
  previous: PermissionSnapshot,
): Promise<PermissionSnapshot> {
  try {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();
    const batteryOptimizationRestricted = await probeBatteryOptimizationRestricted();
    let locationServicesEnabled = true;
    try {
      locationServicesEnabled = await Location.hasServicesEnabledAsync();
    } catch {
      locationServicesEnabled = true;
    }
    return {
      ...previous,
      location: locationServicesEnabled
        ? mapExpoStatus(foreground.status, foreground.canAskAgain)
        : 'denied',
      backgroundLocation: mapExpoStatus(background.status, background.canAskAgain),
      batteryOptimizationRestricted,
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

/** Android: open battery optimization / app details so the user can exempt MileRecover. */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
      return;
    } catch {
      // fall through
    }
    try {
      await Linking.sendIntent('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS');
      return;
    } catch {
      // fall through to generic settings
    }
  }
  await Linking.openSettings();
}

/**
 * Automatic capture is implemented via expo-location + expo-task-manager.
 * Free includes up to 40 auto trips/month; Plus/Pro are unlimited when entitled.
 */
export const AUTOMATIC_CAPTURE_AVAILABLE = true;

import * as Location from 'expo-location';

export type PlaceLabel = string | null;

function formatPlacemark(place: Location.LocationGeocodedAddress): PlaceLabel {
  const locality = place.city || place.subregion || place.district || place.name;
  const region = place.region || place.postalCode;
  if (locality && region) return `${locality}, ${region}`;
  if (locality) return locality;
  if (place.name) return place.name;
  return null;
}

/**
 * Best-effort reverse geocode. Never invents a place; returns null on failure/offline.
 * Does not block trip creation — callers should apply labels asynchronously.
 */
export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number,
): Promise<PlaceLabel> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const first = results[0];
    if (!first) return null;
    return formatPlacemark(first);
  } catch {
    return null;
  }
}

export async function enrichTripEndpoints(input: {
  start: { latitude: number; longitude: number } | null;
  end: { latitude: number; longitude: number } | null;
}): Promise<{ startLabel: PlaceLabel; endLabel: PlaceLabel }> {
  const [startLabel, endLabel] = await Promise.all([
    input.start ? reverseGeocodeLabel(input.start.latitude, input.start.longitude) : Promise.resolve(null),
    input.end ? reverseGeocodeLabel(input.end.latitude, input.end.longitude) : Promise.resolve(null),
  ]);
  return { startLabel, endLabel };
}

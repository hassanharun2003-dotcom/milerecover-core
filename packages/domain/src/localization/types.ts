/**
 * International foundation for MileRecover.
 * Canonical distance storage remains miles on TripRecord.distanceMiles.
 * Convert only at display/export boundaries.
 */

export type CountryCode = 'US' | 'CA' | 'GB' | 'AU' | 'OTHER';

export type DistanceUnit = 'mi' | 'km';

export type CurrencyCode = 'USD' | 'CAD' | 'GBP' | 'AUD' | 'EUR' | 'OTHER';

export type RateSource = 'official_preset' | 'employer_provided' | 'user_custom';

export interface MileageRatePeriod {
  id: string;
  /** Inclusive start (unix ms). */
  effectiveFrom: number;
  /** Exclusive end (unix ms). Null = open-ended. */
  effectiveTo: number | null;
  /** Always stored as cents per mile for historical stability. */
  centsPerMile: number;
  source: RateSource;
  label: string;
  currencyCode: CurrencyCode;
}

export interface LocaleProfile {
  countryCode: CountryCode;
  /** Display name — never used as a key. */
  countryDisplayName: string;
  distanceUnit: DistanceUnit;
  currencyCode: CurrencyCode;
  /** BCP-47 locale hint for dates/numbers. */
  localeTag: string;
  /** Report wording mode. */
  reportTone: 'us_tax_record' | 'reimbursement_record' | 'generic_mileage_record';
  rates: MileageRatePeriod[];
  /**
   * When true, country/unit changed and the active rate needs user review.
   * Historical trip snapshots stay untouched.
   */
  activeRateNeedsReview?: boolean;
}

export interface CountryPreset {
  countryCode: Exclude<CountryCode, 'OTHER'>;
  countryDisplayName: string;
  distanceUnit: DistanceUnit;
  currencyCode: CurrencyCode;
  localeTag: string;
  reportTone: LocaleProfile['reportTone'];
  /** Default cents-per-mile preset (user-editable; not legal advice). */
  defaultCentsPerMile: number;
  defaultRateLabel: string;
}

export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    countryCode: 'US',
    countryDisplayName: 'United States',
    distanceUnit: 'mi',
    currencyCode: 'USD',
    localeTag: 'en-US',
    reportTone: 'us_tax_record',
    defaultCentsPerMile: 70,
    defaultRateLabel: 'Custom mileage rate',
  },
  {
    countryCode: 'CA',
    countryDisplayName: 'Canada',
    distanceUnit: 'km',
    currencyCode: 'CAD',
    localeTag: 'en-CA',
    reportTone: 'reimbursement_record',
    defaultCentsPerMile: 43, // ≈ CAD/km converted at setup; stored as ¢/mi
    defaultRateLabel: 'Custom reimbursement rate',
  },
  {
    countryCode: 'GB',
    countryDisplayName: 'United Kingdom',
    distanceUnit: 'mi',
    currencyCode: 'GBP',
    localeTag: 'en-GB',
    reportTone: 'reimbursement_record',
    defaultCentsPerMile: 45,
    defaultRateLabel: 'Custom reimbursement rate',
  },
  {
    countryCode: 'AU',
    countryDisplayName: 'Australia',
    distanceUnit: 'km',
    currencyCode: 'AUD',
    localeTag: 'en-AU',
    reportTone: 'reimbursement_record',
    defaultCentsPerMile: 55,
    defaultRateLabel: 'Custom reimbursement rate',
  },
];

export const OTHER_COUNTRY_OPTION = {
  countryCode: 'OTHER' as const,
  countryDisplayName: 'Other country',
};

/** Miles ↔ km at display boundary only. */
export const KM_PER_MILE = 1.609344;

export function milesToDisplay(miles: number, unit: DistanceUnit): number {
  if (!Number.isFinite(miles)) return 0;
  return unit === 'km' ? miles * KM_PER_MILE : miles;
}

export function displayToMiles(value: number, unit: DistanceUnit): number {
  if (!Number.isFinite(value)) return 0;
  return unit === 'km' ? value / KM_PER_MILE : value;
}

export function formatDistance(
  miles: number,
  unit: DistanceUnit,
  localeTag = 'en-US',
  fractionDigits = 1,
): string {
  const value = milesToDisplay(miles, unit);
  const formatted = value.toLocaleString(localeTag, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return `${formatted} ${unit}`;
}

export function formatCurrencyCents(
  cents: number,
  currencyCode: CurrencyCode,
  localeTag = 'en-US',
): string {
  if (currencyCode === 'OTHER') {
    const amount = (cents / 100).toLocaleString(localeTag, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount;
  }
  try {
    return (cents / 100).toLocaleString(localeTag, {
      style: 'currency',
      currency: currencyCode,
    });
  } catch {
    return `${(cents / 100).toFixed(2)} ${currencyCode}`;
  }
}

/** Estimated value — always labeled as estimate unless caller confirms reimbursement. */
export function estimatedValueCents(miles: number, centsPerMile: number | null): number | null {
  if (centsPerMile == null || !Number.isFinite(miles) || miles < 0) return null;
  return Math.round(miles * centsPerMile);
}

export function rateForTimestamp(
  rates: MileageRatePeriod[],
  at: number,
): MileageRatePeriod | null {
  const applicable = rates
    .filter((rate) => rate.effectiveFrom <= at && (rate.effectiveTo == null || at < rate.effectiveTo))
    .sort((a, b) => b.effectiveFrom - a.effectiveFrom);
  return applicable[0] ?? null;
}

export function createDefaultRatePeriod(
  preset: Pick<CountryPreset, 'defaultCentsPerMile' | 'defaultRateLabel' | 'currencyCode'>,
  now = Date.now(),
): MileageRatePeriod {
  return {
    id: `rate-${now}`,
    effectiveFrom: now,
    effectiveTo: null,
    centsPerMile: preset.defaultCentsPerMile,
    source: 'user_custom',
    label: preset.defaultRateLabel,
    currencyCode: preset.currencyCode,
  };
}

export function localeProfileFromCountry(
  countryCode: CountryCode,
  options?: {
    distanceUnit?: DistanceUnit;
    currencyCode?: CurrencyCode;
    centsPerMile?: number;
    now?: number;
  },
): LocaleProfile {
  const now = options?.now ?? Date.now();
  if (countryCode === 'OTHER') {
    const distanceUnit = options?.distanceUnit ?? 'mi';
    const currencyCode = options?.currencyCode ?? 'OTHER';
    const centsPerMile = options?.centsPerMile ?? 0;
    return {
      countryCode: 'OTHER',
      countryDisplayName: OTHER_COUNTRY_OPTION.countryDisplayName,
      distanceUnit,
      currencyCode,
      localeTag: 'en',
      reportTone: 'generic_mileage_record',
      rates:
        centsPerMile > 0
          ? [
              {
                id: `rate-other-${now}`,
                effectiveFrom: now,
                effectiveTo: null,
                centsPerMile,
                source: 'user_custom',
                label: 'Custom reimbursement rate',
                currencyCode,
              },
            ]
          : [],
    };
  }
  const preset = COUNTRY_PRESETS.find((item) => item.countryCode === countryCode)!;
  return {
    countryCode: preset.countryCode,
    countryDisplayName: preset.countryDisplayName,
    distanceUnit: options?.distanceUnit ?? preset.distanceUnit,
    currencyCode: options?.currencyCode ?? preset.currencyCode,
    localeTag: preset.localeTag,
    reportTone: preset.reportTone,
    rates: [
      createDefaultRatePeriod(
        {
          defaultCentsPerMile: options?.centsPerMile ?? preset.defaultCentsPerMile,
          defaultRateLabel: preset.defaultRateLabel,
          currencyCode: options?.currencyCode ?? preset.currencyCode,
        },
        now,
      ),
    ],
  };
}

/** Map device locale tag → recommended country (user may change). */
export function recommendCountryFromLocale(localeTag: string | null | undefined): CountryCode {
  const tag = (localeTag ?? '').toLowerCase();
  if (tag.includes('-us') || tag === 'en-us' || tag.endsWith('_us')) return 'US';
  if (tag.includes('-ca') || tag.endsWith('_ca') || tag.startsWith('fr-ca')) return 'CA';
  if (tag.includes('-gb') || tag.includes('-uk') || tag.endsWith('_gb')) return 'GB';
  if (tag.includes('-au') || tag.endsWith('_au')) return 'AU';
  if (tag.startsWith('en-us')) return 'US';
  return 'US';
}

export function migrateLocaleProfile(raw: unknown, now = Date.now()): LocaleProfile {
  if (raw && typeof raw === 'object') {
    const candidate = raw as Partial<LocaleProfile>;
    if (
      candidate.countryCode === 'US' ||
      candidate.countryCode === 'CA' ||
      candidate.countryCode === 'GB' ||
      candidate.countryCode === 'AU' ||
      candidate.countryCode === 'OTHER'
    ) {
      const base = localeProfileFromCountry(candidate.countryCode, {
        distanceUnit: candidate.distanceUnit,
        currencyCode: candidate.currencyCode,
        now,
      });
      return {
        ...base,
        countryDisplayName: candidate.countryDisplayName ?? base.countryDisplayName,
        rates: Array.isArray(candidate.rates) && candidate.rates.length > 0 ? candidate.rates : base.rates,
        localeTag: candidate.localeTag ?? base.localeTag,
        reportTone: candidate.reportTone ?? base.reportTone,
      };
    }
  }
  return localeProfileFromCountry('US', { now });
}

export function reportTitleForTone(
  tone: LocaleProfile['reportTone'],
  periodLabel: string,
): string {
  switch (tone) {
    case 'us_tax_record':
      return `Work mileage report · ${periodLabel}`;
    case 'reimbursement_record':
      return `Mileage reimbursement record · ${periodLabel}`;
    default:
      return `Mileage record · ${periodLabel}`;
  }
}

/** True when an existing rate is not suitable after a country/unit change. */
export function rateNeedsReviewAfterLocaleChange(
  previous: Pick<LocaleProfile, 'countryCode' | 'distanceUnit' | 'currencyCode' | 'rates'>,
  next: Pick<LocaleProfile, 'countryCode' | 'distanceUnit' | 'currencyCode'>,
): boolean {
  if (previous.countryCode !== next.countryCode) return true;
  if (previous.distanceUnit !== next.distanceUnit) return true;
  if (previous.currencyCode !== next.currencyCode) return true;
  return false;
}

/**
 * Customer-facing rate label. Never show “¢/mi stored” as the active Canadian km rate.
 * Internal storage remains cents-per-mile.
 */
export function formatActiveRateLabel(
  profile: Pick<LocaleProfile, 'distanceUnit' | 'currencyCode' | 'rates' | 'activeRateNeedsReview' | 'localeTag'>,
  at = Date.now(),
): string {
  if (profile.activeRateNeedsReview) return 'Review mileage rate';
  const rate = rateForTimestamp(profile.rates, at);
  if (!rate || !(rate.centsPerMile > 0)) return 'Not set';
  if (profile.distanceUnit === 'km') {
    const centsPerKm = Math.round(rate.centsPerMile / KM_PER_MILE);
    return `${centsPerKm}¢/km · ${rate.currencyCode}`;
  }
  return `${rate.centsPerMile}¢/mi · ${rate.currencyCode}`;
}

export function createTripRateSnapshot(
  profile: LocaleProfile,
  at = Date.now(),
): {
  centsPerMile: number | null;
  currencyCode: string;
  distanceUnit: DistanceUnit;
  countryCode: string;
  effectiveAt: number;
  label: string | null;
} {
  const rate = rateForTimestamp(profile.rates, at);
  return {
    centsPerMile: rate?.centsPerMile ?? null,
    currencyCode: profile.currencyCode,
    distanceUnit: profile.distanceUnit,
    countryCode: profile.countryCode,
    effectiveAt: at,
    label: rate?.label ?? null,
  };
}

export function reportDisclaimerForTone(tone: LocaleProfile['reportTone']): string {
  switch (tone) {
    case 'us_tax_record':
      return 'For your records. Not tax or legal advice. Estimated values use your configured rate.';
    case 'reimbursement_record':
      return 'For your records. Not compliance advice. Estimated values use your configured rate.';
    default:
      return 'Mileage record using your custom units and rate. Not compliance advice.';
  }
}

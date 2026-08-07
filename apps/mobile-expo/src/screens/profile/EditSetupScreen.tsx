import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { spacing } from '@milerecover/config';
import {
  formatActiveRateLabel,
  localeProfileFromCountry,
  rateForTimestamp,
  rateNeedsReviewAfterLocaleChange,
  type CountryCode,
  type CurrencyCode,
  type DistanceUnit,
} from '@milerecover/domain';
import {
  FormField,
  PrimaryButton,
  SelectionCard,
  SoftPanel,
  StackScrollScreen,
  StatusCard,
  TertiaryButton,
  text,
  useAppTheme,
} from '../../design-system';
import { CountryFlag } from '../../components/CountryFlag';
import { useProduct } from '../../product/ProductContext';
import {
  COUNTRY_OPTIONS,
  DRIVING_PATTERN_OPTIONS,
  PAIN_POINT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  type PainPoint,
} from '../../product/types';

const KM_PER_MILE = 1.609344;

function centsPerMileToDollars(centsPerMile: number, unit: DistanceUnit): string {
  if (!(centsPerMile > 0)) return '';
  const centsPerUnit = unit === 'km' ? centsPerMile / KM_PER_MILE : centsPerMile;
  return (centsPerUnit / 100).toFixed(2);
}

function dollarsToCentsPerMile(dollarsText: string, unit: DistanceUnit): number | undefined {
  const dollars = Number.parseFloat(dollarsText);
  if (!Number.isFinite(dollars) || dollars <= 0) return undefined;
  const centsPerUnit = Math.round(dollars * 100);
  return unit === 'km' ? Math.round(centsPerUnit * KM_PER_MILE) : centsPerUnit;
}

export function EditSetupScreen() {
  const { palette } = useAppTheme();
  const {
    product,
    setPreferredName,
    setPrimaryGoal,
    setSelectedPainPoints,
    setDrivingType,
    setLocaleProfile,
  } = useProduct();
  const [name, setName] = useState(product.preferredName ?? '');
  const [savedName, setSavedName] = useState(false);
  const [country, setCountry] = useState<CountryCode>(product.localeProfile.countryCode);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [unit, setUnit] = useState<DistanceUnit>(product.localeProfile.distanceUnit);
  const [currency, setCurrency] = useState<CurrencyCode>(product.localeProfile.currencyCode);
  const [moreOpen, setMoreOpen] = useState(false);
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((option) => option.label.toLowerCase().includes(q));
  }, [countryQuery]);
  const currentCountryLabel =
    COUNTRY_OPTIONS.find((option) => option.id === country)?.label ?? 'Other country';
  const currentRate = rateForTimestamp(product.localeProfile.rates, Date.now());
  const [rateDraft, setRateDraft] = useState(
    currentRate?.centsPerMile != null
      ? centsPerMileToDollars(currentRate.centsPerMile, product.localeProfile.distanceUnit)
      : '',
  );
  const [savedLocale, setSavedLocale] = useState(false);
  const activeRateLabel = formatActiveRateLabel(product.localeProfile);
  const needsRateReview = product.localeProfile.activeRateNeedsReview === true;

  const togglePain = (pain: PainPoint) => {
    const next = product.selectedPainPoints.includes(pain)
      ? product.selectedPainPoints.filter((item) => item !== pain)
      : [...product.selectedPainPoints, pain];
    setSelectedPainPoints(next);
  };

  const applyLocaleProfile = (
    base: ReturnType<typeof localeProfileFromCountry>,
    options: { centsPerMile?: number; activeRateNeedsReview?: boolean },
  ) => {
    const now = Date.now();
    const priorRates = product.localeProfile.rates.map((rate) =>
      rate.effectiveTo == null && rate.effectiveFrom < now ? { ...rate, effectiveTo: now } : rate,
    );
    const cents = options.centsPerMile;
    const nextRates =
      cents != null && Number.isFinite(cents) && cents > 0
        ? [
            ...priorRates.filter((rate) => rate.id !== base.rates[0]?.id),
            ...(base.rates[0]
              ? [
                  {
                    ...base.rates[0],
                    source: 'user_custom' as const,
                    centsPerMile: cents,
                    currencyCode: country === 'OTHER' ? currency : base.currencyCode,
                  },
                ]
              : []),
          ]
        : priorRates.length
          ? priorRates
          : base.rates;

    setLocaleProfile({
      ...base,
      distanceUnit: country === 'OTHER' ? unit : base.distanceUnit,
      currencyCode: country === 'OTHER' ? currency : base.currencyCode,
      rates: nextRates,
      activeRateNeedsReview: options.activeRateNeedsReview ?? false,
    });
    setSavedLocale(true);
  };

  const saveLocale = () => {
    const cents = dollarsToCentsPerMile(rateDraft, unit);
    const now = Date.now();
    const base = localeProfileFromCountry(country, {
      distanceUnit: country === 'OTHER' ? unit : undefined,
      currencyCode: country === 'OTHER' ? currency : undefined,
      centsPerMile: cents,
      now,
    });
    const localeChanged = rateNeedsReviewAfterLocaleChange(product.localeProfile, {
      countryCode: base.countryCode,
      distanceUnit: country === 'OTHER' ? unit : base.distanceUnit,
      currencyCode: country === 'OTHER' ? currency : base.currencyCode,
    });
    applyLocaleProfile(base, {
      centsPerMile: cents,
      activeRateNeedsReview: localeChanged ? true : false,
    });
  };

  const useRecommendedRate = () => {
    const recommended = localeProfileFromCountry(country, {
      distanceUnit: country === 'OTHER' ? unit : undefined,
      currencyCode: country === 'OTHER' ? currency : undefined,
    });
    const cents = recommended.rates[0]?.centsPerMile;
    if (cents != null) setRateDraft(centsPerMileToDollars(cents, recommended.distanceUnit));
    applyLocaleProfile(recommended, {
      centsPerMile: cents,
      activeRateNeedsReview: false,
    });
  };

  const saveCustomRate = () => {
    const cents = dollarsToCentsPerMile(rateDraft, unit);
    if (cents == null) return;
    const base = localeProfileFromCountry(country, {
      distanceUnit: country === 'OTHER' ? unit : undefined,
      currencyCode: country === 'OTHER' ? currency : undefined,
    });
    applyLocaleProfile(base, { centsPerMile: cents, activeRateNeedsReview: false });
  };

  const clearValueEstimate = () => {
    const now = Date.now();
    const base = localeProfileFromCountry(country, {
      distanceUnit: country === 'OTHER' ? unit : undefined,
      currencyCode: country === 'OTHER' ? currency : undefined,
      now,
    });
    const closedRates = product.localeProfile.rates.map((rate) =>
      rate.effectiveTo == null && rate.effectiveFrom < now ? { ...rate, effectiveTo: now } : rate,
    );
    setLocaleProfile({
      ...base,
      distanceUnit: country === 'OTHER' ? unit : base.distanceUnit,
      currencyCode: country === 'OTHER' ? currency : base.currencyCode,
      rates: closedRates,
      activeRateNeedsReview: false,
    });
    setRateDraft('');
    setSavedLocale(true);
  };

  const changeUnit = (next: DistanceUnit) => {
    if (next === unit) return;
    const dollars = Number.parseFloat(rateDraft);
    if (Number.isFinite(dollars) && dollars > 0) {
      const converted = next === 'km' ? dollars / KM_PER_MILE : dollars * KM_PER_MILE;
      setRateDraft(converted.toFixed(2));
    }
    setUnit(next);
    setSavedLocale(false);
  };

  return (
    <StackScrollScreen>
      <Text style={[text.subtitle, { marginBottom: spacing.sm }]}>Personalization</Text>
      <FormField label="Preferred name" value={name} onChangeText={setName} placeholder="First name" />
      <PrimaryButton
        label={savedName ? 'Name saved' : 'Save name'}
        onPress={() => {
          setPreferredName(name.trim() || null);
          setSavedName(true);
        }}
      />

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        Region & rate
      </Text>
      <SoftPanel>
        <Text style={text.caption}>Active mileage rate</Text>
        <Text style={[text.subtitle, { marginTop: spacing.xs }]}>{activeRateLabel}</Text>
      </SoftPanel>
      {needsRateReview ? (
        <StatusCard
          variant="warning"
          title="Review mileage rate"
          body="Your country or units changed. Choose how to handle value estimates going forward."
          emphasis="subtle"
        />
      ) : null}
      {needsRateReview ? (
        <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
          <PrimaryButton label="Use recommended rate" onPress={useRecommendedRate} />
          <PrimaryButton label="Save custom rate below" onPress={saveCustomRate} />
          <TertiaryButton label="Clear value estimate" onPress={clearValueEstimate} />
        </View>
      ) : null}

      <Pressable
        onPress={() => setCountryOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityLabel={`Country ${currentCountryLabel}`}
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderColor: palette.border.default,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: palette.background.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CountryFlag code={country} size={20} />
          <Text style={text.body}>{currentCountryLabel}</Text>
        </View>
        <Text style={{ color: palette.text.secondary }}>{countryOpen ? '▴' : '▾'}</Text>
      </Pressable>

      {countryOpen ? (
        <>
          <FormField
            label="Search countries"
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search United States, Canada…"
            accessibilityLabel="Search countries"
          />
          {filteredCountries.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              body={option.id === 'OTHER' ? 'Custom units — no local tax rules claimed' : undefined}
              selected={country === option.id}
              leading={<CountryFlag code={option.id} size={20} />}
              onPress={() => {
                setCountry(option.id);
                setSavedLocale(false);
                setCountryOpen(false);
                if (option.id !== 'OTHER') {
                  const preset = localeProfileFromCountry(option.id);
                  setUnit(preset.distanceUnit);
                  setCurrency(preset.currencyCode);
                  if (preset.rates[0]?.centsPerMile != null) {
                    setRateDraft(
                      centsPerMileToDollars(preset.rates[0].centsPerMile, preset.distanceUnit),
                    );
                  }
                }
              }}
            />
          ))}
        </>
      ) : null}

      {country === 'OTHER' ? (
        <SoftPanel>
          <SelectionCard title="Miles" selected={unit === 'mi'} onPress={() => changeUnit('mi')} />
          <SelectionCard
            title="Kilometers"
            selected={unit === 'km'}
            onPress={() => changeUnit('km')}
          />
          <FormField
            label="Currency code"
            value={currency === 'OTHER' ? '' : currency}
            onChangeText={(value) => {
              const next = value.trim().toUpperCase();
              if (!next) setCurrency('OTHER');
              else if (['USD', 'CAD', 'GBP', 'AUD', 'EUR'].includes(next)) {
                setCurrency(next as CurrencyCode);
              }
            }}
            placeholder="e.g. EUR"
            autoCapitalize="characters"
          />
        </SoftPanel>
      ) : null}

      <FormField
        label={unit === 'km' ? 'Mileage rate ($ per km)' : 'Mileage rate ($ per mile)'}
        value={rateDraft}
        onChangeText={(value) => {
          setRateDraft(value);
          setSavedLocale(false);
        }}
        placeholder="1.80"
        keyboardType="decimal-pad"
      />
      <Text style={[text.caption, { marginBottom: spacing.sm }]}>
        Enter a normal amount like 1.80 — not cents.
      </Text>
      <PrimaryButton
        label={savedLocale ? 'Region settings saved' : 'Save region settings'}
        onPress={saveLocale}
      />

      <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Work type</Text>
      {PRIMARY_GOAL_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          title={option.label}
          body={option.body}
          selected={product.primaryGoal === option.id}
          onPress={() => setPrimaryGoal(option.id)}
        />
      ))}

      <TertiaryButton
        label={moreOpen ? 'Hide recovery preferences' : 'More setup (optional)'}
        onPress={() => setMoreOpen((open) => !open)}
      />

      {moreOpen ? (
        <>
          <Text style={[text.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
            What gets in the way
          </Text>
          {PAIN_POINT_OPTIONS.map((option) => (
            <SelectionCard
              key={option.id}
              title={option.label}
              selected={product.selectedPainPoints.includes(option.id)}
              onPress={() => togglePain(option.id)}
            />
          ))}

          <Text style={[text.subtitle, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            Driving pattern
          </Text>
          <View style={{ marginBottom: spacing.lg }}>
            {DRIVING_PATTERN_OPTIONS.map((option) => (
              <SelectionCard
                key={option.id}
                title={option.label}
                selected={product.drivingType === option.id}
                onPress={() => setDrivingType(option.id)}
              />
            ))}
          </View>
        </>
      ) : null}
    </StackScrollScreen>
  );
}
